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

async function fixUserPasswords() {
  try {
    console.log('🔧 Fixing user passwords for authentication...\n')
    
    const users = [
      { email: 'owner@demo.com', name: 'System Owner' },
      { email: 'admin@demo.com', name: 'Admin User' },
      { email: 'subdealer@demo.com', name: 'Sub Dealer' },
      { email: 'employee@demo.com', name: 'Employee User' },
      { email: 'customer@demo.com', name: 'Customer User' }
    ]
    
    const password = 'demo123'
    
    console.log(`Creating bcrypt hash for password: ${password}`)
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log(`Hash created: ${hashedPassword.substring(0, 20)}...\n`)
    
    // Verify the hash works
    const testVerify = await bcrypt.compare(password, hashedPassword)
    console.log(`Hash verification test: ${testVerify}\n`)
    
    if (!testVerify) {
      throw new Error('Hash verification failed!')
    }
    
    console.log('Updating user passwords...')
    
    for (const user of users) {
      await pool.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2',
        [hashedPassword, user.email]
      )
      console.log(`✅ Updated password for ${user.name} (${user.email})`)
    }
    
    console.log('\n🧪 Testing updated passwords...')
    
    for (const user of users) {
      const result = await pool.query(
        'SELECT email, password FROM users WHERE email = $1',
        [user.email]
      )
      
      if (result.rows.length > 0) {
        const dbUser = result.rows[0]
        const isValid = await bcrypt.compare(password, dbUser.password)
        const status = isValid ? '✅' : '❌'
        console.log(`  ${status} ${user.email}: ${isValid}`)
      }
    }
    
    console.log('\n🎉 Password update completed!')
    console.log('\n🔑 Login credentials:')
    users.forEach(user => {
      console.log(`  - ${user.email} / ${password}`)
    })
    
    console.log('\n🚀 Authentication should now work at:')
    console.log('  http://localhost:3000/auth/signin')
    console.log('  http://26.155.17.128:3000/auth/signin')
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Error fixing passwords:', error)
    process.exit(1)
  }
}

fixUserPasswords()