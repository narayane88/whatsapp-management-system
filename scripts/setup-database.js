const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function setupDatabase() {
  try {
    console.log('🔗 Connecting to PostgreSQL database...')
    
    // Test connection
    await pool.query('SELECT NOW()')
    console.log('✅ Database connection successful')
    
    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'complete-user-management-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('📝 Executing database schema...')
    
    // Execute schema (split by semicolons to handle multiple statements)
    const statements = schema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement) {
        try {
          await pool.query(statement)
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`)
        } catch (error) {
          console.warn(`⚠️  Statement ${i + 1} warning:`, error.message)
          // Continue with next statement for warnings like "table already exists"
        }
      }
    }
    
    console.log('🎉 Database schema setup completed!')
    
    // Verify setup by checking tables
    console.log('\n📊 Verifying database setup...')
    
    const tables = ['users', 'roles', 'permissions', 'user_roles', 'role_permissions', 'user_permissions']
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`)
      console.log(`✅ ${table}: ${result.rows[0].count} records`)
    }
    
    // Test permission function
    console.log('\n🧪 Testing permission system...')
    const permissionTest = await pool.query(
      "SELECT user_has_permission('owner@demo.com', 'users.create') as can_create_users"
    )
    console.log(`✅ Owner can create users: ${permissionTest.rows[0].can_create_users}`)
    
    // Show user permissions
    console.log('\n📋 Sample user permissions:')
    const userPermissions = await pool.query(`
      SELECT * FROM get_user_permissions('owner@demo.com') LIMIT 5
    `)
    
    userPermissions.rows.forEach(perm => {
      console.log(`  - ${perm.permission_name} (${perm.category} > ${perm.resource}.${perm.action})`)
    })
    
    console.log('\n🎯 User Management System is ready!')
    console.log('🔐 Demo users created:')
    console.log('  - owner@demo.com (password: demo123) - Full system access')
    console.log('  - admin@demo.com (password: demo123) - Admin access')
    console.log('  - subdealer@demo.com (password: demo123) - Sub-dealer access')
    console.log('  - employee@demo.com (password: demo123) - Employee access')
    console.log('  - customer@demo.com (password: demo123) - Customer access')
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  setupDatabase()
}

module.exports = { setupDatabase }