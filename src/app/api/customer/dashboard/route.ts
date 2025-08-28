import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

/**
 * @swagger
 * /api/customer/dashboard:
 *   get:
 *     tags:
 *       - Customer Dashboard
 *     summary: Get customer dashboard statistics
 *     description: Retrieve dashboard metrics for the authenticated customer
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 whatsappInstances:
 *                   type: integer
 *                   description: Number of WhatsApp instances
 *                 totalContacts:
 *                   type: integer
 *                   description: Total number of contacts
 *                 messagesSent:
 *                   type: integer
 *                   description: Total messages sent
 *                 apiKeys:
 *                   type: integer
 *                   description: Number of API keys
 *                 queuedMessages:
 *                   type: integer
 *                   description: Messages in queue
 *                 activePackage:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     expiryDate:
 *                       type: string
 *                       format: date
 *                     status:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - not a customer
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if this is an impersonation request
    const impersonationCookie = request.cookies.get('impersonation_active')?.value
    const isImpersonating = impersonationCookie === 'true'
    
    // Allow admin users during impersonation, otherwise only customers
    if (session.user.role !== 'CUSTOMER' && !(['OWNER', 'ADMIN'].includes(session.user.role) && isImpersonating)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get customer ID - during impersonation, use the impersonated customer's data
    let userId: number
    let userEmail: string = session.user.email
    
    if (isImpersonating && ['OWNER', 'ADMIN'].includes(session.user.role)) {
      // During impersonation, get the impersonated customer ID from query parameter
      const { searchParams } = new URL(request.url)
      const impersonatedCustomerId = searchParams.get('impersonatedCustomerId')
      
      if (impersonatedCustomerId) {
        console.log(`🎭 Admin user accessing customer dashboard for customer ID: ${impersonatedCustomerId}`)
        userId = parseInt(impersonatedCustomerId)
        
        // Verify the customer exists
        const customerCheck = await pool.query(
          'SELECT id, email FROM users WHERE id = $1',
          [userId]
        )
        
        if (customerCheck.rows.length === 0) {
          return NextResponse.json({ error: 'Impersonated customer not found' }, { status: 404 })
        }
        
        userEmail = customerCheck.rows[0].email
      } else {
        // Fallback to admin's data if no customer ID provided
        console.log('🎭 Admin user accessing customer dashboard during impersonation (no customer ID provided)')
        
        const userResult = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [session.user.email]
        )
        
        if (userResult.rows.length === 0) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        
        userId = userResult.rows[0].id
      }
    } else {
      // Normal customer access
      const userResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [session.user.email]
      )

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      userId = userResult.rows[0].id
    }

    // Get dashboard statistics
    const [instancesResult, sentMessagesResult, packageResult] = await Promise.all([
      // WhatsApp instances count
      pool.query(`
        SELECT COUNT(*) as count 
        FROM whatsapp_instances 
        WHERE "userId" = $1::text
      `, [userId]),
      
      // Messages sent count from sent_messages table
      pool.query(`
        SELECT COUNT(*) as count 
        FROM sent_messages 
        WHERE "userId" = $1
      `, [userId]),
      
      // Active package with full details including user message balance
      pool.query(`
        SELECT 
          p.name, 
          p.price,
          p.duration,
          p."messageLimit",
          cp."endDate", 
          cp."isActive",
          cp."messagesUsed",
          cp."createdAt" as "startDate",
          EXTRACT(DAYS FROM (cp."endDate" - NOW())) as days_remaining,
          u.message_balance
        FROM customer_packages cp
        JOIN packages p ON cp."packageId" = p.id
        JOIN users u ON cp."userId" = u.id::text
        WHERE cp."userId" = $1::text AND cp."isActive" = true
        ORDER BY cp."createdAt" DESC
        LIMIT 1
      `, [userId])
    ])

    // Get additional statistics that are safe to query
    const additionalStats = await Promise.allSettled([
      // Try to get contacts count (fallback to 0 if table doesn't exist)
      pool.query(`SELECT COUNT(*) as count FROM contacts WHERE "userId" = $1`, [userId]).catch(() => ({ rows: [{ count: 0 }] })),
      
      // Try to get API keys count (fallback to 0 if table doesn't exist)  
      pool.query(`SELECT COUNT(*) as count FROM api_keys WHERE "userId" = $1`, [userId]).catch(() => ({ rows: [{ count: 0 }] })),
      
      // Get today's messages count
      pool.query(`
        SELECT COUNT(*) as count 
        FROM sent_messages 
        WHERE "userId" = $1 AND DATE("sentAt") = CURRENT_DATE
      `, [userId]),
      
      // Get this month's messages count
      pool.query(`
        SELECT COUNT(*) as count 
        FROM sent_messages 
        WHERE "userId" = $1 AND DATE_TRUNC('month', "sentAt") = DATE_TRUNC('month', NOW())
      `, [userId])
    ])

    // Extract additional stats safely
    const contactsCount = additionalStats[0].status === 'fulfilled' ? 
      parseInt(additionalStats[0].value.rows[0]?.count || '0') : 0
    const apiKeysCount = additionalStats[1].status === 'fulfilled' ? 
      parseInt(additionalStats[1].value.rows[0]?.count || '0') : 0
    const todayMessagesCount = additionalStats[2].status === 'fulfilled' ? 
      parseInt(additionalStats[2].value.rows[0]?.count || '0') : 0
    const monthMessagesCount = additionalStats[3].status === 'fulfilled' ? 
      parseInt(additionalStats[3].value.rows[0]?.count || '0') : 0

    const packageData = packageResult.rows[0]
    const isExpired = packageData ? new Date(packageData.endDate) <= new Date() : false
    const daysRemaining = packageData ? Math.max(0, Math.floor(packageData.days_remaining)) : 0

    const stats = {
      whatsappInstances: parseInt(instancesResult.rows[0]?.count || '0'),
      totalContacts: contactsCount,
      messagesSent: parseInt(sentMessagesResult.rows[0]?.count || '0'),
      messagesToday: todayMessagesCount,
      messagesThisMonth: monthMessagesCount,
      apiKeys: apiKeysCount,
      queuedMessages: 0, // Will be updated when queue system is properly integrated
      activePackage: packageData ? {
        name: packageData.name,
        price: packageData.price,
        duration: packageData.duration,
        messageLimit: packageData.messageLimit,
        messagesUsed: parseInt(packageData.messagesUsed || '0'),
        messageBalance: parseInt(packageData.message_balance || '0'),
        remainingMessages: packageData.messageLimit ? 
          Math.max(0, packageData.messageLimit - parseInt(packageData.messagesUsed || '0')) + parseInt(packageData.message_balance || '0') : null,
        startDate: packageData.startDate,
        expiryDate: packageData.endDate,
        daysRemaining: daysRemaining,
        status: isExpired ? 'Expired' : 'Active',
        usagePercentage: packageData.messageLimit ? 
          Math.min(100, Math.round((parseInt(packageData.messagesUsed || '0') / packageData.messageLimit) * 100)) : null
      } : null
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Dashboard API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}