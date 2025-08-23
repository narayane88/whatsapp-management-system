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

interface VerifyPaymentRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  customer_id: string
  package_id: string
}

// Load payment methods configuration with CSV credentials
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
          console.log('✅ Payment verification using real CSV credentials for', method.provider)
        } else {
          method.config.mockMode = true
          console.log('⚠️ Payment verification using mock mode for', method.provider)
        }
      }
    })
    
    return paymentMethods
  } catch (error) {
    console.error('Error loading payment methods:', error)
    return []
  }
}

// Log successful payment
async function logPaymentSuccess(paymentData: any) {
  try {
    const logDir = path.join(process.cwd(), 'logs')
    const logFile = path.join(logDir, 'successful-payments.log')
    
    // Ensure logs directory exists
    try {
      await fs.access(logDir)
    } catch {
      await fs.mkdir(logDir, { recursive: true })
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      paymentId: paymentData.razorpay_payment_id,
      orderId: paymentData.razorpay_order_id,
      customerId: paymentData.customer_id,
      packageId: paymentData.package_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: 'success'
    }

    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n')
  } catch (error) {
    console.error('Error logging payment success:', error)
  }
}

// Process subscription activation with database operations
async function activateSubscription(customerId: string, packageId: string, paymentData: any, session: any) {
  try {
    // Get real user data from session to ensure correct user is used
    let realUserId = customerId
    let realUserEmail = 'unknown@example.com'
    let realUserName = 'Unknown User'
    
    if (session?.user?.email) {
      try {
        const userResult = await pool.query(
          'SELECT id, name, email FROM users WHERE email = $1',
          [session.user.email]
        )
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0]
          realUserId = user.id.toString()
          realUserEmail = user.email
          realUserName = user.name || user.email.split('@')[0]
        }
      } catch (error) {
        console.error('Error fetching user data for subscription:', error)
      }
    }
    
    console.log('🚀 Activating subscription with real user data:', {
      realUserId,
      realUserEmail,
      realUserName,
      packageId,
      paymentId: paymentData.razorpay_payment_id,
      orderId: paymentData.razorpay_order_id,
      amount: paymentData.amount
    })

    // Get package details for duration
    const packageResult = await pool.query(`
      SELECT id, name, price, duration FROM packages WHERE id = $1 AND "isActive" = true
    `, [packageId])

    if (packageResult.rows.length === 0) {
      throw new Error(`Package ${packageId} not found or inactive`)
    }

    const pkg = packageResult.rows[0]
    const duration = pkg.duration || 30 // fallback to 30 days

    // Create transaction record
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    await pool.query(`
      INSERT INTO transactions (
        id, "userId", type, method, amount, currency, status, reference, 
        description, "gatewayData", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2::text, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      )
    `, [
      transactionId,
      realUserId,
      'PURCHASE',
      'RAZORPAY',
      paymentData.amount,
      paymentData.currency,
      'SUCCESS',
      paymentData.razorpay_payment_id,
      `Package purchase: ${pkg.name}`,
      JSON.stringify({
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id: paymentData.razorpay_order_id,
        verification_method: 'frontend_callback',
        verified_at: new Date().toISOString(),
        customer_name: realUserName,
        customer_email: realUserEmail
      })
    ])

    console.log('✅ Transaction record created:', transactionId)

    // Create subscription record
    const subscriptionId = `cs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + (duration * 24 * 60 * 60 * 1000))

    // Deactivate existing subscriptions
    await pool.query(`
      UPDATE customer_packages 
      SET "isActive" = false, "updatedAt" = NOW() 
      WHERE "userId" = $1::text AND "isActive" = true AND "endDate" > NOW()
    `, [realUserId])

    // Create new active subscription
    await pool.query(`
      INSERT INTO customer_packages (
        id, "userId", "packageId", "startDate", "endDate", "isActive", 
        "messagesUsed", "paymentMethod", "createdAt", "updatedAt", "createdBy"
      ) VALUES (
        $1, $2::text, $3, $4, $5, true, 0, $6, NOW(), NOW(), $7::integer
      )
    `, [
      subscriptionId,
      realUserId,
      packageId,
      startDate,
      endDate,
      'RAZORPAY',
      parseInt(realUserId) // Convert to integer for createdBy field
    ])

    console.log('✅ Active subscription created:', {
      subscriptionId,
      realUserId,
      realUserEmail,
      realUserName,
      packageId,
      packageName: pkg.name,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      duration: `${duration} days`
    })
    
    return {
      subscriptionId: subscriptionId,
      transactionId: transactionId,
      customerId: realUserId, // Include the real customer ID
      packageName: pkg.name,
      activatedAt: startDate.toISOString(),
      expiresAt: endDate.toISOString(),
      duration: duration,
      status: 'active'
    }
  } catch (error) {
    console.error('❌ Error activating subscription:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: VerifyPaymentRequest = await request.json()
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      customer_id,
      package_id
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
      console.error('Invalid payment signature:', {
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

    // Log successful payment
    await logPaymentSuccess({
      razorpay_payment_id,
      razorpay_order_id,
      customer_id,
      package_id,
      amount: paymentDetails.amount / 100, // Convert from paise
      currency: paymentDetails.currency
    })

    // Activate subscription
    const subscription = await activateSubscription(customer_id, package_id, {
      razorpay_payment_id,
      razorpay_order_id,
      amount: paymentDetails.amount / 100,
      currency: paymentDetails.currency
    }, session)

    // Process dealer commission if customer has a dealer assigned
    let commissionResult = null
    try {
      console.log('🎯 Processing dealer commission for subscription payment...', {
        customerId: subscription.customerId,
        transactionAmount: paymentDetails.amount / 100,
        transactionReference: subscription.transactionId
      })
      
      const commissionResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/bizpoints/commission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || ''
        },
        body: JSON.stringify({
          customerId: parseInt(subscription.customerId),
          transactionAmount: paymentDetails.amount / 100,
          transactionReference: subscription.transactionId
        })
      })

      if (commissionResponse.ok) {
        commissionResult = await commissionResponse.json()
        console.log('✅ Dealer commission processed successfully:', {
          totalCommissionDistributed: commissionResult.totalCommissionDistributed,
          commissionsProcessed: commissionResult.commissionsProcessed
        })
      } else {
        const errorData = await commissionResponse.json()
        console.log('ℹ️ Commission processing skipped:', errorData.error)
        // Don't fail the payment if commission fails - log and continue
      }
    } catch (error) {
      console.error('⚠️ Commission processing error (non-critical):', error)
      // Commission failure should not break payment verification
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated successfully',
      payment: {
        id: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: paymentDetails.amount / 100,
        currency: paymentDetails.currency,
        status: paymentDetails.status,
        method: paymentDetails.method,
        createdAt: new Date(paymentDetails.created_at * 1000).toISOString()
      },
      subscription: subscription,
      commission: commissionResult ? {
        processed: true,
        totalDistributed: commissionResult.totalCommissionDistributed,
        dealersRewarded: commissionResult.commissionsProcessed,
        details: commissionResult.commissions
      } : {
        processed: false,
        reason: 'Customer has no assigned dealer or commission processing failed'
      }
    })

  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ 
      error: 'Failed to verify payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}