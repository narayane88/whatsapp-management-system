'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import GlobalSSEManager from '@/lib/global-sse-manager'

interface UseGlobalSSEOptions {
  onQueueUpdate?: (data: any) => void
  onMessageSent?: (data: any) => void
  onDeviceStatus?: (data: any) => void
  onStatsUpdate?: (data: any) => void
  autoConnect?: boolean
}

interface SSEHookState {
  connected: boolean
  connecting: boolean
  error: string | null
  lastEventTime: Date | null
}

/**
 * Global SSE Hook - Uses singleton connection manager
 * Prevents multiple connections and 429 rate limiting errors
 */
export function useGlobalSSE(options: UseGlobalSSEOptions = {}) {
  const { data: session } = useSession()
  const {
    onQueueUpdate,
    onMessageSent,
    onDeviceStatus,
    onStatsUpdate,
    autoConnect = true
  } = options

  const [state, setState] = useState<SSEHookState>({
    connected: false,
    connecting: false,
    error: null,
    lastEventTime: null
  })

  // Get global SSE manager instance
  const manager = GlobalSSEManager.getInstance()

  // Connect to SSE when session is available
  useEffect(() => {
    if (!autoConnect || !session?.user?.id) {
      return
    }

    console.log('🚀 useGlobalSSE: Initializing connection for user', session.user.id)
    
    // Subscribe to connection state changes
    const unsubscribeState = manager.subscribeToState((connectionState) => {
      setState({
        connected: connectionState.connected,
        connecting: connectionState.connecting,
        error: connectionState.error,
        lastEventTime: connectionState.lastEventTime
      })
    })

    // Connect
    manager.connect(session.user.id)

    return () => {
      unsubscribeState()
    }
  }, [session?.user?.id, autoConnect])

  // Subscribe to specific events
  useEffect(() => {
    const unsubscribeFunctions: Array<() => void> = []

    if (onQueueUpdate) {
      const unsubscribe = manager.subscribe('queue-update', (event) => {
        onQueueUpdate(event.data)
      })
      unsubscribeFunctions.push(unsubscribe)
    }

    if (onMessageSent) {
      const unsubscribe = manager.subscribe('message-sent', (event) => {
        onMessageSent(event.data)
      })
      unsubscribeFunctions.push(unsubscribe)
    }

    if (onDeviceStatus) {
      const unsubscribe = manager.subscribe('device-status', (event) => {
        onDeviceStatus(event.data)
      })
      unsubscribeFunctions.push(unsubscribe)
    }

    if (onStatsUpdate) {
      const unsubscribe = manager.subscribe('stats-update', (event) => {
        onStatsUpdate(event.data)
      })
      unsubscribeFunctions.push(unsubscribe)
    }

    return () => {
      unsubscribeFunctions.forEach(fn => fn())
    }
  }, [onQueueUpdate, onMessageSent, onDeviceStatus, onStatsUpdate])

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

  return {
    ...state,
    connect,
    disconnect,
    isConnected: state.connected,
    isConnecting: state.connecting,
    hasError: !!state.error
  }
}

// Specialized hooks
export function useGlobalQueueSSE(onQueueUpdate: (data: any) => void) {
  return useGlobalSSE({ onQueueUpdate })
}

export function useGlobalDeviceSSE(onDeviceStatus: (data: any) => void) {
  return useGlobalSSE({ onDeviceStatus })
}

export function useGlobalMessageSSE(onMessageSent: (data: any) => void) {
  return useGlobalSSE({ onMessageSent })
}

export function useGlobalStatsSSE(onStatsUpdate: (data: any) => void) {
  return useGlobalSSE({ onStatsUpdate })
}