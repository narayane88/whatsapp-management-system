import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

// PostgreSQL connection
const pool = new Pool(getDatabaseConfig())

// GET /api/admin/users/[id]/bizpoints - Get specific user's BizCoins balance
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = await params

    // Get user's BizCoins balance and info
    const userResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.dealer_code,
        COALESCE(u.biz_points, 0) as biz_points,
        r.name as role, r.level as role_level
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND u."isActive" = true
    `, [parseInt(userId)])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Get recent transactions for this user
    const transactionsResult = await pool.query(`
      SELECT id, type, amount, description, created_at
      FROM bizpoints_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [parseInt(userId)])

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        dealerCode: user.dealer_code,
        role: user.role,
        roleLevel: user.role_level
      },
      bizPointsBalance: parseFloat(user.biz_points) || 0,
      commissionRate: 0, // Can be calculated based on role if needed
      canUseBizPoints: parseFloat(user.biz_points) > 0,
      recentTransactions: transactionsResult.rows.map(txn => ({
        id: txn.id,
        type: txn.type,
        amount: parseFloat(txn.amount),
        description: txn.description,
        createdAt: txn.created_at
      }))
    })

  } catch (error) {
    console.error('Get user BizCoins error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}