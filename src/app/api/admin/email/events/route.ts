import { NextRequest, NextResponse } from 'next/server'
import { getEmailSettings, triggerEmailEvent, EmailEvent, UserRole } from '@/lib/email-events'
import fs from 'fs/promises'
import path from 'path'

const EMAIL_SETTINGS_FILE = path.join(process.cwd(), 'config', 'email-settings.json')

// GET - Get email event configurations
export async function GET() {
  try {
    const settings = await getEmailSettings()
    return NextResponse.json({
      events: settings.events || {},
      availableEvents: [
        'user_created',
        'user_activated', 
        'user_deactivated',
        'whatsapp_connected',
        'whatsapp_disconnected',
        'package_purchased',
        'package_expired',
        'payment_successful',
        'payment_failed',
        'balance_low',
        'commission_earned',
        'payout_processed',
        'message_quota_exceeded',
        'account_suspended',
        'security_alert',
        'password_reset',
        'login_attempt',
        'system_maintenance'
      ] as EmailEvent[],
      availableRoles: ['admin', 'subdealer', 'customer', 'employee', 'owner'] as UserRole[]
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to load email event settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Update email event configurations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events } = body

    if (!events || typeof events !== 'object') {
      return NextResponse.json({ error: 'Invalid events configuration' }, { status: 400 })
    }

    // Load current settings
    const settings = await getEmailSettings()
    
    // Update events configuration
    settings.events = events

    // Save updated settings
    await fs.writeFile(EMAIL_SETTINGS_FILE, JSON.stringify(settings, null, 2))

    return NextResponse.json({ 
      message: 'Email event settings updated successfully',
      events: settings.events
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to update email event settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Test email event (trigger manually)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, user, data } = body

    if (!event || !user) {
      return NextResponse.json({ error: 'Event and user data required' }, { status: 400 })
    }

    const success = await triggerEmailEvent({
      user: {
        id: user.id || 'test-user',
        name: user.name || 'Test User',
        email: user.email,
        role: user.role || 'customer'
      },
      event: event as EmailEvent,
      data: data || {},
      timestamp: new Date()
    })

    if (success) {
      return NextResponse.json({ 
        message: 'Test email sent successfully',
        event,
        recipient: user.email
      })
    } else {
      return NextResponse.json({ 
        error: 'Failed to send test email'
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to trigger test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}