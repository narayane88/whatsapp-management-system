import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'

const pool = new Pool(getDatabaseConfig())

// GET /api/customer/bizcoins/balance - Get customer's bizcoin balance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's bizcoin balance
    const userResult = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        COALESCE(u.biz_points, 0) as balance,
        (
          SELECT COUNT(*) 
          FROM bizpoints_transactions bt 
          WHERE bt.user_id = u.id
        ) as total_transactions,
        (
          SELECT SUM(CASE WHEN bt.type = 'CREDIT' THEN bt.amount ELSE 0 END)
          FROM bizpoints_transactions bt 
          WHERE bt.user_id = u.id
        ) as total_earned,
        (
          SELECT SUM(CASE WHEN bt.type = 'DEBIT' THEN ABS(bt.amount) ELSE 0 END)
          FROM bizpoints_transactions bt 
          WHERE bt.user_id = u.id
        ) as total_spent,
        (
          SELECT bt.created_at
          FROM bizpoints_transactions bt 
          WHERE bt.user_id = u.id
          ORDER BY bt.created_at DESC
          LIMIT 1
        ) as last_transaction_date
      FROM users u
      WHERE LOWER(u.email) = LOWER($1)
    `, [session.user.email])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    const userData = userResult.rows[0]

    // Get recent transactions (last 5)
    const transactionsResult = await pool.query(`
      SELECT 
        bt.id,
        bt.type,
        bt.amount,
        bt.balance,
        bt.description,
        bt.reference,
        bt.created_at
      FROM bizpoints_transactions bt
      WHERE bt.user_id = $1
      ORDER BY bt.created_at DESC
      LIMIT 5
    `, [userData.id])

    // Calculate statistics
    const stats = {
      balance: parseFloat(userData.balance) || 0,
      totalEarned: parseFloat(userData.total_earned) || 0,
      totalSpent: parseFloat(userData.total_spent) || 0,
      totalTransactions: parseInt(userData.total_transactions) || 0,
      lastTransactionDate: userData.last_transaction_date,
      conversionRate: 1, // 1 bizcoin = ₹1
      equivalentValue: parseFloat(userData.balance) || 0 // in rupees
    }

    return NextResponse.json({
      success: true,
      balance: stats.balance,
      stats,
      recentTransactions: transactionsResult.rows,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name
      }
    })

  } catch (error) {
    console.error('Bizcoin balance API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch bizcoin balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/customer/bizcoins/balance - Update bizcoin balance (for testing)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, type, description } = body

    if (!amount || !type) {
      return NextResponse.json({ 
        error: 'Amount and type are required' 
      }, { status: 400 })
    }

    if (type !== 'CREDIT' && type !== 'DEBIT') {
      return NextResponse.json({ 
        error: 'Type must be either CREDIT or DEBIT' 
      }, { status: 400 })
    }

    // Get user ID
    const userResult = await pool.query(`
      SELECT id, COALESCE(biz_points, 0) as current_balance
      FROM users
      WHERE LOWER(email) = LOWER($1)
    `, [session.user.email])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    const user = userResult.rows[0]
    const currentBalance = parseFloat(user.current_balance)
    const transactionAmount = type === 'CREDIT' ? Math.abs(amount) : -Math.abs(amount)
    const newBalance = currentBalance + transactionAmount

    // Check if debit would result in negative balance
    if (newBalance < 0) {
      return NextResponse.json({ 
        error: 'Insufficient bizcoin balance',
        currentBalance,
        requestedAmount: Math.abs(amount)
      }, { status: 400 })
    }

    // Start transaction
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // Update user balance
      await client.query(`
        UPDATE users 
        SET biz_points = $1
        WHERE id = $2
      `, [newBalance, user.id])

      // Record transaction
      await client.query(`
        INSERT INTO bizpoints_transactions (
          user_id, type, amount, balance, description, reference
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        user.id,
        type,
        transactionAmount,
        newBalance,
        description || `Bizcoin ${type.toLowerCase()}`,
        `MANUAL_${Date.now()}`
      ])

      await client.query('COMMIT')

      return NextResponse.json({
        success: true,
        message: `Bizcoin balance updated successfully`,
        previousBalance: currentBalance,
        newBalance,
        transaction: {
          type,
          amount: Math.abs(amount),
          description
        }
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Bizcoin update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update bizcoin balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}