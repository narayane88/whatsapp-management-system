import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkCurrentUserPermission } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ hasPermission: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { permission } = body

    if (!permission) {
      return NextResponse.json({ hasPermission: false, error: 'Permission not specified' }, { status: 400 })
    }

    // Check if user has the required permission
    const hasPermission = await checkCurrentUserPermission(permission)

    return NextResponse.json({ 
      hasPermission,
      user: session.user.email,
      permission,
      role: session.user.role
    })
  } catch (error) {
    return NextResponse.json({ 
      hasPermission: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}