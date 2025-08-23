import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'

const pool = new Pool(getDatabaseConfig())

// GET /api/admin/security/events - Get security events log
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('system.logs.read'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)
    const severity = searchParams.get('severity')
    const eventType = searchParams.get('event_type')

    // Ensure security_events table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        user_email VARCHAR(255),
        user_id INTEGER,
        ip_address INET,
        user_agent TEXT,
        severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        details TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Build query with filters
    let query = `
      SELECT * FROM security_events 
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 0

    if (severity) {
      paramCount++
      query += ` AND severity = $${paramCount}`
      params.push(severity)
    }

    if (eventType) {
      paramCount++
      query += ` AND event_type = $${paramCount}`
      params.push(eventType)
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`
    params.push(limit)

    const result = await pool.query(query, params)

    // Get event type statistics
    const statsResult = await pool.query(`
      SELECT 
        event_type,
        severity,
        COUNT(*) as count
      FROM security_events 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY event_type, severity
      ORDER BY count DESC
    `)

    return NextResponse.json({
      events: result.rows,
      statistics: statsResult.rows
    })
  } catch (error) {
    console.error('Security events GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/security/events - Create new security event (for logging)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { eventType, severity, details, metadata } = body

    if (!eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 })
    }

    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    const userAgent = request.headers.get('user-agent') || 'unknown'

    await pool.query(`
      INSERT INTO security_events (
        event_type, user_email, ip_address, user_agent, 
        severity, details, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      eventType,
      session.user.email,
      clientIP,
      userAgent,
      severity || 'low',
      details || '',
      metadata ? JSON.stringify(metadata) : null
    ])

    return NextResponse.json({
      message: 'Security event logged successfully'
    })
  } catch (error) {
    console.error('Security events POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}