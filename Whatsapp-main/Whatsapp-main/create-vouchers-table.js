const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
})

async function createVouchersTable() {
  try {
    console.log('🎫 Creating vouchers table and system...\n')
    
    // Create vouchers table
    console.log('1️⃣ Creating vouchers table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'messages', 'percentage', 'package')),
        value DECIMAL(10,2) NOT NULL,
        usage_limit INTEGER DEFAULT NULL,
        usage_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP DEFAULT NULL,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        package_id VARCHAR(255) DEFAULT NULL REFERENCES packages(id),
        min_purchase_amount DECIMAL(10,2) DEFAULT NULL,
        max_discount_amount DECIMAL(10,2) DEFAULT NULL
      )
    `)
    console.log('✅ Vouchers table created')
    
    // Create voucher_usage table to track redemptions
    console.log('2️⃣ Creating voucher usage tracking table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voucher_usage (
        id SERIAL PRIMARY KEY,
        voucher_id INTEGER NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        discount_amount DECIMAL(10,2),
        original_amount DECIMAL(10,2),
        final_amount DECIMAL(10,2),
        package_id VARCHAR(255) DEFAULT NULL,
        notes TEXT
      )
    `)
    
    // Note: Foreign key constraints can be added later if needed
    console.log('✅ Voucher usage tracking table created')
    
    // Create indexes for performance
    console.log('3️⃣ Creating database indexes...')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_vouchers_active ON vouchers(is_active)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_vouchers_expires ON vouchers(expires_at)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_voucher_usage_voucher_id ON voucher_usage(voucher_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_voucher_usage_user_id ON voucher_usage(user_id)')
    console.log('✅ Database indexes created')
    
    // Insert sample vouchers
    console.log('4️⃣ Creating sample vouchers...')
    
    const sampleVouchers = [
      {
        code: 'WELCOME50',
        description: 'Welcome bonus - 50 free messages for new users',
        type: 'messages',
        value: 50,
        usage_limit: 500,
        created_by: 'system'
      },
      {
        code: 'SUMMER25',
        description: 'Summer sale - 25% discount on all packages',
        type: 'percentage',
        value: 25,
        usage_limit: 200,
        max_discount_amount: 100,
        expires_at: '2024-08-31 23:59:59',
        created_by: 'admin'
      },
      {
        code: 'CREDIT100',
        description: 'Account credit voucher - ₹100 credit',
        type: 'credit',
        value: 100,
        usage_limit: 100,
        created_by: 'admin'
      },
      {
        code: 'BULK1000',
        description: 'Bulk messaging voucher - 1000 messages',
        type: 'messages',
        value: 1000,
        usage_limit: 50,
        expires_at: '2024-12-31 23:59:59',
        created_by: 'admin'
      },
      {
        code: 'EXPIRED10',
        description: 'Expired test voucher',
        type: 'credit',
        value: 10,
        usage_limit: 200,
        usage_count: 200,
        is_active: false,
        expires_at: '2024-06-30 23:59:59',
        created_by: 'admin'
      }
    ]
    
    for (const voucher of sampleVouchers) {
      await pool.query(`
        INSERT INTO vouchers (
          code, description, type, value, usage_limit, usage_count, 
          is_active, expires_at, created_by, max_discount_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (code) DO NOTHING
      `, [
        voucher.code,
        voucher.description,
        voucher.type,
        voucher.value,
        voucher.usage_limit,
        voucher.usage_count || 0,
        voucher.is_active !== false,
        voucher.expires_at || null,
        voucher.created_by,
        voucher.max_discount_amount || null
      ])
    }
    
    console.log('✅ Sample vouchers created')
    
    // Create some sample usage records
    console.log('5️⃣ Creating sample usage records...')
    
    const vouchersWithUsage = await pool.query(`
      SELECT id, code, usage_count FROM vouchers WHERE usage_count > 0
    `)
    
    for (const voucher of vouchersWithUsage.rows) {
      // Create some sample usage records for vouchers that have been used
      const usageCount = Math.min(voucher.usage_count, 10) // Limit to 10 sample records
      
      for (let i = 0; i < usageCount; i++) {
        await pool.query(`
          INSERT INTO voucher_usage (
            voucher_id, user_id, user_email, discount_amount, 
            original_amount, final_amount, used_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT DO NOTHING
        `, [
          voucher.id,
          `user_${i + 1}`,
          `user${i + 1}@example.com`,
          Math.random() * 50 + 10, // Random discount between 10-60
          Math.random() * 200 + 100, // Random original amount 100-300
          Math.random() * 150 + 50, // Random final amount 50-200
          new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        ])
      }
    }
    
    console.log('✅ Sample usage records created')
    
    // Display summary
    console.log('\n6️⃣ Voucher system summary...')
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_vouchers,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_vouchers,
        COUNT(CASE WHEN expires_at < CURRENT_TIMESTAMP THEN 1 END) as expired_vouchers,
        SUM(usage_count) as total_redemptions,
        SUM(CASE WHEN type = 'credit' THEN value * usage_count ELSE 0 END) as credit_value_used
      FROM vouchers
    `)
    
    const usageStats = await pool.query(`
      SELECT COUNT(*) as total_usage_records
      FROM voucher_usage
    `)
    
    const stats = summary.rows[0]
    console.log('📊 Voucher System Overview:')
    console.log(`   🎫 Total Vouchers: ${stats.total_vouchers}`)
    console.log(`   ✅ Active Vouchers: ${stats.active_vouchers}`)
    console.log(`   ❌ Expired Vouchers: ${stats.expired_vouchers}`)
    console.log(`   🔄 Total Redemptions: ${stats.total_redemptions}`)
    console.log(`   💰 Credit Value Used: ₹${parseFloat(stats.credit_value_used || 0).toFixed(2)}`)
    console.log(`   📝 Usage Records: ${usageStats.rows[0].total_usage_records}`)
    
    console.log('\n🎉 Vouchers system successfully created!')
    console.log('📋 Features:')
    console.log('   ✅ Voucher management (CRUD operations)')
    console.log('   ✅ Multiple voucher types (credit, messages, percentage, package)')
    console.log('   ✅ Usage limits and tracking')
    console.log('   ✅ Expiry date support')
    console.log('   ✅ Detailed usage analytics')
    console.log('   ✅ Package integration ready')
    
  } catch (error) {
    console.error('❌ Error creating vouchers system:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    pool.end()
  }
}

createVouchersTable()