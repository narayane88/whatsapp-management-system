import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'

const pool = new Pool(getDatabaseConfig())

// GET /api/roles - Get all roles with their permissions and user counts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to read roles
    if (!(await checkCurrentUserPermission('roles.read'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includePermissions = searchParams.get('include_permissions') === 'true'

    // Get roles with user counts
    const rolesResult = await pool.query(`
      SELECT r.*, 
        COUNT(DISTINCT ur.user_id) as user_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id
      ORDER BY r.level, r.name
    `)

    const roles = rolesResult.rows

    if (includePermissions) {
      // Get permissions for each role
      for (const role of roles) {
        const permissionsResult = await pool.query(`
          SELECT p.id, p.name, p.description, p.category, p.resource, p.action, rp.granted
          FROM role_permissions rp
          JOIN permissions p ON rp.permission_id = p.id
          WHERE rp.role_id = $1
          ORDER BY p.category, p.resource, p.action
        `, [role.id])
        
        role.permissions = permissionsResult.rows
      }
    }

    return NextResponse.json({
      roles: roles
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create roles
    if (!(await checkCurrentUserPermission('roles.create'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, level, permissions = [] } = body

    if (!name || !description) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, description' 
      }, { status: 400 })
    }

    // Check if role already exists
    const existingRole = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [name]
    )

    if (existingRole.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Role with this name already exists' 
      }, { status: 409 })
    }

    // Start transaction
    await pool.query('BEGIN')

    try {
      // Create the role
      const roleResult = await pool.query(`
        INSERT INTO roles (name, description, level, is_system)
        VALUES ($1, $2, $3, false)
        RETURNING *
      `, [name, description, level || 5])

      const newRole = roleResult.rows[0]

      // Assign permissions to the role
      if (permissions.length > 0) {
        const permissionValues = permissions.map((permissionId: number, index: number) => {
          const paramIndex = index * 2
          return `($1, $${paramIndex + 2}, true)`
        }).join(', ')

        const permissionParams = [newRole.id, ...permissions]

        await pool.query(`
          INSERT INTO role_permissions (role_id, permission_id, granted)
          VALUES ${permissionValues}
        `, permissionParams)
      }

      await pool.query('COMMIT')

      return NextResponse.json({
        message: 'Role created successfully',
        role: newRole
      }, { status: 201 })

    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/roles - Update role
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update roles
    if (!(await checkCurrentUserPermission('roles.update'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, description, level, permissions } = body

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    // Check if role exists and is not a system role
    const existingRole = await pool.query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    )

    if (existingRole.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (existingRole.rows[0].is_system) {
      return NextResponse.json({ 
        error: 'Cannot modify system roles' 
      }, { status: 403 })
    }

    // Start transaction
    await pool.query('BEGIN')

    try {
      // Update the role
      const result = await pool.query(`
        UPDATE roles 
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            level = COALESCE($3, level),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND is_system = false
        RETURNING *
      `, [name, description, level, id])

      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        // Remove existing permissions
        await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [id])

        // Add new permissions
        if (permissions.length > 0) {
          const permissionValues = permissions.map((permissionId: number, index: number) => {
            return `($1, $${index + 2}, true)`
          }).join(', ')

          const permissionParams = [id, ...permissions]

          await pool.query(`
            INSERT INTO role_permissions (role_id, permission_id, granted)
            VALUES ${permissionValues}
          `, permissionParams)
        }
      }

      await pool.query('COMMIT')

      return NextResponse.json({
        message: 'Role updated successfully',
        role: result.rows[0]
      })

    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/roles - Delete role
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete roles
    if (!(await checkCurrentUserPermission('roles.delete'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    // Check if role exists and is not a system role
    const existingRole = await pool.query(
      'SELECT * FROM roles WHERE id = $1',
      [id]
    )

    if (existingRole.rows.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (existingRole.rows[0].is_system) {
      return NextResponse.json({ 
        error: 'Cannot delete system roles' 
      }, { status: 403 })
    }

    // Check if role has assigned users
    const userCount = await pool.query(
      'SELECT COUNT(*) as count FROM user_roles WHERE role_id = $1',
      [id]
    )

    if (parseInt(userCount.rows[0].count) > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete role that has assigned users. Please reassign users first.' 
      }, { status: 409 })
    }

    // Delete the role (CASCADE will handle related records)
    await pool.query('DELETE FROM roles WHERE id = $1 AND is_system = false', [id])

    return NextResponse.json({
      message: 'Role deleted successfully'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}