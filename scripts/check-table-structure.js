const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function checkTableStructure() {
  try {
    console.log('📋 Checking role_permissions table structure...')
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'role_permissions'
      ORDER BY ordinal_position
    `)
    
    console.log('Columns in role_permissions table:')
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
    })
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error)
    process.exit(1)
  }
}

checkTableStructure()