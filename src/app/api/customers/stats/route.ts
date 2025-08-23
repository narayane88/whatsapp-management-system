import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      console.log('❌ [CUSTOMERS-STATS] Authentication failed: No session or user')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session or user found' : undefined
      }, { status: 401 })
    }

    // Get current user level and access configuration for filtering
    const currentUserResult = await pool.query(`
      SELECT 
        u.id as user_id, 
        u.email, 
        r.level, 
        r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u."isActive" = true
    `, [session.user.email])

    if (!currentUserResult.rows.length) {
      return NextResponse.json({ error: 'User not found or no role assigned' }, { status: 404 })
    }

    const currentUser = currentUserResult.rows[0]
    const currentUserId = currentUser.user_id
    const currentUserLevel = currentUser.level
    const accessType = 'filtered' // Default access type since column doesn't exist

    // Get customer statistics with permission filtering
    let statsQuery = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN u."isActive" = true THEN 1 END) as active_customers,
        COUNT(CASE WHEN u."parentId" IS NOT NULL THEN 1 END) as customers_with_dealers,
        COUNT(CASE WHEN cp."packageId" IS NOT NULL THEN 1 END) as customers_with_packages,
        COUNT(CASE WHEN cp."packageId" IS NOT NULL AND cp."endDate" < NOW() THEN 1 END) as customers_with_expired_packages,
        COALESCE(SUM(u.biz_points), 0) as total_customer_balance
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN customer_packages cp ON u.id::text = cp."userId" AND cp."isActive" = true
      WHERE r.name = 'CUSTOMER'
    `
    
    // Apply hierarchical permission filtering
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - No filtering, see all customers
      console.log('👑 Level 1 (SUPER USER) - Full customer stats access')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Configurable access based on Level 1 grant
      if (accessType === 'full') {
        console.log('🔐 Level 2 (ADMIN) - Full customer stats access granted by Level 1')
      } else {
        console.log('🔒 Level 2 (ADMIN) - Filtered customer stats: assigned customers only')
        statsQuery += ` AND u."parentId" = ${currentUserId}`
      }
    } else if (currentUserLevel === 3) {
      // Level 3 (SUBDEALER) - Only their assigned customers
      console.log('🔒 Level 3 (SUBDEALER) - Filtered customer stats: assigned customers only')
      statsQuery += ` AND u."parentId" = ${currentUserId}`
    } else {
      // Level 4+ - Very restricted access
      console.log('🔒 Level 4+ - Restricted customer stats access')
      statsQuery += ` AND u.id = ${currentUserId}` // Only themselves if they are a customer
    }

    const result = await pool.query(statsQuery)
    const row = result.rows[0]

    const stats = {
      totalCustomers: parseInt(row.total_customers) || 0,
      activeCustomers: parseInt(row.active_customers) || 0,
      customersWithDealers: parseInt(row.customers_with_dealers) || 0,
      customersWithPackages: parseInt(row.customers_with_packages) || 0,
      customersWithExpiredPackages: parseInt(row.customers_with_expired_packages) || 0,
      totalCustomerBalance: parseFloat(row.total_customer_balance) || 0,
    }

    return NextResponse.json({ 
      success: true, 
      stats 
    })

  } catch (error) {
    console.error('Customer stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}