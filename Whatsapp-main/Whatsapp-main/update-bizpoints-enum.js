const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function updateBizPointsEnum() {
  try {
    console.log('🔄 Updating BizPointsType enum values...\n')

    // First, check current enum values
    const currentValues = await pool.query(`
      SELECT unnest(enum_range(NULL::"BizPointsType")) AS enum_value
    `)

    console.log('Current enum values:')
    currentValues.rows.forEach(row => console.log(`  ${row.enum_value}`))

    // The desired values for our commission system
    const desiredValues = [
      'COMMISSION_EARNED',    // Earned from customer transactions
      'ADMIN_CREDIT',        // Manually credited by admin
      'ADMIN_DEBIT',         // Manually debited by admin
      'SETTLEMENT_WITHDRAW', // Withdrawn for settlement
      'BONUS'               // Bonus points
    ]

    console.log('\nDesired enum values:')
    desiredValues.forEach(value => console.log(`  ${value}`))

    // Add missing values to the enum
    for (const value of desiredValues) {
      try {
        await pool.query(`ALTER TYPE "BizPointsType" ADD VALUE '${value}'`)
        console.log(`✅ Added enum value: ${value}`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Enum value already exists: ${value}`)
        } else {
          console.error(`❌ Failed to add enum value ${value}:`, error.message)
        }
      }
    }

    // Show final enum values
    console.log('\n📋 Final enum values:')
    const finalValues = await pool.query(`
      SELECT unnest(enum_range(NULL::"BizPointsType")) AS enum_value
    `)

    finalValues.rows.forEach(row => console.log(`  ${row.enum_value}`))

    console.log('\n🎉 BizPointsType enum update completed!')

  } catch (error) {
    console.error('❌ Error updating enum:', error.message)
  } finally {
    await pool.end()
  }
}

updateBizPointsEnum()