import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getCurrentUserPermissions } from '@/lib/permissions'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ permissions: [], error: 'Not authenticated' }, { status: 401 })
    }

    // Get user permissions
    const permissions = await getCurrentUserPermissions()

    return NextResponse.json({ 
      permissions,
      user: session.user.email,
      role: session.user.role,
      count: permissions.length
    })
  } catch (error) {
    return NextResponse.json({ 
      permissions: [], 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}