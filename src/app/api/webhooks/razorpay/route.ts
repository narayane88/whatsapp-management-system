import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { readApiKeysFromCSV, isValidApiCredential } from '@/lib/utils/csv-reader'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// Load payment methods configuration with CSV credentials
async function loadPaymentMethods() {
  try {
    const configFile = path.join(process.cwd(), 'config', 'payment-methods.json')
    const data = await fs.readFile(configFile, 'utf8')
    const paymentMethods = JSON.parse(data)
    
    // Load API keys from CSV and merge with config
    const apiKeys = await readApiKeysFromCSV()
    
    // Update payment methods with CSV credentials
    paymentMethods.forEach((method: any) => {
      if (method.provider && apiKeys[method.provider]) {
        const csvKeys = apiKeys[method.provider]
        
        // Check if CSV credentials are valid (not placeholder values)
        if (isValidApiCredential(csvKeys.keyId)) {
          method.config.keyId = csvKeys.keyId
          method.config.keySecret = csvKeys.keySecret
          method.config.webhookSecret = csvKeys.webhookSecret
          method.config.mockMode = false
          console.log('✅ Webhook using real CSV credentials for', method.provider)
        } else {
          method.config.mockMode = true
          console.log('⚠️ Webhook using mock mode for', method.provider)
        }
      }
    })
    
    return paymentMethods
  } catch (error) {
    console.error('Error loading payment methods:', error)
    return []
  }
}

// Verify Razorpay webhook signature
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

// Log webhook events
async function logWebhookEvent(event: any) {
  try {
    const logDir = path.join(process.cwd(), 'logs')
    const logFile = path.join(logDir, 'payment-webhooks.log')
    
    // Ensure logs directory exists
    try {
      await fs.access(logDir)
    } catch {
      await fs.mkdir(logDir, { recursive: true })
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      event: event.event,
      paymentId: event.payload?.payment?.entity?.id || 'unknown',
      orderId: event.payload?.order?.entity?.id || 'unknown',
      status: event.payload?.payment?.entity?.status || 'unknown',
      amount: event.payload?.payment?.entity?.amount || 0,
      rawEvent: event
    }

    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n')
  } catch (error) {
    console.error('Error logging webhook event:', error)
  }
}

// Process payment success
async function processPaymentSuccess(paymentData: any) {
  try {
    console.log('Processing payment success:', {
      paymentId: paymentData.id,
      orderId: paymentData.order_id,
      amount: paymentData.amount,
      status: paymentData.status,
      notes: paymentData.notes
    })

    // Extract customer and package information from notes
    const notes = paymentData.notes || {}
    const customerId = notes.customerId
    const packageId = notes.packageId
    const packageName = notes.packageName
    const duration = notes.duration

    if (customerId && packageId) {
      // Log subscription activation
      const activationLog = {
        timestamp: new Date().toISOString(),
        customerId: customerId,
        packageId: packageId,
        packageName: packageName,
        paymentId: paymentData.id,
        orderId: paymentData.order_id,
        amount: paymentData.amount / 100, // Convert from paise
        duration: duration,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (duration * 24 * 60 * 60 * 1000)).toISOString(),
        status: 'active'
      }

      // Save subscription activation log
      const logDir = path.join(process.cwd(), 'logs')
      const activationFile = path.join(logDir, 'subscription-activations.log')
      
      try {
        await fs.access(logDir)
      } catch {
        await fs.mkdir(logDir, { recursive: true })
      }

      await fs.appendFile(activationFile, JSON.stringify(activationLog) + '\n')

      console.log('Subscription activated:', activationLog)

      // Create transaction record directly in database
      try {
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
          customerId,
          'PURCHASE',
          'RAZORPAY',
          paymentData.amount / 100, // Convert from paise
          'INR',
          'SUCCESS',
          paymentData.id,
          `Package purchase: ${packageName}`,
          JSON.stringify({
            razorpay_payment_id: paymentData.id,
            razorpay_order_id: paymentData.order_id,
            webhook_processed_at: new Date().toISOString()
          })
        ])

        console.log('✅ Transaction record created successfully:', transactionId)
      } catch (error) {
        console.error('❌ Error creating transaction record:', error)
      }

      // Create subscription record directly in database
      if (packageId && duration) {
        try {
          const subscriptionId = `cs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          const startDate = new Date()
          const endDate = new Date(startDate.getTime() + (duration * 24 * 60 * 60 * 1000))

          // Check if user already has active subscription and deactivate it
          await pool.query(`
            UPDATE customer_packages 
            SET "isActive" = false, "updatedAt" = NOW() 
            WHERE "userId" = $1::text AND "isActive" = true AND "endDate" > NOW()
          `, [customerId])

          // Create new active subscription
          await pool.query(`
            INSERT INTO customer_packages (
              id, "userId", "packageId", "startDate", "endDate", "isActive", 
              "messagesUsed", "paymentMethod", "createdAt", "updatedAt", "createdBy"
            ) VALUES (
              $1, $2::text, $3, $4, $5, true, 0, $6, NOW(), NOW(), null
            )
          `, [
            subscriptionId,
            customerId,
            packageId,
            startDate,
            endDate,
            'RAZORPAY'
          ])

          console.log('✅ Active subscription created successfully:', {
            subscriptionId,
            customerId,
            packageId,
            packageName,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            duration: `${duration} days`
          })

          // Process dealer commission after successful subscription creation
          try {
            console.log('🎯 Processing dealer commission for webhook payment...')
            
            const commissionResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/bizpoints/commission`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                customerId: parseInt(customerId),
                transactionAmount: paymentData.amount / 100, // Convert from paise
                transactionReference: transactionId
              })
            })

            if (commissionResponse.ok) {
              const commissionResult = await commissionResponse.json()
              console.log('✅ Webhook dealer commission processed successfully:', {
                totalCommissionDistributed: commissionResult.totalCommissionDistributed,
                commissionsProcessed: commissionResult.commissionsProcessed
              })
            } else {
              const errorData = await commissionResponse.json()
              console.log('ℹ️ Webhook commission processing skipped:', errorData.error)
            }
          } catch (error) {
            console.error('⚠️ Webhook commission processing error (non-critical):', error)
            // Commission failure should not break webhook processing
          }

        } catch (error) {
          console.error('❌ Error creating subscription record:', error)
        }
      }
    }
    
  } catch (error) {
    console.error('Error processing payment success:', error)
  }
}

