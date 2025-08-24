import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { whatsappServerManager } from '@/lib/whatsapp-servers'

// Database connection
const pool = new Pool(getDatabaseConfig())

// Queue settings
let queueSettings: QueueSettings = {
  enabled: true,
  interval: 3,
  batchSize: 5,
  maxRetries: 3,
  retryDelay: 30
}
let processingInterval: NodeJS.Timeout | null = null

interface QueueSettings {
  enabled: boolean
  interval: number
  batchSize: number
  maxRetries: number
  retryDelay: number
}

// GET - Fetch queue messages and stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'settings') {
      return NextResponse.json({ settings: queueSettings })
    }

    // Fetch messages from database
    const dbMessages = await pool.query(`
      SELECT 
        mq.id,
        mq."toNumber" as to,
        mq.message,
        mq.status,
        mq.priority,
        mq.scheduled as "scheduledAt",
        mq."createdAt",
        mq.attempts,
        mq."lastError",
        mq.metadata,
        wi.name as "deviceName"
      FROM message_queue mq
      LEFT JOIN whatsapp_instances wi ON mq."instanceId" = wi.id
      WHERE mq.status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED')
      ORDER BY mq.priority DESC, mq."createdAt" ASC
      LIMIT 100
    `)

    // Convert database records to QueueMessage format
    const allMessages = dbMessages.rows.map(row => ({
      id: row.id,
      to: row.to,
      message: row.message,
      messageType: row.metadata?.messageType || 'text',
      attachmentUrl: row.metadata?.attachmentUrl || row.metadata?.mediaUrl,
      deviceId: row.metadata?.deviceName || '',
      deviceName: row.deviceName || row.metadata?.deviceName || 'Unknown Device',
      status: row.status.toLowerCase() as 'pending' | 'processing' | 'sent' | 'failed',
      priority: row.priority || 0,
      scheduledAt: row.scheduledAt,
      createdAt: row.createdAt,
      attempts: row.attempts || 0,
      lastError: row.lastError,
      metadata: row.metadata
    }))

    // Calculate stats
    const stats = {
      totalMessages: allMessages.length,
      pendingMessages: allMessages.filter(m => m.status === 'pending').length,
      processingMessages: allMessages.filter(m => m.status === 'processing').length,
      sentMessages: allMessages.filter(m => m.status === 'sent').length,
      failedMessages: allMessages.filter(m => m.status === 'failed').length,
      messagesPerMinute: queueSettings.enabled ? Math.round(60 / queueSettings.interval * queueSettings.batchSize) : 0,
      estimatedTimeRemaining: queueSettings.enabled && allMessages.filter(m => m.status === 'pending').length > 0
        ? Math.ceil(allMessages.filter(m => m.status === 'pending').length / queueSettings.batchSize * queueSettings.interval / 60) + ' minutes'
        : '0 minutes'
    }

    return NextResponse.json({
      messages: allMessages,
      stats,
      settings: queueSettings
    })
  } catch (error) {
    console.error('Error fetching queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue data' },
      { status: 500 }
    )
  }
}

// POST - Handle queue operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // If no action is provided, treat as addMessage (bulk functionality)
    if (!action && body.toNumber && body.message) {
      return handleAddMessage(body)
    }

    switch (action) {
      case 'updateSettings':
        return handleUpdateSettings(body.settings)
      case 'pause':
        return handlePauseQueue()
      case 'resume':
        return handleResumeQueue()
      case 'clear':
        return handleClearQueue()
      case 'retry':
        return handleRetryMessage(body.messageId)
      case 'addMessage':
        return handleAddMessage(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing queue action:', error)
    return NextResponse.json(
      { error: 'Failed to process queue action' },
      { status: 500 }
    )
  }
}

