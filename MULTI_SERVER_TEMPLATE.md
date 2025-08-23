# Multi-Server WhatsApp Management Template

## Overview

This template provides a complete solution for managing multiple WhatsApp servers with configurable connections and database storage. The system supports load balancing, health monitoring, and centralized management of WhatsApp instances across multiple servers.

## Architecture

### Core Components

1. **Server Configuration Management** (`src/types/server-config.ts`)
   - Define server configurations with connection settings
   - Support for multiple environments (production, staging, development)
   - Configurable timeouts, rate limits, and capacity settings

2. **Multi-Server Manager** (`src/lib/multi-server-manager.ts`)
   - In-memory management of server configurations
   - Load balancing and failover capabilities
   - Health monitoring and automatic status updates

3. **Database Schema** (`src/lib/database/schema.sql`)
   - PostgreSQL schema for persistent storage
   - Time-series data for server statistics
   - Event logging for audit trails

4. **Server Connection Service** (`src/lib/services/server-connection.service.ts`)
   - Database operations for server management
   - Connection lifecycle management
   - Statistics collection and reporting

## Key Features

### 🔧 Configurable Server Management
- Add/update/remove servers dynamically
- Environment-based configuration (prod/staging/dev)
- Custom connection settings per server
- API key and security configuration

### 📊 Health Monitoring & Statistics
- Real-time health checks with configurable intervals
- Performance metrics (CPU, memory, network)
- Response time tracking (average, P95, P99)
- Automatic failover on health check failures

### 🔄 Load Balancing
- Multiple algorithms: round-robin, weighted, least connections
- Server priority and weight configuration
- Capacity-aware routing
- Automatic server selection based on criteria

### 🔌 WhatsApp Connection Management
- QR code generation and management
- Connection status tracking
- Account migration between servers
- Bulk operations across servers

### 📝 Event Logging & Audit
- Comprehensive event logging
- Multiple log levels (debug, info, warning, error, critical)
- Connection lifecycle events
- Server status changes

## Database Schema

### Main Tables

1. **server_configs** - Server configuration and settings
2. **server_stats** - Time-series performance data
3. **server_connections** - WhatsApp account connections
4. **server_events** - Event logging and audit trail
5. **server_lb_rules** - Load balancing configuration

### Views

- **server_health_status** - Real-time health overview
- **server_capacity_overview** - Capacity utilization metrics

## Usage Examples

### 1. Add a New Server

```typescript
import { multiServerManager } from '@/lib/multi-server-manager';

const serverConfig = await multiServerManager.addServer({
  name: 'WA-Server-Production-01',
  hostname: 'wa-prod-01.company.com',
  ipAddress: '192.168.1.100',
  port: 3001,
  protocol: 'https',
  environment: 'production',
  location: 'US-East',
  connectionTimeout: 30000,
  requestTimeout: 60000,
  maxRetries: 3,
  healthCheckInterval: 30000,
  healthCheckEndpoint: '/api/health',
  maxInstances: 20,
  maxUsersPerInstance: 100,
  messagingRateLimit: 1000,
  isEnabled: true,
  priority: 1,
  weight: 10,
  tags: ['primary', 'high-capacity'],
  createdBy: 'admin',
  updatedBy: 'admin'
});
```

### 2. Connect WhatsApp Account

```typescript
// Get available server
const server = multiServerManager.getAvailableServer({
  environment: 'production',
  minCapacity: 50
});

if (server) {
  const connection = await multiServerManager.connectAccount(
    server.id,
    'Business-Account-01'
  );
  
  console.log('QR Code:', connection.qrCode);
}
```

### 3. Monitor Server Health

```typescript
// Check all servers
const healthResults = await multiServerManager.checkAllServers();

healthResults.forEach((isHealthy, serverId) => {
  const server = multiServerManager.getServer(serverId);
  console.log(`${server?.name}: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
});

// Get server statistics
const stats = await multiServerManager.getServerStats(serverId);
console.log('CPU Usage:', stats?.cpu);
console.log('Memory Usage:', stats?.memory);
console.log('Active Users:', stats?.totalUsers);
```

### 4. Load Balancing

```typescript
// Get server based on criteria
const server = multiServerManager.getAvailableServer({
  environment: 'production',
  location: 'US-East',
  minCapacity: 100
});

// Execute operation on all servers
const results = await multiServerManager.executeOnAllServers(async (server) => {
  const response = await fetch(`${server.baseUrl}/api/stats`);
  return response.json();
});
```

### 5. Database Operations

```typescript
import { ServerConnectionService } from '@/lib/services/server-connection.service';

// Create service instance (with your database connection)
const serverService = new ServerConnectionService(dbConnection);

// List servers by environment
const prodServers = await serverService.listServers({
  environment: 'production',
  isEnabled: true
});

// Get connection history
const connections = await serverService.listConnections(serverId, 'connected');

