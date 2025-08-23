import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// DEBUG ONLY: GET /api/customers-debug - Get customers without auth (for testing)
export async function GET(request: NextRequest) {
  try {
    console.log('🐛 DEBUG: Customers API called without authentication checks')
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const dealerFilter = searchParams.get('dealer') || ''
    const statusFilter = searchParams.get('status') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    // Simple customers query for testing
    let query = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.mobile, u."isActive",
        u."parentId", u.dealer_code, u.customer_status, u.created_at,
        u.account_balance, u.message_balance, u.last_login,
        dealer.name as dealer_name,
        r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN users dealer ON u."parentId" = dealer.id
      WHERE r.name = 'CUSTOMER'
    `
    
    const queryParams: any[] = []
    let paramCount = 0

    if (search) {
      paramCount++
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`
      queryParams.push(`%${search}%`)
    }

    if (statusFilter === 'active') {
      query += ` AND u."isActive" = true`
    } else if (statusFilter === 'inactive') {
      query += ` AND u."isActive" = false`
    }

    query += ` ORDER BY u.created_at DESC LIMIT ${limit}`

    console.log('🔍 DEBUG: Executing query:', query)
    console.log('📝 DEBUG: Query params:', queryParams)

    const result = await pool.query(query, queryParams)
    
    console.log('📊 DEBUG: Found', result.rows.length, 'customers')

    // Get basic stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN u."isActive" = true THEN 1 END) as active_customers,
        COUNT(CASE WHEN u."parentId" IS NOT NULL THEN 1 END) as customers_with_dealers
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'CUSTOMER'
    `
    
    const statsResult = await pool.query(statsQuery)
    const statsData = statsResult.rows[0]

    const response = {
      customers: result.rows,
      stats: {
        totalCustomers: parseInt(statsData.total_customers),
        activeCustomers: parseInt(statsData.active_customers),
        customersWithDealers: parseInt(statsData.customers_with_dealers)
      },
      debug: {
        query,
        params: queryParams,
        searchParams: Object.fromEntries(searchParams.entries())
      }
    }

    console.log('✅ DEBUG: Returning response with', response.customers.length, 'customers')
    
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