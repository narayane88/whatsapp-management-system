import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'
import { AdminNotification, RealtimeEvent, SystemMetrics } from '@/types/notifications'

// In-memory storage for SSE connections
const connections = new Map<string, {
  controller: ReadableStreamDefaultController
  userId: number
  sessionId: string
  connectedAt: Date
  lastActivity: Date
}>()

// Broadcast to all connected admin users
export function broadcastToAdmins(event: RealtimeEvent) {
  const message = `data: ${JSON.stringify(event)}\n\n`
  
  connections.forEach((connection, connectionId) => {
    try {
      connection.controller.enqueue(new TextEncoder().encode(message))
      connection.lastActivity = new Date()
    } catch (error) {
      console.error(`Failed to send to connection ${connectionId}:`, error)
      connections.delete(connectionId)
    }
  })
  
  console.log(`📡 Broadcasted ${event.type} to ${connections.size} admin connection(s)`)
}

// Generate sample notifications for demonstration
function generateSampleNotifications(): AdminNotification[] {
  const categories = ['user', 'transaction', 'server', 'system', 'security', 'subscription', 'whatsapp'] as const
  const types = ['info', 'success', 'warning', 'error'] as const
  const priorities = ['low', 'medium', 'high', 'critical'] as const
  
  const samples = [
    {
      category: 'user' as const,
      type: 'info' as const,
      priority: 'medium' as const,
      title: 'New user registration',
      message: 'User john.doe@example.com has registered successfully'
    },
    {
      category: 'transaction' as const,
      type: 'success' as const,
      priority: 'medium' as const,
      title: 'Payment received',
      message: 'Payment of ₹1,299 received for Premium package'
    },
    {
      category: 'server' as const,
      type: 'warning' as const,
      priority: 'high' as const,
      title: 'High server load',
      message: 'Server CPU usage has exceeded 85% for the last 5 minutes'
    },
    {
      category: 'whatsapp' as const,
      type: 'info' as const,
      priority: 'low' as const,
      title: 'WhatsApp instance connected',
      message: 'Instance wa_instance_123 has successfully connected'
    },
    {
      category: 'security' as const,
      type: 'error' as const,
      priority: 'critical' as const,
      title: 'Failed login attempts',
      message: 'Multiple failed login attempts detected for admin account'
    },
    {
      category: 'subscription' as const,
      type: 'warning' as const,
      priority: 'medium' as const,
      title: 'Subscription expiring',
      message: 'Premium subscription for user123 expires in 3 days'
    }
  ]
  
  return samples.map(sample => ({
    id: uuidv4(),
    ...sample,
    timestamp: new Date(),
    read: false,
    actions: sample.priority === 'critical' ? [{
      id: uuidv4(),
      label: 'Investigate',
      type: 'primary' as const,
      action: 'investigate',
      payload: {}
    }] : undefined
  }))
}

// Generate sample system metrics
function generateSystemMetrics(): SystemMetrics {
  return {
    cpuUsage: Math.floor(Math.random() * 100),
    memoryUsage: Math.floor(Math.random() * 100),
    diskUsage: Math.floor(Math.random() * 100),
    networkTraffic: Math.floor(Math.random() * 1000),
    activeUsers: Math.floor(Math.random() * 50) + 1,
    serverUptime: Math.floor(Math.random() * 86400),
    lastUpdated: new Date()
  }
}

export async function GET(request: NextRequest) {
  console.log('🔌 Admin notification stream connection attempt')
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('❌ Unauthorized notification stream access')
      return new Response('Unauthorized', { status: 401 })
    }

    // Check if user is admin
    const userRole = session.user.role?.toUpperCase()
    if (!['OWNER', 'ADMIN'].includes(userRole || '')) {
      console.log('❌ Insufficient permissions for notification stream')
      return new Response('Forbidden', { status: 403 })
    }

    const connectionId = uuidv4()
    const sessionId = uuidv4()
    
    console.log(`✅ Creating notification stream for admin: ${session.user.email}`)

    const stream = new ReadableStream({
      start(controller) {
        // Store connection
        connections.set(connectionId, {
          controller,
          userId: parseInt(session.user.id || '0'),
          sessionId,
          connectedAt: new Date(),
          lastActivity: new Date()
        })

        console.log(`📡 Admin notification stream connected: ${connectionId} (${connections.size} total)`)

        // Send initial connection event
        const connectEvent: RealtimeEvent = {
          type: 'system_status',
          data: { 
            status: 'connected',
            connectionId,
            timestamp: new Date(),
            totalConnections: connections.size 
          },
          timestamp: new Date(),
          userId: session.user.id,
          sessionId
        }
        
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(connectEvent)}\n\n`))

        // Send initial metrics
        const metricsEvent: RealtimeEvent = {
          type: 'metrics',
          data: generateSystemMetrics(),
          timestamp: new Date()
        }
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(metricsEvent)}\n\n`))

        // Keep alive interval
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(': keepalive\n\n'))
          } catch {
            clearInterval(keepAlive)
            connections.delete(connectionId)
          }
        }, 30000)

        // Send periodic sample notifications for demonstration
        const notificationInterval = setInterval(() => {
          try {
            // Randomly send sample notifications
            if (Math.random() < 0.3) { // 30% chance every interval
              const sampleNotifications = generateSampleNotifications()
              const randomNotification = sampleNotifications[Math.floor(Math.random() * sampleNotifications.length)]
              
              const notificationEvent: RealtimeEvent = {
                type: 'notification',
                data: randomNotification,
                timestamp: new Date()
              }
              
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(notificationEvent)}\n\n`))
            }

            // Send updated metrics every minute
            const metricsEvent: RealtimeEvent = {
              type: 'metrics',
              data: generateSystemMetrics(),
              timestamp: new Date()
            }
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(metricsEvent)}\n\n`))
            
          } catch {
            clearInterval(notificationInterval)
            clearInterval(keepAlive)
            connections.delete(connectionId)
          }
        }, 60000) // Every minute

        // Cleanup on connection close
        request.signal.addEventListener('abort', () => {
          console.log(`📡 Admin notification stream disconnected: ${connectionId}`)
          clearInterval(keepAlive)
          clearInterval(notificationInterval)
          connections.delete(connectionId)
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('❌ Admin notification stream error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}