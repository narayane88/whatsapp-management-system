import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

interface WhatsAppEvent {
  type: 'queue-update' | 'message-sent' | 'device-status' | 'stats-update' | 'connected' | 'heartbeat'
  data?: any
  timestamp: string
  clientId?: string
  serverTime?: string
  source?: 'webhook' | 'system'
  priority?: 'low' | 'normal' | 'medium' | 'high'
  message?: string
}

class WhatsAppEventStreamer {
  private static instance: WhatsAppEventStreamer
  private clients: Map<string, ReadableStreamDefaultController> = new Map()
  private eventQueue: WhatsAppEvent[] = []
  public connectionAttempts: Map<string, { count: number, lastAttempt: number }> = new Map()
  public userConnections: Map<string, Set<string>> = new Map() // userId -> Set of clientIds
  public userRateLimits: Map<string, { count: number, lastAttempt: number }> = new Map() // userId rate limits

  static getInstance() {
    if (!this.instance) {
      this.instance = new WhatsAppEventStreamer()
    }
    return this.instance
  }

  addClient(clientId: string, controller: ReadableStreamDefaultController, userId?: string) {
    // Check if client already exists to prevent duplicates
    if (this.clients.has(clientId)) {
      console.log(`⚠️ Client ${clientId} already exists, removing old connection`)
      this.removeClient(clientId)
    }
    
    this.clients.set(clientId, controller)
    
    // Track user connections for rate limiting
    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set())
      }
      this.userConnections.get(userId)!.add(clientId)
      console.log(`👥 Added client for user ${userId} (${this.userConnections.get(userId)!.size} connections)`)
    } else {
      console.log(`👥 Added client (${this.clients.size} total)`)
    }
    
    // Send any queued events to new client
    this.eventQueue.forEach(event => {
      this.sendToClient(clientId, event)
    })
  }

  removeClient(clientId: string) {
    const controller = this.clients.get(clientId)
    if (controller) {
      try {
        controller.close()
      } catch (e) {
        // Controller might already be closed
      }
    }
    this.clients.delete(clientId)
    
    // Clean up user connections
    for (const [userId, clientIds] of this.userConnections.entries()) {
      if (clientIds.has(clientId)) {
        clientIds.delete(clientId)
        if (clientIds.size === 0) {
          this.userConnections.delete(userId)
        }
        console.log(`🔌 Removed client for user ${userId} (${clientIds.size} remaining)`)
        break
      }
    }
  }

  private sendToClient(clientId: string, event: WhatsAppEvent) {
    const controller = this.clients.get(clientId)
    if (controller) {
      try {
        // Add timestamp and client info to event for better debugging
        const enhancedEvent = {
          ...event,
          clientId,
          serverTime: new Date().toISOString()
        }
        const eventData = `data: ${JSON.stringify(enhancedEvent)}\n\n`
        controller.enqueue(new TextEncoder().encode(eventData))
      } catch (error) {
        console.log(`🔌 Client ${clientId} disconnected, cleaning up`)
        this.removeClient(clientId)
      }
    }
  }

  broadcast(event: WhatsAppEvent) {
    // Add to queue for new clients (keep last 5 events to reduce memory)
    this.eventQueue.push(event)
    if (this.eventQueue.length > 5) {
      this.eventQueue.shift()
    }

    // Send to all connected clients with error handling
    const clientIds = Array.from(this.clients.keys())
    for (const clientId of clientIds) {
      this.sendToClient(clientId, event)
    }
    
    // Log successful broadcast for webhook integration debugging
    if (event.type !== 'stats-update') {
      console.log(`📡 Broadcast ${event.type} to ${clientIds.length} clients`)
    }
  }

  // Public methods to send specific events - optimized for webhook integration
  sendQueueUpdate(queueData: any) {
    // Queue updates should be frequent but not spam notifications
    this.broadcast({
      type: 'queue-update',
      data: queueData,
      timestamp: new Date().toISOString(),
      priority: 'normal'
    })
  }

  sendMessageSent(messageData: any) {
    // Message sent events are high priority for user feedback
    this.broadcast({
      type: 'message-sent', 
      data: messageData,
      timestamp: new Date().toISOString(),
      priority: 'high'
    })
  }

  sendDeviceStatus(deviceData: any) {
    // Device status changes are important but shouldn't overwhelm
    this.broadcast({
      type: 'device-status',
      data: deviceData,
      timestamp: new Date().toISOString(),
      priority: 'medium'
    })
  }

  sendStatsUpdate(statsData: any) {
    // Stats updates are low priority background data
    this.broadcast({
      type: 'stats-update',
      data: statsData,
      timestamp: new Date().toISOString(),
      priority: 'low'
    })
  }
  
  // New method for webhook-triggered events
  sendWebhookEvent(eventType: string, webhookData: any) {
    this.broadcast({
      type: eventType as any,
      data: webhookData,
      timestamp: new Date().toISOString(),
      source: 'webhook',
      priority: 'high'
    })
  }

  // Check if user is rate limited
  checkUserRateLimit(userId: string): { allowed: boolean, message?: string } {
    const now = Date.now()
    const userLimit = this.userRateLimits.get(userId)
    
    if (userLimit) {
      // Allow up to 8 connection attempts per user within 30 seconds
      if (userLimit.count > 8 && (now - userLimit.lastAttempt) < 30000) {
        return {
          allowed: false,
          message: `User rate limited: ${userLimit.count} attempts in last 30 seconds`
        }
      }
      
      if ((now - userLimit.lastAttempt) > 120000) {
        // Reset after 2 minutes
        this.userRateLimits.set(userId, { count: 1, lastAttempt: now })
      } else {
        this.userRateLimits.set(userId, { 
          count: userLimit.count + 1, 
          lastAttempt: now 
        })
      }
    } else {
      this.userRateLimits.set(userId, { count: 1, lastAttempt: now })
    }
    
    return { allowed: true }
  }
}

export async function GET(request: NextRequest) {
  // Get user session
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  const clientId = request.nextUrl.searchParams.get('clientId') || 
    `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // User-based rate limiting to prevent connection spam
  const streamer = WhatsAppEventStreamer.getInstance()
  const rateLimitCheck = streamer.checkUserRateLimit(userId)
  
  if (!rateLimitCheck.allowed) {
    console.log(`🚫 User rate limited: ${userId} - ${rateLimitCheck.message}`)
    return new Response('Rate limited - too many connection attempts', { status: 429 })
  }

  console.log(`🔗 SSE connection for user ${userId}`)

  let heartbeatInterval: NodeJS.Timeout | null = null
  let streamController: ReadableStreamDefaultController | null = null

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller
      
      // Send initial connection confirmation
      const connectionEvent = {
        type: 'connected',
        timestamp: new Date().toISOString(),
        clientId: clientId,
        message: 'SSE connection established'
      }
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(connectionEvent)}\n\n`))
      
      // Add client to streamer
      const streamer = WhatsAppEventStreamer.getInstance()
      streamer.addClient(clientId, controller, userId)
      
      // Send heartbeat every 5 seconds to keep connection alive
      heartbeatInterval = setInterval(() => {
        try {
          const heartbeatEvent = {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
            clientId: clientId
          }
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(heartbeatEvent)}\n\n`))
        } catch (error) {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval)
            heartbeatInterval = null
          }
          streamer.removeClient(clientId)
        }
      }, 5000)
    },
    cancel() {
      console.log(`🔌 SSE connection closed`)
      // Clean up heartbeat
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
      // Clean up when client disconnects
      const streamer = WhatsAppEventStreamer.getInstance()
      streamer.removeClient(clientId)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering for real-time
      'Transfer-Encoding': 'chunked'
    }
  })
}

// Export the streamer instance for use in other API routes
export { WhatsAppEventStreamer }