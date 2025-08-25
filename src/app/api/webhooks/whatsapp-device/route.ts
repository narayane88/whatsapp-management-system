import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

interface DeviceConnectionUpdate {
  connection: string // 'open', 'connecting', 'close'
  lastDisconnect?: {
    error?: any
    date: Date
  }
  qr?: string
  isNewLogin?: boolean
  isOnline?: boolean
}

interface DeviceWebhookPayload {
  event: string // 'connection.update', 'qr', 'ready', etc.
  accountId: string
  data: DeviceConnectionUpdate | any
  timestamp: number
}

/**
 * POST /api/webhooks/whatsapp-device
 * Webhook endpoint to receive real-time device status updates from Baileys server
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📱 Device webhook received')
    
    const payload: DeviceWebhookPayload = await request.json()
    console.log('📊 Webhook payload:', JSON.stringify(payload, null, 2))
    
    const { event, accountId, data, timestamp } = payload
    
    if (!accountId) {
      console.log('❌ Invalid webhook payload - missing accountId')
      return NextResponse.json({ error: 'Missing accountId' }, { status: 400 })
    }

    // Find the device in our database
    const deviceResult = await pool.query(`
      SELECT id, "userId", name, status, "serverId"
      FROM whatsapp_instances 
      WHERE name = $1
    `, [accountId])

    if (deviceResult.rows.length === 0) {
      console.log(`⚠️ Device not found in database: ${accountId}`)
      return NextResponse.json({ 
        success: true, 
        message: `Device ${accountId} not found in database` 
      })
    }

    const device = deviceResult.rows[0]
    const deviceId = device.id
    const userId = device.userId
    let newStatus = device.status
    let shouldUpdate = false

    console.log(`🔍 Processing ${event} for device ${accountId} (current status: ${device.status})`)

    // Process different webhook events
    switch (event) {
      case 'connection.update':
        shouldUpdate = await processConnectionUpdate(data, device, deviceId)
        break
        
      case 'qr':
        shouldUpdate = await processQRUpdate(data, deviceId)
        break
        
      case 'ready':
      case 'connection.open':
        shouldUpdate = await processConnectionReady(deviceId)
        break
        
      case 'connection.close':
        shouldUpdate = await processConnectionClose(data, deviceId)
        break
        
      case 'auth_failure':
        shouldUpdate = await processAuthFailure(deviceId)
        break
        
      default:
        console.log(`ℹ️ Unhandled webhook event: ${event}`)
        break
    }

    // Broadcast real-time update if status changed
    if (shouldUpdate) {
      await broadcastDeviceStatusUpdate(userId)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Webhook processed: ${event}`,
      accountId,
      event,
      statusUpdated: shouldUpdate
    })
    
  } catch (error) {
    console.error('❌ Device webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Process connection update events
 */
async function processConnectionUpdate(data: DeviceConnectionUpdate, device: any, deviceId: string): Promise<boolean> {
  const connectionState = data.connection?.toLowerCase()
  let newStatus = device.status
  
  switch (connectionState) {
    case 'open':
      newStatus = 'CONNECTED'
      break
    case 'connecting':
      newStatus = 'CONNECTING'
      break
    case 'close':
      // Check if it's an auth failure or just disconnection
      if (data.lastDisconnect?.error) {
        const error = data.lastDisconnect.error
        if (error.message?.includes('auth') || error.output?.statusCode === 401) {
          newStatus = 'AUTHENTICATING'
        } else {
          newStatus = 'DISCONNECTED'
        }
      } else {
        newStatus = 'DISCONNECTED'
      }
      break
  }

  if (newStatus !== device.status) {
    console.log(`📱 Device ${device.name}: ${device.status} → ${newStatus}`)
    
    await pool.query(`
      UPDATE whatsapp_instances 
      SET status = $1, "lastSeenAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [newStatus, deviceId])
    
    return true
  }
  
  return false
}

/**
 * Process QR code update events
 */
async function processQRUpdate(data: any, deviceId: string): Promise<boolean> {
  if (data.qr) {
    console.log(`📱 QR code received for device ${deviceId}`)
    
    await pool.query(`
      UPDATE whatsapp_instances 
      SET status = $1, "qrCode" = $2, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $3
    `, ['AUTHENTICATING', data.qr, deviceId])
    
    return true
  }
  
  return false
}

/**
 * Process connection ready/open events
 */
async function processConnectionReady(deviceId: string): Promise<boolean> {
  console.log(`📱 Device ${deviceId} is ready/connected`)
  
  await pool.query(`
    UPDATE whatsapp_instances 
    SET status = $1, "qrCode" = NULL, "lastSeenAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = $2
  `, ['CONNECTED', deviceId])
  
  return true
}

/**
 * Process connection close events
 */
async function processConnectionClose(data: DeviceConnectionUpdate, deviceId: string): Promise<boolean> {
  console.log(`📱 Device ${deviceId} connection closed`)
  
  // Determine if we should show QR code or just disconnected
  let newStatus = 'DISCONNECTED'
  if (data.lastDisconnect?.error) {
    const error = data.lastDisconnect.error
    // If auth error, require re-authentication
    if (error.message?.includes('auth') || error.output?.statusCode === 401) {
      newStatus = 'AUTHENTICATING'
    }
  }
  
  await pool.query(`
    UPDATE whatsapp_instances 
    SET status = $1, "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [newStatus, deviceId])
  
  return true
}

/**
 * Process authentication failure events
 */
async function processAuthFailure(deviceId: string): Promise<boolean> {
  console.log(`📱 Authentication failure for device ${deviceId}`)
  
  await pool.query(`
    UPDATE whatsapp_instances 
    SET status = $1, "qrCode" = NULL, "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = $2
  `, ['AUTHENTICATING', deviceId])
  
  return true
}

/**
 * Broadcast device status updates to connected SSE clients
 */
async function broadcastDeviceStatusUpdate(userId: string): Promise<void> {
  try {
    // Import dynamically to avoid circular dependencies
    const { WhatsAppEventStreamer } = await import('../../customer/whatsapp/events/route')
    
    // Get updated device list for this user
    const devicesResult = await pool.query(`
      SELECT 
        wi.id,
        wi.name as "accountName",
        wi."phoneNumber",
        wi.status,
        wi."lastSeenAt" as "lastActivity",
        wi."createdAt",
        wi."serverId",
        COALESCE(ws.name, 'Unknown Server') as "serverName"
      FROM whatsapp_instances wi
      LEFT JOIN whatsapp_servers ws ON wi."serverId" = ws.id
      WHERE wi."userId" = $1::text
      ORDER BY wi."createdAt" DESC
    `, [userId])

    const devices = devicesResult.rows.map(device => ({
      id: device.id,
      serverId: device.serverId,
      serverName: device.serverName,
      accountName: device.accountName,
      phoneNumber: device.phoneNumber,
      status: device.status,
      lastActivity: device.lastActivity,
      messageCount: 0, // Will be calculated by client
      createdAt: device.createdAt
    }))

    // Broadcast to all connected clients for this user
    const streamer = WhatsAppEventStreamer.getInstance()
    streamer.sendDeviceStatus({
      devices: devices,
      userId: userId
    })

    console.log(`📡 Broadcasted device status update to user ${userId}`)

  } catch (error) {
    console.error('Error broadcasting device status update:', error)
  }
}

/**
 * GET /api/webhooks/whatsapp-device
 * Webhook verification endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'WhatsApp Device Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
    events: [
      'connection.update',
      'connection.open', 
      'connection.close',
      'qr',
      'ready',
      'auth_failure'
    ]
  })
}