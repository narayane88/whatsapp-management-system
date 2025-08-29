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

interface CreateIframeSessionRequest {
  packageId: string
  customerId: string
  customerEmail: string
  customerPhone: string
  paymentMethodId?: string
  sessionId: string
  returnUrl: string
  cancelUrl: string
}

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
        } else {
          method.config.mockMode = true
        }
      }
    })
    
    return paymentMethods
  } catch (error) {
    console.error('Error loading payment methods:', error)
    return []
  }
}

// Load package details from database
async function loadPackage(packageId: string) {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        price,
        offer_price,
        offer_enabled,
        duration
      FROM packages 
      WHERE id = $1 AND "isActive" = true
    `, [packageId])

    if (result.rows.length === 0) {
      console.error('Package not found in database:', packageId)
      return null
    }

    const pkg = result.rows[0]
    return {
      id: pkg.id,
      name: pkg.name,
      price: parseFloat(pkg.price),
      offer_price: pkg.offer_price ? parseFloat(pkg.offer_price) : null,
      offer_enabled: pkg.offer_enabled,
      duration: pkg.duration,
      currency: 'INR'
    }
  } catch (error) {
    console.error('Error loading package from database:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateIframeSessionRequest = await request.json()
    const { 
      packageId, 
      customerId, 
      customerEmail, 
      customerPhone, 
      paymentMethodId = 'razorpay',
      sessionId,
      returnUrl,
      cancelUrl
    } = body

    // Validate required fields
    if (!packageId || !customerId || !customerEmail || !sessionId) {
      return NextResponse.json({ 
        error: 'Missing required fields: packageId, customerId, customerEmail, sessionId' 
      }, { status: 400 })
    }

    // Load payment methods
    const paymentMethods = await loadPaymentMethods()
    const selectedMethod = paymentMethods.find((m: any) => m.id === paymentMethodId)

    if (!selectedMethod || !selectedMethod.isActive) {
      return NextResponse.json({ 
        error: 'Selected payment method is not available' 
      }, { status: 400 })
    }

    // Load package details
    console.log('Loading package with ID:', packageId)
    const packageData = await loadPackage(packageId)
    if (!packageData) {
      console.error('Package not found for ID:', packageId)
      return NextResponse.json({ 
        error: 'Package not found',
        packageId: packageId 
      }, { status: 404 })
    }
    console.log('Package loaded successfully:', packageData)

    // Calculate final amount
    const finalAmount = packageData.offer_enabled && packageData.offer_price 
      ? packageData.offer_price 
      : packageData.price

    // Determine if this is an admin creating payment for another customer
    let isAdminPayment = false
    let adminUserId = null
    let realUserId = customerId
    let realUserEmail = customerEmail  
    let realUserName = 'Customer'
    
    if (session?.user?.email) {
      try {
        // Get session user details
        const sessionUserResult = await pool.query(
          'SELECT id, name, email FROM users WHERE email = $1',
          [session.user.email]
        )
        
        if (sessionUserResult.rows.length > 0) {
          const sessionUser = sessionUserResult.rows[0]
          adminUserId = sessionUser.id.toString()
          
          // Check if session user is different from requested customer
          if (customerId && customerId !== sessionUser.id.toString()) {
            // This is an admin creating payment for another customer
            isAdminPayment = true
            
            // Verify the target customer exists and get their details
            const customerResult = await pool.query(
              'SELECT id, name, email FROM users WHERE id = $1',
              [parseInt(customerId)]
            )
            
            if (customerResult.rows.length > 0) {
              const customer = customerResult.rows[0]
              realUserId = customer.id.toString()
              realUserEmail = customer.email
              realUserName = customer.name
              
              console.log('🔧 Admin payment detected:', {
                admin: { id: adminUserId, name: sessionUser.name, email: sessionUser.email },
                customer: { id: realUserId, name: realUserName, email: realUserEmail }
              })
            } else {
              return NextResponse.json({ error: 'Target customer not found' }, { status: 404 })
            }
          } else {
            // Normal customer payment (session user = customer)
            realUserId = sessionUser.id.toString()
            realUserEmail = sessionUser.email
            realUserName = sessionUser.name
            
            console.log('👤 Customer self-payment:', { 
              userId: realUserId, 
              email: realUserEmail, 
              name: realUserName 
            })
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        return NextResponse.json({ error: 'Failed to validate user context' }, { status: 500 })
      }
    }

    // Store session data for webhook verification
    const sessionData = {
      sessionId,
      packageId: packageData.id,
      customerId: realUserId,
      customerEmail: realUserEmail,
      customerName: realUserName,
      customerPhone,
      amount: finalAmount,
      currency: packageData.currency,
      createdAt: new Date().toISOString(),
      status: 'pending',
      isAdminPayment,
      adminUserId: isAdminPayment ? adminUserId : null
    }

    // Save session to temporary storage (in production, use database)
    const sessionsDir = path.join(process.cwd(), 'temp', 'payment-sessions')
    await fs.mkdir(sessionsDir, { recursive: true })
    const sessionFile = path.join(sessionsDir, `${sessionId}.json`)
    await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2))

    // Check if we're in mock mode
    if (selectedMethod.config.mockMode) {
      console.log('Creating mock iframe session')
      
      return NextResponse.json({
        success: true,
        sessionId,
        iframeUrl: `/payment/mock-iframe?session=${sessionId}&package=${packageId}&amount=${finalAmount}`,
        mockMode: true,
        package: {
          id: packageData.id,
          name: packageData.name,
          originalPrice: packageData.price,
          finalAmount: finalAmount,
          offerApplied: packageData.offer_enabled,
          duration: packageData.duration
        },
        isTestMode: true
      })
    }

    // Initialize payment service for real Razorpay
    console.log('Initializing Razorpay with credentials:', {
      keyId: selectedMethod.config.keyId,
      keySecret: selectedMethod.config.keySecret?.substring(0, 10) + '...',
      isTestMode: selectedMethod.config.isTestMode
    })
    
    const initialized = await razorpayService.initialize({
      keyId: selectedMethod.config.keyId,
      keySecret: selectedMethod.config.keySecret,
      isTestMode: selectedMethod.config.isTestMode
    })

    if (!initialized) {
      console.error('Failed to initialize Razorpay service')
      return NextResponse.json({ 
        error: 'Failed to initialize payment service' 
      }, { status: 500 })
    }
    
    console.log('Razorpay service initialized successfully')

    // Create payment order for iframe
    const orderData = {
      amount: finalAmount,
      currency: packageData.currency,
      receipt: `iframe_${sessionId}`,
      notes: {
        sessionId,
        packageId: packageData.id,
        packageName: packageData.name,
        customerId: realUserId,
        customerEmail: realUserEmail,
        customerName: realUserName,
        customerPhone: customerPhone,
        duration: packageData.duration,
        originalPrice: packageData.price,
        finalAmount: finalAmount,
        offerApplied: packageData.offer_enabled,
        paymentMethod: 'iframe',
        isAdminPayment: isAdminPayment,
        adminUserId: isAdminPayment ? adminUserId : null
      }
    }

    console.log('Creating Razorpay order with data:', {
      amount: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt
    })

    const razorpayOrder = await razorpayService.createOrder(orderData)
    console.log('Razorpay order created successfully:', razorpayOrder.id)

    // Create iframe URL for Razorpay hosted checkout
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const iframeUrl = `/payment/razorpay-iframe?order_id=${razorpayOrder.id}&session=${sessionId}&key=${selectedMethod.config.keyId}`

    // Log the iframe session creation
    console.log('Payment iframe session created:', {
      sessionId,
      orderId: razorpayOrder.id,
      amount: finalAmount,
      currency: packageData.currency,
      customerId: realUserId,
      customerName: realUserName,
      isAdminPayment: isAdminPayment
    })

    return NextResponse.json({
      success: true,
      sessionId,
      orderId: razorpayOrder.id,
      iframeUrl,
      package: {
        id: packageData.id,
        name: packageData.name,
        originalPrice: packageData.price,
        finalAmount: finalAmount,
        offerApplied: packageData.offer_enabled,
        duration: packageData.duration
      },
      razorpayKeyId: selectedMethod.config.keyId,
      isTestMode: selectedMethod.config.isTestMode,
      webhookUrl: `${baseUrl}/api/payments/webhook`,
      returnUrl,
      cancelUrl
    })

  } catch (error) {
    console.error('Error creating iframe payment session:', error)
    return NextResponse.json({ 
      error: 'Failed to create iframe payment session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}