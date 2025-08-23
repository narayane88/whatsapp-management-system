import { NextRequest, NextResponse } from 'next/server'
import { razorpayService } from '@/lib/payments/razorpay'
import { readApiKeysFromCSV, isValidApiCredential } from '@/lib/utils/csv-reader'
import fs from 'fs/promises'
import path from 'path'

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params

    if (!orderId) {
      return NextResponse.json({ 
        error: 'Order ID is required' 
      }, { status: 400 })
    }

    // Load payment methods to get Razorpay configuration
    const paymentMethods = await loadPaymentMethods()
    const razorpayMethod = paymentMethods.find((m: any) => m.id === 'razorpay')

    if (!razorpayMethod) {
      return NextResponse.json({ 
        error: 'Razorpay configuration not found' 
      }, { status: 400 })
    }

    // Check if we're in mock mode
    if (razorpayMethod.config.mockMode) {
      // Return mock order details
      return NextResponse.json({
        id: orderId,
        amount: 79900, // ₹799 in paise
        currency: 'INR',
        description: 'Demo Package - Starter Plan',
        status: 'created',
        customer: {
          name: 'Demo Customer',
          email: 'demo@example.com',
          phone: '+1234567890'
        },
        notes: {
          demo: true,
          packageId: 'starter',
          packageName: 'Starter Plan'
        },
        mockMode: true
      })
    }

    // Initialize Razorpay service with real credentials
    const initialized = await razorpayService.initialize({
      keyId: razorpayMethod.config.keyId,
      keySecret: razorpayMethod.config.keySecret,
      isTestMode: razorpayMethod.config.isTestMode
    })

    if (!initialized) {
      return NextResponse.json({ 
        error: 'Failed to initialize Razorpay service' 
      }, { status: 500 })
    }

    // Fetch order details from Razorpay
    try {
      const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${razorpayMethod.config.keyId}:${razorpayMethod.config.keySecret}`
          ).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Razorpay API error: ${response.status}`)
      }

      const orderData = await response.json()

      // Extract customer information from order notes
      const notes = orderData.notes || {}
      
      return NextResponse.json({
        id: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        description: `${notes.packageName || 'Subscription'} - ${notes.duration || 30} days`,
        status: orderData.status,
        customer: {
          id: notes.customerId || 'demo-customer-id',
          name: notes.customerName || notes.customerEmail?.split('@')[0] || 'Customer',
          email: notes.customerEmail || '',
          phone: notes.customerPhone || ''
        },
        package: {
          id: notes.packageId || 'unknown',
          name: notes.packageName || 'Unknown Package'
        },
        notes: orderData.notes,
        created_at: orderData.created_at,
        mockMode: false
      })

    } catch (error: any) {
      console.error('Error fetching order from Razorpay:', error)
      
      // Handle specific Razorpay errors
      if (error.message?.includes('404')) {
        return NextResponse.json({ 
          error: 'Order not found' 
        }, { status: 404 })
      }
      
      if (error.message?.includes('401')) {
        return NextResponse.json({ 
          error: 'Invalid Razorpay credentials' 
        }, { status: 401 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch order details',
        details: error.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in order details API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}