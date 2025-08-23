import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import QRCode from 'qrcode'

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

    // Check permissions
    const permissions = typeof key.permissions === 'string' 
      ? JSON.parse(key.permissions) 
      : key.permissions
    
    if (!permissions.includes('instances.read') && !permissions.includes('*')) {
      return { valid: false, error: 'Insufficient permissions for this endpoint' }
    }

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
 * /api/v1/devices/{deviceId}/qr:
 *   get:
 *     tags:
 *       - Device Management
 *     summary: Get device QR code
 *     description: Retrieve QR code for WhatsApp device authentication in JSON or image format
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: WhatsApp device ID
 *         example: "demo_instance_001"
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, image, base64]
 *           default: json
 *         description: Response format (json, image, base64)
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           minimum: 100
 *           maximum: 1000
 *           default: 256
 *         description: QR code image size in pixels (for image format)
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force download of image file
 *     responses:
 *       200:
 *         description: QR code retrieved successfully
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
 *                     qrCode:
 *                       type: string
 *                       description: QR code data
 *                     base64Image:
 *                       type: string
 *                       description: Base64 encoded QR code image
 *                     imageUrl:
 *                       type: string
 *                       description: URL to get QR code as image
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Device not found
 *       401:
 *         description: Unauthorized
 *       503:
 *         description: QR code not available
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
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
    const format = searchParams.get('format') || 'json'
    const size = parseInt(searchParams.get('size') || '256')
    const download = searchParams.get('download') === 'true'

    const resolvedParams = await params
    const deviceId = resolvedParams.deviceId

    // Get device information
    const deviceResult = await pool.query(`
      SELECT wi.*, ws.name as server_name, ws.url as server_url
      FROM whatsapp_instances wi
      LEFT JOIN whatsapp_servers ws ON wi."serverId" = ws.id
      WHERE wi.id = $1 AND wi."userId" = $2::text
    `, [deviceId, auth.userId])

    if (deviceResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Device not found or access denied'
      }, { status: 404 })
    }

    const device = deviceResult.rows[0]

    // Get QR code from WhatsApp server
    let qrCode = null
    try {
      const qrResponse = await fetch(`${device.server_url}/api/get-qr/${deviceId}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      if (qrResponse.ok) {
        const qrResult = await qrResponse.json()
        qrCode = qrResult.qr
      }
    } catch (qrError) {
      console.warn('Failed to fetch QR code from server:', qrError)
    }

    if (!qrCode) {
      return NextResponse.json({
        success: false,
        error: 'QR code not available. Device may already be connected or session expired.',
        suggestion: 'Try reconnecting the device to generate a new QR code.'
      }, { status: 503 })
    }

    // Handle different response formats
    if (format === 'image') {
      try {
        // Generate QR code image
        const qrImageBuffer = await QRCode.toBuffer(qrCode, {
          type: 'png',
          width: Math.min(Math.max(size, 100), 1000),
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })

        const headers = new Headers({
          'Content-Type': 'image/png',
          'Content-Length': qrImageBuffer.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        })

        if (download) {
          headers.set('Content-Disposition', `attachment; filename="${device.name}_qr_code.png"`)
        } else {
          headers.set('Content-Disposition', `inline; filename="${device.name}_qr_code.png"`)
        }

        return new NextResponse(qrImageBuffer, { headers })
      } catch (imageError) {
        console.error('Failed to generate QR image:', imageError)
        return NextResponse.json({
          success: false,
          error: 'Failed to generate QR code image'
        }, { status: 500 })
      }
    }

    // Generate base64 image for JSON responses
    let base64Image = null
    try {
      const qrImageBuffer = await QRCode.toBuffer(qrCode, {
        type: 'png',
        width: 256,
        margin: 2
      })
      base64Image = `data:image/png;base64,${qrImageBuffer.toString('base64')}`
    } catch (base64Error) {
      console.warn('Failed to generate base64 image:', base64Error)
    }

    if (format === 'base64') {
      return NextResponse.json({
        success: true,
        data: {
          deviceId: device.id,
          deviceName: device.name,
          base64Image,
          expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString()
        }
      })
    }

    // Default JSON format
    return NextResponse.json({
      success: true,
      data: {
        deviceId: device.id,
        deviceName: device.name,
        qrCode,
        base64Image,
        imageUrl: `/api/v1/devices/${deviceId}/qr?format=image`,
        downloadUrl: `/api/v1/devices/${deviceId}/qr?format=image&download=true`,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        status: device.status,
        instructions: [
          '1. Open WhatsApp on your phone',
          '2. Tap Menu (⋮) > Linked devices',
          '3. Tap "Link a device"',
          '4. Point your phone camera at this QR code',
          '5. Wait for the connection to complete'
        ]
      },
      message: 'QR code retrieved successfully. Scan within 2 minutes.'
    })

  } catch (error) {
    console.error('QR code API error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}