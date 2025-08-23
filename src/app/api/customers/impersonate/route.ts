import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import jwt from 'jsonwebtoken'

const pool = new Pool(getDatabaseConfig())

// POST /api/customers/impersonate - Impersonate customer for support purposes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to impersonate customers
    if (!(await checkCurrentUserPermission('customers.impersonate'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { customerId, duration = 3600 } = await request.json() // duration in seconds, default 1 hour

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // Get customer details
    const customerResult = await pool.query(`
      SELECT u.id, u.name, u.email, u."isActive",
             r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND r.name = 'CUSTOMER'
    `, [customerId])

    if (customerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!customerResult.rows[0].isActive) {
      return NextResponse.json({ error: 'Cannot impersonate inactive customer' }, { status: 400 })
    }

    const customer = customerResult.rows[0]

    // Log the impersonation for audit purposes
    await pool.query(`
      INSERT INTO user_audit_log (
        user_id, action, performed_by, details, ip_address
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      customerId,
      'impersonate_start',
      session.user.email,
      JSON.stringify({ 
        impersonated_customer: customer.email,
        duration: duration,
        reason: 'Customer support'
      }),
      request.headers.get('x-forwarded-for') || 'unknown'
    ])

    // Create impersonation token
    const impersonationToken = jwt.sign({
      originalUser: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      impersonatedUser: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        role: customer.role
      },
      impersonationStart: new Date().toISOString(),
      exp: Math.floor(Date.now() / 1000) + duration
    }, process.env.NEXTAUTH_SECRET || 'fallback-secret')

    return NextResponse.json({
      message: 'Impersonation session created',
      impersonationToken,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      },
      expiresIn: duration,
      redirectUrl: '/customer/dashboard'
    })

  } catch (error) {
    console.error('Impersonate customer error:', error)
    return NextResponse.json({ 
      error: 'Failed to create impersonation session',
      details: error.message 
    }, { status: 500 })
  }
}

// DELETE /api/customers/impersonate - End impersonation session
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { impersonationToken } = await request.json()

    if (!impersonationToken) {
      return NextResponse.json({ error: 'Impersonation token is required' }, { status: 400 })
    }

    try {
      const decoded = jwt.verify(impersonationToken, process.env.NEXTAUTH_SECRET || 'fallback-secret') as any

      // Log the end of impersonation
      await pool.query(`
        INSERT INTO user_audit_log (
          user_id, action, performed_by, details, ip_address
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        decoded.impersonatedUser.id,
        'impersonate_end',
        decoded.originalUser.email,
        JSON.stringify({
          impersonated_customer: decoded.impersonatedUser.email,
          duration_used: Math.floor((Date.now() - new Date(decoded.impersonationStart).getTime()) / 1000)
        }),
        request.headers.get('x-forwarded-for') || 'unknown'
      ])

      return NextResponse.json({
        message: 'Impersonation session ended',
        originalUser: decoded.originalUser
      })

    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid impersonation token' }, { status: 400 })
    }

  } catch (error) {
    console.error('End impersonate error:', error)
    return NextResponse.json({ 
      error: 'Failed to end impersonation session',
      details: error.message 
    }, { status: 500 })
  }
}