'use client'

import { useEffect, useCallback } from 'react'
import { notifications } from '@mantine/notifications'
import { useNotificationSettings } from '@/hooks/useNotificationSettings'

interface CustomerNotificationOptions {
  enableSounds?: boolean
  enableNotifications?: boolean
}

interface CustomerNotificationEvent {
  type: 'subscription' | 'payment' | 'quota' | 'system' | 'whatsapp'
  title: string
  message: string
  color?: string
  autoClose?: number
  sound?: 'success' | 'info' | 'warning' | 'error'
}

export function useCustomerNotifications(options: CustomerNotificationOptions = {}) {
  const { settings } = useNotificationSettings()
  
  const effectiveNotifications = options.enableNotifications ?? settings.enableNotifications
  const effectiveSounds = options.enableSounds ?? settings.enableSounds

  const playNotificationSound = useCallback((type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    if (!effectiveSounds) return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const frequencies = {
        success: [523.25, 659.25, 783.99], // C5, E5, G5 - success chord
        info: [440, 554.37], // A4, C#5 - info tone
        warning: [349.23, 415.30], // F4, G#4 - warning tone
        error: [233.08, 277.18] // A#3, C#4 - error tone
      }
      
      const freq = frequencies[type] || frequencies.info
      
      freq.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = frequency
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.1)
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + index * 0.1 + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + index * 0.1 + 0.25)
        
        oscillator.start(audioContext.currentTime + index * 0.1)
        oscillator.stop(audioContext.currentTime + index * 0.1 + 0.25)
      })
    } catch (error) {
      console.log('Could not play notification sound:', error)
    }
  }, [effectiveSounds])

  const showNotification = useCallback((event: CustomerNotificationEvent) => {
    if (effectiveSounds && event.sound) {
      playNotificationSound(event.sound)
    }
    
    if (effectiveNotifications) {
      notifications.show({
        title: event.title,
        message: event.message,
        color: event.color || 'blue',
        autoClose: event.autoClose || 5000
      })
    }
  }, [effectiveNotifications, effectiveSounds, playNotificationSound])

  // Predefined notification methods for common customer events
  const showSubscriptionNotification = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'info') => {
    showNotification({
      type: 'subscription',
      title: 'Subscription Update',
      message,
      color: type === 'success' ? 'green' : type === 'warning' ? 'orange' : 'red',
      sound: type,
      autoClose: 6000
    })
  }, [showNotification])

  const showPaymentNotification = useCallback((message: string, type: 'success' | 'warning' | 'error' = 'info') => {
    showNotification({
      type: 'payment',
      title: 'Payment Update',
      message,
      color: type === 'success' ? 'green' : type === 'warning' ? 'orange' : 'red',
      sound: type,
      autoClose: 8000
    })
  }, [showNotification])

  const showQuotaNotification = useCallback((message: string, type: 'info' | 'warning' | 'error' = 'warning') => {
    showNotification({
      type: 'quota',
      title: 'Usage Alert',
      message,
      color: type === 'info' ? 'blue' : type === 'warning' ? 'orange' : 'red',
      sound: type,
      autoClose: 10000
    })
  }, [showNotification])

  const showSystemNotification = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    showNotification({
      type: 'system',
      title: 'System Notification',
      message,
      color: type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue',
      sound: type,
      autoClose: 5000
    })
  }, [showNotification])

  // Listen for global customer events (this could be extended to listen to server-sent events)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customer-notification' && e.newValue) {
        try {
          const notification: CustomerNotificationEvent = JSON.parse(e.newValue)
          showNotification(notification)
          // Clear the notification from storage
          localStorage.removeItem('customer-notification')
        } catch (error) {
          console.error('Failed to parse customer notification:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [showNotification])

  return {
    showNotification,
    showSubscriptionNotification,
    showPaymentNotification, 
    showQuotaNotification,
    showSystemNotification,
    playNotificationSound,
    notificationsEnabled: effectiveNotifications,
    soundsEnabled: effectiveSounds
  }
}

// Utility function to trigger notifications from anywhere in the app
export const triggerCustomerNotification = (notification: CustomerNotificationEvent) => {
  localStorage.setItem('customer-notification', JSON.stringify(notification))
  // Trigger storage event manually for same-tab notifications
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'customer-notification',
    newValue: JSON.stringify(notification)
  }))
}

export default useCustomerNotifications