const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
})

async function checkUsersStructure() {
  try {
    console.log('Checking users table structure...')
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `)
    
    console.log('Users table columns:')
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'}) - ${col.column_default || 'no default'}`)
    })
    
    // Check a sample user
    const sampleUser = await pool.query('SELECT id, email, name FROM users LIMIT 1')
    if (sampleUser.rows.length > 0) {
      console.log('\nSample user:')
      console.log(`  ID: ${sampleUser.rows[0].id} (type: ${typeof sampleUser.rows[0].id})`)
      console.log(`  Email: ${sampleUser.rows[0].email}`)
      console.log(`  Name: ${sampleUser.rows[0].name}`)
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    pool.end()
  }
}

checkUsersStructure()