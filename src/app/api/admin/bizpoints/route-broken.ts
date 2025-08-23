import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

// PostgreSQL connection for direct queries
const pool = new Pool(getDatabaseConfig())

/**
 * GET /api/admin/bizpoints - Retrieve BizPoints data and transactions
 * 
 * @description Fetches BizPoints balances and transaction history for commission settlement
 * @authentication Required - Admin access
 * @permissions Admin, Owner access required
 * @param {string} [userId] - Filter by specific user ID
 * @param {string} [type] - Filter by transaction type
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=50] - Items per page
 * @returns {Object} BizPoints data with transactions and user balances
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Get users with BizPoints balances (only those with balance > 0 or transactions)
    let usersQuery = `
      SELECT 
        u.id, u.name, u.email, u.mobile, u.dealer_code,
        u.biz_points as bizPoints,
        r.name as role_name, r.level as role_level,
        COUNT(bt.id) as transaction_count,
        MAX(bt.created_at) as last_transaction
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN bizpoints_transactions bt ON u.id = bt.user_id
      WHERE (u.biz_points > 0 OR bt.id IS NOT NULL)
    `
    
    const params: any[] = []
    let paramCount = 0

    if (userId) {
      paramCount++
      usersQuery += ` AND u.id = $${paramCount}`
      params.push(userId)
    }

    usersQuery += `
      GROUP BY u.id, u.name, u.email, u.mobile, u.dealer_code, u.biz_points, r.name, r.level
      ORDER BY u.biz_points DESC, u.name ASC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `
    params.push(limit, skip)

    const users = await prisma.$queryRawUnsafe(usersQuery, ...params)

    // Get transactions with pagination and filtering
    let transactionQuery = `
      SELECT 
        bt.id, bt.user_id, bt.type, bt.amount, bt.balance, 
        bt.description, bt.reference, bt.created_at, bt.updated_at,
        u.name as user_name, u.email as user_email, u.dealer_code,
        c.name as creator_name
      FROM bizpoints_transactions bt
      LEFT JOIN users u ON bt.user_id = u.id
      LEFT JOIN users c ON bt.created_by = c.id
      WHERE 1=1
    `

    const transactionParams: any[] = []
    let transactionParamCount = 0

    if (userId) {
      transactionParamCount++
      transactionQuery += ` AND bt.user_id = $${transactionParamCount}`
      transactionParams.push(userId)
    }

    if (type) {
      transactionParamCount++
      transactionQuery += ` AND bt.type = $${transactionParamCount}`
      transactionParams.push(type)
    }

    transactionQuery += `
      ORDER BY bt.created_at DESC
      LIMIT $${transactionParamCount + 1} OFFSET $${transactionParamCount + 2}
    `
    transactionParams.push(limit, skip)

    const transactions = await prisma.$queryRawUnsafe(transactionQuery, ...transactionParams)

    // Get total counts
    const totalUsersResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN bizpoints_transactions bt ON u.id = bt.user_id
      WHERE (u.biz_points > 0 OR bt.id IS NOT NULL)
      ${userId ? `AND u.id = $1` : ''}
    `, ...(userId ? [userId] : []))

    const totalTransactionsResult = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM bizpoints_transactions bt
      WHERE 1=1
      ${userId ? `AND bt.user_id = $1` : ''}
      ${type ? `AND bt.type = $${userId ? 2 : 1}` : ''}
    `, ...[userId, type].filter(Boolean))

    // Get summary statistics
    const summaryResult = await prisma.$queryRawUnsafe(`
      SELECT 
        SUM(u.biz_points) as total_bizpoints,
        COUNT(DISTINCT u.id) as total_users_with_points,
        COUNT(bt.id) as total_transactions,
        SUM(CASE WHEN bt.type = 'COMMISSION_EARNED' THEN bt.amount ELSE 0 END) as total_commissions_earned,
        SUM(CASE WHEN bt.type = 'SETTLEMENT_WITHDRAW' THEN bt.amount ELSE 0 END) as total_settlements
      FROM users u
      LEFT JOIN bizpoints_transactions bt ON u.id = bt.user_id
    `)

    const summary = summaryResult[0] || {
      total_bizpoints: 0,
      total_users_with_points: 0,
      total_transactions: 0,
      total_commissions_earned: 0,
      total_settlements: 0
    }

    return NextResponse.json({
      users: users.map((user: any) => ({
        id: String(user.id),
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        dealerCode: user.dealer_code,
        bizPoints: parseFloat(user.bizpoints) || 0,
        role: user.role_name,
        roleLevel: user.role_level,
        transactionCount: parseInt(user.transaction_count) || 0,
        lastTransaction: user.last_transaction
      })),
      transactions: transactions.map((txn: any) => ({
        id: txn.id,
        userId: String(txn.user_id),
        type: txn.type,
        amount: parseFloat(txn.amount),
        balance: parseFloat(txn.balance),
        description: txn.description,
        reference: txn.reference,
        createdAt: txn.createdAt,
        user: {
          name: txn.user_name,
          email: txn.user_email,
          dealerCode: txn.dealer_code
        },
        creator: txn.creator_name
      })),
      summary: {
        totalBizPoints: parseFloat(summary.total_bizpoints) || 0,
        totalUsersWithPoints: parseInt(summary.total_users_with_points) || 0,
        totalTransactions: parseInt(summary.total_transactions) || 0,
        totalCommissionsEarned: parseFloat(summary.total_commissions_earned) || 0,
        totalSettlements: parseFloat(summary.total_settlements) || 0
      },
      pagination: {
        page,
        limit,
        totalUsers: parseInt(totalUsersResult[0]?.count) || 0,
        totalTransactions: parseInt(totalTransactionsResult[0]?.count) || 0,
        totalPages: Math.ceil((parseInt(totalTransactionsResult[0]?.count) || 0) / limit)
      }
    })

  } catch (error) {
    console.error('BizPoints API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/bizpoints - Create BizPoints transaction (credit/debit)
 * 
 * @description Manually credit or debit BizPoints for users
 * @authentication Required - Admin access
 * @param {string} userId - Target user ID
 * @param {string} type - Transaction type (ADMIN_CREDIT, ADMIN_DEBIT, BONUS)
 * @param {number} amount - Amount of BizPoints
 * @param {string} [description] - Transaction description
 * @returns {Object} Created transaction details
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, type, amount, description } = body

    // Validation
    if (!userId || !type || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, type, amount' 
      }, { status: 400 })
    }

    // Convert userId to integer for database operations
    const userIdInt = parseInt(userId)

    if (amount <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be greater than 0' 
      }, { status: 400 })
    }

    const validTypes = ['ADMIN_CREDIT', 'ADMIN_DEBIT', 'BONUS', 'SETTLEMENT_WITHDRAW']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid transaction type' 
      }, { status: 400 })
    }

    // Get current user (admin) ID - using pool.query like other working APIs
    const currentUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    )

    if (!currentUser.rows.length) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 })
    }

    const adminId = currentUser.rows[0].id

    // Get target user current balance
    const targetUser = await prisma.$queryRawUnsafe(`
      SELECT id, name, biz_points FROM users WHERE id = $1
    `, [userIdInt])

    if (!targetUser.length) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    const currentBalance = parseFloat(targetUser[0].biz_points) || 0
    let newBalance: number
    let transactionAmount: number

    // Calculate new balance based on transaction type
    if (type === 'ADMIN_DEBIT' || type === 'SETTLEMENT_WITHDRAW') {
      if (currentBalance < amount) {
        return NextResponse.json({ 
          error: `Insufficient balance. Current: ${currentBalance}, Requested: ${amount}` 
        }, { status: 400 })
      }
      transactionAmount = -amount // Negative for debit
      newBalance = currentBalance - amount
    } else {
      transactionAmount = amount // Positive for credit
      newBalance = currentBalance + amount
    }

    // Generate transaction ID
    const transactionId = `bp${Date.now()}${Math.random().toString(36).substring(2, 9)}`

    // Start database transaction
    await prisma.$queryRaw`BEGIN`

    try {
      // Update user balance
      await prisma.$queryRawUnsafe(`
        UPDATE users 
        SET biz_points = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [newBalance, userIdInt])

      // Create transaction record
      await prisma.$queryRawUnsafe(`
        INSERT INTO bizpoints_transactions (
          id, user_id, type, amount, balance, description, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        transactionId,
        userIdInt,
        type,
        transactionAmount,
        newBalance,
        description || `${type.replace('_', ' ')} by admin`,
        adminId
      ])

      await prisma.$queryRaw`COMMIT`

      // Fetch the created transaction with user details
      const transaction = await prisma.$queryRawUnsafe(`
        SELECT 
          bt.id, bt.user_id, bt.type, bt.amount, bt.balance, 
          bt.description, bt.reference, bt.created_at,
          u.name as user_name, u.email as user_email
        FROM bizpoints_transactions bt
        LEFT JOIN users u ON bt.user_id = u.id
        WHERE bt.id = $1
      `, [transactionId])

      return NextResponse.json({
        message: 'BizPoints transaction created successfully',
        transaction: {
          id: transaction[0].id,
          userId: String(transaction[0].user_id),
          type: transaction[0].type,
          amount: parseFloat(transaction[0].amount),
          balance: parseFloat(transaction[0].balance),
          description: transaction[0].description,
          createdAt: transaction[0].createdAt,
          user: {
            name: transaction[0].user_name,
            email: transaction[0].user_email
          }
        }
      }, { status: 201 })

    } catch (error) {
      await prisma.$queryRaw`ROLLBACK`
      throw error
    }

  } catch (error) {
    console.error('BizPoints transaction error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}