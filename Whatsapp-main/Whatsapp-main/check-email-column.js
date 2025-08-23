const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function checkEmailColumn() {
  try {
    console.log('🔍 Checking users table email column type...\n')
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'email'
    `)

    console.log('Email column details:')
    if (result.rows.length > 0) {
      const col = result.rows[0]
      console.log(`  Column: ${col.column_name}`)
      console.log(`  Type: ${col.data_type}`)
      console.log(`  Nullable: ${col.is_nullable}`)
      console.log(`  Default: ${col.column_default}`)
    } else {
      console.log('  No email column found!')
    }

    console.log('\n🔍 Sample email values from users table:')
    const emailSamples = await pool.query(`
      SELECT id, email, pg_typeof(email) as email_type
      FROM users 
      WHERE email IS NOT NULL
      LIMIT 5
    `)

    emailSamples.rows.forEach(row => {
      console.log(`  User ${row.id}: email="${row.email}" (type: ${row.email_type})`)
    })

    console.log('\n🔍 Testing LOWER function on email column:')
    try {
      const testQuery = await pool.query(`
        SELECT id, email, LOWER(email) as lower_email
        FROM users 
        WHERE email IS NOT NULL
        LIMIT 1
      `)
      console.log('✅ LOWER function works fine on email column')
      if (testQuery.rows.length > 0) {
        console.log(`  Example: "${testQuery.rows[0].email}" → "${testQuery.rows[0].lower_email}"`)
      }
    } catch (error) {
      console.log('❌ LOWER function failed on email column:')
      console.log(`  Error: ${error.message}`)
    }

  } catch (error) {
    console.error('❌ Error checking email column:', error.message)
  } finally {
    await pool.end()
  }
}

checkEmailColumn()