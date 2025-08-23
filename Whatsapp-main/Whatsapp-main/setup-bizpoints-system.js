const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Nitin@123@localhost:5432/whatsapp_system?schema=public',
});

async function setupBizPointsSystem() {
  try {
    console.log('🚀 Setting up BizPoints system...');

    // 1. Add BizPoints columns to users table
    console.log('\n📋 Adding BizPoints columns to users table...');
    
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS biz_points DECIMAL(10,2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0.00;
    `);
    
    console.log('✅ Added biz_points and commission_rate columns to users table');

    // 2. Create BizPointsType enum
    console.log('\n🏷️ Creating BizPointsType enum...');
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "BizPointsType" AS ENUM ('EARNED', 'PURCHASED', 'SPENT', 'ADMIN_GRANTED');
        EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('✅ Created BizPointsType enum');

    // 3. Add BIZPOINTS to PaymentMethod enum
    console.log('\n💳 Adding BIZPOINTS to PaymentMethod enum...');
    
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_enum e 
              JOIN pg_type t ON e.enumtypid = t.oid 
              WHERE t.typname = 'PaymentMethod' AND e.enumlabel = 'BIZPOINTS'
          ) THEN
              ALTER TYPE "PaymentMethod" ADD VALUE 'BIZPOINTS';
          END IF;
      END $$;
    `);
    
    console.log('✅ Added BIZPOINTS to PaymentMethod enum');

    // 4. Create bizpoints_transactions table
    console.log('\n📊 Creating bizpoints_transactions table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bizpoints_transactions (
        id VARCHAR PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_by INTEGER REFERENCES users(id),
        type "BizPointsType" NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        reference VARCHAR,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Created bizpoints_transactions table');

    // 5. Add some sample commission rates to dealers
    console.log('\n💰 Setting up sample commission rates for dealers...');
    
    const dealerCommissions = [
      { role: 'OWNER', rate: 5.0 },
      { role: 'ADMIN', rate: 4.0 }, 
      { role: 'SUBDEALER', rate: 3.0 }
    ];

    for (const { role, rate } of dealerCommissions) {
      await pool.query(`
        UPDATE users u
        SET commission_rate = $1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE u.id = ur.user_id 
          AND ur.is_primary = true
          AND r.name = $2
          AND u.commission_rate = 0;
      `, [rate, role]);
      
      console.log(`  ✅ Set ${rate}% commission rate for ${role} users`);
    }

    // 6. Add some test BizPoints to dealers for demonstration
    console.log('\n💎 Adding test BizPoints to dealers...');
    
    const testBizPointsResult = await pool.query(`
      UPDATE users u
      SET biz_points = 100.00
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ur.user_id 
        AND ur.is_primary = true
        AND r.name IN ('OWNER', 'ADMIN', 'SUBDEALER')
        AND u.biz_points = 0
      RETURNING u.id, u.name, u.biz_points;
    `);

    testBizPointsResult.rows.forEach(user => {
      console.log(`  💎 ${user.name} (ID: ${user.id}) - Balance: ₹${user.biz_points}`);
    });

    // 7. Verify the setup
    console.log('\n🔍 Verifying BizPoints system setup...');

    // Check enums
    const enumCheck = await pool.query(`
      SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname IN ('PaymentMethod', 'BizPointsType')
      GROUP BY t.typname
      ORDER BY t.typname;
    `);

    enumCheck.rows.forEach(row => {
      console.log(`  📋 ${row.typname}: [${row.values.join(', ')}]`);
    });

    // Check users with BizPoints
    const bizPointsUsers = await pool.query(`
      SELECT u.name, u.biz_points, u.commission_rate, r.name as role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      JOIN roles r ON ur.role_id = r.id
      WHERE u.biz_points > 0 OR u.commission_rate > 0
      ORDER BY r.level, u.name;
    `);

    console.log('\n👥 Users with BizPoints/Commission setup:');
    bizPointsUsers.rows.forEach(user => {
      console.log(`  💼 ${user.name} (${user.role}): ₹${user.biz_points} BizPoints, ${user.commission_rate}% commission`);
    });

    // Check table structure
    const tableCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'bizpoints_transactions'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 BizPoints transactions table structure:');
    tableCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log('\n🎯 BizPoints System Features:');
    console.log('✅ Commission-based earning system');
    console.log('✅ Point purchase with commission bonus');
    console.log('✅ BizPoints as payment method for subscriptions');
    console.log('✅ Admin can grant points directly');
    console.log('✅ Complete transaction tracking');
    console.log('✅ Dealer hierarchy commission distribution');
    console.log('✅ 1 BizPoint = ₹1 value system');

  } catch (error) {
    console.error('❌ BizPoints system setup failed:', error);
    throw error;
  }
}

setupBizPointsSystem()
  .then(() => {
    console.log('\n✅ BizPoints system setup completed successfully!');
    console.log('🚀 System is ready for use!');
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    pool.end();
    process.exit(1);
  });