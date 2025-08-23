const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function grantOwnerFullPermissions() {
  try {
    console.log('👑 Granting OWNER role full permissions...')
    
    // First, remove all existing OWNER permissions
    await pool.query(`
      DELETE FROM role_permissions 
      WHERE role_id = (SELECT id FROM roles WHERE name = 'OWNER')
    `)
    console.log('✅ Cleared existing OWNER permissions')
    
    // Grant OWNER role ALL permissions with granted = true
    await pool.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted, created_at)
      SELECT 
        (SELECT id FROM roles WHERE name = 'OWNER') as role_id,
        p.id as permission_id,
        true as granted,
        NOW() as created_at
      FROM permissions p
    `)
    
    console.log('✅ Granted ALL permissions to OWNER role')
    
    // Verify the permissions
    const permissionCount = await pool.query(`
      SELECT COUNT(*) as total_permissions FROM permissions
    `)
    
    const ownerPermissionCount = await pool.query(`
      SELECT COUNT(*) as owner_permissions 
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      WHERE r.name = 'OWNER' AND rp.granted = true
    `)
    
    console.log(`📊 Total permissions in system: ${permissionCount.rows[0].total_permissions}`)
    console.log(`👑 OWNER permissions granted: ${ownerPermissionCount.rows[0].owner_permissions}`)
    
    // Test owner permissions
    console.log('\n🧪 Testing OWNER permissions...')
    
    const testPermissions = [
      'users.create',
      'users.read', 
      'users.update',
      'users.delete',
      'roles.create',
      'roles.update',
      'roles.delete',
      'permissions.create',
      'permissions.update',
      'permissions.delete',
      'whatsapp.send',
      'packages.create',
      'finance.transactions.read',
      'system.settings.update'
    ]
    
    for (const permission of testPermissions) {
      const result = await pool.query(
        `SELECT user_has_permission('owner@demo.com', $1) as has_permission`,
        [permission]
      )
      console.log(`  ✅ ${permission}: ${result.rows[0].has_permission}`)
    }
    
    // Show all OWNER permissions by category
    console.log('\n📋 OWNER permissions by category:')
    const ownerPermsByCategory = await pool.query(`
      SELECT p.category, COUNT(*) as permission_count
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = 'OWNER' AND rp.granted = true
      GROUP BY p.category
      ORDER BY p.category
    `)
    
    ownerPermsByCategory.rows.forEach(cat => {
      console.log(`  📂 ${cat.category}: ${cat.permission_count} permissions`)
    })
    
    console.log('\n🎉 OWNER role now has FULL SYSTEM ACCESS!')
    console.log('👑 The owner can perform any task in the entire system')
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Error granting owner permissions:', error)
    process.exit(1)
  }
}

grantOwnerFullPermissions()