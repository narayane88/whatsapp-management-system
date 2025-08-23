import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// GET /api/users/current - Get current logged-in user info
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user details with role and level
    const userResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.dealer_code,
        u."isActive", u.created_at, u.dealer_type,
        r.name as role, r.level as roleLevel
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u."isActive" = true
    `, [session.user.email])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult.rows[0]

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dealer_code: user.dealer_code,
        role: user.role,
        roleLevel: user.rolelevel,
        dealer_type: user.dealer_type,
        isActive: user.isActive,
        created_at: user.created_at
      }
    })

  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}