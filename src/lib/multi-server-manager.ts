import { ServerConfig, ServerConnection, ServerStats, MultiServerManager } from '@/types/server-config';

export class MultiServerManagerImpl implements MultiServerManager {
  public servers: Map<string, ServerConfig> = new Map();
  public connections: Map<string, ServerConnection> = new Map();
  public stats: Map<string, ServerStats> = new Map();
  
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.loadConfiguration();
    this.startHealthChecking();
  }

  // Server Management
  async addServer(config: Omit<ServerConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServerConfig> {
    const id = this.generateServerId();
    const now = new Date();
    
    const serverConfig: ServerConfig = {
      ...config,
      id,
      baseUrl: `${config.protocol}://${config.hostname}:${config.port}`,
      createdAt: now,
      updatedAt: now,
    };

    this.servers.set(id, serverConfig);
    await this.persistConfiguration();
    
    // Start health checking for this server
    this.startServerHealthCheck(id);
    
    return serverConfig;
  }

  async updateServer(id: string, updates: Partial<ServerConfig>): Promise<ServerConfig> {
    const server = this.servers.get(id);
    if (!server) {
      throw new Error(`Server ${id} not found`);
    }

    const updatedServer: ServerConfig = {
      ...server,
      ...updates,
      updatedAt: new Date(),
      baseUrl: updates.hostname || updates.port || updates.protocol 
        ? `${updates.protocol || server.protocol}://${updates.hostname || server.hostname}:${updates.port || server.port}`
        : server.baseUrl
    };

    this.servers.set(id, updatedServer);
    await this.persistConfiguration();
    
    return updatedServer;
  }

  async removeServer(id: string): Promise<boolean> {
    const server = this.servers.get(id);
    if (!server) return false;

    // Stop health checking
    this.stopServerHealthCheck(id);
    
    // Disconnect all accounts from this server
    const serverConnections = Array.from(this.connections.values())
      .filter(conn => conn.serverId === id);
    
    for (const connection of serverConnections) {
      await this.disconnectAccount(id, connection.accountId);
    }

    this.servers.delete(id);
    this.stats.delete(id);
    await this.persistConfiguration();
    
    return true;
  }

  getServer(id: string): ServerConfig | null {
    return this.servers.get(id) || null;
  }

  listServers(filters?: Partial<ServerConfig>): ServerConfig[] {
    const servers = Array.from(this.servers.values());
    
    if (!filters) return servers;

    return servers.filter(server => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined) return true;
        const serverValue = server[key as keyof ServerConfig];
        return serverValue === value;
      });
    });
  }

  // Connection Management
  async connectAccount(serverId: string, accountName: string): Promise<ServerConnection> {
    const server = this.getServer(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    if (!server.isEnabled || server.status !== 'active') {
      throw new Error(`Server ${serverId} is not available`);
    }

    const accountId = accountName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const connectionId = `${serverId}-${accountId}`;

    try {
      // Make API call to connect account
      const response = await this.makeServerRequest(server, 'POST', '/api/accounts/connect', {
        id: accountId,
        name: accountName
      });

      if (!response.ok) {
        throw new Error(`Failed to connect account: ${response.statusText}`);
      }

      const result = await response.json();
      
      const connection: ServerConnection = {
        id: connectionId,
        serverId,
        accountId,
        accountName,
        status: result.qrCode ? 'qr_required' : 'connecting',
        connectionId: result.connectionId,
        qrCode: result.qrCode,
        messageCount: 0,
        errorCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.connections.set(connectionId, connection);
      return connection;

    } catch (error) {
      // Create error connection record
      const connection: ServerConnection = {
        id: connectionId,
        serverId,
        accountId,
        accountName,
        status: 'error',
        messageCount: 0,
        errorCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.connections.set(connectionId, connection);
      throw error;
    }
  }

  async disconnectAccount(serverId: string, accountId: string): Promise<boolean> {
    const server = this.getServer(serverId);
    if (!server) return false;

    const connectionId = `${serverId}-${accountId}`;
    const connection = this.connections.get(connectionId);
    
    if (!connection) return false;

    try {
      const response = await this.makeServerRequest(server, 'POST', '/api/accounts/disconnect', {
        id: accountId
      });

      if (response.ok) {
        connection.status = 'disconnected';
        connection.disconnectedAt = new Date();
        connection.updatedAt = new Date();
        
        this.connections.set(connectionId, connection);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to disconnect account ${accountId} from server ${serverId}:`, error);
      return false;
    }
  }

  async getQRCode(serverId: string, accountId: string): Promise<string> {
    const server = this.getServer(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    const response = await this.makeServerRequest(server, 'GET', `/api/accounts/${accountId}/qr`);
    
    if (!response.ok) {
      throw new Error(`Failed to get QR code: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update connection with QR code
    const connectionId = `${serverId}-${accountId}`;
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.qrCode = result.qrCode;
      connection.status = 'qr_required';
      connection.updatedAt = new Date();
      this.connections.set(connectionId, connection);
    }

    return result.qrCode;
  }

  // Health Monitoring
  async checkServerHealth(serverId: string): Promise<boolean> {
    const server = this.getServer(serverId);
    if (!server) return false;

    try {
      const response = await this.makeServerRequest(server, 'GET', server.healthCheckEndpoint, null, {
        timeout: 5000 // 5 second timeout for health checks
      });

      const isHealthy = response.ok;
      const now = new Date();

      // Update server status
      server.status = isHealthy ? 'active' : 'error';
      server.lastHealthCheck = now;
      server.updatedAt = now;

      if (isHealthy) {
        server.lastConnection = now;
        
        // Get and store stats if available
        try {
          const healthData = await response.json();
          await this.updateServerStats(serverId, healthData);
        } catch (e) {
          // Health endpoint might not return JSON
        }
      }

      this.servers.set(serverId, server);
      return isHealthy;

    } catch (error) {
      console.error(`Health check failed for server ${serverId}:`, error);
      
      server.status = 'error';
      server.lastHealthCheck = new Date();
      server.updatedAt = new Date();
      this.servers.set(serverId, server);
      
      return false;
    }
  }

  async checkAllServers(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    const servers = Array.from(this.servers.keys());

    const healthChecks = servers.map(async (serverId) => {
      const isHealthy = await this.checkServerHealth(serverId);
      results.set(serverId, isHealthy);
      return { serverId, isHealthy };
    });

    await Promise.all(healthChecks);
    return results;
  }

  async getServerStats(serverId: string): Promise<ServerStats | null> {
    return this.stats.get(serverId) || null;
  }

  // Load Balancing
  getAvailableServer(criteria?: {
    environment?: string;
    location?: string;
    minCapacity?: number;
  }): ServerConfig | null {
    let candidates = this.listServers({
      isEnabled: true,
      status: 'active' as const
    });

    if (criteria) {
      candidates = candidates.filter(server => {
        if (criteria.environment && server.environment !== criteria.environment) return false;
        if (criteria.location && server.location !== criteria.location) return false;
        if (criteria.minCapacity) {
          const stats = this.stats.get(server.id);
          const currentCapacity = stats ? stats.totalUsers : 0;
          const availableCapacity = server.maxInstances * server.maxUsersPerInstance - currentCapacity;
          if (availableCapacity < criteria.minCapacity) return false;
        }
        return true;
      });
    }

    if (candidates.length === 0) return null;

    // Sort by priority (higher first) then by weight (higher first) then by current load (lower first)
    candidates.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (a.weight !== b.weight) return b.weight - a.weight;
      
      const aStats = this.stats.get(a.id);
      const bStats = this.stats.get(b.id);
      const aLoad = aStats ? aStats.totalUsers / (a.maxInstances * a.maxUsersPerInstance) : 0;
      const bLoad = bStats ? bStats.totalUsers / (b.maxInstances * b.maxUsersPerInstance) : 0;
      
      return aLoad - bLoad;
    });

    return candidates[0];
  }

  // Bulk Operations
  async executeOnAllServers<T>(operation: (server: ServerConfig) => Promise<T>): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    const servers = Array.from(this.servers.values()).filter(s => s.isEnabled);

    const operations = servers.map(async (server) => {
      try {
        const result = await operation(server);
        results.set(server.id, result);
      } catch (error) {
        console.error(`Operation failed for server ${server.id}:`, error);
        throw error;
      }
    });

    await Promise.allSettled(operations);
    return results;
  }

  async migrateAccounts(fromServerId: string, toServerId: string): Promise<boolean> {
    const fromServer = this.getServer(fromServerId);
    const toServer = this.getServer(toServerId);

    if (!fromServer || !toServer) {
      throw new Error('Source or destination server not found');
    }

    const connectionsToMigrate = Array.from(this.connections.values())
      .filter(conn => conn.serverId === fromServerId && conn.status === 'connected');

    let successCount = 0;

    for (const connection of connectionsToMigrate) {
      try {
        // Disconnect from source
        await this.disconnectAccount(fromServerId, connection.accountId);
        
        // Connect to destination
        await this.connectAccount(toServerId, connection.accountName);
        
        successCount++;
      } catch (error) {
        console.error(`Failed to migrate account ${connection.accountId}:`, error);
      }
    }

    return successCount === connectionsToMigrate.length;
  }

  // Private Methods
  private generateServerId(): string {
    return `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async makeServerRequest(
    server: ServerConfig,
    method: string,
    endpoint: string,
    body?: any,
    options?: { timeout?: number }
  ): Promise<Response> {
    const url = `${server.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (server.apiKey) {
      headers['Authorization'] = `Bearer ${server.apiKey}`;
    }

    const controller = new AbortController();
    const timeout = options?.timeout || server.requestTimeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async updateServerStats(serverId: string, healthData: any): Promise<void> {
    const stats: ServerStats = {
      id: `${serverId}_${Date.now()}`,
      serverId,
      timestamp: new Date(),
      cpu: healthData.cpu || 0,
      memory: healthData.memory?.usage || 0,
      storage: healthData.storage || 0,
      network: healthData.network || 0,
      activeInstances: healthData.accounts?.total || 0,
      totalUsers: healthData.users?.total || 0,
      messagesPerMinute: healthData.messages?.perMinute || 0,
      errorRate: healthData.errors?.rate || 0,
      averageResponseTime: healthData.performance?.avgResponseTime || 0,
      p95ResponseTime: healthData.performance?.p95ResponseTime || 0,
      p99ResponseTime: healthData.performance?.p99ResponseTime || 0,
      uptime: healthData.uptime || 0,
      isHealthy: true,
    };

    this.stats.set(serverId, stats);
  }

  private loadConfiguration(): void {
    // Load from localStorage or database
    try {
      const savedConfig = localStorage.getItem('multiServerConfig');
      if (savedConfig) {
        const data = JSON.parse(savedConfig);
        
        // Reconstruct Maps
        if (data.servers) {
          this.servers = new Map(Object.entries(data.servers));
        }
        if (data.connections) {
          this.connections = new Map(Object.entries(data.connections));
        }
        if (data.stats) {
          this.stats = new Map(Object.entries(data.stats));
        }
      }
    } catch (error) {
      console.error('Failed to load server configuration:', error);
    }
  }

  private async persistConfiguration(): Promise<void> {
    try {
      const data = {
        servers: Object.fromEntries(this.servers),
        connections: Object.fromEntries(this.connections),
        stats: Object.fromEntries(this.stats),
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('multiServerConfig', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist server configuration:', error);
    }
  }

  private startHealthChecking(): void {
    // Check all servers every 30 seconds
    setInterval(() => {
      this.checkAllServers();
    }, 30000);
  }

  private startServerHealthCheck(serverId: string): void {
    const server = this.getServer(serverId);
    if (!server) return;

    const interval = setInterval(() => {
      this.checkServerHealth(serverId);
    }, server.healthCheckInterval);

    this.healthCheckIntervals.set(serverId, interval);
  }

  private stopServerHealthCheck(serverId: string): void {
    const interval = this.healthCheckIntervals.get(serverId);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(serverId);
    }
  }
}

// Singleton instance
export const multiServerManager = new MultiServerManagerImpl();