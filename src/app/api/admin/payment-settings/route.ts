import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs/promises'
import path from 'path'

// Payment settings configuration file
const PAYMENT_SETTINGS_FILE = path.join(process.cwd(), 'config', 'payment-settings.json')

interface PaymentSettings {
  defaultCurrency: string
  allowedMethods: string[]
  webhookUrl: string
  returnUrl: string
  cancelUrl: string
  fees?: {
    processingFee: number
    convenienceFee: number
  }
  limits?: {
    minAmount: number
    maxAmount: number
  }
  updatedAt?: string
  createdAt?: string
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

// Load payment settings from file
async function loadPaymentSettings(): Promise<PaymentSettings> {
  try {
    await ensureConfigDirectory()
    const data = await fs.readFile(PAYMENT_SETTINGS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // Return default settings if file doesn't exist
    return {
      defaultCurrency: 'INR',
      allowedMethods: ['razorpay'],
      webhookUrl: '',
      returnUrl: '',
      cancelUrl: '',
      fees: {
        processingFee: 0,
        convenienceFee: 0
      },
      limits: {
        minAmount: 1,
        maxAmount: 100000
      },
      createdAt: new Date().toISOString()
    }
  }
}

// Save payment settings to file
async function savePaymentSettings(settings: PaymentSettings) {
  await ensureConfigDirectory()
  settings.updatedAt = new Date().toISOString()
  await fs.writeFile(PAYMENT_SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

// GET - Retrieve payment settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await loadPaymentSettings()
    
    return NextResponse.json({
      success: true,
      settings: settings
    })
  } catch (error) {
    console.error('Error loading payment settings:', error)
    return NextResponse.json({ 
      error: 'Failed to load payment settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Save payment settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings: PaymentSettings = await request.json()
    
    // Validate required fields
    if (!settings.defaultCurrency) {
      return NextResponse.json({ 
        error: 'Default currency is required' 
      }, { status: 400 })
    }

    // Ensure createdAt exists
    const currentSettings = await loadPaymentSettings()
    if (!settings.createdAt) {
      settings.createdAt = currentSettings.createdAt || new Date().toISOString()
    }

    await savePaymentSettings(settings)

    return NextResponse.json({
      success: true,
      message: 'Payment settings saved successfully',
      settings: settings
    })
  } catch (error) {
    console.error('Error saving payment settings:', error)
    return NextResponse.json({ 
      error: 'Failed to save payment settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}