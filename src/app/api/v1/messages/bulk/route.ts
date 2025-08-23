import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// API Key authentication middleware
async function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' }
  }

  const apiKey = authHeader.replace('Bearer ', '')
  
  try {
    const keyResult = await pool.query(`
      SELECT ak.id, ak."userId", ak.permissions, ak."isActive", ak."expiresAt", ak."neverExpires"
      FROM api_keys ak
      WHERE ak.key = $1 AND ak."isActive" = true
    `, [apiKey])

    if (keyResult.rows.length === 0) {
      return { valid: false, error: 'Invalid or inactive API key' }
    }

    const key = keyResult.rows[0]

    // Check expiration
    if (!key.neverExpires && key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return { valid: false, error: 'API key has expired' }
    }

    // Check permissions
    const permissions = typeof key.permissions === 'string' 
      ? JSON.parse(key.permissions) 
      : key.permissions
    
    if (!permissions.includes('messages.send') && !permissions.includes('*')) {
      return { valid: false, error: 'Insufficient permissions for sending messages' }
    }

    // Update last used timestamp
    await pool.query(`
      UPDATE api_keys SET "lastUsedAt" = CURRENT_TIMESTAMP WHERE id = $1
    `, [key.id])

    return { 
      valid: true, 
      userId: key.userId,
      apiKeyId: key.id,
      permissions 
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return { valid: false, error: 'Authentication failed' }
  }
}

