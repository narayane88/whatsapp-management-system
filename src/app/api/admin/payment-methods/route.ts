import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

// Payment methods configuration file
const PAYMENT_CONFIG_FILE = path.join(process.cwd(), 'config', 'payment-methods.json')

interface PaymentMethod {
  id: string
  name: string
  provider: string
  isActive: boolean
  config: Record<string, any>
  fees?: {
    percentage: number
    fixed: number
    currency: string
  }
  createdAt?: string
  updatedAt?: string
}

// Ensure config directory exists
async function ensureConfigDirectory() {
  const configDir = path.join(process.cwd(), 'config')
  try {
    await fs.access(configDir)
  } catch {
    await fs.mkdir(configDir, { recursive: true })
  }
}

// Load payment methods from file
async function loadPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    await ensureConfigDirectory()
    const data = await fs.readFile(PAYMENT_CONFIG_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // Return default methods if file doesn't exist
    return [
      {
        id: 'razorpay',
        name: 'Razorpay',
        provider: 'razorpay',
        isActive: false,
        config: {},
        fees: {
          percentage: 2.0,
          fixed: 0,
          currency: 'INR'
        },
        createdAt: new Date().toISOString()
      }
    ]
  }
}

// Save payment methods to file and update CSV
async function savePaymentMethods(methods: PaymentMethod[]) {
  await ensureConfigDirectory()
  await fs.writeFile(PAYMENT_CONFIG_FILE, JSON.stringify(methods, null, 2))
  
  // Also update the CSV file with the credentials
  await updateCsvCredentials(methods)
}

// Update CSV file with payment method credentials
async function updateCsvCredentials(methods: PaymentMethod[]) {
  try {
    const csvFile = path.join(process.cwd(), 'api-key.csv')
    
    // Find Razorpay method
    const razorpayMethod = methods.find(m => m.id === 'razorpay')
    
    if (razorpayMethod && razorpayMethod.config) {
      const csvContent = `service,key_id,key_secret,webhook_secret
razorpay,${razorpayMethod.config.keyId || 'demo_key_id'},${razorpayMethod.config.keySecret || 'demo_secret'},${razorpayMethod.config.webhookSecret || 'demo_webhook_secret'}`
      
      await fs.writeFile(csvFile, csvContent)
      console.log('✅ CSV file updated with payment credentials')
    }
  } catch (error) {
    console.error('Error updating CSV file:', error)
    // Don't throw error, just log it
  }
}

// GET - Retrieve all payment methods
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const methods = await loadPaymentMethods()
    
    return NextResponse.json({
      success: true,
      methods: methods
    })
  } catch (error) {
    console.error('Error loading payment methods:', error)
    return NextResponse.json({ 
      error: 'Failed to load payment methods',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Save/update payment method
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paymentMethod: PaymentMethod = await request.json()
    
    // Validate required fields
    if (!paymentMethod.id || !paymentMethod.name || !paymentMethod.provider) {
      return NextResponse.json({ 
        error: 'Missing required fields: id, name, provider' 
      }, { status: 400 })
    }

    const methods = await loadPaymentMethods()
    const existingIndex = methods.findIndex(m => m.id === paymentMethod.id)
    
    // Update timestamps
    paymentMethod.updatedAt = new Date().toISOString()
    if (existingIndex === -1) {
      paymentMethod.createdAt = new Date().toISOString()
    }

    if (existingIndex >= 0) {
      // Update existing method
      methods[existingIndex] = { ...methods[existingIndex], ...paymentMethod }
    } else {
      // Add new method
      methods.push(paymentMethod)
    }

    await savePaymentMethods(methods)

    return NextResponse.json({
      success: true,
      message: `Payment method ${paymentMethod.name} saved successfully`,
      method: paymentMethod
    })
  } catch (error) {
    console.error('Error saving payment method:', error)
    return NextResponse.json({ 
      error: 'Failed to save payment method',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Remove payment method
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const methodId = searchParams.get('id')

    if (!methodId) {
      return NextResponse.json({ error: 'Method ID is required' }, { status: 400 })
    }

    const methods = await loadPaymentMethods()
    const filteredMethods = methods.filter(m => m.id !== methodId)

    if (filteredMethods.length === methods.length) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    await savePaymentMethods(filteredMethods)

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json({ 
      error: 'Failed to delete payment method',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}