const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkRoleSystem() {
  try {
    console.log('Checking role-based system...')
    
    // Check what tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND table_name IN ('users', 'roles', 'user_roles', 'permissions')
      ORDER BY table_name
    `
    
    console.log('\nAvailable role-related tables:')
    console.table(tables)
    
    // Check users table structure
    const userColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY column_name
    `
    
    console.log('\nUsers table columns:')
    console.table(userColumns)
    
    // Check if roles table exists
    try {
      const roles = await prisma.$queryRaw`SELECT id, name, description FROM roles ORDER BY id`
      console.log('\nRoles in system:')
      console.table(roles)
    } catch (error) {
      console.log('\nRoles table does not exist or is empty')
    }
    
    // Check if user_roles table exists  
    try {
      const userRoles = await prisma.$queryRaw`
        SELECT ur.user_id, ur.role_id, r.name as role_name, u.name as user_name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN users u ON ur.user_id = u.id
        ORDER BY ur.user_id
      `
      console.log('\nUser-Role assignments:')
      console.table(userRoles)
    } catch (error) {
      console.log('\nUser-roles relationship table does not exist')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRoleSystem()