const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function checkAuthSetup() {
  try {
    console.log('🔍 Checking Authentication Setup...\n')
    
    // Check table structure
    console.log('📋 Users table structure:')
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `)
    
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    // Check user data
    console.log('\n👥 User authentication data:')
    const users = await pool.query(`
      SELECT u.id, u.name, u.email, u."isActive", 
             CASE WHEN u.password IS NOT NULL THEN 'Yes' ELSE 'No' END as has_password,
             ur.role_id,
             r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      ORDER BY u.email
    `)
    
    users.rows.forEach(user => {
      console.log(`  - ${user.email}:`)
      console.log(`    * Active: ${user.isActive}`)
      console.log(`    * Has Password: ${user.has_password}`)
      console.log(`    * Role: ${user.role_name || 'None'}`)
    })
    
    // Test password verification for owner
    console.log('\n🔐 Testing password verification:')
    const ownerData = await pool.query(`
      SELECT email, password FROM users WHERE email = 'owner@demo.com'
    `)
    
    if (ownerData.rows.length > 0) {
      const user = ownerData.rows[0]
      console.log(`  - Found user: ${user.email}`)
      
      // Test with demo123 password
      const testPassword = 'demo123'
      const isValid = await bcrypt.compare(testPassword, user.password)
      console.log(`  - Password 'demo123' valid: ${isValid}`)
      
      if (!isValid) {
        console.log('  - Password hash:', user.password.substring(0, 20) + '...')
        
        // Try creating a new hash
        const newHash = await bcrypt.hash(testPassword, 10)
        console.log(`  - New hash created: ${newHash.substring(0, 20)}...`)
        
        // Test the new hash
        const newHashValid = await bcrypt.compare(testPassword, newHash)
        console.log(`  - New hash valid: ${newHashValid}`)
      }
    }
    
    // Test the auth query from NextAuth
    console.log('\n🧪 Testing NextAuth query:')
    const authQuery = `
      SELECT u.id, u.name, u.email, u.password, u."isActive", u."parentId", 
             r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u."isActive" = true
    `
    
    const testResult = await pool.query(authQuery, ['owner@demo.com'])
    
    if (testResult.rows.length > 0) {
      const user = testResult.rows[0]
      console.log(`  ✅ Query successful:`)
      console.log(`    * ID: ${user.id}`)
      console.log(`    * Name: ${user.name}`)
      console.log(`    * Email: ${user.email}`)
      console.log(`    * Active: ${user.isActive}`)
      console.log(`    * Role: ${user.role}`)
      console.log(`    * Has Password: ${!!user.password}`)
    } else {
      console.log('  ❌ Query returned no results')
    }
    
    console.log('\n🎯 Authentication Diagnosis:')
    const diagnosis = []
    
    if (testResult.rows.length === 0) {
      diagnosis.push('❌ User query failing - user not found or inactive')
    } else {
      diagnosis.push('✅ User query working')
    }
    
    const ownerUser = testResult.rows[0]
    if (ownerUser && ownerUser.password) {
      const passwordValid = await bcrypt.compare('demo123', ownerUser.password)
      if (passwordValid) {
        diagnosis.push('✅ Password verification working')
      } else {
        diagnosis.push('❌ Password verification failing')
      }
    } else {
      diagnosis.push('❌ No password hash found')
    }
    
    diagnosis.forEach(item => console.log(`  ${item}`))
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Error checking auth setup:', error)
    process.exit(1)
  }
}

checkAuthSetup()