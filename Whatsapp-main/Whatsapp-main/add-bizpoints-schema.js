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

async function addBizPointsSchema() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Check if bizPoints column already exists
    const checkBizPoints = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'biz_points'
    `);
    
    if (checkBizPoints.rows.length === 0) {
      console.log('🔄 Adding biz_points column to users table...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN biz_points DECIMAL(10,2) DEFAULT 0.0 NOT NULL
      `);
      console.log('✅ Added biz_points column');
    } else {
      console.log('✅ BizPoints column already exists');
    }
    
    // Create BizPointsType enum if it doesn't exist
    const checkEnum = await pool.query(`
      SELECT 1 FROM pg_type WHERE typname = 'BizPointsType'
    `);
    
    if (checkEnum.rows.length === 0) {
      console.log('🔄 Creating BizPointsType enum...');
      await pool.query(`
        CREATE TYPE "BizPointsType" AS ENUM (
          'COMMISSION_EARNED',
          'ADMIN_CREDIT', 
          'ADMIN_DEBIT',
          'SETTLEMENT_WITHDRAW',
          'BONUS'
        )
      `);
      console.log('✅ Created BizPointsType enum');
    } else {
      console.log('✅ BizPointsType enum already exists');
    }
    
    // Create bizpoints_transactions table
    const checkTable = await pool.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'bizpoints_transactions'
    `);
    
    if (checkTable.rows.length === 0) {
      console.log('🔄 Creating bizpoints_transactions table...');
      await pool.query(`
        CREATE TABLE bizpoints_transactions (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type "BizPointsType" NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          balance DECIMAL(10,2) NOT NULL,
          description TEXT,
          reference TEXT,
          "createdBy" TEXT REFERENCES users(id) ON DELETE SET NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create indexes for better performance
      await pool.query(`
        CREATE INDEX idx_bizpoints_transactions_user_id ON bizpoints_transactions("userId");
        CREATE INDEX idx_bizpoints_transactions_created_at ON bizpoints_transactions("createdAt");
        CREATE INDEX idx_bizpoints_transactions_type ON bizpoints_transactions(type);
      `);
      
      console.log('✅ Created bizpoints_transactions table with indexes');
    } else {
      console.log('✅ BizPoints transactions table already exists');
    }
    
    console.log('🎉 BizPoints schema setup completed successfully!');
    console.log('📊 Ready to implement BizPoints commission settlement system');
    
  } catch (error) {
    console.error('❌ Error setting up BizPoints schema:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the migration
addBizPointsSchema();