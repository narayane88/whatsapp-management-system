import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roleName = searchParams.get('role') || 'Shree Delaler'
    const permissionName = searchParams.get('permission') || 'customers.create'

    console.log(`🔍 Checking if role "${roleName}" has permission "${permissionName}"`)

    // Check role-permission mapping
    const checkResult = await pool.query(`
      SELECT 
        r.name as role_name,
        p.name as permission_name,
        rp.granted,
        r.level
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = $1 AND p.name = $2
    `, [roleName, permissionName])

    const hasPermission = checkResult.rows.length > 0 && checkResult.rows[0].granted === true

    console.log(`✅ Result: Role "${roleName}" ${hasPermission ? 'HAS' : 'DOES NOT HAVE'} permission "${permissionName}"`)

    return NextResponse.json({
      role: roleName,
      permission: permissionName,
      hasPermission,
      details: checkResult.rows[0] || null,
      message: hasPermission 
        ? `✅ Permission "${permissionName}" is GRANTED for role "${roleName}"`
        : `❌ Permission "${permissionName}" is DENIED for role "${roleName}"`
    })

  } catch (error) {
    console.error('❌ Permission check error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}