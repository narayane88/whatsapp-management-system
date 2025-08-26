import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

interface MessageStatusUpdate {
  key: {
    id: string
    remoteJid: string
  }
  update?: {
    status?: number
    receipt?: {
      receiptTimestamp?: number
      readTimestamp?: number
    }
  }
  status?: number
  receipt?: {
    receiptTimestamp?: number
    readTimestamp?: number
  }
}

interface WebhookPayload {
  event: string
  accountId: string
  data: MessageStatusUpdate
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    console.log('📨 Webhook received for message status update')
    
    const payload: WebhookPayload = await request.json()
    
    if (payload.event !== 'message.status') {
      console.log(`⚠️ Ignoring webhook - event type: ${payload.event}`)
      return NextResponse.json({ success: true, message: `Ignored - event: ${payload.event}` })
    }
    
    const { accountId, data } = payload
    const messageId = data.key?.id
    const recipientJid = data.key?.remoteJid
    
    if (!messageId || !recipientJid) {
      console.log('❌ Invalid webhook payload - missing messageId or recipientJid')
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    
    console.log(`🔍 Processing status update for message ${messageId} from account ${accountId}`)
    
    // Extract status information
    let newStatus: string | null = null
    let deliveredAt: string | null = null
    let readAt: string | null = null
    
    // WhatsApp status codes:
    // 0 = ERROR (failed)
    // 1 = PENDING (sent)
    // 2 = SERVER_ACK (delivered to server)  
    // 3 = DELIVERY_ACK (delivered to device)
    // 4 = READ (read by recipient)
    const statusCode = data.update?.status || data.status
    const receipt = data.update?.receipt || data.receipt
    
    switch (statusCode) {
      case 0:
        newStatus = 'failed'
        break
      case 1:
        newStatus = 'sent'
        break
      case 2:
        newStatus = 'sent' // Server acknowledgment
        break
      case 3:
        newStatus = 'delivered'
        if (receipt?.receiptTimestamp) {
          deliveredAt = new Date(receipt.receiptTimestamp * 1000).toISOString()
        }
        break
      case 4:
        newStatus = 'read'
        if (receipt?.readTimestamp) {
          readAt = new Date(receipt.readTimestamp * 1000).toISOString()
        } else if (receipt?.receiptTimestamp) {
          readAt = new Date(receipt.receiptTimestamp * 1000).toISOString()
        }
        break
    }
    
    if (!newStatus) {
      console.log(`⚠️ Unknown status code: ${statusCode} for message ${messageId}`)
      return NextResponse.json({ success: true, message: 'Unknown status code' })
    }
    
    console.log(`📊 Status update: ${messageId} -> ${newStatus}${deliveredAt ? ` (delivered: ${deliveredAt})` : ''}${readAt ? ` (read: ${readAt})` : ''}`)
    
    // Find the message in our database by messageId and update it
    // We need to match on the WhatsApp messageId that was stored in metadata
    const updateQuery = `
      UPDATE sent_messages 
      SET status = $1,
          "deliveredAt" = COALESCE($2, "deliveredAt"),
          "readAt" = COALESCE($3, "readAt"),
          "updatedAt" = NOW()
      WHERE metadata->>'messageId' = $4
      RETURNING id, "recipientNumber", message, status
    `
    
    const result = await pool.query(updateQuery, [
      newStatus,
      deliveredAt,
      readAt, 
      messageId
    ])
    
    if (result.rowCount && result.rowCount > 0) {
      const updatedMessage = result.rows[0]
      console.log(`✅ Updated message status: ${updatedMessage.id} (to: ${updatedMessage.recipientNumber}) -> ${newStatus}`)
      
      // Broadcast message status update via SSE
      await broadcastMessageStatusUpdate(updatedMessage, newStatus, accountId)
      
      // If no match found, try alternative matching by recipient and recent timestamp
    } else {
      console.log(`⚠️ No message found with messageId: ${messageId}. Trying alternative matching...`)
      
      // Extract phone number from JID (format: 919876543210@s.whatsapp.net)
      const phoneNumber = recipientJid.replace('@s.whatsapp.net', '').replace('@c.us', '')
      
      // Try to find recent message to this recipient from the account's device
      const deviceResult = await pool.query(`
        SELECT "userId" FROM whatsapp_instances 
        WHERE name = $1
      `, [accountId])
      
      if (deviceResult.rows.length > 0) {
        const userId = deviceResult.rows[0].userId
        
        // Find recent message to this recipient
        const recentMessageQuery = `
          UPDATE sent_messages 
          SET status = $1,
              "deliveredAt" = COALESCE($2, "deliveredAt"),
              "readAt" = COALESCE($3, "readAt"),
              "updatedAt" = NOW()
          WHERE "userId" = $4 
            AND "recipientNumber" LIKE $5
            AND "sentAt" >= NOW() - INTERVAL '1 hour'
            AND status IN ('sent')
          ORDER BY "sentAt" DESC
          LIMIT 1
          RETURNING id, "recipientNumber", message, status
        `
        
        const fallbackResult = await pool.query(recentMessageQuery, [
          newStatus,
          deliveredAt,
          readAt,
          userId,
          `%${phoneNumber}%`
        ])
        
        if (fallbackResult.rowCount && fallbackResult.rowCount > 0) {
          const updatedMessage = fallbackResult.rows[0]
          console.log(`✅ Updated message status (fallback): ${updatedMessage.id} -> ${newStatus}`)
          
          // Broadcast message status update via SSE
          await broadcastMessageStatusUpdate(updatedMessage, newStatus, accountId)
        } else {
          console.log(`❌ No matching message found for ${phoneNumber} from user ${userId}`)
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Status update processed: ${newStatus}`,
      messageId,
      accountId,
      status: newStatus
    })
    
  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Broadcast message status updates to connected SSE clients
 */
async function broadcastMessageStatusUpdate(message: any, newStatus: string, accountId: string): Promise<void> {
  try {
    // Import dynamically to avoid circular dependencies
    const { WhatsAppEventStreamer } = await import('../../customer/whatsapp/events/route')
    
    // Find the device to get userId
    const deviceResult = await pool.query(`
      SELECT "userId" FROM whatsapp_instances 
      WHERE name = $1
    `, [accountId])
    
    if (deviceResult.rows.length === 0) {
      console.log(`⚠️ Device not found for status broadcast: ${accountId}`)
      return
    }
    
    const userId = deviceResult.rows[0].userId
    
    // Broadcast to all connected clients for this user using enhanced webhook method
    const streamer = WhatsAppEventStreamer.getInstance()
    streamer.sendWebhookEvent('message-sent', {
      messageId: message.id,
      recipientNumber: message.recipientNumber,
      status: newStatus,
      message: message.message,
      userId: userId,
      accountId: accountId,
      timestamp: new Date().toISOString(),
      source: 'webhook',
      priority: 'medium'
    })

    console.log(`📡 Broadcasted message status update: ${message.id} -> ${newStatus}`)

  } catch (error) {
    console.error('Error broadcasting message status update:', error)
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'WhatsApp Status Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
    events: [
      'message.status',
      'message.sent',
      'message.delivered', 
      'message.read'
    ]
  })
}