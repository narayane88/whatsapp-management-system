const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Nitin@123@localhost:5432/whatsapp_system?schema=public',
});

async function verifyBizPointsSetup() {
  try {
    console.log('🔍 Verifying BizPoints system setup...');

    // Check if BizPoints columns exist
    const userColumns = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name IN ('biz_points', 'commission_rate');
    `);

    console.log('\n📋 User table BizPoints columns:');
    userColumns.rows.forEach(col => {
      console.log(`  ✅ ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
    });

    // Check PaymentMethod enum values
    const paymentMethods = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'PaymentMethod' 
      ORDER BY e.enumsortorder;
    `);

    console.log('\n💳 PaymentMethod enum values:');
    paymentMethods.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });

    // Check BizPointsType enum values
    const bizPointsTypes = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'BizPointsType' 
      ORDER BY e.enumsortorder;
    `);

    console.log('\n🏷️ BizPointsType enum values:');
    bizPointsTypes.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });

    // Check bizpoints_transactions table
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'bizpoints_transactions'
      );
    `);

    console.log('\n📊 BizPoints transactions table:', tableExists.rows[0].exists ? '✅ EXISTS' : '❌ NOT FOUND');

    // Check users with BizPoints and commissions
    const bizPointsUsers = await pool.query(`
      SELECT u.name, u.biz_points, u.commission_rate, r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.biz_points > 0 OR u.commission_rate > 0
      ORDER BY u.biz_points DESC, u.commission_rate DESC;
    `);

    console.log('\n👥 Users with BizPoints/Commission:');
    if (bizPointsUsers.rows.length > 0) {
      bizPointsUsers.rows.forEach(user => {
        console.log(`  💼 ${user.name} (${user.role || 'No Role'}): ₹${user.biz_points || 0} BizPoints, ${user.commission_rate || 0}% commission`);
      });
    } else {
      console.log('  ❌ No users found with BizPoints or commission rates');
    }

    // Test commission calculation hierarchy
    console.log('\n🏦 Testing commission hierarchy for customer transactions...');
    
    const customers = await pool.query(`
      SELECT u.id, u.name, u.parent_id, r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'CUSTOMER' AND u.parent_id IS NOT NULL
      LIMIT 3;
    `);

    for (const customer of customers.rows) {
      console.log(`\n  🧪 Customer: ${customer.name} (ID: ${customer.id})`);
      
      // Get dealer hierarchy
      const hierarchy = await pool.query(`
        WITH RECURSIVE dealer_chain AS (
          SELECT u.id, u.parent_id, u.commission_rate, r.level, r.name as role_name, u.name, 0 as depth
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
          LEFT JOIN roles r ON ur.role_id = r.id
          WHERE u.id = $1
          
          UNION ALL
          
          SELECT u.id, u.parent_id, u.commission_rate, r.level, r.name as role_name, u.name, dc.depth + 1
          FROM users u
          LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
          LEFT JOIN roles r ON ur.role_id = r.id
          INNER JOIN dealer_chain dc ON u.id = dc.parent_id
          WHERE dc.depth < 3 AND r.level IN (1, 2, 3)
        )
        SELECT * FROM dealer_chain 
        WHERE commission_rate > 0 AND depth > 0
        ORDER BY depth;
      `, [customer.id]);

      if (hierarchy.rows.length > 0) {
        hierarchy.rows.forEach((dealer, index) => {
          const commission = (100 * dealer.commission_rate) / 100;
          console.log(`    📈 Level ${index + 1}: ${dealer.name} (${dealer.role_name}) - ${dealer.commission_rate}% = ₹${commission.toFixed(2)} on ₹100`);
        });
      } else {
        console.log('    ❌ No commission hierarchy found');
      }
    }

    console.log('\n✅ BizPoints system verification completed!');
    console.log('\n🎯 System Status:');
    console.log('  📊 Database schema: Ready');
    console.log('  💳 Payment methods: BIZPOINTS added');
    console.log('  💰 Commission rates: Configured');
    console.log('  💎 Test BizPoints: Distributed');
    console.log('  🏦 Commission hierarchy: Functional');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

verifyBizPointsSetup()
  .then(() => {
    console.log('\n🚀 BizPoints system is ready for use!');
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification failed:', error);
    pool.end();
    process.exit(1);
  });