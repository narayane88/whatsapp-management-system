'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { notifications } from '@mantine/notifications'
import { AdminNotification, NotificationPreferences, NotificationStats, SystemMetrics, RealtimeEvent } from '@/types/notifications'
import { useSession } from 'next-auth/react'

interface AdminNotificationContextType {
  notifications: AdminNotification[]
  stats: NotificationStats
  metrics: SystemMetrics | null
  preferences: NotificationPreferences
  isConnected: boolean
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error'
  
  // Methods
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  dismissNotification: (notificationId: string) => void
  clearAll: () => void
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void
  reconnect: () => void
  
  // Filters
  getNotificationsByCategory: (category: string) => AdminNotification[]
  getNotificationsByPriority: (priority: string) => AdminNotification[]
  getUnreadNotifications: () => AdminNotification[]
}

const AdminNotificationContext = createContext<AdminNotificationContextType | null>(null)

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext)
  if (!context) {
    throw new Error('useAdminNotifications must be used within AdminNotificationProvider')
  }
  return context
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enableDesktop: true,
  enableSound: true,
  enableInApp: true,
  categories: {
    user: true,
    transaction: true,
    server: true,
    system: true,
    security: true,
    subscription: true,
    whatsapp: true
  },
  priority: {
    low: false,
    medium: true,
    high: true,
    critical: true
  }
}

interface AdminNotificationProviderProps {
  children: React.ReactNode
}

