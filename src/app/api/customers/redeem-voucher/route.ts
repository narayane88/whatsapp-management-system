import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// POST /api/customers/redeem-voucher - Redeem voucher code for customer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For customer voucher redemption, we allow customers themselves or admins with permission
    const hasCustomerPermission = await checkCurrentUserPermission('customer.voucher.redeem')
    const hasAdminPermission = await checkCurrentUserPermission('customers.update')
    
    if (!hasCustomerPermission && !hasAdminPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { voucherCode, customerId } = await request.json()

    if (!voucherCode) {
      return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 })
    }

    // Get current user info
    const currentUserResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    )
    const currentUserId = currentUserResult.rows[0]?.id

    // Determine which customer is redeeming the voucher
    let targetCustomerId = customerId

    // If no customerId provided and user is a customer, they're redeeming for themselves
    if (!targetCustomerId) {
      const userRoleResult = await pool.query(`
        SELECT u.id, r.name as role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = $1
      `, [session.user.email])
      
      if (userRoleResult.rows.length > 0 && userRoleResult.rows[0].role === 'CUSTOMER') {
        targetCustomerId = userRoleResult.rows[0].id
      }
    }

    if (!targetCustomerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // Begin transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Get voucher details
      const voucherResult = await client.query(`
        SELECT 
          id, code, description, type, value, usage_limit, usage_count,
          is_active, expires_at, created_by,
          package_id, min_purchase_amount, max_discount_amount
        FROM vouchers
        WHERE code = $1 AND is_active = true
      `, [voucherCode])

      if (voucherResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Invalid or inactive voucher code' }, { status: 404 })
      }

      const voucher = voucherResult.rows[0]

      // Check if voucher is expired
      if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Voucher has expired' }, { status: 400 })
      }

      // Check if voucher usage limit is reached
      if (voucher.usage_limit && voucher.usage_count >= voucher.usage_limit) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Voucher usage limit reached' }, { status: 400 })
      }

      // Check if customer has already used this voucher
      const existingUsageResult = await client.query(`
        SELECT id FROM voucher_usage 
        WHERE voucher_id = $1 AND user_id = $2
      `, [voucher.id, targetCustomerId])

      if (existingUsageResult.rows.length > 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'You have already used this voucher' }, { status: 409 })
      }

      // Check if user is a dealer trying to redeem (dealers cannot redeem)
      const customerRoleResult = await client.query(`
        SELECT r.name as role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = $1
      `, [targetCustomerId])

      if (customerRoleResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      const customerRole = customerRoleResult.rows[0].role
      if (['SUBDEALER', 'DEALER', 'ADMIN', 'OWNER'].includes(customerRole)) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: 'Dealers and admin users cannot redeem vouchers' }, { status: 403 })
      }

      // Get customer's current balance
      const customerResult = await client.query(`
        SELECT account_balance, message_balance
        FROM users
        WHERE id = $1
      `, [targetCustomerId])

      const customer = customerResult.rows[0]
      let newAccountBalance = parseFloat(customer.account_balance || 0)
      let newMessageBalance = parseInt(customer.message_balance || 0)

      // Apply voucher based on type
      let redemptionDetails: any = {
        voucher_code: voucherCode,
        voucher_type: voucher.type,
        voucher_value: voucher.value,
        previous_account_balance: newAccountBalance,
        previous_message_balance: newMessageBalance
      }

      switch (voucher.type) {
        case 'credit':
          newAccountBalance += parseFloat(voucher.value)
          redemptionDetails.credit_added = parseFloat(voucher.value)
          break
          
        case 'messages':
          newMessageBalance += parseInt(voucher.value)
          redemptionDetails.messages_added = parseInt(voucher.value)
          break
          
        case 'percentage':
          // Percentage discount - we'll store it for later use in purchases
          // For now, just record the redemption
          redemptionDetails.discount_percentage = parseFloat(voucher.value)
          break
          
        case 'package':
          // Package voucher - assign package to customer
          if (voucher.package_id) {
            await client.query(`
              INSERT INTO customer_packages (
                customer_id, package_id, voucher_code, is_active, created_by
              ) VALUES ($1, $2, $3, true, $4)
            `, [targetCustomerId, voucher.package_id, voucherCode, currentUserId])
            
            redemptionDetails.package_assigned = voucher.package_id
          }
          break
          
        default:
          await client.query('ROLLBACK')
          return NextResponse.json({ error: 'Unknown voucher type' }, { status: 400 })
      }

      // Update customer balance
      await client.query(`
        UPDATE users
        SET account_balance = $1, message_balance = $2, 
            voucher_credits = COALESCE(voucher_credits, 0) + $3,
            last_voucher_redemption = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [
        newAccountBalance, 
        newMessageBalance, 
        voucher.type === 'credit' ? parseFloat(voucher.value) : 0,
        targetCustomerId
      ])

      // Record voucher usage
      await client.query(`
        INSERT INTO voucher_usage (
          voucher_id, user_id, used_at, ip_address, user_agent,
          credit_applied, messages_applied, discount_applied,
          package_assigned, created_by
        ) VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7, $8, $9)
      `, [
        voucher.id,
        targetCustomerId,
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        voucher.type === 'credit' ? parseFloat(voucher.value) : null,
        voucher.type === 'messages' ? parseInt(voucher.value) : null,
        voucher.type === 'percentage' ? parseFloat(voucher.value) : null,
        voucher.type === 'package' ? voucher.package_id : null,
        currentUserId
      ])

      // Update voucher usage count
      await client.query(`
        UPDATE vouchers
        SET usage_count = usage_count + 1
        WHERE id = $1
      `, [voucher.id])

      // Log the redemption
      await client.query(`
        INSERT INTO user_audit_log (
          user_id, action, performed_by, details, ip_address
        ) VALUES ($1, 'voucher_redeemed', $2, $3, $4)
      `, [
        targetCustomerId,
        session.user.email,
        JSON.stringify(redemptionDetails),
        request.headers.get('x-forwarded-for') || 'unknown'
      ])

      await client.query('COMMIT')

      return NextResponse.json({
        message: 'Voucher redeemed successfully',
        voucher: {
          code: voucher.code,
          description: voucher.description,
          type: voucher.type,
          value: voucher.value
        },
        customer: {
          newAccountBalance,
          newMessageBalance,
          creditAdded: redemptionDetails.credit_added || 0,
          messagesAdded: redemptionDetails.messages_added || 0
        }
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Redeem voucher error:', error)
    return NextResponse.json({ 
      error: 'Failed to redeem voucher',
      details: error.message 
    }, { status: 500 })
  }
}

// GET /api/customers/redeem-voucher - Get customer's voucher usage history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customer_id')

    // Get current user info
    const currentUserResult = await pool.query(`
      SELECT u.id, r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
    `, [session.user.email])

    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentUser = currentUserResult.rows[0]
    let targetCustomerId = customerId

    // If user is a customer and no customerId provided, show their own history
    if (!targetCustomerId && currentUser.role === 'CUSTOMER') {
      targetCustomerId = currentUser.id
    }

    // Admin users can view any customer's history
    if (currentUser.role !== 'CUSTOMER' && !(await checkCurrentUserPermission('customers.read'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (!targetCustomerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // Get voucher usage history
    const historyResult = await pool.query(`
      SELECT 
        vu.id, vu.used_at, vu.credit_applied, vu.messages_applied,
        vu.discount_applied, vu.package_assigned,
        v.code, v.description, v.type, v.value,
        p.name as package_name
      FROM voucher_usage vu
      JOIN vouchers v ON vu.voucher_id = v.id
      LEFT JOIN packages p ON vu.package_assigned = p.id
      WHERE vu.user_id = $1
      ORDER BY vu.used_at DESC
    `, [targetCustomerId])

    return NextResponse.json({
      customerId: targetCustomerId,
      voucherHistory: historyResult.rows,
      total: historyResult.rows.length
    })

  } catch (error) {
    console.error('Get voucher history error:', error)
    return NextResponse.json({ 
      error: 'Failed to get voucher history',
      details: error.message 
    }, { status: 500 })
  }
}