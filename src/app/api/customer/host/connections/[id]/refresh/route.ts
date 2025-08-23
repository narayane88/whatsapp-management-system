import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getImpersonationContext, hasCustomerAccess } from '@/lib/impersonation'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { whatsappServerManager } from '@/lib/whatsapp-servers'

const pool = new Pool(getDatabaseConfig())

/**
 * @swagger
 * /api/customer/host/connections/{id}/refresh:
 *   post:
 *     tags:
 *       - Customer Host Management
 *     summary: Refresh WhatsApp connection status
 *     description: Get fresh QR code and update connection status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Connection refreshed successfully
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: connectionId } = await params

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user refreshing connection for customer ID: ${userId}`)
    }

    // Get the connection details (removed description column)
    const connectionResult = await pool.query(`
      SELECT id, name, "serverId", status
      FROM whatsapp_instances 
      WHERE id = $1 AND "userId" = $2::text
    `, [connectionId, userId])

    if (connectionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const connection = connectionResult.rows[0]
    const accountId = connection.name // Use name as server account ID

    let updatedStatus = connection.status
    let qrCode = null
    let lastActivity = null
    let whatsappServerConnected = false

    // Try to refresh connection status from the assigned WhatsApp server
    if (connection.serverId) {
      try {
        // Get the specific server assigned to this instance
        let targetServer = await whatsappServerManager.getServerById(connection.serverId)
        
        // Fallback to optimal server if instance server is not available
        if (!targetServer) {
          targetServer = await whatsappServerManager.getOptimalServer()
        }
        
        if (!targetServer) {
          throw new Error('No active WhatsApp servers available')
        }

        // First, try to get current status
        console.log(`Attempting to fetch status from: ${targetServer.url}/api/accounts/${accountId}/status`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const statusResponse = await fetch(
          `${targetServer.url}/api/accounts/${accountId}/status`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          }
        )
        
        clearTimeout(timeoutId)

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          const serverStatus = statusData.data.status || connection.status
          // Map server status to database enum values
          const statusMapping = {
            'connecting': 'CONNECTING',
            'connected': 'CONNECTED', 
            'disconnected': 'DISCONNECTED',
            'error': 'ERROR',
            'authenticating': 'AUTHENTICATING'
          }
          updatedStatus = statusMapping[serverStatus] || serverStatus
          lastActivity = statusData.data.lastActivity
          whatsappServerConnected = true
          
          console.log(`Status for ${accountId}:`, statusData.data)
          console.log(`Mapped status: ${serverStatus} -> ${updatedStatus}`)
        }

        // If disconnected or needs QR, try to reconnect
        if (!statusResponse.ok || updatedStatus === 'DISCONNECTED' || updatedStatus === 'ERROR') {
          console.log(`Attempting to reconnect account: ${accountId}`)
          
          const reconnectController = new AbortController()
          const reconnectTimeoutId = setTimeout(() => reconnectController.abort(), 10000)
          
          const reconnectResponse = await fetch(`${targetServer.url}/api/accounts/connect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              id: accountId,
              reconnect: true
            }),
            signal: reconnectController.signal
          })
          
          clearTimeout(reconnectTimeoutId)

          if (reconnectResponse.ok) {
            const reconnectResult = await reconnectResponse.json()
            console.log(`Reconnect result for ${accountId}:`, reconnectResult)
            
            if (reconnectResult.data?.qrCode || reconnectResult.data?.qr) {
              qrCode = reconnectResult.data.qrCode || reconnectResult.data.qr
              updatedStatus = 'AUTHENTICATING'
              console.log('QR code available from reconnect response')
            }
            whatsappServerConnected = true
          }
        }

        // Try to get fresh QR code if needed
        if (!qrCode && (updatedStatus === 'AUTHENTICATING' || updatedStatus === 'CONNECTING')) {
          try {
            const qrController = new AbortController()
            const qrTimeoutId = setTimeout(() => qrController.abort(), 5000)
            
            const qrResponse = await fetch(`${targetServer.url}/api/accounts/${accountId}/qr`, {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              signal: qrController.signal
            })
            
            clearTimeout(qrTimeoutId)
            
            if (qrResponse.ok) {
              const qrData = await qrResponse.json()
              qrCode = qrData.data?.qrCode || qrData.data?.qr
              if (qrCode) {
                updatedStatus = 'AUTHENTICATING'
              }
              console.log(`QR code retrieved for ${accountId}: ${!!qrCode}`)
            }
          } catch (qrError) {
            console.warn(`Failed to get QR code for ${accountId}:`, qrError.message)
          }
        }

      } catch (fetchError) {
        console.error(`Failed to refresh connection ${accountId}:`, fetchError)
        console.error(`Error details:`, {
          name: fetchError.name,
          message: fetchError.message,
          cause: fetchError.cause
        })
        // Don't fail the entire request if WhatsApp server is unavailable
      }
    }

    // Update database with refreshed status
    const updateResult = await pool.query(`
      UPDATE whatsapp_instances 
      SET status = $1, "qrCode" = $2, "lastSeenAt" = $3, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $4 AND "userId" = $5::text
      RETURNING id, name, status, "qrCode", "lastSeenAt", "updatedAt"
    `, [
      updatedStatus,
      qrCode,
      lastActivity ? new Date(lastActivity) : null,
      connectionId,
      userId
    ])

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 })
    }

    const updatedConnection = updateResult.rows[0]

    // Determine server name from configuration
    let serverName = 'Unknown Server'
    if (connection.serverId) {
      try {
        const server = await whatsappServerManager.getServerById(connection.serverId)
        if (server) {
          serverName = server.name
        }
      } catch (error) {
        console.warn(`Failed to get server name for ${connection.serverId}:`, error)
      }
    }

    const response = {
      id: updatedConnection.id,
      serverId: connection.serverId,
      serverName: serverName,
      accountName: updatedConnection.name,
      phoneNumber: null,
      status: updatedConnection.status,
      qrCode: updatedConnection.qrCode,
      lastActivity: updatedConnection.lastSeenAt,
      messageCount: 0,
      updatedAt: updatedConnection.updatedAt,
      whatsappServerConnected: whatsappServerConnected,
      refreshed: true
    }

    console.log(`Connection refreshed:`, {
      connectionId,
      accountId,
      status: updatedStatus,
      hasQR: !!qrCode,
      serverConnected: whatsappServerConnected
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('Customer host connection refresh error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}