import { NextRequest } from 'next/server'

interface WhatsAppEvent {
  type: 'queue-update' | 'message-sent' | 'device-status' | 'stats-update'
  data: any
  timestamp: string
}

class WhatsAppEventStreamer {
  private static instance: WhatsAppEventStreamer
  private clients: Map<string, ReadableStreamDefaultController> = new Map()
  private eventQueue: WhatsAppEvent[] = []

  static getInstance() {
    if (!this.instance) {
      this.instance = new WhatsAppEventStreamer()
    }
    return this.instance
  }

  addClient(clientId: string, controller: ReadableStreamDefaultController) {
    this.clients.set(clientId, controller)
    
    // Send any queued events to new client
    this.eventQueue.forEach(event => {
      this.sendToClient(clientId, event)
    })
  }

  removeClient(clientId: string) {
    const controller = this.clients.get(clientId)
    if (controller) {
      try {
        controller.close()
      } catch (e) {
        // Controller might already be closed
      }
    }
    this.clients.delete(clientId)
  }

  private sendToClient(clientId: string, event: WhatsAppEvent) {
    const controller = this.clients.get(clientId)
    if (controller) {
      try {
        const eventData = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(new TextEncoder().encode(eventData))
      } catch (error) {
        // Client disconnected, remove it
        this.removeClient(clientId)
      }
    }
  }

  broadcast(event: WhatsAppEvent) {
    // Add to queue for new clients (keep last 10 events)
    this.eventQueue.push(event)
    if (this.eventQueue.length > 10) {
      this.eventQueue.shift()
    }

    // Send to all connected clients
    for (const clientId of this.clients.keys()) {
      this.sendToClient(clientId, event)
    }
  }

  // Public methods to send specific events
  sendQueueUpdate(queueData: any) {
    this.broadcast({
      type: 'queue-update',
      data: queueData,
      timestamp: new Date().toISOString()
    })
  }

  sendMessageSent(messageData: any) {
    this.broadcast({
      type: 'message-sent', 
      data: messageData,
      timestamp: new Date().toISOString()
    })
  }

  sendDeviceStatus(deviceData: any) {
    this.broadcast({
      type: 'device-status',
      data: deviceData,
      timestamp: new Date().toISOString()
    })
  }

  sendStatsUpdate(statsData: any) {
    this.broadcast({
      type: 'stats-update',
      data: statsData,
      timestamp: new Date().toISOString()
    })
  }
}

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('clientId') || 
    `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const stream = new ReadableStream({
    start(controller) {
      // Set up SSE headers
      controller.enqueue(new TextEncoder().encode('data: {"type":"connected","timestamp":"' + new Date().toISOString() + '"}\n\n'))
      
      // Add client to streamer
      const streamer = WhatsAppEventStreamer.getInstance()
      streamer.addClient(clientId, controller)
    },
    cancel() {
      // Clean up when client disconnects
      const streamer = WhatsAppEventStreamer.getInstance()
      streamer.removeClient(clientId)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

// Export the streamer instance for use in other API routes
export { WhatsAppEventStreamer }