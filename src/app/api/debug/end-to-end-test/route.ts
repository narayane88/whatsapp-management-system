import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Running end-to-end commission test...')

    // Check current state
    const reshmaResult = await pool.query(`
      SELECT u.id, u.name, u.biz_points, u.commission_rate, u.dealer_code
      FROM users u 
      WHERE u.name = 'resham'
    `)

    const shejalResult = await pool.query(`
      SELECT u.id, u.name, u."parentId", u.dealer_code, r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.name = 'shejal'
    `)

    if (reshmaResult.rows.length === 0 || shejalResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Test users not found',
        reshmaFound: reshmaResult.rows.length > 0,
        shejalFound: shejalResult.rows.length > 0 
      })
    }

    const reshma = reshmaResult.rows[0]
    const shejal = shejalResult.rows[0]

    // Get recent bizcoins transactions
    const recentTransactionsResult = await pool.query(`
      SELECT * FROM bizpoints_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [reshma.id])

    // Check if relationship is correct
    const relationshipCorrect = shejal.parentId === reshma.id
    const roleCorrect = shejal.role === 'CUSTOMER'

    // Test commission calculation
    const testAmount = 150
    const expectedCommission = testAmount * (parseFloat(reshma.commission_rate) / 100)

    return NextResponse.json({
      summary: {
        relationshipConfigured: relationshipCorrect,
        roleConfigured: roleCorrect,
        commissionSystemReady: relationshipCorrect && roleCorrect && parseFloat(reshma.commission_rate) > 0,
        testAmount: testAmount,
        expectedCommission: expectedCommission
      },
      dealer: {
        id: reshma.id,
        name: reshma.name,
        dealerCode: reshma.dealer_code,
        commissionRate: `${reshma.commission_rate}%`,
        currentBalance: `₹${reshma.biz_points}`,
        balanceNumeric: parseFloat(reshma.biz_points)
      },
      customer: {
        id: shejal.id,
        name: shejal.name,
        dealerCode: shejal.dealer_code,
        role: shejal.role,
        assignedToDealer: shejal.parentId,
        relationshipValid: relationshipCorrect
      },
      recentTransactions: recentTransactionsResult.rows.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: `₹${tx.amount}`,
        balance: `₹${tx.balance}`,
        description: tx.description,
        createdAt: tx.created_at
      })),
      paymentFlowTest: {
        message: 'When Shejal completes a successful Razorpay payment:',
        steps: [
          '1. Payment verification succeeds',
          '2. Subscription is activated',
          '3. Transaction record is created',
          '4. Commission hook is triggered',
          '5. Reshma receives commission in bizcoins',
          `6. For ₹${testAmount} payment, Reshma should receive ₹${expectedCommission} commission`
        ]
      },
      recommendations: [
        !relationshipCorrect ? 'Fix: Ensure Shejal is assigned to Reshma as dealer' : null,
        !roleCorrect ? 'Fix: Ensure Shejal has CUSTOMER role' : null,
        parseFloat(reshma.commission_rate) <= 0 ? 'Fix: Set commission rate for Reshma' : null,
        'Test: Complete a real payment through the UI to verify full flow'
      ].filter(Boolean)
    })

  } catch (error) {
    console.error('End-to-end test error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}