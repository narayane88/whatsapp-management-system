const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function debugAuthColumns() {
  try {
    console.log('🔍 Debugging Authentication Column Error...\n')
    
    // Check users table structure
    console.log('📋 Users table columns:')
    const userColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `)
    
    userColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Check if role_id column exists in users table
    const hasRoleId = userColumns.rows.find(col => col.column_name === 'role_id')
    console.log(`\n🔍 role_id column in users table: ${hasRoleId ? '✅ EXISTS' : '❌ MISSING'}`)
    
    // Test the current auth query from NextAuth config
    console.log('\n🧪 Testing current NextAuth query...')
    
    const authQuery = `
      SELECT u.id, u.name, u.email, u.password, u."isActive", u."parentId", 
             r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u."isActive" = true
    `
    
    try {
      const testResult = await pool.query(authQuery, ['owner@demo.com'])
      console.log('  ✅ Query executed successfully')
      console.log(`  ✅ Found ${testResult.rows.length} user(s)`)
      
      if (testResult.rows.length > 0) {
        const user = testResult.rows[0]
        console.log('  ✅ User data:', {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        })
      }
    } catch (queryError) {
      console.log('  ❌ Query failed:', queryError.message)
      console.log('  📍 Error position:', queryError.position)
      
      // Try alternative query without role_id reference
      console.log('\n🔧 Trying alternative query...')
      
      const altQuery = `
        SELECT u.id, u.name, u.email, u.password, u."isActive", u."parentId", 
               r.name as role
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = $1 AND u."isActive" = true
      `
      
      try {
        const altResult = await pool.query(altQuery, ['owner@demo.com'])
        console.log('  ✅ Alternative query works')
        console.log(`  ✅ Found user: ${altResult.rows[0]?.name}`)
      } catch (altError) {
        console.log('  ❌ Alternative query also failed:', altError.message)
      }
    }
    
    // Check user_roles table structure
    console.log('\n📋 user_roles table columns:')
    const userRoleColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_roles'
      ORDER BY ordinal_position
    `)
    
    userRoleColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Check roles table
    console.log('\n📋 roles table columns:')
    const roleColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'roles'
      ORDER BY ordinal_position
    `)
    
    roleColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Test the joins manually
    console.log('\n🧪 Testing table joins manually...')
    
    try {
      const joinTest = await pool.query(`
        SELECT u.email, ur.role_id, r.name as role_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.email = 'owner@demo.com'
      `)
      
      console.log('  ✅ Join test successful')
      joinTest.rows.forEach(row => {
        console.log(`    - ${row.email}: role_id=${row.role_id}, role=${row.role_name}`)
      })
      
    } catch (joinError) {
      console.log('  ❌ Join test failed:', joinError.message)
    }
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
    process.exit(1)
  }
}

debugAuthColumns()