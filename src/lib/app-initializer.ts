// App initialization script to start background services
import { subscriptionScheduler } from './subscription-scheduler'

export function initializeApp() {
  console.log('🚀 Initializing WhatsApp Frontend Application...')
  
  // Start subscription scheduler
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SUBSCRIPTION_SCHEDULER === 'true') {
    subscriptionScheduler.start()
    console.log('✅ Subscription scheduler initialized')
  } else {
    console.log('ℹ️ Subscription scheduler disabled (set ENABLE_SUBSCRIPTION_SCHEDULER=true to enable in development)')
  }

  console.log('✅ App initialization complete')
}

// Auto-initialize when this module is loaded
if (typeof window === 'undefined') {
  // Server-side only
  initializeApp()
}