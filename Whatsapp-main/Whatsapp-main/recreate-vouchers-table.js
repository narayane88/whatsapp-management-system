const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
})

async function recreateVouchersTable() {
  try {
    console.log('🎫 Recreating vouchers table with proper structure...\n')
    
    // Drop existing tables
    console.log('1️⃣ Dropping existing vouchers tables...')
    await pool.query('DROP TABLE IF EXISTS voucher_usage CASCADE')
    await pool.query('DROP TABLE IF EXISTS vouchers CASCADE')
    console.log('✅ Existing tables dropped')
    
    // Create vouchers table with correct structure
    console.log('2️⃣ Creating new vouchers table...')
    await pool.query(`
      CREATE TABLE vouchers (
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
        package_id VARCHAR(255) DEFAULT NULL,
        min_purchase_amount DECIMAL(10,2) DEFAULT NULL,
        max_discount_amount DECIMAL(10,2) DEFAULT NULL
      )
    `)
    console.log('✅ New vouchers table created')
    
    // Create voucher_usage table
    console.log('3️⃣ Creating voucher usage tracking table...')
    await pool.query(`
      CREATE TABLE voucher_usage (
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
    console.log('✅ Voucher usage tracking table created')
    
    // Create indexes
    console.log('4️⃣ Creating database indexes...')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_vouchers_active ON vouchers(is_active)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_vouchers_expires ON vouchers(expires_at)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_voucher_usage_voucher_id ON voucher_usage(voucher_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_voucher_usage_user_id ON voucher_usage(user_id)')
    console.log('✅ Database indexes created')
    
    // Insert sample vouchers
    console.log('5️⃣ Creating sample vouchers...')
    
    const sampleVouchers = [
      {
        code: 'WELCOME50',
        description: 'Welcome bonus - 50 free messages for new users',
        type: 'messages',
        value: 50,
        usage_limit: 500,
        usage_count: 145,
        created_by: 'Admin'
      },
      {
        code: 'SUMMER25',
        description: 'Summer sale - 25% discount on all packages',
        type: 'percentage',
        value: 25,
        usage_limit: 200,
        usage_count: 89,
        max_discount_amount: 100,
        expires_at: '2024-08-31 23:59:59',
        created_by: 'Manager'
      },
      {
        code: 'CREDIT100',
        description: 'Account credit voucher - ₹100 credit',
        type: 'credit',
        value: 100.00,
        usage_limit: 100,
        usage_count: 25,
        created_by: 'Admin'
      },
      {
        code: 'BULK1000',
        description: 'Bulk messaging voucher for enterprise clients',
        type: 'messages',
        value: 1000,
        usage_limit: 50,
        usage_count: 12,
        expires_at: '2024-10-15 23:59:59',
        created_by: 'Admin'
      },
      {
        code: 'EXPIRED10',
        description: 'Old promotional voucher',
        type: 'credit',
        value: 10.00,
        usage_limit: 200,
        usage_count: 200,
        is_active: false,
        expires_at: '2024-06-30 23:59:59',
        created_by: 'Admin'
      }
    ]
    
    for (const voucher of sampleVouchers) {
      await pool.query(`
        INSERT INTO vouchers (
          code, description, type, value, usage_limit, usage_count, 
          is_active, expires_at, created_by, max_discount_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        voucher.code,
        voucher.description,
        voucher.type,
        voucher.value,
        voucher.usage_limit,
        voucher.usage_count,
        voucher.is_active !== false,
        voucher.expires_at || null,
        voucher.created_by,
        voucher.max_discount_amount || null
      ])
    }
    
    console.log('✅ Sample vouchers created')
    
    // Create some sample usage records
    console.log('6️⃣ Creating sample usage records...')
    
    const vouchersWithUsage = await pool.query(`
      SELECT id, code, usage_count FROM vouchers WHERE usage_count > 0
    `)
    
    for (const voucher of vouchersWithUsage.rows) {
      // Create some sample usage records
      const usageCount = Math.min(voucher.usage_count, 5) // Limit to 5 sample records per voucher
      
      for (let i = 0; i < usageCount; i++) {
        await pool.query(`
          INSERT INTO voucher_usage (
            voucher_id, user_id, user_email, discount_amount, 
            original_amount, final_amount, used_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          voucher.id,
          `user_${voucher.id}_${i + 1}`,
          `user${voucher.id}_${i + 1}@example.com`,
          Math.round((Math.random() * 50 + 10) * 100) / 100, // Random discount between 10-60
          Math.round((Math.random() * 200 + 100) * 100) / 100, // Random original amount 100-300
          Math.round((Math.random() * 150 + 50) * 100) / 100, // Random final amount 50-200
          new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        ])
      }
    }
    
    console.log('✅ Sample usage records created')
    
    // Display summary
    console.log('\n7️⃣ Voucher system summary...')
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
    
    console.log('\n🎉 Vouchers system successfully recreated!')
    console.log('📋 Ready for frontend integration')
    
  } catch (error) {
    console.error('❌ Error recreating vouchers system:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    pool.end()
  }
}

recreateVouchersTable()