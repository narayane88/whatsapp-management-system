const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function createPermissionFunction() {
  try {
    console.log('🔧 Creating simple permission function...')
    
    // Drop existing function
    await pool.query(`DROP FUNCTION IF EXISTS user_has_permission(VARCHAR, VARCHAR)`)
    
    // Create a simple function that works
    await pool.query(`
      CREATE OR REPLACE FUNCTION user_has_permission(user_email VARCHAR, permission_name VARCHAR)
      RETURNS BOOLEAN AS $$
      DECLARE
        user_id INTEGER;
        has_direct_perm BOOLEAN := false;
        has_role_perm BOOLEAN := false;
      BEGIN
        -- Get user ID
        SELECT u.id INTO user_id FROM users u WHERE u.email = user_email AND u."isActive" = true;
        
        IF user_id IS NULL THEN
          RETURN false;
        END IF;
        
        -- Check direct permissions first
        SELECT COALESCE(up.granted, false) INTO has_direct_perm
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = user_id AND p.name = permission_name;
        
        -- If direct permission found, return it
        IF has_direct_perm IS NOT NULL THEN
          RETURN has_direct_perm;
        END IF;
        
        -- Check role permissions
        SELECT COALESCE(rp.granted, false) INTO has_role_perm
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = user_id AND p.name = permission_name
        LIMIT 1;
        
        RETURN COALESCE(has_role_perm, false);
      END;
      $$ LANGUAGE plpgsql;
    `)
    
    console.log('✅ Created user_has_permission function')
    
    // Test the function
    const testResult = await pool.query(
      "SELECT user_has_permission('owner@demo.com', 'users.create') as can_create"
    )
    console.log(`✅ Permission test: ${testResult.rows[0].can_create}`)
    
    const testResult2 = await pool.query(
      "SELECT user_has_permission('customer@demo.com', 'users.create') as can_create"
    )
    console.log(`✅ Permission test (customer): ${testResult2.rows[0].can_create}`)
    
    console.log('🎉 Permission function created and tested successfully!')
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Error creating function:', error)
    process.exit(1)
  }
}

createPermissionFunction()