// Record server statistics
await serverService.recordServerStats(serverId, {
  cpu: 45.2,
  memory: 67.8,
  storage: 34.1,
  network: 23.4,
  activeInstances: 5,
  totalUsers: 450,
  messagesPerMinute: 120,
  errorRate: 0.1,
  averageResponseTime: 150,
  p95ResponseTime: 300,
  p99ResponseTime: 500,
  uptime: 86400,
  isHealthy: true
});
```

## Configuration Examples

### Environment Variables

```env
# Default WhatsApp server settings
WHATSAPP_SERVER_URL=http://localhost:3005
WHATSAPP_CONNECTION_TIMEOUT=30000
WHATSAPP_REQUEST_TIMEOUT=60000
WHATSAPP_HEALTH_CHECK_INTERVAL=30000

# Database configuration
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_manager
```

### Server Configuration JSON

```json
{
  "servers": [
    {
      "name": "WA-Primary",
      "hostname": "wa-primary.company.com",
      "ipAddress": "192.168.1.10",
      "port": 3001,
      "protocol": "https",
      "environment": "production",
      "location": "US-East",
      "priority": 1,
      "weight": 10,
      "maxInstances": 20,
      "maxUsersPerInstance": 100,
      "tags": ["primary", "high-capacity"]
    },
    {
      "name": "WA-Secondary",
      "hostname": "wa-secondary.company.com", 
      "ipAddress": "192.168.1.11",
      "port": 3002,
      "protocol": "https",
      "environment": "production",
      "location": "US-West",
      "priority": 2,
      "weight": 8,
      "maxInstances": 15,
      "maxUsersPerInstance": 100,
      "tags": ["secondary", "backup"]
    }
  ],
  "loadBalancing": {
    "algorithm": "weighted_round_robin",
    "healthCheckRequired": true,
    "failoverEnabled": true
  }
}
```

## API Integration

### Health Check Endpoint

Your WhatsApp servers should implement a health check endpoint:

```javascript
// GET /api/health
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400,
  "version": "1.2.3",
  "accounts": {
    "total": 5,
    "connected": 4,
    "connecting": 1
  },
  "memory": {
    "heapUsed": 150000000,
    "heapTotal": 200000000,
    "rss": 250000000
  },
  "performance": {
    "avgResponseTime": 150,
    "p95ResponseTime": 300,
    "p99ResponseTime": 500
  }
}
```

### Account Management Endpoints

```javascript
// POST /api/accounts/connect
{
  "id": "business-account-01",
  "name": "Business Account 01"
}

// Response
{
  "success": true,
  "connectionId": "conn_123",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "status": "qr_required"
}

// POST /api/accounts/disconnect
{
  "id": "business-account-01"
}

// GET /api/accounts/{id}/qr
{
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

## Setup Instructions

### 1. Database Setup

```bash
# Run the schema creation
psql -d your_database -f src/lib/database/schema.sql

# Verify tables were created
psql -d your_database -c "\dt"
```

### 2. Environment Configuration

Create `.env.local` with your database and server configurations.

### 3. Initialize Multi-Server Manager

```typescript
import { multiServerManager } from '@/lib/multi-server-manager';

// The manager will automatically load configuration from localStorage
// and start health checking
```

### 4. Add Your Servers

Use the provided API or directly add servers through the manager:

```typescript
// Add servers programmatically
const servers = [
  // ... your server configurations
];

for (const config of servers) {
  await multiServerManager.addServer(config);
}
```

## Security Considerations

- **API Keys**: Store server API keys securely
- **IP Filtering**: Configure allowed IPs per server
- **SSL/TLS**: Enable SSL verification for production
- **Authentication**: Require authentication for server access
- **Event Logging**: Monitor all server operations
- **Rate Limiting**: Configure appropriate rate limits

## Monitoring & Alerting

- Set up alerts for server health check failures
- Monitor CPU, memory, and network usage
- Track connection success/failure rates
- Monitor message throughput and error rates
- Set up capacity alerts for overloaded servers

## Scaling Considerations

- **Horizontal Scaling**: Add more servers as needed
- **Load Distribution**: Use weighted load balancing
- **Geographic Distribution**: Deploy servers in multiple regions
- **Capacity Planning**: Monitor usage and plan for growth
- **Database Optimization**: Index frequently queried fields

## Best Practices

1. **Health Checks**: Keep intervals reasonable (30-60 seconds)
2. **Timeouts**: Set appropriate connection and request timeouts
3. **Retry Logic**: Implement exponential backoff for retries
4. **Monitoring**: Log all important events and metrics
5. **Failover**: Test failover scenarios regularly
6. **Capacity**: Monitor and alert on capacity thresholds
7. **Security**: Rotate API keys and review access regularly

This template provides a robust foundation for managing multiple WhatsApp servers with enterprise-grade features including monitoring, load balancing, and comprehensive database storage.