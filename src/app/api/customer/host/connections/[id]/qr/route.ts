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
 * /api/customer/host/connections/{id}/qr:
 *   post:
 *     tags:
 *       - Customer Host Management
 *     summary: Generate QR code for WhatsApp connection
 *     description: Generate a fresh QR code for the specified WhatsApp connection
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 qrCode:
 *                   type: string
 *                 message:
 *                   type: string
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      console.log(`🎭 Admin user generating QR for customer ID: ${userId}`)
    }

    // Get the WhatsApp instance (removed description column)
    const instanceResult = await pool.query(`
      SELECT id, name, "serverId", status
      FROM whatsapp_instances 
      WHERE id = $1 AND "userId" = $2::text
    `, [connectionId, userId])

    if (instanceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const instance = instanceResult.rows[0]
    const serverAccountId = instance.name

    let qrCode = null
    let success = false
    let message = 'Failed to generate QR code'

    try {
      // Get the specific server assigned to this instance
      let targetServer = null
      
      if (instance.serverId) {
        targetServer = await whatsappServerManager.getServerById(instance.serverId)
      }
      
      // Fallback to optimal server if instance server is not available
      if (!targetServer) {
        targetServer = await whatsappServerManager.getOptimalServer()
      }
      
      if (!targetServer) {
        throw new Error('No active WhatsApp servers available')
      }

      // Get QR code from the assigned WhatsApp server
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const qrResponse = await fetch(
        `${targetServer.url}/api/accounts/${serverAccountId}/qr`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        }
      )
      
      clearTimeout(timeoutId)

      if (qrResponse.ok) {
        const qrData = await qrResponse.json()
        qrCode = qrData.data?.qr || qrData.data?.qrCode || qrData.qrCode
        
        if (qrCode) {
          success = true
          message = 'Fresh QR code generated successfully'
          
          // Update database with new QR code
          await pool.query(`
            UPDATE whatsapp_instances 
            SET "qrCode" = $1, "updatedAt" = CURRENT_TIMESTAMP, status = 'AUTHENTICATING'
            WHERE id = $2
          `, [qrCode, connectionId])
        } else {
          message = 'QR code not available yet - try again in a few seconds'
        }
      } else {
        const errorData = await qrResponse.json()
        message = errorData.error || 'Failed to get QR code from server'
      }
    } catch (fetchError) {
      console.error('Failed to get QR code from WhatsApp server:', fetchError.message)
      message = 'WhatsApp server is not available'
    }

    return NextResponse.json({
      success,
      qrCode,
      message,
      connection: {
        id: connectionId,
        accountName: instance.name,
        status: success ? 'AUTHENTICATING' : instance.status,
        qrCode: qrCode
      }
    })

  } catch (error) {
    console.error('QR generation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}