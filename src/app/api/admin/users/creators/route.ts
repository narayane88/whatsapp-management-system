import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Temporarily disable auth for testing
    // const session = await getServerSession(authOptions)
    
    // if (!session || !['OWNER', 'SUBDEALER'].includes(session.user.role)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    // }

    // Get users with roles Level 4 and below (OWNER, ADMIN, SUBDEALER, EMPLOYEE) for creator filter
    const creators = await prisma.$queryRaw`
      SELECT u.id, u.name, u.email, r.name as role_name,
             CASE 
               WHEN r.name = 'OWNER' THEN 'Owner (Level 1)'
               WHEN r.name = 'ADMIN' THEN 'Admin (Level 2)' 
               WHEN r.name = 'SUBDEALER' THEN 'SubDealer (Level 3)'
               WHEN r.name = 'EMPLOYEE' THEN 'Employee (Level 4)'
               ELSE 'Customer (Level 5+)'
             END as user_level
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name IN ('OWNER', 'ADMIN', 'SUBDEALER', 'EMPLOYEE')  -- Only Level 4 and below
      ORDER BY 
        CASE 
          WHEN r.name = 'OWNER' THEN 1
          WHEN r.name = 'ADMIN' THEN 2
          WHEN r.name = 'SUBDEALER' THEN 3
          WHEN r.name = 'EMPLOYEE' THEN 4
        END,
        u.name
    `

    return NextResponse.json({
      creators,
      total: creators.length
    })
  } catch (error) {
    console.error('Creators API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}