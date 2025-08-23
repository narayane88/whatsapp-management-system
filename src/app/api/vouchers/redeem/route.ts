import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'

const pool = new Pool(getDatabaseConfig())

// POST /api/vouchers/redeem - Redeem a voucher
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
    const userId = session.user.id || session.user.email
    const userEmail = session.user.email

    // Get client IP and user agent for audit
    const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Start transaction
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // 1. Find and validate voucher
      const voucherResult = await client.query(`
        SELECT 
          id, code, type, value, usage_limit, usage_count, is_active, 
          expires_at, dealer_id, allow_dealer_redemption, created_by,
          CASE 
            WHEN expires_at < CURRENT_TIMESTAMP THEN 'expired'
            WHEN is_active = false THEN 'inactive'
            WHEN usage_limit IS NOT NULL AND usage_count >= usage_limit THEN 'exhausted'
            ELSE 'valid'
          END as voucher_status
        FROM vouchers 
        WHERE code = $1
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

      // 2. Check if voucher is valid
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

      // 3. Check if user is a dealer trying to redeem their own voucher
      const userResult = await client.query(`
        SELECT u.id, u.email, r.name as role_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = $1
      `, [userEmail])

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0]
        const isDealer = user.role_name && ['DEALER', 'SUBDEALER', 'OWNER'].includes(user.role_name)
        const isDealerCreatedVoucher = voucher.dealer_id === userId || voucher.created_by === userEmail || voucher.created_by === user.id

        // Block dealers from redeeming vouchers unless specifically allowed
        if (isDealer && !voucher.allow_dealer_redemption) {
          // Log blocked attempt
          await client.query(`
            INSERT INTO voucher_redemption_attempts (
              voucher_id, user_id, user_email, attempt_status, failure_reason, ip_address, user_agent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [voucher.id, userId, userEmail, 'blocked', 'Dealers cannot redeem vouchers', clientIp, userAgent])

          await client.query('COMMIT')
          return NextResponse.json({
            error: 'Dealers cannot redeem vouchers'
          }, { status: 403 })
        }

        // Block dealers from redeeming their own created vouchers
        if (isDealer && isDealerCreatedVoucher) {
          // Log blocked attempt
          await client.query(`
            INSERT INTO voucher_redemption_attempts (
              voucher_id, user_id, user_email, attempt_status, failure_reason, ip_address, user_agent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [voucher.id, userId, userEmail, 'blocked', 'Cannot redeem own created voucher', clientIp, userAgent])

          await client.query('COMMIT')
          return NextResponse.json({
            error: 'You cannot redeem vouchers you created'
          }, { status: 403 })
        }
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

      // 5. Calculate voucher benefit based on type
      let discountAmount = 0
      let creditAmount = 0
      let messageAmount = 0
      let benefitDescription = ''

      switch (voucher.type) {
        case 'credit':
          creditAmount = voucher.value
          benefitDescription = `₹${voucher.value} account credit`
          break
        case 'messages':
          messageAmount = voucher.value
          benefitDescription = `${voucher.value} free messages`
          break
        case 'percentage':
          // For percentage vouchers, we'll calculate discount on next purchase
          discountAmount = voucher.value
          benefitDescription = `${voucher.value}% discount on next purchase`
          break
        case 'package':
          benefitDescription = 'Package upgrade voucher'
          break
      }

      // 6. Record the voucher usage
      await client.query(`
        INSERT INTO voucher_usage (
          voucher_id, user_id, user_email, discount_amount, 
          original_amount, final_amount, redemption_type, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        voucher.id, 
        userId, 
        userEmail, 
        discountAmount,
        0, // Will be updated when actually used in a transaction
        0, // Will be updated when actually used in a transaction
        'manual',
        `Voucher redeemed: ${benefitDescription}`
      ])

      // 7. Update voucher usage count
      await client.query(`
        UPDATE vouchers 
        SET usage_count = usage_count + 1
        WHERE id = $1
      `, [voucher.id])

      // 8. Apply the voucher benefit to user account (if applicable)
      if (creditAmount > 0) {
        // Add credit to user account (assuming there's a user credits table or field)
        await client.query(`
          UPDATE users 
          SET account_balance = COALESCE(account_balance, 0) + $1
          WHERE email = $2
        `, [creditAmount, userEmail])
      }

      if (messageAmount > 0) {
        // Add messages to user account (assuming there's a message balance field)
        await client.query(`
          UPDATE users 
          SET message_balance = COALESCE(message_balance, 0) + $1
          WHERE email = $2
        `, [messageAmount, userEmail])
      }

      // 9. Log successful redemption
      await client.query(`
        INSERT INTO voucher_redemption_attempts (
          voucher_id, user_id, user_email, attempt_status, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [voucher.id, userId, userEmail, 'success', clientIp, userAgent])

      await client.query('COMMIT')

      // Return success response
      return NextResponse.json({
        message: 'Voucher redeemed successfully',
        voucher: {
          code: voucher.code,
          type: voucher.type,
          value: voucher.value
        },
        benefit: {
          description: benefitDescription,
          creditAmount,
          messageAmount,
          discountPercent: voucher.type === 'percentage' ? voucher.value : 0
        },
        redemption: {
          redeemedAt: new Date().toISOString(),
          userId,
          userEmail
        }
      }, { status: 200 })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Voucher redemption error:', error)
    return NextResponse.json({ 
      error: 'Failed to redeem voucher. Please try again.' 
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

    const userId = session.user.id || session.user.email
    const userEmail = session.user.email

    // Get user's voucher usage history
    const usageHistory = await pool.query(`
      SELECT 
        vu.id,
        v.code,
        v.type,
        v.value,
        vu.discount_amount,
        vu.used_at,
        vu.notes,
        CASE 
          WHEN v.type = 'credit' THEN CONCAT('₹', v.value, ' credit')
          WHEN v.type = 'messages' THEN CONCAT(v.value, ' messages')
          WHEN v.type = 'percentage' THEN CONCAT(v.value, '% discount')
          ELSE 'Package benefit'
        END as benefit_description
      FROM voucher_usage vu
      JOIN vouchers v ON vu.voucher_id = v.id
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

    return NextResponse.json({
      redemptionHistory: usageHistory.rows,
      attemptStatistics: attemptStats.rows,
      totalRedemptions: usageHistory.rows.length
    })

  } catch (error) {
    console.error('Get voucher history error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch redemption history' 
    }, { status: 500 })
  }
}