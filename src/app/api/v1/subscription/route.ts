import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// API Key authentication middleware
async function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' }
  }

  const apiKey = authHeader.replace('Bearer ', '')
  
  try {
    const keyResult = await pool.query(`
      SELECT ak.id, ak."userId", ak.permissions, ak."isActive", ak."expiresAt", ak."neverExpires"
      FROM api_keys ak
      WHERE ak.key = $1 AND ak."isActive" = true
    `, [apiKey])

    if (keyResult.rows.length === 0) {
      return { valid: false, error: 'Invalid or inactive API key' }
    }

    const key = keyResult.rows[0]

    // Check expiration
    if (!key.neverExpires && key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return { valid: false, error: 'API key has expired' }
    }

    // Check permissions
    const permissions = typeof key.permissions === 'string' 
      ? JSON.parse(key.permissions) 
      : key.permissions
    
    if (!permissions.includes('instances.read') && !permissions.includes('*')) {
      return { valid: false, error: 'Insufficient permissions for reading subscription details' }
    }

    // Update last used timestamp
    await pool.query(`
      UPDATE api_keys SET "lastUsedAt" = CURRENT_TIMESTAMP WHERE id = $1
    `, [key.id])

    return { 
      valid: true, 
      userId: key.userId,
      apiKeyId: key.id,
      permissions 
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return { valid: false, error: 'Authentication failed' }
  }
}

