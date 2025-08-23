import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { razorpayService } from '@/lib/payments/razorpay'
import { readApiKeysFromCSV, isValidApiCredential } from '@/lib/utils/csv-reader'
import fs from 'fs/promises'
import path from 'path'

interface CreateOrderRequest {
  packageId: string
  customerId: string
  customerEmail: string
  customerPhone: string
  paymentMethodId?: string
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
          method.config.mockMode = false // Disable mock mode when using real credentials
          console.log(`✅ Updated ${method.provider} with CSV credentials - Mock mode disabled`)
        } else {
          console.log(`⚠️ Using mock mode for ${method.provider} - CSV has placeholder credentials`)
        }
      } else {
        console.log(`⚠️ Using mock mode for ${method.provider} - no CSV credentials found`)
      }
    })
    
    return paymentMethods
  } catch (error) {
    console.error('Error loading payment methods:', error)
    return []
  }
}

// Load package details
async function loadPackage(packageId: string) {
  try {
    // In a real app, this would fetch from database
    // For now, we'll simulate package data
    const packages = [
      {
        id: 'starter',
        name: 'Starter Plan',
        price: 999,
        offer_price: 799,
        offer_enabled: true,
        duration: 30,
        currency: 'INR'
      },
      {
        id: 'professional',
        name: 'Professional Plan',
        price: 2999,
        offer_price: null,
        offer_enabled: false,
        duration: 30,
        currency: 'INR'
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        price: 9999,
        offer_price: 7999,
        offer_enabled: true,
        duration: 30,
        currency: 'INR'
      }
    ]

    return packages.find(pkg => pkg.id === packageId)
  } catch (error) {
    console.error('Error loading package:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateOrderRequest = await request.json()
    const { packageId, customerId, customerEmail, customerPhone, paymentMethodId = 'razorpay' } = body

    // Validate required fields
    if (!packageId || !customerId || !customerEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields: packageId, customerId, customerEmail' 
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
    const packageData = await loadPackage(packageId)
    if (!packageData) {
      return NextResponse.json({ 
        error: 'Package not found' 
      }, { status: 404 })
    }

    // Calculate final amount
    const finalAmount = packageData.offer_enabled && packageData.offer_price 
      ? packageData.offer_price 
      : packageData.price

    // Check if we're in mock mode
    if (selectedMethod.config.mockMode) {
      // Return mock order for demo purposes
      const mockOrder = {
        id: `order_mock_${Date.now()}`,
        amount: finalAmount * 100, // Razorpay amount in paise
        currency: packageData.currency,
        receipt: `order_${Date.now()}_${customerId}`,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000)
      }

      return NextResponse.json({
        success: true,
        order: mockOrder,
        package: {
          id: packageData.id,
          name: packageData.name,
          originalPrice: packageData.price,
          finalAmount: finalAmount,
          offerApplied: packageData.offer_enabled,
          duration: packageData.duration
        },
        razorpayKeyId: 'rzp_test_demo',
        isTestMode: true,
        mockMode: true
      })
    }

    // Initialize payment service for real Razorpay
    const initialized = await razorpayService.initialize({
      keyId: selectedMethod.config.keyId,
      keySecret: selectedMethod.config.keySecret,
      isTestMode: selectedMethod.config.isTestMode
    })

    if (!initialized) {
      return NextResponse.json({ 
        error: 'Failed to initialize payment service' 
      }, { status: 500 })
    }

    // Create payment order
    const orderData = {
      amount: finalAmount,
      currency: packageData.currency,
      receipt: `order_${Date.now()}_${customerId}`,
      notes: {
        packageId: packageData.id,
        packageName: packageData.name,
        customerId: customerId,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        duration: packageData.duration,
        originalPrice: packageData.price,
        finalAmount: finalAmount,
        offerApplied: packageData.offer_enabled
      }
    }

    const razorpayOrder = await razorpayService.createOrder(orderData)

    // Log the order creation
    console.log('Payment order created:', {
      orderId: razorpayOrder.id,
      amount: finalAmount,
      currency: packageData.currency,
      customerId: customerId
    })

    return NextResponse.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      },
      package: {
        id: packageData.id,
        name: packageData.name,
        originalPrice: packageData.price,
        finalAmount: finalAmount,
        offerApplied: packageData.offer_enabled,
        duration: packageData.duration
      },
      razorpayKeyId: selectedMethod.config.keyId,
      isTestMode: selectedMethod.config.isTestMode
    })

  } catch (error) {
    console.error('Error creating payment order:', error)
    return NextResponse.json({ 
      error: 'Failed to create payment order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}