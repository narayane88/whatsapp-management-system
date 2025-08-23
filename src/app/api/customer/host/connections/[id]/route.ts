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
 * /api/customer/host/connections/{id}:
 *   delete:
 *     tags:
 *       - Customer Host Management
 *     summary: Delete WhatsApp connection
 *     description: Remove a WhatsApp connection and disconnect from server
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
 *         description: Connection deleted successfully
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      console.log(`🎭 Admin user deleting connection for customer ID: ${userId}`)
    }

    // Get the connection details before deleting (removed description column)
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

    // Try to disconnect from the assigned WhatsApp server first
    let deviceLoggedOut = false
    if (connection.serverId) {
      try {
        console.log(`Disconnecting and logging out WhatsApp account: ${accountId}`)
        
        const disconnectController = new AbortController()
        const disconnectTimeoutId = setTimeout(() => disconnectController.abort(), 10000) // Longer timeout for logout
        
        // Get the specific server assigned to this instance
        let targetServer = await whatsappServerManager.getServerById(connection.serverId)
        
        // Fallback to optimal server if instance server is not available
        if (!targetServer) {
          targetServer = await whatsappServerManager.getOptimalServer()
        }
        
        if (!targetServer) {
          throw new Error('No active WhatsApp servers available')
        }

        const disconnectResponse = await fetch(`${targetServer.url}/api/accounts/${accountId}/disconnect`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            forceLogout: true,
            cleanupSession: true
          }),
          signal: disconnectController.signal
        })
        
        clearTimeout(disconnectTimeoutId)

        if (disconnectResponse.ok) {
          const disconnectResult = await disconnectResponse.json()
          deviceLoggedOut = true
          console.log(`Disconnect and logout successful for ${accountId}:`, disconnectResult)
        } else {
          const errorData = await disconnectResponse.json()
          console.warn(`Failed to disconnect ${accountId} from WhatsApp server:`, errorData)
        }
      } catch (fetchError) {
        console.warn(`Failed to disconnect ${accountId} from WhatsApp server:`, fetchError.message)
        // Continue with database deletion even if server disconnect fails
      }
    }

    // Delete related messages first (to handle foreign key constraints)
    await pool.query(`
      DELETE FROM messages WHERE "instanceId" = $1
    `, [connectionId])

    // Delete message queue entries
    await pool.query(`
      DELETE FROM message_queue WHERE "instanceId" = $1
    `, [connectionId])

    // Delete the connection from database
    const deleteResult = await pool.query(`
      DELETE FROM whatsapp_instances 
      WHERE id = $1 AND "userId" = $2::text
      RETURNING id, name
    `, [connectionId, userId])

    if (deleteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
    }

    console.log(`WhatsApp connection deleted:`, {
      connectionId,
      accountId,
      serverId: connection.serverId
    })

    return NextResponse.json({
      message: 'Connection deleted successfully',
      connectionId: connectionId,
      accountId: accountId,
      disconnectedFromServer: !!connection.serverId,
      deviceLoggedOut: deviceLoggedOut,
      sessionCleaned: true
    })

  } catch (error) {
    console.error('Customer host connection delete error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}