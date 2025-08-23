import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo users with hashed passwords
  const hashedPassword = await bcrypt.hash('demo123', 10)

  // Try to clear existing data, but continue if permissions are insufficient
  console.log('🧹 Attempting to clean existing data...')
  
  try {
    await prisma.user_permissions.deleteMany({})
    console.log('✅ Cleared user_permissions')
  } catch (error) {
    console.log('⚠️  Could not clear user_permissions (insufficient permissions)')
  }

  try {
    await prisma.role_permissions.deleteMany({})
    console.log('✅ Cleared role_permissions')
  } catch (error) {
    console.log('⚠️  Could not clear role_permissions (insufficient permissions)')
  }

  try {
    await prisma.user_audit_log.deleteMany({})
    console.log('✅ Cleared user_audit_log')
  } catch (error) {
    console.log('⚠️  Could not clear user_audit_log (insufficient permissions)')
  }

  try {
    await prisma.security_events.deleteMany({})
    console.log('✅ Cleared security_events')
  } catch (error) {
    console.log('⚠️  Could not clear security_events (insufficient permissions)')
  }

  try {
    await prisma.permissions.deleteMany({})
    console.log('✅ Cleared permissions')
  } catch (error) {
    console.log('⚠️  Could not clear permissions (insufficient permissions)')
  }

  // Create all roles expected by the login page
  console.log('📋 Creating/updating roles...')
  
  const ownerRole = await prisma.roles.upsert({
    where: { name: 'OWNER' },
    update: {},
    create: {
      name: 'OWNER',
      description: 'System Owner with full access',
      level: 1,
      is_system: true,
    },
  })

  const adminRole = await prisma.roles.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrative access & management',
      level: 2,
      is_system: true,
    },
  })

  const subdealerRole = await prisma.roles.upsert({
    where: { name: 'SUBDEALER' },
    update: {},
    create: {
      name: 'SUBDEALER',
      description: 'Manage customers & resell packages',
      level: 3,
      is_system: false,
    },
  })

  const customerRole = await prisma.roles.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: {
      name: 'CUSTOMER',
      description: 'Customer access to WhatsApp services',
      level: 4,
      is_system: false,
    },
  })

  console.log('✅ Roles created/updated')

  // Create demo users
  console.log('👥 Creating demo users...')

  const ownerUser = await prisma.users.upsert({
    where: { email: 'owner@demo.com' },
    update: { password: hashedPassword },
    create: {
      email: 'owner@demo.com',
      username: 'owner',
      password: hashedPassword,
      first_name: 'System',
      last_name: 'Owner',
      role_id: ownerRole.id,
      status: 'ACTIVE',
      is_verified: true,
    },
  })

  const adminUser = await prisma.users.upsert({
    where: { email: 'admin@demo.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@demo.com',
      username: 'admin',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role_id: adminRole.id,
      status: 'ACTIVE',
      is_verified: true,
    },
  })

  const subdealerUser = await prisma.users.upsert({
    where: { email: 'subdealer@demo.com' },
    update: { password: hashedPassword },
    create: {
      email: 'subdealer@demo.com',
      username: 'subdealer',
      password: hashedPassword,
      first_name: 'Sub',
      last_name: 'Dealer',
      role_id: subdealerRole.id,
      status: 'ACTIVE',
      is_verified: true,
    },
  })

  const customerUser = await prisma.users.upsert({
    where: { email: 'customer@demo.com' },
    update: { password: hashedPassword },
    create: {
      email: 'customer@demo.com',
      username: 'customer',
      password: hashedPassword,
      first_name: 'Customer',
      last_name: 'User',
      role_id: customerRole.id,
      status: 'ACTIVE',
      is_verified: true,
    },
  })

  console.log('✅ Demo users created/updated')

  console.log('\n✨ Database seeding completed!')
  console.log('\n📝 Demo credentials:')
  console.log('- Owner: owner@demo.com / demo123')
  console.log('- Admin: admin@demo.com / demo123')
  console.log('- Subdealer: subdealer@demo.com / demo123')
  console.log('- Customer: customer@demo.com / demo123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })