import { ServerConfig, ServerConnection, ServerStats } from '@/types/server-config';
import { multiServerManager } from '@/lib/multi-server-manager';

export interface DatabaseConnection {
  query(text: string, params?: any[]): Promise<any>;
  transaction<T>(callback: (client: DatabaseConnection) => Promise<T>): Promise<T>;
}

export class ServerConnectionService {
  constructor(private db: DatabaseConnection) {}

  // Server Configuration Management
  async createServer(config: Omit<ServerConfig, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<ServerConfig> {
    const query = `
      INSERT INTO server_configs (
        name, description, hostname, ip_address, port, protocol, base_url, api_key,
        environment, location, region, timezone, connection_timeout, request_timeout,
        max_retries, retry_delay, health_check_interval, health_check_endpoint,
        max_instances, max_users_per_instance, messaging_rate_limit, status, is_enabled,
        require_authentication, allowed_ips, ssl_verification, tags, priority, weight,
        created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $30
      ) RETURNING *
    `;

    const baseUrl = `${config.protocol}://${config.hostname}:${config.port}`;

    const result = await this.db.query(query, [
      config.name, config.description, config.hostname, config.ipAddress, config.port,
      config.protocol, baseUrl, config.apiKey, config.environment, config.location,
      config.region, config.timezone, config.connectionTimeout, config.requestTimeout,
      config.maxRetries, config.retryDelay, config.healthCheckInterval, config.healthCheckEndpoint,
      config.maxInstances, config.maxUsersPerInstance, config.messagingRateLimit,
      config.status, config.isEnabled, config.requireAuthentication, config.allowedIPs,
      config.sslVerification, config.tags, config.priority, config.weight, userId
    ]);

    const dbServer = result.rows[0];
    const serverConfig = this.mapDbToServerConfig(dbServer);

    // Add to in-memory manager
    await multiServerManager.addServer(serverConfig);

    // Log the event
    await this.logServerEvent(serverConfig.id, 'server_created', 'info', 'Server configuration created', { userId });

    return serverConfig;
  }

  async updateServer(id: string, updates: Partial<ServerConfig>, userId: string): Promise<ServerConfig> {
    const existingServer = await this.getServer(id);
    if (!existingServer) {
      throw new Error(`Server ${id} not found`);
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    const updateableFields = [
      'name', 'description', 'hostname', 'ip_address', 'port', 'protocol', 'api_key',
      'environment', 'location', 'region', 'timezone', 'connection_timeout', 'request_timeout',
      'max_retries', 'retry_delay', 'health_check_interval', 'health_check_endpoint',
      'max_instances', 'max_users_per_instance', 'messaging_rate_limit', 'status', 'is_enabled',
      'require_authentication', 'allowed_ips', 'ssl_verification', 'tags', 'priority', 'weight'
    ];

    for (const [key, value] of Object.entries(updates)) {
      const dbField = this.camelToSnake(key);
      if (updateableFields.includes(dbField) && value !== undefined) {
        updateFields.push(`${dbField} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return existingServer;
    }

    // Update base_url if hostname, port, or protocol changed
    if (updates.hostname || updates.port || updates.protocol) {
      const hostname = updates.hostname || existingServer.hostname;
      const port = updates.port || existingServer.port;
      const protocol = updates.protocol || existingServer.protocol;
      updateFields.push(`base_url = $${paramIndex}`);
      updateValues.push(`${protocol}://${hostname}:${port}`);
      paramIndex++;
    }

    updateFields.push(`updated_by = $${paramIndex}`);
    updateValues.push(userId);

    const query = `
      UPDATE server_configs 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await this.db.query(query, [...updateValues, id]);
    
    if (result.rows.length === 0) {
      throw new Error(`Server ${id} not found`);
    }

    const serverConfig = this.mapDbToServerConfig(result.rows[0]);

    // Update in-memory manager
    await multiServerManager.updateServer(id, updates);

    // Log the event
    await this.logServerEvent(id, 'server_updated', 'info', 'Server configuration updated', { userId, updates });

    return serverConfig;
  }

  async deleteServer(id: string, userId: string): Promise<boolean> {
    return await this.db.transaction(async (client) => {
      // First disconnect all accounts
      await client.query(
        'UPDATE server_connections SET status = $1, disconnected_at = NOW() WHERE server_id = $2',
        ['disconnected', id]
      );

      // Log the deletion
      await this.logServerEvent(id, 'server_deleted', 'warning', 'Server configuration deleted', { userId });

      // Delete the server (cascade will handle related records)
      const result = await client.query('DELETE FROM server_configs WHERE id = $1', [id]);

      // Remove from in-memory manager
      await multiServerManager.removeServer(id);

      return result.rowCount > 0;
    });
  }

  async getServer(id: string): Promise<ServerConfig | null> {
    const result = await this.db.query('SELECT * FROM server_configs WHERE id = $1', [id]);
    return result.rows.length > 0 ? this.mapDbToServerConfig(result.rows[0]) : null;
  }

  async listServers(filters?: {
    environment?: string;
    location?: string;
    status?: string;
    isEnabled?: boolean;
  }): Promise<ServerConfig[]> {
    let query = 'SELECT * FROM server_configs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.environment) {
      query += ` AND environment = $${paramIndex}`;
      params.push(filters.environment);
      paramIndex++;
    }

    if (filters?.location) {
      query += ` AND location = $${paramIndex}`;
      params.push(filters.location);
      paramIndex++;
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.isEnabled !== undefined) {
      query += ` AND is_enabled = $${paramIndex}`;
      params.push(filters.isEnabled);
      paramIndex++;
    }

    query += ' ORDER BY priority DESC, weight DESC, name ASC';

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapDbToServerConfig(row));
  }

  // Connection Management
  async createConnection(
    serverId: string, 
    accountId: string, 
    accountName: string
  ): Promise<ServerConnection> {
    const query = `
      INSERT INTO server_connections (server_id, account_id, account_name, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (server_id, account_id) 
      DO UPDATE SET 
        account_name = EXCLUDED.account_name,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await this.db.query(query, [serverId, accountId, accountName, 'connecting']);
    const connection = this.mapDbToServerConnection(result.rows[0]);

    await this.logServerEvent(serverId, 'account_connecting', 'info', 'WhatsApp account connecting', {
      accountId, accountName
    }, connection.id);

    return connection;
  }

  async updateConnectionStatus(
    serverId: string,
    accountId: string,
    status: ServerConnection['status'],
    metadata?: {
      qrCode?: string;
      phoneNumber?: string;
      businessName?: string;
      profilePictureUrl?: string;
    }
  ): Promise<ServerConnection | null> {
    const updateFields = ['status = $3'];
    const params = [serverId, accountId, status];
    let paramIndex = 4;

    if (status === 'connected') {
      updateFields.push(`connected_at = NOW()`);
      updateFields.push(`disconnected_at = NULL`);
    } else if (status === 'disconnected') {
      updateFields.push(`disconnected_at = NOW()`);
    }

    if (metadata?.qrCode) {
      updateFields.push(`qr_code = $${paramIndex}`);
      params.push(metadata.qrCode);
      paramIndex++;
    }

    if (metadata?.phoneNumber) {
      updateFields.push(`phone_number = $${paramIndex}`);
      params.push(metadata.phoneNumber);
      paramIndex++;
    }

    if (metadata?.businessName) {
      updateFields.push(`business_name = $${paramIndex}`);
      params.push(metadata.businessName);
      paramIndex++;
    }

    if (metadata?.profilePictureUrl) {
      updateFields.push(`profile_picture_url = $${paramIndex}`);
      params.push(metadata.profilePictureUrl);
      paramIndex++;
    }

    updateFields.push('last_activity = NOW()');

    const query = `
      UPDATE server_connections 
      SET ${updateFields.join(', ')}
      WHERE server_id = $1 AND account_id = $2
      RETURNING *
    `;

    const result = await this.db.query(query, params);
    
    if (result.rows.length === 0) return null;

    const connection = this.mapDbToServerConnection(result.rows[0]);

    // Log the status change
    await this.logServerEvent(serverId, `account_${status}`, 'info', `Account status changed to ${status}`, {
      accountId, metadata
    }, connection.id);

    return connection;
  }

  async getConnection(serverId: string, accountId: string): Promise<ServerConnection | null> {
    const result = await this.db.query(
      'SELECT * FROM server_connections WHERE server_id = $1 AND account_id = $2',
      [serverId, accountId]
    );

    return result.rows.length > 0 ? this.mapDbToServerConnection(result.rows[0]) : null;
  }

  async listConnections(serverId?: string, status?: string): Promise<ServerConnection[]> {
    let query = 'SELECT * FROM server_connections WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (serverId) {
      query += ` AND server_id = $${paramIndex}`;
      params.push(serverId);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.db.query(query, params);
    return result.rows.map(row => this.mapDbToServerConnection(row));
  }

  // Statistics Management
  async recordServerStats(serverId: string, stats: Omit<ServerStats, 'id' | 'serverId' | 'timestamp'>): Promise<void> {
    const query = `
      INSERT INTO server_stats (
        server_id, cpu_usage, memory_usage, storage_usage, network_usage,
        active_instances, total_users, messages_per_minute, error_rate,
        average_response_time, p95_response_time, p99_response_time,
        uptime_seconds, is_healthy, last_error
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `;

    await this.db.query(query, [
      serverId, stats.cpu, stats.memory, stats.storage, stats.network,
      stats.activeInstances, stats.totalUsers, stats.messagesPerMinute, stats.errorRate,
      stats.averageResponseTime, stats.p95ResponseTime, stats.p99ResponseTime,
      stats.uptime, stats.isHealthy, stats.lastError
    ]);
  }

  async getLatestServerStats(serverId: string): Promise<ServerStats | null> {
    const result = await this.db.query(
      'SELECT * FROM server_stats WHERE server_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [serverId]
    );

    return result.rows.length > 0 ? this.mapDbToServerStats(result.rows[0]) : null;
  }

  async getServerStatsHistory(
    serverId: string, 
    hours: number = 24
  ): Promise<ServerStats[]> {
    const result = await this.db.query(
      `SELECT * FROM server_stats 
       WHERE server_id = $1 AND timestamp > NOW() - INTERVAL '${hours} hours'
       ORDER BY timestamp DESC`,
      [serverId]
    );

    return result.rows.map(row => this.mapDbToServerStats(row));
  }

  // Health Monitoring
  async updateServerHealth(
    serverId: string, 
    isHealthy: boolean, 
    error?: string
  ): Promise<void> {
    await this.db.query(
      `UPDATE server_configs 
       SET last_health_check = NOW(), status = $2
       WHERE id = $1`,
      [serverId, isHealthy ? 'active' : 'error']
    );

    if (!isHealthy && error) {
      await this.logServerEvent(serverId, 'health_check_failed', 'error', error);
    }
  }

  // Event Logging
  async logServerEvent(
    serverId: string,
    eventType: string,
    eventLevel: 'debug' | 'info' | 'warning' | 'error' | 'critical',
    message: string,
    data?: any,
    connectionId?: string
  ): Promise<void> {
    const query = `
      INSERT INTO server_events (server_id, connection_id, event_type, event_level, event_message, event_data)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await this.db.query(query, [
      serverId, connectionId, eventType, eventLevel, message, 
      data ? JSON.stringify(data) : null
    ]);
  }

  async getServerEvents(
    serverId: string,
    limit: number = 100,
    eventLevel?: string
  ): Promise<any[]> {
    let query = `
      SELECT * FROM server_events 
      WHERE server_id = $1
    `;
    const params = [serverId];

    if (eventLevel) {
      query += ' AND event_level = $2';
      params.push(eventLevel);
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit}`;

    const result = await this.db.query(query, params);
    return result.rows;
  }

  // Utility Methods
  private mapDbToServerConfig(row: any): ServerConfig {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      hostname: row.hostname,
      ipAddress: row.ip_address,
      port: row.port,
      protocol: row.protocol,
      baseUrl: row.base_url,
      apiKey: row.api_key,
      environment: row.environment,
      location: row.location,
      region: row.region,
      timezone: row.timezone,
      connectionTimeout: row.connection_timeout,
      requestTimeout: row.request_timeout,
      maxRetries: row.max_retries,
      retryDelay: row.retry_delay,
      healthCheckInterval: row.health_check_interval,
      healthCheckEndpoint: row.health_check_endpoint,
      maxInstances: row.max_instances,
      maxUsersPerInstance: row.max_users_per_instance,
      messagingRateLimit: row.messaging_rate_limit,
      status: row.status,
      isEnabled: row.is_enabled,
      lastHealthCheck: row.last_health_check,
      lastConnection: row.last_connection,
      requireAuthentication: row.require_authentication,
      allowedIPs: row.allowed_ips,
      sslVerification: row.ssl_verification,
      tags: row.tags || [],
      priority: row.priority,
      weight: row.weight,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  private mapDbToServerConnection(row: any): ServerConnection {
    return {
      id: row.id,
      serverId: row.server_id,
      accountId: row.account_id,
      accountName: row.account_name,
      status: row.status,
      connectionId: row.connection_id,
      qrCode: row.qr_code,
      phoneNumber: row.phone_number,
      businessName: row.business_name,
      profilePicture: row.profile_picture_url,
      lastActivity: row.last_activity,
      messageCount: row.message_count,
      errorCount: row.error_count,
      connectedAt: row.connected_at,
      disconnectedAt: row.disconnected_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapDbToServerStats(row: any): ServerStats {
    return {
      id: row.id,
      serverId: row.server_id,
      timestamp: row.timestamp,
      cpu: row.cpu_usage,
      memory: row.memory_usage,
      storage: row.storage_usage,
      network: row.network_usage,
      activeInstances: row.active_instances,
      totalUsers: row.total_users,
      messagesPerMinute: row.messages_per_minute,
      errorRate: row.error_rate,
      averageResponseTime: row.average_response_time,
      p95ResponseTime: row.p95_response_time,
      p99ResponseTime: row.p99_response_time,
      uptime: row.uptime_seconds,
      isHealthy: row.is_healthy,
      lastError: row.last_error
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}