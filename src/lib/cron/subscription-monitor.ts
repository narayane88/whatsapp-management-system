import { PrismaClient } from '@prisma/client'
import { triggerEmailEvent } from '@/lib/email-events'
import { addDays, differenceInDays, isAfter } from 'date-fns'

// Initialize Prisma client
const prisma = new PrismaClient()

// Subscription monitoring configuration
const EXPIRY_NOTIFICATION_DAYS = [30, 15, 7, 3, 1] // Days before expiry to send notifications
const EXPIRED_NOTIFICATION_DAYS = [1, 3, 7] // Days after expiry to send follow-up notifications

interface SubscriptionInfo {
  id: string
  userId: string
  packageName: string
  expiryDate: Date
  isActive: boolean
  messageLimit: number
  price: string
  user: {
    id: string
    name: string
    email: string
    role: string
    parentId?: string
  }
}

// Get expiring subscriptions
async function getExpiringSubscriptions(): Promise<SubscriptionInfo[]> {
  try {
    // Use Prisma Client for type-safe queries with actual schema
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const subscriptions = await prisma.customerPackage.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: sevenDaysAgo,
          lte: thirtyDaysFromNow
        }
      },
      include: {
        package: {
          select: {
            name: true,
            price: true,
            messageLimit: true
          }
        }
      },
      orderBy: {
        endDate: 'asc'
      }
    })

    // Note: The User relation is not available in customer_packages in the actual schema
    // We'll need to get user info separately or create a simplified version
    return subscriptions.map(sub => ({
      id: sub.id,
      userId: sub.userId,
      packageName: sub.package?.name || 'Unknown Package',
      expiryDate: sub.endDate,
      isActive: sub.isActive,
      messageLimit: sub.package?.messageLimit || 0,
      price: sub.package?.price || 0,
      user: {
        id: sub.userId,
        name: 'Customer',
        email: '',
        role: 'customer',
        parentId: null
      }
    }))
  } catch (error) {
    console.error('Error fetching expiring subscriptions:', error)
    return []
  }
}

// Send expiry notification
async function sendExpiryNotification(subscription: SubscriptionInfo, daysRemaining: number) {
  try {
    const isExpired = daysRemaining < 0
    const absoluteDays = Math.abs(daysRemaining)
    
    // Prepare email data
    const emailData = {
      package_name: subscription.packageName,
      message_limit: subscription.messageLimit.toLocaleString(),
      days_remaining: absoluteDays.toString(),
      expiry_date: subscription.expiryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      subscription_id: subscription.id,
      package_price: subscription.price,
      validity_days: '30', // Default - adjust based on package
      auto_renewal_status: 'Disabled', // Check actual status
      next_billing_date: addDays(subscription.expiryDate, 30).toLocaleDateString(),
      renewal_url: `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/billing/renew?package=${subscription.id}`,
      upgrade_url: `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/billing/upgrade`,
      contact_url: `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/support`,
      dashboard_url: `${process.env.NEXT_PUBLIC_DASHBOARD_URL}/dashboard`
    }

    // Choose appropriate event based on status
    const event = isExpired ? 'package_expired' : 'package_expired' // Use same event for both
    
    // Send email to customer
    const success = await triggerEmailEvent({
      user: subscription.user,
      event: event,
      data: emailData,
      timestamp: new Date()
    })

    // If customer has a parent (SubDealer), notify them too
    if (subscription.user.parentId && !isExpired) {
      try {
        // Get parent (SubDealer) information
        const parent = await prisma.user.findUnique({
          where: { id: subscription.user.parentId }
        })

        if (parent) {
          await triggerEmailEvent({
            user: {
              id: parent.id,
              name: parent.name || 'SubDealer',
              email: parent.email,
              role: parent.role || 'subdealer'
            },
            event: 'package_expired',
            data: {
              ...emailData,
              customer_name: subscription.user.name,
              customer_email: subscription.user.email
            },
            timestamp: new Date()
          })
        }
      } catch (error) {
        console.error('Error notifying parent:', error)
      }
    }

    // Log notification
    console.log(`Subscription notification sent: ${subscription.user.email} - ${absoluteDays} days ${isExpired ? 'expired' : 'remaining'}`)
    
    return success
  } catch (error) {
    console.error('Error sending expiry notification:', error)
    return false
  }
}

// Update expired subscriptions
async function updateExpiredSubscriptions() {
  try {
    const result = await prisma.customerPackage.updateMany({
      where: {
        endDate: {
          lt: new Date()
        },
        isActive: true
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    console.log(`Updated ${result.count} expired subscriptions`)
    return result.count
  } catch (error) {
    console.error('Error updating expired subscriptions:', error)
    return 0
  }
}

// Main subscription monitoring function
export async function monitorSubscriptions() {
  try {
    console.log('Starting subscription monitoring...')
    
    // Get all subscriptions that need attention
    const subscriptions = await getExpiringSubscriptions()
    console.log(`Found ${subscriptions.length} subscriptions to monitor`)

    let notificationsSent = 0
    const today = new Date()

    for (const subscription of subscriptions) {
      const daysRemaining = differenceInDays(subscription.expiryDate, today)
      const isExpired = isAfter(today, subscription.expiryDate)
      
      // Determine if we should send a notification
      let shouldNotify = false
      
      if (isExpired) {
        // For expired subscriptions, check follow-up notification schedule
        const daysExpired = Math.abs(daysRemaining)
        shouldNotify = EXPIRED_NOTIFICATION_DAYS.includes(daysExpired)
      } else {
        // For active subscriptions, check pre-expiry notification schedule
        shouldNotify = EXPIRY_NOTIFICATION_DAYS.includes(daysRemaining)
      }

      if (shouldNotify) {
        const success = await sendExpiryNotification(subscription, daysRemaining)
        if (success) {
          notificationsSent++
        }
        
        // Add delay between emails to avoid spam
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Update expired subscriptions in database
    const expiredCount = await updateExpiredSubscriptions()

    console.log(`Subscription monitoring completed:`)
    console.log(`- Notifications sent: ${notificationsSent}`)
    console.log(`- Subscriptions expired: ${expiredCount}`)

    return {
      success: true,
      notificationsSent,
      expiredCount,
      totalMonitored: subscriptions.length
    }
  } catch (error) {
    console.error('Error in subscription monitoring:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Manual trigger function for testing
export async function triggerSubscriptionCheck() {
  console.log('Manual subscription check triggered')
  return await monitorSubscriptions()
}

// Get subscription statistics
export async function getSubscriptionStats() {
  try {
    // Use Prisma Client methods instead of raw SQL for better compatibility
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      expiringSoon,
      expiringMonth
    ] = await Promise.all([
      // Total subscriptions
      prisma.customerPackage.count(),
      
      // Active subscriptions
      prisma.customerPackage.count({
        where: {
          endDate: { gt: now },
          isActive: true
        }
      }),
      
      // Expired subscriptions
      prisma.customerPackage.count({
        where: {
          OR: [
            { endDate: { lte: now } },
            { isActive: false }
          ]
        }
      }),
      
      // Expiring in 7 days
      prisma.customerPackage.count({
        where: {
          endDate: { 
            gte: now,
            lte: sevenDaysFromNow 
          },
          isActive: true
        }
      }),
      
      // Expiring in 30 days
      prisma.customerPackage.count({
        where: {
          endDate: { 
            gte: now,
            lte: thirtyDaysFromNow 
          },
          isActive: true
        }
      })
    ])

    return {
      total_subscriptions: totalSubscriptions,
      active_subscriptions: activeSubscriptions,
      expired_subscriptions: expiredSubscriptions,
      expiring_soon: expiringSoon,
      expiring_month: expiringMonth
    }
  } catch (error) {
    console.error('Error getting subscription stats:', error)
    return {
      total_subscriptions: 0,
      active_subscriptions: 0,
      expired_subscriptions: 0,
      expiring_soon: 0,
      expiring_month: 0
    }
  }
}