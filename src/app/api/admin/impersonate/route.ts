import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user has permission to impersonate
    const currentUserResult = await prisma.$queryRaw`
      SELECT u.id, u.email, u.name, r.level, r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE LOWER(u.email) = LOWER(${session.user.email}) AND ur.is_primary = true
      LIMIT 1
    `

    if (!Array.isArray(currentUserResult) || currentUserResult.length === 0) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 })
    }

    const currentUser = currentUserResult[0]
    
    // Only OWNER and ADMIN level users can impersonate
    if (currentUser.level > 2) {
      return NextResponse.json({ error: 'Insufficient permissions to impersonate users' }, { status: 403 })
    }

    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // Get customer details
    const customerResult = await prisma.$queryRaw`
      SELECT u.id, u.email, u.name, u."isActive", r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ${customerId} AND ur.is_primary = true
      LIMIT 1
    `

    if (!Array.isArray(customerResult) || customerResult.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const customer = customerResult[0]

    // Only allow impersonating customers
    if (customer.role_name !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Can only impersonate customers' }, { status: 400 })
    }

    // Check if customer is active
    if (!customer.isActive) {
      return NextResponse.json({ error: 'Cannot impersonate inactive customer' }, { status: 400 })
    }

    // Log the impersonation for audit (simplified logging without audit table dependency)
    console.log(`🎭 IMPERSONATION START: Admin ${currentUser.name} (${currentUser.email}) started impersonating customer ${customer.name} (${customer.email}) at ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      message: `Successfully started impersonating ${customer.name}`,
      impersonation: {
        targetUser: {
          id: customer.id,
          email: customer.email,
          name: customer.name
        },
        adminUser: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name
        },
        startedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Impersonation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const currentUserResult = await prisma.$queryRaw`
      SELECT u.id, u.email, u.name
      FROM users u
      WHERE LOWER(u.email) = LOWER(${session.user.email})
      LIMIT 1
    `

    if (!Array.isArray(currentUserResult) || currentUserResult.length === 0) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 })
    }

    const currentUser = currentUserResult[0]

    // Log the end of impersonation (simplified logging without audit table dependency)
    console.log(`🎭 IMPERSONATION END: Admin ${currentUser.name} (${currentUser.email}) ended impersonation session at ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      message: 'Impersonation session ended successfully'
    })
  } catch (error) {
    console.error('End impersonation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}