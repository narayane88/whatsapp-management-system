import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import bcrypt from 'bcryptjs'

const pool = new Pool(getDatabaseConfig())

/**
 * @swagger
 * /api/customer/profile:
 *   get:
 *     tags:
 *       - Customer Profile
 *     summary: Get customer profile
 *     description: Retrieve the authenticated customer's profile information
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 mobile:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 language:
 *                   type: string
 *                 address:
 *                   type: string
 *                 notes:
 *                   type: string
 *                 dealerInfo:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     dealerCode:
 *                       type: string
 *                 packageInfo:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     expiryDate:
 *                       type: string
 *                     status:
 *                       type: string
 *   put:
 *     tags:
 *       - Customer Profile
 *     summary: Update customer profile
 *     description: Update the authenticated customer's profile information
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               mobile:
 *                 type: string
 *               phone:
 *                 type: string
 *               language:
 *                 type: string
 *               address:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if this is an impersonation request
    const impersonationCookie = request.cookies.get('impersonation_active')?.value
    const isImpersonating = impersonationCookie === 'true'
    
    // Allow admin users during impersonation, otherwise only customers
    if (session.user.role !== 'CUSTOMER' && !(['OWNER', 'ADMIN'].includes(session.user.role) && isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get customer email - during impersonation, get from URL parameter
    let customerEmail = session.user.email
    
    if (isImpersonating && ['OWNER', 'ADMIN'].includes(session.user.role)) {
      const { searchParams } = new URL(request.url)
      const impersonatedCustomerId = searchParams.get('impersonatedCustomerId')
      
      if (impersonatedCustomerId) {
        console.log(`🎭 Admin user accessing customer profile for customer ID: ${impersonatedCustomerId}`)
        
        // Get customer email from ID
        const customerResult = await pool.query(
          'SELECT email FROM users WHERE id = $1',
          [impersonatedCustomerId]
        )
        
        if (customerResult.rows.length === 0) {
          return NextResponse.json({ error: 'Impersonated customer not found' }, { status: 404 })
        }
        
        customerEmail = customerResult.rows[0].email
      }
    }

    // Get customer profile with dealer and package info
    const profileResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.mobile, u.phone, 
        u.language, u.address, u.notes,
        dealer.name as dealer_name, dealer.dealer_code,
        p.name as package_name, cp."endDate" as package_expiry,
        CASE 
          WHEN cp."endDate" IS NULL THEN 'No Package'
          WHEN cp."endDate" < CURRENT_TIMESTAMP THEN 'Expired'
          ELSE 'Active'
        END as package_status
      FROM users u
      LEFT JOIN users dealer ON u."parentId" = dealer.id
      LEFT JOIN customer_packages cp ON u.id::text = cp."userId" AND cp."isActive" = true
      LEFT JOIN packages p ON cp."packageId" = p.id
      WHERE u.email = $1
    `, [customerEmail])

    if (profileResult.rows.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const profile = profileResult.rows[0]

    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      mobile: profile.mobile,
      phone: profile.phone,
      language: profile.language || 'en',
      address: profile.address,
      notes: profile.notes,
      dealerInfo: profile.dealer_name ? {
        name: profile.dealer_name,
        dealerCode: profile.dealer_code
      } : null,
      packageInfo: profile.package_name ? {
        name: profile.package_name,
        expiryDate: profile.package_expiry,
        status: profile.package_status
      } : null
    })

  } catch (error) {
    console.error('Profile GET API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, mobile, phone, language, address, notes } = body

    // Update profile
    const updateResult = await pool.query(`
      UPDATE users 
      SET name = $1, mobile = $2, phone = $3, 
          language = $4, address = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
      WHERE email = $7
      RETURNING id, name, email, mobile, phone, language, address, notes
    `, [name, mobile, phone, language || 'en', address, notes, session.user.email])

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updateResult.rows[0]
    })

  } catch (error) {
    console.error('Profile UPDATE API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}