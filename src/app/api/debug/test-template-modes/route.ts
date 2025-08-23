import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email') || 'narayanesagar@gmail.com'

    console.log(`🧪 Testing template application modes for user: ${userEmail}`)

    // Get user ID
    const userResult = await pool.query('SELECT id, name FROM users WHERE email = $1', [userEmail])
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found', userEmail })
    }

    const userId = userResult.rows[0].id
    const userName = userResult.rows[0].name

    // Get user's current direct permissions (before any template application)
    const beforePermissions = await pool.query(`
      SELECT up.*, p.name as permission_name
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1
      ORDER BY p.name
    `, [userId])

    // Get a sample template for testing
    const templateResult = await pool.query(`
      SELECT id, name, permissions
      FROM permission_templates 
      WHERE is_system = true 
      LIMIT 1
    `)

    if (templateResult.rows.length === 0) {
      return NextResponse.json({ error: 'No templates available for testing' })
    }

    const template = templateResult.rows[0]

    return NextResponse.json({
      user: {
        id: userId,
        name: userName,
        email: userEmail
      },
      currentDirectPermissions: {
        count: beforePermissions.rows.length,
        permissions: beforePermissions.rows
      },
      availableTemplate: {
        id: template.id,
        name: template.name,
        permissionCount: template.permissions.length
      },
      testInstructions: {
        additiveMode: {
          endpoint: '/api/user-permissions/apply-template',
          method: 'POST',
          body: {
            userId: userId,
            templateId: template.id,
            mode: 'additive'
          },
          description: 'This will add template permissions while keeping existing ones'
        },
        replaceMode: {
          endpoint: '/api/user-permissions/apply-template',
          method: 'POST',
          body: {
            userId: userId,
            templateId: template.id,
            mode: 'replace'
          },
          description: 'This will replace all existing direct permissions with template permissions'
        }
      },
      debug: {
        timestamp: new Date().toISOString(),
        userFound: true,
        templateFound: true
      }
    })

  } catch (error) {
    console.error('❌ Template mode test error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}