const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
  ssl: false,
})

async function setupPermissions() {
  try {
    console.log('Setting up permissions and roles tables...')
    
    const client = await pool.connect()
    
    // Create permissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        is_system_permission BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Permissions table created/verified')
    
    // Create roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        description TEXT,
        is_system_role BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Roles table created/verified')
    
    // Create role_permissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role_id INTEGER NOT NULL,
        permission_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE(role_id, permission_id)
      )
    `)
    console.log('✅ Role permissions table created/verified')
    
    // Update users table to have role_id if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER,
        ADD COLUMN IF NOT EXISTS dealer_code VARCHAR(20),
        ADD COLUMN IF NOT EXISTS referred_by_dealer_code VARCHAR(20),
        ADD COLUMN IF NOT EXISTS parent_id INTEGER,
        ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'hi',
        ADD COLUMN IF NOT EXISTS messages_used INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS messages_limit INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
        ADD COLUMN IF NOT EXISTS package_id INTEGER
      `)
      console.log('✅ Users table updated with new columns')
    } catch (error) {
      console.log('ℹ️ Users table columns already exist or update failed:', error.message)
    }
    
    // Insert system roles
    const roles = [
      { name: 'OWNER', display_name: 'मालिक (Owner)', description: 'System owner with full administrative privileges', is_system_role: true },
      { name: 'SUBDEALER', display_name: 'उप-डीलर (SubDealer)', description: 'Regional dealer with user management and business operations', is_system_role: true },
      { name: 'EMPLOYEE', display_name: 'कर्मचारी (Employee)', description: 'Company employee with customer support and operational access', is_system_role: true },
      { name: 'CUSTOMER', display_name: 'ग्राहक (Customer)', description: 'End customer with self-service access and messaging capabilities', is_system_role: true }
    ]
    
    for (const role of roles) {
      await client.query(`
        INSERT INTO roles (name, display_name, description, is_system_role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO UPDATE SET
        display_name = $2, description = $3, is_system_role = $4
      `, [role.name, role.display_name, role.description, role.is_system_role])
    }
    console.log('✅ System roles inserted/updated')
    
    // Insert system permissions
    const permissions = [
      // User Management
      { id: 'users.create', name: 'Create Users', description: 'Ability to create new user accounts', category: 'User Management', is_system: true },
      { id: 'users.view', name: 'View Users', description: 'Access user list and basic information', category: 'User Management', is_system: true },
      { id: 'users.edit', name: 'Edit Users', description: 'Modify existing user information and settings', category: 'User Management', is_system: true },
      { id: 'users.delete', name: 'Delete Users', description: 'Permanently remove user accounts', category: 'User Management', is_system: true },
      
      // Role Management
      { id: 'roles.create', name: 'Create Roles', description: 'Create new user roles and permissions', category: 'Role Management', is_system: true },
      { id: 'roles.view', name: 'View Roles', description: 'View existing roles and their permissions', category: 'Role Management', is_system: true },
      { id: 'roles.edit', name: 'Edit Roles', description: 'Modify existing roles and their permissions', category: 'Role Management', is_system: true },
      { id: 'permissions.assign', name: 'Assign Permissions', description: 'Assign permissions to roles and users', category: 'Role Management', is_system: true },
      { id: 'permissions.create', name: 'Create Permissions', description: 'Create custom permissions', category: 'Role Management', is_system: false },
      
      // Package Management
      { id: 'packages.create', name: 'Create Packages', description: 'Create new service packages', category: 'Package Management', is_system: true },
      { id: 'packages.view', name: 'View Packages', description: 'View available packages and details', category: 'Package Management', is_system: true },
      { id: 'packages.edit', name: 'Edit Packages', description: 'Modify package details and pricing', category: 'Package Management', is_system: true },
      
      // Financial
      { id: 'transactions.view', name: 'View Transactions', description: 'Access transaction history and details', category: 'Financial', is_system: true },
      { id: 'transactions.create', name: 'Create Transactions', description: 'Process payments and create transactions', category: 'Financial', is_system: true },
      { id: 'billing.view', name: 'View Billing', description: 'Access billing information and invoices', category: 'Financial', is_system: true },
      
      // Messaging
      { id: 'messages.send', name: 'Send Messages', description: 'Send WhatsApp messages through the system', category: 'Messaging', is_system: true },
      { id: 'messages.view', name: 'View Messages', description: 'View message history and logs', category: 'Messaging', is_system: true },
      { id: 'instances.view', name: 'View Instances', description: 'View WhatsApp instances', category: 'Messaging', is_system: true },
      { id: 'instances.manage', name: 'Manage Instances', description: 'Create and manage WhatsApp instances', category: 'Messaging', is_system: true },
      
      // System
      { id: 'system.settings', name: 'Manage Settings', description: 'Access and modify system settings', category: 'System', is_system: true },
      { id: 'system.logs', name: 'View System Logs', description: 'Access system logs and audit trails', category: 'System', is_system: false },
      { id: 'api.access', name: 'API Access', description: 'Access system APIs and integrations', category: 'System', is_system: true },
      
      // Analytics
      { id: 'reports.view', name: 'View Reports', description: 'Access basic system reports and analytics', category: 'Analytics', is_system: true },
      { id: 'analytics.advanced', name: 'Advanced Analytics', description: 'Access detailed analytics and insights', category: 'Analytics', is_system: false },
      
      // Support
      { id: 'support.tickets', name: 'Manage Tickets', description: 'Handle customer support tickets', category: 'Support', is_system: false }
    ]
    
    for (const perm of permissions) {
      await client.query(`
        INSERT INTO permissions (id, name, description, category, is_system_permission)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
        name = $2, description = $3, category = $4, is_system_permission = $5
      `, [perm.id, perm.name, perm.description, perm.category, perm.is_system])
    }
    console.log('✅ System permissions inserted/updated')
    
    // Assign permissions to roles
    // OWNER gets all permissions
    const ownerResult = await client.query('SELECT id FROM roles WHERE name = $1', ['OWNER'])
    if (ownerResult.rows.length > 0) {
      const ownerId = ownerResult.rows[0].id
      
      for (const perm of permissions) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `, [ownerId, perm.id])
      }
      console.log('✅ OWNER role permissions assigned')
    }
    
    // SUBDEALER gets business permissions
    const subdealerResult = await client.query('SELECT id FROM roles WHERE name = $1', ['SUBDEALER'])
    if (subdealerResult.rows.length > 0) {
      const subdealerId = subdealerResult.rows[0].id
      const subdealerPermissions = [
        'users.create', 'users.view', 'users.edit',
        'packages.view', 'transactions.view', 'billing.view',
        'messages.send', 'messages.view', 'instances.view',
        'reports.view'
      ]
      
      for (const permId of subdealerPermissions) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `, [subdealerId, permId])
      }
      console.log('✅ SUBDEALER role permissions assigned')
    }
    
    // Update existing users to have role_id
    await client.query(`
      UPDATE users 
      SET role_id = (SELECT id FROM roles WHERE name = 'OWNER' LIMIT 1)
      WHERE role_id IS NULL
      AND EXISTS (SELECT 1 FROM roles WHERE name = 'OWNER')
    `)
    console.log('✅ Updated existing users with default OWNER role')
    
    client.release()
    console.log('\n🎉 Permissions system setup complete!')
    
    // Test the setup
    const permCount = await pool.query('SELECT COUNT(*) as count FROM permissions')
    const roleCount = await pool.query('SELECT COUNT(*) as count FROM roles')
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id IS NOT NULL')
    
    console.log(`\n📊 Summary:`)
    console.log(`  - Permissions: ${permCount.rows[0].count}`)
    console.log(`  - Roles: ${roleCount.rows[0].count}`)
    console.log(`  - Users with roles: ${userCount.rows[0].count}`)
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  } finally {
    await pool.end()
  }
}

setupPermissions()