import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import bcrypt from 'bcryptjs'

const pool = new Pool(getDatabaseConfig())

// GET /api/customers - Get all customers with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ [CUSTOMERS-GET] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    const hasPermission = await checkCurrentUserPermission('customers.read')
    if (!hasPermission) {
      console.log(`❌ [CUSTOMERS-GET] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [CUSTOMERS-GET] Required permission: customers.read`)
      console.log(`📝 [CUSTOMERS-GET] Check user role and permissions in the database`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'customers.read',
          userEmail: session.user.email,
          message: 'User does not have the required permission to read customers'
        } : undefined
      }, { status: 403 })
    }

    // Get current user level, ID and access configuration for filtering
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
    const accessType = 'filtered' // Default access type since column doesn't exist

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const dealerFilter = searchParams.get('dealer') || ''
    const statusFilter = searchParams.get('status') || ''
    const packageFilter = searchParams.get('package') || ''
    const expiryFilter = searchParams.get('expiry') || '' // 'expired', 'expiring_soon', 'active'
    const expiryDays = parseInt(searchParams.get('expiry_days') || '30')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build main customers query
    let query = `
      SELECT 
        u.id, u.name, u.email, u.phone, u.mobile, u."isActive",
        u."parentId", u.dealer_code, u.customer_status, u.created_at,
        COALESCE(u.biz_points, 0) as account_balance, u.message_balance, u.last_login,
        u.registration_source, u.last_package_purchase,
        u.language, u.address, u.notes,
        dealer.name as dealer_name,
        dealer.dealer_code as dealer_dealer_code,
        r.name as role,
        -- Get current active package info (most recent package only)
        cp."packageId" as package_id, cp."endDate" as package_expiry,
        p.name as package_name, p.price as package_price,
        CASE 
          WHEN cp."endDate" IS NULL AND cp."packageId" IS NULL THEN 'No Package'
          WHEN cp."endDate" < CURRENT_TIMESTAMP THEN 'Expired'
          WHEN cp."endDate" < CURRENT_TIMESTAMP + INTERVAL '${expiryDays} days' THEN 'Expiring Soon'
          ELSE 'Active'
        END as package_status
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN users dealer ON u."parentId" = dealer.id
      LEFT JOIN LATERAL (
        SELECT cp1."packageId", cp1."endDate", cp1."createdAt"
        FROM customer_packages cp1
        WHERE cp1."userId" = u.id::text AND cp1."isActive" = true
          AND (cp1."endDate" IS NULL OR cp1."endDate" > CURRENT_TIMESTAMP - INTERVAL '1 month')
        ORDER BY cp1."createdAt" DESC
        LIMIT 1
      ) cp ON true
      LEFT JOIN packages p ON cp."packageId" = p.id
      WHERE r.name = 'CUSTOMER'
    `

    // Apply hierarchical permission filtering
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - No filtering, see all customers
      console.log('👑 Level 1 (SUPER USER) - Full customer access')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Full access, no filtering
      console.log('🔐 Level 2 (ADMIN) - Full customer access')
    } else if (currentUserLevel === 3) {
      // Level 3 (SUBDEALER) - Only their assigned customers
      console.log('🔒 Level 3 (SUBDEALER) - Filtered customer access: assigned customers only')
      query += ` AND u."parentId" = ${currentUserId}`
    } else {
      // Level 4+ (EMPLOYEE, CUSTOMER) - Very restricted access
      console.log('🔒 Level 4+ - Restricted customer access')
      query += ` AND u.id = ${currentUserId}` // Only themselves if they are a customer
    }
    
    const queryParams: any[] = []
    let paramCount = 0

    // Add search filter
    if (search) {
      paramCount++
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.phone ILIKE $${paramCount} OR u.mobile ILIKE $${paramCount})`
      queryParams.push(`%${search}%`)
    }

    // Add dealer filter
    if (dealerFilter) {
      if (dealerFilter === 'no_dealer') {
        query += ` AND u."parentId" IS NULL`
      } else {
        paramCount++
        query += ` AND u."parentId" = $${paramCount}`
        queryParams.push(parseInt(dealerFilter))
      }
    }

    // Add status filter
    if (statusFilter) {
      if (statusFilter === 'active') {
        query += ` AND u."isActive" = true`
      } else if (statusFilter === 'inactive') {
        query += ` AND u."isActive" = false`
      }
    }

    // Add package filter
    if (packageFilter) {
      paramCount++
      query += ` AND cp."packageId" = $${paramCount}`
      queryParams.push(packageFilter)
    }

    // Add expiry filter
    if (expiryFilter) {
      if (expiryFilter === 'expired') {
        query += ` AND cp."endDate" < CURRENT_TIMESTAMP`
      } else if (expiryFilter === 'expiring_soon') {
        query += ` AND cp."endDate" BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '${expiryDays} days'`
      } else if (expiryFilter === 'active') {
        query += ` AND (cp."endDate" IS NULL OR cp."endDate" > CURRENT_TIMESTAMP + INTERVAL '${expiryDays} days')`
      } else if (expiryFilter === 'no_package') {
        query += ` AND cp."packageId" IS NULL`
      }
    }

    // Add pagination
    query += ` ORDER BY u.created_at DESC`
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

    // Execute main query
    const customersResult = await pool.query(query, queryParams)

    // Get stats with same permission filtering
    let statsQuery = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN u."isActive" = true THEN 1 END) as active_customers,
        COUNT(CASE WHEN u."parentId" IS NOT NULL THEN 1 END) as customers_with_dealers,
        COUNT(CASE WHEN cp."packageId" IS NOT NULL THEN 1 END) as customers_with_packages,
        COUNT(CASE WHEN cp."endDate" < CURRENT_TIMESTAMP THEN 1 END) as customers_with_expired_packages,
        COALESCE(SUM(u.biz_points), 0) as total_customer_balance
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN customer_packages cp ON u.id::text = cp."userId" AND cp."isActive" = true
      WHERE r.name = 'CUSTOMER'
    `
    
    // Apply same hierarchical permission filtering to stats
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - No filtering
      console.log('👑 Level 1 (SUPER USER) - Full customer stats')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Full access, no filtering
      console.log('🔐 Level 2 (ADMIN) - Full customer stats')
    } else if (currentUserLevel === 3) {
      // Level 3 (SUBDEALER) - Only assigned customers
      console.log('🔒 Level 3 (SUBDEALER) - Filtered customer stats')
      statsQuery += ` AND u."parentId" = ${currentUserId}`
    } else {
      // Level 4+ - Very restricted
      console.log('🔒 Level 4+ - Restricted customer stats')
      statsQuery += ` AND u.id = ${currentUserId}`
    }
    
    const statsResult = await pool.query(statsQuery)
    const statsData = statsResult.rows[0]

    // Get count for pagination with same permission filtering
    let countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN users dealer ON u."parentId" = dealer.id
      LEFT JOIN customer_packages cp ON u.id::text = cp."userId" AND cp."isActive" = true
      WHERE r.name = 'CUSTOMER'
    `
    
    // Apply same hierarchical permission filtering to count query
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - No filtering
      console.log('👑 Level 1 (SUPER USER) - Full customer count')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Full access, no filtering
      console.log('🔐 Level 2 (ADMIN) - Full customer count')
    } else if (currentUserLevel === 3) {
      // Level 3 (SUBDEALER) - Only assigned customers
      console.log('🔒 Level 3 (SUBDEALER) - Filtered customer count')
      countQuery += ` AND u."parentId" = ${currentUserId}`
    } else {
      // Level 4+ - Very restricted
      console.log('🔒 Level 4+ - Restricted customer count')
      countQuery += ` AND u.id = ${currentUserId}`
    }
    
    // Apply same filters to count query
    let countParams: any[] = []
    let countParamCount = 0
    
    if (search) {
      countParamCount++
      countQuery += ` AND (u.name ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount} OR u.phone ILIKE $${countParamCount} OR u.mobile ILIKE $${countParamCount})`
      countParams.push(`%${search}%`)
    }
    
    if (dealerFilter) {
      if (dealerFilter === 'no_dealer') {
        countQuery += ` AND u."parentId" IS NULL`
      } else {
        countParamCount++
        countQuery += ` AND u."parentId" = $${countParamCount}`
        countParams.push(parseInt(dealerFilter))
      }
    }
    
    const countResult = await pool.query(countQuery, countParams)
    const totalCount = parseInt(countResult.rows[0].total)

    return NextResponse.json({
      customers: customersResult.rows,
      stats: {
        totalCustomers: parseInt(statsData.total_customers),
        activeCustomers: parseInt(statsData.active_customers),
        customersWithDealers: parseInt(statsData.customers_with_dealers),
        customersWithPackages: parseInt(statsData.customers_with_packages),
        customersWithExpiredPackages: parseInt(statsData.customers_with_expired_packages),
        totalCustomerBalance: parseFloat(statsData.total_customer_balance)
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Customers API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ [CUSTOMERS-POST] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    const hasPermission = await checkCurrentUserPermission('customers.create')
    if (!hasPermission) {
      console.log(`❌ [CUSTOMERS-POST] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [CUSTOMERS-POST] Required permission: customers.create`)
      console.log(`📝 [CUSTOMERS-POST] Check user role and permissions in the database`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'customers.create',
          userEmail: session.user.email,
          message: 'User does not have the required permission to create customers'
        } : undefined
      }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, email, password, phone, mobile, address, notes,
      dealerId, packageId, registrationSource, language 
    } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: 'Name, email, and password are required' 
      }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Email already exists' 
      }, { status: 409 })
    }

    // Get current user info to set as creator
    const currentUserResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    )
    const createdBy = currentUserResult.rows[0]?.id

    // If dealer is creating customer, auto-set dealer ID and generate dealer code
    let finalDealerId = dealerId
    let dealerInfo = null
    if (!finalDealerId && session.user) {
      const sessionUserResult = await pool.query(`
        SELECT u.id, u.dealer_code, u.name, r.name as role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = $1
      `, [session.user.email])
      
      if (sessionUserResult.rows.length > 0) {
        const sessionUser = sessionUserResult.rows[0]
        // Normalize role name to handle database variations like 'Shree Delaler'
        const normalizedRole = sessionUser.role?.toUpperCase().replace(/\s+/g, '')
        if (['SUBDEALER', 'DEALER', 'SHREEDELALER', 'DELALER'].includes(normalizedRole)) {
          finalDealerId = sessionUser.id
          dealerInfo = {
            id: sessionUser.id,
            dealer_code: sessionUser.dealer_code,
            name: sessionUser.name,
            role: sessionUser.role
          }
        }
      }
    } else if (finalDealerId) {
      // Get dealer info for provided dealer ID
      const dealerResult = await pool.query(`
        SELECT u.id, u.dealer_code, u.name, r.name as role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = $1
      `, [finalDealerId])
      
      if (dealerResult.rows.length > 0) {
        dealerInfo = {
          id: dealerResult.rows[0].id,
          dealer_code: dealerResult.rows[0].dealer_code,
          name: dealerResult.rows[0].name,
          role: dealerResult.rows[0].role
        }
      }
    }

    // Check existing dealer codes to understand the pattern and length
    if (finalDealerId) {
      const existingDealerCodesResult = await pool.query(`
        SELECT dealer_code, name, LENGTH(dealer_code) as code_length
        FROM users 
        WHERE dealer_code IS NOT NULL AND dealer_code != '' 
        ORDER BY dealer_code 
        LIMIT 10
      `)
      console.log('🔍 Existing dealer codes:', existingDealerCodesResult.rows)
    }

    // Generate customer dealer code if dealer is assigned
    let customerDealerCode = null
    if (finalDealerId && dealerInfo?.dealer_code) {
      console.log('🏷️ Dealer info for customer code generation:', {
        dealerId: finalDealerId,
        dealerCode: dealerInfo.dealer_code,
        dealerCodeLength: dealerInfo.dealer_code.length,
        dealerName: dealerInfo.name
      })

      // Get next customer number for this dealer
      const customerCountResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u."parentId" = $1 AND r.name = 'CUSTOMER'
      `, [finalDealerId])
      
      const customerCount = parseInt(customerCountResult.rows[0].count) + 1
      const customerNumber = customerCount.toString().padStart(4, '0')
      
      // Generate customer dealer code with length validation
      const proposedCode = `${dealerInfo.dealer_code}-C-${customerNumber}`
      
      if (proposedCode.length > 20) {
        // If too long, use a shorter format: first 10 chars of dealer code + C + customer number
        const shortDealerCode = dealerInfo.dealer_code.substring(0, 10)
        customerDealerCode = `${shortDealerCode}C${customerNumber}`
        console.log('⚠️ Dealer code too long, using shortened format:', {
          original: proposedCode,
          originalLength: proposedCode.length,
          shortened: customerDealerCode,
          shortenedLength: customerDealerCode.length
        })
      } else {
        customerDealerCode = proposedCode
        console.log('✅ Customer dealer code generated:', {
          code: customerDealerCode,
          length: customerDealerCode.length
        })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Begin transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Create user with auto-generated dealer code
      const userResult = await client.query(`
        INSERT INTO users (
          name, email, password, phone, mobile, address, notes,
          "parentId", dealer_code, registration_source, customer_status, "isActive", 
          language
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        name, email, hashedPassword, phone, mobile, address, notes,
        finalDealerId, customerDealerCode, registrationSource || 'admin_created', 'active', true,
        language || 'en'
      ])

      const userId = userResult.rows[0].id

      // Assign customer role
      const customerRoleResult = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        ['CUSTOMER']
      )

      if (customerRoleResult.rows.length > 0) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id, is_primary)
          VALUES ($1, $2, true)
        `, [userId, customerRoleResult.rows[0].id])
      }

      // Assign package if provided
      if (packageId) {
        await client.query(`
          INSERT INTO customer_packages (
            "userId", "packageId", "isActive", "createdBy"
          )
          VALUES ($1, $2, true, $3)
        `, [userId, packageId, createdBy])
      }

      await client.query('COMMIT')

      // Log auto-assignment for debugging
      if (finalDealerId && !dealerId) {
        console.log(`✅ AUTO-ASSIGNED: Customer "${name}" automatically assigned to dealer "${dealerInfo?.name}" (${dealerInfo?.dealer_code})`)
        console.log(`✅ GENERATED CODE: Customer dealer code generated: ${customerDealerCode}`)
      }

      return NextResponse.json({ 
        message: 'Customer created successfully',
        customer: {
          id: userId,
          name,
          email,
          dealerId: finalDealerId,
          dealerCode: customerDealerCode,
          autoAssigned: !dealerId && finalDealerId ? true : false
        },
        dealerInfo: dealerInfo ? {
          name: dealerInfo.name,
          dealer_code: dealerInfo.dealer_code,
          role: dealerInfo.role
        } : null
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json({ 
      error: 'Failed to create customer',
      details: error.message 
    }, { status: 500 })
  }
}

