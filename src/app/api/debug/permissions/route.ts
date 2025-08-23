import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET() {
  try {
    // Get all permissions from database
    const permissionsResult = await pool.query(`
      SELECT id, name, description, created_at 
      FROM permissions 
      ORDER BY name
    `)

    // Get all roles
    const rolesResult = await pool.query(`
      SELECT id, name, level 
      FROM roles 
      ORDER BY level
    `)

    // Get role-permission mappings
    const rolePemissionsResult = await pool.query(`
      SELECT 
        r.name as role_name,
        p.name as permission_name,
        rp.granted
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      ORDER BY r.level, p.name
    `)

    // Get current user info if logged in
    let currentUserInfo = null
    try {
      const { getServerSession } = await import('next-auth/next')
      const { authOptions } = await import('@/lib/auth')
      const session = await getServerSession(authOptions)
      
      if (session?.user?.email) {
        const userResult = await pool.query(`
          SELECT 
            u.id, u.name, u.email, 
            r.name as role, r.level,
            u.dealer_code, u."isActive"
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE LOWER(u.email) = LOWER($1)
        `, [session.user.email])

        if (userResult.rows.length > 0) {
          currentUserInfo = userResult.rows[0]
          
          // Get user's permissions
          const userPermissionsResult = await pool.query(`
            SELECT DISTINCT p.name
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN role_permissions rp ON ur.role_id = rp.role_id AND rp.granted = true
            JOIN permissions p ON rp.permission_id = p.id
            WHERE LOWER(u.email) = LOWER($1) AND u."isActive" = true
              AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
          `, [session.user.email])
          
          currentUserInfo.permissions = userPermissionsResult.rows.map(row => row.name)
        }
      }
    } catch (e) {
      // Ignore session errors for debug
    }

    return NextResponse.json({
      permissions: {
        total: permissionsResult.rows.length,
        list: permissionsResult.rows
      },
      roles: {
        total: rolesResult.rows.length,
        list: rolesResult.rows
      },
      rolePermissions: rolePemissionsResult.rows,
      currentUser: currentUserInfo,
      debug: {
        timestamp: new Date().toISOString(),
        message: "Database permission analysis"
      }
    })

  } catch (error) {
    console.error('❌ Debug permissions error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}