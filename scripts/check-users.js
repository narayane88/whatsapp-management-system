const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('Checking database users...')
    
    // Try to find users using raw query first to understand the structure
    const rawUsers = await prisma.$queryRaw`SELECT id, name, email FROM users LIMIT 5`
    console.log('Raw users from database:')
    console.log(rawUsers)
    
  } catch (error) {
    console.error('Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()