import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'

const pool = new Pool(getDatabaseConfig())

// GET /api/admin/security/ip-restrictions - Get IP restrictions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('system.settings.read'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Ensure ip_restrictions table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ip_restrictions (
        id SERIAL PRIMARY KEY,
        role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ip_address CIDR NOT NULL,
        description TEXT,
        is_whitelist BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const result = await pool.query(`
      SELECT 
        ir.*,
        r.name as role_name,
        u.email as user_email,
        creator.email as created_by_email
      FROM ip_restrictions ir
      LEFT JOIN roles r ON ir.role_id = r.id
      LEFT JOIN users u ON ir.user_id = u.id
      LEFT JOIN users creator ON ir.created_by = creator.id
      WHERE ir.is_active = true
      ORDER BY ir.created_at DESC
    `)

    return NextResponse.json({
      restrictions: result.rows
    })
  } catch (error) {
    console.error('IP restrictions GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/security/ip-restrictions - Create IP restriction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('system.settings.update'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { role_id, user_id, ip_address, description, is_whitelist } = body

    if (!ip_address) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 })
    }

    // Validate IP address format
    try {
      // Try to parse as CIDR notation - PostgreSQL will validate this
      await pool.query('SELECT $1::CIDR', [ip_address])
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid IP address format. Use format like 192.168.1.100 or 192.168.1.0/24' 
      }, { status: 400 })
    }

    // Get current user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    const currentUserId = userResult.rows[0].id

    const result = await pool.query(`
      INSERT INTO ip_restrictions (
        role_id, user_id, ip_address, description, 
        is_whitelist, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [
      role_id || null,
      user_id || null,
      ip_address,
      description || null,
      is_whitelist !== false, // Default to true
      currentUserId
    ])

    // Log the security event
    await pool.query(`
      INSERT INTO security_events (
        event_type, user_email, ip_address, severity, details, created_at
      ) VALUES ('ip_restriction_added', $1, $2, 'medium', $3, NOW())
    `, [
      session.user.email,
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown',
      `Added IP restriction: ${ip_address} (${is_whitelist ? 'whitelist' : 'blacklist'})`
    ])

    return NextResponse.json({
      message: 'IP restriction created successfully',
      restriction: result.rows[0]
    }, { status: 201 })
  } catch (error) {
    console.error('IP restrictions POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/security/ip-restrictions - Remove IP restriction
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('system.settings.update'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Restriction ID is required' }, { status: 400 })
    }

    // Get restriction details before deletion for logging
    const restrictionResult = await pool.query(
      'SELECT * FROM ip_restrictions WHERE id = $1',
      [id]
    )

    if (restrictionResult.rows.length === 0) {
      return NextResponse.json({ error: 'IP restriction not found' }, { status: 404 })
    }

    const restriction = restrictionResult.rows[0]

    // Soft delete - mark as inactive
    await pool.query(
      'UPDATE ip_restrictions SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    )

    // Log the security event
    await pool.query(`
      INSERT INTO security_events (
        event_type, user_email, ip_address, severity, details, created_at
      ) VALUES ('ip_restriction_removed', $1, $2, 'medium', $3, NOW())
    `, [
      session.user.email,
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown',
      `Removed IP restriction: ${restriction.ip_address}`
    ])

    return NextResponse.json({
      message: 'IP restriction removed successfully'
    })
  } catch (error) {
    console.error('IP restrictions DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}