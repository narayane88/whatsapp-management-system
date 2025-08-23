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

async function checkUsers() {
  try {
    const client = await pool.connect()
    
    console.log('👥 Checking existing users and their credentials...\n')
    
    // Get all users with their roles
    const result = await client.query(`
      SELECT u.id, u.name, u.email, r.name as role_name, u.password_hash
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id
    `)
    
    console.log('Existing users:')
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role_name || 'No role assigned'}`)
      console.log(`   Has password: ${user.password_hash ? 'Yes' : 'No'}`)
      console.log('')
    })
    
    // Create a test user with known credentials if none exist with proper password
    const hasValidUser = result.rows.some(user => user.password_hash && user.role_name)
    
    if (!hasValidUser) {
      console.log('Creating test user with credentials...')
      
      const testPassword = 'password'
      const hashedPassword = await bcrypt.hash(testPassword, 12)
      
      // Get OWNER role ID
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['OWNER'])
      const ownerRoleId = roleResult.rows[0]?.id
      
      if (ownerRoleId) {
        // Update or create admin user
        await client.query(`
          INSERT INTO users (name, email, password_hash, role_id, status)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (email) DO UPDATE SET
          password_hash = $3, role_id = $4, status = $5
        `, ['Admin User', 'admin@whatsapp-system.com', hashedPassword, ownerRoleId, 'active'])
        
        console.log('✅ Test user created/updated:')
        console.log('   Email: admin@whatsapp-system.com')
        console.log('   Password: password')
        console.log('   Role: OWNER')
      }
    }
    
    client.release()
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkUsers()