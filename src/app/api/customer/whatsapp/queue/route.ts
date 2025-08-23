import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { whatsappServerManager } from '@/lib/whatsapp-servers'

// Database connection
const pool = new Pool(getDatabaseConfig())

// In-memory storage for demonstration (in production, use a database)
let messageQueue: QueueMessage[] = []
let queueSettings: QueueSettings = {
  enabled: true,
  interval: 10,
  batchSize: 1,
  maxRetries: 3,
  retryDelay: 30
}
let processingInterval: NodeJS.Timeout | null = null

interface QueueMessage {
  id: string
  to: string
  message: string
  messageType: string
  attachmentUrl?: string
  deviceId: string
  deviceName: string
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'paused'
  priority: number
  scheduledAt?: string
  createdAt: string
  attempts: number
  lastError?: string
  metadata?: any
}

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

    // Calculate stats
    const stats = {
      totalMessages: messageQueue.length,
      pendingMessages: messageQueue.filter(m => m.status === 'pending').length,
      processingMessages: messageQueue.filter(m => m.status === 'processing').length,
      sentMessages: messageQueue.filter(m => m.status === 'sent').length,
      failedMessages: messageQueue.filter(m => m.status === 'failed').length,
      messagesPerMinute: queueSettings.enabled ? Math.round(60 / queueSettings.interval) : 0,
      estimatedTimeRemaining: calculateETA()
    }

    return NextResponse.json({
      messages: messageQueue.sort((a, b) => {
        // Sort by priority (higher first), then by creation time
        if (a.priority !== b.priority) {
          return b.priority - a.priority
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }),
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

// POST - Add message to queue or update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'updateSettings') {
      const { settings } = body
      queueSettings = { ...queueSettings, ...settings }
      
      // Start or stop processing based on enabled status
      if (queueSettings.enabled && !processingInterval) {
        startQueueProcessor()
      } else if (!queueSettings.enabled && processingInterval) {
        stopQueueProcessor()
      }
      
      return NextResponse.json({ 
        message: 'Settings updated successfully',
        settings: queueSettings 
      })
    }

    // Add message to queue
    const {
      to,
      toNumber, 
      message,
      messageType = 'text',
      attachmentUrl,
      deviceId,
      instanceId,
      deviceName,
      instanceName,
      priority = 0,
      scheduledAt,
      metadata
    } = body

    // Map field names for compatibility
    const recipient = to || toNumber
    const device = deviceId || instanceId
    const deviceDisplayName = deviceName || instanceName

    if (!recipient || !message || !device) {
      return NextResponse.json(
        { error: 'Missing required fields: to/toNumber, message, deviceId/instanceId' },
        { status: 400 }
      )
    }

    const queueMessage: QueueMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      to: recipient,
      message,
      messageType,
      attachmentUrl,
      deviceId: device,
      deviceName: deviceDisplayName || 'Unknown Device',
      status: scheduledAt && new Date(scheduledAt) > new Date() ? 'paused' : 'pending',
      priority,
      scheduledAt,
      createdAt: new Date().toISOString(),
      attempts: 0,
      metadata
    }

    messageQueue.push(queueMessage)

    // Start processing if enabled and not already running
    if (queueSettings.enabled && !processingInterval) {
      startQueueProcessor()
    }

    return NextResponse.json({
      message: 'Message added to queue successfully',
      data: queueMessage
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding to queue:', error)
    return NextResponse.json(
      { error: 'Failed to add message to queue' },
      { status: 500 }
    )
  }
}

// PUT - Update message status or retry failed messages
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, action, status } = body

    const messageIndex = messageQueue.findIndex(m => m.id === messageId)
    if (messageIndex === -1) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    if (action === 'retry') {
      messageQueue[messageIndex] = {
        ...messageQueue[messageIndex],
        status: 'pending',
        attempts: 0,
        lastError: undefined
      }
    } else if (status) {
      messageQueue[messageIndex] = {
        ...messageQueue[messageIndex],
        status
      }
    }

    return NextResponse.json({
      message: 'Message updated successfully',
      data: messageQueue[messageIndex]
    })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    )
  }
}

