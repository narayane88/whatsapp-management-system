import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import bcrypt from 'bcryptjs'

const pool = new Pool(getDatabaseConfig())

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log('❌ [USERS-GET] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    const hasPermission = await checkCurrentUserPermission('users.page.access')
    if (!hasPermission) {
      console.log(`❌ [USERS-GET] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [USERS-GET] Required permission: users.page.access`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'users.page.access',
          userEmail: session.user.email,
          message: 'User does not have the required permission to access users data'
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit

    // Build users query with hierarchical permission filtering
    let baseQuery = `
      SELECT u.id, u.name, u.email, u."isActive", u.mobile, u.created_at as "createdAt", u."parentId"
      FROM users u
      WHERE u."isActive" = true`

    let searchCondition = ''
    if (search) {
      searchCondition = ` AND (LOWER(u.name) LIKE LOWER($2) OR LOWER(u.email) LIKE LOWER($2))`
    }

    // Apply hierarchical permission filtering
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - No filtering, see all users
      console.log('👑 Level 1 (SUPER USER) - Full user access')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Configurable access based on Level 1 grant
      if (accessType === 'full') {
        console.log('🔐 Level 2 (ADMIN) - Full user access granted by Level 1')
      } else {
        console.log('🔒 Level 2 (ADMIN) - Filtered user access: self + assigned users only')
        baseQuery += ` AND (u.id = ${currentUserId} OR u."parentId" = ${currentUserId})`
      }
    } else if (currentUserLevel === 3) {
      // Level 3 (SUBDEALER) - Only their assigned customers + themselves
      console.log('🔒 Level 3 (SUBDEALER) - Filtered user access: self + assigned customers only')
      baseQuery += ` AND (u.id = ${currentUserId} OR u."parentId" = ${currentUserId})`
    } else {
      // Level 4+ (EMPLOYEE, CUSTOMER) - Very restricted access, only themselves
      console.log('🔒 Level 4+ - Restricted user access: self only')
      baseQuery += ` AND u.id = ${currentUserId}`
    }

    baseQuery += searchCondition
    baseQuery += ` ORDER BY u.name ASC LIMIT ${limit} OFFSET ${skip}`
    
    // Build count query with same permission filtering
    let countQuery = `
      SELECT COUNT(*)::integer as count FROM users u
      WHERE u."isActive" = true`

    // Apply same hierarchical permission filtering to count query
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - No filtering
      console.log('👑 Level 1 (SUPER USER) - Full user count')
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Configurable access
      if (accessType === 'full') {
        console.log('🔐 Level 2 (ADMIN) - Full user count granted by Level 1')
      } else {
        console.log('🔒 Level 2 (ADMIN) - Filtered user count')
        countQuery += ` AND (u.id = ${currentUserId} OR u."parentId" = ${currentUserId})`
      }
    } else if (currentUserLevel === 3) {
      // Level 3 (SUBDEALER) - Only assigned customers + themselves
      console.log('🔒 Level 3 (SUBDEALER) - Filtered user count')
      countQuery += ` AND (u.id = ${currentUserId} OR u."parentId" = ${currentUserId})`
    } else {
      // Level 4+ - Very restricted
      console.log('🔒 Level 4+ - Restricted user count')
      countQuery += ` AND u.id = ${currentUserId}`
    }

    countQuery += searchCondition

    let users, totalResult
    
    if (search) {
      const searchParam = `%${search}%`
      users = await pool.query(baseQuery, [searchParam])
      totalResult = await pool.query(countQuery, [searchParam])
    } else {
      users = await pool.query(baseQuery)
      totalResult = await pool.query(countQuery)
    }
    
    const total = totalResult.rows[0]?.count || 0

    return NextResponse.json({
      users: users.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['OWNER', 'SUBDEALER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, role, mobile, parentId, dealer_code, commissionRate } = body

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        mobile,
        parentId: parentId || session.user.id,
        dealer_code: dealer_code || null,
        commission_rate: commissionRate && commissionRate > 0 ? commissionRate / 100 : null, // Convert percentage to decimal
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mobile: true,
        createdAt: true
      }
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}