import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { razorpayService } from '@/lib/payments/razorpay'
import { readApiKeysFromCSV, isValidApiCredential } from '@/lib/utils/csv-reader'
import fs from 'fs/promises'
import path from 'path'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

interface CreateBizCoinsIframeSessionRequest {
  amount: number
  description?: string
  sessionId: string
  returnUrl?: string
  cancelUrl?: string
}

// Load payment methods configuration
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to purchase coins
    const hasPermission = await checkCurrentUserPermission('bizpoints.purchase.button')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body: CreateBizCoinsIframeSessionRequest = await request.json()
    const { amount, description, sessionId, returnUrl, cancelUrl } = body

    // Validate required fields
    if (!amount || amount <= 0 || !sessionId) {
      return NextResponse.json({ 
        error: 'Missing required fields: amount, sessionId' 
      }, { status: 400 })
    }

    // Verify user is Level 3+ and get commission rate
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult.rows[0]
    
    if (user.level < 3) {
      return NextResponse.json({ error: 'Only Level 3+ users can purchase coins' }, { status: 403 })
    }

    // Calculate commission bonus
    const commissionBonus = amount * (user.commission_rate / 100)
    const totalCoins = amount + commissionBonus

    // Load payment methods
    const paymentMethods = await loadPaymentMethods()
    const razorpayMethod = paymentMethods.find((m: any) => m.id === 'razorpay')

    if (!razorpayMethod || !razorpayMethod.isActive) {
      return NextResponse.json({ 
        error: 'Razorpay payment method not available' 
      }, { status: 400 })
    }

    // Store session data for payment verification
    const sessionData = {
      sessionId,
      purchaseType: 'BIZCOINS',
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userLevel: user.level,
      baseAmount: amount,
      commissionRate: user.commission_rate,
      commissionBonus: commissionBonus,
      totalCoins: totalCoins,
      description: description || `BizCoins purchase by ${user.name}`,
      currency: 'INR',
      createdAt: new Date().toISOString(),
      status: 'pending'
    }

    // Save session to temporary storage
    const sessionsDir = path.join(process.cwd(), 'temp', 'bizcoins-sessions')
    await fs.mkdir(sessionsDir, { recursive: true })
    const sessionFile = path.join(sessionsDir, `${sessionId}.json`)
    await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2))

    // Check if we're in mock mode
    if (razorpayMethod.config.mockMode) {
      console.log('🧪 Creating mock BizCoins iframe session')
      
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const mockIframeUrl = `/payment/bizcoins-mock-iframe?session=${sessionId}&amount=${amount}&totalCoins=${totalCoins}`
      
      return NextResponse.json({
        success: true,
        sessionId,
        iframeUrl: mockIframeUrl,
        mockMode: true,
        purchaseDetails: {
          baseAmount: amount,
          commissionRate: user.commission_rate,
          commissionBonus: commissionBonus,
          totalCoins: totalCoins,
          description: sessionData.description
        },
        isTestMode: true
      })
    }

    // Initialize real Razorpay service
    console.log('🪙 Initializing Razorpay for BizCoins iframe purchase')
    
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

    // Create Razorpay order for iframe (receipt must be <= 40 chars)
    const shortSessionId = sessionId.replace('bizcoins_', '').substring(0, 20)
    const orderData = {
      amount: amount, // Will be converted to paise in razorpayService
      currency: 'INR',
      receipt: `bc_${shortSessionId}`, // bc = bizcoins, shortened for 40 char limit
      notes: {
        sessionId,
        purchaseType: 'BIZCOINS',
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userLevel: user.level,
        baseAmount: amount,
        commissionRate: user.commission_rate,
        commissionBonus: commissionBonus,
        totalCoins: totalCoins,
        description: sessionData.description,
        paymentMethod: 'iframe'
      }
    }

    console.log('🪙 Creating Razorpay order for BizCoins iframe:', {
      amount: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt,
      totalCoins: totalCoins
    })

    const razorpayOrder = await razorpayService.createOrder(orderData)
    console.log('✅ BizCoins Razorpay order created successfully:', razorpayOrder.id)

    // Create iframe URL for Razorpay hosted checkout
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const iframeUrl = `/payment/bizcoins-razorpay-iframe?order_id=${razorpayOrder.id}&session=${sessionId}&key=${razorpayMethod.config.keyId}`

    // Log the iframe session creation
    console.log('🪙 BizCoins payment iframe session created:', {
      sessionId,
      orderId: razorpayOrder.id,
      userId: user.id,
      userName: user.name,
      baseAmount: amount,
      totalCoins: totalCoins,
      commissionRate: user.commission_rate
    })

    return NextResponse.json({
      success: true,
      sessionId,
      orderId: razorpayOrder.id,
      iframeUrl,
      purchaseDetails: {
        baseAmount: amount,
        commissionRate: user.commission_rate,
        commissionBonus: commissionBonus,
        totalCoins: totalCoins,
        description: sessionData.description
      },
      razorpayKeyId: razorpayMethod.config.keyId,
      isTestMode: razorpayMethod.config.isTestMode,
      webhookUrl: `${baseUrl}/api/admin/bizpoints/purchase/webhook`,
      returnUrl: returnUrl || `${baseUrl}/admin/bizpoints?purchase=success`,
      cancelUrl: cancelUrl || `${baseUrl}/admin/bizpoints?purchase=cancelled`
    })

  } catch (error) {
    console.error('Error creating BizCoins iframe payment session:', error)
    return NextResponse.json({ 
      error: 'Failed to create BizCoins iframe payment session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}