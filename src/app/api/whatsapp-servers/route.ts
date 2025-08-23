import { NextRequest, NextResponse } from 'next/server'
import { whatsappServerManager } from '@/lib/whatsapp-servers'

// GET /api/whatsapp-servers - Get all WhatsApp servers (global endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const environment = searchParams.get('environment')
    const status = searchParams.get('status')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const configuration = await whatsappServerManager.getConfiguration()
    
    let servers = configuration.servers || []

    // Filter by environment if specified
    if (environment) {
      servers = servers.filter(server => server.environment === environment)
    }

    // Filter by status if specified
    if (status) {
      servers = servers.filter(server => server.status === status)
    }

    // Exclude inactive servers by default unless explicitly requested
    if (!includeInactive) {
      servers = servers.filter(server => server.status === 'active')
    }

    // Return simplified server information for global access
    const publicServers = servers.map(server => ({
      id: server.id,
      name: server.name,
      url: server.url,
      environment: server.environment,
      location: server.location,
      status: server.status,
      features: server.features,
      description: server.description,
      maxInstances: server.maxInstances
    }))

    return NextResponse.json({
      success: true,
      servers: publicServers,
      count: publicServers.length,
      lastUpdated: configuration.lastUpdated || new Date().toISOString()
    })

  } catch (error) {
    console.error('Global WhatsApp servers API error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to load WhatsApp servers',
      servers: [],
      count: 0,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/whatsapp-servers - Add new WhatsApp server (global endpoint with basic validation)
export async function POST(request: NextRequest) {
  try {
    const serverData = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'hostname', 'port', 'environment']
    const missingFields = requiredFields.filter(field => !serverData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        requiredFields: requiredFields
      }, { status: 400 })
    }

    // Validate port number
    if (isNaN(serverData.port) || serverData.port < 1 || serverData.port > 65535) {
      return NextResponse.json({ 
        success: false,
        error: 'Port must be a valid number between 1 and 65535'
      }, { status: 400 })
    }

    // Validate environment
    const validEnvironments = ['development', 'testing', 'staging', 'production']
    if (!validEnvironments.includes(serverData.environment)) {
      return NextResponse.json({ 
        success: false,
        error: `Environment must be one of: ${validEnvironments.join(', ')}`
      }, { status: 400 })
    }

    // Set defaults for missing optional fields
    const newServer = {
      name: serverData.name.trim(),
      hostname: serverData.hostname.trim(),
      port: parseInt(serverData.port),
      url: serverData.url || `http://${serverData.hostname}:${serverData.port}`,
      environment: serverData.environment,
      location: serverData.location || 'Unknown',
      status: serverData.status || 'inactive',
      maxInstances: serverData.maxInstances || 50,
      priority: serverData.priority || 999,
      features: serverData.features || ['qr-generation', 'messaging'],
      healthEndpoint: serverData.healthEndpoint || '/api/health',
      statsEndpoint: serverData.statsEndpoint || '/api/stats',
      accountsEndpoint: serverData.accountsEndpoint || '/api/accounts',
      description: serverData.description || `${serverData.name} - ${serverData.environment} environment`,
      connectionTimeout: serverData.connectionTimeout || 5000,
      retryAttempts: serverData.retryAttempts || 3,
      loadBalancing: serverData.loadBalancing || {
        enabled: true,
        weight: 1
      }
    }

    const createdServer = await whatsappServerManager.addServer(newServer)
    
    return NextResponse.json({
      success: true,
      message: 'WhatsApp server added successfully',
      server: {
        id: createdServer.id,
        name: createdServer.name,
        url: createdServer.url,
        environment: createdServer.environment,
        location: createdServer.location,
        status: createdServer.status,
        features: createdServer.features,
        description: createdServer.description
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Global WhatsApp servers POST error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to add WhatsApp server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/whatsapp-servers - Delete a WhatsApp server
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')
    
    if (!serverId) {
      return NextResponse.json({ 
        success: false,
        error: 'Server ID is required'
      }, { status: 400 })
    }

    const success = await whatsappServerManager.removeServer(serverId)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp server deleted successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Server not found'
      }, { status: 404 })
    }

  } catch (error) {
    console.error('Global WhatsApp servers DELETE error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete WhatsApp server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/whatsapp-servers - Update a WhatsApp server
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')
    const updateData = await request.json()
    
    if (!serverId) {
      return NextResponse.json({ 
        success: false,
        error: 'Server ID is required'
      }, { status: 400 })
    }

    const updatedServer = await whatsappServerManager.updateServer(serverId, updateData)
    
    if (updatedServer) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp server updated successfully',
        server: {
          id: updatedServer.id,
          name: updatedServer.name,
          status: updatedServer.status,
          environment: updatedServer.environment
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Server not found'
      }, { status: 404 })
    }

  } catch (error) {
    console.error('Global WhatsApp servers PUT error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update WhatsApp server',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}