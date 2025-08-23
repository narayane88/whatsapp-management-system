const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function debugSessionPermissions() {
  try {
    console.log('🔍 Debugging session permissions...\n')
    
    // Check all users in database
    console.log('👥 All users in database:')
    const users = await pool.query(`
      SELECT id, name, email, "isActive" 
      FROM users 
      ORDER BY id
    `)
    
    users.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Active: ${user.isActive}`)
    })
    
    // Test permission function with different email formats
    console.log('\n🧪 Testing permission function with different emails:')
    
    const testEmails = [
      'owner@demo.com',
      'OWNER@DEMO.COM',
      'Owner@Demo.com'
    ]
    
    for (const email of testEmails) {
      console.log(`\nTesting: ${email}`)
      
      // Test user lookup first
      const userCheck = await pool.query(
        `SELECT id, name, email, "isActive" FROM users WHERE email = $1`,
        [email]
      )
      
      if (userCheck.rows.length > 0) {
        console.log(`  ✅ User found: ${userCheck.rows[0].name}`)
        
        // Test permission
        const permissionCheck = await pool.query(
          `SELECT user_has_permission($1, $2) as has_permission`,
          [email, 'permissions.read']
        )
        console.log(`  ✅ Can read permissions: ${permissionCheck.rows[0].has_permission}`)
      } else {
        console.log(`  ❌ User not found`)
      }
    }
    
    // Test case-insensitive lookup
    console.log('\n🔧 Testing case-insensitive user lookup...')
    const caseInsensitiveCheck = await pool.query(`
      SELECT id, name, email, "isActive" 
      FROM users 
      WHERE LOWER(email) = LOWER($1)
    `, ['OWNER@DEMO.COM'])
    
    console.log(`Found ${caseInsensitiveCheck.rows.length} users with case-insensitive match`)
    
    // Check OWNER role permissions directly
    console.log('\n👑 OWNER role permissions check:')
    const ownerRolePerms = await pool.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = 'OWNER' 
        AND p.name = 'permissions.read'
        AND rp.granted = true
    `)
    
    console.log(`OWNER role has permissions.read: ${ownerRolePerms.rows[0].count > 0}`)
    
    // Test the complete permission chain
    console.log('\n🔗 Testing complete permission chain for owner@demo.com:')
    const chainTest = await pool.query(`
      SELECT 
        u.email,
        u."isActive",
        r.name as role_name,
        p.name as permission_name,
        rp.granted
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = 'owner@demo.com'
        AND p.name = 'permissions.read'
    `)
    
    console.log('Permission chain results:')
    chainTest.rows.forEach(row => {
      console.log(`  - User: ${row.email} (Active: ${row.isactive})`)
      console.log(`  - Role: ${row.role_name}`)  
      console.log(`  - Permission: ${row.permission_name}`)
      console.log(`  - Granted: ${row.granted}`)
    })
    
    await pool.end()
    
  } catch (error) {
    console.error('❌ Debug error:', error)
    process.exit(1)
  }
}

debugSessionPermissions()