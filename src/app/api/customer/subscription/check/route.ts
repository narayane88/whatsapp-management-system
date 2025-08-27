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

    // Check active subscription, voucher balance, and voucher usage history
    const subscriptionResult = await pool.query(`
      SELECT cp.id, cp."isActive", cp."endDate", p."messageLimit", cp."messagesUsed",
        p.name as package_name, p.price as package_price, p.duration as package_duration,
        u.message_balance,
        CASE 
          WHEN cp."endDate" <= NOW() THEN 'EXPIRED'
          WHEN cp."isActive" = true AND cp."endDate" > NOW() THEN 'ACTIVE'
          WHEN cp."isActive" = false AND cp."endDate" > NOW() THEN 'PENDING'
          ELSE 'INACTIVE'
        END as status,
        EXTRACT(DAYS FROM (cp."endDate" - NOW())) as days_remaining
      FROM customer_packages cp
      JOIN packages p ON cp."packageId" = p.id
      JOIN users u ON cp."userId" = u.id::text
      WHERE cp."userId" = $1::text 
        AND cp."isActive" = true 
      ORDER BY cp."createdAt" DESC
      LIMIT 1
    `, [userId])

    // Calculate total voucher messages redeemed vs current balance to estimate usage
    let totalVoucherRedeemed = 0
    try {
      const voucherHistoryResult = await pool.query(`
        SELECT 
          SUM(CASE 
            WHEN v.value::text ~ '^[0-9]+(\.[0-9]+)?$' THEN FLOOR(v.value::numeric)
            ELSE 0 
          END) as total_redeemed,
          COUNT(*) as redemption_count,
          array_agg(v.value::text) as voucher_values
        FROM voucher_usage vu
        JOIN vouchers v ON vu.voucher_id = v.id
        WHERE vu.user_id = $1 AND v.type = 'messages'
      `, [userId])
      
      const result = voucherHistoryResult.rows[0]
      totalVoucherRedeemed = parseInt(result?.total_redeemed || '0')
      
      // Debug logging with detailed breakdown
      console.log(`🎫 Voucher redemption debug for user ${userId}:`, {
        totalRedeemed: totalVoucherRedeemed,
        redemptionCount: result?.redemption_count || 0,
        voucherValues: result?.voucher_values || [],
        rawTotal: result?.total_redeemed,
        parsedTotal: parseInt(result?.total_redeemed || '0')
      })
      
      // Additional logging to understand the parsing
      const voucherValues = result?.voucher_values || []
      let manualSum = 0
      voucherValues.forEach((value, index) => {
        const numericValue = parseFloat(value.toString()) || 0
        const flooredValue = Math.floor(numericValue)
        manualSum += flooredValue
        console.log(`🎫 Voucher ${index + 1}: "${value}" -> numeric: ${numericValue} -> floored: ${flooredValue}`)
      })
      console.log(`🎫 Manual sum calculation: ${manualSum}, DB sum: ${result?.total_redeemed}`)
      
    } catch (error) {
      console.warn('Could not fetch voucher redemption history:', error)
    }

    // If no active subscription, check if user has voucher messages
    if (subscriptionResult.rows.length === 0) {
      const userResult = await pool.query(`
        SELECT message_balance FROM users WHERE id = $1
      `, [userId])
      
      const voucherBalance = userResult.rows[0]?.message_balance || 0
      
      // Calculate voucher usage for voucher-only case
      let totalVoucherRedeemedNoSub = 0
      try {
        const voucherHistoryResult = await pool.query(`
          SELECT 
            SUM(CASE 
              WHEN v.value::text ~ '^[0-9]+(\.[0-9]+)?$' THEN FLOOR(v.value::numeric)
              ELSE 0 
            END) as total_redeemed
          FROM voucher_usage vu
          JOIN vouchers v ON vu.voucher_id = v.id
          WHERE vu.user_id = $1 AND v.type = 'messages'
        `, [userId])
        
        totalVoucherRedeemedNoSub = parseInt(voucherHistoryResult.rows[0]?.total_redeemed || '0')
      } catch (error) {
        console.warn('Could not fetch voucher redemption history for voucher-only user:', error)
      }
      
      const voucherMessagesUsed = Math.max(0, totalVoucherRedeemedNoSub - voucherBalance)
      
      if (voucherBalance > 0 || voucherMessagesUsed > 0) {
        return NextResponse.json({
          valid: voucherBalance > 0,
          status: 'VOUCHER_ONLY',
          message: voucherBalance > 0 
            ? `You have ${voucherBalance} voucher messages available for sending.`
            : 'You have used all your voucher messages. Please redeem more vouchers or purchase a subscription.',
          subscription: null,
          voucher: {
            messageBalance: voucherBalance,
            totalAvailable: voucherBalance,
            totalRedeemed: totalVoucherRedeemedNoSub,
            messagesUsed: voucherMessagesUsed
          },
          usage: {
            subscriptionMessagesUsed: 0,
            voucherMessagesUsed: voucherMessagesUsed,
            totalCapacity: totalVoucherRedeemedNoSub,
            availableFromSubscription: 0,
            availableFromVouchers: voucherBalance,
            totalAvailable: voucherBalance
          },
          warnings: ['Consider purchasing a subscription plan for more features and better rates.']
        })
      }
      
      return NextResponse.json({
        valid: false,
        status: 'NO_SUBSCRIPTION',
        message: 'No active subscription found and no voucher messages available. Please purchase a package or redeem vouchers to send messages.',
        subscription: null,
        voucher: {
          messageBalance: 0,
          totalAvailable: 0
        },
        usage: {
          subscriptionMessagesUsed: 0,
          voucherMessagesUsed: 0,
          totalCapacity: 0,
          availableFromSubscription: 0,
          availableFromVouchers: 0,
          totalAvailable: 0
        }
      })
    }

    const subscription = subscriptionResult.rows[0]
    const isExpired = subscription.status === 'EXPIRED'
    const isNearExpiry = subscription.days_remaining <= 3 && subscription.days_remaining > 0
    const voucherBalance = subscription.message_balance || 0
    const subscriptionUsed = subscription.messagesUsed || 0
    const subscriptionRemaining = Math.max(0, subscription.messageLimit - subscriptionUsed)
    const totalAvailable = subscriptionRemaining + voucherBalance
    const hasReachedLimit = subscription.messageLimit && totalAvailable <= 0

    // Calculate voucher messages used (redeemed - current balance)
    const voucherMessagesUsed = Math.max(0, totalVoucherRedeemed - voucherBalance)

    const validationResult = {
      valid: !isExpired && !hasReachedLimit,
      status: subscription.status,
      message: '',
      subscription: {
        id: subscription.id,
        packageName: subscription.package_name,
        messageLimit: subscription.messageLimit,
        messagesUsed: subscription.messagesUsed,
        remainingMessages: subscriptionRemaining,
        endDate: subscription.endDate,
        daysRemaining: Math.max(0, Math.floor(subscription.days_remaining)),
        price: subscription.package_price,
        duration: subscription.package_duration
      },
      voucher: {
        messageBalance: voucherBalance,
        totalAvailable: totalAvailable,
        totalRedeemed: totalVoucherRedeemed,
        messagesUsed: voucherMessagesUsed
      },
      usage: {
        subscriptionMessagesUsed: subscriptionUsed,
        voucherMessagesUsed: voucherMessagesUsed,
        totalCapacity: subscription.messageLimit + totalVoucherRedeemed,
        availableFromSubscription: subscriptionRemaining,
        availableFromVouchers: voucherBalance,
        totalAvailable: totalAvailable
      },
      warnings: []
    }

    // Set appropriate messages and warnings
    if (isExpired) {
      if (voucherBalance > 0) {
        validationResult.message = `Your subscription has expired, but you have ${voucherBalance} voucher messages available.`
        validationResult.valid = true
      } else {
        validationResult.message = 'Your subscription has expired. Please renew to continue sending messages.'
        validationResult.status = 'EXPIRED'
      }
    } else if (hasReachedLimit) {
      validationResult.message = `You have reached your total message limit. Please upgrade your package or redeem vouchers.`
      validationResult.status = 'LIMIT_EXCEEDED'
    } else {
      validationResult.message = `You have ${totalAvailable} messages available (${subscriptionRemaining} from subscription${voucherBalance > 0 ? ` + ${voucherBalance} from vouchers` : ''}).`
      
      if (isNearExpiry) {
        validationResult.warnings.push(`Your subscription expires in ${Math.floor(subscription.days_remaining)} days. Please renew soon.`)
      }
      
      if (totalAvailable <= 10) {
        validationResult.warnings.push(`Low message balance: Only ${totalAvailable} messages remaining.`)
      }
      
      // Note: We don't add voucher balance as a warning since it's positive information
      // The voucher information is already available in the response data
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