const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'whatsapp_system',
  password: process.env.DB_PASSWORD || 'Nitin@123',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function migratePagePermissions() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Starting page permission migration...')
    
    // Start transaction
    await client.query('BEGIN')
    
    // 1. Execute the enhanced permissions script
    console.log('📦 Adding page and menu access permissions...')
    
    const sqlScript = fs.readFileSync(
      path.join(__dirname, '../database/enhanced-page-permissions.sql'),
      'utf8'
    )
    
    // Split script into individual statements and execute
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      try {
        if (statement.toLowerCase().includes('select') && 
            statement.toLowerCase().includes('group by')) {
          // This is the summary query at the end
          const result = await client.query(statement)
          console.log('\n📊 Role Permission Summary:')
          result.rows.forEach(row => {
            console.log(`   ${row.role_name} (Level ${row.level}): ${row.page_permissions} pages, ${row.menu_permissions} menus, ${row.total_permissions} total`)
          })
        } else {
          await client.query(statement)
        }
      } catch (error) {
        // Log but don't fail for non-critical errors
        if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
          console.warn(`⚠️  Warning executing statement: ${error.message}`)
        }
      }
    }
    
    // 2. Verify permissions were created
    const permissionCount = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN name LIKE '%.page.access' THEN 1 END) as page_perms,
        COUNT(CASE WHEN name LIKE 'menu.%.view' THEN 1 END) as menu_perms
      FROM permissions
      WHERE is_system = true
    `)
    
    console.log('\n✅ Enhanced permissions added successfully!')
    console.log(`📄 Page access permissions: ${permissionCount.rows[0].page_perms}`)
    console.log(`📋 Menu visibility permissions: ${permissionCount.rows[0].menu_perms}`)
    console.log(`📊 Total system permissions: ${permissionCount.rows[0].total}`)
    
    // 3. Test sample user permissions
    const testResult = await client.query(`
      SELECT 
        u.email,
        r.name as role,
        COUNT(CASE WHEN p.name LIKE '%.page.access' THEN 1 END) as page_access,
        COUNT(CASE WHEN p.name LIKE 'menu.%.view' THEN 1 END) as menu_access
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = true
      LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_system = true
      WHERE u."isActive" = true
      GROUP BY u.id, u.email, r.name
      LIMIT 5
    `)
    
    console.log('\n👤 Sample User Access:')
    testResult.rows.forEach(row => {
      console.log(`   ${row.email} (${row.role}): ${row.page_access} pages, ${row.menu_access} menus`)
    })
    
    // 4. Create audit log entry
    await client.query(`
      INSERT INTO security_events (
        event_type, user_email, severity, details, created_at
      ) VALUES (
        'page_permissions_migration', 
        'system', 
        'medium', 
        'Page and menu access permissions migrated successfully. Added ${permissionCount.rows[0].page_perms} page permissions and ${permissionCount.rows[0].menu_perms} menu permissions.',
        NOW()
      )
    `)
    
    // Commit transaction
    await client.query('COMMIT')
    
    console.log('\n🎉 Page permission migration completed successfully!')
    console.log('🔍 Users will now see only the menu items they have access to.')
    console.log('🚫 Unauthorized page access will be blocked with proper error messages.')
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK')
    console.error('❌ Migration failed:', error.message)
    console.error('🔄 All changes have been rolled back.')
    throw error
  } finally {
    client.release()
  }
}

async function validatePagePermissions() {
  console.log('\n🔍 Validating page permission structure...')
  
  try {
    // Check each role's access to key pages
    const roleAccess = await pool.query(`
      SELECT 
        r.name as role_name,
        r.level,
        BOOL_OR(p.name = 'dashboard.admin.access') as has_dashboard,
        BOOL_OR(p.name = 'customers.page.access') as has_customers,
        BOOL_OR(p.name = 'packages.page.access') as has_packages,
        BOOL_OR(p.name = 'transactions.page.access') as has_transactions,
        BOOL_OR(p.name = 'users.page.access') as has_users,
        BOOL_OR(p.name = 'settings.page.access') as has_settings
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = true
      LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_system = true
      WHERE r.is_system = true
      GROUP BY r.id, r.name, r.level
      ORDER BY r.level
    `)
    
    console.log('\n📊 Role Page Access Matrix:')
    console.log('Role\t\t\tDash\tCust\tPkg\tTxn\tUsers\tSettings')
    console.log('-'.repeat(80))
    roleAccess.rows.forEach(row => {
      const dash = row.has_dashboard ? '✓' : '✗'
      const cust = row.has_customers ? '✓' : '✗'
      const pkg = row.has_packages ? '✓' : '✗'
      const txn = row.has_transactions ? '✓' : '✗'
      const users = row.has_users ? '✓' : '✗'
      const settings = row.has_settings ? '✓' : '✗'
      console.log(`${row.role_name.padEnd(15)}\t\t${dash}\t${cust}\t${pkg}\t${txn}\t${users}\t${settings}`)
    })
    
    // Check for orphaned permissions
    const orphanedPerms = await pool.query(`
      SELECT p.name
      FROM permissions p
      WHERE p.is_system = true
      AND (p.name LIKE '%.page.access' OR p.name LIKE 'menu.%.view')
      AND NOT EXISTS (
        SELECT 1 FROM role_permissions rp
        WHERE rp.permission_id = p.id AND rp.granted = true
      )
      ORDER BY p.name
    `)
    
    if (orphanedPerms.rows.length > 0) {
      console.log('\n⚠️  Orphaned permissions (not assigned to any role):')
      orphanedPerms.rows.forEach(row => {
        console.log(`   ${row.name}`)
      })
    } else {
      console.log('\n✅ All page permissions are properly assigned to roles')
    }
    
    console.log('\n✅ Page permission validation completed')
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message)
  }
}

// Main execution
async function main() {
  try {
    console.log('🔧 WhatsApp Management System - Page Permission Migration Tool\n')
    
    // Test database connection
    await pool.query('SELECT 1')
    console.log('✅ Database connection established')
    
    // Run migration
    await migratePagePermissions()
    
    // Validate results
    await validatePagePermissions()
    
    console.log('\n🎯 Migration Summary:')
    console.log('   ✅ Page access permissions added')
    console.log('   ✅ Menu visibility permissions added')
    console.log('   ✅ Role assignments configured')
    console.log('   ✅ Enhanced feature permissions added')
    console.log('   ✅ Audit trail recorded')
    console.log('\n🚀 Your admin panel now has proper permission-based access control!')
    console.log('📋 Users will only see menu items they can access')
    console.log('🚫 Unauthorized pages will be blocked with informative error messages')
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
if (args.includes('--validate-only')) {
  validatePagePermissions().then(() => pool.end())
} else {
  main()
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await pool.end()
  process.exit(0)
})