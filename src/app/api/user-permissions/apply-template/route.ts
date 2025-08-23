import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'

const pool = new Pool(getDatabaseConfig())

// POST /api/user-permissions/apply-template - Apply permission template to user
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
    const { userId, templateId, mode = 'additive' } = body

    if (!userId || !templateId) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, templateId' 
      }, { status: 400 })
    }

    // Validate mode parameter
    if (mode && !['additive', 'replace'].includes(mode)) {
      return NextResponse.json({ 
        error: 'Invalid mode. Must be "additive" or "replace"' 
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

    // Get template details
    const templateResult = await pool.query(
      'SELECT * FROM permission_templates WHERE id = $1',
      [templateId]
    )

    if (templateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = templateResult.rows[0]

    // Begin transaction
    await pool.query('BEGIN')

    try {
      // If replace mode, remove all existing direct user permissions first
      if (mode === 'replace') {
        await pool.query('DELETE FROM user_permissions WHERE user_id = $1', [userId])
      }

      // Apply each permission from the template
      for (const permissionId of template.permissions) {
        // Check if permission assignment already exists
        const existingResult = await pool.query(
          'SELECT id FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
          [userId, permissionId]
        )

        if (existingResult.rows.length > 0) {
          // Update existing permission to granted
          await pool.query(`
            UPDATE user_permissions 
            SET granted = true, 
                reason = $1, 
                assigned_by = $2, 
                assigned_at = CURRENT_TIMESTAMP,
                expires_at = NULL
            WHERE user_id = $3 AND permission_id = $4
          `, [`Applied template: ${template.name}`, currentUserId, userId, permissionId])
        } else {
          // Create new permission assignment
          await pool.query(`
            INSERT INTO user_permissions (user_id, permission_id, granted, reason, assigned_by)
            VALUES ($1, $2, true, $3, $4)
          `, [userId, permissionId, `Applied template: ${template.name}`, currentUserId])
        }
      }

      // Commit transaction
      await pool.query('COMMIT')

      return NextResponse.json({
        message: `Permission template "${template.name}" applied successfully in ${mode} mode`,
        appliedPermissions: template.permissions.length,
        mode: mode
      })

    } catch (error) {
      // Rollback transaction
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}