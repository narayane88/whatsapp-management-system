'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { notifications } from '@mantine/notifications'
import { useSession } from 'next-auth/react'
import GlobalSSEManager from '@/lib/global-sse-manager'

interface WhatsAppEvent {
  type: 'queue-update' | 'message-sent' | 'device-status' | 'stats-update' | 'connected' | 'heartbeat'
  data?: any
  timestamp: string
  clientId?: string
  serverTime?: string
  source?: 'webhook' | 'system'
  priority?: 'low' | 'normal' | 'medium' | 'high'
  message?: string
}

interface UseWhatsAppRealTimeOptions {
  onQueueUpdate?: (data: any) => void
  onMessageSent?: (data: any) => void
  onDeviceStatus?: (data: any) => void
  onStatsUpdate?: (data: any) => void
  enableNotifications?: boolean
  enableSounds?: boolean
  autoReconnect?: boolean
  reconnectInterval?: number
}

interface WhatsAppRealTimeState {
  connected: boolean
  connecting: boolean
  error: string | null
  lastEventTime: Date | null
  reconnectAttempts: number
}

// Sound utility functions
const playNotificationSound = (type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
  try {
    // Create audio context if it doesn't exist
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Different frequencies for different notification types
    const frequencies = {
      success: [523.25, 659.25, 783.99], // C5, E5, G5 - success chord
      info: [440, 554.37], // A4, C#5 - info tone
      warning: [349.23, 415.30], // F4, G#4 - warning tone
      error: [233.08, 277.18] // A#3, C#4 - error tone
    }
    
    const freq = frequencies[type] || frequencies.info
    
    // Play a pleasant notification sound
    freq.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      // Volume and timing
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + index * 0.1)
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + index * 0.1 + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + index * 0.1 + 0.25)
      
      oscillator.start(audioContext.currentTime + index * 0.1)
      oscillator.stop(audioContext.currentTime + index * 0.1 + 0.25)
    })
  } catch (error) {
    console.log('Could not play notification sound:', error)
    // Fallback to system beep if available
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS2+/JdysF')
      audio.volume = 0.3
      audio.play().catch(() => {})
    } catch (e) {
      // Silent fallback
    }
  }
}

