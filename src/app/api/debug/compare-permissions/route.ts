import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'deal@abc.com'

    console.log(`🔍 COMPARISON: Checking permissions for ${email}`)

    // Find user by email
    const userInfo = await pool.query(`
      SELECT u.id, u.name, u.email, u.dealer_code, u."isActive",
             r.name as role_name, r.level as role_level
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE LOWER(u.email) = LOWER($1)
    `, [email])

    if (userInfo.rows.length === 0) {
      return NextResponse.json({ error: `User ${email} not found` }, { status: 404 })
    }

    const user = userInfo.rows[0]
    console.log(`👤 Found user:`, user)

    // 1. Get permissions shown in User Management (what admin sees)
    const directPermissions = await pool.query(`
      SELECT up.*, p.name as permission_name, p.description
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1 AND up.granted = true
      ORDER BY p.name
    `, [user.id])

    const rolePermissions = await pool.query(`
      SELECT 
        p.id as permission_id,
        p.name as permission_name,
        p.description as permission_description,
        r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = $1 AND rp.granted = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      ORDER BY p.name
    `, [user.id])

    // 2. Get permissions via auth API (what user gets when logged in)
    const authPermissions = await pool.query(`
      SELECT DISTINCT p.name
      FROM permissions p
      WHERE (
        -- Only via direct user permissions
        EXISTS (
          SELECT 1 FROM users u
          JOIN user_permissions up ON u.id = up.user_id
          WHERE LOWER(u.email) = LOWER($1)
          AND up.permission_id = p.id
          AND up.granted = true
          AND u."isActive" = true
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
        )
      )
      ORDER BY p.name
    `, [email])

    // Create comparison
    const userManagementPerms = new Set([
      ...directPermissions.rows.map(p => p.permission_name),
      ...rolePermissions.rows.map(p => p.permission_name)
    ])

    const loginPerms = new Set(authPermissions.rows.map(p => p.name))

    // Find differences
    const onlyInUserManagement = [...userManagementPerms].filter(p => !loginPerms.has(p))
    const onlyInLogin = [...loginPerms].filter(p => !userManagementPerms.has(p))
    const common = [...userManagementPerms].filter(p => loginPerms.has(p))

    const result = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name,
        level: user.role_level,
        isActive: user.isActive
      },
      userManagementView: {
        directPermissions: directPermissions.rows,
        rolePermissions: rolePermissions.rows,
        totalPermissions: userManagementPerms.size,
        permissionsList: Array.from(userManagementPerms).sort()
      },
      loginAuthView: {
        totalPermissions: loginPerms.size,
        permissionsList: Array.from(loginPerms).sort()
      },
      comparison: {
        commonPermissions: common.length,
        onlyInUserManagement: onlyInUserManagement.length > 0 ? onlyInUserManagement.sort() : [],
        onlyInLogin: onlyInLogin.length > 0 ? onlyInLogin.sort() : [],
        match: onlyInUserManagement.length === 0 && onlyInLogin.length === 0,
        summary: {
          userManagementTotal: userManagementPerms.size,
          loginTotal: loginPerms.size,
          commonCount: common.length,
          discrepancyCount: onlyInUserManagement.length + onlyInLogin.length
        }
      },
      debug: {
        timestamp: new Date().toISOString(),
        message: `Permission comparison for ${email}`
      }
    }

    console.log(`📊 COMPARISON RESULT:`, {
      userManagementPerms: userManagementPerms.size,
      loginPerms: loginPerms.size,
      match: result.comparison.match,
      discrepancies: result.comparison.discrepancyCount
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Compare permissions error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}