/**
 * @swagger
 * /api/v1/messages/bulk:
 *   post:
 *     tags:
 *       - Messages API
 *     summary: Send bulk WhatsApp messages
 *     description: Send messages to multiple recipients via message queue system
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceName
 *               - messages
 *             properties:
 *               deviceName:
 *                 type: string
 *                 description: WhatsApp device name to send from
 *                 example: "2_bizflashindevice202508210325_1755746719393"
 *               messages:
 *                 type: array
 *                 description: Array of messages to send
 *                 items:
 *                   type: object
 *                   required:
 *                     - to
 *                     - message
 *                   properties:
 *                     to:
 *                       type: string
 *                       description: Recipient phone number
 *                       example: "9960589622"
 *                     message:
 *                       type: string
 *                       description: Message content
 *                       example: "Hello from bulk API!"
 *                     priority:
 *                       type: integer
 *                       description: Message priority (0=normal, 1=high, 2=urgent)
 *                       default: 0
 *                     scheduledAt:
 *                       type: string
 *                       format: date-time
 *                       description: Optional scheduled delivery time
 *               batchId:
 *                 type: string
 *                 description: Optional batch identifier for tracking
 *               delay:
 *                 type: integer
 *                 description: Delay between messages in milliseconds
 *                 default: 1000
 *     responses:
 *       200:
 *         description: Bulk messages queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     batchId:
 *                       type: string
 *                     totalMessages:
 *                       type: integer
 *                     queuedMessages:
 *                       type: integer
 *                     failedMessages:
 *                       type: integer
 *                     estimatedCompletionTime:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid API key
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Device not found
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const auth = await validateApiKey(request)
    if (!auth.valid) {
      return NextResponse.json({ 
        success: false,
        error: auth.error 
      }, { status: auth.error.includes('permissions') ? 403 : 401 })
    }

    // Parse request body (supports both JSON and form-urlencoded)
    const contentType = request.headers.get('content-type') || ''
    let body
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      body = {}
      for (const [key, value] of formData) {
        if (key === 'messages') {
          try {
            body[key] = JSON.parse(value.toString())
          } catch {
            body[key] = value.toString()
          }
        } else {
          body[key] = value.toString()
        }
      }
    } else {
      body = await request.json()
    }
    
    const { deviceName, messages, batchId, delay = 1000 } = body

    // Validate required fields
    if (!deviceName || !messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: deviceName, messages (array)',
        provided: Object.keys(body)
      }, { status: 400 })
    }

    // Validate messages array
    const invalidMessages = messages.filter((msg, index) => {
      if (!msg.to || !msg.message) {
        return true
      }
      return false
    })

    if (invalidMessages.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid message format: each message must have "to" and "message" fields',
        invalidCount: invalidMessages.length
      }, { status: 400 })
    }

    // Check message limits (max 1000 per bulk request)
    if (messages.length > 1000) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 1000 messages allowed per bulk request',
        provided: messages.length
      }, { status: 400 })
    }

    // Verify device belongs to user
    const deviceResult = await pool.query(`
      SELECT wi.id, wi.name, wi.status, wi."serverId"
      FROM whatsapp_instances wi
      WHERE wi.name = $1 AND wi."userId" = $2::text
      LIMIT 1
    `, [deviceName, auth.userId])

    if (deviceResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Device not found or does not belong to your account',
        deviceName
      }, { status: 404 })
    }

    const device = deviceResult.rows[0]

    // Check subscription limits
    const packageResult = await pool.query(`
      SELECT cp.id, cp."messagesUsed", cp."endDate", p."messageLimit"
      FROM customer_packages cp
      JOIN packages p ON cp."packageId" = p.id
      WHERE cp."userId" = $1::text AND cp."isActive" = true AND cp."endDate" > NOW()
      ORDER BY cp."createdAt" DESC
      LIMIT 1
    `, [auth.userId])

    if (packageResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription package found'
      }, { status: 403 })
    }

    const subscription = packageResult.rows[0]
    const remainingMessages = subscription.messageLimit - subscription.messagesUsed
    
    if (remainingMessages < messages.length) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient message credits',
        available: remainingMessages,
        requested: messages.length
      }, { status: 403 })
    }

    // Generate batch ID if not provided
    const finalBatchId = batchId || `bulk_${Date.now()}_${auth.userId}`
    
    // Queue all messages
    let queuedCount = 0
    let failedCount = 0
    const queueResults = []

    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i]
        try {
          // Calculate scheduled time with delay
          const baseTime = msg.scheduledAt ? new Date(msg.scheduledAt) : new Date()
          const scheduledTime = new Date(baseTime.getTime() + (i * delay))

          const queueResult = await client.query(`
            INSERT INTO message_queue (
              id, "instanceId", "toNumber", message, priority, scheduled, 
              status, "createdAt", "updatedAt", metadata
            )
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $6)
            RETURNING id
          `, [
            device.id,
            msg.to,
            msg.message,
            msg.priority || 0,
            scheduledTime,
            JSON.stringify({
              batchId: finalBatchId,
              deviceName,
              serverId: device.serverId,
              apiKeyId: auth.apiKeyId,
              via: 'bulk_api',
              originalIndex: i
            })
          ])

          queueResults.push({
            queueId: queueResult.rows[0].id,
            to: msg.to,
            scheduledAt: scheduledTime.toISOString(),
            status: 'queued'
          })
          queuedCount++
        } catch (error) {
          console.error(`Failed to queue message ${i}:`, error)
          failedCount++
          queueResults.push({
            to: msg.to,
            status: 'failed',
            error: error.message
          })
        }
      }

      // Update subscription message count
      if (queuedCount > 0) {
        await client.query(`
          UPDATE customer_packages 
          SET "messagesUsed" = "messagesUsed" + $1,
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [queuedCount, subscription.id])
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

    // Log API usage
    try {
      await pool.query(`
        INSERT INTO api_logs (id, "apiKeyId", endpoint, method, "statusCode", "timestamp", request)
        VALUES (gen_random_uuid(), $1, '/api/v1/messages/bulk', 'POST', 200, CURRENT_TIMESTAMP, $2)
      `, [auth.apiKeyId, JSON.stringify({ batchId: finalBatchId, messageCount: messages.length })])
    } catch (logError) {
      console.warn('Failed to log API usage:', logError)
    }

    // Calculate estimated completion time
    const estimatedDuration = (messages.length * delay) + (messages.length * 2000) // 2s per message processing time
    const estimatedCompletion = new Date(Date.now() + estimatedDuration)

    return NextResponse.json({
      success: true,
      data: {
        batchId: finalBatchId,
        totalMessages: messages.length,
        queuedMessages: queuedCount,
        failedMessages: failedCount,
        deviceName,
        deviceStatus: device.status,
        estimatedCompletionTime: estimatedCompletion.toISOString(),
        remainingCredits: remainingMessages - queuedCount,
        results: process.env.NODE_ENV === 'development' ? queueResults : undefined
      },
      message: `Bulk message batch queued: ${queuedCount} queued, ${failedCount} failed`
    })

  } catch (error) {
    console.error('Bulk messages API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}