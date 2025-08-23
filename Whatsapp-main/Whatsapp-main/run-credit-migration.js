const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Nitin@123@localhost:5432/whatsapp_system?schema=public',
});

async function runCreditMigration() {
  try {
    console.log('🔄 Running credit payment migration...');

    // Add CREDIT to PaymentMethod enum if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_enum e 
              JOIN pg_type t ON e.enumtypid = t.oid 
              WHERE t.typname = 'PaymentMethod' AND e.enumlabel = 'CREDIT'
          ) THEN
              ALTER TYPE "PaymentMethod" ADD VALUE 'CREDIT';
              RAISE NOTICE 'Added CREDIT to PaymentMethod enum';
          ELSE
              RAISE NOTICE 'CREDIT already exists in PaymentMethod enum';
          END IF;
      END $$;
    `);

    // Verify the enum values
    const enumValues = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'PaymentMethod' 
      ORDER BY e.enumsortorder;
    `);

    console.log('\n💳 Available Payment Methods:');
    enumValues.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });

    // Update some test users with credit balance for demonstration
    console.log('\n💰 Adding test credit to eligible users...');
    const updateResult = await pool.query(`
      UPDATE users 
      SET message_balance = 500
      WHERE id IN (
        SELECT u.id 
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE r.level IN (3, 4)
      )
      RETURNING id, name, message_balance;
    `);

    updateResult.rows.forEach(user => {
      console.log(`  ✅ ${user.name} (ID: ${user.id}) - Credit Balance: ₹${user.message_balance}`);
    });

    console.log('\n📋 Migration Summary:');
    console.log('✅ CREDIT payment method added to enum');
    console.log('✅ Test credit balance (₹500) added to level 3 & 4 users');
    console.log('✅ Credit payment system ready for use');

    console.log('\n🎯 Next Steps:');
    console.log('1. Level 3 (SUBDEALER) and Level 4 (EMPLOYEE) users can now use credit payments');
    console.log('2. Credit payments will activate subscriptions immediately');
    console.log('3. Frontend UI will show credit option for eligible users');
    console.log('4. Available balance will be displayed when selecting credit payment');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

runCreditMigration()
  .then(() => {
    console.log('\n✅ Credit payment migration completed successfully!');
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    pool.end();
    process.exit(1);
  });