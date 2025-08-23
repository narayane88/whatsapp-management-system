import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'

const pool = new Pool(getDatabaseConfig())

// GET /api/user-permissions - Get user permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view user permissions
    if (!(await checkCurrentUserPermission('permissions.view'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get direct user permissions
    const directPermissions = await pool.query(`
      SELECT 
        up.*,
        p.name as permission_name,
        p.description as permission_description,
        p.category as permission_category,
        p.resource as permission_resource,
        p.action as permission_action,
        'direct' as source_type,
        NULL as role_name
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1
      ORDER BY p.category, p.name
    `, [userId])

    // Get role-based permissions
    const rolePermissions = await pool.query(`
      SELECT 
        p.id as permission_id,
        p.name as permission_name,
        p.description as permission_description,
        p.category as permission_category,
        p.resource as permission_resource,
        p.action as permission_action,
        'role' as source_type,
        r.name as role_name,
        rp.granted,
        ur.assigned_at as role_assigned_at
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = $1 AND rp.granted = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      ORDER BY p.category, p.name
    `, [userId])

    return NextResponse.json({
      directPermissions: directPermissions.rows,
      rolePermissions: rolePermissions.rows,
      permissions: directPermissions.rows, // For backward compatibility
      totalPermissions: directPermissions.rows.length + rolePermissions.rows.length
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/user-permissions - Grant/Revoke direct user permission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to assign permissions
    if (!(await checkCurrentUserPermission('permissions.assign'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, permissionId, granted, reason, expiresAt } = body

    if (!userId || !permissionId || granted === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, permissionId, granted' 
      }, { status: 400 })
    }

    // Get current user ID for assigned_by
    const userResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 })
    }

    const currentUserId = userResult.rows[0].id

    // Check if permission assignment already exists
    const existingResult = await pool.query(
      'SELECT id FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
      [userId, permissionId]
    )

    if (existingResult.rows.length > 0) {
      // Update existing permission
      const result = await pool.query(`
        UPDATE user_permissions 
        SET granted = $1, reason = $2, expires_at = $3, assigned_by = $4, assigned_at = CURRENT_TIMESTAMP
        WHERE user_id = $5 AND permission_id = $6
        RETURNING *
      `, [granted, reason, expiresAt, currentUserId, userId, permissionId])

      return NextResponse.json({
        message: 'User permission updated successfully',
        permission: result.rows[0]
      })
    } else {
      // Create new permission assignment
      const result = await pool.query(`
        INSERT INTO user_permissions (user_id, permission_id, granted, reason, expires_at, assigned_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [userId, permissionId, granted, reason, expiresAt, currentUserId])

      return NextResponse.json({
        message: 'User permission assigned successfully',
        permission: result.rows[0]
      }, { status: 201 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/user-permissions - Remove direct user permission
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage permissions
    if (!(await checkCurrentUserPermission('permissions.assign'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Permission assignment ID is required' }, { status: 400 })
    }

    // Delete the permission assignment
    await pool.query('DELETE FROM user_permissions WHERE id = $1', [id])

    return NextResponse.json({
      message: 'User permission removed successfully'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}