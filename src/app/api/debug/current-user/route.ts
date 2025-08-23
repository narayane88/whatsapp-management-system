import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const pool = new Pool(getDatabaseConfig())

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log(`🔍 DEBUG: Session user email: ${session?.user?.email || 'No session'}`)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    // Get current user's complete info
    const userResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.dealer_code, u."isActive",
        r.id as role_id, r.name as role_name, r.level,
        ur.is_primary, ur.granted_at, ur.expires_at
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
      ORDER BY ur.is_primary DESC, ur.granted_at DESC
    `, [session.user.email])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const user = userResult.rows[0]
    console.log(`👤 Found user: ${user.name} (${user.email}) with role: ${user.role_name}`)

    // Get user's permissions via role
    const userPermissionsResult = await pool.query(`
      SELECT DISTINCT 
        p.id, p.name, p.description,
        rp.granted
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = $1 AND rp.granted = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      ORDER BY p.name
    `, [session.user.email])

    console.log(`🔐 Found ${userPermissionsResult.rows.length} granted permissions for user`)

    // Check specific customers.create permission
    const customersCreateCheck = await pool.query(`
      SELECT 
        p.name as permission_name,
        rp.granted,
        r.name as role_name,
        ur.is_primary
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = $1 AND p.name = 'customers.create'
    `, [session.user.email])

    return NextResponse.json({
      user: userResult.rows[0],
      allRoles: userResult.rows,
      permissions: userPermissionsResult.rows,
      customersCreateCheck: customersCreateCheck.rows,
      debug: {
        sessionEmail: session.user.email,
        sessionRole: session.user.role,
        dbRoleName: user.role_name,
        totalPermissions: userPermissionsResult.rows.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Current user debug error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}