import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { razorpayService } from '@/lib/payments/razorpay'
import { readApiKeysFromCSV, isValidApiCredential } from '@/lib/utils/csv-reader'
import fs from 'fs/promises'
import path from 'path'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

interface VerifyBizCoinsPaymentRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  purchase_details: {
    baseAmount: number
    commissionBonus: number
    totalCoins: number
    description: string
  }
}

// Load payment methods configuration
async function loadPaymentMethods() {
  try {
    const configFile = path.join(process.cwd(), 'config', 'payment-methods.json')
    const data = await fs.readFile(configFile, 'utf8')
    const paymentMethods = JSON.parse(data)
    
    // Load API keys from CSV and merge with config
    const apiKeys = await readApiKeysFromCSV()
    
    paymentMethods.forEach((method: any) => {
      if (method.provider && apiKeys[method.provider]) {
        const csvKeys = apiKeys[method.provider]
        
        if (isValidApiCredential(csvKeys.keyId)) {
          method.config.keyId = csvKeys.keyId
          method.config.keySecret = csvKeys.keySecret
          method.config.webhookSecret = csvKeys.webhookSecret
          method.config.mockMode = false
        }
      }
    })
    
    return paymentMethods
  } catch (error) {
    console.error('Error loading payment methods:', error)
    return []
  }
}

