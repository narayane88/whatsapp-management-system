import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting minimal database seeding...')

  // Create demo users with hashed passwords
  const hashedPassword = await bcrypt.hash('demo123', 10)

  try {
    // Check if roles exist, create only if needed
    console.log('📋 Checking roles...')
    
    let ownerRole = await prisma.roles.findFirst({
      where: { name: 'OWNER' }
    })
    
    if (!ownerRole) {
      ownerRole = await prisma.roles.create({
        data: {
          name: 'OWNER',
          description: 'System Owner with full access',
          level: 1,
          is_system: true,
        },
      })
      console.log('✅ Created OWNER role')
    } else {
      console.log('✓ OWNER role already exists')
    }

    let adminRole = await prisma.roles.findFirst({
      where: { name: 'ADMIN' }
    })
    
    if (!adminRole) {
      adminRole = await prisma.roles.create({
        data: {
          name: 'ADMIN',
          description: 'Administrative access & management',
          level: 2,
          is_system: true,
        },
      })
      console.log('✅ Created ADMIN role')
    } else {
      console.log('✓ ADMIN role already exists')
    }

    let subdealerRole = await prisma.roles.findFirst({
      where: { name: 'SUBDEALER' }
    })
    
    if (!subdealerRole) {
      subdealerRole = await prisma.roles.create({
        data: {
          name: 'SUBDEALER',
          description: 'Manage customers & resell packages',
          level: 3,
          is_system: false,
        },
      })
      console.log('✅ Created SUBDEALER role')
    } else {
      console.log('✓ SUBDEALER role already exists')
    }

    let customerRole = await prisma.roles.findFirst({
      where: { name: 'CUSTOMER' }
    })
    
    if (!customerRole) {
      customerRole = await prisma.roles.create({
        data: {
          name: 'CUSTOMER',
          description: 'Customer access to WhatsApp services',
          level: 4,
          is_system: false,
        },
      })
      console.log('✅ Created CUSTOMER role')
    } else {
      console.log('✓ CUSTOMER role already exists')
    }

    // Create or update demo users
    console.log('\n👥 Creating/updating demo users...')

    // Owner user
    const existingOwner = await prisma.users.findFirst({
      where: { email: 'owner@demo.com' }
    })
    
    if (!existingOwner) {
      await prisma.users.create({
        data: {
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
      console.log('✅ Created owner@demo.com')
    } else {
      await prisma.users.update({
        where: { id: existingOwner.id },
        data: { password: hashedPassword }
      })
      console.log('✓ Updated owner@demo.com password')
    }

    // Admin user
    const existingAdmin = await prisma.users.findFirst({
      where: { email: 'admin@demo.com' }
    })
    
    if (!existingAdmin) {
      await prisma.users.create({
        data: {
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
      console.log('✅ Created admin@demo.com')
    } else {
      await prisma.users.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword }
      })
      console.log('✓ Updated admin@demo.com password')
    }

    // Subdealer user
    const existingSubdealer = await prisma.users.findFirst({
      where: { email: 'subdealer@demo.com' }
    })
    
    if (!existingSubdealer) {
      await prisma.users.create({
        data: {
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
      console.log('✅ Created subdealer@demo.com')
    } else {
      await prisma.users.update({
        where: { id: existingSubdealer.id },
        data: { password: hashedPassword }
      })
      console.log('✓ Updated subdealer@demo.com password')
    }

    // Customer user
    const existingCustomer = await prisma.users.findFirst({
      where: { email: 'customer@demo.com' }
    })
    
    if (!existingCustomer) {
      await prisma.users.create({
        data: {
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
      console.log('✅ Created customer@demo.com')
    } else {
      await prisma.users.update({
        where: { id: existingCustomer.id },
        data: { password: hashedPassword }
      })
      console.log('✓ Updated customer@demo.com password')
    }

    console.log('\n✨ Database seeding completed successfully!')
    console.log('\n📝 Demo credentials:')
    console.log('- Owner: owner@demo.com / demo123')
    console.log('- Admin: admin@demo.com / demo123')
    console.log('- Subdealer: subdealer@demo.com / demo123')
    console.log('- Customer: customer@demo.com / demo123')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })