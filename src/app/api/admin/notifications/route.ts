import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'
import { AdminNotification } from '@/types/notifications'

// In-memory notification storage (in production, use database)
const notifications: AdminNotification[] = []

// Generate sample initial notifications
function generateInitialNotifications(): AdminNotification[] {
  const samples = [
    {
      id: uuidv4(),
      type: 'success' as const,
      title: 'System Status',
      message: 'All systems are operational and running smoothly',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      category: 'system' as const,
      priority: 'low' as const
    },
    {
      id: uuidv4(),
      type: 'info' as const,
      title: 'New User Registration',
      message: 'A new user has registered: customer@example.com',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      read: false,
      category: 'user' as const,
      priority: 'medium' as const
    },
    {
      id: uuidv4(),
      type: 'warning' as const,
      title: 'Server Load Alert',
      message: 'Server CPU usage is above 80%. Consider scaling resources.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: true,
      category: 'server' as const,
      priority: 'high' as const,
      actions: [
        {
          id: uuidv4(),
          label: 'View Metrics',
          type: 'primary',
          action: 'view_metrics',
          payload: { serverId: 'server-1' }
        }
      ]
    },
    {
      id: uuidv4(),
      type: 'success' as const,
      title: 'Payment Received',
      message: 'Payment of ₹2,999 received for Premium Annual subscription',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true,
      category: 'transaction' as const,
      priority: 'medium' as const
    },
    {
      id: uuidv4(),
      type: 'error' as const,
      title: 'Failed Login Attempts',
      message: 'Multiple failed login attempts detected from IP 192.168.1.100',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: false,
      category: 'security' as const,
      priority: 'critical' as const,
      actions: [
        {
          id: uuidv4(),
          label: 'Block IP',
          type: 'danger',
          action: 'block_ip',
          payload: { ip: '192.168.1.100' }
        },
        {
          id: uuidv4(),
          label: 'View Logs',
          type: 'secondary',
          action: 'view_logs',
          payload: { ip: '192.168.1.100' }
        }
      ]
    }
  ]
  
  return samples
}

// Initialize with sample data if empty
if (notifications.length === 0) {
  notifications.push(...generateInitialNotifications())
}

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     tags:
 *       - Admin Notifications
 *     summary: Get admin notifications
 *     description: Retrieve all notifications for the admin user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [user, transaction, server, system, security, subscription, whatsapp]
 *         description: Filter by notification category
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by notification priority
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of notifications to return
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                 stats:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const userRole = session.user.role?.toUpperCase()
    if (!['OWNER', 'ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const readFilter = searchParams.get('read')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Filter notifications
    let filtered = notifications

    if (category) {
      filtered = filtered.filter(n => n.category === category)
    }

    if (priority) {
      filtered = filtered.filter(n => n.priority === priority)
    }

    if (readFilter !== null) {
      const isRead = readFilter === 'true'
      filtered = filtered.filter(n => n.read === isRead)
    }

    // Sort by timestamp (newest first) and limit
    const result = filtered
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    // Calculate stats
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byCategory: notifications.reduce((acc, n) => {
        acc[n.category] = (acc[n.category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byPriority: notifications.reduce((acc, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recentActivity: notifications.filter(n => 
        new Date().getTime() - new Date(n.timestamp).getTime() < 5 * 60 * 1000
      ).length
    }

    console.log(`📊 Retrieved ${result.length} notifications for admin: ${session.user.email}`)

    return NextResponse.json({
      notifications: result,
      stats,
      success: true
    })

  } catch (error) {
    console.error('Admin notifications API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve notifications' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/admin/notifications:
 *   post:
 *     tags:
 *       - Admin Notifications
 *     summary: Create a new notification
 *     description: Create a new notification for admin users
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - message
 *               - category
 *               - priority
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [info, success, warning, error, system]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [user, transaction, server, system, security, subscription, whatsapp]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid notification data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const userRole = session.user.role?.toUpperCase()
    if (!['OWNER', 'ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { type, title, message, category, priority, actions, metadata, expiresAt, persistent } = body

    // Validate required fields
    if (!type || !title || !message || !category || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate enum values
    const validTypes = ['info', 'success', 'warning', 'error', 'system']
    const validCategories = ['user', 'transaction', 'server', 'system', 'security', 'subscription', 'whatsapp']
    const validPriorities = ['low', 'medium', 'high', 'critical']

    if (!validTypes.includes(type) || !validCategories.includes(category) || !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid enum values' }, { status: 400 })
    }

    const notification: AdminNotification = {
      id: uuidv4(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      category,
      priority,
      actions: actions || [],
      metadata: metadata || {},
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      persistent: persistent || false
    }

    // Add to notifications array
    notifications.unshift(notification)

    // Keep only the latest 1000 notifications
    if (notifications.length > 1000) {
      notifications.splice(1000)
    }

    console.log(`📬 Created new notification: ${notification.title} (${notification.priority})`)

    // Broadcast to all connected admin users via SSE
    // This would be imported from the stream route in a real implementation
    // broadcastToAdmins({ type: 'notification', data: notification, timestamp: new Date() })

    return NextResponse.json({
      notification,
      success: true
    }, { status: 201 })

  } catch (error) {
    console.error('Create notification API error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}