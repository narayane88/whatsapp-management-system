import { NextRequest, NextResponse } from 'next/server'
import { monitorSubscriptions, getSubscriptionStats } from '@/lib/cron/subscription-monitor'

// Verify cron authorization
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'your-secure-cron-secret'
  
  // Check for Bearer token or cron secret in header
  if (authHeader === `Bearer ${cronSecret}` || 
      request.headers.get('x-cron-secret') === cronSecret) {
    return true
  }

  // Allow localhost for development
  const host = request.headers.get('host')
  if (process.env.NODE_ENV === 'development' && 
      (host?.includes('localhost') || host?.includes('127.0.0.1'))) {
    return true
  }

  return false
}

// GET - Get subscription monitoring statistics
export async function GET(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getSubscriptionStats()
    
    return NextResponse.json({
      message: 'Subscription monitoring statistics',
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting subscription stats:', error)
    return NextResponse.json({ 
      error: 'Failed to get subscription statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Run subscription monitoring (cron job endpoint)
export async function POST(request: NextRequest) {
  try {
    // Verify authorization for cron job
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Cron job triggered: Subscription monitoring')
    const startTime = Date.now()
    
    // Run subscription monitoring
    const result = await monitorSubscriptions()
    
    const executionTime = Date.now() - startTime
    
    if (result.success) {
      return NextResponse.json({
        message: 'Subscription monitoring completed successfully',
        data: {
          notificationsSent: result.notificationsSent,
          expiredCount: result.expiredCount,
          totalMonitored: result.totalMonitored,
          executionTimeMs: executionTime
        },
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        error: 'Subscription monitoring failed',
        details: result.error,
        executionTimeMs: executionTime,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in subscription monitoring cron job:', error)
    return NextResponse.json({ 
      error: 'Cron job execution failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// PUT - Manual trigger for testing (admin only)
export async function PUT(request: NextRequest) {
  try {
    // For manual triggers, we might want additional authentication
    const body = await request.json()
    const { adminKey } = body

    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Invalid admin key' }, { status: 403 })
    }

    console.log('Manual subscription monitoring triggered by admin')
    const result = await monitorSubscriptions()
    
    return NextResponse.json({
      message: 'Manual subscription monitoring completed',
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in manual subscription monitoring:', error)
    return NextResponse.json({ 
      error: 'Manual trigger failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}