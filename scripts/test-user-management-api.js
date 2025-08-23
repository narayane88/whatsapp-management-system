const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function testUserManagementSystem() {
  try {
    console.log('🧪 Testing User Management System...\n')
    
    // Test database tables
    console.log('📊 Database Tables:')
    const tables = ['users', 'roles', 'permissions', 'user_roles', 'role_permissions', 'user_permissions']
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`)
      console.log(`✅ ${table}: ${result.rows[0].count} records`)
    }
    
    console.log('\n👥 Users:')
    const users = await pool.query(`
      SELECT u.id, u.name, u.email, u."isActive", u.dealer_code
      FROM users u 
      ORDER BY u.id
    `)
    
    users.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) [${user.dealer_code}] - ${user.isActive ? 'Active' : 'Inactive'}`)
    })
    
    console.log('\n🎭 Roles:')
    const roles = await pool.query(`
      SELECT r.id, r.name, r.description, r.level, r.is_system,
             COUNT(ur.user_id) as user_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id
      ORDER BY r.level
    `)
    
    roles.rows.forEach(role => {
      console.log(`  - ${role.name} (Level ${role.level}) - ${role.user_count} users - ${role.is_system ? 'System' : 'Custom'}`)
    })
    
    console.log('\n🔐 Permissions by Category:')
    const permissionsByCategory = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM permissions
      GROUP BY category
      ORDER BY category
    `)
    
    permissionsByCategory.rows.forEach(cat => {
      console.log(`  - ${cat.category}: ${cat.count} permissions`)
    })
    
    console.log('\n🔗 Role Permissions (Owner):')
    const ownerPerms = await pool.query(`
      SELECT p.name, p.category, p.resource, p.action
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = 'OWNER' AND rp.granted = true
      ORDER BY p.category, p.resource, p.action
      LIMIT 10
    `)
    
    ownerPerms.rows.forEach(perm => {
      console.log(`  - ${perm.name} (${perm.category} > ${perm.resource}.${perm.action})`)
    })
    
    console.log('\n👤 User Role Assignments:')
    const userRoles = await pool.query(`
      SELECT u.name, u.email, r.name as role_name, ur.is_primary
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      ORDER BY u.name, ur.is_primary DESC
    `)
    
    userRoles.rows.forEach(assignment => {
      console.log(`  - ${assignment.name} (${assignment.email}) has role: ${assignment.role_name}${assignment.is_primary ? ' [PRIMARY]' : ''}`)
    })
    
    // Test permission checking logic directly
    console.log('\n🧪 Testing Permission Logic:')
    
    // Test direct permission check query
    const permissionCheck = await pool.query(`
      SELECT DISTINCT u.email, p.name as permission_name,
        CASE 
          WHEN up.granted IS NOT NULL THEN up.granted
          WHEN rp.granted IS NOT NULL THEN rp.granted
          ELSE false
        END as has_permission,
        CASE 
          WHEN up.granted IS NOT NULL THEN 'direct'
          WHEN rp.granted IS NOT NULL THEN 'role'
          ELSE 'none'
        END as permission_source
      FROM users u
      CROSS JOIN permissions p
      LEFT JOIN user_permissions up ON u.id = up.user_id AND p.id = up.permission_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id AND p.id = rp.permission_id
      WHERE u.email = 'owner@demo.com' 
        AND p.name IN ('users.create', 'users.read', 'permissions.create')
        AND u."isActive" = true
    `)
    
    permissionCheck.rows.forEach(result => {
      console.log(`  - ${result.email} can ${result.permission_name}: ${result.has_permission} (${result.permission_source})`)
    })
    
    console.log('\n✨ Database Verification Complete!')
    console.log('🚀 Ready to test API endpoints')
    console.log('\nAPI Endpoints available:')
    console.log('  GET /api/permissions - List all permissions')
    console.log('  POST /api/permissions - Create permission')
    console.log('  GET /api/roles - List all roles')
    console.log('  POST /api/roles - Create role')
    console.log('  GET /api/users - List all users')
    console.log('  POST /api/users - Create user')
    console.log('  GET /api/users/[id]/roles - Get user roles')
    console.log('  POST /api/users/[id]/roles - Assign role to user')
    console.log('  GET /api/users/[id]/permissions - Get user permissions')
    console.log('  POST /api/users/[id]/permissions - Assign permission to user')
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testUserManagementSystem()