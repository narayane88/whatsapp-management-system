import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getImpersonationContext, hasCustomerAccess } from '@/lib/impersonation'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// GET - Get available packages and user's current subscriptions
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
      console.log(`🎭 Admin user accessing subscription data for customer ID: ${userId}`)
    }

    // Get all active packages
    const packagesResult = await pool.query(`
      SELECT 
        id,
        name,
        description,
        price,
        duration,
        "messageLimit",
        "instanceLimit",
        features,
        mobile_accounts_limit,
        contact_limit,
        api_key_limit,
        receive_msg_limit,
        webhook_limit,
        footmark_enabled,
        footmark_text,
        package_color,
        offer_price,
        offer_enabled
      FROM packages 
      WHERE "isActive" = true
      ORDER BY price ASC
    `)

    // Get user's current active subscription including message balance
    const currentSubscriptionResult = await pool.query(`
      SELECT 
        cp.id,
        cp."userId",
        cp."packageId",
        cp."startDate",
        cp."endDate",
        cp."isActive",
        cp."messagesUsed",
        cp."paymentMethod",
        cp."scheduledStartDate",
        cp."purchaseType",
        cp."previousSubscriptionId",
        cp.status as subscription_status,
        p.name as package_name,
        p.price,
        p."messageLimit",
        p."instanceLimit",
        u.message_balance,
        CASE 
          WHEN cp.status = 'SCHEDULED' THEN 'SCHEDULED'
          WHEN cp."endDate" <= NOW() THEN 'EXPIRED'
          WHEN cp."isActive" = true AND cp."endDate" > NOW() THEN 'ACTIVE'
          WHEN cp."isActive" = false AND cp."endDate" > NOW() THEN 'PENDING'
          ELSE 'INACTIVE'
        END as status
      FROM customer_packages cp
      JOIN packages p ON cp."packageId" = p.id
      JOIN users u ON cp."userId" = u.id::text
      WHERE cp."userId" = $1::text 
        AND (
          (cp."isActive" = true AND cp."endDate" > CURRENT_TIMESTAMP) OR
          cp.status = 'SCHEDULED'
        )
      ORDER BY 
        CASE WHEN cp.status = 'ACTIVE' THEN 1 ELSE 2 END,
        cp."createdAt" DESC
      LIMIT 1
    `, [userId])

    // Get subscription history
    const historyResult = await pool.query(`
      SELECT 
        cp.id,
        cp."packageId",
        cp."startDate",
        cp."endDate",
        cp."isActive",
        cp."messagesUsed",
        cp."paymentMethod",
        cp."createdAt",
        p.name as package_name,
        p.price,
        p."messageLimit",
        CASE 
          WHEN cp."endDate" <= NOW() THEN 'EXPIRED'
          WHEN cp."isActive" = true AND cp."endDate" > NOW() THEN 'ACTIVE'
          WHEN cp."isActive" = false AND cp."endDate" > NOW() THEN 'PENDING'
          ELSE 'INACTIVE'
        END as status
      FROM customer_packages cp
      JOIN packages p ON cp."packageId" = p.id
      WHERE cp."userId" = $1::text
      ORDER BY cp."createdAt" DESC
      LIMIT 10
    `, [userId])

    // Get current usage data for active subscription
    let contactsUsed = 0
    let contactLimit = 0
    let apiKeysUsed = 0
    let apiKeyLimit = 0
    let devicesUsed = 0
    let instanceLimit = 0
    
    if (currentSubscriptionResult.rows.length > 0) {
      try {
        // Count current contacts for this user
        const contactCountResult = await pool.query(`
          SELECT COUNT(*) as count FROM contacts WHERE "userId" = $1::text
        `, [userId])
        contactsUsed = parseInt(contactCountResult.rows[0].count) || 0
        
        // Count current API keys for this user
        const apiKeyCountResult = await pool.query(`
          SELECT COUNT(*) as count FROM api_keys WHERE "userId" = $1::text AND "isActive" = true
        `, [userId])
        apiKeysUsed = parseInt(apiKeyCountResult.rows[0].count) || 0
        
        // Count current WhatsApp instances/devices for this user
        const deviceCountResult = await pool.query(`
          SELECT COUNT(*) as count FROM whatsapp_instances WHERE "userId" = $1::text
        `, [userId])
        devicesUsed = parseInt(deviceCountResult.rows[0].count) || 0
        
        // Get package limits
        const packageResult = await pool.query(`
          SELECT contact_limit, api_key_limit, "instanceLimit" FROM packages WHERE id = $1
        `, [currentSubscriptionResult.rows[0].packageId])
        
        if (packageResult.rows[0]) {
          contactLimit = packageResult.rows[0].contact_limit || 0
          apiKeyLimit = packageResult.rows[0].api_key_limit || 0
          instanceLimit = packageResult.rows[0].instanceLimit || 0
        }
      } catch (error) {
        console.warn('Failed to get usage data:', error)
      }
    }

    // Format packages
    const packages = packagesResult.rows.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: parseFloat(pkg.price),
      offerPrice: pkg.offer_price ? parseFloat(pkg.offer_price) : null,
      offerEnabled: pkg.offer_enabled,
      duration: pkg.duration,
      messageLimit: pkg.messageLimit,
      instanceLimit: pkg.instanceLimit,
      mobileAccountsLimit: pkg.mobile_accounts_limit,
      contactLimit: pkg.contact_limit,
      apiKeyLimit: pkg.api_key_limit,
      receiveMessageLimit: pkg.receive_msg_limit,
      webhookLimit: pkg.webhook_limit,
      footmarkEnabled: pkg.footmark_enabled,
      footmarkText: pkg.footmark_text,
      packageColor: pkg.package_color,
      features: pkg.features || {}
    }))

    // Format current subscription
    const currentSubscription = currentSubscriptionResult.rows.length > 0 ? {
      id: currentSubscriptionResult.rows[0].id,
      packageId: currentSubscriptionResult.rows[0].packageId,
      packageName: currentSubscriptionResult.rows[0].package_name,
      startDate: currentSubscriptionResult.rows[0].startDate,
      endDate: currentSubscriptionResult.rows[0].endDate,
      isActive: currentSubscriptionResult.rows[0].isActive,
      messagesUsed: currentSubscriptionResult.rows[0].messagesUsed,
      messageLimit: currentSubscriptionResult.rows[0].messageLimit,
      messageBalance: parseInt(currentSubscriptionResult.rows[0].message_balance || '0'),
      totalAvailableMessages: currentSubscriptionResult.rows[0].messageLimit ? 
        Math.max(0, currentSubscriptionResult.rows[0].messageLimit - currentSubscriptionResult.rows[0].messagesUsed) + 
        parseInt(currentSubscriptionResult.rows[0].message_balance || '0') : 
        parseInt(currentSubscriptionResult.rows[0].message_balance || '0'),
      contactsUsed: contactsUsed,
      contactLimit: contactLimit,
      apiKeysUsed: apiKeysUsed,
      apiKeyLimit: apiKeyLimit,
      devicesUsed: devicesUsed,
      instanceLimit: instanceLimit,
      paymentMethod: currentSubscriptionResult.rows[0].paymentMethod,
      scheduledStartDate: currentSubscriptionResult.rows[0].scheduledStartDate,
      purchaseType: currentSubscriptionResult.rows[0].purchaseType,
      previousSubscriptionId: currentSubscriptionResult.rows[0].previousSubscriptionId,
      subscriptionStatus: currentSubscriptionResult.rows[0].subscription_status,
      status: currentSubscriptionResult.rows[0].status,
      price: parseFloat(currentSubscriptionResult.rows[0].price),
      daysRemaining: Math.ceil((new Date(currentSubscriptionResult.rows[0].endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    } : null

    // Format subscription history
    const subscriptionHistory = historyResult.rows.map(sub => ({
      id: sub.id,
      packageId: sub.packageId,
      packageName: sub.package_name,
      startDate: sub.startDate,
      endDate: sub.endDate,
      isActive: sub.isActive,
      messagesUsed: sub.messagesUsed,
      messageLimit: sub.messageLimit,
      paymentMethod: sub.paymentMethod,
      price: parseFloat(sub.price),
      status: sub.status,
      createdAt: sub.createdAt
    }))

    // Get scheduled subscriptions
    const scheduledSubscriptionResult = await pool.query(`
      SELECT 
        cp.id,
        cp."packageId",
        cp."scheduledStartDate",
        cp."startDate",
        cp."endDate",
        cp."purchaseType",
        cp."previousSubscriptionId",
        cp.status,
        cp."createdAt",
        p.name as package_name,
        p.price,
        p."messageLimit",
        p."instanceLimit"
      FROM customer_packages cp
      JOIN packages p ON cp."packageId" = p.id
      WHERE cp."userId" = $1::text 
        AND cp.status = 'SCHEDULED'
      ORDER BY cp."scheduledStartDate" ASC
    `, [userId])

    const scheduledSubscriptions = scheduledSubscriptionResult.rows.map(sub => ({
      id: sub.id,
      packageId: sub.packageId,
      packageName: sub.package_name,
      scheduledStartDate: sub.scheduledStartDate,
      startDate: sub.startDate,
      endDate: sub.endDate,
      purchaseType: sub.purchaseType,
      previousSubscriptionId: sub.previousSubscriptionId,
      status: sub.status,
      price: parseFloat(sub.price),
      messageLimit: sub.messageLimit,
      instanceLimit: sub.instanceLimit,
      createdAt: sub.createdAt
    }))

    return NextResponse.json({
      packages,
      currentSubscription,
      scheduledSubscriptions,
      subscriptionHistory,
      message: `Found ${packages.length} available packages and ${scheduledSubscriptions.length} scheduled subscriptions`
    })

  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Purchase a package subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { packageId, paymentMethod = 'razorpay', startType = 'after_expiry' } = body

    if (!packageId) {
      return NextResponse.json({ 
        error: 'Missing required field: packageId' 
      }, { status: 400 })
    }

    // Validate startType
    if (!['now', 'after_expiry'].includes(startType)) {
      return NextResponse.json({ 
        error: 'Invalid startType. Must be "now" or "after_expiry"' 
      }, { status: 400 })
    }

    // Get customer ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userResult.rows[0].id

    // Get package details
    const packageResult = await pool.query(`
      SELECT * FROM packages WHERE id = $1 AND "isActive" = true
    `, [packageId])

    if (packageResult.rows.length === 0) {
      return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 })
    }

    const packageData = packageResult.rows[0]

    // Check if user has an active subscription
    const activeSubscriptionResult = await pool.query(`
      SELECT id, "endDate", "packageId" FROM customer_packages 
      WHERE "userId" = $1::text 
        AND "isActive" = true 
        AND "endDate" > CURRENT_TIMESTAMP
        AND status = 'ACTIVE'
    `, [userId])

    let startDate: Date
    let endDate: Date
    let subscriptionStatus = 'ACTIVE'
    let scheduledStartDate: Date | null = null
    let purchaseTypeValue = 'IMMEDIATE'
    let previousSubscriptionId: string | null = null

    if (activeSubscriptionResult.rows.length > 0) {
      const currentSubscription = activeSubscriptionResult.rows[0]
      
      if (startType === 'now') {
        // Immediate upgrade: Cancel current subscription and start new one
        await pool.query(`
          UPDATE customer_packages 
          SET "isActive" = false, status = 'CANCELLED', "updatedAt" = NOW()
          WHERE id = $1
        `, [currentSubscription.id])
        
        startDate = new Date()
        endDate = new Date(startDate.getTime() + (packageData.duration * 24 * 60 * 60 * 1000))
        subscriptionStatus = 'ACTIVE'
        purchaseTypeValue = 'IMMEDIATE'
        previousSubscriptionId = currentSubscription.id
        
        console.log(`🔄 Immediate upgrade: Cancelled subscription ${currentSubscription.id}`)
        
      } else {
        // Scheduled: Start after current subscription expires
        startDate = new Date(currentSubscription.endDate)
        endDate = new Date(startDate.getTime() + (packageData.duration * 24 * 60 * 60 * 1000))
        scheduledStartDate = new Date(currentSubscription.endDate)
        subscriptionStatus = 'SCHEDULED'
        purchaseTypeValue = 'SCHEDULED'
        previousSubscriptionId = currentSubscription.id
        
        console.log(`📅 Scheduled upgrade: Will start on ${startDate.toISOString()}`)
      }
    } else {
      // No active subscription: Start immediately
      startDate = new Date()
      endDate = new Date(startDate.getTime() + (packageData.duration * 24 * 60 * 60 * 1000))
      subscriptionStatus = 'ACTIVE'
      purchaseTypeValue = 'IMMEDIATE'
    }

    // Create new subscription
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const insertResult = await pool.query(`
      INSERT INTO customer_packages (
        id, "userId", "packageId", "startDate", "endDate", "isActive", 
        "messagesUsed", "paymentMethod", "scheduledStartDate", "purchaseType", 
        "previousSubscriptionId", status, "createdAt", "updatedAt", "createdBy"
      ) VALUES (
        $1, $2::text, $3, $4, $5, $6, 0, $7, $8, $9, $10, $11, NOW(), NOW(), null
      ) RETURNING *
    `, [
      subscriptionId,
      userId,
      packageId,
      startDate,
      endDate,
      subscriptionStatus === 'ACTIVE',
      paymentMethod,
      scheduledStartDate,
      purchaseTypeValue,
      previousSubscriptionId,
      subscriptionStatus
    ])

    const newSubscription = insertResult.rows[0]

    return NextResponse.json({
      subscription: {
        id: newSubscription.id,
        packageId: newSubscription.packageId,
        packageName: packageData.name,
        startDate: newSubscription.startDate,
        endDate: newSubscription.endDate,
        isActive: newSubscription.isActive,
        messagesUsed: newSubscription.messagesUsed,
        paymentMethod: newSubscription.paymentMethod,
        scheduledStartDate: newSubscription.scheduledStartDate,
        purchaseType: newSubscription.purchaseType,
        previousSubscriptionId: newSubscription.previousSubscriptionId,
        status: newSubscription.status,
        price: parseFloat(packageData.price),
        messageLimit: packageData.messageLimit,
        duration: packageData.duration
      },
      message: subscriptionStatus === 'SCHEDULED' ? 
        `Subscription scheduled successfully! Will activate on ${startDate.toLocaleDateString()}` :
        'Subscription activated successfully!'
    }, { status: 201 })

  } catch (error) {
    console.error('Subscription purchase error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}