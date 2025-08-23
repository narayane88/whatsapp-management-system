const { Pool } = require('pg')

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
  ssl: false,
})

async function testConnection() {
  try {
    console.log('Testing PostgreSQL connection...')
    
    // Test basic connection
    const client = await pool.connect()
    console.log('✅ Database connection successful!')
    
    // Check if database exists and has tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('\n📋 Tables in database:')
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    // Check permissions table
    try {
      const permissionsResult = await client.query(`
        SELECT COUNT(*) as count FROM permissions
      `)
      console.log(`\n🔐 Permissions table: ${permissionsResult.rows[0].count} records`)
      
      // Show some sample permissions
      const samplePermissions = await client.query(`
        SELECT id, name, category, is_system_permission 
        FROM permissions 
        ORDER BY category, name 
        LIMIT 10
      `)
      
      console.log('\n📝 Sample permissions:')
      samplePermissions.rows.forEach(perm => {
        console.log(`  - ${perm.id}: ${perm.name} (${perm.category}) ${perm.is_system_permission ? '[SYSTEM]' : '[CUSTOM]'}`)
      })
    } catch (error) {
      console.log('❌ Permissions table not found or empty')
    }
    
    // Check users table
    try {
      const usersResult = await client.query(`
        SELECT COUNT(*) as count FROM users
      `)
      console.log(`\n👥 Users table: ${usersResult.rows[0].count} records`)
      
      // Show sample users
      const sampleUsers = await client.query(`
        SELECT u.name, u.email, r.name as role 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        LIMIT 5
      `)
      
      console.log('\n👤 Sample users:')
      sampleUsers.rows.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`)
      })
    } catch (error) {
      console.log('❌ Users table not found or empty')
    }
    
    // Check roles table
    try {
      const rolesResult = await client.query(`
        SELECT name, display_name FROM roles ORDER BY name
      `)
      console.log(`\n🏷️ Available roles:`)
      rolesResult.rows.forEach(role => {
        console.log(`  - ${role.name}: ${role.display_name}`)
      })
    } catch (error) {
      console.log('❌ Roles table not found or empty')
    }
    
    client.release()
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 PostgreSQL server might not be running. Please start PostgreSQL service.')
    } else if (error.code === '3D000') {
      console.log('\n💡 Database "whatsapp_system" does not exist. Please create it first.')
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed. Please check username/password.')
    }
  } finally {
    await pool.end()
  }
}

testConnection()