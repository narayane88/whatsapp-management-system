import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { razorpayService } from '@/lib/payments/razorpay'
import { readApiKeysFromCSV, isValidApiCredential } from '@/lib/utils/csv-reader'
import fs from 'fs/promises'
import path from 'path'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

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
          method.config.mockMode = false // Disable mock mode when using real credentials
        } else {
          console.log(`⚠️ Using mock mode for ${method.provider} - CSV has placeholder credentials`)
        }
      }
    })
    
    return paymentMethods
  } catch (error) {
    console.error('Error loading payment methods:', error)
    return []
  }
}

// POST /api/admin/bizpoints/purchase - Create Razorpay order for BizCoins purchase
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

    const body = await request.json()
    const { amount, description } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
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

    // Load payment methods
    const paymentMethods = await loadPaymentMethods()
    const razorpayMethod = paymentMethods.find((m: any) => m.id === 'razorpay')

    if (!razorpayMethod || !razorpayMethod.isActive) {
      return NextResponse.json({ 
        error: 'Razorpay payment method not available' 
      }, { status: 400 })
    }

    // Calculate commission bonus
    const commissionBonus = amount * (user.commission_rate / 100)
    const totalCoins = amount + commissionBonus

    // Check if we're in mock mode
    if (razorpayMethod.config.mockMode) {
      // Return mock order for demo purposes
      const mockOrder = {
        id: `order_bizcoins_mock_${Date.now()}`,
        amount: amount * 100, // Razorpay amount in paise
        currency: 'INR',
        receipt: `bizcoins_${Date.now()}_${user.id}`,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000)
      }

      return NextResponse.json({
        success: true,
        order: mockOrder,
        purchaseDetails: {
          baseAmount: amount,
          commissionRate: user.commission_rate,
          commissionBonus: commissionBonus,
          totalCoins: totalCoins,
          description: description || `BizCoins purchase by ${user.name}`
        },
        razorpayKeyId: 'rzp_test_demo',
        isTestMode: true,
        mockMode: true
      })
    }

    // Initialize real Razorpay service
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

    // Create Razorpay order
    const orderData = {
      amount: amount, // Will be converted to paise in razorpayService
      currency: 'INR',
      receipt: `bizcoins_${Date.now()}_${user.id}`,
      notes: {
        purchaseType: 'BIZCOINS',
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userLevel: user.level,
        baseAmount: amount,
        commissionRate: user.commission_rate,
        commissionBonus: commissionBonus,
        totalCoins: totalCoins,
        description: description || `BizCoins purchase by ${user.name}`
      }
    }

    const razorpayOrder = await razorpayService.createOrder(orderData)

    // Log the order creation
    console.log('🪙 BizCoins purchase order created:', {
      orderId: razorpayOrder.id,
      userId: user.id,
      userName: user.name,
      baseAmount: amount,
      totalCoins: totalCoins,
      commissionRate: user.commission_rate
    })

    return NextResponse.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      },
      purchaseDetails: {
        baseAmount: amount,
        commissionRate: user.commission_rate,
        commissionBonus: commissionBonus,
        totalCoins: totalCoins,
        description: description || `BizCoins purchase by ${user.name}`
      },
      razorpayKeyId: razorpayMethod.config.keyId,
      isTestMode: razorpayMethod.config.isTestMode
    })

  } catch (error) {
    console.error('Create BizCoins purchase order error:', error)
    return NextResponse.json({ 
      error: 'Failed to create purchase order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}