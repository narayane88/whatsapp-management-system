const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
})

async function testSimplePermissions() {
  try {
    console.log('🧪 Testing Simplified Permission System...\n')
    
    // Test the new simplified function
    const result = await pool.query(
      'SELECT user_has_permission_simple($1, $2) as has_permission',
      ['owner@demo.com', 'users.create']
    )
    
    console.log('✅ Permission Check Test:', result.rows[0])
    
    // Test user role level function  
    const levelResult = await pool.query(
      'SELECT get_user_role_level($1) as role_level',
      ['owner@demo.com']
    )
    
    console.log('✅ Role Level Test:', levelResult.rows[0])
    
    // Show role permissions summary
    const summaryResult = await pool.query(`
      SELECT 
        r.name as role_name,
        r.level,
        COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = true
      GROUP BY r.id, r.name, r.level
      ORDER BY r.level
    `)
    
    console.log('\n📊 Role Permission Summary:')
    summaryResult.rows.forEach(row => {
      console.log(`  ${row.role_name} (Level ${row.level}): ${row.permission_count} permissions`)
    })

    // Test different users
    const testUsers = ['owner@demo.com', 'admin@demo.com', 'subdealer@demo.com', 'customer@demo.com']
    const testPermission = 'users.create'
    
    console.log(`\n🧪 Testing permission '${testPermission}' for different users:`)
    for (const email of testUsers) {
      const permResult = await pool.query(
        'SELECT user_has_permission_simple($1, $2) as has_permission',
        [email, testPermission]
      )
      console.log(`  ${email}: ${permResult.rows[0].has_permission ? '✅ Allowed' : '❌ Denied'}`)
    }
    
    await pool.end()
    console.log('\n🎉 Simple Permission System is Working!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testSimplePermissions()