import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function POST(request: NextRequest) {
  try {
    const { customerId, transactionAmount, transactionReference } = await request.json()

    console.log(`🧪 Direct commission test for customer ${customerId}, amount: ₹${transactionAmount}`)

    // Get customer details and find their dealer hierarchy
    const customerDetails = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u."parentId" as parent_id, u.dealer_code,
        r.name as role_name, r.level as role_level
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
    `, [customerId])

    if (customerDetails.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const customer = customerDetails.rows[0]
    
    if (customer.role_name !== 'CUSTOMER' || !customer.parent_id) {
      return NextResponse.json({ 
        error: 'Commission only applies to customers with assigned dealers',
        customer: customer
      }, { status: 400 })
    }

    const commissionsProcessed = []
    let currentDealerId = customer.parent_id

    // Process commission for the dealer (only first level for testing)
    const dealerDetails = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u."parentId" as parent_id, u.dealer_code,
        u.commission_rate, u.biz_points,
        r.name as role_name, r.level as role_level
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
    `, [currentDealerId])

    if (dealerDetails.rows.length === 0) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 })
    }

    const dealer = dealerDetails.rows[0]
    
    // Calculate commission based on dealer's configured commission rate
    let commissionRate = 0
    
    if (dealer.commission_rate && dealer.commission_rate > 0) {
      // Use the dealer's configured commission rate from their profile
      // Note: commission_rate is stored as percentage (e.g., 5.00 for 5%), so divide by 100
      commissionRate = parseFloat(dealer.commission_rate) / 100
    } else {
      // Fallback to default rates based on role level if no custom rate is set
      switch (dealer.role_name) {
        case 'SUBDEALER': // Level 4 - Direct dealer
          commissionRate = 0.10 // 10% default
          break
        case 'EMPLOYEE': // Level 3 - Middle management
          commissionRate = 0.03 // 3% default
          break
        case 'ADMIN': // Level 2 - Administrator
          commissionRate = 0.02 // 2% default
          break
        case 'OWNER': // Level 1 - Owner
          commissionRate = 0.01 // 1% default
          break
        default:
          commissionRate = 0
      }
    }

    console.log(`💼 ${dealer.role_name} ${dealer.name}: Using ${dealer.commission_rate ? 'custom' : 'default'} commission rate: ${commissionRate * 100}%`)

    if (commissionRate > 0) {
      const commissionAmount = parseFloat((transactionAmount * commissionRate).toFixed(2))
      const oldBalance = parseFloat(dealer.biz_points) || 0
      const newBalance = oldBalance + commissionAmount

      console.log(`💰 Awarding ${commissionRate * 100}% commission (₹${commissionAmount}) to ${dealer.role_name} ${dealer.name}`)

      // Generate transaction ID
      const transactionId = `bp${Date.now()}${Math.random().toString(36).substring(2, 9)}`

      // Start database transaction
      await pool.query('BEGIN')

      try {
        // Update dealer's BizPoints balance
        await pool.query(`
          UPDATE users 
          SET biz_points = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
        `, [newBalance, dealer.id])

        // Create BizPoints transaction record
        await pool.query(`
          INSERT INTO bizpoints_transactions (
            id, user_id, type, amount, balance, description, reference, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          transactionId,
          dealer.id,
          'COMMISSION_EARNED',
          commissionAmount,
          newBalance,
          `Commission from ${customer.name} (${customer.dealer_code}) payment of ₹${transactionAmount}`,
          transactionReference
        ])

        await pool.query('COMMIT')

        commissionsProcessed.push({
          dealerId: dealer.id,
          dealerName: dealer.name,
          dealerCode: dealer.dealer_code,
          role: dealer.role_name,
          commissionRate: commissionRate * 100, // Convert to percentage
          commissionAmount,
          oldBalance,
          newBalance,
          transactionId
        })

        console.log(`✅ Commission processed for ${dealer.role_name} ${dealer.name}: ₹${commissionAmount}`)

      } catch (error) {
        await pool.query('ROLLBACK')
        console.error(`❌ Failed to process commission for ${dealer.name}:`, error)
        throw error
      }
    }

    // Calculate total commission distributed
    const totalCommissionDistributed = commissionsProcessed.reduce((sum, comm) => sum + comm.commissionAmount, 0)

    console.log(`✅ Direct commission test completed. Total distributed: ₹${totalCommissionDistributed} to ${commissionsProcessed.length} dealers`)

    return NextResponse.json({
      message: 'Direct commission test completed successfully',
      customer: {
        id: customer.id,
        name: customer.name,
        dealerCode: customer.dealer_code,
        role: customer.role_name
      },
      transactionAmount,
      transactionReference,
      totalCommissionDistributed,
      commissionsProcessed: commissionsProcessed.length,
      commissions: commissionsProcessed,
      testSuccessful: commissionsProcessed.length > 0 && totalCommissionDistributed > 0
    }, { status: 201 })

  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {}) // Ensure rollback
    console.error('Direct commission test error:', error)
    return NextResponse.json({ 
      error: 'Direct commission test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Direct Commission Test Endpoint',
    usage: 'POST with body: {"customerId": 16, "transactionAmount": 100, "transactionReference": "test_tx"}',
    description: 'Tests commission processing logic directly without authentication'
  })
}