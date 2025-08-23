const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost', 
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432
});

async function checkUsersAndPermissions() {
  try {
    console.log('🔍 Checking users and their permissions...\n');
    
    const usersResult = await pool.query(`
      SELECT u.id, u.name, u.email, u."isActive",
             r.name as role,
             ur.is_primary
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u."isActive" = true
      ORDER BY u.id
    `);
    
    console.log('👥 Active Users:');
    usersResult.rows.forEach(user => {
      console.log(`   ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role || 'none'}`);
    });
    
    console.log('\n🔑 Checking permissions for vouchers.read...');
    const permResult = await pool.query(`
      SELECT u.email, p.name as permission
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.name = 'vouchers.read' AND u."isActive" = true
    `);
    
    console.log('Users with vouchers.read permission:');
    if (permResult.rows.length === 0) {
      console.log('   ❌ No users have vouchers.read permission!');
    } else {
      permResult.rows.forEach(row => {
        console.log(`   ✅ Email: ${row.email}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    pool.end();
  }
}

checkUsersAndPermissions();