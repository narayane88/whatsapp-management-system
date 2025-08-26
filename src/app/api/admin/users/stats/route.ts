import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await checkCurrentUserPermission('users.page.access')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get current user level for filtering
    const currentUserResult = await pool.query(`
      SELECT 
        u.id as user_id, 
        u.email, 
        r.level, 
        r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE LOWER(u.email) = LOWER($1) AND ur.is_primary = true
      LIMIT 1
    `, [session.user.email])

    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'Current user role not found' }, { status: 404 })
    }

    const currentUser = currentUserResult.rows[0]
    const currentUserId = currentUser.user_id
    const currentUserLevel = currentUser.level
    const accessType = 'filtered'

    // Build base filter condition
    let filterCondition = `WHERE u."isActive" IS NOT NULL`
    
    // Apply hierarchical permission filtering
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - No additional filtering
      console.log('👑 Level 1 (SUPER USER) - Full user stats access')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Configurable access
      if (accessType === 'full') {
        console.log('🔐 Level 2 (ADMIN) - Full user stats granted by Level 1')
      } else {
        console.log('🔒 Level 2 (ADMIN) - Filtered user stats')
        filterCondition += ` AND (u.id = ${currentUserId} OR u."parentId" = ${currentUserId})`
      }
    } else if (currentUserLevel === 3) {
      // Level 3 (SUBDEALER) - Only assigned customers + themselves
      console.log('🔒 Level 3 (SUBDEALER) - Filtered user stats')
      filterCondition += ` AND (u.id = ${currentUserId} OR u."parentId" = ${currentUserId})`
    } else {
      // Level 4+ - Very restricted
      console.log('🔒 Level 4+ - Restricted user stats')
      filterCondition += ` AND u.id = ${currentUserId}`
    }

    // Get user statistics with role information
    const statsQuery = `
      SELECT 
        COUNT(*)::integer as total,
        COUNT(CASE WHEN u."isActive" = true THEN 1 END)::integer as active,
        COUNT(CASE WHEN u."isActive" = false THEN 1 END)::integer as blocked,
        COUNT(CASE WHEN u."isActive" IS NULL THEN 1 END)::integer as pending,
        COUNT(CASE WHEN u.created_at >= NOW() - INTERVAL '30 days' THEN 1 END)::integer as new_this_month,
        COUNT(CASE WHEN ur.role_id IN (
          SELECT id FROM roles WHERE name IN ('OWNER', 'ADMIN', 'SUBDEALER', 'EMPLOYEE')
        ) THEN 1 END)::integer as staff_users,
        COUNT(CASE WHEN ur.role_id IN (
          SELECT id FROM roles WHERE name = 'CUSTOMER'
        ) THEN 1 END)::integer as customers
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      ${filterCondition}
    `

    const statsResult = await pool.query(statsQuery)
    const stats = statsResult.rows[0]

    // Get role distribution (simplified query)
    const roleDistributionQuery = `
      SELECT 
        r.name as role_name,
        r.level,
        COUNT(u.id)::integer as total_count,
        COUNT(CASE WHEN u."isActive" = true THEN u.id END)::integer as active_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_primary = true
      LEFT JOIN users u ON ur.user_id = u.id
      GROUP BY r.id, r.name, r.level
      ORDER BY r.level
    `

    const roleDistributionResult = await pool.query(roleDistributionQuery)

    // Get recent user activity (simplified)
    const recentActivityQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      ${filterCondition}
      ORDER BY u.created_at DESC
      LIMIT 5
    `

    const recentActivityResult = await pool.query(recentActivityQuery)

    return NextResponse.json({
      stats: {
        total: stats.total || 0,
        active: stats.active || 0,
        blocked: stats.blocked || 0,
        pending: stats.pending || 0,
        newThisMonth: stats.new_this_month || 0,
        staffUsers: stats.staff_users || 0,
        customers: stats.customers || 0
      },
      roleDistribution: roleDistributionResult.rows,
      recentActivity: recentActivityResult.rows
    })

  } catch (error) {
    console.error('User stats API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}