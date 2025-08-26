'use client'

/**
 * Global SSE Connection Manager
 * Ensures only one SSE connection per client exists across the entire application
 */
class SSEConnectionManager {
  private static instance: SSEConnectionManager
  private connections: Map<string, EventSource> = new Map()
  private subscribers: Map<string, Set<(event: MessageEvent) => void>> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()

  static getInstance(): SSEConnectionManager {
    if (!this.instance) {
      this.instance = new SSEConnectionManager()
    }
    return this.instance
  }

  getOrCreateConnection(clientId: string): EventSource {
    console.log(`🔍 getOrCreateConnection called for: ${clientId}`)
    
    // Return existing connection if it exists and is active
    const existing = this.connections.get(clientId)
    if (existing && existing.readyState !== EventSource.CLOSED) {
      console.log(`🔄 Reusing existing SSE connection: ${clientId}`)
      return existing
    }

    // Clean up any closed connection
    if (existing) {
      console.log(`🧹 Cleaning up closed connection: ${clientId}`)
      this.connections.delete(clientId)
    }

    // Create new connection
    console.log(`🆕 Creating new SSE connection: ${clientId}`)
    const eventSource = new EventSource(`/api/customer/whatsapp/events?clientId=${clientId}`)
    
    // Handle connection events
    eventSource.onopen = () => {
      console.log(`✅ SSE connection opened: ${clientId}`)
      // Reset reconnect attempts on successful connection
      this.reconnectAttempts.delete(clientId)
      const timeout = this.reconnectTimeouts.get(clientId)
      if (timeout) {
        clearTimeout(timeout)
        this.reconnectTimeouts.delete(clientId)
      }
    }

    eventSource.onmessage = (event) => {
      // Broadcast to all subscribers
      const subscribers = this.subscribers.get(clientId)
      if (subscribers) {
        subscribers.forEach(callback => {
          try {
            callback(event)
          } catch (error) {
            console.error('Error in SSE subscriber callback:', error)
          }
        })
      }
    }

    eventSource.onerror = () => {
      console.log(`❌ SSE connection error: ${clientId}`)
      // Clean up on error - let the React hook handle reconnection with proper backoff
      this.connections.delete(clientId)
      this.subscribers.delete(clientId)
      this.reconnectAttempts.delete(clientId)
      const timeout = this.reconnectTimeouts.get(clientId)
      if (timeout) {
        clearTimeout(timeout)
        this.reconnectTimeouts.delete(clientId)
      }
    }

    this.connections.set(clientId, eventSource)
    return eventSource
  }

  subscribe(clientId: string, callback: (event: MessageEvent) => void): () => void {
    if (!this.subscribers.has(clientId)) {
      this.subscribers.set(clientId, new Set())
    }
    
    this.subscribers.get(clientId)!.add(callback)
    
    // Don't automatically create connection - let the calling code control when to connect
    // this.getOrCreateConnection(clientId)

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(clientId)
      if (subscribers) {
        subscribers.delete(callback)
        
        // If no more subscribers, close connection
        if (subscribers.size === 0) {
          this.closeConnection(clientId)
        }
      }
    }
  }

  closeConnection(clientId: string): void {
    const connection = this.connections.get(clientId)
    if (connection) {
      console.log(`🔌 Closing SSE connection: ${clientId}`)
      connection.close()
      this.connections.delete(clientId)
    }
    this.subscribers.delete(clientId)
    this.reconnectAttempts.delete(clientId)
    
    // Clear any pending reconnection timeout
    const timeout = this.reconnectTimeouts.get(clientId)
    if (timeout) {
      clearTimeout(timeout)
      this.reconnectTimeouts.delete(clientId)
    }
  }

  closeAllConnections(): void {
    console.log('🔌 Closing all SSE connections')
    this.connections.forEach((connection, clientId) => {
      connection.close()
    })
    this.connections.clear()
    this.subscribers.clear()
    this.reconnectAttempts.clear()
    
    // Clear all pending timeouts
    this.reconnectTimeouts.forEach(timeout => clearTimeout(timeout))
    this.reconnectTimeouts.clear()
  }
}

export default SSEConnectionManager