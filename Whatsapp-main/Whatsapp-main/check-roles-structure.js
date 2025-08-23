const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:Nitin@123@localhost:5432/whatsapp_system?schema=public',
});

async function checkRolesStructure() {
  try {
    console.log('🔍 Checking roles table structure...');

    // Get roles table columns
    const rolesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'roles'
      ORDER BY ordinal_position;
    `);

    if (rolesColumns.rows.length > 0) {
      console.log('\n📋 Roles table columns:');
      rolesColumns.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
      });

      // Sample roles data
      const sampleRoles = await pool.query(`
        SELECT id, name, level, description
        FROM roles 
        ORDER BY level
        LIMIT 10;
      `);

      console.log('\n🏷️ Sample roles:');
      sampleRoles.rows.forEach(role => {
        console.log(`  - ID: ${role.id}, Name: ${role.name}, Level: ${role.level}, Description: ${role.description || 'N/A'}`);
      });
    } else {
      console.log('\n❌ Roles table not found or empty');
    }

    // Check user_roles table
    const userRolesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_roles'
      ORDER BY ordinal_position;
    `);

    if (userRolesColumns.rows.length > 0) {
      console.log('\n📋 User_roles table columns:');
      userRolesColumns.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
      });

      // Sample user roles with role names
      const sampleUserRoles = await pool.query(`
        SELECT ur.user_id, ur.role_id, r.name as role_name, r.level, u.name as user_name
        FROM user_roles ur
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN users u ON ur.user_id = u.id
        WHERE r.level IN (3, 4)
        ORDER BY r.level
        LIMIT 10;
      `);

      console.log('\n👥 Sample level 3 & 4 users:');
      sampleUserRoles.rows.forEach(userRole => {
        console.log(`  - User: ${userRole.user_name} (ID: ${userRole.user_id}), Role: ${userRole.role_name} (Level: ${userRole.level})`);
      });
    } else {
      console.log('\n❌ User_roles table not found or empty');
    }

  } catch (error) {
    console.error('❌ Error checking roles structure:', error);
  } finally {
    await pool.end();
  }
}

checkRolesStructure()
  .then(() => {
    console.log('\n✅ Check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });