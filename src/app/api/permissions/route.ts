import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'

const pool = new Pool(getDatabaseConfig())

// GET /api/permissions - Get all permissions with optional filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view permissions
    if (!(await checkCurrentUserPermission('permissions.view'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const resource = searchParams.get('resource')
    const isSystem = searchParams.get('is_system')

    let query = `
      SELECT p.*, 
        COUNT(DISTINCT rp.id) as role_count,
        COUNT(DISTINCT up.id) as user_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.granted = true
      LEFT JOIN user_permissions up ON p.id = up.permission_id AND up.granted = true
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 0

    if (category) {
      paramCount++
      query += ` AND p.category = $${paramCount}`
      params.push(category)
    }

    if (resource) {
      paramCount++
      query += ` AND p.resource = $${paramCount}`
      params.push(resource)
    }

    if (isSystem !== null) {
      paramCount++
      query += ` AND p.is_system = $${paramCount}`
      params.push(isSystem === 'true')
    }

    query += `
      GROUP BY p.id
      ORDER BY p.category, p.resource, p.action
    `

    const result = await pool.query(query, params)

    // Get categories for filtering
    const categoriesResult = await pool.query(
      'SELECT DISTINCT category FROM permissions ORDER BY category'
    )

    // Get resources for filtering
    const resourcesResult = await pool.query(
      'SELECT DISTINCT resource FROM permissions ORDER BY resource'
    )

    return NextResponse.json({
      permissions: result.rows,
      categories: categoriesResult.rows.map(row => row.category),
      resources: resourcesResult.rows.map(row => row.resource)
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/permissions - Create new permission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create permissions
    if (!(await checkCurrentUserPermission('permissions.create'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, category, resource, action } = body

    if (!name || !category || !resource || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, category, resource, action' 
      }, { status: 400 })
    }

    // Check if permission already exists
    const existingPermission = await pool.query(
      'SELECT id FROM permissions WHERE name = $1',
      [name]
    )

    if (existingPermission.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Permission with this name already exists' 
      }, { status: 409 })
    }

    // Create the permission
    const result = await pool.query(`
      INSERT INTO permissions (name, description, category, resource, action, is_system)
      VALUES ($1, $2, $3, $4, $5, false)
      RETURNING *
    `, [name, description, category, resource, action])

    return NextResponse.json({
      message: 'Permission created successfully',
      permission: result.rows[0]
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/permissions - Update permission
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to edit permissions
    if (!(await checkCurrentUserPermission('permissions.edit'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, description, category, resource, action } = body

    if (!id) {
      return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 })
    }

    // Check if permission exists and is not a system permission
    const existingPermission = await pool.query(
      'SELECT * FROM permissions WHERE id = $1',
      [id]
    )

    if (existingPermission.rows.length === 0) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    if (existingPermission.rows[0].is_system) {
      return NextResponse.json({ 
        error: 'Cannot modify system permissions' 
      }, { status: 403 })
    }

    // Update the permission
    const result = await pool.query(`
      UPDATE permissions 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          resource = COALESCE($4, resource),
          action = COALESCE($5, action)
      WHERE id = $6 AND is_system = false
      RETURNING *
    `, [name, description, category, resource, action, id])

    return NextResponse.json({
      message: 'Permission updated successfully',
      permission: result.rows[0]
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/permissions - Delete permission
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete permissions
    if (!(await checkCurrentUserPermission('permissions.delete'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 })
    }

    // Check if permission exists and is not a system permission
    const existingPermission = await pool.query(
      'SELECT * FROM permissions WHERE id = $1',
      [id]
    )

    if (existingPermission.rows.length === 0) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    if (existingPermission.rows[0].is_system) {
      return NextResponse.json({ 
        error: 'Cannot delete system permissions' 
      }, { status: 403 })
    }

    // Delete the permission (CASCADE will handle related records)
    await pool.query('DELETE FROM permissions WHERE id = $1 AND is_system = false', [id])

    return NextResponse.json({
      message: 'Permission deleted successfully'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}