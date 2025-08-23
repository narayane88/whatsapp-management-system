const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
})

async function checkTables() {
  try {
    console.log('Checking available tables...')
    
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    
    console.log('Available tables:')
    result.rows.forEach(table => {
      console.log(`  ${table.table_name}`)
    })
    
    // Check for role-related tables
    const roleTables = result.rows.filter(table => 
      table.table_name.includes('role') || table.table_name.includes('permission')
    )
    
    console.log('\nRole/Permission related tables:')
    for (const table of roleTables) {
      console.log(`\n${table.table_name}:`)
      const columns = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name])
      
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    pool.end()
  }
}

checkTables()