import { NextRequest, NextResponse } from 'next/server'
import { runDailyMaintenance } from '@/lib/cron/daily-maintenance'

// Verify cron authorization
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'your-secure-cron-secret'
  
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

// POST - Run daily maintenance tasks (cron job endpoint)
export async function POST(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Cron job triggered: Daily maintenance')
    const result = await runDailyMaintenance()
    
    if (result.success) {
      return NextResponse.json({
        message: 'Daily maintenance completed successfully',
        data: result.results,
        executionTime: result.executionTime,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        error: 'Daily maintenance failed',
        details: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in daily maintenance cron job:', error)
    return NextResponse.json({ 
      error: 'Daily maintenance cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET - Get maintenance status and logs
export async function GET(request: NextRequest) {
  try {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Read system stats if available
    const fs = require('fs/promises')
    const path = require('path')
    
    try {
      const statsFile = path.join(process.cwd(), 'config', 'system-stats.json')
      const statsData = await fs.readFile(statsFile, 'utf8')
      const stats = JSON.parse(statsData)
      
      return NextResponse.json({
        message: 'System maintenance status',
        lastMaintenanceRun: stats.last_updated,
        systemStats: stats,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return NextResponse.json({
        message: 'No maintenance data available',
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Error getting maintenance status:', error)
    return NextResponse.json({ 
      error: 'Failed to get maintenance status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}