export function useWhatsAppRealTime(options: UseWhatsAppRealTimeOptions = {}) {
  const { data: session } = useSession()
  const {
    onQueueUpdate,
    onMessageSent,
    onDeviceStatus, 
    onStatsUpdate,
    enableNotifications = false,
    enableSounds = true,
    autoReconnect = true
  } = options

  // Load notification settings from localStorage
  const [effectiveNotifications, setEffectiveNotifications] = useState(enableNotifications)
  const [effectiveSounds, setEffectiveSounds] = useState(enableSounds)

  useEffect(() => {
    const savedNotifications = localStorage.getItem('whatsapp-notifications')
    const savedSounds = localStorage.getItem('whatsapp-sounds')
    
    if (savedNotifications !== null) {
      setEffectiveNotifications(JSON.parse(savedNotifications))
    } else {
      setEffectiveNotifications(enableNotifications)
    }
    
    if (savedSounds !== null) {
      setEffectiveSounds(JSON.parse(savedSounds))
    } else {
      setEffectiveSounds(enableSounds)
    }
  }, [enableNotifications, enableSounds])

  const [state, setState] = useState<WhatsAppRealTimeState>({
    connected: false,
    connecting: false,
    error: null,
    lastEventTime: null,
    reconnectAttempts: 0
  })

  // Use global SSE manager instead of individual connections
  const manager = GlobalSSEManager.getInstance()
  const isUnmountedRef = useRef<boolean>(false)

  // Initialize global connection and event handlers
  useEffect(() => {
    if (!session?.user?.id) return
    
    isUnmountedRef.current = false
    
    // Subscribe to connection state changes
    const unsubscribeState = manager.subscribeToState((connectionState) => {
      if (isUnmountedRef.current) return
      
      setState(prev => ({
        ...prev,
        connected: connectionState.connected,
        connecting: connectionState.connecting,
        error: connectionState.error,
        lastEventTime: connectionState.lastEventTime,
        reconnectAttempts: 0
      }))
    })

    // Subscribe to events and handle notifications
    const unsubscribeEvents: Array<() => void> = []

    // Queue update handler
    if (onQueueUpdate) {
      const unsubscribe = manager.subscribe('queue-update', (event) => {
        if (!isUnmountedRef.current) {
          onQueueUpdate(event.data)
        }
      })
      unsubscribeEvents.push(unsubscribe)
    }

    // Message sent handler with notifications
    if (onMessageSent) {
      const unsubscribe = manager.subscribe('message-sent', (event) => {
        if (!isUnmountedRef.current) {
          onMessageSent(event.data)
          
          if (effectiveNotifications && event.data?.to) {
            if (effectiveSounds) {
              playNotificationSound('success')
            }
            setTimeout(() => {
              notifications.show({
                title: 'Message Delivered',
                message: `Sent to ${event.data.to}`,
                color: 'green',
                autoClose: 3000
              })
            }, 200)
          }
        }
      })
      unsubscribeEvents.push(unsubscribe)
    }

    // Device status handler with notifications
    if (onDeviceStatus) {
      const unsubscribe = manager.subscribe('device-status', (event) => {
        if (!isUnmountedRef.current) {
          onDeviceStatus(event.data)
          
          if (effectiveNotifications && event.data?.status && event.data?.deviceName) {
            const statusColor = event.data.status === 'CONNECTED' ? 'green' : 'orange'
            const statusText = event.data.status === 'CONNECTED' ? 'connected' : 'disconnected'
            const soundType = event.data.status === 'CONNECTED' ? 'success' : 'warning'
            
            if (effectiveSounds) {
              playNotificationSound(soundType)
            }
            setTimeout(() => {
              notifications.show({
                title: 'Device Status',
                message: `${event.data.deviceName} ${statusText}`,
                color: statusColor,
                autoClose: 4000
              })
            }, 300)
          }
        }
      })
      unsubscribeEvents.push(unsubscribe)
    }

    // Stats update handler
    if (onStatsUpdate) {
      const unsubscribe = manager.subscribe('stats-update', (event) => {
        if (!isUnmountedRef.current) {
          onStatsUpdate(event.data)
        }
      })
      unsubscribeEvents.push(unsubscribe)
    }

    // Connect to global SSE
    manager.connect(session.user.id)

    return () => {
      isUnmountedRef.current = true
      unsubscribeState()
      unsubscribeEvents.forEach(fn => fn())
    }
  }, [session?.user?.id, onQueueUpdate, onMessageSent, onDeviceStatus, onStatsUpdate, effectiveNotifications, effectiveSounds])

  // Manual connect/disconnect functions
  const connect = useCallback(() => {
    if (session?.user?.id) {
      return manager.connect(session.user.id)
    }
    return Promise.resolve(false)
  }, [session?.user?.id])

  const disconnect = useCallback(() => {
    manager.disconnect()
  }, [])

  const reconnect = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
    connect()
  }, [connect])

  return {
    ...state,
    reconnect,
    disconnect,
    isConnected: state.connected,
    hasError: !!state.error,
    isConnecting: state.connecting
  }
}

// Specialized hook for queue updates only
export function useWhatsAppQueueRealTime(
  onQueueUpdate: (data: any) => void,
  enableNotifications = true,
  enableSounds = true
) {
  return useWhatsAppRealTime({
    onQueueUpdate,
    enableNotifications,
    enableSounds,
    autoReconnect: true
  })
}

// Specialized hook for stats updates only  
export function useWhatsAppStatsRealTime(
  onStatsUpdate: (data: any) => void,
  enableSounds = false
) {
  return useWhatsAppRealTime({
    onStatsUpdate,
    enableNotifications: false,
    enableSounds,
    autoReconnect: true
  })
}