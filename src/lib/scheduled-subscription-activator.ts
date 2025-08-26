import { Pool } from 'pg'
import { getDatabaseConfig } from '@/lib/db-config'

const pool = new Pool(getDatabaseConfig())

export async function activateScheduledSubscriptions() {
  try {
    console.log('🕒 Starting scheduled subscription activation check...')
    
    // Find all scheduled subscriptions that should be activated
    const dueSubscriptions = await pool.query(`
      SELECT 
        cp.id,
        cp."userId",
        cp."packageId",
        cp."scheduledStartDate",
        cp."previousSubscriptionId",
        p.name as package_name,
        u.email as user_email
      FROM customer_packages cp
      JOIN packages p ON cp."packageId" = p.id
      JOIN users u ON cp."userId"::text = u.id::text
      WHERE cp.status = 'SCHEDULED' 
        AND cp."scheduledStartDate" <= NOW()
      ORDER BY cp."scheduledStartDate" ASC
    `)

    if (dueSubscriptions.rows.length === 0) {
      console.log('✅ No scheduled subscriptions to activate')
      return { activated: 0, errors: [] }
    }

    console.log(`📅 Found ${dueSubscriptions.rows.length} scheduled subscriptions to activate`)

    const results = {
      activated: 0,
      errors: [] as string[]
    }

    for (const subscription of dueSubscriptions.rows) {
      try {
        console.log(`🔄 Activating scheduled subscription ${subscription.id} for user ${subscription.user_email}`)
        
        // Start a transaction for each subscription activation
        await pool.query('BEGIN')
        
        // 1. Deactivate any current active subscription for this user
        if (subscription.previousSubscriptionId) {
          await pool.query(`
            UPDATE customer_packages 
            SET "isActive" = false, status = 'EXPIRED', "updatedAt" = NOW()
            WHERE id = $1
          `, [subscription.previousSubscriptionId])
          
          console.log(`   ✅ Expired previous subscription ${subscription.previousSubscriptionId}`)
        }
        
        // 2. Activate the scheduled subscription
        await pool.query(`
          UPDATE customer_packages 
          SET 
            "isActive" = true, 
            status = 'ACTIVE',
            "startDate" = NOW(),
            "updatedAt" = NOW()
          WHERE id = $1
        `, [subscription.id])
        
        // Commit the transaction
        await pool.query('COMMIT')
        
        console.log(`   ✅ Activated subscription ${subscription.id} (${subscription.package_name}) for ${subscription.user_email}`)
        results.activated++
        
      } catch (error) {
        // Rollback the transaction on error
        await pool.query('ROLLBACK')
        const errorMessage = `Failed to activate subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(`   ❌ ${errorMessage}`)
        results.errors.push(errorMessage)
      }
    }

    console.log(`🎉 Scheduled subscription activation completed: ${results.activated} activated, ${results.errors.length} errors`)
    return results
    
  } catch (error) {
    console.error('❌ Scheduled subscription activation failed:', error)
    throw error
  }
}

export async function cancelScheduledSubscription(subscriptionId: string, userId: string) {
  try {
    console.log(`🚫 Canceling scheduled subscription ${subscriptionId} for user ${userId}`)
    
    const result = await pool.query(`
      UPDATE customer_packages 
      SET status = 'CANCELLED', "updatedAt" = NOW()
      WHERE id = $1 AND "userId" = $2::text AND status = 'SCHEDULED'
      RETURNING *
    `, [subscriptionId, userId])
    
    if (result.rows.length === 0) {
      throw new Error('Scheduled subscription not found or cannot be cancelled')
    }
    
    console.log(`✅ Cancelled scheduled subscription ${subscriptionId}`)
    return result.rows[0]
    
  } catch (error) {
    console.error(`❌ Failed to cancel scheduled subscription ${subscriptionId}:`, error)
    throw error
  }
}