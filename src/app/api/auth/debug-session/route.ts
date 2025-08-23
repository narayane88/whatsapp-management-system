import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

// DEBUG: Create a debug session for testing permissions
export async function POST(request: NextRequest) {
  try {
    const { userEmail } = await request.json()
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 })
    }
    
    console.log('🐛 DEBUG: Creating debug session for:', userEmail)
    
    // Get user from database with role
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u."isActive", u."parentId", 
             r.name as role, u.dealer_code
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u."isActive" = true
    `, [userEmail])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = result.rows[0]
    
    console.log('✅ DEBUG: Found user for debug session:', {
      email: user.email,
      role: user.role,
      name: user.name
    })
    
    return NextResponse.json({
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        parentId: user.parentId?.toString(),
        dealer_code: user.dealer_code
      },
      message: 'Debug session data created'
    })

  } catch (error) {
    console.error('❌ DEBUG: Create debug session error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}

// GET: Check if user exists in database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }
    
    // Check if user exists
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u."isActive", 
             r.name as role, u.dealer_code
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
    `, [email])

    return NextResponse.json({
      exists: result.rows.length > 0,
      user: result.rows[0] || null
    })

  } catch (error) {
    console.error('❌ DEBUG: Check user error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}