export const AdminNotificationProvider: React.FC<AdminNotificationProviderProps> = ({ children }) => {
  const { data: session } = useSession()
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byCategory: {},
    byPriority: {},
    recentActivity: 0
  })
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Sound for notifications
  const playNotificationSound = useCallback(() => {
    if (!preferences.enableSound) return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }, [preferences.enableSound])

  // Show desktop notification
  const showDesktopNotification = useCallback((notification: AdminNotification) => {
    if (!preferences.enableDesktop) return
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical'
      })
    }
  }, [preferences.enableDesktop])

  // Calculate stats from notifications
  const calculateStats = useCallback((notifications: AdminNotification[]): NotificationStats => {
    const unread = notifications.filter(n => !n.read)
    const recentActivity = notifications.filter(n => 
      new Date().getTime() - new Date(n.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
    ).length

    const byCategory: Record<string, number> = {}
    const byPriority: Record<string, number> = {}

    notifications.forEach(n => {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1
    })

    return {
      total: notifications.length,
      unread: unread.length,
      byCategory,
      byPriority,
      recentActivity
    }
  }, [])

  // Add notification
  const addNotification = useCallback((notification: AdminNotification) => {
    setAdminNotifications(prev => {
      const updated = [notification, ...prev.slice(0, 99)] // Keep max 100 notifications
      setStats(calculateStats(updated))
      return updated
    })

    // Show in-app notification
    if (preferences.enableInApp && preferences.categories[notification.category] && preferences.priority[notification.priority]) {
      notifications.show({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        color: notification.type === 'error' ? 'red' : 
               notification.type === 'warning' ? 'yellow' : 
               notification.type === 'success' ? 'green' : 'blue',
        autoClose: notification.priority === 'critical' ? false : 5000,
      })
    }

    // Play sound and show desktop notification for high priority
    if (['high', 'critical'].includes(notification.priority)) {
      playNotificationSound()
      showDesktopNotification(notification)
    }
  }, [preferences, calculateStats, playNotificationSound, showDesktopNotification])

  // Connect to SSE stream
  const connectToEventStream = useCallback(() => {
    if (!session?.user?.email || eventSourceRef.current) return

    setConnectionState('connecting')
    
    const eventSource = new EventSource('/api/admin/notifications/stream', {
      withCredentials: true
    })
    
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('📡 Admin notification stream connected')
      setIsConnected(true)
      setConnectionState('connected')
      reconnectAttempts.current = 0
    }

    eventSource.onmessage = (event) => {
      try {
        const data: RealtimeEvent = JSON.parse(event.data)
        
        switch (data.type) {
          case 'notification':
            addNotification(data.data as AdminNotification)
            break
          case 'metrics':
            setMetrics(data.data as SystemMetrics)
            break
          case 'user_activity':
            // Handle user activity updates
            console.log('👤 User activity:', data.data)
            break
          case 'system_status':
            // Handle system status updates
            console.log('🖥️ System status:', data.data)
            break
          case 'whatsapp_event':
            // Handle WhatsApp events
            console.log('📱 WhatsApp event:', data.data)
            break
        }
      } catch (error) {
        console.error('Error parsing notification data:', error)
      }
    }

    eventSource.onerror = () => {
      console.error('❌ Admin notification stream error')
      setIsConnected(false)
      setConnectionState('error')
      eventSource.close()
      eventSourceRef.current = null
      
      // Attempt reconnection with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++
          connectToEventStream()
        }, delay)
      } else {
        setConnectionState('error')
      }
    }
  }, [session?.user?.email, addNotification])

  // Disconnect from event stream
  const disconnectFromEventStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
    setConnectionState('disconnected')
  }, [])

  // Reconnect manually
  const reconnect = useCallback(() => {
    disconnectFromEventStream()
    reconnectAttempts.current = 0
    connectToEventStream()
  }, [connectToEventStream, disconnectFromEventStream])

  // Load preferences and initial data
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/admin/notifications/preferences')
        if (response.ok) {
          const data = await response.json()
          setPreferences({ ...DEFAULT_PREFERENCES, ...data })
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error)
      }
    }

    const loadInitialNotifications = async () => {
      try {
        const response = await fetch('/api/admin/notifications')
        if (response.ok) {
          const data = await response.json()
          setAdminNotifications(data.notifications || [])
          setStats(calculateStats(data.notifications || []))
        }
      } catch (error) {
        console.error('Failed to load initial notifications:', error)
      }
    }

    if (session?.user?.email) {
      loadPreferences()
      loadInitialNotifications()
      
      // Request desktop notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [session?.user?.email, calculateStats])

  // Connect/disconnect based on session
  useEffect(() => {
    if (session?.user?.email) {
      connectToEventStream()
    } else {
      disconnectFromEventStream()
    }

    return () => {
      disconnectFromEventStream()
    }
  }, [session?.user?.email, connectToEventStream, disconnectFromEventStream])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    setAdminNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
      setStats(calculateStats(updated))
      return updated
    })

    try {
      await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PUT'
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [calculateStats])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    setAdminNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      setStats(calculateStats(updated))
      return updated
    })

    try {
      await fetch('/api/admin/notifications/read-all', {
        method: 'PUT'
      })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [calculateStats])

  // Dismiss notification
  const dismissNotification = useCallback((notificationId: string) => {
    setAdminNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId)
      setStats(calculateStats(updated))
      return updated
    })
    notifications.hide(notificationId)
  }, [calculateStats])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setAdminNotifications([])
    setStats({ total: 0, unread: 0, byCategory: {}, byPriority: {}, recentActivity: 0 })
    notifications.clean()
  }, [])

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences }
    setPreferences(updated)

    try {
      await fetch('/api/admin/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      })
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
    }
  }, [preferences])

  // Filter methods
  const getNotificationsByCategory = useCallback((category: string) => {
    return adminNotifications.filter(n => n.category === category)
  }, [adminNotifications])

  const getNotificationsByPriority = useCallback((priority: string) => {
    return adminNotifications.filter(n => n.priority === priority)
  }, [adminNotifications])

  const getUnreadNotifications = useCallback(() => {
    return adminNotifications.filter(n => !n.read)
  }, [adminNotifications])

  const contextValue: AdminNotificationContextType = {
    notifications: adminNotifications,
    stats,
    metrics,
    preferences,
    isConnected,
    connectionState,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    updatePreferences,
    reconnect,
    getNotificationsByCategory,
    getNotificationsByPriority,
    getUnreadNotifications
  }

  return (
    <AdminNotificationContext.Provider value={contextValue}>
      {children}
    </AdminNotificationContext.Provider>
  )
}