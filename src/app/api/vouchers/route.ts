import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'

const pool = new Pool(getDatabaseConfig())

// GET /api/vouchers - Get all vouchers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to read vouchers
    if (!(await checkCurrentUserPermission('vouchers.read'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

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
    const params: any[] = []
    let paramCount = 0

    // Add search filter
    if (search) {
      paramCount++
      query += ` AND (code ILIKE $${paramCount} OR description ILIKE $${paramCount})`
      params.push(`%${search}%`)
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
      params.push(type)
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    params.push(limit, offset)

    const vouchersResult = await pool.query(query, params)
    const vouchers = vouchersResult.rows

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM vouchers WHERE 1=1'
    const countParams: any[] = []
    let countParamCount = 0

    if (search) {
      countParamCount++
      countQuery += ` AND (code ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`
      countParams.push(`%${search}%`)
    }

    if (status) {
      if (status === 'Active') {
        countQuery += ` AND is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`
      } else if (status === 'Expired') {
        countQuery += ` AND expires_at < CURRENT_TIMESTAMP`
      } else if (status === 'Paused') {
        countQuery += ` AND is_active = false`
      }
    }

    if (type) {
      countParamCount++
      countQuery += ` AND type = $${countParamCount}`
      countParams.push(type)
    }

    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].total)

    // Get summary statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_vouchers,
        COUNT(CASE WHEN is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) THEN 1 END) as active_vouchers,
        SUM(usage_count) as total_usage,
        SUM(CASE WHEN type = 'credit' THEN value * usage_count ELSE 0 END) as credit_value_used
      FROM vouchers
    `)
    const stats = statsResult.rows[0]

    return NextResponse.json({
      vouchers: vouchers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalVouchers: parseInt(stats.total_vouchers),
        activeVouchers: parseInt(stats.active_vouchers),
        totalUsage: parseInt(stats.total_usage || 0),
        creditValueUsed: parseFloat(stats.credit_value_used || 0)
      }
    })
  } catch (error) {
    console.error('Vouchers GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/vouchers - Create new voucher
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create vouchers
    if (!(await checkCurrentUserPermission('vouchers.create'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      code,
      description,
      type,
      value,
      usage_limit,
      expires_at,
      package_id,
      min_purchase_amount,
      max_discount_amount
    } = body

    if (!code || !type || !value) {
      return NextResponse.json({
        error: 'Missing required fields: code, type, value'
      }, { status: 400 })
    }

    // Validate type
    if (!['credit', 'messages', 'percentage', 'package'].includes(type)) {
      return NextResponse.json({
        error: 'Invalid voucher type. Must be: credit, messages, percentage, or package'
      }, { status: 400 })
    }

    // Validate numeric fields
    if (value <= 0) {
      return NextResponse.json({ error: 'Value must be greater than 0' }, { status: 400 })
    }

    if (usage_limit && usage_limit <= 0) {
      return NextResponse.json({ error: 'Usage limit must be greater than 0' }, { status: 400 })
    }

    // Check if code already exists
    const existingVoucher = await pool.query(
      'SELECT id FROM vouchers WHERE code = $1',
      [code.toUpperCase()]
    )

    if (existingVoucher.rows.length > 0) {
      return NextResponse.json({
        error: 'Voucher code already exists'
      }, { status: 409 })
    }

    // Create voucher
    const result = await pool.query(`
      INSERT INTO vouchers (
        code, description, type, value, usage_limit, expires_at,
        package_id, min_purchase_amount, max_discount_amount, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      code.toUpperCase(),
      description || null,
      type,
      value,
      usage_limit || null,
      expires_at ? new Date(expires_at) : null,
      package_id || null,
      min_purchase_amount || null,
      max_discount_amount || null,
      session.user.name || session.user.email
    ])

    return NextResponse.json({
      message: 'Voucher created successfully',
      voucher: result.rows[0]
    }, { status: 201 })

  } catch (error) {
    console.error('Vouchers POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/vouchers - Update voucher
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update vouchers
    if (!(await checkCurrentUserPermission('vouchers.update'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      id,
      code,
      description,
      type,
      value,
      usage_limit,
      is_active,
      expires_at,
      package_id,
      min_purchase_amount,
      max_discount_amount
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Voucher ID is required' }, { status: 400 })
    }

    // Check if voucher exists
    const existingVoucher = await pool.query('SELECT * FROM vouchers WHERE id = $1', [id])
    if (existingVoucher.rows.length === 0) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    }

    // Prepare update fields
    const updates: string[] = []
    const params: any[] = []
    let paramCount = 0

    if (code !== undefined) {
      paramCount++
      updates.push(`code = $${paramCount}`)
      params.push(code.toUpperCase())
    }

    if (description !== undefined) {
      paramCount++
      updates.push(`description = $${paramCount}`)
      params.push(description)
    }

    if (type !== undefined) {
      if (!['credit', 'messages', 'percentage', 'package'].includes(type)) {
        return NextResponse.json({
          error: 'Invalid voucher type. Must be: credit, messages, percentage, or package'
        }, { status: 400 })
      }
      paramCount++
      updates.push(`type = $${paramCount}`)
      params.push(type)
    }

    if (value !== undefined) {
      if (value <= 0) {
        return NextResponse.json({ error: 'Value must be greater than 0' }, { status: 400 })
      }
      paramCount++
      updates.push(`value = $${paramCount}`)
      params.push(value)
    }

    if (usage_limit !== undefined) {
      paramCount++
      updates.push(`usage_limit = $${paramCount}`)
      params.push(usage_limit)
    }

    if (is_active !== undefined) {
      paramCount++
      updates.push(`is_active = $${paramCount}`)
      params.push(is_active)
    }

    if (expires_at !== undefined) {
      paramCount++
      updates.push(`expires_at = $${paramCount}`)
      params.push(expires_at ? new Date(expires_at) : null)
    }

    if (package_id !== undefined) {
      paramCount++
      updates.push(`package_id = $${paramCount}`)
      params.push(package_id)
    }

    if (min_purchase_amount !== undefined) {
      paramCount++
      updates.push(`min_purchase_amount = $${paramCount}`)
      params.push(min_purchase_amount)
    }

    if (max_discount_amount !== undefined) {
      paramCount++
      updates.push(`max_discount_amount = $${paramCount}`)
      params.push(max_discount_amount)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Add updated timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    paramCount++
    params.push(id)

    const query = `
      UPDATE vouchers 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await pool.query(query, params)

    return NextResponse.json({
      message: 'Voucher updated successfully',
      voucher: result.rows[0]
    })

  } catch (error) {
    console.error('Vouchers PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/vouchers - Delete voucher
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete vouchers
    if (!(await checkCurrentUserPermission('vouchers.delete'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Voucher ID is required' }, { status: 400 })
    }

    // Check if voucher exists
    const existingVoucher = await pool.query('SELECT * FROM vouchers WHERE id = $1', [id])
    if (existingVoucher.rows.length === 0) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 })
    }

    // Check if voucher has been used
    const usageCheck = await pool.query('SELECT COUNT(*) as count FROM voucher_usage WHERE voucher_id = $1', [id])
    const hasUsage = parseInt(usageCheck.rows[0].count) > 0

    if (hasUsage) {
      // Soft delete (deactivate) if voucher has usage history
      await pool.query(
        'UPDATE vouchers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      )
      return NextResponse.json({
        message: 'Voucher deactivated (has usage history)'
      })
    } else {
      // Hard delete if no usage history
      await pool.query('DELETE FROM vouchers WHERE id = $1', [id])
      return NextResponse.json({
        message: 'Voucher deleted successfully'
      })
    }

  } catch (error) {
    console.error('Vouchers DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}