import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roleName = searchParams.get('role') || 'Shree Delaler'

    console.log(`🔍 DEBUG: Checking permissions for role: "${roleName}"`)

    // Get role permissions
    const rolePermissionsResult = await pool.query(`
      SELECT 
        r.id as role_id,
        r.name as role_name,
        r.level,
        p.id as permission_id,
        p.name as permission_name,
        p.description,
        rp.granted
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = $1
      ORDER BY p.name
    `, [roleName])

    // Get current user's role assignments
    const currentUserResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email,
        r.name as role_name,
        ur.is_primary
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = $1
    `, [roleName])

    console.log(`📊 Found ${rolePermissionsResult.rows.length} permission entries for role "${roleName}"`)

    return NextResponse.json({
      role: roleName,
      permissions: rolePermissionsResult.rows,
      usersWithRole: currentUserResult.rows,
      stats: {
        totalPermissions: rolePermissionsResult.rows.length,
        grantedPermissions: rolePermissionsResult.rows.filter(p => p.granted).length,
        deniedPermissions: rolePermissionsResult.rows.filter(p => p.granted === false).length,
        usersWithRole: currentUserResult.rows.length
      }
    })

  } catch (error) {
    console.error('❌ Role permissions debug error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}