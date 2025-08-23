const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function fixDatabaseFunctions() {
  try {
    console.log('🔧 Fixing database functions...')
    
    // Drop existing functions if they exist
    await pool.query(`DROP FUNCTION IF EXISTS user_has_permission(VARCHAR, VARCHAR)`)
    await pool.query(`DROP FUNCTION IF EXISTS get_user_permissions(VARCHAR)`)
    
    // Create simpler permission checking function
    await pool.query(`
      CREATE OR REPLACE FUNCTION user_has_permission(user_email VARCHAR, permission_name VARCHAR)
      RETURNS BOOLEAN AS 
      $$
      DECLARE
        has_perm BOOLEAN := false;
      BEGIN
        -- Check direct user permissions
        SELECT COALESCE(up.granted, false) INTO has_perm
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id
        LEFT JOIN permissions p ON up.permission_id = p.id
        WHERE u.email = user_email AND p.name = permission_name;
        
        -- If no direct permission found, check role permissions
        IF NOT has_perm THEN
          SELECT COALESCE(rp.granted, false) INTO has_perm
          FROM users u
          JOIN user_roles ur ON u.id = ur.user_id
          JOIN role_permissions rp ON ur.role_id = rp.role_id
          JOIN permissions p ON rp.permission_id = p.id
          WHERE u.email = user_email 
            AND p.name = permission_name
            AND u."isActive" = true
          LIMIT 1;
        END IF;
        
        RETURN COALESCE(has_perm, false);
      END;
      $$ LANGUAGE plpgsql;
    `)
    
    console.log('✅ Fixed user_has_permission function')
    
    // Create get user permissions function
    await pool.query(`
      CREATE OR REPLACE FUNCTION get_user_permissions(user_email VARCHAR)
      RETURNS TABLE (
        permission_name VARCHAR,
        category VARCHAR,
        resource VARCHAR,
        action VARCHAR,
        source VARCHAR
      ) AS 
      $$
      BEGIN
        RETURN QUERY
        SELECT DISTINCT
          p.name::VARCHAR as permission_name,
          p.category::VARCHAR,
          p.resource::VARCHAR,
          p.action::VARCHAR,
          CASE 
            WHEN up.granted IS NOT NULL THEN 'direct'::VARCHAR
            WHEN rp.granted IS NOT NULL THEN 'role'::VARCHAR
            ELSE 'none'::VARCHAR
          END as source
        FROM users u
        LEFT JOIN user_permissions up ON u.id = up.user_id
        LEFT JOIN permissions p ON up.permission_id = p.id OR (up.permission_id IS NULL AND rp.permission_id = p.id)
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id AND rp.permission_id = p.id
        WHERE u.email = user_email 
          AND u."isActive" = true
          AND (
            (up.granted = true) OR 
            (up.granted IS NULL AND rp.granted = true)
          )
        ORDER BY p.category, p.resource, p.action;
      END;
      $$ LANGUAGE plpgsql;
    `)
    
    console.log('✅ Fixed get_user_permissions function')
    
    // Test the functions
    console.log('🧪 Testing functions...')
    
    const testResult = await pool.query(
      "SELECT user_has_permission('owner@demo.com', 'users.create') as can_create"
    )
    console.log(`✅ Permission test: ${testResult.rows[0].can_create}`)
    
    // Test getting user permissions
    const permResult = await pool.query(
      "SELECT * FROM get_user_permissions('owner@demo.com') LIMIT 3"
    )
    console.log('✅ User permissions sample:')
    permResult.rows.forEach(perm => {
      console.log(`  - ${perm.permission_name} (${perm.source})`)
    })
    
    console.log('🎉 Database functions fixed successfully!')
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Error fixing functions:', error)
    process.exit(1)
  }
}

fixDatabaseFunctions()