import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// API Key authentication middleware
async function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header' }
  }

  const apiKey = authHeader.replace('Bearer ', '')
  
  try {
    // Check if API key exists and is active
    const keyResult = await pool.query(`
      SELECT ak.id, ak."userId", ak.permissions, ak."isActive", ak."expiresAt", ak."neverExpires"
      FROM api_keys ak
      WHERE ak.key = $1 AND ak."isActive" = true
    `, [apiKey])

    if (keyResult.rows.length === 0) {
      return { valid: false, error: 'Invalid or inactive API key' }
    }

    const key = keyResult.rows[0]

    // Check expiration (unless neverExpires is true)
    if (!key.neverExpires && key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return { valid: false, error: 'API key has expired' }
    }

    // Check permissions
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
 * /api/v1/devices:
 *   get:
 *     tags:
 *       - Devices API
 *     summary: Get customer's WhatsApp devices (hybrid table format)
 *     description: Retrieve WhatsApp devices in a format matching the device management table
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [table, json]
 *           default: table
 *         description: Response format (table format matches UI table structure)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CONNECTED, CONNECTING, DISCONNECTED, AUTHENTICATING, ERROR]
 *         description: Filter devices by status
 *     responses:
 *       200:
 *         description: List of devices in table format
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
 *                     devices:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           deviceName:
 *                             type: string
 *                           phoneNumber:
 *                             type: string
 *                             nullable: true
 *                           status:
 *                             type: string
 *                           messages:
 *                             type: integer
 *                           lastActivity:
 *                             type: string
 *                             format: date-time
 *                           serverName:
 *                             type: string
 *                           actions:
 *                             type: array
 *                             items:
 *                               type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         connected:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         totalMessages:
 *                           type: integer
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
    const format = searchParams.get('format') || 'table'
    const statusFilter = searchParams.get('status')
    
    // Get customer's devices with server information
    let whereClause = `wi."userId" = $1::text`
    const params = [auth.userId]
    
    if (statusFilter) {
      whereClause += ` AND wi.status = $2`
      params.push(statusFilter)
    }

    const devicesResult = await pool.query(`
      SELECT 
        wi.id,
        wi.name as device_name,
        wi."phoneNumber" as phone_number,
        wi.status,
        wi."lastSeenAt" as last_activity,
        wi."createdAt" as created_at,
        wi."serverId" as server_id,
        COALESCE(ws.name, 'Unknown Server') as server_name,
        ws.url as server_url,
        COALESCE(message_counts.message_count, 0) as message_count
      FROM whatsapp_instances wi
      LEFT JOIN whatsapp_servers ws ON wi."serverId" = ws.id
      LEFT JOIN (
        SELECT 
          sm."deviceName",
          COUNT(*) as message_count
        FROM sent_messages sm
        WHERE sm."userId" = $1::text
        GROUP BY sm."deviceName"
      ) message_counts ON wi.name = message_counts."deviceName"
      WHERE ${whereClause}
      ORDER BY wi."createdAt" DESC
    `, params)

    const devices = devicesResult.rows

    if (format === 'table') {
      // Format response to match device management table
      const tableData = devices.map(device => ({
        deviceName: device.device_name,
        phoneNumber: device.phone_number || 'Not connected',
        status: getStatusDisplay(device.status),
        messages: parseInt(device.message_count) || 0,
        lastActivity: device.last_activity 
          ? new Date(device.last_activity).toLocaleString()
          : 'Never',
        serverName: device.server_name,
        actions: getAvailableActions(device.status),
        // Additional metadata
        metadata: {
          id: device.id,
          serverId: device.server_id,
          serverUrl: device.server_url,
          createdAt: device.created_at,
          rawStatus: device.status
        }
      }))

      // Calculate summary statistics
      const summary = {
        total: devices.length,
        connected: devices.filter(d => d.status === 'CONNECTED').length,
        pending: devices.filter(d => ['CONNECTING', 'AUTHENTICATING'].includes(d.status)).length,
        disconnected: devices.filter(d => d.status === 'DISCONNECTED').length,
        totalMessages: devices.reduce((sum, d) => sum + (parseInt(d.message_count) || 0), 0)
      }

      return NextResponse.json({
        success: true,
        data: {
          devices: tableData,
          summary,
          format: 'table'
        },
        message: `Retrieved ${devices.length} devices in table format`
      })
    } else {
      // Standard JSON format
      return NextResponse.json({
        success: true,
        data: {
          devices: devices.map(device => ({
            id: device.id,
            name: device.device_name,
            phoneNumber: device.phone_number,
            status: device.status,
            lastActivity: device.last_activity,
            messageCount: parseInt(device.message_count) || 0,
            serverId: device.server_id,
            serverName: device.server_name,
            serverUrl: device.server_url,
            createdAt: device.created_at
          })),
          format: 'json'
        },
        message: `Retrieved ${devices.length} devices`
      })
    }

  } catch (error) {
    console.error('Devices API error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to format status for display
function getStatusDisplay(status: string): string {
  const statusMap = {
    'CONNECTED': '🟢 Connected',
    'CONNECTING': '🟡 Connecting',
    'AUTHENTICATING': '🔵 Scan QR Code',
    'DISCONNECTED': '⚫ Disconnected',
    'ERROR': '🔴 Error'
  }
  return statusMap[status] || status
}

// Helper function to determine available actions based on status
function getAvailableActions(status: string): string[] {
  const baseActions = ['view', 'edit', 'delete']
  
  switch (status) {
    case 'CONNECTED':
      return [...baseActions, 'relink']
    case 'DISCONNECTED':
    case 'ERROR':
      return [...baseActions, 'reconnect']
    case 'AUTHENTICATING':
    case 'CONNECTING':
      return [...baseActions, 'generate-qr']
    default:
      return baseActions
  }
}