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

    // Check permissions for device management
    const permissions = typeof key.permissions === 'string' 
      ? JSON.parse(key.permissions) 
      : key.permissions
    
    if (!permissions.includes('instances.create') && !permissions.includes('*')) {
      return { valid: false, error: 'Insufficient permissions for device creation' }
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
 * /api/v1/devices/add:
 *   post:
 *     tags:
 *       - Device Management
 *     summary: Add new WhatsApp device
 *     description: Create a new WhatsApp device instance and generate QR code for authentication
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceName
 *             properties:
 *               deviceName:
 *                 type: string
 *                 description: Unique name for the WhatsApp device
 *                 example: "my_business_whatsapp_001"
 *               serverId:
 *                 type: string
 *                 description: Specific server ID to use (optional - auto-selects if not provided)
 *                 example: "server-1755622995233"
 *               description:
 *                 type: string
 *                 description: Optional description for the device
 *                 example: "Main business WhatsApp for customer support"
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - deviceName
 *             properties:
 *               deviceName:
 *                 type: string
 *               serverId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device created successfully with QR code
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
 *                     deviceId:
 *                       type: string
 *                     deviceName:
 *                       type: string
 *                     status:
 *                       type: string
 *                     serverId:
 *                       type: string
 *                     serverName:
 *                       type: string
 *                     qr:
 *                       type: object
 *                       properties:
 *                         code:
 *                           type: string
 *                           description: Base64 QR code data
 *                         imageUrl:
 *                           type: string
 *                           description: URL to download QR code image
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Invalid parameters
 *       401:
 *         description: Unauthorized - Invalid API key
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       409:
 *         description: Conflict - Device name already exists
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const auth = await validateApiKey(request)
    if (!auth.valid) {
      return NextResponse.json({ 
        success: false,
        error: auth.error 
      }, { status: auth.error.includes('permissions') ? 403 : 401 })
    }

    // Parse request body
    let body: any
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      body = Object.fromEntries(formData.entries())
    } else {
      body = await request.json()
    }

    const { deviceName, serverId, description } = body

    if (!deviceName) {
      return NextResponse.json({
        success: false,
        error: 'Device name is required'
      }, { status: 400 })
    }

    // Validate device name format
    if (!/^[a-zA-Z0-9_-]+$/.test(deviceName)) {
      return NextResponse.json({
        success: false,
        error: 'Device name can only contain letters, numbers, underscores, and hyphens'
      }, { status: 400 })
    }

    // Check if device name already exists for this user
    const existingDevice = await pool.query(`
      SELECT id FROM whatsapp_instances 
      WHERE name = $1 AND "userId" = $2::text
    `, [deviceName, auth.userId])

    if (existingDevice.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Device name already exists'
      }, { status: 409 })
    }

    // Get available servers
    const servers = await whatsappServerManager.getActiveServers()
    let selectedServer = null

    if (serverId) {
      // Use specified server
      selectedServer = servers.find(s => s.id === serverId)
      if (!selectedServer) {
        return NextResponse.json({
          success: false,
          error: 'Specified server not found or inactive'
        }, { status: 400 })
      }
    } else {
      // Auto-select best available server
      selectedServer = servers.find(s => s.status === 'active') || servers[0]
      if (!selectedServer) {
        return NextResponse.json({
          success: false,
          error: 'No active servers available'
        }, { status: 503 })
      }
    }

    // Generate unique device ID
    const deviceId = `${auth.userId}_${deviceName}_${Date.now()}`

    // Create device in database
    const deviceResult = await pool.query(`
      INSERT INTO whatsapp_instances (
        id, "userId", name, "serverId", status, "createdAt", "updatedAt"
      )
      VALUES ($1, $2::text, $3, $4, 'AUTHENTICATING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [deviceId, auth.userId, deviceName, selectedServer.id])

    const newDevice = deviceResult.rows[0]

    // Request QR code from WhatsApp server
    let qrData = null
    try {
      const qrResponse = await fetch(`${selectedServer.url}/api/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: deviceId,
          deviceName: deviceName
        }),
        signal: AbortSignal.timeout(10000)
      })

      if (qrResponse.ok) {
        const qrResult = await qrResponse.json()
        qrData = {
          code: qrResult.qr || null,
          imageUrl: `/api/v1/devices/${deviceId}/qr?format=image`,
          expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutes
        }

        // Update device status
        await pool.query(`
          UPDATE whatsapp_instances 
          SET status = 'AUTHENTICATING', "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [deviceId])
      }
    } catch (qrError) {
      console.warn('Failed to generate QR code:', qrError)
      // Continue without QR code - device can be connected later
    }

    // Log device creation (simplified - adjust based on actual audit_logs schema)
    try {
      await pool.query(`
        INSERT INTO audit_logs (
          id, "userId", action, resource, details, timestamp
        )
        VALUES (gen_random_uuid(), $1::text, 'CREATE_DEVICE', 'DEVICE', $2, CURRENT_TIMESTAMP)
      `, [
        auth.userId,
        JSON.stringify({
          deviceId,
          deviceName,
          serverId: selectedServer.id,
          serverName: selectedServer.name,
          apiKeyId: auth.apiKeyId
        })
      ])
    } catch (auditError) {
      console.warn('Failed to log audit entry:', auditError)
      // Continue without audit log - don't fail the device creation
    }

    return NextResponse.json({
      success: true,
      data: {
        deviceId: newDevice.id,
        deviceName: newDevice.name,
        status: newDevice.status,
        serverId: selectedServer.id,
        serverName: selectedServer.name,
        serverUrl: selectedServer.url,
        qr: qrData,
        createdAt: newDevice.createdAt
      },
      message: qrData ? 
        'Device created successfully. Scan QR code to authenticate.' : 
        'Device created successfully. QR code will be available shortly.'
    }, { status: 201 })

  } catch (error) {
    console.error('Add device API error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}