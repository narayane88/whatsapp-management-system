import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getImpersonationContext, hasCustomerAccess } from '@/lib/impersonation'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { whatsappServerManager } from '@/lib/whatsapp-servers'
import { WhatsAppEventStreamer } from '../../whatsapp/events/route'
import { generateDeviceWebhookPayload, logWebhookConfig } from '@/lib/webhook-config'

const pool = new Pool(getDatabaseConfig())

// Helper function to get optimal server and make API calls
async function makeServerRequest(endpoint: string, options: RequestInit = {}) {
  const optimalServer = await whatsappServerManager.getOptimalServer()
  
  if (!optimalServer) {
    throw new Error('No active WhatsApp servers available')
  }

  const response = await fetch(`${optimalServer.url}${endpoint}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options.headers
    }
  })

  return { response, server: optimalServer }
}

// Helper function to try multiple servers for critical operations
async function tryMultipleServers(endpoint: string, options: RequestInit = {}) {
  const activeServers = await whatsappServerManager.getActiveServers()
  
  if (activeServers.length === 0) {
    throw new Error('No active WhatsApp servers available')
  }

  let lastError: Error | null = null

  for (const server of activeServers) {
    try {
      const response = await fetch(`${server.url}${endpoint}`, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      })

      if (response.ok) {
        return { response, server }
      } else {
        lastError = new Error(`Server ${server.name} returned ${response.status}`)
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(`Server ${server.name} failed`)
      console.warn(`Server ${server.name} failed:`, error)
      continue
    }
  }

  throw lastError || new Error('All servers failed')
}

/**
 * @swagger
 * /api/customer/host/connections:
 *   get:
 *     tags:
 *       - Customer Host Management
 *     summary: Get customer's WhatsApp connections
 *     description: Retrieve all WhatsApp connections for the authenticated customer
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of WhatsApp connections
 *   post:
 *     tags:
 *       - Customer Host Management
 *     summary: Create new WhatsApp connection
 *     description: Initiate a new WhatsApp connection on a selected server
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serverId
 *               - accountName
 *             properties:
 *               serverId:
 *                 type: string
 *               accountName:
 *                 type: string
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get impersonation context
    const impersonation = await getImpersonationContext(request)
    
    if (!hasCustomerAccess(session, impersonation.isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user accessing connections for customer ID: ${userId}`)
    }

    // Get customer's WhatsApp instances from database
    const instancesResult = await pool.query(`
      SELECT 
        id, name, "phoneNumber", status, "qrCode", 
        "lastSeenAt", "createdAt", "updatedAt",
        "serverId"
      FROM whatsapp_instances 
      WHERE "userId" = $1::text
      ORDER BY "createdAt" DESC
    `, [userId])

    const connections = []

    // For each instance, try to get real-time status from WhatsApp server
    for (const instance of instancesResult.rows) {
      let realTimeStatus = instance.status
      let qrCode = instance.qrCode
      let lastActivity = instance.lastSeenAt
      let messageCount = 0

      try {
        // Use name field as server account ID for server communication
        const serverAccountId = instance.name
        
        // Get all accounts from WhatsApp server to find this device
        const { response: accountsResponse } = await makeServerRequest('/api/accounts', {
          method: 'GET'
        })

        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json()
          const accounts = accountsData.data?.accounts || []
          
          // Find matching account by ID
          const serverAccount = accounts.find(acc => acc.id === serverAccountId)
          
          if (serverAccount) {
            // Map server status to frontend status
            const serverStatus = serverAccount.status.toLowerCase()
            if (serverStatus === 'connected' || serverStatus === 'open') {
              realTimeStatus = 'CONNECTED'
            } else if (serverStatus === 'connecting') {
              realTimeStatus = 'CONNECTING'
            } else if (serverStatus === 'qr_required' || serverStatus === 'authenticating') {
              realTimeStatus = 'AUTHENTICATING'
            } else {
              realTimeStatus = 'DISCONNECTED'
            }
            
            // Update database with real-time status and phone number
            try {
              const updates = []
              const values = []
              let paramIndex = 1

              // Always update status to keep database in sync
              updates.push(`status = $${paramIndex++}`)
              values.push(realTimeStatus)

              // Always update lastSeenAt if we have it
              if (lastActivity) {
                updates.push(`"lastSeenAt" = $${paramIndex++}`)
                values.push(new Date(lastActivity))
              }

              // Update phone number if available
              if (serverAccount.phoneNumber || serverAccount.deviceInfo?.phoneNumber) {
                updates.push(`"phoneNumber" = $${paramIndex++}`)
                values.push(serverAccount.phoneNumber || serverAccount.deviceInfo?.phoneNumber)
              }

              // Always update timestamp
              updates.push(`"updatedAt" = CURRENT_TIMESTAMP`)
              values.push(instance.id)

              await pool.query(`
                UPDATE whatsapp_instances 
                SET ${updates.join(', ')}
                WHERE id = $${paramIndex}
              `, values)
            } catch (updateError) {
              console.warn('Failed to update device status in database:', updateError.message)
            }
            
            lastActivity = serverAccount.lastSeen || instance.lastSeenAt
            
            // For demonstration purposes, set a basic message count
            messageCount = 0 // Since we don't have message stats endpoint
          }
        }
      } catch (fetchError) {
        console.warn(`Failed to get real-time status for ${instance.name}:`, fetchError.message)
        // Keep database status as fallback
      }

      // Get server name from configuration
      let serverName = 'Unknown Server'
      if (instance.serverId) {
        try {
          const server = await whatsappServerManager.getServerById(instance.serverId)
          if (server) {
            serverName = server.name
          }
        } catch (error) {
          console.warn(`Failed to get server name for ${instance.serverId}:`, error)
        }
      }

      connections.push({
        id: instance.id,
        serverId: instance.serverId || null,
        serverName: serverName,
        accountName: instance.name,
        accountId: instance.name,
        phoneNumber: instance.phoneNumber, // This will be updated if server has phone number
        status: realTimeStatus,
        qrCode: qrCode,
        lastActivity: lastActivity,
        messageCount: messageCount,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt
      })
    }

    // Broadcast device status updates to real-time clients
    const streamer = WhatsAppEventStreamer.getInstance()
    streamer.sendDeviceStatus({
      devices: connections,
      userId: userId
    })

    return NextResponse.json(connections)

  } catch (error) {
    console.error('Customer host connections GET error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get impersonation context
    const impersonation = await getImpersonationContext(request)
    
    if (!hasCustomerAccess(session, impersonation.isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { serverId, accountName } = body

    if (!serverId || !accountName) {
      return NextResponse.json({ 
        error: 'Server ID and account name are required' 
      }, { status: 400 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user creating connection for customer ID: ${userId}`)
    }

    // Check if account name already exists for this user
    const existingResult = await pool.query(`
      SELECT id FROM whatsapp_instances 
      WHERE "userId" = $1::text AND name = $2
    `, [userId, accountName])

    if (existingResult.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Account name already exists. Please choose a different name.' 
      }, { status: 409 })
    }

    // Create account identifier for WhatsApp server
    const accountId = `${userId}_${accountName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}`

    let whatsappServerResult = null
    let qrCode = null
    let connectionStatus = 'CONNECTING'

    // Validate that the selected server exists and is active
    const selectedServer = await whatsappServerManager.getServerById(serverId)
    if (!selectedServer) {
      return NextResponse.json({ 
        error: 'Invalid server selection',
        message: 'Selected server does not exist or is not active'
      }, { status: 400 })
    }
    
    // Alternative approach - create serverId as null to bypass foreign key constraint
    let actualServerId = null
    
    // Try to ensure server exists in database before creating instance
    try {
      // Check if server exists, if not create it
      const serverCheckResult = await pool.query(
        'SELECT id FROM whatsapp_servers WHERE id = $1',
        [serverId]
      )
      
      if (serverCheckResult.rows.length === 0) {
        // Insert the server record with selected server details
        await pool.query(`
          INSERT INTO whatsapp_servers (id, name, url, port, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO NOTHING
        `, [
          serverId,
          selectedServer.name,
          selectedServer.url,
          selectedServer.port || 3110
        ])
      }
      // If we get here, the server exists or was created successfully
      actualServerId = serverId
    } catch (serverError) {
      console.error('Failed to ensure server exists:', serverError)
      console.error('Server error details:', {
        message: serverError.message,
        code: serverError.code,
        detail: serverError.detail
      })
      // Use null for serverId to bypass foreign key constraint
      console.log('Using null serverId to bypass foreign key constraint')
      actualServerId = null
    }
    
    // Connect to selected WhatsApp server
    try {
      console.log(`Creating WhatsApp connection for account: ${accountId} on server: ${selectedServer.name}`)
      
      // Log webhook configuration for debugging
      logWebhookConfig()
      
      // Generate webhook payload with device configuration
      const webhookPayload = generateDeviceWebhookPayload(accountId)
      console.log('📡 Webhook payload:', JSON.stringify(webhookPayload, null, 2))
      
      const connectController = new AbortController()
      const connectTimeoutId = setTimeout(() => connectController.abort(), 10000)
      
      // Use the specific selected server instead of trying multiple servers
      const connectResponse = await fetch(`${selectedServer.url}/api/accounts/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(webhookPayload),
        signal: connectController.signal
      })
        
      clearTimeout(connectTimeoutId)

      if (connectResponse.ok) {
        whatsappServerResult = await connectResponse.json()
        console.log('WhatsApp server response:', whatsappServerResult)
        console.log('🔍 CHECKING FOR QR CODE IN RESPONSE...')
        
        // Check if QR code is immediately available
        if (whatsappServerResult.data?.qrCode || whatsappServerResult.data?.qr) {
          qrCode = whatsappServerResult.data.qrCode || whatsappServerResult.data.qr
          connectionStatus = 'AUTHENTICATING'
          console.log('QR code available immediately from connect response')
        } else {
          // Try to get QR code separately from the selected server
          try {
            const qrController = new AbortController()
            const qrTimeoutId = setTimeout(() => qrController.abort(), 5000)
            
            const qrResponse = await fetch(`${selectedServer.url}/api/accounts/${accountId}/qr`, {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              signal: qrController.signal
            })
            
            clearTimeout(qrTimeoutId)
            
            if (qrResponse.ok) {
              const qrData = await qrResponse.json()
              qrCode = qrData.data?.qrCode || qrData.data?.qr
              console.log('QR Response received:', { success: qrData.success, hasQR: !!qrCode })
              if (qrCode) {
                connectionStatus = 'AUTHENTICATING'
              }
            }
          } catch (qrError) {
            console.warn('Failed to get QR code:', qrError.message)
          }
        }
      } else {
        const errorData = await connectResponse.json()
        console.error('WhatsApp server error:', errorData)
      }
    } catch (fetchError) {
      console.error('Failed to connect to WhatsApp server:', fetchError.message)
      // Continue with database creation even if WhatsApp server is unavailable
    }

    // Generate unique ID for the instance
    const instanceId = Date.now().toString()
    
    // Create instance in database - store both display name and server account ID
    const instanceResult = await pool.query(`
      INSERT INTO whatsapp_instances (
        id, "userId", "serverId", name, status, "qrCode", 
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2::text, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, status, "qrCode", "createdAt"
    `, [
      instanceId,
      userId, 
      actualServerId, // Use null if server creation failed, otherwise use serverId
      accountId, // Store server account ID as name for server communication
      connectionStatus,
      qrCode
    ])

    const newConnection = instanceResult.rows[0]

    // Determine server name based on actualServerId
    const displayServerId = actualServerId
    const serverName = actualServerId === null ? 'Primary Server (No FK)' : selectedServer.name

    const response = {
      id: newConnection.id,
      serverId: displayServerId,
      serverName: selectedServer.name, // Use the actual selected server name
      accountName: accountName, // Use the provided account name instead of accountId
      accountId: accountId,
      phoneNumber: null,
      status: connectionStatus,
      qrCode: qrCode,
      lastActivity: null,
      messageCount: 0,
      createdAt: newConnection.createdAt,
      whatsappServerConnected: !!whatsappServerResult,
      instructions: qrCode ? 
        'QR code generated! Open WhatsApp on your phone → Settings → Connected Devices → Connect a Device, then scan the QR code above.' :
        'Connection initiated. Please check the server logs or refresh to get the QR code.'
    }

    console.log(`WhatsApp connection created:`, {
      accountId,
      accountName,
      serverId,
      hasQR: !!qrCode,
      serverConnected: !!whatsappServerResult
    })

    // Broadcast device creation to real-time clients
    const streamer = WhatsAppEventStreamer.getInstance()
    streamer.sendDeviceStatus({
      deviceUpdate: {
        deviceId: response.id,
        status: response.status,
        accountName: response.accountName,
        phoneNumber: response.phoneNumber,
        action: 'created'
      },
      userId: userId
    })

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Customer host connections POST error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}