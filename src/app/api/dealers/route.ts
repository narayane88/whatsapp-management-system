import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// GET /api/dealers - Get all dealers with their customer counts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('users.read'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeCustomers = searchParams.get('include_customers') === 'true'

    // Get all Level 3 (SUBDEALER) users as dealers
    const dealersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.dealer_code,
        u.dealer_type,
        u.dealer_commission,
        u.dealer_territory,
        u.dealer_status,
        u."isActive",
        r.name as role,
        COUNT(customers.id) as customer_count
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN users customers ON u.id = customers."parentId" AND customers."isActive" = true
      WHERE r.level = 3 AND u."isActive" = true
      GROUP BY u.id, r.name
      ORDER BY u.name
    `

    const result = await pool.query(dealersQuery)
    let dealers = result.rows

    // If including customers, fetch customer details for each dealer
    if (includeCustomers) {
      for (const dealer of dealers) {
        const customersResult = await pool.query(`
          SELECT 
            u.id,
            u.name,
            u.email,
            u.dealer_code,
            dc.assigned_at,
            dc.commission_rate,
            dc.territory,
            dc.status
          FROM dealer_customers dc
          JOIN users u ON dc.customer_id = u.id
          WHERE dc.dealer_id = $1 AND dc.status = 'active'
          ORDER BY u.name
        `, [dealer.id])
        
        dealer.customers = customersResult.rows
      }
    }

    return NextResponse.json({
      dealers,
      total: dealers.length
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/dealers - Create or update dealer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('users.update'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, dealerType, commission, territory, status } = body

    if (!userId || !dealerType) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, dealerType' 
      }, { status: 400 })
    }

    // Update user to be a dealer
    const result = await pool.query(`
      UPDATE users 
      SET dealer_type = $1,
          dealer_commission = $2,
          dealer_territory = $3,
          dealer_status = $4
      WHERE id = $5
      RETURNING *
    `, [dealerType, commission || 0, territory || '', status || 'active', userId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Dealer updated successfully',
      dealer: result.rows[0]
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/dealers - Update dealer information
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('dealers.commission.manage'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { id, commission, territory, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Dealer ID is required' }, { status: 400 })
    }

    const updateFields = []
    const values = []
    let paramIndex = 1

    if (commission !== undefined) {
      updateFields.push(`dealer_commission = $${paramIndex}`)
      values.push(commission)
      paramIndex++
    }

    if (territory !== undefined) {
      updateFields.push(`dealer_territory = $${paramIndex}`)
      values.push(territory)
      paramIndex++
    }

    if (status !== undefined) {
      updateFields.push(`dealer_status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(id)
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Dealer not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Dealer updated successfully',
      dealer: result.rows[0]
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}