// DELETE - Remove message from queue or clear all
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    const action = searchParams.get('action')

    if (action === 'clear') {
      messageQueue = []
      return NextResponse.json({ message: 'Queue cleared successfully' })
    }

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      )
    }

    const initialLength = messageQueue.length
    messageQueue = messageQueue.filter(m => m.id !== messageId)

    if (messageQueue.length === initialLength) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
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
    // Get pending messages, prioritized
    const pendingMessages = messageQueue
      .filter(m => {
        if (m.status !== 'pending') return false
        if (m.scheduledAt && new Date(m.scheduledAt) > new Date()) return false
        return true
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, queueSettings.batchSize)

    if (pendingMessages.length === 0) return

    console.log(`Processing ${pendingMessages.length} messages from queue`)

    for (const message of pendingMessages) {
      await processMessage(message)
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

async function processMessage(message: QueueMessage) {
  try {
    // Update status to processing
    const messageIndex = messageQueue.findIndex(m => m.id === message.id)
    if (messageIndex !== -1) {
      messageQueue[messageIndex].status = 'processing'
      messageQueue[messageIndex].attempts++
    }

    // Check customer subscription before sending
    const hasValidSubscription = await checkCustomerSubscription(message.deviceName)
    
    if (!hasValidSubscription) {
      // Mark as failed due to invalid subscription
      if (messageIndex !== -1) {
        messageQueue[messageIndex].status = 'failed'
        messageQueue[messageIndex].lastError = 'Invalid or expired subscription'
      }
      console.log(`Message ${message.id} failed: Invalid or expired subscription`)
      return
    }

    // Send the message if subscription is valid
    const success = await sendWhatsAppMessage(message)

    if (success) {
      // Mark as sent
      if (messageIndex !== -1) {
        messageQueue[messageIndex].status = 'sent'
      }
      
      // Log successful send to database
      await logSentMessage(message)
      
      console.log(`Message ${message.id} sent successfully to ${message.to}`)
    } else {
      // Mark as failed and schedule retry if under max attempts
      if (messageIndex !== -1) {
        if (message.attempts < queueSettings.maxRetries) {
          messageQueue[messageIndex].status = 'pending'
          messageQueue[messageIndex].lastError = 'Failed to send message'
          // Schedule retry after delay
          setTimeout(() => {
            const msg = messageQueue.find(m => m.id === message.id)
            if (msg && msg.status === 'pending') {
              msg.status = 'pending' // Reset for retry
            }
          }, queueSettings.retryDelay * 1000)
        } else {
          messageQueue[messageIndex].status = 'failed'
          messageQueue[messageIndex].lastError = 'Max retry attempts exceeded'
        }
      }
      console.log(`Message ${message.id} failed to send`)
    }
  } catch (error) {
    console.error(`Error processing message ${message.id}:`, error)
    const messageIndex = messageQueue.findIndex(m => m.id === message.id)
    if (messageIndex !== -1) {
      messageQueue[messageIndex].status = 'failed'
      messageQueue[messageIndex].lastError = error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function sendWhatsAppMessage(message: QueueMessage): Promise<boolean> {
  try {
    // Build message object based on type
    let messageObject: any = {}

    switch (message.messageType) {
      case 'text':
        messageObject = { text: message.message }
        break
      case 'image':
        messageObject = {
          image: {
            url: message.attachmentUrl,
            caption: message.message || undefined
          }
        }
        break
      case 'document':
        messageObject = {
          document: {
            url: message.attachmentUrl,
            filename: message.metadata?.filename || 'document',
            caption: message.message || undefined
          }
        }
        break
      case 'video':
        messageObject = {
          video: {
            url: message.attachmentUrl,
            caption: message.message || undefined
          }
        }
        break
      case 'audio':
        messageObject = {
          audio: { url: message.attachmentUrl }
        }
        break
      case 'location':
        messageObject = {
          location: {
            latitude: message.metadata?.lat || 0,
            longitude: message.metadata?.lon || 0,
            name: message.metadata?.name,
            address: message.metadata?.address
          }
        }
        break
      default:
        messageObject = { text: message.message }
    }

    // Format phone number
    let formattedRecipient = message.to.trim()
    if (!message.to.includes('@')) {
      let cleanNumber = message.to.replace(/\D/g, '')
      if (cleanNumber.length === 10 && cleanNumber.match(/^[6-9]/)) {
        cleanNumber = '91' + cleanNumber
      }
      formattedRecipient = `${cleanNumber}@s.whatsapp.net`
    }

    // Get optimal server for message sending
    const optimalServer = await whatsappServerManager.getOptimalServer()
    if (!optimalServer) {
      throw new Error('No active WhatsApp servers available')
    }

    // Send via WhatsApp API
    const response = await fetch(`${optimalServer.url}/api/accounts/${message.deviceName}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedRecipient,
        message: messageObject
      })
    })

    const result = await response.json()
    
    if (result.success && result.data?.messageId) {
      // Update message metadata with WhatsApp messageId for status tracking
      const messageIndex = messageQueue.findIndex(m => m.id === message.id)
      if (messageIndex !== -1) {
        messageQueue[messageIndex].metadata = {
          ...messageQueue[messageIndex].metadata,
          whatsappMessageId: result.data.messageId
        }
      }
    }
    
    return result.success === true
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return false
  }
}

async function logSentMessage(message: QueueMessage): Promise<void> {
  try {
    // Get customer ID from the WhatsApp instance
    const instanceResult = await pool.query(`
      SELECT "userId" FROM whatsapp_instances 
      WHERE name = $1
    `, [message.deviceName])

    if (instanceResult.rows.length === 0) {
      console.error(`No instance found for device: ${message.deviceName}`)
      return
    }

    const userId = instanceResult.rows[0].userId

    // Extract recipient name from metadata if available
    const recipientName = message.metadata?.recipientName || null

    // Create a unique ID for the sent message
    const sentMessageId = `sent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Insert sent message record with WhatsApp messageId for status tracking
    const metadata = {
      ...message.metadata,
      messageId: message.metadata?.whatsappMessageId || null
    }
    
    await pool.query(`
      INSERT INTO sent_messages (
        id, "userId", "recipientNumber", "recipientName", message, "messageType",
        "deviceName", status, "sentAt", "queueMessageId", "attachmentUrl", metadata,
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
      )
    `, [
      sentMessageId,
      userId,
      message.to,
      recipientName,
      message.message,
      message.messageType,
      message.deviceName,
      'sent', // Initial status
      new Date().toISOString(),
      message.id,
      message.attachmentUrl || null,
      JSON.stringify(metadata)
    ])

    console.log(`✅ Logged sent message ${sentMessageId} for user ${userId}`)
  } catch (error) {
    console.error('Error logging sent message:', error)
    // Don't throw error to avoid breaking the queue processing
  }
}

function calculateETA(): string {
  const pendingCount = messageQueue.filter(m => m.status === 'pending').length
  if (pendingCount === 0 || !queueSettings.enabled) return '0 minutes'
  
  const totalSeconds = pendingCount * queueSettings.interval
  const minutes = Math.round(totalSeconds / 60)
  
  if (minutes < 1) return 'Less than 1 minute'
  if (minutes === 1) return '1 minute'
  if (minutes < 60) return `${minutes} minutes`
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours === 1 && remainingMinutes === 0) return '1 hour'
  if (hours === 1) return `1 hour ${remainingMinutes} minutes`
  if (remainingMinutes === 0) return `${hours} hours`
  
  return `${hours} hours ${remainingMinutes} minutes`
}