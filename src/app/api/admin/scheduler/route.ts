import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { subscriptionScheduler } from '@/lib/subscription-scheduler'
import { activateScheduledSubscriptions } from '@/lib/scheduled-subscription-activator'

// Import the scheduler to ensure it initializes
import '@/lib/subscription-scheduler'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await checkCurrentUserPermission('subscriptions.page.access')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const status = subscriptionScheduler.getStatus()
    return NextResponse.json({ 
      scheduler: status,
      message: status.isRunning ? 'Scheduler is running' : 'Scheduler is stopped'
    })

  } catch (error) {
    console.error('Scheduler status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await checkCurrentUserPermission('subscriptions.page.access')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'start':
        subscriptionScheduler.start()
        return NextResponse.json({ 
          message: 'Subscription scheduler started',
          scheduler: subscriptionScheduler.getStatus()
        })

      case 'stop':
        subscriptionScheduler.stop()
        return NextResponse.json({ 
          message: 'Subscription scheduler stopped',
          scheduler: subscriptionScheduler.getStatus()
        })

      case 'status':
        return NextResponse.json({ 
          scheduler: subscriptionScheduler.getStatus()
        })

      case 'activate_now':
        // Manual trigger for immediate activation
        const result = await activateScheduledSubscriptions()
        return NextResponse.json({
          message: `Manually activated ${result.activated} subscription(s)`,
          result,
          scheduler: subscriptionScheduler.getStatus()
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Scheduler control error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}