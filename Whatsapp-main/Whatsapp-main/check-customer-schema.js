const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432
});

async function checkCustomerSchema() {
  try {
    console.log('🔍 Checking current customer/user table structure...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current users table structure:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? '(default: ' + row.column_default + ')' : ''}`);
    });
    
    console.log('\n🔍 Checking if packages table exists...');
    const packagesResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'packages'
      ORDER BY ordinal_position
    `);
    
    if (packagesResult.rows.length > 0) {
      console.log('📦 Packages table structure:');
      packagesResult.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('❌ Packages table does not exist');
    }
    
    console.log('\n🔍 Checking current customers...');
    const customersResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u."isActive", u."parentId",
             r.name as role,
             parent.name as parent_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN users parent ON u."parentId" = parent.id
      WHERE r.name = 'CUSTOMER' OR r.name = 'customer'
      LIMIT 10
    `);
    
    console.log(`👥 Found ${customersResult.rows.length} customers:`);
    customersResult.rows.forEach(customer => {
      console.log(`   ID: ${customer.id}, Name: ${customer.name}, Email: ${customer.email}, Phone: ${customer.phone || 'None'}, Parent: ${customer.parent_name || 'None'}`);
    });
    
    console.log('\n🔍 Checking dealer codes...');
    const dealerResult = await pool.query(`
      SELECT u.id, u.name, u.dealer_code, r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.dealer_code IS NOT NULL
      LIMIT 5
    `);
    
    console.log(`🏪 Found ${dealerResult.rows.length} users with dealer codes:`);
    dealerResult.rows.forEach(dealer => {
      console.log(`   ID: ${dealer.id}, Name: ${dealer.name}, Code: ${dealer.dealer_code}, Role: ${dealer.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

checkCustomerSchema();