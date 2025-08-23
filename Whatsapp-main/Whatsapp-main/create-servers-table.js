const { Pool } = require('pg')

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function createServersTable() {
  console.log('🚀 Creating servers table...')
  
  try {
    // Create servers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS servers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        hostname VARCHAR(255) NOT NULL,
        ip_address INET NOT NULL,
        port INTEGER NOT NULL DEFAULT 3001,
        status VARCHAR(50) NOT NULL DEFAULT 'Offline' CHECK (status IN ('Online', 'Offline', 'Maintenance', 'Warning')),
        environment VARCHAR(50) NOT NULL DEFAULT 'Development' CHECK (environment IN ('Production', 'Staging', 'Development')),
        location VARCHAR(100),
        capacity INTEGER NOT NULL DEFAULT 100,
        active_users INTEGER NOT NULL DEFAULT 0,
        messages_per_day INTEGER NOT NULL DEFAULT 0,
        uptime_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
        last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        version VARCHAR(20) DEFAULT '1.0.0',
        
        -- Resource usage (percentages)
        cpu_usage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
        memory_usage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
        storage_usage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
        network_usage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
        
        -- WhatsApp specific
        whatsapp_instances INTEGER NOT NULL DEFAULT 0,
        
        -- Metadata
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true
      )
    `)

    console.log('✅ Servers table created successfully')

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status);
      CREATE INDEX IF NOT EXISTS idx_servers_environment ON servers(environment);
      CREATE INDEX IF NOT EXISTS idx_servers_location ON servers(location);
      CREATE INDEX IF NOT EXISTS idx_servers_active ON servers(is_active);
      CREATE INDEX IF NOT EXISTS idx_servers_last_heartbeat ON servers(last_heartbeat);
    `)

    console.log('✅ Indexes created successfully')

    // Insert sample server data
    const sampleServers = [
      {
        name: 'WA-Server-01',
        hostname: 'wa-prod-01.company.com',
        ip_address: '192.168.1.10',
        port: 3001,
        status: 'Online',
        environment: 'Production',
        location: 'US East',
        capacity: 500,
        active_users: 450,
        messages_per_day: 12543,
        uptime_percentage: 99.9,
        version: '2.3.1',
        cpu_usage: 45.0,
        memory_usage: 67.0,
        storage_usage: 34.0,
        network_usage: 23.0,
        whatsapp_instances: 5
      },
      {
        name: 'WA-Server-02',
        hostname: 'wa-prod-02.company.com',
        ip_address: '192.168.1.11',
        port: 3002,
        status: 'Online',
        environment: 'Production',
        location: 'US West',
        capacity: 400,
        active_users: 325,
        messages_per_day: 8921,
        uptime_percentage: 98.5,
        version: '2.3.1',
        cpu_usage: 32.0,
        memory_usage: 54.0,
        storage_usage: 28.0,
        network_usage: 19.0,
        whatsapp_instances: 4
      },
      {
        name: 'WA-Server-03',
        hostname: 'wa-maint-01.company.com',
        ip_address: '192.168.1.12',
        port: 3003,
        status: 'Maintenance',
        environment: 'Production',
        location: 'EU Central',
        capacity: 600,
        active_users: 0,
        messages_per_day: 0,
        uptime_percentage: 95.2,
        version: '2.2.8',
        cpu_usage: 5.0,
        memory_usage: 15.0,
        storage_usage: 42.0,
        network_usage: 2.0,
        whatsapp_instances: 0
      },
      {
        name: 'WA-Server-04',
        hostname: 'wa-prod-03.company.com',
        ip_address: '192.168.1.13',
        port: 3004,
        status: 'Online',
        environment: 'Production',
        location: 'Asia Pacific',
        capacity: 800,
        active_users: 678,
        messages_per_day: 15420,
        uptime_percentage: 99.1,
        version: '2.3.1',
        cpu_usage: 58.0,
        memory_usage: 72.0,
        storage_usage: 39.0,
        network_usage: 31.0,
        whatsapp_instances: 8
      },
      {
        name: 'WA-Dev-01',
        hostname: 'wa-dev-01.company.com',
        ip_address: '192.168.2.10',
        port: 3005,
        status: 'Offline',
        environment: 'Development',
        location: 'Development',
        capacity: 100,
        active_users: 0,
        messages_per_day: 0,
        uptime_percentage: 87.3,
        version: '2.4.0-beta',
        cpu_usage: 0.0,
        memory_usage: 0.0,
        storage_usage: 15.0,
        network_usage: 0.0,
        whatsapp_instances: 0
      },
      {
        name: 'WA-Server-05',
        hostname: 'wa-staging-01.company.com',
        ip_address: '192.168.3.10',
        port: 3006,
        status: 'Warning',
        environment: 'Staging',
        location: 'Staging',
        capacity: 200,
        active_users: 45,
        messages_per_day: 1200,
        uptime_percentage: 92.8,
        version: '2.3.2-rc1',
        cpu_usage: 85.0,
        memory_usage: 91.0,
        storage_usage: 67.0,
        network_usage: 45.0,
        whatsapp_instances: 2
      }
    ]

    // Get admin user ID for created_by field
    const adminUser = await pool.query("SELECT id FROM users WHERE email = 'owner@demo.com' LIMIT 1")
    const adminId = adminUser.rows.length > 0 ? adminUser.rows[0].id : null

    // Insert sample servers
    for (const server of sampleServers) {
      await pool.query(`
        INSERT INTO servers (
          name, hostname, ip_address, port, status, environment, location,
          capacity, active_users, messages_per_day, uptime_percentage, version,
          cpu_usage, memory_usage, storage_usage, network_usage, whatsapp_instances,
          created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) ON CONFLICT (name) DO UPDATE SET
          hostname = EXCLUDED.hostname,
          ip_address = EXCLUDED.ip_address,
          port = EXCLUDED.port,
          status = EXCLUDED.status,
          environment = EXCLUDED.environment,
          location = EXCLUDED.location,
          capacity = EXCLUDED.capacity,
          active_users = EXCLUDED.active_users,
          messages_per_day = EXCLUDED.messages_per_day,
          uptime_percentage = EXCLUDED.uptime_percentage,
          version = EXCLUDED.version,
          cpu_usage = EXCLUDED.cpu_usage,
          memory_usage = EXCLUDED.memory_usage,
          storage_usage = EXCLUDED.storage_usage,
          network_usage = EXCLUDED.network_usage,
          whatsapp_instances = EXCLUDED.whatsapp_instances,
          updated_at = CURRENT_TIMESTAMP
      `, [
        server.name, server.hostname, server.ip_address, server.port,
        server.status, server.environment, server.location, server.capacity,
        server.active_users, server.messages_per_day, server.uptime_percentage,
        server.version, server.cpu_usage, server.memory_usage, server.storage_usage,
        server.network_usage, server.whatsapp_instances, adminId
      ])
    }

    console.log('✅ Sample server data inserted successfully')

    // Verify the data
    const result = await pool.query('SELECT COUNT(*) as count FROM servers WHERE is_active = true')
    console.log(`📊 Total active servers: ${result.rows[0].count}`)

    console.log('🎉 Servers table setup completed successfully!')

  } catch (error) {
    console.error('❌ Error creating servers table:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run the setup
createServersTable().catch(console.error)