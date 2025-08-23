-- Multi-Server Management Database Schema

-- Server Configurations Table
CREATE TABLE server_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  hostname VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  port INTEGER NOT NULL DEFAULT 3000,
  protocol VARCHAR(10) NOT NULL DEFAULT 'http' CHECK (protocol IN ('http', 'https')),
  base_url VARCHAR(500) NOT NULL,
  api_key VARCHAR(500),
  environment VARCHAR(50) NOT NULL DEFAULT 'development' CHECK (environment IN ('production', 'staging', 'development', 'testing')),
  location VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Connection settings
  connection_timeout INTEGER DEFAULT 30000,
  request_timeout INTEGER DEFAULT 60000,
  max_retries INTEGER DEFAULT 3,
  retry_delay INTEGER DEFAULT 1000,
  
  -- Health check settings
  health_check_interval INTEGER DEFAULT 30000,
  health_check_endpoint VARCHAR(200) DEFAULT '/api/health',
  
  -- Capacity and limits
  max_instances INTEGER DEFAULT 10,
  max_users_per_instance INTEGER DEFAULT 100,
  messaging_rate_limit INTEGER DEFAULT 1000,
  
  -- Status and monitoring
  status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
  is_enabled BOOLEAN DEFAULT true,
  last_health_check TIMESTAMPTZ,
  last_connection TIMESTAMPTZ,
  
  -- Security
  require_authentication BOOLEAN DEFAULT false,
  allowed_ips TEXT[], -- Array of IP addresses
  ssl_verification BOOLEAN DEFAULT true,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 1,
  weight INTEGER DEFAULT 1,
  
  -- Timestamps and audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL
);

-- Server Statistics Table (Time-series data)
CREATE TABLE server_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES server_configs(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Performance metrics
  cpu_usage DECIMAL(5,2) DEFAULT 0,
  memory_usage DECIMAL(5,2) DEFAULT 0,
  storage_usage DECIMAL(5,2) DEFAULT 0,
  network_usage DECIMAL(5,2) DEFAULT 0,
  
  -- Application metrics
  active_instances INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  messages_per_minute INTEGER DEFAULT 0,
  error_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Response times (in milliseconds)
  average_response_time INTEGER DEFAULT 0,
  p95_response_time INTEGER DEFAULT 0,
  p99_response_time INTEGER DEFAULT 0,
  
  -- Health status
  uptime_seconds BIGINT DEFAULT 0,
  is_healthy BOOLEAN DEFAULT true,
  last_error TEXT,
  
  -- Indexing for time-series queries
  CONSTRAINT server_stats_timestamp_idx UNIQUE(server_id, timestamp)
);

-- Server Connections Table (WhatsApp accounts connected to servers)
CREATE TABLE server_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES server_configs(id) ON DELETE CASCADE,
  account_id VARCHAR(100) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  
  -- Connection details
  status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('connecting', 'connected', 'disconnected', 'error', 'qr_required')),
  connection_id VARCHAR(255),
  qr_code TEXT,
  
  -- WhatsApp specific information
  phone_number VARCHAR(20),
  business_name VARCHAR(255),
  profile_picture_url TEXT,
  
  -- Activity tracking
  last_activity TIMESTAMPTZ,
  message_count BIGINT DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  
  -- Connection timestamps
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  
  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate connections
  CONSTRAINT unique_server_account UNIQUE(server_id, account_id)
);

-- Server Events Log Table
CREATE TABLE server_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES server_configs(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES server_connections(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL, -- 'server_start', 'server_stop', 'account_connect', 'account_disconnect', 'health_check_failed', etc.
  event_level VARCHAR(10) NOT NULL DEFAULT 'info' CHECK (event_level IN ('debug', 'info', 'warning', 'error', 'critical')),
  event_message TEXT NOT NULL,
  event_data JSONB,
  
  -- Context
  user_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Server Load Balancing Rules Table
CREATE TABLE server_lb_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  
  -- Rule conditions
  environment VARCHAR(50),
  location VARCHAR(100),
  min_capacity INTEGER,
  max_load_percentage DECIMAL(5,2),
  required_tags TEXT[],
  
  -- Rule behavior
  algorithm VARCHAR(20) DEFAULT 'weighted_round_robin' CHECK (algorithm IN ('round_robin', 'weighted_round_robin', 'least_connections', 'least_load')),
  failover_enabled BOOLEAN DEFAULT true,
  health_check_required BOOLEAN DEFAULT true,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_server_configs_status ON server_configs(status);
CREATE INDEX idx_server_configs_environment ON server_configs(environment);
CREATE INDEX idx_server_configs_location ON server_configs(location);
CREATE INDEX idx_server_configs_is_enabled ON server_configs(is_enabled);

CREATE INDEX idx_server_stats_server_id ON server_stats(server_id);
CREATE INDEX idx_server_stats_timestamp ON server_stats(timestamp DESC);
CREATE INDEX idx_server_stats_server_timestamp ON server_stats(server_id, timestamp DESC);

CREATE INDEX idx_server_connections_server_id ON server_connections(server_id);
CREATE INDEX idx_server_connections_status ON server_connections(status);
CREATE INDEX idx_server_connections_account_id ON server_connections(account_id);

CREATE INDEX idx_server_events_server_id ON server_events(server_id);
CREATE INDEX idx_server_events_connection_id ON server_events(connection_id);
CREATE INDEX idx_server_events_type ON server_events(event_type);
CREATE INDEX idx_server_events_level ON server_events(event_level);
CREATE INDEX idx_server_events_timestamp ON server_events(created_at DESC);

-- Triggers to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_server_configs_updated_at BEFORE UPDATE ON server_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_connections_updated_at BEFORE UPDATE ON server_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_lb_rules_updated_at BEFORE UPDATE ON server_lb_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW server_health_status AS
SELECT 
    sc.id,
    sc.name,
    sc.hostname,
    sc.status,
    sc.is_enabled,
    sc.last_health_check,
    sc.last_connection,
    ss.cpu_usage,
    ss.memory_usage,
    ss.total_users,
    ss.active_instances,
    ss.is_healthy,
    COUNT(scon.id) as connected_accounts
FROM server_configs sc
LEFT JOIN LATERAL (
    SELECT * FROM server_stats 
    WHERE server_id = sc.id 
    ORDER BY timestamp DESC 
    LIMIT 1
) ss ON true
LEFT JOIN server_connections scon ON sc.id = scon.server_id AND scon.status = 'connected'
GROUP BY sc.id, sc.name, sc.hostname, sc.status, sc.is_enabled, sc.last_health_check, sc.last_connection,
         ss.cpu_usage, ss.memory_usage, ss.total_users, ss.active_instances, ss.is_healthy;

CREATE VIEW server_capacity_overview AS
SELECT 
    sc.id,
    sc.name,
    sc.max_instances,
    sc.max_users_per_instance,
    sc.max_instances * sc.max_users_per_instance as total_capacity,
    COALESCE(ss.total_users, 0) as current_users,
    COALESCE(ss.active_instances, 0) as current_instances,
    CASE 
        WHEN sc.max_instances * sc.max_users_per_instance > 0 THEN
            ROUND((COALESCE(ss.total_users, 0)::DECIMAL / (sc.max_instances * sc.max_users_per_instance)) * 100, 2)
        ELSE 0 
    END as capacity_percentage
FROM server_configs sc
LEFT JOIN LATERAL (
    SELECT * FROM server_stats 
    WHERE server_id = sc.id 
    ORDER BY timestamp DESC 
    LIMIT 1
) ss ON true
WHERE sc.is_enabled = true;

-- Sample data for testing (optional)
/*
INSERT INTO server_configs (name, hostname, ip_address, port, environment, location, created_by, updated_by) VALUES
('WA-Server-Primary', 'wa-primary.company.com', '192.168.1.10', 3001, 'production', 'US-East', 'admin', 'admin'),
('WA-Server-Secondary', 'wa-secondary.company.com', '192.168.1.11', 3002, 'production', 'US-West', 'admin', 'admin'),
('WA-Server-Dev', 'wa-dev.company.local', '192.168.2.10', 3003, 'development', 'Local', 'admin', 'admin');
*/