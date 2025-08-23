const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:Nitin@123@localhost:5432/whatsapp_system?schema=public',
});

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure...');

    // Get table columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Users table columns:');
    columns.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    // Check for dealer-related fields
    const dealerFields = columns.rows.filter(row => 
      row.column_name.toLowerCase().includes('dealer') || 
      row.column_name.toLowerCase().includes('assign') ||
      row.column_name.toLowerCase().includes('code')
    );

    if (dealerFields.length > 0) {
      console.log('\n🎯 Dealer-related fields found:');
      dealerFields.forEach(field => {
        console.log(`  - ${field.column_name}: ${field.data_type}`);
      });
    } else {
      console.log('\n❌ No dealer assign code field found in users table');
    }

    // Sample user data
    const sampleUsers = await pool.query(`
      SELECT id, name, email, mobile, role, "parentId" 
      FROM users 
      LIMIT 5;
    `);

    console.log('\n👥 Sample users:');
    sampleUsers.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Name: ${user.name}, Role: ${user.role}, Parent: ${user.parentId}`);
    });

  } catch (error) {
    console.error('❌ Error checking users table:', error);
  } finally {
    await pool.end();
  }
}

checkUsersTable()
  .then(() => {
    console.log('\n✅ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });