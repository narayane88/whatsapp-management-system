import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { activateScheduledSubscriptions, cancelScheduledSubscription } from '@/lib/scheduled-subscription-activator'

// POST - Admin actions for scheduled subscriptions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission
    const hasPermission = await checkCurrentUserPermission('subscriptions.page.access')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { action, subscriptionId, userId } = body

    if (!action) {
      return NextResponse.json({ 
        error: 'Missing required field: action' 
      }, { status: 400 })
    }

    switch (action) {
      case 'activate_all':
        // Activate all due scheduled subscriptions
        const activationResults = await activateScheduledSubscriptions()
        
        return NextResponse.json({
          results: activationResults,
          message: `Successfully activated ${activationResults.activated} scheduled subscriptions`
        })

      case 'cancel':
        // Cancel a specific scheduled subscription
        if (!subscriptionId || !userId) {
          return NextResponse.json({ 
            error: 'Missing required fields: subscriptionId, userId' 
          }, { status: 400 })
        }

        const cancelledSubscription = await cancelScheduledSubscription(subscriptionId, userId)
        
        return NextResponse.json({
          subscription: cancelledSubscription,
          message: 'Scheduled subscription cancelled successfully'
        })

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Supported actions: activate_all, cancel' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Admin scheduled subscription API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}