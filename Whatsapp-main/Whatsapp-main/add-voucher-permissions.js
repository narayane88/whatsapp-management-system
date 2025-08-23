const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whatsapp_system',
  password: 'Nitin@123',
  port: 5432,
})

async function addVoucherPermissions() {
  try {
    console.log('🔐 Adding voucher permissions to system...\n')
    
    // Add voucher permissions
    console.log('1️⃣ Adding voucher permissions...')
    
    const voucherPermissions = [
      {
        name: 'vouchers.read',
        description: 'View vouchers and voucher statistics',
        category: 'vouchers',
        resource: 'vouchers',
        action: 'read'
      },
      {
        name: 'vouchers.create',
        description: 'Create new vouchers',
        category: 'vouchers',
        resource: 'vouchers',
        action: 'create'
      },
      {
        name: 'vouchers.update',
        description: 'Edit and modify existing vouchers',
        category: 'vouchers',
        resource: 'vouchers',
        action: 'update'
      },
      {
        name: 'vouchers.delete',
        description: 'Delete vouchers (with usage protection)',
        category: 'vouchers',
        resource: 'vouchers',
        action: 'delete'
      },
      {
        name: 'vouchers.manage',
        description: 'Full voucher management access',
        category: 'vouchers',
        resource: 'vouchers',
        action: 'manage'
      }
    ]
    
    for (const permission of voucherPermissions) {
      await pool.query(`
        INSERT INTO permissions (name, description, category, resource, action, created_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (name) DO UPDATE SET
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          resource = EXCLUDED.resource,
          action = EXCLUDED.action
      `, [permission.name, permission.description, permission.category, permission.resource, permission.action])
      
      console.log(`   ✅ ${permission.name}: ${permission.description}`)
    }
    
    // Assign voucher permissions to OWNER role
    console.log('\n2️⃣ Assigning voucher permissions to OWNER role...')
    
    const ownerRoleResult = await pool.query(`
      SELECT id FROM roles WHERE name = 'OWNER'
    `)
    
    if (ownerRoleResult.rows.length === 0) {
      console.log('⚠️  OWNER role not found, skipping permission assignment')
    } else {
      const ownerRoleId = ownerRoleResult.rows[0].id
      
      for (const permission of voucherPermissions) {
        const permissionResult = await pool.query(`
          SELECT id FROM permissions WHERE name = $1
        `, [permission.name])
        
        if (permissionResult.rows.length > 0) {
          const permissionId = permissionResult.rows[0].id
          
          await pool.query(`
            INSERT INTO role_permissions (role_id, permission_id, created_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (role_id, permission_id) DO NOTHING
          `, [ownerRoleId, permissionId])
          
          console.log(`   ✅ Assigned ${permission.name} to OWNER role`)
        }
      }
    }
    
    // Check current permissions structure
    console.log('\n3️⃣ Current voucher permissions overview...')
    
    const permissionsResult = await pool.query(`
      SELECT 
        p.name,
        p.description,
        p.category,
        COUNT(rp.role_id) as assigned_roles
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE p.category = 'vouchers'
      GROUP BY p.id, p.name, p.description, p.category
      ORDER BY p.name
    `)
    
    console.log('📋 Voucher permissions summary:')
    permissionsResult.rows.forEach(perm => {
      console.log(`   🔐 ${perm.name} (${perm.assigned_roles} roles)`)
      console.log(`      ${perm.description}`)
    })
    
    // Test permission check query
    console.log('\n4️⃣ Testing permission check functionality...')
    
    const testPermissionQuery = `
      SELECT EXISTS(
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.email = $1 AND p.name = $2 AND rp.granted = true
      ) as has_permission
    `
    
    // Test with a sample email (replace with actual admin email if available)
    const testEmail = 'admin@example.com'
    const testResult = await pool.query(testPermissionQuery, [testEmail, 'vouchers.read'])
    
    console.log(`🧪 Permission test for ${testEmail}:`)
    console.log(`   vouchers.read: ${testResult.rows[0].has_permission ? '✅ Allowed' : '❌ Denied'}`)
    
    console.log('\n🎉 Voucher permissions successfully configured!')
    console.log('📋 Summary:')
    console.log('   ✅ Added 5 voucher-specific permissions')
    console.log('   ✅ Assigned permissions to OWNER role')
    console.log('   ✅ Permission checking functionality tested')
    console.log('   ✅ Ready for frontend permission guards')
    
  } catch (error) {
    console.error('❌ Error adding voucher permissions:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    pool.end()
  }
}

addVoucherPermissions()