import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getImpersonationContext, hasCustomerAccess } from '@/lib/impersonation'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

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
      console.log(`🎭 Admin user checking subscription for customer ID: ${userId}`)
    }

    // Check active subscription
    const subscriptionResult = await pool.query(`
      SELECT cp.id, cp."isActive", cp."endDate", p."messageLimit", cp."messagesUsed",
        p.name as package_name, p.price as package_price, p.duration as package_duration,
        CASE 
          WHEN cp."endDate" <= NOW() THEN 'EXPIRED'
          WHEN cp."isActive" = true AND cp."endDate" > NOW() THEN 'ACTIVE'
          WHEN cp."isActive" = false AND cp."endDate" > NOW() THEN 'PENDING'
          ELSE 'INACTIVE'
        END as status,
        EXTRACT(DAYS FROM (cp."endDate" - NOW())) as days_remaining
      FROM customer_packages cp
      JOIN packages p ON cp."packageId" = p.id
      WHERE cp."userId" = $1::text 
        AND cp."isActive" = true 
      ORDER BY cp."createdAt" DESC
      LIMIT 1
    `, [userId])

    if (subscriptionResult.rows.length === 0) {
      return NextResponse.json({
        valid: false,
        status: 'NO_SUBSCRIPTION',
        message: 'No active subscription found. Please purchase a package to send messages.',
        subscription: null
      })
    }

    const subscription = subscriptionResult.rows[0]
    const isExpired = subscription.status === 'EXPIRED'
    const isNearExpiry = subscription.days_remaining <= 3 && subscription.days_remaining > 0
    const hasReachedLimit = subscription.messageLimit && subscription.messagesUsed >= subscription.messageLimit

    const validationResult = {
      valid: !isExpired && !hasReachedLimit,
      status: subscription.status,
      message: '',
      subscription: {
        id: subscription.id,
        packageName: subscription.package_name,
        messageLimit: subscription.messageLimit,
        messagesUsed: subscription.messagesUsed,
        remainingMessages: subscription.messageLimit ? (subscription.messageLimit - subscription.messagesUsed) : null,
        endDate: subscription.endDate,
        daysRemaining: Math.max(0, Math.floor(subscription.days_remaining)),
        price: subscription.package_price,
        duration: subscription.package_duration
      },
      warnings: []
    }

    // Set appropriate messages and warnings
    if (isExpired) {
      validationResult.message = 'Your subscription has expired. Please renew to continue sending messages.'
      validationResult.status = 'EXPIRED'
    } else if (hasReachedLimit) {
      validationResult.message = `You have reached your message limit (${subscription.messagesUsed}/${subscription.messageLimit}). Please upgrade your package.`
      validationResult.status = 'LIMIT_EXCEEDED'
    } else {
      validationResult.message = 'Subscription is active and valid for sending messages.'
      
      if (isNearExpiry) {
        validationResult.warnings.push(`Your subscription expires in ${Math.floor(subscription.days_remaining)} days. Please renew soon.`)
      }
      
      if (subscription.messageLimit && subscription.messagesUsed > subscription.messageLimit * 0.8) {
        const remaining = subscription.messageLimit - subscription.messagesUsed
        validationResult.warnings.push(`You have ${remaining} messages remaining in your package.`)
      }
    }

    return NextResponse.json(validationResult)

  } catch (error) {
    console.error('Subscription check error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}