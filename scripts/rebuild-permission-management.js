const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
})

async function rebuildPermissionManagement() {
  try {
    console.log('🔧 Rebuilding Permission Management System...\n')
    
    // Step 1: Remove old Permission Management permissions
    console.log('🗑️ Removing existing Permission Management permissions...')
    
    // First remove from role_permissions
    await pool.query(`
      DELETE FROM role_permissions 
      WHERE permission_id IN (
        SELECT id FROM permissions 
        WHERE category = 'Permission Management'
      )
    `)
    
    // Then remove the permissions themselves
    const deleteResult = await pool.query(
      "DELETE FROM permissions WHERE category = 'Permission Management' RETURNING name"
    )
    
    deleteResult.rows.forEach(perm => {
      console.log(`  ❌ Removed: ${perm.name}`)
    })
    
    // Step 2: Create new Permission Management permissions
    console.log('\n✅ Creating new Permission Management system...')
    
    const newPermissions = [
      {
        name: 'permissions.manage',
        description: 'Full permission management access',
        category: 'Permission Management',
        resource: 'permissions',
        action: 'manage'
      },
      {
        name: 'permissions.view',
        description: 'View permission details and assignments',
        category: 'Permission Management', 
        resource: 'permissions',
        action: 'view'
      },
      {
        name: 'permissions.create',
        description: 'Create new custom permissions',
        category: 'Permission Management',
        resource: 'permissions',
        action: 'create'
      },
      {
        name: 'permissions.edit',
        description: 'Edit permission properties',
        category: 'Permission Management',
        resource: 'permissions',
        action: 'edit'
      },
      {
        name: 'permissions.delete',
        description: 'Delete custom permissions',
        category: 'Permission Management',
        resource: 'permissions',
        action: 'delete'
      },
      {
        name: 'permissions.assign',
        description: 'Assign/unassign permissions to roles',
        category: 'Permission Management',
        resource: 'permissions',
        action: 'assign'
      },
      {
        name: 'permissions.system.manage',
        description: 'Manage system permissions (dangerous)',
        category: 'Permission Management',
        resource: 'permissions',
        action: 'system_manage'
      }
    ]
    
    for (const perm of newPermissions) {
      await pool.query(`
        INSERT INTO permissions (name, description, category, resource, action, is_system)
        VALUES ($1, $2, $3, $4, $5, true)
      `, [perm.name, perm.description, perm.category, perm.resource, perm.action])
      
      console.log(`  ✅ Added: ${perm.name}`)
    }
    
    // Step 3: Grant permissions to appropriate roles
    console.log('\n🎯 Assigning permissions to roles...')
    
    // OWNER gets all permission management permissions
    const ownerPermissions = newPermissions.map(p => p.name)
    for (const permName of ownerPermissions) {
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id, granted)
        SELECT r.id, p.id, true
        FROM roles r, permissions p
        WHERE r.name = 'OWNER' AND p.name = $1
        ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true
      `, [permName])
    }
    console.log(`  ✅ OWNER: ${ownerPermissions.length} permissions`)
    
    // ADMIN gets most permissions except system management
    const adminPermissions = newPermissions
      .filter(p => p.name !== 'permissions.system.manage')
      .map(p => p.name)
    
    for (const permName of adminPermissions) {
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id, granted)
        SELECT r.id, p.id, true
        FROM roles r, permissions p
        WHERE r.name = 'ADMIN' AND p.name = $1
        ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true
      `, [permName])
    }
    console.log(`  ✅ ADMIN: ${adminPermissions.length} permissions`)
    
    // SUBDEALER gets only view permissions
    await pool.query(`
      INSERT INTO role_permissions (role_id, permission_id, granted)
      SELECT r.id, p.id, true
      FROM roles r, permissions p
      WHERE r.name = 'SUBDEALER' AND p.name = 'permissions.view'
      ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true
    `)
    console.log(`  ✅ SUBDEALER: 1 permission`)
    
    // Step 4: Show summary
    console.log('\n📊 Permission Management System Summary:')
    
    const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM permissions WHERE category = 'Permission Management') as total_permissions,
        (SELECT COUNT(*) FROM role_permissions rp 
         JOIN permissions p ON rp.permission_id = p.id 
         WHERE p.category = 'Permission Management' AND rp.granted = true) as total_assignments
    `)
    
    const stats = summary.rows[0]
    console.log(`  📋 Total Permissions: ${stats.total_permissions}`)
    console.log(`  🔗 Total Role Assignments: ${stats.total_assignments}`)
    
    await pool.end()
    
    console.log('\n🎉 Permission Management System Rebuilt Successfully!')
    console.log('\nNew Features:')
    console.log('  ✅ Clean permission structure')
    console.log('  ✅ Granular access control')
    console.log('  ✅ System permission protection')
    console.log('  ✅ Role-based assignments')
    
  } catch (error) {
    console.error('❌ Rebuild failed:', error)
    process.exit(1)
  }
}

rebuildPermissionManagement()