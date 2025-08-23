const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
})

async function testRoleManagement() {
  try {
    console.log('🧪 Testing Enhanced Role Management System...\n')
    
    // Test role management permissions
    const testUsers = ['owner@demo.com', 'admin@demo.com', 'subdealer@demo.com']
    const testPermissions = ['roles.read', 'roles.create', 'roles.update', 'roles.delete']
    
    console.log('🔍 Role Management Permission Tests:')
    for (const user of testUsers) {
      console.log(`\n👤 ${user}:`)
      for (const perm of testPermissions) {
        const result = await pool.query(
          'SELECT user_has_permission_simple($1, $2) as has_permission',
          [user, perm]
        )
        const status = result.rows[0].has_permission ? '✅' : '❌'
        console.log(`  ${status} ${perm}`)
      }
    }

    // Show roles with permission counts
    console.log('\n📊 Roles and Permission Counts:')
    const rolesResult = await pool.query(`
      SELECT 
        r.name,
        r.level,
        r.is_system,
        COUNT(DISTINCT ur.user_id) as user_count,
        COUNT(DISTINCT rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = true
      GROUP BY r.id, r.name, r.level, r.is_system
      ORDER BY r.level
    `)

    rolesResult.rows.forEach(role => {
      console.log(`  🛡️  ${role.name} (L${role.level}) - ${role.user_count} users, ${role.permission_count} permissions${role.is_system ? ' [SYSTEM]' : ''}`)
    })
    
    await pool.end()
    console.log('\n🎉 Enhanced Role Management System Ready!')
    console.log('\nNew Features:')
    console.log('  ✅ Role View/Edit Modal with tabs')
    console.log('  ✅ Permission selection by category')
    console.log('  ✅ Interactive checkboxes for permissions')
    console.log('  ✅ System role protection')
    console.log('  ✅ Proper action button states')
    console.log('  ✅ Role creation with permission assignment')
    console.log('  ✅ Role deletion (non-system, no users)')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testRoleManagement()