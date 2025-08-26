import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return mock data for now to avoid Prisma issues
    // TODO: Connect to actual database when Prisma models are ready
    return NextResponse.json({
      totalContacts: 150,
      totalGroups: 5,
      subscribedContacts: 142,
      unsubscribedContacts: 8
    })

  } catch (error) {
    console.error('Error fetching contact stats:', error)
    
    // Return empty data as fallback
    return NextResponse.json({
      totalContacts: 0,
      totalGroups: 0,
      subscribedContacts: 0,
      unsubscribedContacts: 0
    })
  }
}