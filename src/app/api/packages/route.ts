import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'

const pool = new Pool(getDatabaseConfig())

// GET /api/packages - Get all packages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to read packages
    if (!(await checkCurrentUserPermission('packages.read'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('is_active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query
    let query = `
      SELECT id, name, description, price, offer_price, offer_enabled, duration, "messageLimit", "instanceLimit", 
             features, "isActive", "createdAt", "updatedAt",
             mobile_accounts_limit, contact_limit, api_key_limit, 
             receive_msg_limit, webhook_limit, footmark_enabled, footmark_text, package_color
      FROM packages
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 0

    if (isActive !== null) {
      paramCount++
      query += ` AND "isActive" = $${paramCount}`
      params.push(isActive === 'true')
    }

    query += ` ORDER BY "createdAt" DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    params.push(limit, offset)

    const packagesResult = await pool.query(query, params)
    const packages = packagesResult.rows

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM packages WHERE 1=1'
    const countParams: any[] = []
    let countParamCount = 0

    if (isActive !== null) {
      countParamCount++
      countQuery += ` AND "isActive" = $${countParamCount}`
      countParams.push(isActive === 'true')
    }

    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].total)

    return NextResponse.json({
      packages: packages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Packages GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/packages - Create new package
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create packages
    if (!(await checkCurrentUserPermission('packages.create'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      price,
      offer_price,
      offer_enabled = false,
      duration,
      messageLimit,
      instanceLimit,
      features = {},
      isActive = true,
      mobile_accounts_limit = 1,
      contact_limit = 1000,
      api_key_limit = 1,
      receive_msg_limit = 1000,
      webhook_limit = 1,
      footmark_enabled = false,
      footmark_text = 'Sent by bizflash.in',
      package_color = 'blue'
    } = body

    if (!name || !price || !duration || !messageLimit || !instanceLimit) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, price, duration, messageLimit, instanceLimit' 
      }, { status: 400 })
    }

    // Validate numeric fields
    if (price < 0 || duration < 0 || messageLimit < 0 || instanceLimit < 0) {
      return NextResponse.json({ error: 'Numeric fields must be positive' }, { status: 400 })
    }

    // Generate package ID
    const packageId = Math.floor(Math.random() * 1000000).toString()

    const result = await pool.query(`
      INSERT INTO packages (
        id, name, description, price, offer_price, offer_enabled, duration, "messageLimit", "instanceLimit", 
        features, "isActive", "createdAt", "updatedAt",
        mobile_accounts_limit, contact_limit, api_key_limit, 
        receive_msg_limit, webhook_limit, footmark_enabled, footmark_text, package_color
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      packageId, name, description, price, offer_enabled ? offer_price : null, offer_enabled, duration, messageLimit, instanceLimit, 
      JSON.stringify(features), isActive, mobile_accounts_limit, contact_limit, 
      api_key_limit, receive_msg_limit, webhook_limit, footmark_enabled, footmark_text, package_color
    ])

    return NextResponse.json({
      message: 'Package created successfully',
      package: result.rows[0]
    }, { status: 201 })

  } catch (error) {
    console.error('Packages POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/packages - Update package
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update packages
    if (!(await checkCurrentUserPermission('packages.update'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      id, 
      name, 
      description, 
      price,
      offer_price,
      offer_enabled,
      duration,
      messageLimit,
      instanceLimit,
      features,
      isActive,
      mobile_accounts_limit,
      contact_limit,
      api_key_limit,
      receive_msg_limit,
      webhook_limit,
      footmark_enabled,
      footmark_text,
      package_color
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
    }

    // Check if package exists
    const existingPackage = await pool.query('SELECT * FROM packages WHERE id = $1', [id])
    if (existingPackage.rows.length === 0) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Prepare update fields
    const updates: string[] = []
    const params: any[] = []
    let paramCount = 0

    if (name !== undefined) {
      paramCount++
      updates.push(`name = $${paramCount}`)
      params.push(name)
    }

    if (description !== undefined) {
      paramCount++
      updates.push(`description = $${paramCount}`)
      params.push(description)
    }

    if (price !== undefined) {
      paramCount++
      updates.push(`price = $${paramCount}`)
      params.push(price)
    }

    if (offer_price !== undefined) {
      paramCount++
      updates.push(`offer_price = $${paramCount}`)
      params.push(offer_price)
    }

    if (offer_enabled !== undefined) {
      paramCount++
      updates.push(`offer_enabled = $${paramCount}`)
      params.push(offer_enabled)
    }

    if (duration !== undefined) {
      paramCount++
      updates.push(`duration = $${paramCount}`)
      params.push(duration)
    }

    if (messageLimit !== undefined) {
      paramCount++
      updates.push(`"messageLimit" = $${paramCount}`)
      params.push(messageLimit)
    }

    if (instanceLimit !== undefined) {
      paramCount++
      updates.push(`"instanceLimit" = $${paramCount}`)
      params.push(instanceLimit)
    }

    if (features !== undefined) {
      paramCount++
      updates.push(`features = $${paramCount}`)
      params.push(JSON.stringify(features))
    }

    if (isActive !== undefined) {
      paramCount++
      updates.push(`"isActive" = $${paramCount}`)
      params.push(isActive)
    }

    if (mobile_accounts_limit !== undefined) {
      paramCount++
      updates.push(`mobile_accounts_limit = $${paramCount}`)
      params.push(mobile_accounts_limit)
    }

    if (contact_limit !== undefined) {
      paramCount++
      updates.push(`contact_limit = $${paramCount}`)
      params.push(contact_limit)
    }

    if (api_key_limit !== undefined) {
      paramCount++
      updates.push(`api_key_limit = $${paramCount}`)
      params.push(api_key_limit)
    }

    if (receive_msg_limit !== undefined) {
      paramCount++
      updates.push(`receive_msg_limit = $${paramCount}`)
      params.push(receive_msg_limit)
    }

    if (webhook_limit !== undefined) {
      paramCount++
      updates.push(`webhook_limit = $${paramCount}`)
      params.push(webhook_limit)
    }

    if (footmark_enabled !== undefined) {
      paramCount++
      updates.push(`footmark_enabled = $${paramCount}`)
      params.push(footmark_enabled)
    }

    if (footmark_text !== undefined) {
      paramCount++
      updates.push(`footmark_text = $${paramCount}`)
      params.push(footmark_text)
    }

    if (package_color !== undefined) {
      paramCount++
      updates.push(`package_color = $${paramCount}`)
      params.push(package_color)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Add updated timestamp and package ID
    updates.push(`"updatedAt" = CURRENT_TIMESTAMP`)
    paramCount++
    params.push(id)

    const query = `
      UPDATE packages 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await pool.query(query, params)

    return NextResponse.json({
      message: 'Package updated successfully',
      package: result.rows[0]
    })

  } catch (error) {
    console.error('Packages PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/packages - Delete package (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete packages
    if (!(await checkCurrentUserPermission('packages.delete'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const permanent = searchParams.get('permanent') === 'true'

    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
    }

    // Check if package exists
    const existingPackage = await pool.query('SELECT * FROM packages WHERE id = $1', [id])
    if (existingPackage.rows.length === 0) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    // Check if package is in use by customers
    const inUse = await pool.query('SELECT COUNT(*) as count FROM customer_packages WHERE "packageId" = $1 AND "isActive" = true', [id])
    if (parseInt(inUse.rows[0].count) > 0) {
      return NextResponse.json({ error: 'Cannot delete package that is currently in use by customers' }, { status: 409 })
    }

    if (permanent) {
      // Permanent deletion (hard delete)
      await pool.query('DELETE FROM packages WHERE id = $1', [id])
      return NextResponse.json({
        message: 'Package permanently deleted'
      })
    } else {
      // Soft delete (deactivate)
      await pool.query(
        'UPDATE packages SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      )
      return NextResponse.json({
        message: 'Package deactivated successfully'
      })
    }
  } catch (error) {
    console.error('Packages DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}