// PUT /api/customers - Update customer
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ [CUSTOMERS-PUT] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    const hasPermission = await checkCurrentUserPermission('customers.update')
    if (!hasPermission) {
      console.log(`❌ [CUSTOMERS-PUT] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [CUSTOMERS-PUT] Required permission: customers.update`)
      console.log(`📝 [CUSTOMERS-PUT] Check user role and permissions in the database`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'customers.update',
          userEmail: session.user.email,
          message: 'User does not have the required permission to update customers'
        } : undefined
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('id')
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { 
      name, email, phone, mobile, address, notes,
      isActive, customerStatus, packageId, language
    } = body

    // Update customer
    const updateResult = await pool.query(`
      UPDATE users 
      SET name = $1, email = $2, phone = $3, mobile = $4, address = $5,
          notes = $6, "isActive" = $7, customer_status = $8,
          language = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING id, name, email
    `, [
      name, email, phone, mobile, address, notes,
      isActive, customerStatus, language || 'en', customerId
    ])

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Customer updated successfully',
      customer: updateResult.rows[0]
    })

  } catch (error) {
    console.error('Update customer error:', error)
    return NextResponse.json({ 
      error: 'Failed to update customer',
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE /api/customers - Delete customer
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ [CUSTOMERS-DELETE] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    const hasPermission = await checkCurrentUserPermission('customers.delete')
    if (!hasPermission) {
      console.log(`❌ [CUSTOMERS-DELETE] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [CUSTOMERS-DELETE] Required permission: customers.delete`)
      console.log(`📝 [CUSTOMERS-DELETE] Check user role and permissions in the database`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'customers.delete',
          userEmail: session.user.email,
          message: 'User does not have the required permission to delete customers'
        } : undefined
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('id')
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // Check if customer has any transactions or important data
    const customerCheck = await pool.query(`
      SELECT u.name, u.email,
        COUNT(cp.id) as package_count,
        u.account_balance
      FROM users u
      LEFT JOIN customer_packages cp ON u.id::text = cp."userId"
      WHERE u.id = $1
      GROUP BY u.id, u.name, u.email, u.account_balance
    `, [customerId])

    if (customerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const customer = customerCheck.rows[0]

    // Instead of hard delete, deactivate customer if they have important data
    if (customer.package_count > 0 || parseFloat(customer.account_balance) > 0) {
      await pool.query(`
        UPDATE users 
        SET "isActive" = false, customer_status = 'deleted',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [customerId])

      return NextResponse.json({ 
        message: 'Customer deactivated (has transaction history)',
        action: 'deactivated'
      })
    } else {
      // Hard delete if no important data
      await pool.query('DELETE FROM users WHERE id = $1', [customerId])
      
      return NextResponse.json({ 
        message: 'Customer deleted successfully',
        action: 'deleted'
      })
    }

  } catch (error) {
    console.error('Delete customer error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete customer',
      details: error.message 
    }, { status: 500 })
  }
}