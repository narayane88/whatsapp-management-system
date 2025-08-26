import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    const apiKey = request.headers.get('x-api-key')
    
    if (!session?.user && !apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string
    
    if (apiKey) {
      const keyData = await prisma.apiKey.findFirst({
        where: { 
          key: apiKey,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })
      
      if (!keyData) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      }
      
      userId = keyData.userId
    } else {
      userId = session!.user.id
    }

    // Get real statistics from database
    const [
      totalContacts,
      totalGroups,
      subscribedContacts,
      unsubscribedContacts
    ] = await Promise.all([
      // Total contacts for user
      prisma.contact.count({
        where: { userId }
      }),
      // Total groups for user  
      prisma.contactGroup.count({
        where: { userId }
      }),
      // Subscribed contacts for user
      prisma.contact.count({
        where: { 
          userId,
          isSubscribed: true 
        }
      }),
      // Unsubscribed contacts for user
      prisma.contact.count({
        where: { 
          userId,
          isSubscribed: false 
        }
      })
    ])

    return NextResponse.json({
      totalContacts,
      totalGroups,
      subscribedContacts,
      unsubscribedContacts
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