// Process payment failure
async function processPaymentFailure(paymentData: any) {
  try {
    console.log('Processing payment failure:', {
      paymentId: paymentData.id,
      orderId: paymentData.order_id,
      errorCode: paymentData.error_code,
      errorDescription: paymentData.error_description
    })

    // Extract customer information from notes if available
    const notes = paymentData.notes || {}
    const customerId = notes.customerId
    const packageName = notes.packageName

    if (customerId) {
      // Create failed transaction record
      try {
        const transactionId = `tx_fail_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        
        await pool.query(`
          INSERT INTO transactions (
            id, "userId", type, method, amount, currency, status, reference, 
            description, "gatewayData", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2::text, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
          )
        `, [
          transactionId,
          customerId,
          'PURCHASE',
          'RAZORPAY',
          paymentData.amount / 100, // Convert from paise
          'INR',
          'FAILED',
          paymentData.id,
          `Failed package purchase: ${packageName || 'Unknown'}`,
          JSON.stringify({
            razorpay_payment_id: paymentData.id,
            razorpay_order_id: paymentData.order_id,
            error_code: paymentData.error_code,
            error_description: paymentData.error_description,
            webhook_processed_at: new Date().toISOString()
          })
        ])

        console.log('❌ Failed transaction record created:', transactionId)
      } catch (error) {
        console.error('Error creating failed transaction record:', error)
      }
    }
    
  } catch (error) {
    console.error('Error processing payment failure:', error)
  }
}

// POST - Handle Razorpay webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Load Razorpay configuration
    const paymentMethods = await loadPaymentMethods()
    const razorpayMethod = paymentMethods.find((m: any) => m.id === 'razorpay')
    
    if (!razorpayMethod || !razorpayMethod.config.webhookSecret) {
      console.error('Razorpay webhook secret not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
    }

    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(
      body,
      signature,
      razorpayMethod.config.webhookSecret
    )

    if (!isValidSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse webhook event
    const event = JSON.parse(body)
    
    // Log the webhook event
    await logWebhookEvent(event)

    // Process based on event type
    switch (event.event) {
      case 'payment.captured':
      case 'payment.authorized':
        await processPaymentSuccess(event.payload.payment.entity)
        break
        
      case 'payment.failed':
        await processPaymentFailure(event.payload.payment.entity)
        break
        
      case 'order.paid':
        console.log('Order paid:', event.payload.order.entity)
        break
        
      default:
        console.log('Unhandled webhook event:', event.event)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully' 
    })

  } catch (error) {
    console.error('Error processing Razorpay webhook:', error)
    return NextResponse.json({ 
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Webhook health check
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Razorpay webhook endpoint is ready',
    timestamp: new Date().toISOString()
  })
}