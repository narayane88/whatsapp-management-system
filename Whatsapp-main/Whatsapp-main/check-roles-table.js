const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
})

async function checkRolesTable() {
  try {
    console.log('Checking user_roles table structure...')
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_roles' 
      ORDER BY ordinal_position
    `)
    
    console.log('User_roles table columns:')
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })
    
    // Check sample roles
    const roles = await pool.query('SELECT * FROM user_roles LIMIT 5')
    console.log('\nSample roles:')
    roles.rows.forEach(role => {
      console.log(`  ${role.id}: ${Object.keys(role).find(key => key.includes('name') || key.includes('role')) ? role[Object.keys(role).find(key => key.includes('name') || key.includes('role'))] : JSON.stringify(role)}`)
    })
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    pool.end()
  }
}

checkRolesTable()