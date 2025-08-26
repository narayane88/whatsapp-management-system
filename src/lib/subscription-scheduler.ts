import { activateScheduledSubscriptions } from './scheduled-subscription-activator'

class SubscriptionScheduler {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false
  private readonly intervalMinutes: number

  constructor(intervalMinutes: number = 1) {
    this.intervalMinutes = intervalMinutes
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Subscription scheduler is already running')
      return
    }

    console.log(`🚀 Starting subscription scheduler (checking every ${this.intervalMinutes} minute(s))`)
    this.isRunning = true

    // Run immediately once
    this.checkAndActivate()

    // Then run every interval
    this.intervalId = setInterval(() => {
      this.checkAndActivate()
    }, this.intervalMinutes * 60 * 1000) // Convert minutes to milliseconds
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('🛑 Subscription scheduler stopped')
  }

  private async checkAndActivate() {
    try {
      const result = await activateScheduledSubscriptions()
      
      if (result.activated > 0) {
        console.log(`🎯 Automatically activated ${result.activated} scheduled subscription(s)`)
      }
      
      if (result.errors.length > 0) {
        console.error(`❌ Auto-activation errors: ${result.errors.length}`, result.errors)
      }
      
    } catch (error) {
      console.error('❌ Subscription scheduler error:', error)
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      nextCheck: this.intervalId ? new Date(Date.now() + (this.intervalMinutes * 60 * 1000)) : null
    }
  }
}

// Create a singleton instance
export const subscriptionScheduler = new SubscriptionScheduler(1) // Check every 1 minute

// Auto-start in production or when explicitly enabled
const shouldStart = process.env.NODE_ENV === 'production' || 
                   process.env.ENABLE_SUBSCRIPTION_SCHEDULER === 'true' ||
                   process.env.NODE_ENV === 'development' // Enable by default in development

if (shouldStart) {
  // Delay start by 2 seconds to ensure app is fully loaded
  setTimeout(() => {
    subscriptionScheduler.start()
    console.log('✅ Subscription scheduler auto-started in', process.env.NODE_ENV)
  }, 2000)
}