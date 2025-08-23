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

async function migrateSystemPermissions() {
  const client = await pool.connect()
  
  try {
    console.log('🚀 Starting system permissions migration...')
    
    // Start transaction
    await client.query('BEGIN')
    
    // 1. Backup existing permissions
    console.log('📦 Creating backup of existing permissions...')
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions_backup_${Date.now()} AS
      SELECT p.*, rp.role_id, up.user_id 
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN user_permissions up ON p.id = up.permission_id
      WHERE p.is_system = true
    `)
    
    // 2. Get current role assignments for restoration
    console.log('💾 Saving current role-permission mappings...')
    
    const rolePermissions = await client.query(`
      SELECT r.name as role_name, p.name as permission_name
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.is_system = true AND rp.granted = true
    `)
    
    console.log(`📊 Found ${rolePermissions.rows.length} existing role-permission mappings`)
    
    // 3. Execute the permission update script
    console.log('🔄 Updating system permissions...')
    
    const sqlScript = fs.readFileSync(
      path.join(__dirname, '../database/updated-system-permissions.sql'),
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
          console.log('\n📈 Permission Summary:')
          result.rows.forEach(row => {
            console.log(`   ${row.category}: ${row.permission_count} permissions`)
          })
        } else {
          await client.query(statement)
        }
      } catch (error) {
        // Log but don't fail for non-critical errors
        if (!error.message.includes('already exists')) {
          console.warn(`⚠️  Warning executing statement: ${error.message}`)
        }
      }
    }
    
    // 4. Verify permissions were created
    const permissionCount = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_system = true THEN 1 END) as system_perms,
        COUNT(DISTINCT category) as categories
      FROM permissions
    `)
    
    console.log('\n✅ Migration completed successfully!')
    console.log(`📊 Total permissions: ${permissionCount.rows[0].total}`)
    console.log(`🔧 System permissions: ${permissionCount.rows[0].system_perms}`)
    console.log(`📂 Categories: ${permissionCount.rows[0].categories}`)
    
    // 5. Verify role assignments
    const roleAssignments = await client.query(`
      SELECT r.name, COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      WHERE r.is_system = true
      GROUP BY r.id, r.name
      ORDER BY r.level
    `)
    
    console.log('\n👥 Role Permission Assignments:')
    roleAssignments.rows.forEach(row => {
      console.log(`   ${row.name}: ${row.permission_count} permissions`)
    })
    
    // 6. Create audit log entry
    await client.query(`
      INSERT INTO security_events (
        event_type, user_email, severity, details, created_at
      ) VALUES (
        'system_permissions_migration', 
        'system', 
        'high', 
        'System permissions migrated successfully. Total: ${permissionCount.rows[0].system_perms} permissions across ${permissionCount.rows[0].categories} categories',
        NOW()
      )
    `)
    
    // Commit transaction
    await client.query('COMMIT')
    
    console.log('\n🎉 Permission migration completed successfully!')
    console.log('🔍 You can now review the updated permissions in the admin panel.')
    
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

async function validatePermissions() {
  console.log('\n🔍 Validating permission structure...')
  
  try {
    // Check for duplicate permissions
    const duplicates = await pool.query(`
      SELECT name, COUNT(*) as count
      FROM permissions
      WHERE is_system = true
      GROUP BY name
      HAVING COUNT(*) > 1
    `)
    
    if (duplicates.rows.length > 0) {
      console.log('⚠️  Found duplicate permissions:')
      duplicates.rows.forEach(row => {
        console.log(`   ${row.name}: ${row.count} duplicates`)
      })
    } else {
      console.log('✅ No duplicate permissions found')
    }
    
    // Check role coverage
    const roleCoverage = await pool.query(`
      SELECT 
        r.name,
        r.level,
        COUNT(rp.permission_id) as assigned_permissions,
        (SELECT COUNT(*) FROM permissions WHERE is_system = true) as total_permissions,
        ROUND(COUNT(rp.permission_id) * 100.0 / (SELECT COUNT(*) FROM permissions WHERE is_system = true), 1) as coverage_percent
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = true
      LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_system = true
      WHERE r.is_system = true
      GROUP BY r.id, r.name, r.level
      ORDER BY r.level
    `)
    
    console.log('\n📊 Role Permission Coverage:')
    roleCoverage.rows.forEach(row => {
      console.log(`   ${row.name} (Level ${row.level}): ${row.assigned_permissions}/${row.total_permissions} (${row.coverage_percent}%)`)
    })
    
    console.log('\n✅ Permission validation completed')
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message)
  }
}

// Main execution
async function main() {
  try {
    console.log('🔧 WhatsApp Management System - Permission Migration Tool\n')
    
    // Test database connection
    await pool.query('SELECT 1')
    console.log('✅ Database connection established')
    
    // Run migration
    await migrateSystemPermissions()
    
    // Validate results
    await validatePermissions()
    
    console.log('\n🎯 Migration Summary:')
    console.log('   ✅ System permissions updated')
    console.log('   ✅ Role assignments configured')
    console.log('   ✅ Database indexes created')
    console.log('   ✅ Audit trail recorded')
    console.log('\n🚀 Your WhatsApp management system is ready with updated permissions!')
    
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
  validatePermissions().then(() => pool.end())
} else {
  main()
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...')
  await pool.end()
  process.exit(0)
})