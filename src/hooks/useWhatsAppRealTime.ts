'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { notifications } from '@mantine/notifications'

interface WhatsAppEvent {
  type: 'queue-update' | 'message-sent' | 'device-status' | 'stats-update' | 'connected'
  data?: any
  timestamp: string
}

interface UseWhatsAppRealTimeOptions {
  onQueueUpdate?: (data: any) => void
  onMessageSent?: (data: any) => void
  onDeviceStatus?: (data: any) => void
  onStatsUpdate?: (data: any) => void
  enableNotifications?: boolean
  autoReconnect?: boolean
  reconnectInterval?: number
}

interface WhatsAppRealTimeState {
  connected: boolean
  error: string | null
  lastEventTime: Date | null
}

export function useWhatsAppRealTime(options: UseWhatsAppRealTimeOptions = {}) {
  const {
    onQueueUpdate,
    onMessageSent,
    onDeviceStatus, 
    onStatsUpdate,
    enableNotifications = false,
    autoReconnect = true,
    reconnectInterval = 3000
  } = options

  const [state, setState] = useState<WhatsAppRealTimeState>({
    connected: false,
    error: null,
    lastEventTime: null
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const clientIdRef = useRef<string>()

  // Generate client ID once
  if (!clientIdRef.current) {
    clientIdRef.current = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const handleEvent = useCallback((event: MessageEvent) => {
    try {
      const parsedEvent: WhatsAppEvent = JSON.parse(event.data)
      
      setState(prev => ({
        ...prev,
        lastEventTime: new Date(),
        error: null
      }))

      // Handle specific event types
      switch (parsedEvent.type) {
        case 'connected':
          setState(prev => ({ ...prev, connected: true, error: null }))
          if (enableNotifications) {
            notifications.show({
              title: 'Connected',
              message: 'Real-time updates are now active',
              color: 'green',
              autoClose: 3000
            })
          }
          break

        case 'queue-update':
          onQueueUpdate?.(parsedEvent.data)
          break

        case 'message-sent':
          onMessageSent?.(parsedEvent.data)
          if (enableNotifications) {
            notifications.show({
              title: 'Message Sent',
              message: `Message sent to ${parsedEvent.data?.to || 'recipient'}`,
              color: 'green',
              autoClose: 5000
            })
          }
          break

        case 'device-status':
          onDeviceStatus?.(parsedEvent.data)
          if (enableNotifications && parsedEvent.data?.status) {
            const statusColor = parsedEvent.data.status === 'CONNECTED' ? 'green' : 'red'
            notifications.show({
              title: 'Device Status Changed',
              message: `${parsedEvent.data.deviceName || 'Device'} is now ${parsedEvent.data.status}`,
              color: statusColor,
              autoClose: 5000
            })
          }
          break

        case 'stats-update':
          onStatsUpdate?.(parsedEvent.data)
          break
      }
    } catch (error) {
      console.error('Error parsing SSE event:', error)
      setState(prev => ({ ...prev, error: 'Invalid event data received' }))
    }
  }, [onQueueUpdate, onMessageSent, onDeviceStatus, onStatsUpdate, enableNotifications])

  const handleError = useCallback((error: Event) => {
    console.error('SSE connection error:', error)
    setState(prev => ({
      ...prev,
      connected: false,
      error: 'Connection error occurred'
    }))

    if (enableNotifications) {
      notifications.show({
        title: 'Connection Lost',
        message: 'Attempting to reconnect...',
        color: 'orange',
        autoClose: 5000
      })
    }
  }, [enableNotifications])

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(
      `/api/customer/whatsapp/events?clientId=${clientIdRef.current}`
    )

    eventSource.onmessage = handleEvent
    eventSource.onerror = (error) => {
      handleError(error)
      
      // Auto-reconnect if enabled
      if (autoReconnect && !reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null
          connect()
        }, reconnectInterval)
      }
    }

    eventSourceRef.current = eventSource
  }, [handleEvent, handleError, autoReconnect, reconnectInterval])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setState(prev => ({ ...prev, connected: false }))
  }, [])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Manual reconnect function
  const reconnect = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
    connect()
  }, [connect])

  return {
    ...state,
    reconnect,
    disconnect,
    isConnected: state.connected,
    hasError: !!state.error
  }
}

// Specialized hook for queue updates only
export function useWhatsAppQueueRealTime(
  onQueueUpdate: (data: any) => void,
  enableNotifications = true
) {
  return useWhatsAppRealTime({
    onQueueUpdate,
    enableNotifications,
    autoReconnect: true
  })
}

// Specialized hook for stats updates only  
export function useWhatsAppStatsRealTime(
  onStatsUpdate: (data: any) => void
) {
  return useWhatsAppRealTime({
    onStatsUpdate,
    enableNotifications: false,
    autoReconnect: true
  })
}