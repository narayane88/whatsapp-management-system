import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getImpersonationContext, hasCustomerAccess } from '@/lib/impersonation'
import { whatsappServerManager } from '@/lib/whatsapp-servers'

/**
 * @swagger
 * /api/customer/host/servers:
 *   get:
 *     tags:
 *       - Customer Host Management
 *     summary: Get available WhatsApp servers for customer
 *     description: Retrieve list of WhatsApp servers that customers can connect to
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of available servers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   url:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [active, inactive, maintenance]
 *                   location:
 *                     type: string
 *                   maxInstances:
 *                     type: integer
 *                   currentInstances:
 *                     type: integer
 *                   ping:
 *                     type: integer
 *                   capacity:
 *                     type: integer
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
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user accessing servers for customer ID: ${impersonation.targetUserId}`)
    }

    try {
      // Get servers from JSON configuration
      const configuredServers = await whatsappServerManager.getActiveServers()
      
      if (configuredServers.length === 0) {
        return NextResponse.json({ 
          error: 'No active WhatsApp servers available',
          message: 'Please contact administrator to configure WhatsApp servers'
        }, { status: 503 })
      }

      // Fetch health data for each active server
      const serverPromises = configuredServers.map(async (server) => {
        try {
          const [healthResponse, statsResponse] = await Promise.all([
            fetch(`${server.url}/api/health`, { 
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              signal: AbortSignal.timeout(5000) // 5 second timeout
            }),
            fetch(`${server.url}/api/stats`, { 
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              signal: AbortSignal.timeout(5000) // 5 second timeout
            })
          ])

          let serverInfo = {
            id: server.id,
            name: server.name,
            url: server.url,
            status: 'inactive' as const,
            location: server.location,
            maxInstances: server.maxInstances,
            currentInstances: server.currentInstances || 0,
            ping: 999, // High ping indicates offline
            capacity: 0,
            uptime: 0,
            version: '1.0.0',
            lastSeen: 'Never'
          }

          if (healthResponse.ok && statsResponse.ok) {
            const health = await healthResponse.json()
            const stats = await statsResponse.json()

            serverInfo = {
              ...serverInfo,
              status: health.data?.status === 'healthy' ? 'active' : 'inactive',
              currentInstances: stats.data?.accounts?.total || 0,
              ping: 5, // Assume good ping for healthy servers
              capacity: Math.round(((stats.data?.accounts?.total || 0) / server.maxInstances) * 100),
              uptime: health.data?.uptime || 0,
              version: health.data?.version || '1.0.0',
              lastSeen: health.data?.timestamp || new Date().toISOString()
            }
          }

          return serverInfo
        } catch (fetchError) {
          console.warn(`Failed to fetch data for server ${server.name}:`, fetchError)
          
          // Return offline server info
          return {
            id: server.id,
            name: server.name,
            url: server.url,
            status: 'inactive' as const,
            location: server.location,
            maxInstances: server.maxInstances,
            currentInstances: 0,
            ping: 999,
            capacity: 0,
            uptime: 0,
            version: '1.0.0',
            lastSeen: 'Offline'
          }
        }
      })

      const servers = await Promise.all(serverPromises)
      
      // Sort servers by status (active first) and then by ping
      servers.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1
        if (b.status === 'active' && a.status !== 'active') return 1
        return a.ping - b.ping
      })

      return NextResponse.json(servers)

    } catch (configError) {
      console.error('Failed to load server configuration:', configError)
      
      return NextResponse.json({ 
        error: 'Server configuration unavailable',
        message: 'Unable to load WhatsApp server configuration',
        details: configError instanceof Error ? configError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Customer host servers API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}