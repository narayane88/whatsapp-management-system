import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// API Key authentication middleware
async function authenticateApiKey(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const apiKey = authHeader.substring(7)
  
  try {
    const result = await pool.query(`
      SELECT ak.*, u.id as user_id, u.name as user_name
      FROM api_keys ak
      JOIN users u ON ak."userId"::text = u.id::text
      WHERE ak.key = $1 AND ak."isActive" = true
      AND (ak."expiresAt" IS NULL OR ak."expiresAt" > CURRENT_TIMESTAMP OR ak."neverExpires" = true)
    `, [apiKey])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error('API key authentication error:', error)
    return null
  }
}

/**
 * @swagger
 * /api/v1/messages/send:
 *   post:
 *     tags:
 *       - WhatsApp Messages
 *     summary: Send WhatsApp message
 *     description: Send a WhatsApp message to a specific phone number
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - message
 *               - deviceName
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient phone number (with country code)
 *                 example: "9960589622"
 *               message:
 *                 type: string
 *                 description: Message content to send
 *                 example: "Hello from WhatsApp API!"
 *               deviceName:
 *                 type: string
 *                 description: WhatsApp device name to send from
 *                 example: "bizflash.in-device-20250121123045"
 *               instanceId:
 *                 type: string
 *                 description: Legacy field - use deviceName instead
 *                 example: "instance_123"
 *               priority:
 *                 type: integer
 *                 description: Message priority (0=normal, 1=high, 2=urgent)
 *                 default: 0
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional scheduled delivery time
 *               mediaUrl:
 *                 type: string
 *                 description: Optional media file URL
 *               messageType:
 *                 type: string
 *                 description: Type of message when mediaUrl is provided (auto-detected if not specified)
 *                 enum: [text, image, video, audio, document]
 *                 example: image
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - message
 *               - deviceName
 *             properties:
 *               to:
 *                 type: string
 *               message:
 *                 type: string
 *               deviceName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 messageId:
 *                   type: string
 *                   example: "msg_123"
 *                 status:
 *                   type: string
 *                   example: "QUEUED"
 *                 queuePosition:
 *                   type: integer
 *                   example: 5
 *                 estimatedDelivery:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate API key
    const apiKeyData = await authenticateApiKey(request)
    if (!apiKeyData) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid or expired API key' 
      }, { status: 401 })
    }

    // Check permissions
    const permissions = typeof apiKeyData.permissions === 'string' 
      ? JSON.parse(apiKeyData.permissions) 
      : apiKeyData.permissions
    if (!permissions.includes('messages.send') && !permissions.includes('*')) {
      return NextResponse.json({ 
        success: false,
        error: 'Insufficient permissions - messages.send required' 
      }, { status: 403 })
    }

    // Parse request body (supports both JSON and form-urlencoded)
    const contentType = request.headers.get('content-type') || ''
    let body
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      body = {}
      formData.forEach((value, key) => {
        body[key] = value.toString()
      })
    } else {
      body = await request.json()
    }
    
    const { to, message, deviceName, instanceId, priority = 0, scheduledAt, mediaUrl, messageType } = body
    
    // Use deviceName if provided, fallback to instanceId for backwards compatibility
    const actualInstanceId = deviceName || instanceId

    // Validate required fields
    if (!to || !message || !actualInstanceId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields: to, message, deviceName (or instanceId)' 
      }, { status: 400 })
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    if (!phoneRegex.test(to)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid phone number format. Use international format with country code (e.g., +1234567890)' 
      }, { status: 400 })
    }

    // Verify instance belongs to user
    const instanceResult = await pool.query(`
      SELECT id, name, status, "userId" 
      FROM whatsapp_instances 
      WHERE name = $1 AND "userId" = $2::text
    `, [actualInstanceId, apiKeyData.user_id])

    if (instanceResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'WhatsApp instance not found or access denied' 
      }, { status: 404 })
    }

    const instance = instanceResult.rows[0]

    // Check subscription limits
    const packageResult = await pool.query(`
      SELECT cp.id, cp."messagesUsed", cp."endDate", p."messageLimit"
      FROM customer_packages cp
      JOIN packages p ON cp."packageId" = p.id
      WHERE cp."userId" = $1::text AND cp."isActive" = true AND cp."endDate" > NOW()
      ORDER BY cp."createdAt" DESC
      LIMIT 1
    `, [apiKeyData.user_id])

    if (packageResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription package found'
      }, { status: 403 })
    }

    const subscription = packageResult.rows[0]
    const remainingMessages = subscription.messageLimit - subscription.messagesUsed
    
    // Calculate credits needed (1 for text, 2 for attachments)
    const creditsNeeded = mediaUrl ? 2 : 1
    
    if (remainingMessages < creditsNeeded) {
      return NextResponse.json({
        success: false,
        error: `Insufficient message credits. Need ${creditsNeeded} credits but only ${remainingMessages} available.`,
        available: remainingMessages,
        used: subscription.messagesUsed,
        limit: subscription.messageLimit,
        creditsNeeded: creditsNeeded
      }, { status: 403 })
    }

    // Auto-detect message type from mediaUrl if not provided
    let finalMessageType = messageType || 'text'
    if (mediaUrl && !messageType) {
      const url = mediaUrl.toLowerCase()
      if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp')) {
        finalMessageType = 'image'
      } else if (url.includes('.mp4') || url.includes('.avi') || url.includes('.mov') || url.includes('.webm')) {
        finalMessageType = 'video'
      } else if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a')) {
        finalMessageType = 'audio'
      } else if (url.includes('.pdf') || url.includes('.doc') || url.includes('.docx') || url.includes('.txt') || url.includes('.xlsx')) {
        finalMessageType = 'document'
      } else {
        finalMessageType = 'document' // Default for unknown file types
      }
    }

    // Add message to queue instead of sending directly
    const scheduledTime = scheduledAt ? new Date(scheduledAt) : new Date()
    const messageId = `msg_${Date.now()}_${apiKeyData.user_id}`

    const queueResult = await pool.query(`
      INSERT INTO message_queue (
        id, "instanceId", "toNumber", message, priority, scheduled, 
        status, "createdAt", "updatedAt", metadata
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $6)
      RETURNING id
    `, [
      instance.id,
      to,
      message,
      priority || 0,
      scheduledTime,
      JSON.stringify({
        deviceName: actualInstanceId,
        apiKeyId: apiKeyData.id,
        via: 'single_api',
        messageId: messageId,
        mediaUrl: mediaUrl || null,
        attachmentUrl: mediaUrl || null,
        messageType: finalMessageType
      })
    ])

    const queueId = queueResult.rows[0].id

    // Update subscription message count
    await pool.query(`
      UPDATE customer_packages 
      SET "messagesUsed" = "messagesUsed" + $2,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [subscription.id, creditsNeeded])

    // Get queue position
    const queuePositionResult = await pool.query(`
      SELECT COUNT(*) as position
      FROM message_queue
      WHERE status = 'PENDING' 
        AND (scheduled IS NULL OR scheduled <= CURRENT_TIMESTAMP)
        AND id <= $1
    `, [queueId])

    const queuePosition = parseInt(queuePositionResult.rows[0].position)
    
    // Estimate delivery time
    const estimatedDelivery = new Date(Date.now() + (queuePosition * 3000)) // 3 seconds per message

    // Log API usage
    await pool.query(`
      INSERT INTO api_logs (
        id, "apiKeyId", endpoint, method, request, "statusCode", ip, "userAgent", "timestamp"
      )
      VALUES (gen_random_uuid(), $1, '/v1/messages/send', 'POST', $2, 200, $3, $4, CURRENT_TIMESTAMP)
    `, [
      apiKeyData.id,
      JSON.stringify({ to, instanceId, priority }),
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    ])

    // Update last used timestamp
    await pool.query(`
      UPDATE api_keys SET "lastUsedAt" = CURRENT_TIMESTAMP WHERE id = $1
    `, [apiKeyData.id])

    return NextResponse.json({
      success: true,
      data: {
        messageId: messageId,
        queueId: queueId,
        to: to,
        message: message,
        deviceName: actualInstanceId,
        status: scheduledAt ? 'SCHEDULED' : 'QUEUED',
        queuePosition: queuePosition,
        priority: priority || 0,
        scheduledAt: scheduledTime.toISOString(),
        estimatedDelivery: estimatedDelivery.toISOString(),
        remainingCredits: remainingMessages - creditsNeeded
      },
      message: 'Message queued successfully'
    })

  } catch (error) {
    console.error('Send message API error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}