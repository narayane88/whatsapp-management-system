const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function addCommissionRateColumn() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Check if commission_rate column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'commission_rate'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Commission rate column already exists');
      return;
    }
    
    // Add commission_rate column
    console.log('🔄 Adding commission_rate column to users table...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 0.0 NOT NULL
    `);
    
    console.log('✅ Successfully added commission_rate column');
    console.log('✅ All Level 3 users can now have commission percentages set');
    
  } catch (error) {
    console.error('❌ Error adding commission_rate column:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the migration
addCommissionRateColumn();