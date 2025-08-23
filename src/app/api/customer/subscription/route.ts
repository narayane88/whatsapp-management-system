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

    // Get user's current active subscription
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
        p.name as package_name,
        p.price,
        p."messageLimit",
        p."instanceLimit",
        CASE 
          WHEN cp."endDate" <= NOW() THEN 'EXPIRED'
          WHEN cp."isActive" = true AND cp."endDate" > NOW() THEN 'ACTIVE'
          WHEN cp."isActive" = false AND cp."endDate" > NOW() THEN 'PENDING'
          ELSE 'INACTIVE'
        END as status
      FROM customer_packages cp
      JOIN packages p ON cp."packageId" = p.id
      WHERE cp."userId" = $1::text 
        AND cp."isActive" = true 
        AND cp."endDate" > CURRENT_TIMESTAMP
      ORDER BY cp."createdAt" DESC
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
      paymentMethod: currentSubscriptionResult.rows[0].paymentMethod,
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

    return NextResponse.json({
      packages,
      currentSubscription,
      subscriptionHistory,
      message: `Found ${packages.length} available packages`
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
    const { packageId, paymentMethod = 'razorpay' } = body

    if (!packageId) {
      return NextResponse.json({ 
        error: 'Missing required field: packageId' 
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
      SELECT id FROM customer_packages 
      WHERE "userId" = $1::text 
        AND "isActive" = true 
        AND "endDate" > CURRENT_TIMESTAMP
    `, [userId])

    if (activeSubscriptionResult.rows.length > 0) {
      return NextResponse.json({ 
        error: 'You already have an active subscription. Please wait for it to expire or contact support.' 
      }, { status: 400 })
    }

    // Create new subscription
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + (packageData.duration * 24 * 60 * 60 * 1000)) // duration in days

    const insertResult = await pool.query(`
      INSERT INTO customer_packages (
        id, "userId", "packageId", "startDate", "endDate", "isActive", 
        "messagesUsed", "paymentMethod", "createdAt", "updatedAt", "createdBy"
      ) VALUES (
        $1, $2::text, $3, $4, $5, true, 0, $6, NOW(), NOW(), null
      ) RETURNING *
    `, [
      subscriptionId,
      userId,
      packageId,
      startDate,
      endDate,
      paymentMethod
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
        price: parseFloat(packageData.price),
        messageLimit: packageData.messageLimit,
        duration: packageData.duration
      },
      message: 'Subscription activated successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Subscription purchase error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}