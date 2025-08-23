const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserHierarchy() {
  try {
    console.log('Checking user hierarchy and roles...')
    
    const users = await prisma.$queryRaw`
      SELECT id, name, email, 
             CASE 
               WHEN id = 1 THEN 'Level 1 - Owner'
               WHEN id = 2 THEN 'Level 2 - Admin' 
               WHEN id = 3 THEN 'Level 3 - SubDealer'
               WHEN id = 4 THEN 'Level 4 - Employee'
               ELSE 'Level 5+ - Customer/User'
             END as user_level
      FROM users
      ORDER BY id
    `
    
    console.log('\nAll users with hierarchy levels:')
    console.table(users)
    
    // Show level 4 and below (admin levels)
    const level4AndBelow = users.filter(u => u.id <= 4)
    console.log('\nUsers Level 4 and below (for creator filter):')
    console.table(level4AndBelow)
    
    // Show level 5+ (regular users)
    const level5AndAbove = users.filter(u => u.id > 4)
    console.log('\nUsers Level 5+ (regular users):')
    console.table(level5AndAbove)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserHierarchy()