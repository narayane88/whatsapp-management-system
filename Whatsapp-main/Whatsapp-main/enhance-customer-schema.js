const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432
});

async function enhanceCustomerSchema() {
  try {
    console.log('🔧 Enhancing customer schema...\n');
    
    // Create customer_packages table to track customer package assignments
    console.log('1️⃣ Creating customer_packages table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_packages (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        package_id TEXT REFERENCES packages(id) ON DELETE CASCADE,
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        purchase_amount NUMERIC(10,2),
        discount_applied NUMERIC(10,2) DEFAULT 0.00,
        voucher_code VARCHAR(50),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(customer_id, package_id, purchased_at)
      )
    `);
    console.log('✅ customer_packages table created');

    // Create indexes for performance
    console.log('2️⃣ Creating indexes...');
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_customer_packages_customer ON customer_packages(customer_id)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_customer_packages_active ON customer_packages(is_active, expires_at)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_customers_parent ON users("parentId") WHERE "parentId" IS NOT NULL`);
      console.log('✅ Indexes created');
    } catch (error) {
      console.log('⚠️  Some indexes may already exist or table not ready:', error.message);
    }

    // Add additional customer-specific columns if they don't exist
    console.log('3️⃣ Adding customer-specific columns...');
    
    const columns = [
      { name: 'mobile', type: 'VARCHAR(20)', description: 'Customer mobile number' },
      { name: 'package_expiry_notification', type: 'BOOLEAN DEFAULT true', description: 'Send expiry notifications' },
      { name: 'customer_status', type: 'VARCHAR(20) DEFAULT \'active\'', description: 'Customer status' },
      { name: 'registration_source', type: 'VARCHAR(50)', description: 'How customer was registered' },
      { name: 'last_package_purchase', type: 'TIMESTAMP', description: 'Last package purchase date' }
    ];

    for (const column of columns) {
      try {
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `);
        console.log(`   ✅ Added ${column.name} column (${column.description})`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Column ${column.name} already exists`);
        } else {
          console.error(`   ❌ Error adding ${column.name}:`, error.message);
        }
      }
    }

    // Create or update customer role permissions
    console.log('4️⃣ Setting up customer permissions...');
    
    // Check if customer-specific permissions exist
    const permissionCheck = await pool.query(`
      SELECT name FROM permissions 
      WHERE name IN ('customers.read', 'customers.create', 'customers.update', 'customers.delete', 'customers.export', 'customers.impersonate')
    `);
    
    const existingPermissions = permissionCheck.rows.map(row => row.name);
    const customerPermissions = [
      { name: 'customers.read', description: 'View customer list and details', category: 'Customer Management', resource: 'customers', action: 'read' },
      { name: 'customers.create', description: 'Create new customers', category: 'Customer Management', resource: 'customers', action: 'create' },
      { name: 'customers.update', description: 'Update customer information', category: 'Customer Management', resource: 'customers', action: 'update' },
      { name: 'customers.delete', description: 'Delete customers', category: 'Customer Management', resource: 'customers', action: 'delete' },
      { name: 'customers.export', description: 'Export customer reports', category: 'Customer Management', resource: 'customers', action: 'export' },
      { name: 'customers.impersonate', description: 'Impersonate customers', category: 'Customer Management', resource: 'customers', action: 'impersonate' },
      { name: 'customer.voucher.redeem', description: 'Redeem vouchers as customer', category: 'Customer Operations', resource: 'customer', action: 'voucher_redeem' }
    ];

    for (const permission of customerPermissions) {
      if (!existingPermissions.includes(permission.name)) {
        await pool.query(`
          INSERT INTO permissions (name, description, category, resource, action) 
          VALUES ($1, $2, $3, $4, $5)
        `, [permission.name, permission.description, permission.category, permission.resource, permission.action]);
        console.log(`   ✅ Added permission: ${permission.name}`);
      } else {
        console.log(`   ⚠️  Permission ${permission.name} already exists`);
      }
    }

    // Assign customer permissions to OWNER and ADMIN roles
    console.log('5️⃣ Assigning permissions to roles...');
    
    const rolesResult = await pool.query(`
      SELECT id, name FROM roles WHERE name IN ('OWNER', 'ADMIN')
    `);
    
    const permissionsResult = await pool.query(`
      SELECT id, name FROM permissions 
      WHERE name LIKE 'customers.%' OR name LIKE 'customer.%'
    `);

    for (const role of rolesResult.rows) {
      for (const permission of permissionsResult.rows) {
        try {
          await pool.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT (role_id, permission_id) DO NOTHING
          `, [role.id, permission.id]);
        } catch (error) {
          // Ignore conflicts
        }
      }
      console.log(`   ✅ Assigned customer permissions to ${role.name}`);
    }

    console.log('\n🎉 Customer schema enhancement completed!');
    console.log('📋 Summary of changes:');
    console.log('   ✅ customer_packages table created');
    console.log('   ✅ Database indexes added for performance');
    console.log('   ✅ Customer-specific columns added to users table');
    console.log('   ✅ Customer management permissions created');
    console.log('   ✅ Permissions assigned to OWNER and ADMIN roles');
    
  } catch (error) {
    console.error('❌ Error enhancing customer schema:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    pool.end();
  }
}

enhanceCustomerSchema();