// PUT - Handle retry and update operations
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, messageId } = body

    switch (action) {
      case 'retry':
        return handleRetryMessage(messageId)
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing PUT request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// DELETE - Remove specific message from queue
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    const action = searchParams.get('action')

    if (action === 'clear') {
      // Clear all failed messages
      await pool.query(`DELETE FROM message_queue WHERE status = 'FAILED'`)
      return NextResponse.json({ message: 'Queue cleared successfully' })
    }

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    // Delete from database
    const dbResult = await pool.query(`DELETE FROM message_queue WHERE id = $1`, [messageId])

    if (dbResult.rowCount && dbResult.rowCount > 0) {
      return NextResponse.json({ message: 'Message deleted successfully' })
    }

    return NextResponse.json(
      { error: 'Message not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}

// Handler functions
async function handleUpdateSettings(newSettings: Partial<QueueSettings>) {
  Object.assign(queueSettings, newSettings)
  
  if (queueSettings.enabled) {
    startQueueProcessor()
  } else {
    stopQueueProcessor()
  }

  return NextResponse.json({
    message: 'Settings updated successfully',
    settings: queueSettings
  })
}

async function handlePauseQueue() {
  queueSettings.enabled = false
  stopQueueProcessor()
  return NextResponse.json({ message: 'Queue paused' })
}

async function handleResumeQueue() {
  queueSettings.enabled = true
  startQueueProcessor()
  return NextResponse.json({ message: 'Queue resumed' })
}

async function handleClearQueue() {
  await pool.query(`DELETE FROM message_queue WHERE status IN ('FAILED', 'SENT')`)
  return NextResponse.json({ message: 'Queue cleared successfully' })
}

async function handleRetryMessage(messageId: string) {
  if (!messageId) {
    return NextResponse.json(
      { error: 'Message ID is required' },
      { status: 400 }
    )
  }

  await pool.query(`
    UPDATE message_queue 
    SET status = 'PENDING', attempts = 0, "lastError" = NULL
    WHERE id = $1
  `, [messageId])

  return NextResponse.json({ message: 'Message queued for retry' })
}

async function handleAddMessage(data: any) {
  try {
    const { 
      toNumber, 
      message, 
      messageType = 'text',
      attachmentUrl,
      priority = 0,
      instanceId,
      instanceName,
      scheduledAt,
      metadata = {}
    } = data

    if (!toNumber || !message || !instanceId) {
      return NextResponse.json(
        { error: 'Missing required fields: toNumber, message, instanceId' },
        { status: 400 }
      )
    }

    // Look up the actual database instanceId by name
    const instanceResult = await pool.query(`
      SELECT id FROM whatsapp_instances 
      WHERE name = $1 
      LIMIT 1
    `, [instanceId])

    if (instanceResult.rows.length === 0) {
      console.log(`WhatsApp instance not found: ${instanceId}`)
      console.log(`Available instances:`, await pool.query(`SELECT name FROM whatsapp_instances LIMIT 5`))
      return NextResponse.json(
        { error: 'WhatsApp instance not found' },
        { status: 404 }
      )
    }

    const dbInstanceId = instanceResult.rows[0].id

    // Generate unique message ID
    const messageId = `${Date.now()}_${Math.random().toString(36).substring(2)}`
    
    // Insert message into database queue
    const result = await pool.query(`
      INSERT INTO message_queue (
        id, "toNumber", message, status, priority, scheduled, "instanceId", 
        "createdAt", "updatedAt", attempts, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, $8)
      RETURNING *
    `, [
      messageId,
      toNumber,
      message,
      'PENDING',
      priority,
      scheduledAt ? new Date(scheduledAt) : null,
      dbInstanceId,
      JSON.stringify({
        ...metadata,
        messageType,
        attachmentUrl,
        instanceName: instanceId,
        via: 'bulk_ui'
      })
    ])

    const insertedMessage = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        queueId: messageId,
        to: toNumber,
        message,
        status: 'QUEUED',
        priority,
        scheduledAt,
        createdAt: insertedMessage.createdAt
      },
      message: 'Message added to queue successfully'
    })

  } catch (error) {
    console.error('Error adding message to queue:', error)
    return NextResponse.json(
      { error: 'Failed to add message to queue' },
      { status: 500 }
    )
  }
}

// Queue processor functions
function startQueueProcessor() {
  if (processingInterval) return

  console.log('Starting queue processor with interval:', queueSettings.interval + 's')
  
  processingInterval = setInterval(async () => {
    await processQueue()
  }, queueSettings.interval * 1000)
}

function stopQueueProcessor() {
  if (processingInterval) {
    clearInterval(processingInterval)
    processingInterval = null
    console.log('Queue processor stopped')
  }
}

