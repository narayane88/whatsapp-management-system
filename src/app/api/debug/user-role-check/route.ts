import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email') || 'narayanesagar@gmail.com'

    console.log(`🔍 Checking user role and permissions for: ${userEmail}`)

    // Check if user exists and get their role assignments
    const userResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.dealer_code, u."isActive",
        r.id as role_id, r.name as role_name, r.level,
        ur.is_primary, ur.expires_at
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
      ORDER BY ur.is_primary DESC
    `, [userEmail])

    if (userResult.rows.length === 0) {
      console.log(`❌ User not found in database: ${userEmail}`)
      return NextResponse.json({ 
        error: 'User not found',
        userEmail,
        found: false
      })
    }

    const user = userResult.rows[0]
    console.log(`👤 Found user: ${user.name} (ID: ${user.id}) with role: ${user.role_name}`)

    // Get user's actual permissions through their roles
    const permissionsResult = await pool.query(`
      SELECT DISTINCT 
        p.id, p.name as permission_name, p.description,
        rp.granted,
        r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = $1
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      ORDER BY p.name
    `, [userEmail])

    console.log(`🔐 Found ${permissionsResult.rows.length} total permission entries`)

    const grantedPermissions = permissionsResult.rows.filter(p => p.granted === true)
    const deniedPermissions = permissionsResult.rows.filter(p => p.granted === false)

    console.log(`✅ Granted: ${grantedPermissions.length}, ❌ Denied: ${deniedPermissions.length}`)

    // Specifically check customers.create
    const customersCreatePermission = permissionsResult.rows.find(p => p.permission_name === 'customers.create')

    // Check the dynamic permission manager path
    const dynamicCheckResult = await pool.query(`
      SELECT 
        r.name as role_name,
        COUNT(rp.permission_id) as total_permissions,
        COUNT(CASE WHEN rp.granted = true THEN 1 END) as granted_permissions
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      WHERE u.email = $1
      GROUP BY r.name
    `, [userEmail])

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dealer_code: user.dealer_code,
        role: user.role_name,
        is_active: user.isActive
      },
      allRoles: userResult.rows,
      permissions: {
        total: permissionsResult.rows.length,
        granted: grantedPermissions.length,
        denied: deniedPermissions.length,
        grantedList: grantedPermissions.map(p => p.permission_name),
        deniedList: deniedPermissions.map(p => p.permission_name),
        fullList: permissionsResult.rows
      },
      customersCreateCheck: {
        found: !!customersCreatePermission,
        granted: customersCreatePermission?.granted || false,
        details: customersCreatePermission || null
      },
      roleStats: dynamicCheckResult.rows,
      debug: {
        userEmail,
        timestamp: new Date().toISOString(),
        userFound: true,
        hasRole: !!user.role_name
      }
    })

  } catch (error) {
    console.error('❌ User role check error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}