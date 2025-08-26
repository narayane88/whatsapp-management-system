'use client'

/**
 * Global SSE Connection Manager - Singleton Pattern
 * Ensures only ONE SSE connection per user across the entire application
 * Prevents 429 rate limiting errors and manages connection state properly
 */

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

type EventCallback = (event: WhatsAppEvent) => void

interface ConnectionState {
  connected: boolean
  connecting: boolean
  error: string | null
  lastEventTime: Date | null
}

class GlobalSSEManager {
  private static instance: GlobalSSEManager | null = null
  private eventSource: EventSource | null = null
  private userId: string | null = null
  private subscribers: Map<string, Set<EventCallback>> = new Map()
  private connectionState: ConnectionState = {
    connected: false,
    connecting: false,
    error: null,
    lastEventTime: null
  }
  private stateSubscribers: Set<(state: ConnectionState) => void> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isDestroyed = false

  static getInstance(): GlobalSSEManager {
    if (!this.instance) {
      this.instance = new GlobalSSEManager()
    }
    return this.instance
  }

  static destroy() {
    if (this.instance) {
      this.instance.disconnect()
      this.instance.isDestroyed = true
      this.instance = null
    }
  }

  /**
   * Initialize connection for a user
   */
  connect(userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      // If already connected to the same user, return success
      if (this.eventSource && this.userId === userId && this.connectionState.connected) {
        console.log('🔄 SSE: Already connected for user', userId)
        resolve(true)
        return
      }

      // If connecting to a different user, disconnect first
      if (this.eventSource && this.userId !== userId) {
        console.log('🔄 SSE: Switching user connection', this.userId, '→', userId)
        this.disconnect()
      }

      this.userId = userId
      this.updateConnectionState({ connecting: true, error: null })

      // Generate unique client ID
      const clientId = `global_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      
      console.log('🔗 SSE: Creating global connection for user', userId, 'clientId:', clientId)

      try {
        this.eventSource = new EventSource(`/api/customer/whatsapp/events?clientId=${clientId}`)

        this.eventSource.onopen = () => {
          console.log('✅ SSE: Global connection opened for user', userId)
          this.reconnectAttempts = 0
          this.updateConnectionState({ 
            connected: true, 
            connecting: false, 
            error: null 
          })
          resolve(true)
        }

        this.eventSource.onmessage = (event) => {
          this.handleMessage(event)
        }

        this.eventSource.onerror = () => {
          console.log('❌ SSE: Connection error for user', userId)
          this.updateConnectionState({ 
            connected: false, 
            error: 'Connection error' 
          })
          
          // Auto-reconnect with exponential backoff
          if (!this.isDestroyed && this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
            console.log(`🔄 SSE: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)
            
            this.reconnectTimeout = setTimeout(() => {
              this.reconnectAttempts++
              this.connect(userId)
            }, delay)
          }
          
          resolve(false)
        }

        // Timeout fallback
        setTimeout(() => {
          if (!this.connectionState.connected) {
            resolve(false)
          }
        }, 10000)

      } catch (error) {
        console.error('SSE: Failed to create connection:', error)
        this.updateConnectionState({ 
          connecting: false, 
          error: 'Failed to create connection' 
        })
        resolve(false)
      }
    })
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.eventSource) {
      console.log('🔌 SSE: Disconnecting global connection for user', this.userId)
      this.eventSource.close()
      this.eventSource = null
    }

    this.updateConnectionState({ 
      connected: false, 
      connecting: false 
    })

    this.userId = null
    this.reconnectAttempts = 0
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }
    
    this.subscribers.get(eventType)!.add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscribers.delete(eventType)
        }
      }
    }
  }

  /**
   * Subscribe to connection state changes
   */
  subscribeToState(callback: (state: ConnectionState) => void): () => void {
    this.stateSubscribers.add(callback)
    
    // Immediately call with current state
    callback(this.connectionState)
    
    return () => {
      this.stateSubscribers.delete(callback)
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent) {
    try {
      const parsedEvent: WhatsAppEvent = JSON.parse(event.data)
      
      // Update last event time
      this.updateConnectionState({ 
        lastEventTime: new Date(),
        error: null
      })

      // Broadcast to specific event type subscribers
      const callbacks = this.subscribers.get(parsedEvent.type)
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(parsedEvent)
          } catch (error) {
            console.error('SSE: Error in event callback:', error)
          }
        })
      }

      // Broadcast to 'all' subscribers
      const allCallbacks = this.subscribers.get('all')
      if (allCallbacks) {
        allCallbacks.forEach(callback => {
          try {
            callback(parsedEvent)
          } catch (error) {
            console.error('SSE: Error in all event callback:', error)
          }
        })
      }

    } catch (error) {
      console.error('SSE: Error parsing event:', error)
    }
  }

  /**
   * Update connection state and notify subscribers
   */
  private updateConnectionState(updates: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates }
    
    // Notify all state subscribers
    this.stateSubscribers.forEach(callback => {
      try {
        callback(this.connectionState)
      } catch (error) {
        console.error('SSE: Error in state callback:', error)
      }
    })
  }
}

export default GlobalSSEManager