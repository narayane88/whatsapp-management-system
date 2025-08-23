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
    
    if (!permissions.includes('messages.read') && !permissions.includes('*')) {
      return { valid: false, error: 'Insufficient permissions for reading queue' }
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
 * /api/v1/messages/queue:
 *   get:
 *     tags:
 *       - Messages API
 *     summary: Get message queue status
 *     description: Retrieve current message queue status and statistics
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, SENT, FAILED, CANCELLED]
 *         description: Filter by queue status
 *       - in: query
 *         name: deviceName
 *         schema:
 *           type: string
 *         description: Filter by device name
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *         description: Filter by batch ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 500
 *         description: Number of queue items to return
 *     responses:
 *       200:
 *         description: Queue status retrieved successfully
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
 *                     queue:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           to:
 *                             type: string
 *                           message:
 *                             type: string
 *                           status:
 *                             type: string
 *                           priority:
 *                             type: integer
 *                           attempts:
 *                             type: integer
 *                           scheduledAt:
 *                             type: string
 *                             format: date-time
 *                           processedAt:
 *                             type: string
 *                             format: date-time
 *                           batchId:
 *                             type: string
 *                           deviceName:
 *                             type: string
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                         processing:
 *                           type: integer
 *                         sent:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *                         cancelled:
 *                           type: integer
 *                         totalInQueue:
 *                           type: integer
 *                         estimatedWaitTime:
 *                           type: integer
 *                           description: Estimated wait time in seconds
 *       401:
 *         description: Unauthorized - Invalid API key
 *       403:
 *         description: Forbidden - Insufficient permissions
 *   delete:
 *     tags:
 *       - Messages API
 *     summary: Cancel queued messages
 *     description: Cancel pending messages in the queue
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: queueId
 *         schema:
 *           type: string
 *         description: Specific queue item ID to cancel
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *         description: Cancel all messages in this batch
 *     responses:
 *       200:
 *         description: Messages cancelled successfully
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const auth = await validateApiKey(request)
    if (!auth.valid) {
      return NextResponse.json({ 
        success: false,
        error: auth.error 
      }, { status: auth.error.includes('permissions') ? 403 : 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const deviceName = searchParams.get('deviceName')
    const batchId = searchParams.get('batchId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)

    // Build query conditions
    let whereConditions = []
    let queryParams = []
    let paramIndex = 1

    // Filter by user's instances only
    whereConditions.push(`mq."instanceId" IN (
      SELECT wi.id FROM whatsapp_instances wi WHERE wi."userId" = $${paramIndex}::text
    )`)
    queryParams.push(auth.userId)
    paramIndex++

    if (status) {
      whereConditions.push(`mq.status = $${paramIndex}`)
      queryParams.push(status.toUpperCase())
      paramIndex++
    }

    if (deviceName) {
      whereConditions.push(`wi.name = $${paramIndex}`)
      queryParams.push(deviceName)
      paramIndex++
    }

    if (batchId) {
      whereConditions.push(`mq.metadata->>'batchId' = $${paramIndex}`)
      queryParams.push(batchId)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get queue items
    const queueResult = await pool.query(`
      SELECT 
        mq.id,
        mq."toNumber" as to,
        mq.message,
        mq.status,
        mq.priority,
        mq.attempts,
        mq.scheduled as "scheduledAt",
        mq."processedAt",
        mq."lastError",
        mq."createdAt",
        mq."updatedAt",
        mq.metadata,
        wi.name as "deviceName"
      FROM message_queue mq
      JOIN whatsapp_instances wi ON mq."instanceId" = wi.id
      WHERE ${whereClause}
      ORDER BY 
        mq.priority DESC,
        mq.scheduled ASC,
        mq."createdAt" ASC
      LIMIT $${paramIndex}
    `, [...queryParams, limit])

    // Get queue statistics
    const statsResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM message_queue mq
      WHERE mq."instanceId" IN (
        SELECT wi.id FROM whatsapp_instances wi WHERE wi."userId" = $1::text
      )
      GROUP BY status
    `, [auth.userId])

    const statistics = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      cancelled: 0,
      totalInQueue: 0,
      estimatedWaitTime: 0
    }

    let totalActive = 0
    statsResult.rows.forEach(row => {
      const count = parseInt(row.count)
      switch (row.status.toUpperCase()) {
        case 'PENDING':
          statistics.pending = count
          totalActive += count
          break
        case 'PROCESSING':
          statistics.processing = count
          totalActive += count
          break
        case 'SENT':
          statistics.sent = count
          break
        case 'FAILED':
          statistics.failed = count
          break
        case 'CANCELLED':
          statistics.cancelled = count
          break
      }
    })

    statistics.totalInQueue = totalActive
    statistics.estimatedWaitTime = totalActive * 3 // Estimate 3 seconds per message

    // Format queue items
    const formattedQueue = queueResult.rows.map(row => ({
      id: row.id,
      to: row.to,
      message: row.message?.substring(0, 100) + (row.message?.length > 100 ? '...' : ''), // Truncate long messages
      status: row.status,
      priority: row.priority,
      attempts: row.attempts,
      scheduledAt: row.scheduledAt,
      processedAt: row.processedAt,
      lastError: row.lastError,
      batchId: row.metadata?.batchId || null,
      deviceName: row.deviceName,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))

    // Log API usage
    try {
      await pool.query(`
        INSERT INTO api_logs (id, "apiKeyId", endpoint, method, "statusCode", "timestamp")
        VALUES (gen_random_uuid(), $1, '/api/v1/messages/queue', 'GET', 200, CURRENT_TIMESTAMP)
      `, [auth.apiKeyId])
    } catch (logError) {
      console.warn('Failed to log API usage:', logError)
    }

    return NextResponse.json({
      success: true,
      data: {
        queue: formattedQueue,
        statistics,
        filters: {
          status,
          deviceName,
          batchId,
          limit
        }
      },
      message: `Retrieved ${formattedQueue.length} queue items (${statistics.totalInQueue} active)`
    })

  } catch (error) {
    console.error('Message queue API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Validate API key
    const auth = await validateApiKey(request)
    if (!auth.valid) {
      return NextResponse.json({ 
        success: false,
        error: auth.error 
      }, { status: auth.error.includes('permissions') ? 403 : 401 })
    }

    // Check if user has send permissions (needed to cancel messages)
    const permissions = typeof auth.permissions === 'string' 
      ? JSON.parse(auth.permissions) 
      : auth.permissions
    
    if (!permissions.includes('messages.send') && !permissions.includes('*')) {
      return NextResponse.json({ 
        success: false,
        error: 'Insufficient permissions for cancelling messages' 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const queueId = searchParams.get('queueId')
    const batchId = searchParams.get('batchId')

    if (!queueId && !batchId) {
      return NextResponse.json({
        success: false,
        error: 'Either queueId or batchId must be provided'
      }, { status: 400 })
    }

    let cancelledCount = 0

    if (queueId) {
      // Cancel specific queue item
      const result = await pool.query(`
        UPDATE message_queue 
        SET status = 'CANCELLED', "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $1 
          AND status IN ('PENDING', 'PROCESSING')
          AND "instanceId" IN (
            SELECT wi.id FROM whatsapp_instances wi WHERE wi."userId" = $2::text
          )
        RETURNING id
      `, [queueId, auth.userId])

      cancelledCount = result.rowCount || 0

    } else if (batchId) {
      // Cancel batch
      const result = await pool.query(`
        UPDATE message_queue 
        SET status = 'CANCELLED', "updatedAt" = CURRENT_TIMESTAMP
        WHERE metadata->>'batchId' = $1
          AND status IN ('PENDING', 'PROCESSING')
          AND "instanceId" IN (
            SELECT wi.id FROM whatsapp_instances wi WHERE wi."userId" = $2::text
          )
        RETURNING id
      `, [batchId, auth.userId])

      cancelledCount = result.rowCount || 0
    }

    // Log API usage
    try {
      await pool.query(`
        INSERT INTO api_logs (id, "apiKeyId", endpoint, method, "statusCode", "timestamp", request)
        VALUES (gen_random_uuid(), $1, '/api/v1/messages/queue', 'DELETE', 200, CURRENT_TIMESTAMP, $2)
      `, [auth.apiKeyId, JSON.stringify({ queueId, batchId, cancelledCount })])
    } catch (logError) {
      console.warn('Failed to log API usage:', logError)
    }

    return NextResponse.json({
      success: true,
      data: {
        cancelledCount,
        queueId: queueId || null,
        batchId: batchId || null
      },
      message: `Cancelled ${cancelledCount} queued messages`
    })

  } catch (error) {
    console.error('Cancel queue API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}