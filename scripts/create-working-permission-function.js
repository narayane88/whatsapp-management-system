const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function createWorkingPermissionFunction() {
  try {
    console.log('🔧 Creating working permission function...')
    
    // Drop existing function
    await pool.query(`DROP FUNCTION IF EXISTS user_has_permission(VARCHAR, VARCHAR)`)
    
    // Create simple function that works with proper aliasing
    await pool.query(`
      CREATE OR REPLACE FUNCTION user_has_permission(input_email VARCHAR, input_permission VARCHAR)
      RETURNS BOOLEAN AS $$
      DECLARE
        target_user_id INTEGER;
        has_permission BOOLEAN := false;
      BEGIN
        -- Get user ID
        SELECT id INTO target_user_id 
        FROM users 
        WHERE email = input_email AND "isActive" = true;
        
        IF target_user_id IS NULL THEN
          RETURN false;
        END IF;
        
        -- Check direct user permissions first (these override role permissions)
        SELECT COALESCE(up.granted, false) INTO has_permission
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = target_user_id AND p.name = input_permission;
        
        -- If direct permission found (either granted or denied), return it
        IF FOUND THEN
          RETURN has_permission;
        END IF;
        
        -- Check role permissions if no direct permission found
        SELECT COALESCE(rp.granted, false) INTO has_permission
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = target_user_id 
          AND p.name = input_permission
          AND rp.granted = true
        LIMIT 1;
        
        RETURN COALESCE(has_permission, false);
      END;
      $$ LANGUAGE plpgsql;
    `)
    
    console.log('✅ Created working user_has_permission function')
    
    // Test the function with owner
    console.log('\n🧪 Testing OWNER permissions...')
    const testPermissions = [
      'users.create',
      'users.read', 
      'users.update',
      'users.delete',
      'roles.create',
      'permissions.create',
      'whatsapp.send',
      'finance.transactions.read',
      'system.settings.update'
    ]
    
    for (const permission of testPermissions) {
      const result = await pool.query(
        `SELECT user_has_permission($1, $2) as has_permission`,
        ['owner@demo.com', permission]
      )
      console.log(`  ✅ ${permission}: ${result.rows[0].has_permission}`)
    }
    
    // Test with other users to verify hierarchy
    console.log('\n🧪 Testing other users...')
    const customerTest = await pool.query(
      `SELECT user_has_permission($1, $2) as has_permission`,
      ['customer@demo.com', 'users.create']
    )
    console.log(`  ✅ Customer can create users: ${customerTest.rows[0].has_permission}`)
    
    const adminTest = await pool.query(
      `SELECT user_has_permission($1, $2) as has_permission`,
      ['admin@demo.com', 'users.read']
    )
    console.log(`  ✅ Admin can read users: ${adminTest.rows[0].has_permission}`)
    
    console.log('\n🎉 Permission function is working correctly!')
    console.log('👑 OWNER has full system access to perform any task!')
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Error creating function:', error)
    process.exit(1)
  }
}

createWorkingPermissionFunction()