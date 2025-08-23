const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function fixBizPointsSchema() {
  try {
    console.log('🔄 Fixing BizPoints schema to match expected format...\n')

    // 1. Check if balance column exists in bizpoints_transactions
    const balanceCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bizpoints_transactions' 
      AND column_name = 'balance'
    `)

    if (balanceCheck.rows.length === 0) {
      console.log('🔄 Adding balance column to bizpoints_transactions...')
      await pool.query(`
        ALTER TABLE bizpoints_transactions 
        ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.0 NOT NULL
      `)
      console.log('✅ Added balance column')
    } else {
      console.log('✅ Balance column already exists')
    }

    // 2. Check current structure and show what we have
    console.log('\n📋 Current bizpoints_transactions table structure:')
    const currentStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bizpoints_transactions'
      ORDER BY ordinal_position
    `)

    currentStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`)
    })

    // 3. Check users table ID type
    console.log('\n📋 Users table ID column type:')
    const usersIdType = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'id'
    `)

    if (usersIdType.rows.length > 0) {
      console.log(`  users.id: ${usersIdType.rows[0].data_type}`)
      
      // If users.id is text/varchar, update bizpoints_transactions to match
      if (usersIdType.rows[0].data_type.includes('character')) {
        console.log('\n🔄 Updating bizpoints_transactions user_id to match users.id type...')
        
        // First, drop the foreign key constraint if it exists
        await pool.query(`
          ALTER TABLE bizpoints_transactions 
          DROP CONSTRAINT IF EXISTS bizpoints_transactions_user_id_fkey
        `).catch(() => console.log('No foreign key constraint to drop'))

        // Change the column type
        await pool.query(`
          ALTER TABLE bizpoints_transactions 
          ALTER COLUMN user_id TYPE TEXT USING user_id::text
        `)

        // Re-add the foreign key constraint
        await pool.query(`
          ALTER TABLE bizpoints_transactions 
          ADD CONSTRAINT bizpoints_transactions_user_id_fkey 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `)

        console.log('✅ Updated user_id column type to match users.id')
      }
    }

    // 4. Update created_by column to match users.id type as well
    if (usersIdType.rows.length > 0 && usersIdType.rows[0].data_type.includes('character')) {
      console.log('🔄 Updating created_by column type...')
      
      // Drop foreign key constraint if exists
      await pool.query(`
        ALTER TABLE bizpoints_transactions 
        DROP CONSTRAINT IF EXISTS bizpoints_transactions_created_by_fkey
      `).catch(() => console.log('No created_by foreign key constraint to drop'))

      // Change the column type
      await pool.query(`
        ALTER TABLE bizpoints_transactions 
        ALTER COLUMN created_by TYPE TEXT USING created_by::text
      `)

      // Re-add the foreign key constraint
      await pool.query(`
        ALTER TABLE bizpoints_transactions 
        ADD CONSTRAINT bizpoints_transactions_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      `)

      console.log('✅ Updated created_by column type')
    }

    // 5. Show final structure
    console.log('\n📋 Final bizpoints_transactions table structure:')
    const finalStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bizpoints_transactions'
      ORDER BY ordinal_position
    `)

    finalStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`)
    })

    console.log('\n🎉 BizPoints schema fix completed successfully!')

  } catch (error) {
    console.error('❌ Error fixing schema:', error.message)
  } finally {
    await pool.end()
  }
}

fixBizPointsSchema()