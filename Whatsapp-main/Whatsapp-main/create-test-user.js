const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
  ssl: false,
})

async function createTestUser() {
  try {
    const client = await pool.connect()
    
    console.log('👤 Creating test user for authentication...\n')
    
    const testEmail = 'admin@test.com'
    const testPassword = 'password'
    const testName = 'Test Admin'
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(testPassword, 12)
    
    // Get OWNER role ID
    const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['OWNER'])
    
    if (roleResult.rows.length === 0) {
      console.log('❌ OWNER role not found. Please run setup-permissions.js first.')
      client.release()
      return
    }
    
    const ownerRoleId = roleResult.rows[0].id
    
    // Create or update test user
    await client.query(`
      INSERT INTO users (id, email, password, name, role, "isActive", role_id, "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
      password = $2, name = $3, role = $4, "isActive" = $5, role_id = $6, "updatedAt" = NOW()
    `, [testEmail, hashedPassword, testName, 'OWNER', true, ownerRoleId])
    
    console.log('✅ Test user created/updated successfully!')
    console.log('')
    console.log('🔑 Login credentials:')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}`)
    console.log(`   Role: OWNER`)
    console.log('')
    console.log('🚀 You can now:')
    console.log('   1. Open http://localhost:3000')
    console.log('   2. Sign in with the above credentials')
    console.log('   3. Navigate to Admin -> Users -> Permissions tab')
    console.log('   4. Test creating new permissions!')
    
    client.release()
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message)
  } finally {
    await pool.end()
  }
}

createTestUser()