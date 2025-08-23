import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// GET /api/admin/users/commission-rate - Get current user's commission rate
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's commission rate
    const userResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email,
        COALESCE(u.commission_rate, 0) as commission_rate,
        r.level, r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      JOIN roles r ON ur.role_id = r.id
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
        level: user.level,
        role: user.role_name
      },
      commissionRate: user.commission_rate,
      eligibleForPurchase: user.level >= 3,
      allowedPaymentMethods: user.level >= 3 ? ['RAZORPAY'] : ['CASH', 'BANK', 'UPI', 'RAZORPAY', 'GATEWAY', 'WALLET']
    })

  } catch (error) {
    console.error('Get commission rate error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}