/**
 * @swagger
 * /api/v1/subscription:
 *   get:
 *     tags:
 *       - Subscription API
 *     summary: Get subscription details
 *     description: Retrieve current subscription package details with usage information
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Subscription details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentPackage:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *                         price:
 *                           type: number
 *                         messageLimit:
 *                           type: integer
 *                         instanceLimit:
 *                           type: integer
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                         isActive:
 *                           type: boolean
 *                         paymentMethod:
 *                           type: string
 *                     usage:
 *                       type: object
 *                       properties:
 *                         messagesUsed:
 *                           type: integer
 *                         messagesRemaining:
 *                           type: integer
 *                         usagePercentage:
 *                           type: number
 *                         instancesUsed:
 *                           type: integer
 *                         instancesRemaining:
 *                           type: integer
 *                         daysRemaining:
 *                           type: integer
 *                         renewalDate:
 *                           type: string
 *                           format: date
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         dailyUsage:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 format: date
 *                               messages:
 *                                 type: integer
 *                         monthlyUsage:
 *                           type: integer
 *                         averageDaily:
 *                           type: number
 *                         peakUsageDay:
 *                           type: object
 *                           properties:
 *                             date:
 *                               type: string
 *                               format: date
 *                             messages:
 *                               type: integer
 *                     billing:
 *                       type: object
 *                       properties:
 *                         nextBillingDate:
 *                           type: string
 *                           format: date
 *                         billingAmount:
 *                           type: number
 *                         currency:
 *                           type: string
 *                         paymentStatus:
 *                           type: string
 *       401:
 *         description: Unauthorized - Invalid API key
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: No active subscription found
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const auth = await validateApiKey(request)
    if (!auth.valid) {
      return NextResponse.json({ 
        success: false,
        error: auth.error 
      }, { status: auth.error.includes('permissions') ? 403 : 401 })
    }

    // Get current active subscription
    const subscriptionResult = await pool.query(`
      SELECT 
        cp.id as "subscriptionId",
        cp."startDate",
        cp."endDate",
        cp."isActive",
        cp."messagesUsed",
        cp."paymentMethod",
        cp."createdAt" as "subscribedAt",
        cp."updatedAt",
        p.id as "packageId",
        p.name as "packageName",
        p.description,
        p.price,
        p."messageLimit",
        p."instanceLimit",
        p."mobile_accounts_limit",
        p."contact_limit",
        p."api_key_limit",
        p."receive_msg_limit",
        p."webhook_limit",
        p."footmark_enabled",
        p."footmark_text",
        p."package_color",
        p.features
      FROM customer_packages cp
      JOIN packages p ON cp."packageId" = p.id
      WHERE cp."userId" = $1::text 
        AND cp."isActive" = true 
        AND cp."endDate" > NOW()
      ORDER BY cp."createdAt" DESC
      LIMIT 1
    `, [auth.userId])

    if (subscriptionResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found'
      }, { status: 404 })
    }

    const subscription = subscriptionResult.rows[0]

    // Calculate usage metrics
    const messagesRemaining = Math.max(0, subscription.messageLimit - subscription.messagesUsed)
    const usagePercentage = Math.round((subscription.messagesUsed / subscription.messageLimit) * 100)
    
    // Calculate days remaining
    const endDate = new Date(subscription.endDate)
    const now = new Date()
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    // Get current instance count
    const instanceCountResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM whatsapp_instances wi
      WHERE wi."userId" = $1::text AND wi.status != 'DISCONNECTED'
    `, [auth.userId])

    const instancesUsed = parseInt(instanceCountResult.rows[0].count)
    const instancesRemaining = Math.max(0, subscription.instanceLimit - instancesUsed)

    // Get daily usage statistics for the last 30 days
    const dailyUsageResult = await pool.query(`
      SELECT 
        DATE(sm."sentAt") as date,
        COUNT(*) as messages
      FROM sent_messages sm
      WHERE sm."userId" = $1::text
        AND sm."sentAt" >= NOW() - INTERVAL '30 days'
        AND sm."sentAt" >= $2::date
      GROUP BY DATE(sm."sentAt")
      ORDER BY date DESC
      LIMIT 30
    `, [auth.userId, subscription.startDate])

    const dailyUsage = dailyUsageResult.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      messages: parseInt(row.messages)
    }))

    // Calculate monthly usage
    const monthlyUsageResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM sent_messages sm
      WHERE sm."userId" = $1::text
        AND sm."sentAt" >= DATE_TRUNC('month', NOW())
        AND sm."sentAt" >= $2::date
    `, [auth.userId, subscription.startDate])

    const monthlyUsage = parseInt(monthlyUsageResult.rows[0].count)

    // Calculate average daily usage
    const daysActive = Math.max(1, Math.ceil((now.getTime() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    const averageDaily = Math.round(subscription.messagesUsed / daysActive)

    // Find peak usage day
    const peakUsageDay = dailyUsage.length > 0 
      ? dailyUsage.reduce((max, day) => day.messages > max.messages ? day : max)
      : null

    // Get billing information
    const billingInfo = {
      nextBillingDate: endDate.toISOString().split('T')[0],
      billingAmount: subscription.price,
      currency: 'INR',
      paymentStatus: daysRemaining > 0 ? 'active' : 'expired'
    }

    // Parse features
    let features = []
    try {
      features = typeof subscription.features === 'string' 
        ? JSON.parse(subscription.features)
        : subscription.features || []
    } catch (e) {
      features = []
    }

    // Log API usage
    try {
      await pool.query(`
        INSERT INTO api_logs (id, "apiKeyId", endpoint, method, "statusCode", "timestamp")
        VALUES (gen_random_uuid(), $1, '/api/v1/subscription', 'GET', 200, CURRENT_TIMESTAMP)
      `, [auth.apiKeyId])
    } catch (logError) {
      console.warn('Failed to log API usage:', logError)
    }

    return NextResponse.json({
      success: true,
      data: {
        currentPackage: {
          id: subscription.packageId,
          subscriptionId: subscription.subscriptionId,
          name: subscription.packageName,
          description: subscription.description,
          price: subscription.price,
          messageLimit: subscription.messageLimit,
          instanceLimit: subscription.instanceLimit,
          mobileAccountsLimit: subscription.mobile_accounts_limit,
          contactLimit: subscription.contact_limit,
          apiKeyLimit: subscription.api_key_limit,
          receiveMessageLimit: subscription.receive_msg_limit,
          webhookLimit: subscription.webhook_limit,
          footmarkEnabled: subscription.footmark_enabled,
          footmarkText: subscription.footmark_text,
          packageColor: subscription.package_color,
          features: features,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          isActive: subscription.isActive,
          paymentMethod: subscription.paymentMethod,
          subscribedAt: subscription.subscribedAt
        },
        usage: {
          messagesUsed: subscription.messagesUsed,
          messagesRemaining,
          usagePercentage,
          instancesUsed,
          instancesRemaining,
          daysRemaining,
          renewalDate: endDate.toISOString().split('T')[0]
        },
        statistics: {
          dailyUsage,
          monthlyUsage,
          averageDaily,
          peakUsageDay,
          totalDaysActive: daysActive
        },
        billing: billingInfo,
        alerts: {
          lowCredit: usagePercentage >= 90,
          nearExpiry: daysRemaining <= 7,
          overLimit: subscription.messagesUsed >= subscription.messageLimit,
          instanceLimitReached: instancesUsed >= subscription.instanceLimit
        }
      },
      message: `Subscription details retrieved for package: ${subscription.packageName}`
    })

  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}