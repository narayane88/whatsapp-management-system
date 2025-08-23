import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { whatsappServerManager } from '@/lib/whatsapp-servers'

const pool = new Pool(getDatabaseConfig())

// API Key authentication middleware
async function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' }
  }

  const apiKey = authHeader.replace('Bearer ', '')
  
  try {
    const keyResult = await pool.query(`
      SELECT ak.id, ak."userId", ak.permissions, ak."isActive", ak."expiresAt", ak."neverExpires"
      FROM api_keys ak
      WHERE ak.key = $1 AND ak."isActive" = true
    `, [apiKey])

    if (keyResult.rows.length === 0) {
      return { valid: false, error: 'Invalid or inactive API key' }
    }

    const key = keyResult.rows[0]

    // Check expiration
    if (!key.neverExpires && key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return { valid: false, error: 'API key has expired' }
    }

    // Check permissions for servers endpoint
    const permissions = typeof key.permissions === 'string' 
      ? JSON.parse(key.permissions) 
      : key.permissions
    
    if (!permissions.includes('instances.read') && !permissions.includes('*')) {
      return { valid: false, error: 'Insufficient permissions for this endpoint' }
    }

    // Update last used timestamp
    await pool.query(`
      UPDATE api_keys SET "lastUsedAt" = CURRENT_TIMESTAMP WHERE id = $1
    `, [key.id])

    return { 
      valid: true, 
      userId: key.userId,
      apiKeyId: key.id,
      permissions 
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return { valid: false, error: 'Authentication failed' }
  }
}

/**
 * @swagger
 * /api/v1/servers:
 *   get:
 *     tags:
 *       - Servers API
 *     summary: Get available WhatsApp servers
 *     description: Retrieve list of WhatsApp servers available for device connections
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *         description: Filter servers by status
 *       - in: query
 *         name: includeHealth
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include real-time health information
 *     responses:
 *       200:
 *         description: List of available servers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     servers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           url:
 *                             type: string
 *                           location:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [active, inactive, maintenance]
 *                           capacity:
 *                             type: object
 *                             properties:
 *                               max:
 *                                 type: integer
 *                               current:
 *                                 type: integer
 *                               available:
 *                                 type: integer
 *                               percentage:
 *                                 type: number
 *                           performance:
 *                             type: object
 *                             properties:
 *                               ping:
 *                                 type: integer
 *                               uptime:
 *                                 type: number
 *                               version:
 *                                 type: string
 *                           recommended:
 *                             type: boolean
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         totalCapacity:
 *                           type: integer
 *                         availableCapacity:
 *                           type: integer
 *                         recommendedServer:
 *                           type: string
 *       401:
 *         description: Unauthorized - Invalid API key
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const auth = await validateApiKey(request)
    if (!auth.valid) {
      return NextResponse.json({ 
        success: false,
        error: auth.error 
      }, { status: auth.error.includes('permissions') ? 403 : 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const includeHealth = searchParams.get('includeHealth') !== 'false'
    
    try {
      // Get servers from configuration
      let configuredServers = await whatsappServerManager.getActiveServers()
      
      if (statusFilter) {
        configuredServers = configuredServers.filter(server => 
          server.status?.toLowerCase() === statusFilter.toLowerCase() || 
          (!server.status && statusFilter === 'active')
        )
      }

      // Fetch health data if requested
      const serversWithHealth = await Promise.all(
        configuredServers.map(async (server) => {
          let healthData = {
            status: 'inactive' as const,
            ping: 999,
            uptime: 0,
            version: '1.0.0',
            currentInstances: 0,
            lastSeen: 'Unknown'
          }

          if (includeHealth) {
            try {
              const [healthResponse, statsResponse] = await Promise.allSettled([
                fetch(`${server.url}/api/health`, { 
                  method: 'GET',
                  headers: { 'Accept': 'application/json' },
                  signal: AbortSignal.timeout(3000)
                }),
                fetch(`${server.url}/api/stats`, { 
                  method: 'GET',
                  headers: { 'Accept': 'application/json' },
                  signal: AbortSignal.timeout(3000)
                })
              ])

              if (healthResponse.status === 'fulfilled' && healthResponse.value.ok) {
                const health = await healthResponse.value.json()
                healthData.status = health.data?.status === 'healthy' ? 'active' : 'inactive'
                healthData.ping = health.data?.status === 'healthy' ? 25 : 999
                healthData.uptime = health.data?.uptime || 0
                healthData.version = health.data?.version || '1.0.0'
                healthData.lastSeen = health.data?.timestamp || new Date().toISOString()
              }

              if (statsResponse.status === 'fulfilled' && statsResponse.value.ok) {
                const stats = await statsResponse.value.json()
                healthData.currentInstances = stats.data?.accounts?.total || 0
              }
            } catch (healthError) {
              console.warn(`Failed to fetch health data for ${server.name}:`, healthError)
            }
          }

          // Calculate capacity metrics
          const maxCapacity = server.maxInstances || 100
          const currentCapacity = healthData.currentInstances
          const availableCapacity = Math.max(0, maxCapacity - currentCapacity)
          const capacityPercentage = Math.round((currentCapacity / maxCapacity) * 100)

          return {
            id: server.id,
            name: server.name,
         ////   url: server.url,
            location: server.location || 'Unknown',
            status: healthData.status,
            capacity: {
              max: maxCapacity,
              current: currentCapacity,
              available: availableCapacity,
              percentage: capacityPercentage
            },
            performance: {
              ping: healthData.ping,
              uptime: healthData.uptime,
              version: healthData.version,
              lastSeen: healthData.lastSeen
            },
            recommended: healthData.status === 'active' && capacityPercentage < 80
          }
        })
      )

      // Sort servers by recommendation and performance
      const sortedServers = serversWithHealth.sort((a, b) => {
        // Prioritize active servers
        if (a.status === 'active' && b.status !== 'active') return -1
        if (b.status === 'active' && a.status !== 'active') return 1
        
        // Then by capacity availability
        if (a.capacity.percentage !== b.capacity.percentage) {
          return a.capacity.percentage - b.capacity.percentage
        }
        
        // Finally by ping
        return a.performance.ping - b.performance.ping
      })

      // Calculate summary
      const summary = {
        total: sortedServers.length,
        active: sortedServers.filter(s => s.status === 'active').length,
        inactive: sortedServers.filter(s => s.status === 'inactive').length,
        maintenance: sortedServers.filter(s => s.status === 'maintenance').length,
        totalCapacity: sortedServers.reduce((sum, s) => sum + s.capacity.max, 0),
        availableCapacity: sortedServers.reduce((sum, s) => sum + s.capacity.available, 0),
        recommendedServer: sortedServers.find(s => s.recommended)?.id || null
      }

      return NextResponse.json({
        success: true,
        data: {
          servers: sortedServers,
          summary
        },
        message: `Retrieved ${sortedServers.length} servers`
      })

    } catch (configError) {
      console.error('Failed to load server configuration:', configError)
      
      return NextResponse.json({
        success: false,
        error: 'Server configuration unavailable',
        details: configError instanceof Error ? configError.message : 'Unknown error'
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Servers API error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}