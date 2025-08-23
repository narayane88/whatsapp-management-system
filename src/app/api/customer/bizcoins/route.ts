import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getImpersonationContext, hasCustomerAccess } from '@/lib/impersonation'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// GET - Get user's current balance and recent transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get impersonation context
    const impersonation = await getImpersonationContext(request)
    
    if (!hasCustomerAccess(session, impersonation.isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user accessing BizCoins for customer ID: ${userId}`)
    }
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get current balance (from most recent transaction)
    const balanceResult = await pool.query(`
      SELECT balance 
      FROM bizpoints_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId])

    const currentBalance = balanceResult.rows.length > 0 ? parseFloat(balanceResult.rows[0].balance) : 0

    // Get transaction history
    const transactionsResult = await pool.query(`
      SELECT 
        id,
        type,
        amount,
        description,
        reference,
        balance,
        created_at,
        metadata
      FROM bizpoints_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [userId, limit, skip])

    // Get total count for pagination
    const countResult = await pool.query(`
      SELECT COUNT(*)::integer as count
      FROM bizpoints_transactions 
      WHERE user_id = $1
    `, [userId])

    const totalCount = countResult.rows[0]?.count || 0

    // Get summary statistics
    const statsResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)::numeric as total_earned,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END)::numeric as total_spent,
        COUNT(CASE WHEN amount > 0 THEN 1 END)::integer as earnings_count,
        COUNT(CASE WHEN amount < 0 THEN 1 END)::integer as spending_count
      FROM bizpoints_transactions 
      WHERE user_id = $1
    `, [userId])

    const stats = statsResult.rows[0] || {
      total_earned: 0,
      total_spent: 0,
      earnings_count: 0,
      spending_count: 0
    }

    // Format transactions
    const transactions = transactionsResult.rows.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount),
      description: tx.description,
      reference: tx.reference,
      balance: parseFloat(tx.balance),
      createdAt: tx.created_at,
      metadata: tx.metadata
    }))

    return NextResponse.json({
      balance: {
        current: currentBalance,
        formatted: currentBalance.toLocaleString('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2
        })
      },
      stats: {
        totalEarned: parseFloat(stats.total_earned || 0),
        totalSpent: parseFloat(stats.total_spent || 0),
        earningsCount: stats.earnings_count,
        spendingCount: stats.spending_count,
        netBalance: currentBalance
      },
      transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('BizCoins API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Add new transaction (for purchases, bonuses, etc.)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get impersonation context
    const impersonation = await getImpersonationContext(request)
    
    if (!hasCustomerAccess(session, impersonation.isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { amount, type, description, reference, metadata } = body

    if (!amount || !type || !description) {
      return NextResponse.json({ 
        error: 'Missing required fields: amount, type, description' 
      }, { status: 400 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user creating BizCoins transaction for customer ID: ${userId}`)
    }

    // Get current balance
    const balanceResult = await pool.query(`
      SELECT balance 
      FROM bizpoints_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId])

    const currentBalance = balanceResult.rows.length > 0 ? parseFloat(balanceResult.rows[0].balance) : 0
    const newBalance = currentBalance + parseFloat(amount)

    // Create transaction ID
    const transactionId = `bp${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Insert new transaction
    const insertResult = await pool.query(`
      INSERT INTO bizpoints_transactions (
        id, user_id, type, amount, description, reference, balance, metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      ) RETURNING *
    `, [
      transactionId,
      userId,
      type,
      parseFloat(amount),
      description,
      reference || null,
      newBalance,
      metadata ? JSON.stringify(metadata) : null
    ])

    const newTransaction = insertResult.rows[0]

    return NextResponse.json({
      transaction: {
        id: newTransaction.id,
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description,
        reference: newTransaction.reference,
        balance: parseFloat(newTransaction.balance),
        createdAt: newTransaction.created_at,
        metadata: newTransaction.metadata
      },
      newBalance: parseFloat(newTransaction.balance),
      message: 'Transaction completed successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('BizCoins transaction error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}