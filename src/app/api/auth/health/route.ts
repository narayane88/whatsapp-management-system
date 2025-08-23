import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET() {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version')
    
    // Test if users table exists and get count
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users')
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].db_version,
      userCount: parseInt(userCount.rows[0].count),
      message: 'Database connection successful'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown database error',
      message: 'Database connection failed'
    }, { status: 500 })
  }
}