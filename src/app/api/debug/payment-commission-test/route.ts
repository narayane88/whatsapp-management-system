import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') || '16' // Default to Shejal
    const testAmount = parseFloat(searchParams.get('amount') || '100') // Test amount in rupees

    console.log(`🧪 Testing commission flow for customer ${customerId} with amount ₹${testAmount}`)

    // Step 1: Get current bizcoins balance before commission
    const dealerBeforeResult = await pool.query(`
      SELECT u.id, u.name, u.biz_points, u.commission_rate
      FROM users u
      WHERE u.id = (
        SELECT "parentId" FROM users WHERE id = $1
      )
    `, [customerId])

    if (dealerBeforeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Dealer not found for this customer' }, { status: 404 })
    }

    const dealerBefore = dealerBeforeResult.rows[0]
    const balanceBefore = parseFloat(dealerBefore.biz_points) || 0

    console.log(`💰 Dealer ${dealerBefore.name} current balance: ₹${balanceBefore}`)

    // Step 2: Simulate commission processing by calling the commission API
    const commissionResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/bizpoints/commission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer simulated-session' // This will be ignored since it's localhost
      },
      body: JSON.stringify({
        customerId: parseInt(customerId),
        transactionAmount: testAmount,
        transactionReference: `test_tx_${Date.now()}`
      })
    })

    let commissionResult = null
    let commissionError = null

    if (commissionResponse.ok) {
      commissionResult = await commissionResponse.json()
      console.log('✅ Commission processed successfully:', commissionResult)
    } else {
      commissionError = await commissionResponse.text()
      console.log('❌ Commission processing failed:', commissionError)
    }

    // Step 3: Get updated bizcoins balance after commission
    const dealerAfterResult = await pool.query(`
      SELECT u.id, u.name, u.biz_points
      FROM users u
      WHERE u.id = $1
    `, [dealerBefore.id])

    const dealerAfter = dealerAfterResult.rows[0]
    const balanceAfter = parseFloat(dealerAfter.biz_points) || 0
    const balanceIncrease = balanceAfter - balanceBefore

    console.log(`💰 Dealer ${dealerAfter.name} new balance: ₹${balanceAfter} (increase: ₹${balanceIncrease})`)

    // Step 4: Get the latest bizpoints transaction for this dealer
    const latestTransactionResult = await pool.query(`
      SELECT * FROM bizpoints_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [dealerBefore.id])

    const latestTransaction = latestTransactionResult.rows[0] || null

    return NextResponse.json({
      testDetails: {
        customerId: parseInt(customerId),
        testAmount: testAmount,
        timestamp: new Date().toISOString()
      },
      dealer: {
        id: dealerBefore.id,
        name: dealerBefore.name,
        commissionRate: dealerBefore.commission_rate,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        balanceIncrease: balanceIncrease
      },
      commission: {
        processed: commissionResponse.ok,
        result: commissionResult,
        error: commissionError,
        responseStatus: commissionResponse.status
      },
      latestTransaction: latestTransaction,
      analysis: {
        commissionWorking: commissionResponse.ok && balanceIncrease > 0,
        expectedCommission: testAmount * (parseFloat(dealerBefore.commission_rate) / 100),
        actualIncrease: balanceIncrease,
        isCorrect: Math.abs(balanceIncrease - (testAmount * (parseFloat(dealerBefore.commission_rate) / 100))) < 0.01
      }
    })

  } catch (error) {
    console.error('Payment commission test error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Payment Commission Test Endpoint',
    usage: 'POST /api/debug/payment-commission-test?customerId=16&amount=100',
    description: 'Tests the complete commission flow simulation'
  })
}