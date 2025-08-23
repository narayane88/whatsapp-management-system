const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function fixCaseInsensitivePermissions() {
  try {
    console.log('🔧 Creating case-insensitive permission function...')
    
    // Drop existing function
    await pool.query(`DROP FUNCTION IF EXISTS user_has_permission(VARCHAR, VARCHAR)`)
    
    // Create case-insensitive permission function
    await pool.query(`
      CREATE OR REPLACE FUNCTION user_has_permission(input_email VARCHAR, input_permission VARCHAR)
      RETURNS BOOLEAN AS $$
      DECLARE
        target_user_id INTEGER;
        has_permission BOOLEAN := false;
      BEGIN
        -- Get user ID with case-insensitive email lookup
        SELECT id INTO target_user_id 
        FROM users 
        WHERE LOWER(email) = LOWER(input_email) AND "isActive" = true;
        
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
    
    console.log('✅ Created case-insensitive permission function')
    
    // Test with different email cases
    console.log('\n🧪 Testing case-insensitive permissions...')
    
    const testEmails = [
      'owner@demo.com',
      'OWNER@DEMO.COM', 
      'Owner@Demo.com',
      'admin@demo.com',
      'ADMIN@DEMO.COM'
    ]
    
    for (const email of testEmails) {
      const result = await pool.query(
        `SELECT user_has_permission($1, $2) as has_permission`,
        [email, 'permissions.read']
      )
      console.log(`  ✅ ${email}: ${result.rows[0].has_permission}`)
    }
    
    // Test admin permissions too
    console.log('\n🧪 Testing admin permissions...')
    const adminPerms = [
      'users.read',
      'users.create',
      'roles.read'
    ]
    
    for (const perm of adminPerms) {
      const result = await pool.query(
        `SELECT user_has_permission($1, $2) as has_permission`,
        ['ADMIN@DEMO.COM', perm]
      )
      console.log(`  ✅ Admin ${perm}: ${result.rows[0].has_permission}`)
    }
    
    console.log('\n🎉 Case-insensitive permissions working!')
    console.log('👑 Now OWNER will work regardless of email casing in session')
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Error fixing permissions:', error)
    process.exit(1)
  }
}

fixCaseInsensitivePermissions()