const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
})

async function checkVouchers() {
  try {
    console.log('Checking vouchers table structure...')
    
    // Check if table exists and get structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'vouchers' 
      ORDER BY ordinal_position
    `)
    
    console.log('Vouchers table columns:')
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    pool.end()
  }
}

checkVouchers()