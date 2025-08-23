const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
})

async function updateUsersForVouchers() {
  try {
    console.log('💳 Updating users table for voucher redemption benefits...\n')
    
    // Add account balance and message balance columns
    console.log('1️⃣ Adding balance columns to users table...')
    
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS account_balance DECIMAL(10,2) DEFAULT 0.00
    `)
    
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS message_balance INTEGER DEFAULT 0
    `)
    
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS voucher_credits DECIMAL(10,2) DEFAULT 0.00
    `)
    
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_voucher_redemption TIMESTAMP DEFAULT NULL
    `)
    
    console.log('✅ Balance columns added to users table')
    
    // Create user balance history table
    console.log('2️⃣ Creating user balance history table...')
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_balance_history (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('voucher_credit', 'voucher_messages', 'purchase', 'refund', 'adjustment')),
        amount DECIMAL(10,2),
        message_count INTEGER,
        previous_balance DECIMAL(10,2),
        new_balance DECIMAL(10,2),
        previous_messages INTEGER,
        new_messages INTEGER,
        reference_type VARCHAR(50),
        reference_id VARCHAR(255),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    console.log('✅ User balance history table created')
    
    // Add indexes for performance
    console.log('3️⃣ Adding performance indexes...')
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_balance_history_user ON user_balance_history(user_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_balance_history_type ON user_balance_history(transaction_type)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_balance_history_date ON user_balance_history(created_at)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_account_balance ON users(account_balance)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_message_balance ON users(message_balance)')
    
    console.log('✅ Performance indexes created')
    
    // Initialize existing users with default balances
    console.log('4️⃣ Initializing existing users with default balances...')
    
    await pool.query(`
      UPDATE users 
      SET 
        account_balance = COALESCE(account_balance, 0.00),
        message_balance = COALESCE(message_balance, 0),
        voucher_credits = COALESCE(voucher_credits, 0.00)
      WHERE account_balance IS NULL OR message_balance IS NULL OR voucher_credits IS NULL
    `)
    
    console.log('✅ Existing users initialized with default balances')
    
    // Create some sample users for testing
    console.log('5️⃣ Creating sample users for voucher testing...')
    
    const sampleUsers = [
      {
        email: 'customer1@vouchertest.com',
        name: 'Test Customer 1',
        role: 'CUSTOMER'
      },
      {
        email: 'customer2@vouchertest.com',
        name: 'Test Customer 2',
        role: 'CUSTOMER'
      },
      {
        email: 'dealer@vouchertest.com', 
        name: 'Test Dealer',
        role: 'DEALER'
      }
    ]
    
    // Get the CUSTOMER and DEALER role IDs
    const customerRole = await pool.query(`SELECT id FROM roles WHERE name = 'CUSTOMER' LIMIT 1`)
    const dealerRole = await pool.query(`SELECT id FROM roles WHERE name = 'DEALER' LIMIT 1`)
    
    for (const user of sampleUsers) {
      // Insert user (let ID auto-increment)
      await pool.query(`
        INSERT INTO users (
          email, name, password, account_balance, message_balance, voucher_credits, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          account_balance = COALESCE(users.account_balance, 0.00),
          message_balance = COALESCE(users.message_balance, 0),
          voucher_credits = COALESCE(users.voucher_credits, 0.00)
      `, [user.email, user.name, 'temp_password', 0.00, 0, 0.00])
      
      // Assign role
      const roleId = user.role === 'DEALER' ? dealerRole.rows[0]?.id : customerRole.rows[0]?.id
      if (roleId) {
        await pool.query(`
          INSERT INTO user_roles (user_id, role_id, is_primary, assigned_at)
          SELECT id, $2, true, CURRENT_TIMESTAMP
          FROM users 
          WHERE email = $1
          ON CONFLICT (user_id, role_id) DO NOTHING
        `, [user.email, roleId])
      }
      
      console.log(`   ✅ Created test user: ${user.email} (${user.role})`)
    }
    
    // Display current user balance summary
    console.log('\n6️⃣ User balance summary...')
    
    const balanceSummary = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(account_balance) as total_account_balance,
        SUM(message_balance) as total_message_balance,
        SUM(voucher_credits) as total_voucher_credits,
        AVG(account_balance) as avg_account_balance,
        AVG(message_balance) as avg_message_balance
      FROM users
      WHERE account_balance IS NOT NULL
    `)
    
    const balanceRanges = await pool.query(`
      SELECT 
        CASE 
          WHEN account_balance = 0 THEN 'Zero Balance'
          WHEN account_balance > 0 AND account_balance <= 100 THEN 'Low Balance (₹0-100)'
          WHEN account_balance > 100 AND account_balance <= 500 THEN 'Medium Balance (₹100-500)'
          ELSE 'High Balance (₹500+)'
        END as balance_range,
        COUNT(*) as user_count
      FROM users
      WHERE account_balance IS NOT NULL
      GROUP BY 
        CASE 
          WHEN account_balance = 0 THEN 'Zero Balance'
          WHEN account_balance > 0 AND account_balance <= 100 THEN 'Low Balance (₹0-100)'
          WHEN account_balance > 100 AND account_balance <= 500 THEN 'Medium Balance (₹100-500)'
          ELSE 'High Balance (₹500+)'
        END
      ORDER BY user_count DESC
    `)
    
    const summary = balanceSummary.rows[0]
    console.log('💰 User Balance Overview:')
    console.log(`   👥 Total Users: ${summary.total_users}`)
    console.log(`   💳 Total Account Balance: ₹${parseFloat(summary.total_account_balance || 0).toFixed(2)}`)
    console.log(`   💬 Total Message Balance: ${summary.total_message_balance || 0} messages`)
    console.log(`   🎫 Total Voucher Credits: ₹${parseFloat(summary.total_voucher_credits || 0).toFixed(2)}`)
    console.log(`   📊 Average Account Balance: ₹${parseFloat(summary.avg_account_balance || 0).toFixed(2)}`)
    console.log(`   📊 Average Message Balance: ${Math.round(summary.avg_message_balance || 0)} messages`)
    
    console.log('\n📈 Balance Distribution:')
    balanceRanges.rows.forEach(range => {
      console.log(`   ${range.balance_range}: ${range.user_count} users`)
    })
    
    console.log('\n🎉 Users table successfully updated for voucher system!')
    console.log('📋 Features Added:')
    console.log('   ✅ Account balance tracking')
    console.log('   ✅ Message credit tracking')
    console.log('   ✅ Voucher-specific credit tracking')
    console.log('   ✅ Balance history and audit trail')
    console.log('   ✅ Test users created for voucher testing')
    console.log('   ✅ Performance indexes for balance queries')
    
  } catch (error) {
    console.error('❌ Error updating users for vouchers:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    pool.end()
  }
}

updateUsersForVouchers()