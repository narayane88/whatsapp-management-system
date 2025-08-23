import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// GET /api/dealer-customers - Get all dealer-customer relationships
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('dealers.customers.assign'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dealerId = searchParams.get('dealer_id')
    const customerId = searchParams.get('customer_id')
    const status = searchParams.get('status') || 'active'

    let query = `
      SELECT 
        dc.id,
        dc.dealer_id,
        dc.customer_id,
        d.name as dealer_name,
        c.name as customer_name,
        dc.commission_rate,
        dc.territory,
        dc.status,
        dc.assigned_at,
        dc.notes,
        u.name as assigned_by_name
      FROM dealer_customers dc
      JOIN users d ON dc.dealer_id = d.id
      JOIN users c ON dc.customer_id = c.id
      LEFT JOIN users u ON dc.assigned_by = u.id
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramIndex = 1

    if (dealerId) {
      query += ` AND dc.dealer_id = $${paramIndex}`
      params.push(parseInt(dealerId))
      paramIndex++
    }

    if (customerId) {
      query += ` AND dc.customer_id = $${paramIndex}`
      params.push(parseInt(customerId))
      paramIndex++
    }

    if (status) {
      query += ` AND dc.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY dc.assigned_at DESC`

    const result = await pool.query(query, params)

    return NextResponse.json({
      relationships: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/dealer-customers - Assign customers to dealer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('dealers.customers.assign'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { dealerId, customerIds, commissionRate, territory, notes } = body

    if (!dealerId || !customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: dealerId, customerIds' 
      }, { status: 400 })
    }

    // Get current user ID for assigned_by field
    const currentUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    )

    if (currentUser.rows.length === 0) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 401 })
    }

    const assignedBy = currentUser.rows[0].id
    const results = []
    
    // Begin transaction
    await pool.query('BEGIN')

    try {
      for (const customerId of customerIds) {
        // Check if relationship already exists
        const existingRelation = await pool.query(
          'SELECT id FROM dealer_customers WHERE dealer_id = $1 AND customer_id = $2',
          [dealerId, customerId]
        )

        if (existingRelation.rows.length > 0) {
          // Update existing relationship
          const result = await pool.query(`
            UPDATE dealer_customers 
            SET commission_rate = $1,
                territory = $2,
                notes = $3,
                status = 'active',
                assigned_at = NOW(),
                assigned_by = $4
            WHERE dealer_id = $5 AND customer_id = $6
            RETURNING *
          `, [commissionRate || 0, territory || '', notes || '', assignedBy, dealerId, customerId])
          
          results.push(result.rows[0])
        } else {
          // Create new relationship
          const result = await pool.query(`
            INSERT INTO dealer_customers (dealer_id, customer_id, commission_rate, territory, notes, assigned_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `, [dealerId, customerId, commissionRate || 0, territory || '', notes || '', assignedBy])
          
          results.push(result.rows[0])
        }
      }

      // Commit transaction
      await pool.query('COMMIT')

      return NextResponse.json({
        message: `Successfully assigned ${customerIds.length} customer(s) to dealer`,
        relationships: results
      })

    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/dealer-customers - Update dealer-customer relationship
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
    const { id, commissionRate, territory, status, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Relationship ID is required' }, { status: 400 })
    }

    const updateFields = []
    const values = []
    let paramIndex = 1

    if (commissionRate !== undefined) {
      updateFields.push(`commission_rate = $${paramIndex}`)
      values.push(commissionRate)
      paramIndex++
    }

    if (territory !== undefined) {
      updateFields.push(`territory = $${paramIndex}`)
      values.push(territory)
      paramIndex++
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`)
      values.push(notes)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(id)
    const query = `
      UPDATE dealer_customers 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Relationship updated successfully',
      relationship: result.rows[0]
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/dealer-customers - Remove dealer-customer relationship
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkCurrentUserPermission('dealers.customers.assign'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Relationship ID is required' }, { status: 400 })
    }

    const result = await pool.query(
      'DELETE FROM dealer_customers WHERE id = $1 RETURNING *',
      [parseInt(id)]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Relationship removed successfully',
      relationship: result.rows[0]
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}