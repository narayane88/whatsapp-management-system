import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking complete payment flow status...')

    // 1. Check current user status
    const reshmaResult = await pool.query(`
      SELECT u.id, u.name, u.biz_points, u.commission_rate, u.dealer_code
      FROM users u 
      WHERE LOWER(u.name) = 'resham'
    `)

    const shejalResult = await pool.query(`
      SELECT u.id, u.name, u."parentId", u.dealer_code, r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE LOWER(u.name) = 'shejal'
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

    // 2. Check recent transactions (payment transactions)
    const recentTransactionsResult = await pool.query(`
      SELECT * FROM transactions 
      WHERE "userId" = $1::text
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `, [shejal.id.toString()])

    // 3. Check recent subscriptions
    const recentSubscriptionsResult = await pool.query(`
      SELECT * FROM customer_packages 
      WHERE "userId" = $1::text 
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `, [shejal.id.toString()])

    // 4. Check recent bizpoints transactions (commission entries)
    const recentBizpointsResult = await pool.query(`
      SELECT * FROM bizpoints_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [reshma.id])

    // 5. Check if there are matching transactions
    const paymentTransactions = recentTransactionsResult.rows
    const subscriptions = recentSubscriptionsResult.rows
    const commissionTransactions = recentBizpointsResult.rows

    // Find connections between payment and commission
    const connections = []
    
    paymentTransactions.forEach(payment => {
      // Find matching subscription
      const matchingSubscription = subscriptions.find(sub => 
        Math.abs(new Date(sub.createdAt).getTime() - new Date(payment.createdAt).getTime()) < 60000 // Within 1 minute
      )
      
      // Find matching commission
      const matchingCommission = commissionTransactions.find(comm => 
        comm.reference === payment.id ||
        comm.description.includes(payment.id) ||
        Math.abs(new Date(comm.created_at).getTime() - new Date(payment.createdAt).getTime()) < 60000
      )
      
      connections.push({
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt
        },
        subscription: matchingSubscription ? {
          id: matchingSubscription.id,
          packageId: matchingSubscription.packageId,
          isActive: matchingSubscription.isActive,
          createdAt: matchingSubscription.createdAt
        } : null,
        commission: matchingCommission ? {
          id: matchingCommission.id,
          amount: matchingCommission.amount,
          type: matchingCommission.type,
          balance: matchingCommission.balance,
          description: matchingCommission.description,
          createdAt: matchingCommission.created_at
        } : null,
        isComplete: !!matchingSubscription && !!matchingCommission
      })
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      users: {
        customer: {
          id: shejal.id,
          name: shejal.name,
          role: shejal.role,
          assignedDealer: shejal.parentId,
          dealerCode: shejal.dealer_code
        },
        dealer: {
          id: reshma.id,
          name: reshma.name,
          commissionRate: `${reshma.commission_rate}%`,
          currentBizpoints: `₹${reshma.biz_points}`,
          dealerCode: reshma.dealer_code
        }
      },
      recentActivity: {
        paymentTransactions: paymentTransactions.length,
        subscriptions: subscriptions.length,
        commissionTransactions: commissionTransactions.length
      },
      paymentFlowConnections: connections,
      allTransactions: {
        payments: paymentTransactions.map(t => ({
          id: t.id,
          amount: `₹${t.amount}`,
          currency: t.currency,
          status: t.status,
          method: t.method,
          description: t.description,
          createdAt: t.createdAt
        })),
        subscriptions: subscriptions.map(s => ({
          id: s.id,
          packageId: s.packageId,
          isActive: s.isActive,
          startDate: s.startDate,
          endDate: s.endDate,
          paymentMethod: s.paymentMethod,
          createdAt: s.createdAt
        })),
        commissions: commissionTransactions.map(c => ({
          id: c.id,
          type: c.type,
          amount: `₹${c.amount}`,
          balance: `₹${c.balance}`,
          description: c.description,
          reference: c.reference,
          createdAt: c.created_at
        }))
      },
      flowAnalysis: {
        commissionSystemActive: commissionTransactions.length > 0,
        paymentToCommissionRatio: paymentTransactions.length > 0 ? 
          (commissionTransactions.length / paymentTransactions.length) : 0,
        lastCommissionAmount: commissionTransactions.length > 0 ? 
          commissionTransactions[0].amount : 0,
        lastPaymentAmount: paymentTransactions.length > 0 ? 
          paymentTransactions[0].amount : 0,
        expectedCommissionOnNextPayment: paymentTransactions.length > 0 ? 
          paymentTransactions[0].amount * (parseFloat(reshma.commission_rate) / 100) : 0
      }
    })

  } catch (error) {
    console.error('Payment flow check error:', error)
    return NextResponse.json({ 
      error: 'Flow check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}