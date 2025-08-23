import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getImpersonationContext, hasCustomerAccess } from '@/lib/impersonation'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get impersonation context
    const impersonation = await getImpersonationContext(request)
    
    if (!hasCustomerAccess(session, impersonation.isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user accessing sent messages for customer ID: ${userId}`)
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const device = searchParams.get('device')
    const search = searchParams.get('search')
    const dateRange = searchParams.get('dateRange')
    const skip = (page - 1) * limit

    // Build WHERE conditions
    let whereConditions = ['sm."userId" = $1']
    const queryParams = [userId]
    let paramIndex = 2

    if (status && status !== 'all') {
      whereConditions.push(`sm.status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (device && device !== 'all') {
      whereConditions.push(`sm."deviceName" = $${paramIndex}`)
      queryParams.push(device)
      paramIndex++
    }

    if (search && search.trim()) {
      whereConditions.push(`(
        sm."recipientNumber" ILIKE $${paramIndex} OR 
        sm."recipientName" ILIKE $${paramIndex} OR 
        sm.message ILIKE $${paramIndex}
      )`)
      queryParams.push(`%${search.trim()}%`)
      paramIndex++
    }

    if (dateRange && dateRange !== 'all') {
      let dateCondition = ''
      switch (dateRange) {
        case 'today':
          dateCondition = `sm."sentAt" >= CURRENT_DATE`
          break
        case 'week':
          dateCondition = `sm."sentAt" >= CURRENT_DATE - INTERVAL '7 days'`
          break
        case 'month':
          dateCondition = `sm."sentAt" >= CURRENT_DATE - INTERVAL '30 days'`
          break
      }
      if (dateCondition) {
        whereConditions.push(dateCondition)
      }
    }

    const whereClause = whereConditions.join(' AND ')

    // Get sent messages with device information
    const messagesQuery = `
      SELECT 
        sm.id,
        sm."recipientNumber",
        sm."recipientName",
        sm.message,
        sm."messageType",
        sm."deviceName",
        sm.status,
        sm."sentAt",
        sm."deliveredAt",
        sm."readAt",
        sm."errorMessage",
        sm."messageId",
        sm."attachmentUrl",
        sm.metadata,
        wi.id as "deviceId",
        wi."phoneNumber" as "devicePhone"
      FROM sent_messages sm
      LEFT JOIN whatsapp_instances wi ON sm."deviceName" = wi.name
      WHERE ${whereClause}
      ORDER BY sm."sentAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    queryParams.push(limit, skip)
    
    const messagesResult = await pool.query(messagesQuery, queryParams)

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*)::integer as count
      FROM sent_messages sm
      LEFT JOIN whatsapp_instances wi ON sm."deviceName" = wi.name
      WHERE ${whereClause}
    `
    
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset
    const totalCount = countResult.rows[0]?.count || 0

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*)::integer as total_sent,
        COUNT(CASE WHEN status IN ('delivered', 'read') THEN 1 END)::integer as delivered,
        COUNT(CASE WHEN status = 'read' THEN 1 END)::integer as read,
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::integer as failed,
        COUNT(CASE WHEN "sentAt" >= CURRENT_DATE THEN 1 END)::integer as today,
        COUNT(CASE WHEN "sentAt" >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)::integer as this_week,
        COUNT(CASE WHEN "sentAt" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END)::integer as this_month
      FROM sent_messages sm
      WHERE sm."userId" = $1
    `
    
    const statsResult = await pool.query(statsQuery, [userId])
    const stats = statsResult.rows[0] || {
      total_sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      today: 0,
      this_week: 0,
      this_month: 0
    }

    // Format messages
    const messages = messagesResult.rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      recipientNumber: row.recipientNumber,
      recipientName: row.recipientName,
      message: row.message,
      messageType: row.messageType,
      deviceName: row.deviceName,
      deviceId: row.deviceId,
      devicePhone: row.devicePhone,
      status: row.status,
      sentAt: row.sentAt,
      deliveredAt: row.deliveredAt,
      readAt: row.readAt,
      errorMessage: row.errorMessage,
      messageId: row.messageId,
      attachmentUrl: row.attachmentUrl,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata as string) : row.metadata
    }))

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: {
        totalSent: stats.total_sent,
        delivered: stats.delivered,
        read: stats.read,
        failed: stats.failed,
        today: stats.today,
        thisWeek: stats.this_week,
        thisMonth: stats.this_month
      }
    })

  } catch (error) {
    console.error('Sent messages API error:', error)
    
    // If table doesn't exist, return empty data (for development)
    if (error instanceof Error && error.message.includes('relation "sent_messages" does not exist')) {
      return NextResponse.json({
        messages: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        stats: { totalSent: 0, delivered: 0, read: 0, failed: 0, today: 0, thisWeek: 0, thisMonth: 0 }
      })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST endpoint to manually add sent messages (for testing or external integrations)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get impersonation context
    const impersonation = await getImpersonationContext(request)
    
    if (!hasCustomerAccess(session, impersonation.isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const {
      recipientNumber,
      recipientName,
      message,
      messageType = 'text',
      deviceName,
      status = 'sent',
      attachmentUrl,
      metadata
    } = body

    if (!recipientNumber || !message || !deviceName) {
      return NextResponse.json({ 
        error: 'Missing required fields: recipientNumber, message, deviceName' 
      }, { status: 400 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user logging sent message for customer ID: ${userId}`)
    }
    const sentMessageId = `sent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Insert sent message
    const insertResult = await pool.query(`
      INSERT INTO sent_messages (
        id, "userId", "recipientNumber", "recipientName", message, "messageType",
        "deviceName", status, "sentAt", "attachmentUrl", metadata,
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
      ) RETURNING *
    `, [
      sentMessageId,
      userId,
      recipientNumber,
      recipientName || null,
      message,
      messageType,
      deviceName,
      status,
      new Date().toISOString(),
      attachmentUrl || null,
      JSON.stringify(metadata || {})
    ])

    // Update subscription message usage count
    try {
      await pool.query(`
        UPDATE customer_packages 
        SET "messagesUsed" = COALESCE("messagesUsed", 0) + 1,
            "updatedAt" = NOW()
        WHERE "userId" = $1::text 
        AND "isActive" = true
        AND "endDate" > NOW()
      `, [userId])
      
      console.log(`Message count updated for user ${userId}`)
    } catch (updateError) {
      console.warn('Failed to update message usage count:', updateError)
      // Continue execution - don't fail the message logging
    }

    return NextResponse.json({ 
      message: 'Sent message logged successfully',
      data: insertResult.rows[0]
    }, { status: 201 })

  } catch (error) {
    console.error('Sent messages POST error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}