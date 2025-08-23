import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || '6'

    console.log(`🔍 DEBUG: Checking database data for user ID ${userId}`)

    // Check user basic info
    const userInfo = await pool.query(`
      SELECT id, name, email, dealer_code, "isActive"
      FROM users 
      WHERE id = $1
    `, [userId])

    // Check user roles
    const userRoles = await pool.query(`
      SELECT ur.*, r.name as role_name, r.level as role_level
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `, [userId])

    // Check direct permissions
    const directPermissions = await pool.query(`
      SELECT up.*, p.name as permission_name
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1
    `, [userId])

    // Check role permissions (if user has roles)
    let rolePermissions = { rows: [] }
    if (userRoles.rows.length > 0) {
      const roleIds = userRoles.rows.map(ur => ur.role_id)
      rolePermissions = await pool.query(`
        SELECT rp.*, r.name as role_name, p.name as permission_name
        FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ANY($1) AND rp.granted = true
        ORDER BY r.name, p.name
      `, [roleIds])
    }

    // Check total system permissions count
    const totalPermissions = await pool.query(`
      SELECT COUNT(*) as count FROM permissions WHERE is_system = true
    `)

    // Check total roles count
    const totalRoles = await pool.query(`
      SELECT COUNT(*) as count FROM roles
    `)

    const result = {
      userId: parseInt(userId),
      userInfo: userInfo.rows[0] || null,
      userRoles: userRoles.rows,
      directPermissions: directPermissions.rows,
      rolePermissions: rolePermissions.rows,
      stats: {
        totalSystemPermissions: totalPermissions.rows[0]?.count || 0,
        totalRoles: totalRoles.rows[0]?.count || 0,
        userDirectPermissions: directPermissions.rows.length,
        userRolePermissions: rolePermissions.rows.length,
        userTotalRoles: userRoles.rows.length
      },
      debug: {
        timestamp: new Date().toISOString(),
        message: `Debug data for user ${userId}`
      }
    }

    console.log(`📊 DEBUG RESULT:`, JSON.stringify(result, null, 2))

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Debug user data error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}