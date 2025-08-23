const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function enhanceDealerSystem() {
  try {
    console.log('🏪 Enhancing Dealer System...\n')
    
    // Add dealer-specific columns if they don't exist
    console.log('📋 Adding dealer system columns...')
    
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS dealer_type VARCHAR(20) DEFAULT 'user',
        ADD COLUMN IF NOT EXISTS dealer_commission DECIMAL(5,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS dealer_territory VARCHAR(100),
        ADD COLUMN IF NOT EXISTS dealer_status VARCHAR(20) DEFAULT 'active'
      `)
      console.log('✅ Added dealer columns to users table')
    } catch (error) {
      console.log('ℹ️  Dealer columns may already exist')
    }
    
    // Create dealer-customer relationships table
    console.log('📊 Creating dealer-customer relationships table...')
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dealer_customers (
        id SERIAL PRIMARY KEY,
        dealer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT NOW(),
        assigned_by INTEGER REFERENCES users(id),
        commission_rate DECIMAL(5,2) DEFAULT 0.00,
        territory VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        notes TEXT,
        UNIQUE(dealer_id, customer_id)
      )
    `)
    console.log('✅ Created dealer_customers table')
    
    // Create payouts table for future settlement
    console.log('💰 Creating payouts table...')
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payouts (
        id SERIAL PRIMARY KEY,
        dealer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        amount DECIMAL(10,2) NOT NULL,
        commission_rate DECIMAL(5,2) NOT NULL,
        payout_period_start DATE NOT NULL,
        payout_period_end DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP,
        processed_by INTEGER REFERENCES users(id),
        transaction_reference VARCHAR(100),
        notes TEXT
      )
    `)
    console.log('✅ Created payouts table')
    
    // Update existing SubDealers with dealer_type
    console.log('🔄 Updating existing SubDealers...')
    
    await pool.query(`
      UPDATE users 
      SET dealer_type = 'subdealer', 
          dealer_status = 'active'
      WHERE id IN (
        SELECT u.id 
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'SUBDEALER' AND ur.is_primary = true
      )
    `)
    
    const subdealerCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE dealer_type = 'subdealer'
    `)
    console.log(`✅ Updated ${subdealerCount.rows[0].count} SubDealers`)
    
    // Generate unique dealer codes for existing SubDealers
    console.log('🏷️  Generating unique dealer codes...')
    
    const subdealers = await pool.query(`
      SELECT id, name, dealer_code
      FROM users 
      WHERE dealer_type = 'subdealer'
    `)
    
    for (const dealer of subdealers.rows) {
      // Generate a unique dealer code if not already unique
      let newCode = dealer.dealer_code
      
      // Check if current code is unique
      const codeCheck = await pool.query(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE dealer_code = $1 AND id != $2
      `, [dealer.dealer_code, dealer.id])
      
      if (codeCheck.rows[0].count > 0) {
        // Generate new unique code
        let attempts = 0
        let isUnique = false
        
        while (!isUnique && attempts < 10) {
          const prefix = 'SDR' // SubDealer
          const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
          newCode = `${prefix}${number}`
          
          const uniqueCheck = await pool.query(`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE dealer_code = $1
          `, [newCode])
          
          isUnique = uniqueCheck.rows[0].count === 0
          attempts++
        }
        
        if (isUnique) {
          await pool.query(`
            UPDATE users 
            SET dealer_code = $1 
            WHERE id = $2
          `, [newCode, dealer.id])
          
          console.log(`  ✅ ${dealer.name}: ${dealer.dealer_code} → ${newCode}`)
        }
      } else {
        console.log(`  ✅ ${dealer.name}: ${dealer.dealer_code} (already unique)`)
      }
    }
    
    // Add some sample dealer-customer relationships
    console.log('👥 Creating sample dealer-customer relationships...')
    
    const dealerCustomerPairs = await pool.query(`
      SELECT 
        d.id as dealer_id,
        d.name as dealer_name,
        c.id as customer_id,
        c.name as customer_name
      FROM users d
      CROSS JOIN users c
      JOIN user_roles dr ON d.id = dr.user_id
      JOIN roles r1 ON dr.role_id = r1.id AND r1.name = 'SUBDEALER'
      JOIN user_roles cr ON c.id = cr.user_id  
      JOIN roles r2 ON cr.role_id = r2.id AND r2.name = 'CUSTOMER'
      WHERE d.dealer_type = 'subdealer'
        AND d.id != c.id
      LIMIT 3
    `)
    
    for (const pair of dealerCustomerPairs.rows) {
      try {
        await pool.query(`
          INSERT INTO dealer_customers (dealer_id, customer_id, commission_rate, territory, assigned_by)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (dealer_id, customer_id) DO NOTHING
        `, [
          pair.dealer_id, 
          pair.customer_id, 
          5.00, // 5% commission
          'Sample Territory',
          1 // Assigned by owner
        ])
        
        console.log(`  ✅ ${pair.dealer_name} ↔ ${pair.customer_name}`)
      } catch (error) {
        console.log(`  ℹ️  Relationship may already exist`)
      }
    }
    
    // Add dealer permissions if they don't exist
    console.log('🔑 Adding dealer-specific permissions...')
    
    const dealerPermissions = [
      {
        name: 'dealers.customers.assign',
        description: 'Assign customers to dealers',
        category: 'Dealer Management',
        resource: 'dealers',
        action: 'assign_customers'
      },
      {
        name: 'dealers.payouts.view',
        description: 'View dealer payout information',
        category: 'Dealer Management', 
        resource: 'dealers',
        action: 'view_payouts'
      },
      {
        name: 'dealers.commission.manage',
        description: 'Manage dealer commission rates',
        category: 'Dealer Management',
        resource: 'dealers', 
        action: 'manage_commission'
      }
    ]
    
    for (const perm of dealerPermissions) {
      try {
        await pool.query(`
          INSERT INTO permissions (name, description, category, resource, action, is_system)
          VALUES ($1, $2, $3, $4, $5, false)
          ON CONFLICT (name) DO NOTHING
        `, [perm.name, perm.description, perm.category, perm.resource, perm.action])
        
        console.log(`  ✅ Added permission: ${perm.name}`)
      } catch (error) {
        console.log(`  ℹ️  Permission may already exist: ${perm.name}`)
      }
    }
    
    // Grant dealer permissions to OWNER and ADMIN roles
    console.log('🎯 Granting dealer permissions to OWNER and ADMIN...')
    
    const newPermissions = await pool.query(`
      SELECT id, name FROM permissions 
      WHERE category = 'Dealer Management'
    `)
    
    for (const perm of newPermissions.rows) {
      // Grant to OWNER
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id, granted, created_at)
        SELECT r.id, $1, true, NOW()
        FROM roles r 
        WHERE r.name = 'OWNER'
        ON CONFLICT DO NOTHING
      `, [perm.id])
      
      // Grant to ADMIN
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id, granted, created_at)
        SELECT r.id, $1, true, NOW()
        FROM roles r 
        WHERE r.name = 'ADMIN'
        ON CONFLICT DO NOTHING
      `, [perm.id])
    }
    
    console.log('✅ Granted dealer permissions to OWNER and ADMIN')
    
    // Show summary
    console.log('\n📊 Dealer System Summary:')
    
    const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE dealer_type = 'subdealer') as subdealer_count,
        (SELECT COUNT(*) FROM dealer_customers) as relationships_count,
        (SELECT COUNT(*) FROM permissions WHERE category = 'Dealer Management') as dealer_permissions_count
    `)
    
    const stats = summary.rows[0]
    console.log(`  👥 SubDealers: ${stats.subdealer_count}`)
    console.log(`  🔗 Dealer-Customer Relationships: ${stats.relationships_count}`)
    console.log(`  🔑 Dealer Permissions: ${stats.dealer_permissions_count}`)
    
    await pool.end()
    
    console.log('\n🎉 Dealer System Enhancement Complete!')
    console.log('Features Added:')
    console.log('  ✅ Unique dealer codes for SubDealers')
    console.log('  ✅ Dealer-customer relationship tracking')
    console.log('  ✅ Commission rate management')
    console.log('  ✅ Payout settlement framework')
    console.log('  ✅ Territory assignment')
    console.log('  ✅ Dealer-specific permissions')
    
  } catch (error) {
    console.error('❌ Enhancement failed:', error)
    process.exit(1)
  }
}

enhanceDealerSystem()