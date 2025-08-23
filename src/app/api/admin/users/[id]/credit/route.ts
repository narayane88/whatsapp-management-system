import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Temporarily disable auth for testing - ENABLE THIS IN PRODUCTION
    // const session = await getServerSession(authOptions)
    
    // if (!session || !['OWNER', 'ADMIN', 'SUBDEALER'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user credit balance and role information
    const userDetails = await prisma.$queryRaw`
      SELECT 
        u.id, u.name, u.email, u.message_balance, 
        r.level, r.name as role_name,
        CASE 
          WHEN r.level IN (3, 4) THEN true 
          ELSE false 
        END as can_use_credit
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ${parseInt(userId)}
    `

    if (!userDetails.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userDetails[0]

    return NextResponse.json({
      userId: user.id,
      name: user.name,
      email: user.email,
      creditBalance: user.message_balance || 0,
      roleLevel: user.level,
      roleName: user.role_name,
      canUseCredit: user.can_use_credit,
      eligibilityMessage: user.can_use_credit 
        ? 'User can use credit balance for subscriptions'
        : 'Credit payment is only available for SUBDEALER (Level 3) and EMPLOYEE (Level 4) users'
    })
  } catch (error) {
    console.error('User credit API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}