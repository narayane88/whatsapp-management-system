'use client'

import { useEffect, useCallback } from 'react'
import { useCustomerNotifications } from '@/hooks/useCustomerNotifications'

interface CustomerNotificationProviderProps {
  children: React.ReactNode
}

export function CustomerNotificationProvider({ children }: CustomerNotificationProviderProps) {
  const {
    showSubscriptionNotification,
    showPaymentNotification,
    showQuotaNotification,
    showSystemNotification,
    notificationsEnabled,
    soundsEnabled
  } = useCustomerNotifications({
    enableNotifications: true,
    enableSounds: true
  })

  // Monitor API responses for notification triggers
  useEffect(() => {
    let originalFetch = window.fetch

    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      
      // Only monitor customer API calls
      const url = args[0]?.toString() || ''
      if (url.includes('/api/customer/')) {
        try {
          // Clone response to read it without consuming the original
          const clonedResponse = response.clone()
          const data = await clonedResponse.json()
          
          // Check for subscription-related notifications
          if (url.includes('/subscription') && data.notification) {
            showSubscriptionNotification(data.notification.message, data.notification.type)
          }
          
          // Check for payment-related notifications
          if (url.includes('/payment') || url.includes('/bizcoins')) {
            if (data.success === false && data.error) {
              showPaymentNotification(data.error, 'error')
            } else if (data.success && data.message) {
              showPaymentNotification(data.message, 'success')
            }
          }
          
          // Check for quota/usage alerts
          if (data.quotaWarning) {
            showQuotaNotification(data.quotaWarning, 'warning')
          }
          
          if (data.quotaExceeded) {
            showQuotaNotification(data.quotaExceeded, 'error')
          }
          
          // Check for general system notifications
          if (data.systemNotification) {
            showSystemNotification(data.systemNotification.message, data.systemNotification.type)
          }
          
        } catch (error) {
          // Ignore JSON parsing errors for non-JSON responses
        }
      }
      
      return response
    }

    // Restore original fetch on cleanup
    return () => {
      window.fetch = originalFetch
    }
  }, [showSubscriptionNotification, showPaymentNotification, showQuotaNotification, showSystemNotification])

  // Monitor for quota usage via periodic checks
  useEffect(() => {
    const checkQuotaUsage = async () => {
      try {
        const response = await fetch('/api/customer/dashboard')
        const data = await response.json()
        
        if (data.quotaUsage) {
          const { used, limit, percentage } = data.quotaUsage
          
          if (percentage >= 90) {
            showQuotaNotification(`Quota almost full: ${used}/${limit} messages used (${percentage}%)`, 'error')
          } else if (percentage >= 75) {
            showQuotaNotification(`Quota warning: ${used}/${limit} messages used (${percentage}%)`, 'warning')
          }
        }
      } catch (error) {
        // Silently handle errors
      }
    }

    // Check quota every 5 minutes
    const quotaInterval = setInterval(checkQuotaUsage, 5 * 60 * 1000)
    
    // Initial check
    checkQuotaUsage()
    
    return () => clearInterval(quotaInterval)
  }, [showQuotaNotification])

  // Check for browser notifications permission
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            showSystemNotification('Browser notifications enabled for better experience', 'success')
          }
        })
      }
    }
  }, [notificationsEnabled, showSystemNotification])

  // Log notification status
  useEffect(() => {
    console.log(`🔔 Customer notifications: ${notificationsEnabled ? 'ON' : 'OFF'}`)
    console.log(`🔊 Customer sounds: ${soundsEnabled ? 'ON' : 'OFF'}`)
  }, [notificationsEnabled, soundsEnabled])

  return <>{children}</>
}

export default CustomerNotificationProvider