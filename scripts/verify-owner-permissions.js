const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function verifyOwnerPermissions() {
  try {
    console.log('🔍 Verifying OWNER permissions...\n')
    
    // Check total permissions in system
    const totalPerms = await pool.query(`SELECT COUNT(*) as count FROM permissions`)
    console.log(`📊 Total permissions in system: ${totalPerms.rows[0].count}`)
    
    // Check OWNER role permissions
    const ownerPerms = await pool.query(`
      SELECT COUNT(*) as count 
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      WHERE r.name = 'OWNER' AND rp.granted = true
    `)
    console.log(`👑 OWNER role permissions granted: ${ownerPerms.rows[0].count}`)
    
    // List all permissions with OWNER access status
    console.log('\n📋 Detailed permission check:')
    const permissionDetails = await pool.query(`
      SELECT 
        p.name,
        p.category,
        p.resource,
        p.action,
        COALESCE(rp.granted, false) as owner_has_access
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN roles r ON rp.role_id = r.id AND r.name = 'OWNER'
      ORDER BY p.category, p.resource, p.action
    `)
    
    let grantedCount = 0
    let deniedCount = 0
    
    permissionDetails.rows.forEach(perm => {
      const status = perm.owner_has_access ? '✅' : '❌'
      console.log(`  ${status} ${perm.name} (${perm.category} > ${perm.resource}.${perm.action})`)
      
      if (perm.owner_has_access) {
        grantedCount++
      } else {
        deniedCount++
      }
    })
    
    console.log(`\n📊 Summary:`)
    console.log(`  ✅ Granted: ${grantedCount}`)
    console.log(`  ❌ Denied: ${deniedCount}`)
    
    if (deniedCount > 0) {
      console.log('\n🔧 Some permissions are missing. Fixing now...')
      
      // Re-grant all permissions to OWNER
      await pool.query(`
        DELETE FROM role_permissions 
        WHERE role_id = (SELECT id FROM roles WHERE name = 'OWNER')
      `)
      
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id, granted, created_at)
        SELECT 
          (SELECT id FROM roles WHERE name = 'OWNER') as role_id,
          p.id as permission_id,
          true as granted,
          NOW() as created_at
        FROM permissions p
      `)
      
      console.log('✅ Re-granted ALL permissions to OWNER')
    }
    
    // Final verification test
    console.log('\n🧪 Final permission tests:')
    const allPermissions = await pool.query(`SELECT name FROM permissions ORDER BY name`)
    
    let successCount = 0
    let failureCount = 0
    
    for (const perm of allPermissions.rows) {
      const result = await pool.query(
        `SELECT user_has_permission($1, $2) as has_permission`,
        ['owner@demo.com', perm.name]
      )
      
      if (result.rows[0].has_permission) {
        successCount++
      } else {
        console.log(`  ❌ FAILED: ${perm.name}`)
        failureCount++
      }
    }
    
    console.log(`\n🎯 Final Results:`)
    console.log(`  ✅ OWNER can access: ${successCount}/${allPermissions.rows.length} permissions`)
    console.log(`  ❌ OWNER cannot access: ${failureCount} permissions`)
    
    if (failureCount === 0) {
      console.log('\n🎉 SUCCESS! OWNER has COMPLETE SYSTEM ACCESS!')
      console.log('👑 Owner can perform ANY TASK in the entire system!')
    } else {
      console.log('\n⚠️  Some permissions still need fixing')
    }
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Error verifying permissions:', error)
    process.exit(1)
  }
}

verifyOwnerPermissions()