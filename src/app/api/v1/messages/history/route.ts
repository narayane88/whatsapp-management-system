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
      return { valid: false, error: 'Insufficient permissions for reading messages' }
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
 * /api/v1/messages/history:
 *   get:
 *     tags:
 *       - Messages API
 *     summary: Get message history
 *     description: Retrieve sent message history with filtering and pagination
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 1000
 *         description: Number of messages to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip
 *       - in: query
 *         name: deviceName
 *         schema:
 *           type: string
 *         description: Filter by device name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [sent, delivered, read, failed, pending]
 *         description: Filter by message status
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *         description: Filter by batch ID (for bulk messages)
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter messages from this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter messages until this date
 *       - in: query
 *         name: recipient
 *         schema:
 *           type: string
 *         description: Filter by recipient number
 *     responses:
 *       200:
 *         description: Message history retrieved successfully
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           to:
 *                             type: string
 *                           recipientName:
 *                             type: string
 *                           message:
 *                             type: string
 *                           deviceName:
 *                             type: string
 *                           status:
 *                             type: string
 *                           sentAt:
 *                             type: string
 *                             format: date-time
 *                           deliveredAt:
 *                             type: string
 *                             format: date-time
 *                           readAt:
 *                             type: string
 *                             format: date-time
 *                           batchId:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSent:
 *                           type: integer
 *                         totalDelivered:
 *                           type: integer
 *                         totalRead:
 *                           type: integer
 *                         totalFailed:
 *                           type: integer
 *       401:
 *         description: Unauthorized - Invalid API key
 *       403:
 *         description: Forbidden - Insufficient permissions
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')
    const deviceName = searchParams.get('deviceName')
    const status = searchParams.get('status')
    const batchId = searchParams.get('batchId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const recipient = searchParams.get('recipient')

    // Build query conditions
    let whereConditions = [`sm."userId" = $1::text`]
    let queryParams = [auth.userId]
    let paramIndex = 2

    if (deviceName) {
      whereConditions.push(`sm."deviceName" = $${paramIndex}`)
      queryParams.push(deviceName)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`sm.status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (batchId) {
      whereConditions.push(`sm.metadata->>'batchId' = $${paramIndex}`)
      queryParams.push(batchId)
      paramIndex++
    }

    if (recipient) {
      whereConditions.push(`sm."recipientNumber" = $${paramIndex}`)
      queryParams.push(recipient)
      paramIndex++
    }

    if (fromDate) {
      whereConditions.push(`sm."sentAt" >= $${paramIndex}::date`)
      queryParams.push(fromDate)
      paramIndex++
    }

    if (toDate) {
      whereConditions.push(`sm."sentAt" <= $${paramIndex}::date + INTERVAL '1 day'`)
      queryParams.push(toDate)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM sent_messages sm
      WHERE ${whereClause}
    `, queryParams)

    const totalMessages = parseInt(countResult.rows[0].total)

    // Get messages with pagination
    const messagesResult = await pool.query(`
      SELECT 
        sm.id,
        sm."recipientNumber" as to,
        sm."recipientName",
        sm.message,
        sm."deviceName",
        sm.status,
        sm."sentAt",
        sm."deliveredAt",
        sm."readAt",
        sm."errorMessage",
        sm.metadata,
        sm."createdAt",
        sm."updatedAt"
      FROM sent_messages sm
      WHERE ${whereClause}
      ORDER BY sm."sentAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset])

    // Get status summary
    const summaryResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM sent_messages sm
      WHERE ${whereClause}
      GROUP BY status
    `, queryParams)

    const statusSummary = {
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalFailed: 0,
      totalPending: 0
    }

    summaryResult.rows.forEach(row => {
      switch (row.status) {
        case 'sent':
          statusSummary.totalSent = parseInt(row.count)
          break
        case 'delivered':
          statusSummary.totalDelivered = parseInt(row.count)
          break
        case 'read':
          statusSummary.totalRead = parseInt(row.count)
          break
        case 'failed':
          statusSummary.totalFailed = parseInt(row.count)
          break
        case 'pending':
          statusSummary.totalPending = parseInt(row.count)
          break
      }
    })

    // Format messages
    const formattedMessages = messagesResult.rows.map(row => ({
      id: row.id,
      to: row.to,
      recipientName: row.recipientName || 'Unknown',
      message: row.message,
      deviceName: row.deviceName,
      status: row.status,
      sentAt: row.sentAt,
      deliveredAt: row.deliveredAt,
      readAt: row.readAt,
      errorMessage: row.errorMessage,
      batchId: row.metadata?.batchId || null,
      via: row.metadata?.via || 'unknown',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))

    // Log API usage
    try {
      await pool.query(`
        INSERT INTO api_logs (id, "apiKeyId", endpoint, method, "statusCode", "timestamp", request)
        VALUES (gen_random_uuid(), $1, '/api/v1/messages/history', 'GET', 200, CURRENT_TIMESTAMP, $2)
      `, [auth.apiKeyId, JSON.stringify({ limit, offset, filters: { deviceName, status, batchId, recipient } })])
    } catch (logError) {
      console.warn('Failed to log API usage:', logError)
    }

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages,
        pagination: {
          total: totalMessages,
          limit,
          offset,
          hasMore: offset + limit < totalMessages,
          currentPage: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(totalMessages / limit)
        },
        summary: statusSummary
      },
      message: `Retrieved ${formattedMessages.length} messages (${totalMessages} total)`
    })

  } catch (error) {
    console.error('Message history API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}