// Process BizCoins purchase after successful payment
async function processBizCoinsPurchase(paymentData: any, session: any) {
  try {
    // Get user data from session
    const userResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email, r.level,
        COALESCE(u.commission_rate, 0) as commission_rate
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u."isActive" = true
    `, [session.user.email])

    if (userResult.rows.length === 0) {
      throw new Error('User not found')
    }

    const user = userResult.rows[0]
    
    console.log('🪙 Processing BizCoins purchase:', {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      paymentId: paymentData.razorpay_payment_id,
      orderId: paymentData.razorpay_order_id,
      amount: paymentData.amount,
      totalCoins: paymentData.totalCoins
    })

    // Begin transaction
    await pool.query('BEGIN')

    try {
      // Get current balance
      const balanceResult = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as balance
        FROM bizpoints_transactions
        WHERE user_id = $1
      `, [user.id])

      const currentBalance = parseFloat(balanceResult.rows[0]?.balance || '0')

      // Create payment transaction record in main transactions table
      const transactionId = `tx_bizcoins_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      
      await pool.query(`
        INSERT INTO transactions (
          id, "userId", type, method, amount, currency, status, reference, 
          description, "gatewayData", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2::text, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
        )
      `, [
        transactionId,
        user.id.toString(),
        'PURCHASE',
        'RAZORPAY',
        paymentData.amount,
        paymentData.currency,
        'SUCCESS',
        paymentData.razorpay_payment_id,
        `BizCoins purchase: ${paymentData.baseAmount} + ${paymentData.commissionBonus} bonus = ${paymentData.totalCoins} total`,
        JSON.stringify({
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_order_id: paymentData.razorpay_order_id,
          baseAmount: paymentData.baseAmount,
          commissionBonus: paymentData.commissionBonus,
          totalCoins: paymentData.totalCoins,
          commissionRate: user.commission_rate,
          verification_method: 'frontend_callback',
          verified_at: new Date().toISOString()
        })
      ])

      console.log('✅ Payment transaction record created:', transactionId)

      // Create base purchase transaction in bizpoints_transactions
      const purchaseId = `bp${Date.now()}${Math.random().toString(36).substr(2, 8)}`
      
      const purchaseResult = await pool.query(`
        INSERT INTO bizpoints_transactions (
          id, user_id, type, amount, balance, description, reference, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id, created_at
      `, [
        purchaseId,
        user.id,
        'PURCHASED',
        paymentData.baseAmount,
        currentBalance + paymentData.baseAmount,
        paymentData.description || `BizCoins purchase via Razorpay - ₹${paymentData.baseAmount}`,
        paymentData.razorpay_payment_id,
        user.id
      ])

      let finalBalance = currentBalance + paymentData.baseAmount

      // Create commission bonus transaction if applicable
      let commissionTransaction = null
      if (paymentData.commissionBonus && paymentData.commissionBonus > 0) {
        const commissionId = `bp${Date.now()}${Math.random().toString(36).substr(2, 8)}`
        
        const commissionResult = await pool.query(`
          INSERT INTO bizpoints_transactions (
            id, user_id, type, amount, balance, description, reference, created_by, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING id, created_at
        `, [
          commissionId,
          user.id,
          'COMMISSION_EARNED',
          paymentData.commissionBonus,
          finalBalance + paymentData.commissionBonus,
          `Commission bonus from purchase (${user.commission_rate}% of ₹${paymentData.baseAmount})`,
          `COMMISSION_${purchaseId}`,
          user.id
        ])

        commissionTransaction = commissionResult.rows[0]
        finalBalance += paymentData.commissionBonus
      }

      // Commit transaction
      await pool.query('COMMIT')

      console.log('✅ BizCoins purchase processed successfully:', {
        userId: user.id,
        userName: user.name,
        purchaseTransactionId: purchaseId,
        commissionTransactionId: commissionTransaction?.id,
        mainTransactionId: transactionId,
        baseAmount: paymentData.baseAmount,
        commissionBonus: paymentData.commissionBonus,
        totalCoins: paymentData.totalCoins,
        finalBalance: finalBalance
      })

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          level: user.level
        },
        purchase: {
          transactionId: transactionId,
          purchaseTransactionId: purchaseId,
          commissionTransactionId: commissionTransaction?.id,
          baseAmount: paymentData.baseAmount,
          commissionBonus: paymentData.commissionBonus,
          totalCoins: paymentData.totalCoins,
          finalBalance: finalBalance,
          processedAt: new Date().toISOString()
        }
      }

    } catch (transactionError) {
      // Rollback transaction
      await pool.query('ROLLBACK')
      throw transactionError
    }

  } catch (error) {
    console.error('❌ Error processing BizCoins purchase:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: VerifyBizCoinsPaymentRequest = await request.json()
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      purchase_details
    } = body

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ 
        error: 'Missing required payment verification fields' 
      }, { status: 400 })
    }

    // Load payment methods
    const paymentMethods = await loadPaymentMethods()
    const razorpayMethod = paymentMethods.find((m: any) => m.id === 'razorpay')

    if (!razorpayMethod || !razorpayMethod.isActive) {
      return NextResponse.json({ 
        error: 'Razorpay payment method not available' 
      }, { status: 400 })
    }

    // Initialize Razorpay service
    const initialized = await razorpayService.initialize({
      keyId: razorpayMethod.config.keyId,
      keySecret: razorpayMethod.config.keySecret,
      isTestMode: razorpayMethod.config.isTestMode
    })

    if (!initialized) {
      return NextResponse.json({ 
        error: 'Failed to initialize payment service' 
      }, { status: 500 })
    }

    // Verify payment signature
    const isValidSignature = await razorpayService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValidSignature) {
      console.error('Invalid BizCoins payment signature:', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      })
      
      return NextResponse.json({ 
        error: 'Invalid payment signature' 
      }, { status: 400 })
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await razorpayService.fetchPayment(razorpay_payment_id)

    if (paymentDetails.status !== 'captured') {
      return NextResponse.json({ 
        error: 'Payment not captured' 
      }, { status: 400 })
    }

    // Process BizCoins purchase
    const result = await processBizCoinsPurchase({
      razorpay_payment_id,
      razorpay_order_id,
      amount: Number(paymentDetails.amount) / 100, // Convert from paise
      currency: paymentDetails.currency,
      baseAmount: purchase_details.baseAmount,
      commissionBonus: purchase_details.commissionBonus,
      totalCoins: purchase_details.totalCoins,
      description: purchase_details.description
    }, session)

    return NextResponse.json({
      success: true,
      message: 'BizCoins purchase verified and processed successfully',
      payment: {
        id: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: Number(paymentDetails.amount) / 100,
        currency: paymentDetails.currency,
        status: paymentDetails.status,
        method: paymentDetails.method,
        createdAt: new Date(paymentDetails.created_at * 1000).toISOString()
      },
      purchase: result.purchase,
      user: result.user
    })

  } catch (error) {
    console.error('Error verifying BizCoins payment:', error)
    return NextResponse.json({ 
      error: 'Failed to verify BizCoins payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}