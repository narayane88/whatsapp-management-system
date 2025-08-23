import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

// Test payment method connection
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    if (id === 'razorpay') {
      // Load payment methods configuration
      const paymentMethods = await loadPaymentMethods()
      const razorpayMethod = paymentMethods.find((m: any) => m.id === 'razorpay')

      if (!razorpayMethod || !razorpayMethod.config?.keyId || !razorpayMethod.config?.keySecret) {
        return NextResponse.json({
          success: false,
          message: 'Razorpay credentials not configured'
        }, { status: 400 })
      }

      // Check if we're in mock mode
      if (razorpayMethod.config.mockMode) {
        return NextResponse.json({
          success: true,
          message: 'Mock mode test - Razorpay connection simulated successfully',
          testResults: {
            connectionStatus: 'mock',
            apiVersion: 'mock-v1',
            testOrderId: `order_mock_test_${Date.now()}`,
            isTestMode: true,
            isMockMode: true,
            keyId: razorpayMethod.config.keyId,
            lastTested: new Date().toISOString(),
            note: 'This is a simulated test. Update api-key.csv with real credentials for actual API testing.'
          }
        })
      }

      try {
        // Initialize Razorpay service with credentials
        const initialized = await razorpayService.initialize({
          keyId: razorpayMethod.config.keyId,
          keySecret: razorpayMethod.config.keySecret,
          isTestMode: razorpayMethod.config.isTestMode
        })

        if (!initialized) {
          return NextResponse.json({
            success: false,
            message: 'Failed to initialize Razorpay service'
          }, { status: 500 })
        }

        // Create a test order to verify connection
        const testOrder = await razorpayService.createOrder({
          amount: 1, // Minimum amount (₹1)
          currency: 'INR',
          receipt: `test_${Date.now()}`,
          notes: {
            test: true,
            purpose: 'API connection test'
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Razorpay connection test successful - Real API credentials verified',
          testResults: {
            connectionStatus: 'active',
            apiVersion: 'v1',
            testOrderId: testOrder.id,
            isTestMode: razorpayMethod.config.isTestMode,
            isMockMode: false,
            keyId: razorpayMethod.config.keyId,
            lastTested: new Date().toISOString()
          }
        })
      } catch (error: any) {
        console.error('Razorpay connection test failed:', error)
        
        return NextResponse.json({
          success: false,
          message: 'Razorpay connection test failed',
          error: error.message || 'Unknown error occurred',
          testResults: {
            connectionStatus: 'failed',
            lastTested: new Date().toISOString(),
            errorCode: error.error?.code || 'UNKNOWN',
            errorDescription: error.error?.description || error.message
          }
        }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: false,
      message: `Test not implemented for payment method: ${id}`
    }, { status: 400 })

  } catch (error) {
    console.error('Error testing payment method:', error)
    return NextResponse.json({ 
      error: 'Failed to test payment method',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}