import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'
import { authOptions } from '@/lib/auth'

const pool = new Pool(getDatabaseConfig())

// GET /api/customer/messages/balance - Get user's total available messages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's message balance and current subscription info
    const userResult = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.message_balance,
        cp.id as subscription_id,
        cp."messagesUsed",
        cp."startDate",
        cp."endDate",
        cp."isActive",
        p.name as package_name,
        p."messageLimit",
        p.duration
      FROM users u
      LEFT JOIN customer_packages cp ON cp."userId" = u.id::text 
        AND cp."isActive" = true
        AND cp."endDate" > CURRENT_TIMESTAMP
      LEFT JOIN packages p ON cp."packageId" = p.id
      WHERE LOWER(u.email) = LOWER($1)
      ORDER BY cp."createdAt" DESC
      LIMIT 1
    `, [session.user.email])

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userResult.rows[0]
    const messageBalance = userData.message_balance || 0
    
    let subscriptionMessages = 0
    let totalAvailable = messageBalance
    let subscription = null

    if (userData.subscription_id && userData.isActive) {
      const packageLimit = userData.messageLimit || 0
      const messagesUsed = userData.messagesUsed || 0
      subscriptionMessages = Math.max(0, packageLimit - messagesUsed)
      totalAvailable = subscriptionMessages + messageBalance
      
      subscription = {
        id: userData.subscription_id,
        packageName: userData.package_name,
        messageLimit: packageLimit,
        messagesUsed: messagesUsed,
        messagesRemaining: subscriptionMessages,
        startDate: userData.startDate,
        endDate: userData.endDate,
        isActive: userData.isActive
      }
    }

    return NextResponse.json({
      success: true,
      messageBalance: {
        voucherMessages: messageBalance,
        subscriptionMessages: subscriptionMessages,
        totalAvailable: totalAvailable
      },
      subscription: subscription,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name
      }
    })

  } catch (error) {
    console.error('Message balance API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch message balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}