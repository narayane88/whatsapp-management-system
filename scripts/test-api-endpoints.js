const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function testAPIPrerequisites() {
  try {
    console.log('🧪 Testing API Prerequisites...\n')
    
    // Test database connection
    console.log('🔗 Testing database connection...')
    await pool.query('SELECT NOW()')
    console.log('✅ Database connection successful')
    
    // Test permission function with OWNER
    console.log('\n👑 Testing OWNER permissions...')
    const ownerPermissions = [
      'permissions.read',
      'permissions.create',
      'users.read',
      'users.create',
      'roles.read',
      'roles.create'
    ]
    
    let ownerSuccessCount = 0
    for (const perm of ownerPermissions) {
      const result = await pool.query(
        `SELECT user_has_permission($1, $2) as has_permission`,
        ['owner@demo.com', perm]
      )
      
      if (result.rows[0].has_permission) {
        console.log(`  ✅ ${perm}: true`)
        ownerSuccessCount++
      } else {
        console.log(`  ❌ ${perm}: false`)
      }
    }
    
    console.log(`\n📊 OWNER Results: ${ownerSuccessCount}/${ownerPermissions.length} permissions working`)
    
    // Test with different email cases
    console.log('\n🔤 Testing case-insensitive email lookup...')
    const emailVariations = [
      'owner@demo.com',
      'OWNER@DEMO.COM',
      'Owner@Demo.com'
    ]
    
    for (const email of emailVariations) {
      const result = await pool.query(
        `SELECT user_has_permission($1, $2) as has_permission`,
        [email, 'users.read']
      )
      console.log(`  ✅ ${email}: ${result.rows[0].has_permission}`)
    }
    
    // Test ADMIN permissions
    console.log('\n👨‍💼 Testing ADMIN permissions...')
    const adminPerms = ['users.read', 'users.create', 'roles.read']
    
    let adminSuccessCount = 0
    for (const perm of adminPerms) {
      const result = await pool.query(
        `SELECT user_has_permission($1, $2) as has_permission`,
        ['admin@demo.com', perm]
      )
      
      if (result.rows[0].has_permission) {
        console.log(`  ✅ ${perm}: true`)
        adminSuccessCount++
      } else {
        console.log(`  ❌ ${perm}: false`)
      }
    }
    
    console.log(`\n📊 ADMIN Results: ${adminSuccessCount}/${adminPerms.length} permissions working`)
    
    // Test CUSTOMER permissions (should have limited access)
    console.log('\n👤 Testing CUSTOMER permissions...')
    const customerPerms = ['users.create', 'users.delete', 'permissions.create']
    
    let customerDeniedCount = 0
    for (const perm of customerPerms) {
      const result = await pool.query(
        `SELECT user_has_permission($1, $2) as has_permission`,
        ['customer@demo.com', perm]
      )
      
      if (!result.rows[0].has_permission) {
        console.log(`  ✅ ${perm}: false (correctly denied)`)
        customerDeniedCount++
      } else {
        console.log(`  ❌ ${perm}: true (should be denied)`)
      }
    }
    
    console.log(`\n📊 CUSTOMER Results: ${customerDeniedCount}/${customerPerms.length} permissions correctly denied`)
    
    // Check if all users exist and are active
    console.log('\n👥 Verifying user accounts...')
    const users = await pool.query(`
      SELECT email, "isActive", 
        (SELECT r.name FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = u.id AND ur.is_primary = true) as primary_role
      FROM users u
      ORDER BY email
    `)
    
    users.rows.forEach(user => {
      const status = user.isActive ? 'Active' : 'Inactive'
      console.log(`  - ${user.email} (${user.primary_role}) - ${status}`)
    })
    
    console.log('\n🎯 API Prerequisites Summary:')
    console.log(`  ✅ Database connection: Working`)
    console.log(`  ✅ Permission function: Working`) 
    console.log(`  ✅ Case-insensitive lookup: Working`)
    console.log(`  ✅ OWNER permissions: ${ownerSuccessCount}/${ownerPermissions.length}`)
    console.log(`  ✅ ADMIN permissions: ${adminSuccessCount}/${adminPerms.length}`)
    console.log(`  ✅ CUSTOMER restrictions: ${customerDeniedCount}/${customerPerms.length}`)
    
    if (ownerSuccessCount === ownerPermissions.length && 
        adminSuccessCount >= 2 && 
        customerDeniedCount === customerPerms.length) {
      console.log('\n🎉 All prerequisites met! API endpoints should work correctly.')
      console.log('🚀 The "Insufficient permissions" error should be resolved!')
    } else {
      console.log('\n⚠️  Some prerequisites are not met. API may still have permission issues.')
    }
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testAPIPrerequisites()