import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NotificationPreferences } from '@/types/notifications'

// In-memory storage for demo (use database in production)
const userPreferences = new Map<string, NotificationPreferences>()

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enableDesktop: true,
  enableSound: true,
  enableInApp: true,
  categories: {
    user: true,
    transaction: true,
    server: true,
    system: true,
    security: true,
    subscription: true,
    whatsapp: true
  },
  priority: {
    low: false,
    medium: true,
    high: true,
    critical: true
  }
}

/**
 * @swagger
 * /api/admin/notifications/preferences:
 *   get:
 *     tags:
 *       - Admin Notifications
 *     summary: Get notification preferences
 *     description: Retrieve notification preferences for the admin user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved
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

    const preferences = userPreferences.get(session.user.email) || DEFAULT_PREFERENCES

    return NextResponse.json(preferences)

  } catch (error) {
    console.error('Get notification preferences API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve notification preferences' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/admin/notifications/preferences:
 *   put:
 *     tags:
 *       - Admin Notifications
 *     summary: Update notification preferences
 *     description: Update notification preferences for the admin user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enableDesktop:
 *                 type: boolean
 *               enableSound:
 *                 type: boolean
 *               enableInApp:
 *                 type: boolean
 *               categories:
 *                 type: object
 *               priority:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notification preferences updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
export async function PUT(request: NextRequest) {
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
    const currentPreferences = userPreferences.get(session.user.email) || DEFAULT_PREFERENCES
    const updatedPreferences = { ...currentPreferences, ...body }

    userPreferences.set(session.user.email, updatedPreferences)

    console.log(`🔧 Updated notification preferences for admin: ${session.user.email}`)

    return NextResponse.json({
      preferences: updatedPreferences,
      success: true
    })

  } catch (error) {
    console.error('Update notification preferences API error:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}