const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserRoles() {
  try {
    console.log('Checking user roles and hierarchy...')
    
    // Check if users have role column
    const tableColumns = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('role', 'id', 'name', 'email')
      ORDER BY column_name
    `
    
    console.log('\nUsers table columns:')
    console.table(tableColumns)
    
    // Get all users with their roles
    const users = await prisma.$queryRaw`
      SELECT id, name, email, 
             COALESCE(role, 'NO_ROLE') as role,
             CASE 
               WHEN role = 'OWNER' THEN 'Level 1 - Owner'
               WHEN role = 'ADMIN' THEN 'Level 2 - Admin'  
               WHEN role = 'SUBDEALER' THEN 'Level 3 - SubDealer'
               WHEN role = 'EMPLOYEE' THEN 'Level 4 - Employee'
               WHEN role = 'CUSTOMER' THEN 'Level 5 - Customer'
               ELSE 'Level 6 - Unknown'
             END as role_level
      FROM users
      ORDER BY 
        CASE 
          WHEN role = 'OWNER' THEN 1
          WHEN role = 'ADMIN' THEN 2
          WHEN role = 'SUBDEALER' THEN 3
          WHEN role = 'EMPLOYEE' THEN 4
          WHEN role = 'CUSTOMER' THEN 5
          ELSE 6
        END,
        id
    `
    
    console.log('\nAll users with role hierarchy:')
    console.table(users)
    
    // Show users up to Level 4 (Employee and above)
    const level4AndAbove = users.filter(u => 
      ['OWNER', 'ADMIN', 'SUBDEALER', 'EMPLOYEE'].includes(u.role)
    )
    
    console.log('\nUsers for Creator Filter (Level 4 and above roles):')
    console.table(level4AndAbove)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserRoles()