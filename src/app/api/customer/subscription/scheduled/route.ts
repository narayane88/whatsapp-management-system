import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getImpersonationContext, hasCustomerAccess } from '@/lib/impersonation'
import { cancelScheduledSubscription, activateScheduledSubscriptions } from '@/lib/scheduled-subscription-activator'

// POST - Cancel a scheduled subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get impersonation context
    const impersonation = await getImpersonationContext(request)
    
    if (!hasCustomerAccess(session, impersonation.isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!impersonation.targetUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = impersonation.targetUserId
    const body = await request.json()
    const { action, subscriptionId } = body

    if (!action || !subscriptionId) {
      return NextResponse.json({ 
        error: 'Missing required fields: action, subscriptionId' 
      }, { status: 400 })
    }

    if (action === 'cancel') {
      const cancelledSubscription = await cancelScheduledSubscription(subscriptionId, userId)
      
      return NextResponse.json({
        subscription: cancelledSubscription,
        message: 'Scheduled subscription cancelled successfully'
      })
      
    } else if (action === 'activate_all') {
      // Manual activation of all due subscriptions (admin function)
      if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
      
      const results = await activateScheduledSubscriptions()
      
      return NextResponse.json({
        results,
        message: `Activated ${results.activated} scheduled subscriptions`
      })
      
    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "cancel" or "activate_all"' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Scheduled subscription API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}