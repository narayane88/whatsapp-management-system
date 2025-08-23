import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

/**
 * POST /api/admin/bizpoints/commission - Process commission for customer transactions
 * 
 * @description Automatically processes commission distribution when customers make payments
 * @authentication Required - Admin access
 * @param {string} customerId - Customer ID who made the payment
 * @param {number} transactionAmount - Amount of the transaction
 * @param {string} transactionReference - Reference to the original transaction
 * @returns {Object} Commission processing results
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { customerId, transactionAmount, transactionReference } = body

    // Validation
    if (!customerId || !transactionAmount || !transactionReference) {
      return NextResponse.json({ 
        error: 'Missing required fields: customerId, transactionAmount, transactionReference' 
      }, { status: 400 })
    }

    if (transactionAmount <= 0) {
      return NextResponse.json({ 
        error: 'Transaction amount must be greater than 0' 
      }, { status: 400 })
    }

    console.log(`🔄 Processing commission for customer ${customerId}, amount: ₹${transactionAmount}`)

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
        error: 'Commission only applies to customers with assigned dealers' 
      }, { status: 400 })
    }

    const commissionsProcessed = []
    let currentDealerId = customer.parent_id

    // Process commission for the dealer hierarchy
    // CUSTOMER (Level 5) -> SUBDEALER (Level 4) -> EMPLOYEE (Level 3) -> ADMIN (Level 2) -> OWNER (Level 1)
    while (currentDealerId && commissionsProcessed.length < 4) {
      try {
        // Get dealer details
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
          break
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
          const newBalance = parseFloat(dealer.biz_points) + commissionAmount

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

        // Move to next level in hierarchy
        currentDealerId = dealer.parent_id
        
      } catch (error) {
        console.error(`Error processing commission for dealer ${currentDealerId}:`, error)
        break
      }
    }

    // Calculate total commission distributed
    const totalCommissionDistributed = commissionsProcessed.reduce((sum, comm) => sum + comm.commissionAmount, 0)

    console.log(`✅ Commission processing completed. Total distributed: ₹${totalCommissionDistributed} to ${commissionsProcessed.length} dealers`)

    return NextResponse.json({
      message: 'Commission processing completed successfully',
      customer: {
        id: customer.id,
        name: customer.name,
        dealerCode: customer.dealer_code
      },
      transactionAmount,
      transactionReference,
      totalCommissionDistributed,
      commissionsProcessed: commissionsProcessed.length,
      commissions: commissionsProcessed
    }, { status: 201 })

  } catch (error) {
    console.error('Commission processing error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/bizpoints/commission - Get commission calculation preview
 * 
 * @description Preview commission distribution for a given transaction amount
 * @authentication Required - Admin access
 * @param {string} customerId - Customer ID
 * @param {number} amount - Transaction amount to calculate commission for
 * @returns {Object} Commission calculation preview
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const amount = parseFloat(searchParams.get('amount') || '0')

    if (!customerId || amount <= 0) {
      return NextResponse.json({ 
        error: 'Valid customerId and amount parameters are required' 
      }, { status: 400 })
    }

    // Get customer details and dealer hierarchy
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
        error: 'Commission preview only applies to customers with assigned dealers' 
      }, { status: 400 })
    }

    const commissionPreview = []
    let currentDealerId = customer.parent_id
    let totalCommission = 0

    // Preview commission for the dealer hierarchy
    while (currentDealerId && commissionPreview.length < 4) {
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
        break
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
          case 'SUBDEALER':
            commissionRate = 0.10 // 10% default
            break
          case 'EMPLOYEE':
            commissionRate = 0.03 // 3% default
            break
          case 'ADMIN':
            commissionRate = 0.02 // 2% default
            break
          case 'OWNER':
            commissionRate = 0.01 // 1% default
            break
          default:
            commissionRate = 0
        }
      }

      if (commissionRate > 0) {
        const commissionAmount = parseFloat((amount * commissionRate).toFixed(2))
        const newBalance = parseFloat(dealer.biz_points) + commissionAmount
        totalCommission += commissionAmount

        commissionPreview.push({
          dealerId: dealer.id,
          dealerName: dealer.name,
          dealerCode: dealer.dealer_code,
          role: dealer.role_name,
          currentBalance: parseFloat(dealer.biz_points),
          commissionRate: commissionRate * 100, // Convert to percentage
          commissionAmount,
          newBalance
        })
      }

      currentDealerId = dealer.parent_id
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        dealerCode: customer.dealer_code
      },
      transactionAmount: amount,
      totalCommission,
      commissionPreview
    })

  } catch (error) {
    console.error('Commission preview error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}