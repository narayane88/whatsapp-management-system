import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('❌ [PACKAGES-GET] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    // Check permission to access packages
    const hasPermission = await checkCurrentUserPermission('packages.page.access')
    if (!hasPermission) {
      console.log(`❌ [PACKAGES-GET] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [PACKAGES-GET] Required permission: packages.page.access`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'packages.page.access',
          userEmail: session.user.email,
          message: 'User does not have the required permission to access packages data'
        } : undefined
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const isActive = searchParams.get('isActive')
    
    const skip = (page - 1) * limit
    
    const where = isActive !== null ? { isActive: isActive === 'true' } : {}

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.package.count({ where })
    ])

    return NextResponse.json({
      packages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('❌ [PACKAGES-POST] Authentication failed: No session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: process.env.NODE_ENV === 'development' ? 'No valid session found' : undefined
      }, { status: 401 })
    }

    // Check permission to create packages
    const hasPermission = await checkCurrentUserPermission('packages.create.button')
    if (!hasPermission) {
      console.log(`❌ [PACKAGES-POST] Permission denied for user: ${session.user.email}`)
      console.log(`🔑 [PACKAGES-POST] Required permission: packages.create.button`)
      
      return NextResponse.json({ 
        error: 'Insufficient permissions',
        details: process.env.NODE_ENV === 'development' ? {
          requiredPermission: 'packages.create.button',
          userEmail: session.user.email,
          message: 'User does not have the required permission to create packages'
        } : undefined
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, price, duration, messageLimit, instanceLimit, features } = body

    // Validate required fields
    if (!name || !price || !duration || !messageLimit || !instanceLimit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create package
    const packageData = await prisma.package.create({
      data: {
        name,
        description,
        price,
        duration,
        messageLimit,
        instanceLimit,
        features: features || {},
        isActive: true
      }
    })

    return NextResponse.json({ package: packageData }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}