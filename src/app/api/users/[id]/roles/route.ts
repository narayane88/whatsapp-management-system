import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'

const pool = new Pool(getDatabaseConfig())

// Helper function to check permission
async function hasPermission(userEmail: string, requiredPermission: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT user_has_permission($1, $2) as has_permission',
      [userEmail, requiredPermission]
    )
    return result.rows[0]?.has_permission || false
  } catch (error) {

    return false
  }
}

// GET /api/users/[id]/roles - Get user's roles
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to read roles
    if (!(await hasPermission(session.user.email, 'roles.read'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: userId } = await params

    // Get user's roles
    const userRolesResult = await pool.query(`
      SELECT r.id, r.name, r.description, r.level, r.is_system, 
             ur.is_primary, ur.assigned_at, ur.expires_at,
             assigner.name as assigned_by_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN users assigner ON ur.assigned_by = assigner.id
      WHERE ur.user_id = $1
      ORDER BY ur.is_primary DESC, r.level
    `, [userId])

    return NextResponse.json({
      user_roles: userRolesResult.rows
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/users/[id]/roles - Assign role to user
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to assign roles
    if (!(await hasPermission(session.user.email, 'roles.assign'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: userId } = await params
    const body = await request.json()
    const { role_id, is_primary = false, expires_at } = body

    if (!role_id) {
      return NextResponse.json({ 
        error: 'Role ID is required' 
      }, { status: 400 })
    }

    // Get current user ID for audit
    const currentUserResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    )
    const currentUserId = currentUserResult.rows[0]?.id

    // Check if user already has this role
    const existingRole = await pool.query(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, role_id]
    )

    if (existingRole.rows.length > 0) {
      return NextResponse.json({ 
        error: 'User already has this role assigned' 
      }, { status: 409 })
    }

    // Start transaction
    await pool.query('BEGIN')

    try {
      // If this is set as primary, remove primary flag from other roles
      if (is_primary) {
        await pool.query(
          'UPDATE user_roles SET is_primary = false WHERE user_id = $1',
          [userId]
        )
      }

      // Assign the role
      const result = await pool.query(`
        INSERT INTO user_roles (user_id, role_id, is_primary, assigned_by, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userId, role_id, is_primary, currentUserId, expires_at || null])

      await pool.query('COMMIT')

      return NextResponse.json({
        message: 'Role assigned successfully',
        user_role: result.rows[0]
      }, { status: 201 })

    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/users/[id]/roles - Update user's role assignment
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to assign roles
    if (!(await hasPermission(session.user.email, 'roles.assign'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: userId } = await params
    const body = await request.json()
    const { role_id, is_primary, expires_at } = body

    if (!role_id) {
      return NextResponse.json({ 
        error: 'Role ID is required' 
      }, { status: 400 })
    }

    // Check if user has this role
    const existingRole = await pool.query(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, role_id]
    )

    if (existingRole.rows.length === 0) {
      return NextResponse.json({ 
        error: 'User does not have this role assigned' 
      }, { status: 404 })
    }

    // Start transaction
    await pool.query('BEGIN')

    try {
      // If this is set as primary, remove primary flag from other roles
      if (is_primary) {
        await pool.query(
          'UPDATE user_roles SET is_primary = false WHERE user_id = $1 AND role_id != $2',
          [userId, role_id]
        )
      }

      // Update the role assignment
      const result = await pool.query(`
        UPDATE user_roles 
        SET is_primary = COALESCE($1, is_primary),
            expires_at = COALESCE($2, expires_at)
        WHERE user_id = $3 AND role_id = $4
        RETURNING *
      `, [is_primary, expires_at, userId, role_id])

      await pool.query('COMMIT')

      return NextResponse.json({
        message: 'Role assignment updated successfully',
        user_role: result.rows[0]
      })

    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/[id]/roles - Remove role from user
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to assign roles
    if (!(await hasPermission(session.user.email, 'roles.assign'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: userId } = await params
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('role_id')

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    // Check if user has this role
    const existingRole = await pool.query(
      'SELECT id, is_primary FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    )

    if (existingRole.rows.length === 0) {
      return NextResponse.json({ 
        error: 'User does not have this role assigned' 
      }, { status: 404 })
    }

    // Check if this is the user's only role
    const roleCount = await pool.query(
      'SELECT COUNT(*) as count FROM user_roles WHERE user_id = $1',
      [userId]
    )

    if (parseInt(roleCount.rows[0].count) === 1) {
      return NextResponse.json({ 
        error: 'Cannot remove the last role from user. Users must have at least one role.' 
      }, { status: 409 })
    }

    const wasPrimary = existingRole.rows[0].is_primary

    // Start transaction
    await pool.query('BEGIN')

    try {
      // Remove the role
      await pool.query(
        'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
        [userId, roleId]
      )

      // If this was the primary role, set another role as primary
      if (wasPrimary) {
        await pool.query(
          'UPDATE user_roles SET is_primary = true WHERE user_id = $1 AND id = (SELECT MIN(id) FROM user_roles WHERE user_id = $1)',
          [userId]
        )
      }

      await pool.query('COMMIT')

      return NextResponse.json({
        message: 'Role removed successfully'
      })

    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}