async function processQueue() {
  try {
    // Get pending messages from database, prioritized
    const result = await pool.query(`
      SELECT 
        mq.*,
        wi.name as device_name,
        wi."userId" as user_id,
        wi."serverId" as server_id
      FROM message_queue mq
      JOIN whatsapp_instances wi ON mq."instanceId" = wi.id
      WHERE mq.status = 'PENDING'
        AND (mq.scheduled IS NULL OR mq.scheduled <= CURRENT_TIMESTAMP)
        AND mq.attempts < $1
      ORDER BY mq.priority DESC, mq."createdAt" ASC
      LIMIT $2
    `, [queueSettings.maxRetries, queueSettings.batchSize])

    if (result.rows.length === 0) return

    console.log(`Processing ${result.rows.length} messages from database queue`)

    // Process each database message
    for (const dbMessage of result.rows) {
      await processDbMessage(dbMessage)
    }
  } catch (error) {
    console.error('Error processing queue:', error)
  }
}

async function checkCustomerSubscription(deviceName: string): Promise<boolean> {
  try {
    // Get customer ID from WhatsApp instance
    const instanceResult = await pool.query(`
      SELECT "userId" FROM whatsapp_instances 
      WHERE name = $1
    `, [deviceName])

    if (instanceResult.rows.length === 0) {
      console.log(`No instance found for device: ${deviceName}`)
      return false
    }

    const userId = instanceResult.rows[0].userId

    // Check active subscription
    const subscriptionResult = await pool.query(`
      SELECT cp.id, cp."isActive", cp."endDate", p."messageLimit", cp."messagesUsed",
        CASE 
          WHEN cp."endDate" <= NOW() THEN 'EXPIRED'
          WHEN cp."isActive" = true AND cp."endDate" > NOW() THEN 'ACTIVE'
          WHEN cp."isActive" = false AND cp."endDate" > NOW() THEN 'PENDING'
          ELSE 'INACTIVE'
        END as status
      FROM customer_packages cp
      JOIN packages p ON cp."packageId" = p.id
      WHERE cp."userId" = $1::text 
        AND cp."isActive" = true 
        AND cp."endDate" > CURRENT_TIMESTAMP
      ORDER BY cp."createdAt" DESC
      LIMIT 1
    `, [userId])

    if (subscriptionResult.rows.length === 0) {
      console.log(`No active subscription found for user: ${userId}`)
      return false
    }

    const subscription = subscriptionResult.rows[0]
    
    // Check message limit
    if (subscription.messageLimit && subscription.messagesUsed >= subscription.messageLimit) {
      console.log(`Message limit exceeded for user: ${userId} (${subscription.messagesUsed}/${subscription.messageLimit})`)
      return false
    }

    // Update message usage count
    await pool.query(`
      UPDATE customer_packages 
      SET "messagesUsed" = "messagesUsed" + 1,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [subscription.id])

    console.log(`Subscription valid for user: ${userId}, messages used: ${subscription.messagesUsed + 1}`)
    return true

  } catch (error) {
    console.error('Error checking customer subscription:', error)
    return false
  }
}

async function processDbMessage(dbMessage: any) {
  try {
    // Update status to PROCESSING
    await pool.query(`
      UPDATE message_queue 
      SET status = 'PROCESSING', 
          attempts = attempts + 1,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [dbMessage.id])

    // Check customer subscription before sending
    const hasValidSubscription = await checkCustomerSubscription(dbMessage.device_name)
    
    if (!hasValidSubscription) {
      // Mark as failed due to invalid subscription
      await pool.query(`
        UPDATE message_queue 
        SET status = 'FAILED',
            "lastError" = 'Invalid or expired subscription',
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [dbMessage.id])
      console.log(`Message ${dbMessage.id} failed: Invalid or expired subscription`)
      return
    }

    // Build message object exactly like the working UI
    let messageObject: any = { text: dbMessage.message }
    
    // Handle attachments if present
    if (dbMessage.metadata?.attachmentUrl || dbMessage.metadata?.mediaUrl) {
      const attachmentUrl = dbMessage.metadata.attachmentUrl || dbMessage.metadata.mediaUrl
      
      // Determine attachment type from URL or metadata
      const messageType = dbMessage.metadata?.messageType || 'image'
      
      switch (messageType) {
        case 'image':
          messageObject = {
            image: {
              url: attachmentUrl,
              caption: dbMessage.message || undefined
            }
          }
          break
        case 'document':
          messageObject = {
            document: {
              url: attachmentUrl,
              filename: dbMessage.metadata?.filename || 'document',
              caption: dbMessage.message || undefined
            }
          }
          break
        case 'video':
          messageObject = {
            video: {
              url: attachmentUrl,
              caption: dbMessage.message || undefined
            }
          }
          break
        case 'audio':
          messageObject = {
            audio: { url: attachmentUrl }
          }
          break
        default:
          messageObject = { text: dbMessage.message }
      }
    }

    // Format phone number exactly like the working UI
    let formattedTo = dbMessage.toNumber
    
    if (!formattedTo.includes('@')) {
      // Clean the number
      let cleanNumber = formattedTo.replace(/\D/g, '')
      
      // Remove + if present
      if (formattedTo.startsWith('+')) {
        cleanNumber = formattedTo.substring(1).replace(/\D/g, '')
      }
      
      // Handle Indian numbers (add country code if missing)
      if (cleanNumber.length === 10 && cleanNumber.match(/^[6-9]/)) {
        cleanNumber = '91' + cleanNumber
      }
      
      // Format as WhatsApp JID
      formattedTo = `${cleanNumber}@s.whatsapp.net`
    }

    // Get server URL
    const serverUrl = dbMessage.server_id 
      ? await getServerUrlFromServerId(dbMessage.server_id)
      : process.env.WHATSAPP_SERVER_URL || 'http://127.0.0.1:3110'

    // Send via WhatsApp API using same format as working UI
    const response = await fetch(`${serverUrl}/api/accounts/${dbMessage.device_name}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedTo,
        message: messageObject
      })
    })

    const result = await response.json()
    
    if (result.success) {
      // Mark as SENT
      await pool.query(`
        UPDATE message_queue 
        SET status = 'SENT',
            "processedAt" = CURRENT_TIMESTAMP,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [dbMessage.id])
      
      // Log successful send to sent_messages table
      await logSentMessageFromDb(dbMessage)
      
      console.log(`✅ Message ${dbMessage.id} sent successfully to ${dbMessage.toNumber}`)
    } else {
      // Mark as failed with error
      await pool.query(`
        UPDATE message_queue 
        SET status = 'FAILED',
            "lastError" = $2,
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [dbMessage.id, result.error || 'Unknown error'])
      
      console.log(`❌ Message ${dbMessage.id} failed: ${result.error}`)
    }

  } catch (error) {
    console.error(`Error processing message ${dbMessage.id}:`, error)
    
    // Mark as failed with error
    await pool.query(`
      UPDATE message_queue 
      SET status = 'FAILED',
          "lastError" = $2,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [dbMessage.id, error instanceof Error ? error.message : 'Unknown error'])
  }
}

async function getServerUrlFromServerId(serverId: string): Promise<string> {
  try {
    const servers = await whatsappServerManager.getAllServers()
    const server = servers.find(s => s.id === serverId)
    return server?.url || process.env.WHATSAPP_SERVER_URL || 'http://127.0.0.1:3110'
  } catch (error) {
    console.error('Error getting server URL:', error)
    return process.env.WHATSAPP_SERVER_URL || 'http://127.0.0.1:3110'
  }
}

async function logSentMessageFromDb(dbMessage: any) {
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
      dbMessage.user_id,
      dbMessage.device_name,
      dbMessage.toNumber,
      dbMessage.message,
      'sent',
      JSON.stringify({ 
        queueId: dbMessage.id,
        serverId: dbMessage.server_id,
        via: 'queue_processor'
      })
    ])
    console.log(`✅ Logged sent message for user ${dbMessage.user_id}`)
  } catch (error) {
    console.warn('Failed to log sent message:', error)
  }
}

// Auto-start queue processor on server startup
if (queueSettings.enabled) {
  setTimeout(() => {
    startQueueProcessor()
  }, 2000) // Small delay to ensure server is ready
}