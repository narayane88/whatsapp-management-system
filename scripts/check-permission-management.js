const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
})

async function showPermissions() {
  try {
    console.log('📋 Current Permission Management permissions:')
    
    const result = await pool.query(
      "SELECT * FROM permissions WHERE category = $1 ORDER BY name",
      ['Permission Management']
    )
    
    result.rows.forEach(perm => {
      console.log(`  - ${perm.name}: ${perm.description}`)
    })
    
    console.log(`\nTotal: ${result.rows.length} permissions found`)
    
    await pool.end()
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

showPermissions()