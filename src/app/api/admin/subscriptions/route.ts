import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ [SUBSCRIPTIONS-GET] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    const hasPermission = await checkCurrentUserPermission('subscriptions.page.access')
    if (!hasPermission) {
      console.log(`❌ [SUBSCRIPTIONS-GET] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [SUBSCRIPTIONS-GET] Required permission: subscriptions.page.access`)
      console.log(`📝 [SUBSCRIPTIONS-GET] Check user role and permissions in the database`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'subscriptions.page.access',
          userEmail: session.user.email,
          message: 'User does not have the required permission to access subscriptions'
        } : undefined
      }, { status: 403 })
    }

    // Get current user level, ID and access configuration for filtering
    const currentUserResult = await pool.query(`
      SELECT 
        u.id as user_id, 
        u.email, 
        r.level, 
        r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE LOWER(u.email) = LOWER($1) AND ur.is_primary = true
      LIMIT 1
    `, [session.user.email])

    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'Current user role not found' }, { status: 404 })
    }

    const currentUser = currentUserResult.rows[0]
    const currentUserId = currentUser.user_id
    const currentUserLevel = currentUser.level
    const accessType = 'filtered' // Default access type since column doesn't exist

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const userId = searchParams.get('userId')
    const packageId = searchParams.get('packageId')
    const status = searchParams.get('status')
    const createdBy = searchParams.get('createdBy')
    const paymentMethod = searchParams.get('paymentMethod')
    const skip = (page - 1) * limit

    // Build subscriptions query with hierarchical permission filtering
    let baseQuery = `
      SELECT 
        cp.id, cp."userId", cp."packageId", cp."createdBy", cp."paymentMethod",
        cp."startDate", cp."endDate", cp."isActive", cp."messagesUsed", 
        cp."createdAt", cp."updatedAt",
        cp."scheduledStartDate", cp."purchaseType", cp."previousSubscriptionId", cp.status as subscription_status,
        u.name as user_name, u.email as user_email, u.mobile as user_mobile, u.dealer_code as user_dealer_code,
        c.name as creator_name, c.email as creator_email,
        p.name as package_name, p.description as package_description, 
        p.price as package_price, p.duration as package_duration,
        p."messageLimit" as package_message_limit, p."instanceLimit" as package_instance_limit,
        CASE 
          WHEN cp.status = 'SCHEDULED' THEN 'SCHEDULED'
          WHEN cp.status = 'CANCELLED' THEN 'CANCELLED'
          WHEN cp."endDate" <= NOW() THEN 'EXPIRED'
          WHEN cp."isActive" = true AND cp."endDate" > NOW() THEN 'ACTIVE'
          WHEN cp."isActive" = false AND cp."endDate" > NOW() THEN 'PENDING'
          ELSE 'INACTIVE'
        END as computed_status
      FROM customer_packages cp
      LEFT JOIN users u ON cp."userId" = CAST(u.id AS TEXT)
      LEFT JOIN users c ON cp."createdBy" = c.id
      LEFT JOIN packages p ON cp."packageId" = p.id
      WHERE 1=1`

    // Apply hierarchical permission filtering
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - No filtering, see all subscriptions
      console.log('👑 Level 1 (SUPER USER) - Full subscription access')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Full access, no filtering
      console.log('🔐 Level 2 (ADMIN) - Full subscription access')
    } else if (currentUserLevel === 3) {
      // Level 3 (SUBDEALER) - Only their assigned customers
      console.log('🔒 Level 3 (SUBDEALER) - Filtered subscription access: assigned customers only')
      baseQuery += ` AND u."parentId" = ${currentUserId}`
    } else {
      // Level 4+ (EMPLOYEE, CUSTOMER) - Very restricted access
      console.log('🔒 Level 4+ - Restricted subscription access')
      baseQuery += ` AND u.id = ${currentUserId}` // Only themselves if they are a customer
    }

    baseQuery += `
      ORDER BY cp."createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `
    
    // Build count query with same permission filtering
    let countQuery = `
      SELECT COUNT(*)::integer as count FROM customer_packages cp
      LEFT JOIN users u ON cp."userId" = CAST(u.id AS TEXT)  
      LEFT JOIN packages p ON cp."packageId" = p.id
      WHERE 1=1`

    // Apply same hierarchical permission filtering to count query
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - No filtering
      console.log('👑 Level 1 (SUPER USER) - Full subscription count')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Full access, no filtering
      console.log('🔐 Level 2 (ADMIN) - Full subscription count')
    } else if (currentUserLevel === 3) {
      // Level 3 (SUBDEALER) - Only assigned customers
      console.log('🔒 Level 3 (SUBDEALER) - Filtered subscription count')
      countQuery += ` AND u."parentId" = ${currentUserId}`
    } else {
      // Level 4+ - Very restricted
      console.log('🔒 Level 4+ - Restricted subscription count')
      countQuery += ` AND u.id = ${currentUserId}`
    }
    
    const subscriptions = await pool.query(baseQuery)
    const totalResult = await pool.query(countQuery)
    
    const total = totalResult.rows[0]?.count || 0
    
    // Transform the data to match expected format
    const formattedSubscriptions = subscriptions.rows.map((sub: any) => ({
      id: sub.id,
      userId: sub.userId,
      packageId: sub.packageId,
      createdBy: sub.createdBy,
      paymentMethod: sub.paymentMethod || 'CASH',
      startDate: sub.startDate,
      endDate: sub.endDate,
      isActive: sub.isActive,
      messagesUsed: sub.messagesUsed,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      status: sub.computed_status || sub.subscription_status || 'INACTIVE',
      scheduledStartDate: sub.scheduledStartDate,
      purchaseType: sub.purchaseType,
      previousSubscriptionId: sub.previousSubscriptionId,
      user: {
        name: sub.user_name || 'Unknown User',
        email: sub.user_email || 'unknown@example.com',
        mobile: sub.user_mobile || null,
        dealerCode: sub.user_dealer_code || null
      },
      creator: {
        name: sub.creator_name || 'System',
        email: sub.creator_email || 'system@example.com'
      },
      package: {
        name: sub.package_name || 'Unknown Package',
        description: sub.package_description || '',
        price: sub.package_price || 0,
        duration: sub.package_duration || 0,
        messageLimit: sub.package_message_limit || 0,
        instanceLimit: sub.package_instance_limit || 0
      }
    }))

    return NextResponse.json({
      subscriptions: formattedSubscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated session for createdBy auto-fill
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('❌ [SUBSCRIPTIONS-POST] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    const hasPermission = await checkCurrentUserPermission('subscriptions.create.button')
    if (!hasPermission) {
      console.log(`❌ [SUBSCRIPTIONS-POST] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [SUBSCRIPTIONS-POST] Required permission: subscriptions.create.button`)
      console.log(`📝 [SUBSCRIPTIONS-POST] Check user role and permissions in the database`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'subscriptions.create.button',
          userEmail: session.user.email,
          message: 'User does not have the required permission to create subscriptions'
        } : undefined
      }, { status: 403 })
    }

    const body = await request.json()
    const { userId, packageId, duration, startDate, paymentMethod, startType = 'now' } = body
    
    // Get logged-in user details with role and access level
    const loggedInUserResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.biz_points,
        r.level, r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u."isActive" = true
    `, [session.user.email])
    
    if (!loggedInUserResult.rows.length) {
      return NextResponse.json({ error: 'Logged-in user not found' }, { status: 404 })
    }
    
    const loggedInUser = loggedInUserResult.rows[0]
    const createdBy = loggedInUser.id
    const currentUserLevel = loggedInUser.level
    const accessType = loggedInUser.access_type

    // Get target user details for permission check
    const targetUserResult = await pool.query('SELECT id, "parentId", name FROM users WHERE id = $1', [parseInt(userId)])
    
    if (!targetUserResult.rows.length) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }
    
    const targetUser = targetUserResult.rows[0]
    
    // Apply hierarchical permission check for subscription creation
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - Can create subscriptions for any user
      console.log('👑 Level 1 (SUPER USER) - Unrestricted subscription creation access')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Full access, can create subscriptions for any user
      console.log('🔐 Level 2 (ADMIN) - Full subscription creation access')
    } else if (currentUserLevel === 3) {
      // Level 3 - Can create subscriptions for themselves or assigned customers
      if (parseInt(userId) !== createdBy && targetUser.parentId !== createdBy) {
        console.log('❌ [SUBSCRIPTIONS-POST] Permission denied: Level 3 user trying to create subscription for unassigned user')
        console.log(`🔑 [SUBSCRIPTIONS-POST] User Level: ${currentUserLevel} (${loggedInUser.role_name})`)
        console.log(`🔑 [SUBSCRIPTIONS-POST] Target User ID: ${userId}, Creator ID: ${createdBy}, Target Parent ID: ${targetUser.parentId}`)
        console.log(`📝 [SUBSCRIPTIONS-POST] Level 3 users can only create subscriptions for themselves or their assigned customers`)
        
        return NextResponse.json({ 
          error: `As ${loggedInUser.role_name}, you can only create subscriptions for yourself or your assigned customers`,
          details: process.env.NODE_ENV === 'development' ? {
            userLevel: currentUserLevel,
            roleName: loggedInUser.role_name,
            targetUserId: parseInt(userId),
            creatorId: createdBy,
            targetParentId: targetUser.parentId,
            message: 'Level 3 users can only create subscriptions for themselves or their assigned customers (where target user parentId = current user id)'
          } : undefined
        }, { status: 403 })
      }
      console.log('✅ Level 3 permission check passed: Self or assigned customer subscription')
    } else {
      // Level 4+ - Can only create subscriptions for themselves
      if (parseInt(userId) !== createdBy) {
        console.log('❌ [SUBSCRIPTIONS-POST] Permission denied: Level 4+ user trying to create subscription for other user')
        console.log(`🔑 [SUBSCRIPTIONS-POST] User Level: ${currentUserLevel} (${loggedInUser.role_name})`)
        console.log(`🔑 [SUBSCRIPTIONS-POST] Target User ID: ${userId}, Creator ID: ${createdBy}`)
        console.log(`📝 [SUBSCRIPTIONS-POST] Level 4+ users can only create subscriptions for themselves`)
        
        return NextResponse.json({ 
          error: `As ${loggedInUser.role_name}, you can only create subscriptions for yourself`,
          details: process.env.NODE_ENV === 'development' ? {
            userLevel: currentUserLevel,
            roleName: loggedInUser.role_name,
            targetUserId: parseInt(userId),
            creatorId: createdBy,
            message: 'Level 4+ users can only create subscriptions for themselves (targetUserId must equal creatorId)'
          } : undefined
        }, { status: 403 })
      }
      console.log('✅ Level 4+ permission check passed: Self subscription')
    }

    // Validate required fields
    if (!userId || !packageId) {
      return NextResponse.json({ error: 'Missing required fields: userId and packageId' }, { status: 400 })
    }

    // Get package details
    const packageDetails = await pool.query('SELECT id, name, price, duration FROM packages WHERE id = $1', [packageId])

    if (!packageDetails.rows.length) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    const pkg = packageDetails.rows[0]
    const subscriptionId = `cs${Date.now()}${Math.random().toString(36).substring(2, 9)}`
    let start = startDate ? new Date(startDate) : new Date()
    const durationInDays = duration || pkg.duration
    let end = new Date(start.getTime() + (durationInDays * 24 * 60 * 60 * 1000))
    let scheduledStartDate = null
    let subscriptionStatus = 'ACTIVE'
    let previousSubscriptionId = null
    
    // Handle scheduled subscriptions for admin pre-expiry purchases
    if (startType === 'after_expiry') {
      // Check if target user has an active subscription
      const activeSubscriptionResult = await pool.query(`
        SELECT id, "endDate" FROM customer_packages 
        WHERE "userId" = $1 AND "isActive" = true AND status = 'ACTIVE' 
        ORDER BY "endDate" DESC LIMIT 1
      `, [userId])
      
      if (activeSubscriptionResult.rows.length > 0) {
        const currentSubscription = activeSubscriptionResult.rows[0]
        previousSubscriptionId = currentSubscription.id
        scheduledStartDate = new Date(currentSubscription.endDate)
        start = scheduledStartDate
        end = new Date(start.getTime() + (durationInDays * 24 * 60 * 60 * 1000))
        subscriptionStatus = 'SCHEDULED'
        console.log(`📅 Admin creating scheduled subscription for user ${userId} starting ${scheduledStartDate.toISOString()}`)
      } else {
        console.log(`⚠️ Admin requested scheduled start but no active subscription found for user ${userId}, creating immediate subscription`)
      }
    }

    // Handle credit-based payments for level 3 & 4 users
    let isActiveStatus = subscriptionStatus === 'ACTIVE' // Only active if immediate start
    let transactionStatus = 'PENDING'
    
    if (paymentMethod === 'CREDIT') {
      // Check user role level and message balance
      const userDetails = await pool.query(`
        SELECT u.id, u.name, u.message_balance, r.level, r.name as role_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = $1
      `, [parseInt(userId)])
      
      if (!userDetails.rows.length) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      const user = userDetails.rows[0]
      
      // Check if user is level 3 (SUBDEALER) or level 4 (EMPLOYEE)
      if (user.level !== 3 && user.level !== 4) {
        return NextResponse.json({ 
          error: 'Credit payment is only available for SUBDEALER (Level 3) and EMPLOYEE (Level 4) users' 
        }, { status: 403 })
      }
      
      // Check if user has sufficient credit balance (message_balance acts as credit)
      const packagePrice = parseFloat(pkg.price.toString())
      if (user.message_balance < packagePrice) {
        return NextResponse.json({ 
          error: `Insufficient credit balance. Available: ${user.message_balance}, Required: ${packagePrice}`,
          availableBalance: user.message_balance,
          requiredAmount: packagePrice
        }, { status: 400 })
      }
      
      // Deduct credit from user's message_balance
      await pool.query(`
        UPDATE users 
        SET message_balance = message_balance - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [packagePrice, parseInt(userId)])
      
      // Activate subscription immediately for credit payments
      isActiveStatus = true
      transactionStatus = 'SUCCESS'
      
      console.log(`💳 Credit payment processed: User ${user.name} (ID: ${userId}) used ${packagePrice} credits. Remaining balance: ${user.message_balance - packagePrice}`)
    }
    
    if (paymentMethod === 'BIZPOINTS') {
      // Check logged-in user's BizCoins balance (not the end user)
      const packagePrice = parseFloat(pkg.price.toString())
      const currentBizCoins = parseFloat(loggedInUser.biz_points?.toString() || '0')
      
      // Check if logged-in user has sufficient BizCoins balance
      if (currentBizCoins < packagePrice) {
        return NextResponse.json({ 
          error: `Insufficient BizCoins balance. Available: ${currentBizCoins}, Required: ${packagePrice}`,
          availableBalance: currentBizCoins,
          requiredAmount: packagePrice,
          payingUser: loggedInUser.name
        }, { status: 400 })
      }
      
      // Get end user details for transaction description
      const endUserResult = await pool.query(`
        SELECT u.id, u.name, u.email
        FROM users u
        WHERE u.id = $1
      `, [parseInt(userId)])
      
      if (!endUserResult.rows.length) {
        return NextResponse.json({ error: 'End user not found' }, { status: 404 })
      }
      
      const endUser = endUserResult.rows[0]
      
      // Deduct BizCoins from logged-in user's balance (not the end user)
      await pool.query(`
        UPDATE users 
        SET biz_points = biz_points - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [packagePrice, loggedInUser.id])
      
      // Create BizCoins transaction record for the logged-in user (who paid)
      const bizCoinsTransactionId = `bp${Date.now()}${Math.random().toString(36).substring(2, 9)}`
      await pool.query(`
        INSERT INTO bizpoints_transactions (
          id, user_id, type, amount, balance, description, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, 'SETTLEMENT_WITHDRAW', $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `, [
        bizCoinsTransactionId,
        loggedInUser.id,
        -packagePrice,
        currentBizCoins - packagePrice,
        `Subscription purchase for ${endUser.name}: ${pkg.name}`,
        loggedInUser.id
      ])
      
      // Activate subscription immediately for BizCoins payments
      isActiveStatus = true
      transactionStatus = 'SUCCESS'
      
      console.log(`🪙 BizCoins payment processed: ${loggedInUser.name} (ID: ${loggedInUser.id}) paid ${packagePrice} BizCoins for ${endUser.name}'s subscription. Remaining balance: ${currentBizCoins - packagePrice}`)
    }
    
    // Create subscription using raw SQL with scheduled subscription support
    await pool.query(`
      INSERT INTO customer_packages (
        id, "userId", "packageId", "createdBy", "paymentMethod", 
        "startDate", "endDate", "isActive", "messagesUsed", 
        "scheduledStartDate", "purchaseType", "previousSubscriptionId", status,
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, $12, NOW(), NOW())
    `, [
      subscriptionId, userId, packageId, createdBy || null, paymentMethod || 'CASH', 
      start, end, isActiveStatus,
      scheduledStartDate, startType === 'after_expiry' ? 'SCHEDULED' : 'IMMEDIATE', 
      previousSubscriptionId, subscriptionStatus
    ])

    // Auto-create corresponding transaction (skip for credit and BizCoins payments as they're processed immediately)
    if (paymentMethod !== 'CREDIT' && paymentMethod !== 'BIZPOINTS') {
      const transactionId = `tx${Date.now()}${Math.random().toString(36).substring(2, 9)}`
      const transactionDescription = `Subscription purchase for ${pkg.name} (${durationInDays} days)`
      
      await pool.query(`
        INSERT INTO transactions (id, "userId", "createdBy", type, method, amount, currency, status, description, reference, "createdAt", "updatedAt")
        VALUES (
          $1, $2, $3, 'PURCHASE', $4, $5, 'INR', $6, $7, $8, NOW(), NOW()
        )
      `, [
        transactionId, 
        userId, 
        createdBy || null, 
        paymentMethod || 'CASH', 
        parseFloat(pkg.price.toString()), 
        transactionStatus, 
        transactionDescription, 
        subscriptionId
      ])
    }
    
    // Fetch the created subscription with details including scheduled fields
    const subscription = await pool.query(`
      SELECT 
        cp.id, cp."userId", cp."packageId", cp."createdBy", cp."paymentMethod",
        cp."startDate", cp."endDate", cp."isActive", cp."messagesUsed", 
        cp."scheduledStartDate", cp."purchaseType", cp."previousSubscriptionId", cp.status,
        cp."createdAt", cp."updatedAt",
        u.name as user_name, u.email as user_email, u.mobile as user_mobile, u.dealer_code as user_dealer_code,
        c.name as creator_name, c.email as creator_email,
        p.name as package_name, p.description as package_description, 
        p.price as package_price, p.duration as package_duration
      FROM customer_packages cp
      LEFT JOIN users u ON cp."userId" = CAST(u.id AS TEXT)
      LEFT JOIN users c ON cp."createdBy" = c.id
      LEFT JOIN packages p ON cp."packageId" = p.id
      WHERE cp.id = $1
    `, [subscriptionId])

    return NextResponse.json({ 
      subscription: {
        id: subscription.rows[0].id,
        userId: subscription.rows[0].userId,
        packageId: subscription.rows[0].packageId,
        createdBy: subscription.rows[0].createdBy,
        paymentMethod: subscription.rows[0].paymentMethod,
        startDate: subscription.rows[0].startDate,
        endDate: subscription.rows[0].endDate,
        isActive: subscription.rows[0].isActive,
        messagesUsed: subscription.rows[0].messagesUsed,
        scheduledStartDate: subscription.rows[0].scheduledStartDate,
        purchaseType: subscription.rows[0].purchaseType,
        previousSubscriptionId: subscription.rows[0].previousSubscriptionId,
        status: subscription.rows[0].status,
        createdAt: subscription.rows[0].createdAt,
        updatedAt: subscription.rows[0].updatedAt,
        user: {
          name: subscription.rows[0].user_name,
          email: subscription.rows[0].user_email,
          mobile: subscription.rows[0].user_mobile,
          dealerCode: subscription.rows[0].user_dealer_code
        },
        creator: {
          name: subscription.rows[0].creator_name || 'System',
          email: subscription.rows[0].creator_email || 'system@example.com'
        },
        package: {
          name: subscription.rows[0].package_name,
          description: subscription.rows[0].package_description,
          price: subscription.rows[0].package_price,
          duration: subscription.rows[0].package_duration
        }
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Subscription creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ [SUBSCRIPTIONS-PUT] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    const hasPermission = await checkCurrentUserPermission('subscriptions.edit.button')
    if (!hasPermission) {
      console.log(`❌ [SUBSCRIPTIONS-PUT] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [SUBSCRIPTIONS-PUT] Required permission: subscriptions.edit.button`)
      console.log(`📝 [SUBSCRIPTIONS-PUT] Check user role and permissions in the database`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'subscriptions.edit.button',
          userEmail: session.user.email,
          message: 'User does not have the required permission to update subscriptions'
        } : undefined
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('id')

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { userId, packageId, startDate, endDate, isActive, messagesUsed, paymentMethod } = body

    // Validate required fields
    if (!userId || !packageId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if subscription exists
    const existingSubscription = await pool.query('SELECT id FROM customer_packages WHERE id = $1', [subscriptionId])

    if (!existingSubscription.rows.length) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Update subscription using raw SQL (don't modify createdBy - preserve original creator)
    await pool.query(`
      UPDATE customer_packages 
      SET "userId" = $1, 
          "packageId" = $2, 
          "paymentMethod" = $3,
          "startDate" = $4, 
          "endDate" = $5, 
          "isActive" = $6, 
          "messagesUsed" = $7, 
          "updatedAt" = NOW()
      WHERE id = $8
    `, [userId, packageId, paymentMethod || 'CASH', new Date(startDate), new Date(endDate), isActive !== undefined ? isActive : true, messagesUsed || 0, subscriptionId])
    
    // Fetch the updated subscription
    const subscription = await pool.query(`
      SELECT 
        cp.id, cp."userId", cp."packageId", cp."createdBy", cp."paymentMethod",
        cp."startDate", cp."endDate", cp."isActive", cp."messagesUsed", 
        cp."createdAt", cp."updatedAt",
        u.name as user_name, u.email as user_email, u.mobile as user_mobile, u.dealer_code as user_dealer_code,
        c.name as creator_name, c.email as creator_email,
        p.name as package_name, p.description as package_description, 
        p.price as package_price, p.duration as package_duration
      FROM customer_packages cp
      LEFT JOIN users u ON cp."userId" = CAST(u.id AS TEXT)
      LEFT JOIN users c ON cp."createdBy" = c.id
      LEFT JOIN packages p ON cp."packageId" = p.id
      WHERE cp.id = $1
    `, [subscriptionId])

    return NextResponse.json({ 
      subscription: {
        id: subscription.rows[0].id,
        userId: subscription.rows[0].userId,
        packageId: subscription.rows[0].packageId,
        createdBy: subscription.rows[0].createdBy,
        paymentMethod: subscription.rows[0].paymentMethod,
        startDate: subscription.rows[0].startDate,
        endDate: subscription.rows[0].endDate,
        isActive: subscription.rows[0].isActive,
        messagesUsed: subscription.rows[0].messagesUsed,
        createdAt: subscription.rows[0].createdAt,
        updatedAt: subscription.rows[0].updatedAt,
        user: {
          name: subscription.rows[0].user_name,
          email: subscription.rows[0].user_email,
          mobile: subscription.rows[0].user_mobile,
          dealerCode: subscription.rows[0].user_dealer_code
        },
        creator: {
          name: subscription.rows[0].creator_name || 'System',
          email: subscription.rows[0].creator_email || 'system@example.com'
        },
        package: {
          name: subscription.rows[0].package_name,
          description: subscription.rows[0].package_description,
          price: subscription.rows[0].package_price,
          duration: subscription.rows[0].package_duration
        }
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Subscription update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ [SUBSCRIPTIONS-DELETE] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    const hasPermission = await checkCurrentUserPermission('subscriptions.page.access')
    if (!hasPermission) {
      console.log(`❌ [SUBSCRIPTIONS-DELETE] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [SUBSCRIPTIONS-DELETE] Required permission: subscriptions.page.access`)
      console.log(`📝 [SUBSCRIPTIONS-DELETE] Check user role and permissions in the database`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'subscriptions.page.access',
          userEmail: session.user.email,
          message: 'User does not have the required permission to delete subscriptions'
        } : undefined
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('id')

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
    }

    // Check if subscription exists
    const existingSubscription = await pool.query('SELECT id FROM customer_packages WHERE id = $1', [subscriptionId])

    if (!existingSubscription.rows.length) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Delete subscription
    await pool.query('DELETE FROM customer_packages WHERE id = $1', [subscriptionId])

    return NextResponse.json({ message: 'Subscription deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Subscription deletion error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}