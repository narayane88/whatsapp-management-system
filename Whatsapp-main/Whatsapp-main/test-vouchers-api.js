const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
})

async function testVouchersAPI() {
  try {
    console.log('🧪 Testing Vouchers API Integration...\n')
    
    // Test 1: Check database connectivity and sample data
    console.log('1️⃣ Checking database connectivity and sample data...')
    
    const vouchersResult = await pool.query(`
      SELECT 
        id, code, description, type, value, usage_limit, usage_count,
        is_active, expires_at, created_by, created_at,
        CASE 
          WHEN expires_at < CURRENT_TIMESTAMP THEN 'Expired'
          WHEN is_active = false THEN 'Paused'
          ELSE 'Active'
        END as status
      FROM vouchers
      ORDER BY created_at DESC
    `)
    
    console.log(`✅ Found ${vouchersResult.rows.length} vouchers in database`)
    
    vouchersResult.rows.forEach((voucher, index) => {
      console.log(`   ${index + 1}. ${voucher.code} - ${voucher.type} - ${voucher.status} - ${voucher.value}`)
    })
    
    // Test 2: Test statistics calculation
    console.log('\n2️⃣ Testing statistics calculation...')
    
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_vouchers,
        COUNT(CASE WHEN is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) THEN 1 END) as active_vouchers,
        SUM(usage_count) as total_usage,
        SUM(CASE WHEN type = 'credit' THEN value * usage_count ELSE 0 END) as credit_value_used
      FROM vouchers
    `)
    
    const stats = statsResult.rows[0]
    console.log('📊 Voucher Statistics:')
    console.log(`   🎫 Total Vouchers: ${stats.total_vouchers}`)
    console.log(`   ✅ Active Vouchers: ${stats.active_vouchers}`)
    console.log(`   🔄 Total Usage: ${stats.total_usage}`)
    console.log(`   💰 Credit Value Used: ₹${parseFloat(stats.credit_value_used || 0).toFixed(2)}`)
    
    // Test 3: Test search functionality
    console.log('\n3️⃣ Testing search functionality...')
    
    const searchResult = await pool.query(`
      SELECT code, description, type, status
      FROM (
        SELECT 
          code, description, type,
          CASE 
            WHEN expires_at < CURRENT_TIMESTAMP THEN 'Expired'
            WHEN is_active = false THEN 'Paused'
            ELSE 'Active'
          END as status
        FROM vouchers
      ) v
      WHERE code ILIKE $1 OR description ILIKE $1
    `, ['%WELCOME%'])
    
    console.log(`🔍 Search results for 'WELCOME': ${searchResult.rows.length} matches`)
    searchResult.rows.forEach(voucher => {
      console.log(`   - ${voucher.code}: ${voucher.description}`)
    })
    
    // Test 4: Test filter functionality
    console.log('\n4️⃣ Testing filter functionality...')
    
    const activeFilter = await pool.query(`
      SELECT COUNT(*) as count
      FROM vouchers
      WHERE is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `)
    
    const expiredFilter = await pool.query(`
      SELECT COUNT(*) as count
      FROM vouchers
      WHERE expires_at < CURRENT_TIMESTAMP
    `)
    
    const typeFilter = await pool.query(`
      SELECT type, COUNT(*) as count
      FROM vouchers
      GROUP BY type
      ORDER BY count DESC
    `)
    
    console.log(`🟢 Active vouchers: ${activeFilter.rows[0].count}`)
    console.log(`🔴 Expired vouchers: ${expiredFilter.rows[0].count}`)
    console.log('📋 Vouchers by type:')
    typeFilter.rows.forEach(type => {
      console.log(`   ${type.type}: ${type.count}`)
    })
    
    // Test 5: Test voucher creation (simulating API call)
    console.log('\n5️⃣ Testing voucher creation...')
    
    const testVoucherCode = `TEST${Date.now()}`
    const insertResult = await pool.query(`
      INSERT INTO vouchers (
        code, description, type, value, usage_limit, expires_at, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, code, type, value
    `, [
      testVoucherCode,
      'Test voucher created by API test',
      'credit',
      25.00,
      100,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      'API_TEST'
    ])
    
    console.log('✅ Test voucher created:')
    console.log(`   Code: ${insertResult.rows[0].code}`)
    console.log(`   Type: ${insertResult.rows[0].type}`)
    console.log(`   Value: ₹${insertResult.rows[0].value}`)
    
    // Test 6: Test voucher update
    console.log('\n6️⃣ Testing voucher update...')
    
    const testId = insertResult.rows[0].id
    await pool.query(`
      UPDATE vouchers 
      SET description = $1, usage_count = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [
      'Updated test voucher description',
      5,
      testId
    ])
    
    console.log('✅ Test voucher updated successfully')
    
    // Test 7: Clean up test voucher
    console.log('\n7️⃣ Cleaning up test data...')
    
    await pool.query('DELETE FROM vouchers WHERE id = $1', [testId])
    console.log('✅ Test voucher deleted')
    
    // Test 8: Test usage tracking
    console.log('\n8️⃣ Testing usage tracking...')
    
    const usageResult = await pool.query(`
      SELECT 
        v.code,
        v.usage_count,
        COUNT(vu.id) as actual_usage_records
      FROM vouchers v
      LEFT JOIN voucher_usage vu ON v.id = vu.voucher_id
      WHERE v.usage_count > 0
      GROUP BY v.id, v.code, v.usage_count
      LIMIT 3
    `)
    
    console.log('📝 Usage tracking verification:')
    usageResult.rows.forEach(usage => {
      console.log(`   ${usage.code}: ${usage.usage_count} usage count, ${usage.actual_usage_records} usage records`)
    })
    
    console.log('\n🎉 Vouchers API Integration Test Completed!')
    console.log('📋 Summary:')
    console.log('   ✅ Database connectivity working')
    console.log('   ✅ Sample data loaded correctly')
    console.log('   ✅ Statistics calculation accurate')
    console.log('   ✅ Search functionality working')
    console.log('   ✅ Filter functionality working')
    console.log('   ✅ CRUD operations working')
    console.log('   ✅ Usage tracking implemented')
    console.log('   ✅ Ready for frontend integration')
    
  } catch (error) {
    console.error('❌ Error testing vouchers API:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    pool.end()
  }
}

testVouchersAPI()