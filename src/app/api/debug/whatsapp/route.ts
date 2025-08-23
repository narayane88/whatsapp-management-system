/**
 * WhatsApp API Debug/Test Endpoint
 * Provides API testing functionality for development
 */

import { NextRequest, NextResponse } from 'next/server'

const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || 'http://localhost:3005'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const accountId = searchParams.get('accountId')

    switch (action) {
      case 'health':
        return await testHealth()
      
      case 'stats':
        return await testStats()
      
      case 'accounts':
        return await testAccounts()
      
      case 'status':
        if (!accountId) {
          return NextResponse.json({ error: 'accountId required for status' }, { status: 400 })
        }
        return await testAccountStatus(accountId)
      
      case 'qr':
        if (!accountId) {
          return NextResponse.json({ error: 'accountId required for QR' }, { status: 400 })
        }
        return await testQRCode(accountId)
      
      default:
        return NextResponse.json({
          message: 'WhatsApp API Debug Endpoint',
          availableActions: [
            'health - Test server health',
            'stats - Test server statistics', 
            'accounts - List all accounts',
            'status?accountId=xxx - Test account status',
            'qr?accountId=xxx - Test QR code generation'
          ]
        })
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Debug API error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, accountId, accountName } = body

    switch (action) {
      case 'connect':
        if (!accountId) {
          return NextResponse.json({ error: 'accountId required for connect' }, { status: 400 })
        }
        return await testAccountConnect(accountId, accountName)
      
      case 'disconnect':
        if (!accountId) {
          return NextResponse.json({ error: 'accountId required for disconnect' }, { status: 400 })
        }
        return await testAccountDisconnect(accountId)
      
      default:
        return NextResponse.json({
          error: 'Invalid POST action',
          availableActions: [
            'connect - Create new account connection',
            'disconnect - Disconnect account'
          ]
        }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Debug API POST error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// Test Functions
async function testHealth() {
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    const data = response.ok ? await response.json() : { error: await response.text() }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
  }
}

async function testStats() {
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/stats`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    const data = response.ok ? await response.json() : { error: await response.text() }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
  }
}

async function testAccounts() {
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    const data = response.ok ? await response.json() : { error: await response.text() }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
  }
}

async function testAccountStatus(accountId: string) {
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${accountId}/status`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    const data = response.ok ? await response.json() : { error: await response.text() }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      accountId: accountId,
      data: data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      accountId: accountId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
  }
}

async function testQRCode(accountId: string) {
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${accountId}/qr`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    const data = response.ok ? await response.json() : { error: await response.text() }

    // Handle Baileys server QR response format
    const qrCode = data.qrCode || data.data?.qrCode || data.data?.qr || null
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      accountId: accountId,
      data: data,
      qrCode: qrCode, // Extract QR code directly from Baileys format
      hasQR: response.ok && qrCode ? true : false,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      accountId: accountId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
  }
}

async function testAccountConnect(accountId: string, accountName?: string) {
  try {
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/connect`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ id: accountId })
    })

    const data = response.ok ? await response.json() : { error: await response.text() }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      accountId: accountId,
      accountName: accountName,
      data: data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      accountId: accountId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
  }
}

async function testAccountDisconnect(accountId: string) {
  try {
    // Try different disconnect endpoint formats
    let response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/disconnect`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ id: accountId })
    })
    
    // If that doesn't work, try DELETE method
    if (!response.ok) {
      response = await fetch(`${WHATSAPP_SERVER_URL}/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
    }

    const data = response.ok ? await response.json() : { error: await response.text() }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      accountId: accountId,
      data: data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      accountId: accountId,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
  }
}