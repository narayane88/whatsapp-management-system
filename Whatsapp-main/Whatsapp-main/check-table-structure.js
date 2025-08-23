const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
  ssl: false,
})

async function checkTableStructure() {
  try {
    const client = await pool.connect()
    
    console.log('🔍 Checking users table structure...\n')
    
    // Get column information for users table
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log('Users table columns:')
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })
    
    console.log('\n📊 Sample users data:')
    const users = await client.query(`
      SELECT id, name, email, phone, role_id
      FROM users
      LIMIT 5
    `)
    
    users.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role ID: ${user.role_id}`)
    })
    
    client.release()
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkTableStructure()