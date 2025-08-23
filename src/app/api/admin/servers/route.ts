import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { whatsappServerManager } from '@/lib/whatsapp-servers'

// GET /api/admin/servers - Get server info from JSON configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get servers from JSON configuration
    const configuredServers = await whatsappServerManager.getAllServers()
    
    // Transform servers to match expected format
    const servers = configuredServers.map((server, index) => ({
      id: server.id, // Use the actual server ID from configuration
      name: server.name,
      hostname: server.hostname,
      ipAddress: server.hostname, // Use hostname as IP address
      port: server.port,
      status: server.status === 'active' ? 'Online' : 
              server.status === 'inactive' ? 'Offline' :
              server.status === 'maintenance' ? 'Maintenance' : 'Warning',
      environment: server.environment === 'development' ? 'Development' :
                   server.environment === 'production' ? 'Production' :
                   server.environment === 'staging' ? 'Staging' : 'Testing',
      location: server.location,
      capacity: server.maxInstances,
      activeUsers: 0, // Will be populated by health checks
      messagesPerDay: 0, // Will be populated by stats
      uptime: 99.9, // Default uptime
      lastHeartbeat: server.lastHealthCheck || 'Never',
      version: '1.0.0',
      resources: {
        cpu: 0,
        memory: 0,
        storage: 25,
        network: 5
      },
      whatsappInstances: server.currentInstances || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creator: {
        name: session.user.name || 'System',
        email: session.user.email
      }
    }))

    // Calculate statistics
    const statistics = {
      totalServers: servers.length,
      onlineServers: servers.filter(s => s.status === 'Online').length,
      offlineServers: servers.filter(s => s.status === 'Offline').length,
      maintenanceServers: servers.filter(s => s.status === 'Maintenance').length,
      warningServers: servers.filter(s => s.status === 'Warning').length,
      totalUsers: servers.reduce((sum, s) => sum + s.activeUsers, 0),
      totalMessages: servers.reduce((sum, s) => sum + s.messagesPerDay, 0),
      totalInstances: servers.reduce((sum, s) => sum + s.whatsappInstances, 0),
      averageUptime: servers.length > 0 ? servers.reduce((sum, s) => sum + s.uptime, 0) / servers.length : 0
    }

    return NextResponse.json({
      servers,
      statistics
    })
  } catch (error) {
    console.error('Servers API GET error:', error)
    
    // Fallback: return empty data if configuration is not available
    const statistics = {
      totalServers: 0,
      onlineServers: 0,
      offlineServers: 0,
      maintenanceServers: 0,
      warningServers: 0,
      totalUsers: 0,
      totalMessages: 0,
      totalInstances: 0,
      averageUptime: 0
    }

    return NextResponse.json({ 
      servers: [],
      statistics,
      error: 'Failed to load server configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/admin/servers - Create new WhatsApp account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: 'Account name is required' 
      }, { status: 400 })
    }

    // Get optimal server for account creation
    const optimalServer = await whatsappServerManager.getOptimalServer()
    
    if (!optimalServer) {
      return NextResponse.json({ 
        error: 'No active WhatsApp servers available',
        details: 'All servers are currently offline or inactive'
      }, { status: 503 })
    }

    // Create new WhatsApp account on the optimal server
    const accountId = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    // Try optimal server first, then fallback to other active servers
    const activeServers = await whatsappServerManager.getActiveServers()
    let lastError: Error | null = null
    
    for (const server of activeServers) {
      try {
        const response = await fetch(`${server.url}/api/accounts/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: accountId }),
        })

        const result = await response.json()

        if (response.ok) {
          return NextResponse.json({
            message: 'WhatsApp account connection initiated successfully',
            account: {
              id: accountId,
              name: name,
              status: 'connecting'
            },
            server: {
              name: server.name,
              url: server.url
            },
            qrRequired: true,
            instructions: `Please check the WhatsApp server logs for QR code on ${server.name} (${server.url})`
          }, { status: 201 })
        } else {
          lastError = new Error(`Server ${server.name}: ${result.error || `HTTP ${response.status}`}`)
          console.warn(`Failed to create account on ${server.name}:`, result)
          continue // Try next server
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError : new Error('Unknown fetch error')
        console.warn(`Server ${server.name} is not responding:`, fetchError)
        continue // Try next server
      }
    }

    // All servers failed
    return NextResponse.json({ 
      error: 'All WhatsApp servers failed to create the account',
      details: lastError?.message || 'All configured servers are unreachable',
      serversAttempted: activeServers.map(s => s.name)
    }, { status: 503 })

  } catch (error) {
    console.error('WhatsApp account creation error:', error)
    return NextResponse.json({ 
      error: 'Failed to create WhatsApp account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

