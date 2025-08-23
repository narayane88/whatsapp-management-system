import fs from 'fs'
import path from 'path'

export interface WhatsAppServer {
  id: string
  name: string
  hostname: string
  port: number
  url: string
  environment: 'development' | 'production' | 'testing' | 'staging'
  location: string
  status: 'active' | 'inactive' | 'maintenance' | 'error'
  maxInstances: number
  priority: number
  features: string[]
  healthEndpoint: string
  statsEndpoint: string
  accountsEndpoint: string
  description: string
  connectionTimeout: number
  retryAttempts: number
  loadBalancing: {
    enabled: boolean
    weight: number
  }
  currentInstances?: number
  responseTime?: number
  lastHealthCheck?: string
  uptime?: number
}

export interface ServerConfiguration {
  servers: WhatsAppServer[]
  configuration: {
    loadBalancing: {
      enabled: boolean
      algorithm: string
      healthCheckInterval: number
      failoverTimeout: number
    }
    monitoring: {
      enabled: boolean
      healthCheckInterval: number
      alertThresholds: {
        responseTime: number
        errorRate: number
        capacity: number
      }
    }
    defaults: {
      connectionTimeout: number
      retryAttempts: number
      maxInstances: number
    }
    environments: {
      [key: string]: {
        autoFailover: boolean
        strictMode: boolean
      }
    }
  }
  lastUpdated: string
  version: string
}

export class WhatsAppServerManager {
  private configPath: string
  private config: ServerConfiguration | null = null

  constructor() {
    this.configPath = path.join(process.cwd(), 'config', 'whatsapp-servers.json')
  }

  /**
   * Load server configuration from JSON file
   */
  async loadConfiguration(): Promise<ServerConfiguration> {
    if (this.config) {
      return this.config
    }

    try {
      const configData = fs.readFileSync(this.configPath, 'utf8')
      this.config = JSON.parse(configData)
      return this.config!
    } catch (error) {
      console.error('Failed to load WhatsApp server configuration:', error)
      throw new Error('Server configuration file not found or invalid')
    }
  }

  /**
   * Save configuration to JSON file
   */
  async saveConfiguration(config: ServerConfiguration): Promise<void> {
    try {
      const configData = JSON.stringify(config, null, 2)
      fs.writeFileSync(this.configPath, configData, 'utf8')
      this.config = config
    } catch (error) {
      console.error('Failed to save WhatsApp server configuration:', error)
      throw new Error('Failed to save server configuration')
    }
  }

  /**
   * Get all servers
   */
  async getAllServers(): Promise<WhatsAppServer[]> {
    const config = await this.loadConfiguration()
    return config.servers
  }

  /**
   * Get active servers only
   */
  async getActiveServers(): Promise<WhatsAppServer[]> {
    const servers = await this.getAllServers()
    return servers.filter(server => server.status === 'active')
  }

  /**
   * Get servers by environment
   */
  async getServersByEnvironment(environment: string): Promise<WhatsAppServer[]> {
    const servers = await this.getAllServers()
    return servers.filter(server => server.environment === environment)
  }

  /**
   * Get server by ID
   */
  async getServerById(id: string): Promise<WhatsAppServer | null> {
    const servers = await this.getAllServers()
    return servers.find(server => server.id === id) || null
  }

  /**
   * Get optimal server based on load balancing
   */
  async getOptimalServer(): Promise<WhatsAppServer | null> {
    const config = await this.loadConfiguration()
    const activeServers = await this.getActiveServers()

    if (activeServers.length === 0) {
      return null
    }

    if (!config.configuration.loadBalancing.enabled) {
      // Return highest priority server
      return activeServers.sort((a, b) => a.priority - b.priority)[0]
    }

    // Weighted round-robin selection
    const totalWeight = activeServers.reduce((sum, server) => sum + server.loadBalancing.weight, 0)
    if (totalWeight === 0) {
      return activeServers[0]
    }

    // Simple weighted selection (in production, this would maintain state)
    const random = Math.random() * totalWeight
    let weightSum = 0
    
    for (const server of activeServers) {
      weightSum += server.loadBalancing.weight
      if (random <= weightSum) {
        return server
      }
    }

    return activeServers[0]
  }

