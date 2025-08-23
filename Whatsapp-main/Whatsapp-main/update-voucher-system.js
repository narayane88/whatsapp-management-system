const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
})

async function updateVoucherSystem() {
  try {
    console.log('🎫 Updating voucher system with usage restrictions...\n')
    
    // Update voucher_usage table to ensure proper tracking
    console.log('1️⃣ Updating voucher usage table structure...')
    
    // Add unique constraint to prevent duplicate usage per user per voucher
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'unique_user_voucher_usage'
        ) THEN
          ALTER TABLE voucher_usage 
          ADD CONSTRAINT unique_user_voucher_usage 
          UNIQUE (voucher_id, user_id);
        END IF;
      END $$;
    `)
    
    // Add redemption_type column to track how voucher was redeemed
    await pool.query(`
      ALTER TABLE voucher_usage 
      ADD COLUMN IF NOT EXISTS redemption_type VARCHAR(20) DEFAULT 'manual'
    `)
    
    // Add dealer_id column to track which dealer created the voucher
    await pool.query(`
      ALTER TABLE vouchers 
      ADD COLUMN IF NOT EXISTS dealer_id VARCHAR(255) DEFAULT NULL
    `)
    
    // Add restriction columns
    await pool.query(`
      ALTER TABLE vouchers 
      ADD COLUMN IF NOT EXISTS allow_dealer_redemption BOOLEAN DEFAULT FALSE
    `)
    
    console.log('✅ Voucher usage table updated with restrictions')
    
    // Create voucher redemption attempts table for audit
    console.log('2️⃣ Creating voucher redemption attempts table...')
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS voucher_redemption_attempts (
        id SERIAL PRIMARY KEY,
        voucher_id INTEGER NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        attempt_status VARCHAR(20) NOT NULL CHECK (attempt_status IN ('success', 'failed', 'blocked')),
        failure_reason VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    console.log('✅ Voucher redemption attempts table created')
    
    // Create indexes for performance
    console.log('3️⃣ Creating performance indexes...')
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_voucher_usage_user_voucher ON voucher_usage(user_id, voucher_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_voucher_attempts_user ON voucher_redemption_attempts(user_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_voucher_attempts_status ON voucher_redemption_attempts(attempt_status)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_vouchers_dealer ON vouchers(dealer_id)')
    
    console.log('✅ Performance indexes created')
    
    // Update existing vouchers with dealer restrictions
    console.log('4️⃣ Updating existing vouchers with dealer restrictions...')
    
    await pool.query(`
      UPDATE vouchers 
      SET allow_dealer_redemption = FALSE,
          dealer_id = created_by
      WHERE allow_dealer_redemption IS NULL
    `)
    
    console.log('✅ Existing vouchers updated with restrictions')
    
    // Create some test redemption attempts for demonstration
    console.log('5️⃣ Creating sample redemption attempts...')
    
    const sampleVoucher = await pool.query(`
      SELECT id FROM vouchers WHERE code = 'WELCOME50' LIMIT 1
    `)
    
    if (sampleVoucher.rows.length > 0) {
      const voucherId = sampleVoucher.rows[0].id
      
      // Sample successful redemption
      await pool.query(`
        INSERT INTO voucher_redemption_attempts (
          voucher_id, user_id, user_email, attempt_status, ip_address
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [voucherId, 'user123', 'user123@example.com', 'success', '192.168.1.100'])
      
      // Sample failed attempt (already used)
      await pool.query(`
        INSERT INTO voucher_redemption_attempts (
          voucher_id, user_id, user_email, attempt_status, failure_reason, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [voucherId, 'user123', 'user123@example.com', 'failed', 'Voucher already used by this user', '192.168.1.100'])
      
      // Sample blocked attempt (dealer trying to redeem)
      await pool.query(`
        INSERT INTO voucher_redemption_attempts (
          voucher_id, user_id, user_email, attempt_status, failure_reason, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [voucherId, 'dealer456', 'dealer@example.com', 'blocked', 'Dealers cannot redeem vouchers', '192.168.1.200'])
    }
    
    console.log('✅ Sample redemption attempts created')
    
    // Display updated system statistics
    console.log('\n6️⃣ Voucher system statistics...')
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_vouchers,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_vouchers,
        COUNT(CASE WHEN allow_dealer_redemption = true THEN 1 END) as dealer_redeemable,
        SUM(usage_count) as total_redemptions
      FROM vouchers
    `)
    
    const attempts = await pool.query(`
      SELECT 
        attempt_status,
        COUNT(*) as count
      FROM voucher_redemption_attempts
      GROUP BY attempt_status
    `)
    
    const restrictions = await pool.query(`
      SELECT 
        COUNT(*) as total_unique_restrictions
      FROM (
        SELECT voucher_id, user_id FROM voucher_usage GROUP BY voucher_id, user_id
      ) unique_usage
    `)
    
    console.log('📊 Updated Voucher System Overview:')
    const stat = stats.rows[0]
    console.log(`   🎫 Total Vouchers: ${stat.total_vouchers}`)
    console.log(`   ✅ Active Vouchers: ${stat.active_vouchers}`)
    console.log(`   👨‍💼 Dealer Redeemable: ${stat.dealer_redeemable}`)
    console.log(`   🔄 Total Redemptions: ${stat.total_redemptions}`)
    
    console.log('\n📝 Redemption Attempts:')
    attempts.rows.forEach(attempt => {
      const emoji = attempt.attempt_status === 'success' ? '✅' : attempt.attempt_status === 'failed' ? '❌' : '🚫'
      console.log(`   ${emoji} ${attempt.attempt_status}: ${attempt.count}`)
    })
    
    console.log(`\n🔒 Unique User-Voucher Restrictions: ${restrictions.rows[0].total_unique_restrictions}`)
    
    console.log('\n🎉 Voucher system successfully updated!')
    console.log('📋 New Features:')
    console.log('   ✅ One-time use per user enforcement')
    console.log('   ✅ Dealer redemption restrictions')
    console.log('   ✅ Redemption attempt tracking')
    console.log('   ✅ Usage audit trail')
    console.log('   ✅ Performance optimized queries')
    
  } catch (error) {
    console.error('❌ Error updating voucher system:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    pool.end()
  }
}

updateVoucherSystem()