import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// DEBUG ONLY: GET /api/vouchers-debug - Get vouchers without auth (for testing)
export async function GET(request: NextRequest) {
  try {
    console.log('🐛 DEBUG: Vouchers API called without authentication checks')
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query with filters
    let query = `
      SELECT 
        id, code, description, type, value, usage_limit, usage_count,
        is_active, expires_at, created_by, created_at, updated_at,
        package_id, min_purchase_amount, max_discount_amount,
        CASE 
          WHEN expires_at < CURRENT_TIMESTAMP THEN 'Expired'
          WHEN is_active = false THEN 'Paused'
          ELSE 'Active'
        END as status
      FROM vouchers
      WHERE 1=1
    `
    
    const queryParams: any[] = []
    let paramCount = 0

    // Add search filter
    if (search) {
      paramCount++
      query += ` AND (code ILIKE $${paramCount} OR description ILIKE $${paramCount})`
      queryParams.push(`%${search}%`)
    }

    // Add status filter
    if (status) {
      if (status === 'Active') {
        query += ` AND is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`
      } else if (status === 'Expired') {
        query += ` AND expires_at < CURRENT_TIMESTAMP`
      } else if (status === 'Paused') {
        query += ` AND is_active = false`
      }
    }

    // Add type filter
    if (type) {
      paramCount++
      query += ` AND type = $${paramCount}`
      queryParams.push(type)
    }

    // Add pagination
    query += ` ORDER BY created_at DESC`
    if (limit > 0) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      queryParams.push(limit)
      
      if (offset > 0) {
        paramCount++
        query += ` OFFSET $${paramCount}`
        queryParams.push(offset)
      }
    }

    console.log('🔍 DEBUG: Executing query:', query)
    console.log('📝 DEBUG: Query params:', queryParams)

    // Execute main query
    const vouchersResult = await pool.query(query, queryParams)
    
    console.log('📊 DEBUG: Found', vouchersResult.rows.length, 'vouchers')

    // Get stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_vouchers,
        COUNT(CASE WHEN is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) THEN 1 END) as active_vouchers,
        COALESCE(SUM(usage_count), 0) as total_usage,
        COALESCE(SUM(CASE WHEN type = 'credit' THEN value * usage_count ELSE 0 END), 0) as credit_value_used
      FROM vouchers
    `
    
    const statsResult = await pool.query(statsQuery)
    const statsData = statsResult.rows[0]

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vouchers
      WHERE 1=1
      ${search ? `AND (code ILIKE '%${search}%' OR description ILIKE '%${search}%')` : ''}
      ${status === 'Active' ? `AND is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)` : ''}
      ${status === 'Expired' ? `AND expires_at < CURRENT_TIMESTAMP` : ''}
      ${status === 'Paused' ? `AND is_active = false` : ''}
      ${type ? `AND type = '${type}'` : ''}
    `
    
    const countResult = await pool.query(countQuery)
    const totalCount = parseInt(countResult.rows[0].total)

    const response = {
      vouchers: vouchersResult.rows,
      stats: {
        totalVouchers: parseInt(statsData.total_vouchers),
        activeVouchers: parseInt(statsData.active_vouchers),
        totalUsage: parseInt(statsData.total_usage),
        creditValueUsed: parseFloat(statsData.credit_value_used)
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      debug: {
        query,
        params: queryParams,
        searchParams: Object.fromEntries(searchParams.entries())
      }
    }

    console.log('✅ DEBUG: Returning response with', response.vouchers.length, 'vouchers')
    
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ DEBUG: API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}