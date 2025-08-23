import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'

const pool = new Pool(getDatabaseConfig())

// GET /api/permission-templates - Get all permission templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view templates
    if (!(await checkCurrentUserPermission('permissions.view'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const result = await pool.query(`
      SELECT 
        pt.*,
        array_agg(
          json_build_object(
            'id', p.id,
            'name', p.name,
            'description', p.description,
            'category', p.category
          ) ORDER BY p.category, p.name
        ) FILTER (WHERE p.id IS NOT NULL) as permission_details
      FROM permission_templates pt
      LEFT JOIN permissions p ON p.id = ANY(pt.permissions)
      GROUP BY pt.id
      ORDER BY pt.is_system DESC, pt.name
    `)

    return NextResponse.json({
      templates: result.rows
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/permission-templates - Create new permission template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create templates
    if (!(await checkCurrentUserPermission('permissions.create'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, permissions } = body

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, permissions' 
      }, { status: 400 })
    }

    // Get user ID for created_by
    const userResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userResult.rows[0].id

    // Create the template
    const result = await pool.query(`
      INSERT INTO permission_templates (name, description, permissions, created_by, is_system)
      VALUES ($1, $2, $3, $4, false)
      RETURNING *
    `, [name, description, permissions, userId])

    return NextResponse.json({
      message: 'Permission template created successfully',
      template: result.rows[0]
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/permission-templates - Update permission template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to edit templates
    if (!(await checkCurrentUserPermission('permissions.edit'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, description, permissions } = body

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Check if template exists and is not a system template
    const existingTemplate = await pool.query(
      'SELECT * FROM permission_templates WHERE id = $1',
      [id]
    )

    if (existingTemplate.rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existingTemplate.rows[0].is_system) {
      return NextResponse.json({ 
        error: 'Cannot modify system templates' 
      }, { status: 403 })
    }

    // Update the template
    const result = await pool.query(`
      UPDATE permission_templates 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          permissions = COALESCE($3, permissions)
      WHERE id = $4 AND is_system = false
      RETURNING *
    `, [name, description, permissions, id])

    return NextResponse.json({
      message: 'Permission template updated successfully',
      template: result.rows[0]
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/permission-templates - Delete permission template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete templates
    if (!(await checkCurrentUserPermission('permissions.delete'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // Check if template exists and is not a system template
    const existingTemplate = await pool.query(
      'SELECT * FROM permission_templates WHERE id = $1',
      [id]
    )

    if (existingTemplate.rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    if (existingTemplate.rows[0].is_system) {
      return NextResponse.json({ 
        error: 'Cannot delete system templates' 
      }, { status: 403 })
    }

    // Delete the template
    await pool.query('DELETE FROM permission_templates WHERE id = $1 AND is_system = false', [id])

    return NextResponse.json({
      message: 'Permission template deleted successfully'
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}