  /**
   * Health check for a specific server
   */
  async healthCheck(server: WhatsAppServer): Promise<{
    status: 'healthy' | 'unhealthy' | 'timeout'
    responseTime: number
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), server.connectionTimeout)

      const response = await fetch(`${server.url}${server.healthEndpoint}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      if (response.ok) {
        return { status: 'healthy', responseTime }
      } else {
        return { 
          status: 'unhealthy', 
          responseTime, 
          error: `HTTP ${response.status}` 
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { status: 'timeout', responseTime, error: 'Request timeout' }
      }
      
      return { 
        status: 'unhealthy', 
        responseTime, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Health check all active servers
   */
  async healthCheckAll(): Promise<Map<string, {
    server: WhatsAppServer
    health: {
      status: 'healthy' | 'unhealthy' | 'timeout'
      responseTime: number
      error?: string
    }
  }>> {
    const activeServers = await this.getActiveServers()
    const results = new Map()

    const healthChecks = activeServers.map(async (server) => {
      const health = await this.healthCheck(server)
      return { server, health }
    })

    const healthResults = await Promise.all(healthChecks)
    
    healthResults.forEach(result => {
      results.set(result.server.id, result)
    })

    return results
  }

  /**
   * Add a new server
   */
  async addServer(server: Omit<WhatsAppServer, 'id'>): Promise<WhatsAppServer> {
    const config = await this.loadConfiguration()
    const newServer: WhatsAppServer = {
      ...server,
      id: `server-${Date.now()}`
    }

    config.servers.push(newServer)
    config.lastUpdated = new Date().toISOString()
    
    await this.saveConfiguration(config)
    return newServer
  }

  /**
   * Update a server
   */
  async updateServer(id: string, updates: Partial<WhatsAppServer>): Promise<WhatsAppServer | null> {
    const config = await this.loadConfiguration()
    const serverIndex = config.servers.findIndex(server => server.id === id)
    
    if (serverIndex === -1) {
      return null
    }

    config.servers[serverIndex] = { ...config.servers[serverIndex], ...updates }
    config.lastUpdated = new Date().toISOString()
    
    await this.saveConfiguration(config)
    return config.servers[serverIndex]
  }

  /**
   * Remove a server
   */
  async removeServer(id: string): Promise<boolean> {
    const config = await this.loadConfiguration()
    const initialLength = config.servers.length
    
    config.servers = config.servers.filter(server => server.id !== id)
    
    if (config.servers.length !== initialLength) {
      config.lastUpdated = new Date().toISOString()
      await this.saveConfiguration(config)
      return true
    }
    
    return false
  }

  /**
   * Update server status
   */
  async updateServerStatus(id: string, status: WhatsAppServer['status']): Promise<void> {
    await this.updateServer(id, { status })
  }

  /**
   * Get configuration
   */
  async getConfiguration(): Promise<ServerConfiguration> {
    return await this.loadConfiguration()
  }

  /**
   * Update configuration
   */
  async updateConfiguration(updates: Partial<ServerConfiguration>): Promise<void> {
    const config = await this.loadConfiguration()
    const updatedConfig = { ...config, ...updates, lastUpdated: new Date().toISOString() }
    await this.saveConfiguration(updatedConfig)
  }
}

// Singleton instance
export const whatsappServerManager = new WhatsAppServerManager()

// Utility functions
export async function getAvailableServers(): Promise<WhatsAppServer[]> {
  return await whatsappServerManager.getActiveServers()
}

export async function getOptimalServer(): Promise<WhatsAppServer | null> {
  return await whatsappServerManager.getOptimalServer()
}

export async function getServerById(id: string): Promise<WhatsAppServer | null> {
  return await whatsappServerManager.getServerById(id)
}

export async function healthCheckServers(): Promise<Map<string, any>> {
  return await whatsappServerManager.healthCheckAll()
}