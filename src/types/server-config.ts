export interface ServerConfig {
  id: string;
  name: string;
  description?: string;
  hostname: string;
  ipAddress: string;
  port: number;
  protocol: 'http' | 'https';
  baseUrl: string;
  apiKey?: string;
  environment: 'production' | 'staging' | 'development' | 'testing';
  location: string;
  region?: string;
  timezone?: string;
  
  // Connection settings
  connectionTimeout: number;
  requestTimeout: number;
  maxRetries: number;
  retryDelay: number;
  
  // Health check settings
  healthCheckInterval: number;
  healthCheckEndpoint: string;
  
  // Capacity and limits
  maxInstances: number;
  maxUsersPerInstance: number;
  messagingRateLimit: number;
  
  // Status and monitoring
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  isEnabled: boolean;
  lastHealthCheck?: Date;
  lastConnection?: Date;
  
  // Security
  requireAuthentication: boolean;
  allowedIPs?: string[];
  sslVerification: boolean;
  
  // Metadata
  tags: string[];
  priority: number;
  weight: number; // For load balancing
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface ServerStats {
  id: string;
  serverId: string;
  timestamp: Date;
  
  // Performance metrics
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  
  // Application metrics
  activeInstances: number;
  totalUsers: number;
  messagesPerMinute: number;
  errorRate: number;
  
  // Response times
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  
  // Health
  uptime: number;
  isHealthy: boolean;
  lastError?: string;
}

export interface ServerConnection {
  id: string;
  serverId: string;
  accountId: string;
  accountName: string;
  
  // Connection details
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'qr_required';
  connectionId?: string;
  qrCode?: string;
  
  // WhatsApp specific
  phoneNumber?: string;
  businessName?: string;
  profilePicture?: string;
  
  // Activity
  lastActivity?: Date;
  messageCount: number;
  errorCount: number;
  
  // Timestamps
  connectedAt?: Date;
  disconnectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultiServerManager {
  servers: Map<string, ServerConfig>;
  connections: Map<string, ServerConnection>;
  stats: Map<string, ServerStats>;
  
  // Server management
  addServer(config: Omit<ServerConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServerConfig>;
  updateServer(id: string, updates: Partial<ServerConfig>): Promise<ServerConfig>;
  removeServer(id: string): Promise<boolean>;
  getServer(id: string): ServerConfig | null;
  listServers(filters?: Partial<ServerConfig>): ServerConfig[];
  
  // Connection management
  connectAccount(serverId: string, accountName: string): Promise<ServerConnection>;
  disconnectAccount(serverId: string, accountId: string): Promise<boolean>;
  getQRCode(serverId: string, accountId: string): Promise<string>;
  
  // Health monitoring
  checkServerHealth(serverId: string): Promise<boolean>;
  checkAllServers(): Promise<Map<string, boolean>>;
  getServerStats(serverId: string): Promise<ServerStats | null>;
  
  // Load balancing
  getAvailableServer(criteria?: {
    environment?: string;
    location?: string;
    minCapacity?: number;
  }): ServerConfig | null;
  
  // Bulk operations
  executeOnAllServers<T>(operation: (server: ServerConfig) => Promise<T>): Promise<Map<string, T>>;
  migrateAccounts(fromServerId: string, toServerId: string): Promise<boolean>;
}