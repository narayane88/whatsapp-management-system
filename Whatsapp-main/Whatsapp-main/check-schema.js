const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function checkSchema() {
  try {
    console.log('🔍 Checking bizpoints_transactions table schema...\n')
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bizpoints_transactions'
      ORDER BY ordinal_position
    `)

    console.log('Columns in bizpoints_transactions table:')
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`)
    })

    console.log('\n🔍 Checking users table schema for parentId...\n')
    
    const usersResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name LIKE '%parent%'
      ORDER BY ordinal_position
    `)

    console.log('Parent-related columns in users table:')
    usersResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`)
    })

  } catch (error) {
    console.error('❌ Error checking schema:', error.message)
  } finally {
    await pool.end()
  }
}

checkSchema()