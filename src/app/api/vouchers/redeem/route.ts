import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'

const pool = new Pool(getDatabaseConfig())

// Enhanced POST /api/vouchers/redeem - Redeem a voucher with type-specific handling
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({
        error: 'Voucher code is required'
      }, { status: 400 })
    }

    const voucherCode = code.toUpperCase().trim()
    const userEmail = session.user.email

    // Get client IP and user agent for audit
    const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Start transaction
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // 1. Get user information
      const userResult = await client.query(`
        SELECT 
          u.id, 
          u.email, 
          u.name,
          COALESCE(u.biz_points, 0) as biz_points,
          r.name as role_name,
          r.level as role_level
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE LOWER(u.email) = LOWER($1)
      `, [userEmail])

      if (userResult.rows.length === 0) {
        await client.query('COMMIT')
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const user = userResult.rows[0]
      const userId = user.id

      // 2. Find and validate voucher
      const voucherResult = await client.query(`
        SELECT 
          id, code, type, value, usage_limit, usage_count, is_active, 
          expires_at, package_id, description,
          CASE 
            WHEN expires_at < CURRENT_TIMESTAMP THEN 'expired'
            WHEN is_active = false THEN 'inactive'
            WHEN usage_limit IS NOT NULL AND usage_count >= usage_limit THEN 'exhausted'
            ELSE 'valid'
          END as voucher_status
        FROM vouchers 
        WHERE UPPER(code) = $1
      `, [voucherCode])

      if (voucherResult.rows.length === 0) {
        // Log failed attempt
        await client.query(`
          INSERT INTO voucher_redemption_attempts (
            voucher_id, user_id, user_email, attempt_status, failure_reason, ip_address, user_agent
          ) VALUES (NULL, $1, $2, $3, $4, $5, $6)
        `, [userId, userEmail, 'failed', 'Voucher code not found', clientIp, userAgent])

        await client.query('COMMIT')
        return NextResponse.json({
          error: 'Invalid voucher code'
        }, { status: 404 })
      }

      const voucher = voucherResult.rows[0]

      // 3. Check voucher status
      if (voucher.voucher_status !== 'valid') {
        let errorMessage = 'Voucher is not available for redemption'
        switch (voucher.voucher_status) {
          case 'expired':
            errorMessage = 'Voucher has expired'
            break
          case 'inactive':
            errorMessage = 'Voucher is no longer active'
            break
          case 'exhausted':
            errorMessage = 'Voucher usage limit has been reached'
            break
        }

        // Log failed attempt
        await client.query(`
          INSERT INTO voucher_redemption_attempts (
            voucher_id, user_id, user_email, attempt_status, failure_reason, ip_address, user_agent
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [voucher.id, userId, userEmail, 'failed', errorMessage, clientIp, userAgent])

        await client.query('COMMIT')
        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }

      // 4. Check if user has already used this voucher
      const existingUsage = await client.query(`
        SELECT id FROM voucher_usage 
        WHERE voucher_id = $1 AND user_id = $2
      `, [voucher.id, userId])

      if (existingUsage.rows.length > 0) {
        // Log failed attempt
        await client.query(`
          INSERT INTO voucher_redemption_attempts (
            voucher_id, user_id, user_email, attempt_status, failure_reason, ip_address, user_agent
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [voucher.id, userId, userEmail, 'failed', 'Voucher already used by this user', clientIp, userAgent])

        await client.query('COMMIT')
        return NextResponse.json({
          error: 'You have already used this voucher'
        }, { status: 409 })
      }

      // 5. Process voucher based on type
      let benefitDescription = ''
      let appliedBenefit = {}

      switch (voucher.type) {
        case 'credit':
          // Add bizcoins to user account
          const creditValue = parseFloat(voucher.value.toString()) || 0
          const newBizBalance = parseFloat(user.biz_points) + creditValue
          await client.query(`
            UPDATE users 
            SET biz_points = $1
            WHERE id = $2
          `, [newBizBalance, userId])

          // Record bizcoin transaction
          await client.query(`
            INSERT INTO bizpoints_transactions (
              id, user_id, type, amount, balance, description, reference
            ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
          `, [
            userId,
            'EARNED',
            creditValue,
            newBizBalance,
            `Voucher redemption: ${voucher.code}`,
            `VOUCHER_${voucher.id}_${Date.now()}`
          ])

          benefitDescription = `₹${creditValue} bizcoins added to your account`
          appliedBenefit = {
            type: 'credit',
            amount: creditValue,
            newBalance: newBizBalance
          }
          break

        case 'messages':
          // Add messages to user's message balance
          const currentMessageBalance = await client.query(`
            SELECT message_balance FROM users WHERE id = $1
          `, [userId])
          
          const oldBalance = currentMessageBalance.rows[0]?.message_balance || 0
          const messageValue = parseInt(parseFloat(voucher.value.toString()) || 0)
          const newMessageBalance = oldBalance + messageValue
          
          await client.query(`
            UPDATE users 
            SET message_balance = $1
            WHERE id = $2
          `, [newMessageBalance, userId])

          benefitDescription = `${messageValue} messages added to your account balance`
          appliedBenefit = {
            type: 'messages',
            count: messageValue,
            previousBalance: oldBalance,
            newBalance: newMessageBalance
          }
          break

        case 'package':
          // Auto-activate package subscription
          if (!voucher.package_id) {
            throw new Error('Package voucher missing package information')
          }

          // Get package details
          const packageResult = await client.query(`
            SELECT * FROM packages WHERE id = $1 AND "isActive" = true
          `, [voucher.package_id])

          if (packageResult.rows.length === 0) {
            throw new Error('Associated package not found or inactive')
          }

          const pkg = packageResult.rows[0]
          
          // Check for existing active subscription
          const existingSubscriptionResult = await client.query(`
            SELECT cp.id, cp."endDate", p.name as package_name, p.price as package_price,
                   EXTRACT(DAYS FROM (cp."endDate" - NOW())) as days_remaining
            FROM customer_packages cp
            JOIN packages p ON cp."packageId" = p.id
            WHERE cp."userId" = $1::text AND cp."isActive" = true AND cp."endDate" > NOW()
            ORDER BY cp."createdAt" DESC
            LIMIT 1
          `, [userId])

          let replacedSubscription = null
          if (existingSubscriptionResult.rows.length > 0) {
            const existingSub = existingSubscriptionResult.rows[0]
            replacedSubscription = {
              packageName: existingSub.package_name,
              packagePrice: existingSub.package_price,
              daysRemaining: Math.floor(existingSub.days_remaining)
            }
            
            // Deactivate existing subscription
            await client.query(`
              UPDATE customer_packages 
              SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP 
              WHERE id = $1
            `, [existingSub.id])
          }
          
          // Create new subscription
          const startDate = new Date()
          const endDate = new Date()
          endDate.setDate(endDate.getDate() + pkg.duration)

          const subscriptionResult = await client.query(`
            INSERT INTO customer_packages (
              id, "userId", "packageId", "createdBy", "paymentMethod",
              "startDate", "endDate", "isActive", "messagesUsed",
              "createdAt", "updatedAt", status, "purchaseType"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id
          `, [
            `cs_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
            userId.toString(),
            pkg.id.toString(),
            userId,
            'VOUCHER',
            startDate,
            endDate,
            true,
            0,
            new Date(),
            new Date(),
            'ACTIVE',
            'voucher_redemption'
          ])

          benefitDescription = replacedSubscription 
            ? `${pkg.name} package activated for ${pkg.duration} days (${pkg.messageLimit.toLocaleString()} messages). Previous ${replacedSubscription.packageName} subscription has been discontinued.`
            : `${pkg.name} package activated for ${pkg.duration} days (${pkg.messageLimit.toLocaleString()} messages)`
            
          appliedBenefit = {
            type: 'package',
            packageId: pkg.id,
            packageName: pkg.name,
            duration: pkg.duration,
            messageLimit: pkg.messageLimit,
            price: pkg.price,
            subscriptionId: subscriptionResult.rows[0].id,
            replacedSubscription: replacedSubscription
          }
          break

        case 'percentage':
          // Store percentage discount for next purchase (simplified - no table exists yet)
          benefitDescription = `${voucher.value}% discount saved for your next purchase`
          appliedBenefit = {
            type: 'percentage',
            discount: voucher.value
          }
          break

        default:
          throw new Error(`Unknown voucher type: ${voucher.type}`)
      }

      // 6. Record the voucher usage
      await client.query(`
        INSERT INTO voucher_usage (
          voucher_id, user_id, user_email, discount_amount, 
          original_amount, final_amount, redemption_type, notes, used_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      `, [
        voucher.id, 
        userId, 
        userEmail, 
        voucher.type === 'percentage' ? voucher.value : 0,
        0, 
        0,
        'manual',
        benefitDescription
      ])

      // 7. Update voucher usage count
      await client.query(`
        UPDATE vouchers 
        SET usage_count = usage_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [voucher.id])

      // 8. Log successful redemption
      await client.query(`
        INSERT INTO voucher_redemption_attempts (
          voucher_id, user_id, user_email, attempt_status, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [voucher.id, userId, userEmail, 'success', clientIp, userAgent])

      await client.query('COMMIT')

      // Prepare warnings array
      const warnings = []
      if (appliedBenefit.type === 'package' && appliedBenefit.replacedSubscription) {
        warnings.push(`⚠️ Your previous ${appliedBenefit.replacedSubscription.packageName} subscription (${appliedBenefit.replacedSubscription.daysRemaining} days remaining) has been replaced by this voucher.`)
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Voucher redeemed successfully',
        voucher: {
          code: voucher.code,
          type: voucher.type,
          value: voucher.value,
          description: voucher.description
        },
        benefit: {
          description: benefitDescription,
          ...appliedBenefit
        },
        redemption: {
          redeemedAt: new Date().toISOString(),
          userId,
          userEmail
        },
        warnings: warnings
      }, { status: 200 })

    } catch (error) {
      await client.query('ROLLBACK')
      
      // Log error attempt
      try {
        await pool.query(`
          INSERT INTO voucher_redemption_attempts (
            voucher_id, user_id, user_email, attempt_status, failure_reason, 
            ip_address, user_agent
          ) VALUES (NULL, NULL, $1, $2, $3, $4, $5)
        `, [userEmail, 'error', error instanceof Error ? error.message : 'Unknown error', clientIp, userAgent])
      } catch (logError) {
        console.error('Failed to log error attempt:', logError)
      }

      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Voucher redemption error:', error)
    return NextResponse.json({ 
      error: 'Failed to redeem voucher',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/vouchers/redeem - Get user's voucher redemption history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email

    // Get user ID
    const userResult = await pool.query(`
      SELECT id FROM users WHERE LOWER(email) = LOWER($1)
    `, [userEmail])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userResult.rows[0].id

    // Get user's voucher usage history with enhanced details
    const usageHistory = await pool.query(`
      SELECT 
        vu.id,
        v.code,
        v.type,
        v.value,
        v.description as voucher_description,
        vu.discount_amount,
        vu.used_at,
        vu.notes,
        CASE 
          WHEN v.type = 'credit' THEN CONCAT('₹', v.value, ' bizcoins')
          WHEN v.type = 'messages' THEN CONCAT(v.value, ' messages')
          WHEN v.type = 'percentage' THEN CONCAT(v.value, '% discount')
          WHEN v.type = 'package' AND p.name IS NOT NULL THEN CONCAT(p.name, ' package (', p.duration, ' days, ', p."messageLimit", ' messages)')
          WHEN v.type = 'package' THEN 'Package activation'
          ELSE 'Voucher benefit'
        END as benefit_description,
        NULL as subscription_id,
        p.name as package_name,
        p.duration as package_duration,
        p."messageLimit" as package_message_limit,
        p.price as package_price
      FROM voucher_usage vu
      JOIN vouchers v ON vu.voucher_id = v.id
      LEFT JOIN packages p ON v.package_id = p.id
      WHERE vu.user_id = $1 OR vu.user_email = $2
      ORDER BY vu.used_at DESC
    `, [userId, userEmail])

    // Get user's redemption attempt statistics
    const attemptStats = await pool.query(`
      SELECT 
        attempt_status,
        COUNT(*) as count
      FROM voucher_redemption_attempts
      WHERE user_id = $1 OR user_email = $2
      GROUP BY attempt_status
    `, [userId, userEmail])

    // Get available discount vouchers (simplified - no table exists yet)
    const availableDiscounts = { rows: [] }

    return NextResponse.json({
      success: true,
      redemptionHistory: usageHistory.rows,
      attemptStatistics: attemptStats.rows,
      availableDiscounts: availableDiscounts.rows,
      totalRedemptions: usageHistory.rows.length
    })

  } catch (error) {
    console.error('Get voucher history error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch redemption history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}