import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getImpersonationContext, hasCustomerAccess } from '@/lib/impersonation'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import crypto from 'crypto'

const pool = new Pool(getDatabaseConfig())

/**
 * @swagger
 * /api/customer/api-keys:
 *   get:
 *     tags:
 *       - Customer API Keys
 *     summary: Get customer API keys
 *     description: Retrieve all API keys for the authenticated customer
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       key:
 *                         type: string
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *                       isActive:
 *                         type: boolean
 *                       defaultPermissions:
 *                         type: boolean
 *                         description: Whether this key uses default permissions
 *                       neverExpires:
 *                         type: boolean
 *                         description: Whether this key never expires
 *                       lastUsedAt:
 *                         type: string
 *                         format: date-time
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       usageCount:
 *                         type: integer
 *   post:
 *     tags:
 *       - Customer API Keys
 *     summary: Create new API key
 *     description: Generate a new API key for the authenticated customer
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Descriptive name for the API key
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permission strings (optional - defaults to basic permissions if not provided)
 *               expiresAt:
 *                 type: string
 *                 format: date
 *                 description: Optional expiration date (ignored if neverExpires is true)
 *               neverExpires:
 *                 type: boolean
 *                 description: Set to true for API keys that never expire
 *                 default: false
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 key:
 *                   type: string
 *                   description: The generated API key (only shown once)
 *                 name:
 *                   type: string
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 */
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
      console.log(`🎭 Admin user accessing API keys for customer ID: ${userId}`)
    }

    // Get API keys with usage count from logs
    const keysResult = await pool.query(`
      SELECT 
        ak.id, ak.name, ak.key, ak.permissions, ak."isActive",
        ak."lastUsedAt", ak."expiresAt", ak."createdAt",
        ak."defaultPermissions", ak."neverExpires",
        COUNT(al.id) as usage_count
      FROM api_keys ak
      LEFT JOIN api_logs al ON ak.id = al."apiKeyId"
      WHERE ak."userId" = $1
      GROUP BY ak.id, ak.name, ak.key, ak.permissions, ak."isActive",
               ak."lastUsedAt", ak."expiresAt", ak."createdAt",
               ak."defaultPermissions", ak."neverExpires"
      ORDER BY ak."createdAt" DESC
    `, [userId])

    const keys = keysResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      key: row.key,
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions,
      defaultPermissions: row.defaultPermissions,
      neverExpires: row.neverExpires,
      isActive: row.isActive,
      lastUsedAt: row.lastUsedAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      usageCount: parseInt(row.usage_count || '0')
    }))

    return NextResponse.json({ keys })

  } catch (error) {
    console.error('API Keys GET Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

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
    const { name, permissions, expiresAt, neverExpires = false } = body

    // Default permissions if not provided or empty - comprehensive set for normal API usage
    const DEFAULT_PERMISSIONS = [
      'messages.send',
      'messages.read', 
      'messages.bulk',
      'messages.history',
      'messages.queue',
      'contacts.read',
      'contacts.create',
      'contacts.update',
      'contacts.delete',
      'instances.read',
      'instances.create',
      'instances.update',
      'instances.delete',
      'subscription.read',
      'servers.read',
      'analytics.read',
      'reports.generate',
      'billing.read',
      'vouchers.read',
      'vouchers.redeem',
      'api.access'
    ]
    
    let finalPermissions = permissions
    let useDefaultPermissions = false
    
    // If no permissions provided or empty array, use default permissions
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      finalPermissions = DEFAULT_PERMISSIONS
      useDefaultPermissions = true
    }

    if (!name) {
      return NextResponse.json({ 
        error: 'API key name is required' 
      }, { status: 400 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user creating API key for customer ID: ${userId}`)
    }

    // Check subscription limits before allowing API key creation
    try {
      // Get user's current subscription and API key limits
      const subscriptionResult = await pool.query(`
        SELECT 
          cp.id,
          cp."isActive",
          cp."endDate",
          cp."packageId",
          p.api_key_limit,
          CASE 
            WHEN cp."endDate" <= NOW() THEN 'EXPIRED'
            WHEN cp."isActive" = true AND cp."endDate" > NOW() THEN 'ACTIVE'
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

      if (subscriptionResult.rows.length === 0) {
        return NextResponse.json({ 
          error: 'No active subscription found',
          message: 'Please purchase a subscription plan to create API keys.',
          code: 'NO_SUBSCRIPTION'
        }, { status: 402 })
      }

      const subscription = subscriptionResult.rows[0]
      
      if (subscription.status !== 'ACTIVE') {
        return NextResponse.json({ 
          error: 'Subscription expired',
          message: 'Your subscription has expired. Please renew your plan to continue using API keys.',
          code: 'SUBSCRIPTION_EXPIRED'
        }, { status: 402 })
      }

      // Count current active API keys for this user
      const apiKeyCountResult = await pool.query(`
        SELECT COUNT(*) as count FROM api_keys WHERE "userId" = $1::text AND "isActive" = true
      `, [userId])
      
      const currentApiKeys = parseInt(apiKeyCountResult.rows[0].count) || 0
      const apiKeyLimit = subscription.api_key_limit

      if (apiKeyLimit > 0 && currentApiKeys >= apiKeyLimit) {
        return NextResponse.json({ 
          error: 'API key limit reached',
          message: `You have reached the maximum limit of ${apiKeyLimit} API keys for your current plan. Please upgrade your subscription to create more API keys.`,
          code: 'API_KEY_LIMIT_EXCEEDED',
          details: {
            currentApiKeys,
            apiKeyLimit,
            subscriptionPlan: subscription.packageId
          }
        }, { status: 402 })
      }

      console.log(`✅ API key subscription check passed: ${currentApiKeys}/${apiKeyLimit} API keys used`)
      
    } catch (subscriptionError) {
      console.error('Error checking API key subscription limits:', subscriptionError)
      return NextResponse.json({ 
        error: 'Unable to verify subscription',
        message: 'Please try again or contact support if the problem persists.',
        code: 'SUBSCRIPTION_CHECK_FAILED'
      }, { status: 500 })
    }

    // Generate API key
    const keyPrefix = 'sk_live_'
    const randomBytes = crypto.randomBytes(32).toString('hex')
    const apiKey = keyPrefix + randomBytes

    // Determine expiration date
    let finalExpiresAt = null
    if (!neverExpires && expiresAt) {
      finalExpiresAt = expiresAt
    }
    
    // Create API key
    const keyResult = await pool.query(`
      INSERT INTO api_keys (
        id, "userId", name, key, permissions, "isActive", "expiresAt", 
        "defaultPermissions", "neverExpires", "createdAt", "updatedAt"
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, true, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, permissions, "createdAt", "defaultPermissions", "neverExpires"
    `, [
      userId, 
      name, 
      apiKey, 
      JSON.stringify(finalPermissions), 
      finalExpiresAt,
      useDefaultPermissions,
      neverExpires
    ])

    const newKey = keyResult.rows[0]

    return NextResponse.json({
      id: newKey.id,
      key: apiKey,
      name: newKey.name,
      permissions: finalPermissions,
      defaultPermissions: newKey.defaultPermissions,
      neverExpires: newKey.neverExpires,
      expiresAt: finalExpiresAt,
      createdAt: newKey.createdAt,
      message: useDefaultPermissions ? 
        'API key created successfully with default permissions' : 
        'API key created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API Keys POST Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}