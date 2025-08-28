import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getImpersonationContext, hasCustomerAccess } from '@/lib/impersonation'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { whatsappServerManager } from '@/lib/whatsapp-servers'

const pool = new Pool(getDatabaseConfig())

// Helper function to get server URL from device name
async function getServerUrlFromDevice(deviceName: string, userId: string): Promise<string> {
  try {
    // Get device server ID from database
    const deviceResult = await pool.query(`
      SELECT "serverId" FROM whatsapp_instances 
      WHERE name = $1 AND "userId" = $2::text
      LIMIT 1
    `, [deviceName, userId])

    if (deviceResult.rows.length === 0) {
      console.warn(`Device ${deviceName} not found for user ${userId}, using default server`)
      return process.env.WHATSAPP_SERVER_URL || 'http://localhost:3110'
    }

    const serverId = deviceResult.rows[0].serverId

    // If serverId is null, use default server
    if (!serverId) {
      console.warn(`Device ${deviceName} has no server ID, using default server`)
      return process.env.WHATSAPP_SERVER_URL || 'http://localhost:3110'
    }

    // Get server configuration from whatsapp-servers.json
    const servers = await whatsappServerManager.getAllServers()
    const server = servers.find(s => s.id === serverId)

    if (!server) {
      console.warn(`Server ${serverId} not found in configuration, using default server`)
      return process.env.WHATSAPP_SERVER_URL || 'http://localhost:3110'
    }

    console.log(`Routing message to server ${server.name} (${server.url}) for device ${deviceName}`)
    return server.url
  } catch (error) {
    console.error('Error getting server URL from device:', error)
    return process.env.WHATSAPP_SERVER_URL || 'http://localhost:3110'
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { deviceName, to, message } = body

    if (!deviceName || !to || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: deviceName, to, message' 
      }, { status: 400 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    
    if (impersonation.isImpersonating) {
      console.log(`🎭 Admin user sending message for customer ID: ${userId}`)
    }

    // Check subscription limits and voucher balance before allowing message sending
    try {
      // Get user's current subscription, message limits, and voucher balance
      const subscriptionResult = await pool.query(`
        SELECT 
          cp.id,
          cp."isActive",
          cp."endDate",
          cp."packageId",
          cp."messagesUsed",
          p."messageLimit",
          u.message_balance,
          CASE 
            WHEN cp."endDate" <= NOW() THEN 'EXPIRED'
            WHEN cp."isActive" = true AND cp."endDate" > NOW() THEN 'ACTIVE'
            ELSE 'INACTIVE'
          END as status
        FROM customer_packages cp
        JOIN packages p ON cp."packageId" = p.id
        JOIN users u ON cp."userId" = u.id::text
        WHERE cp."userId" = $1::text 
          AND cp."isActive" = true 
          AND cp."endDate" > CURRENT_TIMESTAMP
        ORDER BY cp."createdAt" DESC
        LIMIT 1
      `, [userId])

      // If no active subscription, check if user has voucher messages
      if (subscriptionResult.rows.length === 0) {
        const userResult = await pool.query(`
          SELECT message_balance FROM users WHERE id = $1
        `, [userId])
        
        if (userResult.rows.length === 0 || (userResult.rows[0].message_balance || 0) === 0) {
          return NextResponse.json({ 
            error: 'No active subscription found',
            message: 'Please purchase a subscription plan or redeem message vouchers to send messages.',
            code: 'NO_SUBSCRIPTION'
          }, { status: 402 })
        }

        // User has voucher messages but no subscription
        console.log(`✅ Message check passed: User has ${userResult.rows[0].message_balance} voucher messages`)
      } else {
        const subscription = subscriptionResult.rows[0]
        
        if (subscription.status !== 'ACTIVE') {
          return NextResponse.json({ 
            error: 'Subscription expired',
            message: 'Your subscription has expired. Please renew your plan to continue sending messages.',
            code: 'SUBSCRIPTION_EXPIRED'
          }, { status: 402 })
        }

        const messagesUsed = subscription.messagesUsed || 0
        const messageLimit = subscription.messageLimit
        const voucherBalance = subscription.message_balance || 0
        const subscriptionRemaining = Math.max(0, messageLimit - messagesUsed)
        const totalAvailable = subscriptionRemaining + voucherBalance

        if (totalAvailable <= 0) {
          return NextResponse.json({ 
            error: 'Message limit reached',
            message: `You have reached the maximum limit. Please upgrade your subscription or redeem vouchers to send more messages.`,
            code: 'MESSAGE_LIMIT_EXCEEDED',
            details: {
              messagesUsed,
              messageLimit,
              voucherBalance,
              totalAvailable,
              subscriptionPlan: subscription.packageId
            }
          }, { status: 402 })
        }

        console.log(`✅ Message subscription check passed: ${totalAvailable} total messages available (${subscriptionRemaining} from subscription + ${voucherBalance} from vouchers)`)
      }
      
    } catch (subscriptionError) {
      console.error('Error checking message subscription limits:', subscriptionError)
      return NextResponse.json({ 
        error: 'Unable to verify subscription',
        message: 'Please try again or contact support if the problem persists.',
        code: 'SUBSCRIPTION_CHECK_FAILED'
      }, { status: 500 })
    }

    // Verify device belongs to user
    console.log(`Looking for device: ${deviceName} for user: ${userId}`)
    const deviceResult = await pool.query(`
      SELECT id, name, "serverId" FROM whatsapp_instances 
      WHERE name = $1 AND "userId" = $2::text
      LIMIT 1
    `, [deviceName, userId])

    if (deviceResult.rows.length === 0) {
      console.log(`Device not found. Available devices for user ${userId}:`)
      const allDevices = await pool.query(`
        SELECT id, name FROM whatsapp_instances WHERE "userId" = $1::text
      `, [userId])
      console.log(allDevices.rows)
      return NextResponse.json({ error: 'Device not found or does not belong to your account' }, { status: 404 })
    }

    // Get the correct server URL for this device
    const serverUrl = await getServerUrlFromDevice(deviceName, userId)

    // Send message to the device's assigned WhatsApp server
    const response = await fetch(`${serverUrl}/api/accounts/${deviceName}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: to,
        message: message
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('WhatsApp server error:', result)
      return NextResponse.json({ 
        success: false,
        error: result.error || 'Failed to send message',
        details: result
      }, { status: response.status })
    }

    // Update message count - deduct from voucher messages first, then from subscription
    try {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // Check current voucher balance
        const voucherResult = await client.query(`
          SELECT message_balance FROM users WHERE id = $1
        `, [userId])
        
        const voucherBalance = voucherResult.rows[0]?.message_balance || 0
        
        if (voucherBalance > 0) {
          // Deduct from voucher messages first
          await client.query(`
            UPDATE users 
            SET message_balance = message_balance - 1
            WHERE id = $1
          `, [userId])
          console.log(`Deducted 1 message from voucher balance for user: ${userId}`)
        } else {
          // Deduct from subscription messages
          await client.query(`
            UPDATE customer_packages 
            SET "messagesUsed" = "messagesUsed" + 1,
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "userId" = $1::text AND "isActive" = true AND "endDate" > NOW()
          `, [userId])
          console.log(`Deducted 1 message from subscription for user: ${userId}`)
        }

        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    } catch (subscriptionError) {
      console.warn('Failed to update message count:', subscriptionError)
    }

    // Store message in database for tracking
    try {
      const messageId = Date.now().toString()
      await pool.query(`
        INSERT INTO sent_messages (
          id, "userId", "deviceName", "recipientNumber", message, status, "sentAt", 
          "updatedAt", metadata
        )
        VALUES ($1, $2::text, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7)
      `, [
        messageId,
        userId,
        deviceName,
        to,
        typeof message === 'string' ? message : JSON.stringify(message),
        'sent',
        JSON.stringify({ 
          deviceName,
          serverId: deviceResult.rows[0].serverId,
          serverUrl: serverUrl.replace(/^https?:\/\//, '').split('/')[0] // Store just domain:port
        })
      ])
      console.log(`Stored direct send message in database: ${messageId}`)
    } catch (dbError) {
      console.warn('Failed to store message in database:', dbError)
      // Don't fail the request if database storage fails
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Message sent successfully',
      serverUsed: serverUrl.replace(/^https?:\/\//, '').split('/')[0]
    })

  } catch (error) {
    console.error('Send message API error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}