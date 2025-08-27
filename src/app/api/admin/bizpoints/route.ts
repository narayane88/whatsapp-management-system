import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

// PostgreSQL connection
const pool = new Pool(getDatabaseConfig())

// FAIL-SAFE UTILITIES
function safeExtract(value: any): any {
  if (Array.isArray(value)) {
    console.log(`🔧 Array detected, extracting first element:`, value)
    return value.length > 0 ? value[0] : null
  }
  return value
}

function safeString(value: any): string | null {
  const extracted = safeExtract(value)
  if (extracted === null || extracted === undefined) return null
  return String(extracted)
}

function safeInt(value: any): number | null {
  const extracted = safeExtract(value)
  if (extracted === null || extracted === undefined) return null
  const parsed = parseInt(String(extracted))
  return isNaN(parsed) ? null : parsed
}

function safeFloat(value: any): number | null {
  const extracted = safeExtract(value)
  if (extracted === null || extracted === undefined) return null
  const parsed = parseFloat(String(extracted))
  return isNaN(parsed) ? null : parsed
}

/**
 * POST /api/admin/bizpoints - FAIL-SAFE VERSION
 */
export async function POST(request: NextRequest) {
  console.log('🚀 BizPoints API - FAIL-SAFE VERSION Started')
  
  try {
    // 1. AUTHENTICATION CHECK
    const session = await getServerSession(authOptions)
    console.log('📋 Session check:', { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: session?.user?.id 
    })
    
    if (!session?.user?.email) {
      console.log('❌ [BIZPOINTS-POST] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    // 1.5. PERMISSION CHECK - Check for add bizpoints permission
    const hasPermission = await checkCurrentUserPermission('bizpoints.add.button')
    if (!hasPermission) {
      console.log(`❌ [BIZPOINTS-POST] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [BIZPOINTS-POST] Required permission: bizpoints.add.button`)
      console.log(`📝 [BIZPOINTS-POST] Check user role and permissions in the database`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'bizpoints.add.button',
          userEmail: session.user.email,
          message: 'User does not have the required permission to add/deduct bizpoints'
        } : undefined
      }, { status: 403 })
    }

    // 2. PARSE REQUEST BODY
    const body = await request.json()
    console.log('📥 Raw request body:', JSON.stringify(body, null, 2))
    console.log('📊 Body analysis:', {
      userId: { type: typeof body.userId, value: body.userId },
      type: { type: typeof body.type, value: body.type },
      amount: { type: typeof body.amount, value: body.amount },
      description: { type: typeof body.description, value: body.description }
    })

    // 3. SAFE PARAMETER EXTRACTION
    const userId = safeString(body.userId)
    const type = safeString(body.type)
    const amount = safeFloat(body.amount)
    const description = safeString(body.description)

    console.log('🔧 Extracted parameters:', {
      userId: { type: typeof userId, value: userId },
      type: { type: typeof type, value: type },
      amount: { type: typeof amount, value: amount },
      description: { type: typeof description, value: description }
    })

    // 4. VALIDATION
    if (!userId || !type || !amount) {
      console.log('❌ Validation failed')
      return NextResponse.json({ 
        error: 'Missing or invalid required fields',
        received: { 
          userId: { value: body.userId, extracted: userId },
          type: { value: body.type, extracted: type },
          amount: { value: body.amount, extracted: amount }
        }
      }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    const validTypes = ['ADMIN_CREDIT', 'ADMIN_DEBIT', 'BONUS', 'SETTLEMENT_WITHDRAW']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
    }

    // 5. GET CURRENT USER WITH PERMISSION CHECK - FAIL-SAFE METHOD
    console.log('🔍 Looking up current user with permissions...')
    const userEmail = safeString(session.user.email)
    console.log('📧 User email for lookup:', { original: session.user.email, extracted: userEmail })
    
    let currentUser
    try {
      currentUser = await pool.query(`
        SELECT 
          u.id, 
          r.level, 
          r.name as role_name
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
        JOIN roles r ON ur.role_id = r.id
        WHERE u.email = $1 AND u."isActive" = true
      `, [userEmail])
      console.log('👤 Current user query result:', { rows: currentUser.rows.length })
    } catch (dbError) {
      console.error('💥 Database error (current user):', dbError)
      return NextResponse.json({ 
        error: 'Database error - current user lookup',
        details: dbError.message 
      }, { status: 500 })
    }

    if (!currentUser.rows.length) {
      console.log('❌ Current user not found or no role assigned')
      return NextResponse.json({ error: 'Current user not found or no role assigned' }, { status: 404 })
    }

    const adminUser = currentUser.rows[0]
    const adminId = adminUser.id
    const adminLevel = adminUser.level
    const adminRole = adminUser.role_name
    const adminAccessType = 'filtered' // Default access type since column doesn't exist
    
    console.log('✅ Current user:', { 
      id: adminId, 
      level: adminLevel, 
      role: adminRole, 
      accessType: adminAccessType 
    })

    // 6. GET TARGET USER
    console.log('🎯 Looking up target user...')
    const targetUserId = safeInt(userId)
    console.log('🆔 Target user ID:', { original: userId, converted: targetUserId })

    let targetUser
    try {
      targetUser = await pool.query('SELECT id, name, biz_points FROM users WHERE id = $1', [targetUserId])
      console.log('🎯 Target user query result:', { rows: targetUser.rows.length })
    } catch (dbError) {
      console.error('💥 Database error (target user):', dbError)
      return NextResponse.json({ 
        error: 'Database error - target user lookup',
        details: dbError.message 
      }, { status: 500 })
    }

    if (!targetUser.rows.length) {
      console.log('❌ Target user not found')
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    const user = targetUser.rows[0]
    
    // 7. HIERARCHICAL PERMISSION CHECK FOR TRANSACTION CREATION
    if (adminLevel === 1) {
      // Level 1 (SUPER USER) - Can create transactions for any user
      console.log('👑 Level 1 (SUPER USER) - Unrestricted transaction creation access')
    } else if (adminLevel === 2) {
      // Level 2 (ADMIN) - Permission based on Level 1 grant
      if (adminAccessType === 'full') {
        console.log('🔐 Level 2 (ADMIN) - Full transaction creation access granted by Level 1')
      } else {
        // Filtered access - can only create for self or assigned users
        if (targetUserId !== adminId && user.parentId !== adminId) {
          console.log('❌ [BIZPOINTS-POST] Permission denied: Level 2 admin with filtered access')
          console.log(`🔑 [BIZPOINTS-POST] User Level: ${adminLevel} (${adminRole})`)
          console.log(`🔑 [BIZPOINTS-POST] Access Type: ${adminAccessType}`)
          console.log(`🔑 [BIZPOINTS-POST] Target User ID: ${targetUserId}, Admin ID: ${adminId}, Target Parent ID: ${user.parentId}`)
          
          return NextResponse.json({ 
            error: `As ${adminRole} with filtered access, you can only create transactions for yourself or your assigned users`,
            details: process.env.NODE_ENV === 'development' ? {
              userLevel: adminLevel,
              roleName: adminRole,
              accessType: adminAccessType,
              targetUserId: targetUserId,
              adminId: adminId,
              targetParentId: user.parentId,
              message: 'Level 2 admin with filtered access can only create transactions for self or assigned users'
            } : undefined
          }, { status: 403 })
        }
        console.log('✅ Level 2 permission check passed: User is self or assigned')
      }
    } else if (adminLevel === 3) {
      // Level 3 - Can create transactions for themselves or assigned customers
      if (targetUserId !== adminId && user.parentId !== adminId) {
        console.log('❌ [BIZPOINTS-POST] Permission denied: Level 3 user trying to modify unassigned user')
        console.log(`🔑 [BIZPOINTS-POST] User Level: ${adminLevel} (${adminRole})`)
        console.log(`🔑 [BIZPOINTS-POST] Target User ID: ${targetUserId}, Admin ID: ${adminId}, Target Parent ID: ${user.parentId}`)
        console.log(`📝 [BIZPOINTS-POST] Level 3 users can only create transactions for themselves or their assigned customers`)
        
        return NextResponse.json({ 
          error: `As ${adminRole}, you can only create transactions for yourself or your assigned customers`,
          details: process.env.NODE_ENV === 'development' ? {
            userLevel: adminLevel,
            roleName: adminRole,
            targetUserId: targetUserId,
            adminId: adminId,
            targetParentId: user.parentId,
            message: 'Level 3 users can only create transactions for themselves or their assigned customers (where target user parentId = current user id)'
          } : undefined
        }, { status: 403 })
      }
      console.log('✅ Level 3 permission check passed: Self or assigned customer transaction')
    } else {
      // Level 4+ - Can only create transactions for themselves
      if (targetUserId !== adminId) {
        console.log('❌ [BIZPOINTS-POST] Permission denied: Level 4+ user trying to modify other user')
        console.log(`🔑 [BIZPOINTS-POST] User Level: ${adminLevel} (${adminRole})`)
        console.log(`🔑 [BIZPOINTS-POST] Target User ID: ${targetUserId}, Admin ID: ${adminId}`)
        console.log(`📝 [BIZPOINTS-POST] Level 4+ users can only create transactions for themselves`)
        
        return NextResponse.json({ 
          error: `As ${adminRole}, you can only create transactions for yourself`,
          details: process.env.NODE_ENV === 'development' ? {
            userLevel: adminLevel,
            roleName: adminRole,
            targetUserId: targetUserId,
            adminId: adminId,
            message: 'Level 4+ users can only create transactions for themselves (targetUserId must equal adminId)'
          } : undefined
        }, { status: 403 })
      }
      console.log('✅ Level 4+ permission check passed: Self transaction')
    }
    
    const currentBalance = parseFloat(user.biz_points) || 0
    console.log('💰 Current balance:', currentBalance)

    // 8. CALCULATE NEW BALANCE
    let newBalance: number
    let transactionAmount: number

    if (type === 'ADMIN_DEBIT' || type === 'SETTLEMENT_WITHDRAW') {
      if (currentBalance < amount) {
        return NextResponse.json({ 
          error: `Insufficient balance. Current: ${currentBalance}, Requested: ${amount}` 
        }, { status: 400 })
      }
      transactionAmount = -amount
      newBalance = currentBalance - amount
    } else {
      transactionAmount = amount
      newBalance = currentBalance + amount
    }

    console.log('📊 Balance calculation:', {
      current: currentBalance,
      transaction: transactionAmount,
      new: newBalance
    })

    // 9. DATABASE TRANSACTION
    const transactionId = `bp${Date.now()}${Math.random().toString(36).substring(2, 9)}`
    console.log('🆔 Transaction ID:', transactionId)

    try {
      await pool.query('BEGIN')
      console.log('🔄 Database transaction started')

      // Update user balance
      await pool.query(
        'UPDATE users SET biz_points = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newBalance, targetUserId]
      )
      console.log('✅ User balance updated')

      // Create transaction record
      await pool.query(
        `INSERT INTO bizpoints_transactions (
          id, user_id, type, amount, balance, description, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          transactionId,
          targetUserId,
          type,
          transactionAmount,
          newBalance,
          description || `${type.replace('_', ' ')} by admin`,
          adminId
        ]
      )
      console.log('✅ Transaction record created')

      await pool.query('COMMIT')
      console.log('✅ Database transaction committed')

      // Get the created transaction
      const result = await pool.query(
        `SELECT bt.id, bt.user_id, bt.type, bt.amount, bt.balance, bt.description, bt.created_at,
                u.name as user_name, u.email as user_email
         FROM bizpoints_transactions bt
         LEFT JOIN users u ON bt.user_id = u.id
         WHERE bt.id = $1`,
        [transactionId]
      )

      const transaction = result.rows[0]

      return NextResponse.json({
        message: 'BizPoints transaction created successfully',
        transaction: {
          id: transaction.id,
          userId: String(transaction.user_id),
          type: transaction.type,
          amount: parseFloat(transaction.amount),
          balance: parseFloat(transaction.balance),
          description: transaction.description,
          createdAt: transaction.created_at,
          user: {
            name: transaction.user_name,
            email: transaction.user_email
          }
        }
      }, { status: 201 })

    } catch (dbError) {
      await pool.query('ROLLBACK')
      console.error('💥 Database transaction error:', dbError)
      return NextResponse.json({ 
        error: 'Database transaction failed',
        details: dbError.message 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('💥 BizPoints API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/bizpoints - FETCH ALL BIZPOINTS DATA
 */
export async function GET(request: NextRequest) {
  console.log('🚀 BizPoints GET API - FAIL-SAFE VERSION Started')
  
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ [BIZPOINTS-GET] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    // Permission check for accessing bizpoints page
    const hasPermission = await checkCurrentUserPermission('bizpoints.page.access')
    if (!hasPermission) {
      console.log(`❌ [BIZPOINTS-GET] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [BIZPOINTS-GET] Required permission: bizpoints.page.access`)
      console.log(`📝 [BIZPOINTS-GET] Check user role and permissions in the database`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'bizpoints.page.access',
          userEmail: session.user.email,
          message: 'User does not have the required permission to access bizpoints data'
        } : undefined
      }, { status: 403 })
    }

    console.log('✅ Authenticated user:', session.user.email)

    // Get current user's role level and access configuration
    console.log('🔍 Getting current user role level and permissions...')
    const currentUserResult = await pool.query(`
      SELECT 
        u.id as user_id, 
        u.email, 
        r.level, 
        r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u."isActive" = true
    `, [session.user.email])

    if (!currentUserResult.rows.length) {
      console.log('❌ Current user not found or no role assigned')
      return NextResponse.json({ error: 'User not found or no role assigned' }, { status: 404 })
    }

    const currentUser = currentUserResult.rows[0]
    const currentUserId = currentUser.user_id
    const currentUserLevel = currentUser.level
    const accessType = 'filtered' // Default access type since column doesn't exist
    
    console.log('👤 Current user:', { 
      id: currentUserId, 
      level: currentUserLevel, 
      role: currentUser.role_name,
      accessType: accessType
    })

    // Apply hierarchical permission-based filtering for users
    console.log('🔍 Fetching users with BizPoints...')
    let usersQuery = `
      SELECT 
        u.id, u.name, u.email, u.phone as mobile, u.dealer_code,
        COALESCE(u.biz_points, 0) as biz_points,
        r.name as role, r.level as role_level,
        COUNT(bt.id) as transaction_count,
        MAX(bt.created_at) as last_transaction
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN bizpoints_transactions bt ON u.id = bt.user_id
      WHERE u."isActive" = true`
    
    // Apply hierarchical permission system
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - Full unrestricted access to everything
      console.log('👑 Level 1 (SUPER USER) - Full unrestricted access to all data')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Full access, no filtering
      console.log('🔐 Level 2 (ADMIN) - Full access to all data')
    } else if (currentUserLevel === 3) {
      // Level 3 - Filtered access to own account + assigned customers
      console.log('🔒 Level 3 - Filtered access: self + assigned customers')
      usersQuery += ` AND (u.id = ${currentUserId} OR u."parentId" = ${currentUserId})`
    } else {
      // Level 4+ - Only filtered access to own account
      console.log('🔒 Level 4+ - Restricted access: self only')
      usersQuery += ` AND u.id = ${currentUserId}`
    }
    
    usersQuery += `
      GROUP BY u.id, u.name, u.email, u.phone, u.dealer_code, u.biz_points, r.name, r.level
      ORDER BY u.biz_points DESC, u.name ASC`
    
    const usersResult = await pool.query(usersQuery)

    console.log(`📊 Found ${usersResult.rows.length} users`)

    // Apply hierarchical permission-based filtering for transactions
    console.log('🔍 Fetching recent transactions...')
    let transactionsQuery = `
      SELECT 
        bt.id, bt.user_id, bt.type, bt.amount, bt.balance, 
        bt.description, bt.reference, bt.created_at,
        u.name as user_name, u.email as user_email, u.dealer_code
      FROM bizpoints_transactions bt
      LEFT JOIN users u ON bt.user_id = u.id
      WHERE 1=1`
    
    // Apply same hierarchical permission system for transactions
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - Full unrestricted access to all transactions
      console.log('👑 Level 1 (SUPER USER) - Full access to all transactions')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Full access, no filtering
      console.log('🔐 Level 2 (ADMIN) - Full transaction access')
    } else if (currentUserLevel === 3) {
      // Level 3 - Own transactions + assigned customer transactions
      console.log('🔒 Level 3 - Filtered transactions: self + assigned customers')
      transactionsQuery += ` AND (u.id = ${currentUserId} OR u."parentId" = ${currentUserId})`
    } else {
      // Level 4+ - Only own transactions
      console.log('🔒 Level 4+ - Restricted transactions: self only')
      transactionsQuery += ` AND u.id = ${currentUserId}`
    }
    
    transactionsQuery += `
      ORDER BY bt.created_at DESC
      LIMIT 50`
    
    const transactionsResult = await pool.query(transactionsQuery)

    console.log(`📊 Found ${transactionsResult.rows.length} transactions`)

    // Apply hierarchical permission-based filtering for summary statistics
    console.log('🔍 Calculating summary statistics...')
    let summaryQuery = `
      SELECT 
        COALESCE(SUM(u.biz_points), 0) as total_biz_points,
        COUNT(CASE WHEN u.biz_points > 0 THEN 1 END) as users_with_points,
        COUNT(bt.id) as total_transactions,
        COALESCE(SUM(CASE WHEN bt.type = 'COMMISSION_EARNED' THEN bt.amount ELSE 0 END), 0) as total_commissions,
        COALESCE(SUM(CASE WHEN bt.type = 'SETTLEMENT_WITHDRAW' THEN ABS(bt.amount) ELSE 0 END), 0) as total_settlements
      FROM users u
      LEFT JOIN bizpoints_transactions bt ON u.id = bt.user_id
      WHERE u."isActive" = true`
    
    // Apply same hierarchical permission system for summary
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - Global summary statistics
      console.log('👑 Level 1 (SUPER USER) - Global summary statistics')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Full access, no filtering
      console.log('🔐 Level 2 (ADMIN) - Full summary access')
    } else if (currentUserLevel === 3) {
      // Level 3 - Own summary + assigned customer summary
      console.log('🔒 Level 3 - Filtered summary: self + assigned customers')
      summaryQuery += ` AND (u.id = ${currentUserId} OR u."parentId" = ${currentUserId})`
    } else {
      // Level 4+ - Only own summary
      console.log('🔒 Level 4+ - Restricted summary: self only')
      summaryQuery += ` AND u.id = ${currentUserId}`
    }
    
    const summaryResult = await pool.query(summaryQuery)

    const summary = summaryResult.rows[0]
    console.log('📈 Summary calculated:', summary)

    // Format the response data
    const users = usersResult.rows.map(user => ({
      id: String(user.id),
      name: user.name,
      email: user.email,
      mobile: user.mobile || '',
      dealerCode: user.dealer_code || '',
      bizCoins: parseFloat(user.biz_points) || 0,
      role: user.role || 'USER',
      roleLevel: parseInt(user.role_level) || 0,
      transactionCount: parseInt(user.transaction_count) || 0,
      lastTransaction: user.last_transaction
    }))

    const transactions = transactionsResult.rows.map(txn => ({
      id: txn.id,
      userId: String(txn.user_id),
      type: txn.type,
      amount: parseFloat(txn.amount),
      balance: parseFloat(txn.balance),
      description: txn.description,
      reference: txn.reference,
      createdAt: txn.created_at,
      user: {
        name: txn.user_name,
        email: txn.user_email,
        dealerCode: txn.dealer_code || ''
      },
      creator: null // Will be populated if needed
    }))

    const responseData = {
      users,
      transactions,
      summary: {
        totalBizCoins: parseFloat(summary.total_biz_points) || 0,
        totalUsersWithCoins: parseInt(summary.users_with_points) || 0,
        totalTransactions: parseInt(summary.total_transactions) || 0,
        totalCommissionsEarned: parseFloat(summary.total_commissions) || 0,
        totalSettlements: parseFloat(summary.total_settlements) || 0
      },
      pagination: {
        page: 1,
        limit: 50,
        total: users.length,
        pages: 1
      }
    }

    console.log('✅ Returning data:', {
      usersCount: users.length,
      transactionsCount: transactions.length,
      totalBizPoints: responseData.summary.totalBizPoints
    })

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('💥 BizPoints GET API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}