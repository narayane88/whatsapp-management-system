import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { generateDealerCode } from '@/utils/dealerCode'

const pool = new Pool(getDatabaseConfig())


// GET /api/users - Get all users with their roles and permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to read users
    if (!(await checkCurrentUserPermission('users.read'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get current user level and ID for filtering
    const currentUserResult = await pool.query(`
      SELECT u.id as user_id, u.email, r.level, r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE LOWER(u.email) = LOWER($1) AND ur.is_primary = true
      LIMIT 1
    `, [session.user.email])

    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'Current user role not found' }, { status: 404 })
    }

    const currentUserId = currentUserResult.rows[0].user_id
    const currentUserLevel = currentUserResult.rows[0].level

    const { searchParams } = new URL(request.url)
    const includeRoles = searchParams.get('include_roles') === 'true'
    const includePermissions = searchParams.get('include_permissions') === 'true'
    const isActive = searchParams.get('is_active')
    const level = searchParams.get('level') // Filter by role level
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build query with level-based filtering
    let query = `
      SELECT u.id, u.name, u.email, u."isActive", u."parentId", u.created_at, u.updated_at, 
             u.last_login, u.phone, u.address, u.dealer_code, u.notes, u.language, u.commission_rate,
             parent.name as parent_name
      FROM users u
      LEFT JOIN users parent ON u."parentId" = parent.id
      ${level ? 'LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true LEFT JOIN roles r ON ur.role_id = r.id' : ''}
      WHERE 1=1
    `

    // Apply level-based filtering for Level 3 users (SUBDEALER) - only show their assigned customers
    if (currentUserLevel === 3) {
      query += ` AND u."parentId" = ${currentUserId}`
    }
    // For levels 1-2 (OWNER, ADMIN), show all users
    // For level 4+ (EMPLOYEE, CUSTOMER), they would be handled by permissions
    const params: any[] = []
    let paramCount = 0

    if (isActive !== null) {
      paramCount++
      query += ` AND u."isActive" = $${paramCount}`
      params.push(isActive === 'true')
    }

    if (level) {
      paramCount++
      query += ` AND r.level = $${paramCount}`
      params.push(parseInt(level))
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    params.push(limit, offset)

    const usersResult = await pool.query(query, params)
    const users = usersResult.rows

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM users u ${level ? 'LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true LEFT JOIN roles r ON ur.role_id = r.id' : ''} WHERE 1=1`
    const countParams: any[] = []
    let countParamCount = 0

    if (isActive !== null) {
      countParamCount++
      countQuery += ` AND u."isActive" = $${countParamCount}`
      countParams.push(isActive === 'true')
    }

    if (level) {
      countParamCount++
      countQuery += ` AND r.level = $${countParamCount}`
      countParams.push(parseInt(level))
    }

    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].total)

    // Get roles and permissions for each user if requested
    if (includeRoles || includePermissions) {
      for (const user of users) {
        if (includeRoles) {
          const rolesResult = await pool.query(`
            SELECT r.id, r.name, r.description, r.level, ur.is_primary
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1
            ORDER BY ur.is_primary DESC, r.level
          `, [user.id])
          
          user.roles = rolesResult.rows
          user.primary_role = rolesResult.rows.find(role => role.is_primary) || rolesResult.rows[0]
        }

        if (includePermissions) {
          const permissionsResult = await pool.query(`
            SELECT 
              p.name as permission_name,
              p.category as permission_category,
              'direct' as permission_source,
              up.granted
            FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = $1 AND up.granted = true
            ORDER BY p.category, p.name
          `, [user.id])
          
          user.permissions = permissionsResult.rows
        }
      }
    }

    return NextResponse.json({
      users: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create users
    if (!(await checkCurrentUserPermission('users.create'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get current user's role level and dealer info for hierarchical validation
    const currentUserResult = await pool.query(`
      SELECT u.id as user_id, u.dealer_code, r.level, r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE LOWER(u.email) = LOWER($1) AND ur.is_primary = true
      LIMIT 1
    `, [session.user.email])

    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'Current user role not found' }, { status: 404 })
    }

    const currentUserId = currentUserResult.rows[0].user_id
    const currentUserLevel = currentUserResult.rows[0].level
    const currentUserRoleName = currentUserResult.rows[0].role_name
    const currentUserDealerCode = currentUserResult.rows[0].dealer_code

    const body = await request.json()
    const { 
      name, 
      email, 
      password, 
      parentId, 
      phone, 
      address, 
      dealer_code, 
      notes,
      language = 'en',
      roles = [],
      permissions = [],
      commissionRate = 0
    } = body

    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, email, password' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Handle dealer code assignment and parent relationship
    let finalDealerCode = dealer_code
    let finalParentId = parentId
    
    // Check if roles being assigned are level 5+ (customers)
    const roleCheckResult = await pool.query(
      'SELECT id, name, level FROM roles WHERE id = ANY($1)',
      [roles]
    )
    
    const hasLevel5PlusRole = roleCheckResult.rows.some(role => role.level >= 5)
    
    // If dealer (level 3-4) is creating level 5+ users, auto-assign dealer code and parent relationship
    if ((currentUserLevel === 3 || currentUserLevel === 4) && hasLevel5PlusRole) {
      // Set the dealer's code as the customer's dealer reference
      if (currentUserDealerCode) {
        finalDealerCode = currentUserDealerCode
      }
      // Set current user as parent (dealer relationship)
      finalParentId = currentUserId
    }
    // Generate dealer code if not provided and user has dealer role (for actual dealers)
    else if (!finalDealerCode && roles.length > 0) {
      // Check if any of the roles are dealer roles
      const dealerRoleResult = await pool.query(
        'SELECT name FROM roles WHERE id = ANY($1) AND (LOWER(name) LIKE \'%dealer%\' OR LOWER(name) LIKE \'%subdeal%\')',
        [roles]
      )
      
      if (dealerRoleResult.rows.length > 0) {
        let isUnique = false
        let tempId = Math.floor(Math.random() * 1000) // Temporary ID for code generation
        while (!isUnique) {
          finalDealerCode = generateDealerCode(name, tempId)
          const existingCode = await pool.query(
            'SELECT id FROM users WHERE dealer_code = $1',
            [finalDealerCode]
          )
          isUnique = existingCode.rows.length === 0
          tempId++
        }
      }
    }

    // Validate role assignment permissions based on hierarchy
    if (roles.length > 0) {
      for (const role of roleCheckResult.rows) {
        // Apply hierarchical permission rules based on specific level restrictions
        if (currentUserLevel === 1) {
          // Level 1 (OWNER) can create Level 1-6 users (ALL)
          if (role.level < 1 || role.level > 6) {
            return NextResponse.json({ 
              error: `As ${currentUserRoleName}, you cannot assign the role: ${role.name}. Invalid role level.` 
            }, { status: 403 })
          }
        } else if (currentUserLevel === 2) {
          // Level 2 (ADMIN) can create Level 3-6 users
          if (role.level < 3 || role.level > 6) {
            return NextResponse.json({ 
              error: `As ${currentUserRoleName}, you cannot assign the role: ${role.name}. You can only create Level 3-6 users (Subdealers, Employees, Customers).` 
            }, { status: 403 })
          }
        } else if (currentUserLevel === 3 || currentUserLevel === 4) {
          // Level 3 (SUBDEALER) and Level 4 (EMPLOYEE) can create Level 5-6 users only
          if (role.level < 5 || role.level > 6) {
            return NextResponse.json({ 
              error: `As ${currentUserRoleName}, you cannot assign the role: ${role.name}. You can only create Level 5-6 users (Customers and custom roles).` 
            }, { status: 403 })
          }
        } else {
          // Level 5+ (CUSTOMER) and below cannot create users
          return NextResponse.json({ 
            error: `As ${currentUserRoleName}, you do not have permission to create user accounts.` 
          }, { status: 403 })
        }
      }
    }

    // Start transaction
    await pool.query('BEGIN')

    try {
      // Create the user
      const userResult = await pool.query(`
        INSERT INTO users (name, email, password, "parentId", phone, address, dealer_code, notes, language, commission_rate, "isActive")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        RETURNING id, name, email, "isActive", "parentId", created_at, phone, address, dealer_code, notes, language, commission_rate
      `, [name, email, hashedPassword, finalParentId || null, phone, address, finalDealerCode, notes, language, commissionRate])

      const newUser = userResult.rows[0]

      // Assign roles to the user
      if (roles.length > 0) {
        for (let i = 0; i < roles.length; i++) {
          const roleId = roles[i]
          const isPrimary = i === 0 // First role is primary
          
          await pool.query(`
            INSERT INTO user_roles (user_id, role_id, is_primary)
            VALUES ($1, $2, $3)
          `, [newUser.id, roleId, isPrimary])
        }
      }

      // Assign direct permissions to the user
      if (permissions.length > 0) {
        for (const permission of permissions) {
          await pool.query(`
            INSERT INTO user_permissions (user_id, permission_id, granted, reason)
            VALUES ($1, $2, $3, $4)
          `, [newUser.id, permission.permission_id, permission.granted, permission.reason || 'Direct assignment'])
        }
      }

      await pool.query('COMMIT')

      // Remove password from response
      delete newUser.password

      return NextResponse.json({
        message: 'User created successfully',
        user: newUser
      }, { status: 201 })

    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/users - Update user
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update users
    if (!(await checkCurrentUserPermission('users.update'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      id, 
      name, 
      email, 
      password, 
      parentId, 
      phone, 
      address, 
      notes, 
      isActive,
      roles,
      permissions,
      commissionRate
    } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    )

    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Start transaction
    await pool.query('BEGIN')

    try {
      // Prepare update fields
      const updates: string[] = []
      const params: any[] = []
      let paramCount = 0

      if (name !== undefined) {
        paramCount++
        updates.push(`name = $${paramCount}`)
        params.push(name)
      }

      if (email !== undefined) {
        paramCount++
        updates.push(`email = $${paramCount}`)
        params.push(email)
      }

      if (password !== undefined && password) {
        const hashedPassword = await bcrypt.hash(password, 12)
        paramCount++
        updates.push(`password = $${paramCount}`)
        params.push(hashedPassword)
      }

      if (parentId !== undefined) {
        paramCount++
        updates.push(`"parentId" = $${paramCount}`)
        params.push(parentId)
      }

      if (phone !== undefined) {
        paramCount++
        updates.push(`phone = $${paramCount}`)
        params.push(phone)
      }

      if (address !== undefined) {
        paramCount++
        updates.push(`address = $${paramCount}`)
        params.push(address)
      }

      if (notes !== undefined) {
        paramCount++
        updates.push(`notes = $${paramCount}`)
        params.push(notes)
      }

      if (isActive !== undefined) {
        paramCount++
        updates.push(`"isActive" = $${paramCount}`)
        params.push(isActive)
      }

      if (commissionRate !== undefined) {
        paramCount++
        updates.push(`commission_rate = $${paramCount}`)
        params.push(commissionRate)
      }

      // Update user if there are changes
      if (updates.length > 0) {
        paramCount++
        updates.push(`updated_at = CURRENT_TIMESTAMP`)
        params.push(id)

        const query = `
          UPDATE users 
          SET ${updates.join(', ')}
          WHERE id = $${paramCount}
          RETURNING id, name, email, "isActive", "parentId", created_at, updated_at, 
                    last_login, phone, address, dealer_code, notes, commission_rate
        `

        const result = await pool.query(query, params)
      }

      // Update roles if provided
      if (roles && Array.isArray(roles)) {
        // Remove existing roles
        await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id])

        // Add new roles
        if (roles.length > 0) {
          for (let i = 0; i < roles.length; i++) {
            const roleId = roles[i]
            const isPrimary = i === 0 // First role is primary
            
            await pool.query(`
              INSERT INTO user_roles (user_id, role_id, is_primary)
              VALUES ($1, $2, $3)
            `, [id, roleId, isPrimary])
          }
        }
      }

      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        // Get current permissions to avoid unnecessary deletions
        const currentPermissions = await pool.query(
          'SELECT permission_id FROM user_permissions WHERE user_id = $1', 
          [id]
        )
        const currentPermissionIds = currentPermissions.rows.map(p => p.permission_id)
        const newPermissionIds = permissions.map(p => p.permission_id)

        // Only delete permissions that are not in the new list
        const permissionsToDelete = currentPermissionIds.filter(pid => !newPermissionIds.includes(pid))
        if (permissionsToDelete.length > 0) {
          await pool.query(
            'DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = ANY($2)', 
            [id, permissionsToDelete]
          )
        }

        // Add or update permissions
        if (permissions.length > 0) {
          for (const permission of permissions) {
            // Check if permission already exists
            const existingPerm = await pool.query(
              'SELECT id FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
              [id, permission.permission_id]
            )

            if (existingPerm.rows.length > 0) {
              // Update existing permission
              await pool.query(`
                UPDATE user_permissions 
                SET granted = $3, reason = $4, assigned_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND permission_id = $2
              `, [id, permission.permission_id, permission.granted, permission.reason || 'Direct assignment'])
            } else {
              // Insert new permission
              await pool.query(`
                INSERT INTO user_permissions (user_id, permission_id, granted, reason)
                VALUES ($1, $2, $3, $4)
              `, [id, permission.permission_id, permission.granted, permission.reason || 'Direct assignment'])
            }
          }
        }
      }

      await pool.query('COMMIT')

      // Get updated user
      const updatedUser = await pool.query(
        'SELECT id, name, email, "isActive", "parentId", created_at, updated_at, last_login, phone, address, dealer_code, notes, commission_rate FROM users WHERE id = $1',
        [id]
      )

      return NextResponse.json({
        message: 'User updated successfully',
        user: updatedUser.rows[0]
      })

    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users - Delete user (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete users
    if (!(await checkCurrentUserPermission('users.delete'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const permanent = searchParams.get('permanent') === 'true'

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    )

    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deletion of own account
    const currentUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [session.user.email]
    )

    if (currentUser.rows[0]?.id === parseInt(id)) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 409 })
    }

    if (permanent) {
      // Permanent deletion (hard delete)
      await pool.query('DELETE FROM users WHERE id = $1', [id])
      return NextResponse.json({
        message: 'User permanently deleted'
      })
    } else {
      // Soft delete (deactivate)
      await pool.query(
        'UPDATE users SET "isActive" = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      )
      return NextResponse.json({
        message: 'User deactivated successfully'
      })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}