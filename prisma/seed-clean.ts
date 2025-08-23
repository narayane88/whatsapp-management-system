import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo users with hashed passwords
  const hashedPassword = await bcrypt.hash('demo123', 10)

  // Clear existing data for fresh start
  console.log('🧹 Cleaning existing data...')
  
  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.user_permissions.deleteMany({})
    await prisma.role_permissions.deleteMany({})
    await prisma.user_audit_log.deleteMany({})
    await prisma.security_events.deleteMany({})
    await prisma.apiKey.deleteMany({})
    await prisma.user_roles.deleteMany({})
    await prisma.whatsAppInstance.deleteMany({})
    await prisma.session.deleteMany({})
    await prisma.customerPackage.deleteMany({})
    await prisma.transaction.deleteMany({})
    await prisma.bizPointsTransaction.deleteMany({})
    await prisma.dealer_customers.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.permissions.deleteMany({})
    await prisma.roles.deleteMany({})
  } catch (error) {
    console.log('⚠️  Some tables could not be cleared, continuing...')
  }

  // Create all roles
  console.log('📋 Creating roles...')
  
  const ownerRole = await prisma.roles.create({
    data: {
      name: 'OWNER',
      description: 'System Owner with full access',
      level: 1,
      is_system: true,
    },
  })

  const adminRole = await prisma.roles.create({
    data: {
      name: 'ADMIN',
      description: 'Administrative access & management',
      level: 2,
      is_system: true,
    },
  })

  const subdealerRole = await prisma.roles.create({
    data: {
      name: 'SUBDEALER',
      description: 'Manage customers & resell packages',
      level: 3,
      is_system: false,
    },
  })

  const customerRole = await prisma.roles.create({
    data: {
      name: 'CUSTOMER',
      description: 'Customer access to WhatsApp services',
      level: 4,
      is_system: false,
    },
  })

  console.log('✅ Roles created')

  // Create demo users
  console.log('👥 Creating demo users...')

  const owner = await prisma.user.create({
    data: {
      email: 'owner@demo.com',
      name: 'System Owner',
      password: hashedPassword,
      phone: '+1234567890',
      dealer_type: 'owner',
      isActive: true,
    },
  })

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      name: 'Admin User',
      password: hashedPassword,
      phone: '+1234567891',
      dealer_type: 'admin',
      isActive: true,
    },
  })

  const subdealer = await prisma.user.create({
    data: {
      email: 'subdealer@demo.com',
      name: 'Sub Dealer',
      password: hashedPassword,
      phone: '+1234567892',
      dealer_type: 'subdealer',
      dealer_code: 'SD001',
      isActive: true,
    },
  })

  const customer = await prisma.user.create({
    data: {
      email: 'customer@demo.com',
      name: 'Customer User',
      password: hashedPassword,
      phone: '+1234567893',
      dealer_type: 'user',
      isActive: true,
    },
  })

  console.log('✅ Demo users created')

  // Create user-role associations
  console.log('🔗 Assigning roles to users...')

  await prisma.user_roles.create({
    data: {
      user_id: owner.id,
      role_id: ownerRole.id,
      assigned_by: owner.id,
    },
  })

  await prisma.user_roles.create({
    data: {
      user_id: admin.id,
      role_id: adminRole.id,
      assigned_by: owner.id,
    },
  })

  await prisma.user_roles.create({
    data: {
      user_id: subdealer.id,
      role_id: subdealerRole.id,
      assigned_by: owner.id,
    },
  })

  await prisma.user_roles.create({
    data: {
      user_id: customer.id,
      role_id: customerRole.id,
      assigned_by: subdealer.id,
    },
  })

  console.log('✅ Roles assigned to users')

  // Create basic permissions
  console.log('🔐 Creating permissions...')

  const permissionCategories = [
    { category: 'DASHBOARD', actions: ['VIEW', 'EDIT'] },
    { category: 'USERS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
    { category: 'INSTANCES', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'CONNECT', 'DISCONNECT'] },
    { category: 'MESSAGES', actions: ['VIEW', 'SEND', 'DELETE'] },
    { category: 'CONTACTS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
    { category: 'GROUPS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
    { category: 'CAMPAIGNS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXECUTE'] },
    { category: 'TEMPLATES', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
    { category: 'WEBHOOKS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
    { category: 'API_KEYS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
    { category: 'SETTINGS', actions: ['VIEW', 'EDIT'] },
    { category: 'REPORTS', actions: ['VIEW', 'EXPORT'] },
    { category: 'BILLING', actions: ['VIEW', 'MANAGE'] },
  ]

  const permissions = []
  for (const { category, actions } of permissionCategories) {
    for (const action of actions) {
      const permission = await prisma.permissions.create({
        data: {
          name: `${category}_${action}`,
          description: `${action} ${category.toLowerCase()}`,
          category,
          resource: category,
          action,
        },
      })
      permissions.push(permission)
    }
  }

  console.log(`✅ Created ${permissions.length} permissions`)

  // Assign permissions to users via user_permissions
  console.log('👤 Assigning permissions to users...')
  
  // Owner gets all permissions
  for (const permission of permissions) {
    await prisma.user_permissions.create({
      data: {
        user_id: owner.id,
        permission_id: permission.id,
        assigned_by: owner.id,
      },
    })
  }
  console.log(`✅ Assigned ${permissions.length} permissions to owner@demo.com`)

  // Admin gets most permissions (exclude billing management)
  const adminPermissions = permissions.filter(p => 
    !p.name.includes('BILLING_MANAGE')
  )
  for (const permission of adminPermissions) {
    await prisma.user_permissions.create({
      data: {
        user_id: admin.id,
        permission_id: permission.id,
        assigned_by: owner.id,
      },
    })
  }
  console.log(`✅ Assigned ${adminPermissions.length} permissions to admin@demo.com`)

  // Subdealer gets limited permissions
  const subdealerPermissions = permissions.filter(p => 
    p.name.includes('INSTANCES') || 
    p.name.includes('MESSAGES') || 
    p.name.includes('CONTACTS') ||
    p.name.includes('GROUPS') ||
    p.name.includes('CAMPAIGNS') ||
    p.name.includes('TEMPLATES') ||
    p.name.includes('DASHBOARD_VIEW')
  )
  for (const permission of subdealerPermissions) {
    await prisma.user_permissions.create({
      data: {
        user_id: subdealer.id,
        permission_id: permission.id,
        assigned_by: owner.id,
      },
    })
  }
  console.log(`✅ Assigned ${subdealerPermissions.length} permissions to subdealer@demo.com`)

  // Customer gets minimal permissions
  const customerPermissions = permissions.filter(p => 
    (p.name.includes('INSTANCES') && !p.name.includes('DELETE')) ||
    (p.name.includes('MESSAGES') && !p.name.includes('DELETE')) ||
    p.name.includes('DASHBOARD_VIEW') ||
    p.name.includes('CONTACTS_VIEW') ||
    p.name.includes('GROUPS_VIEW')
  )
  for (const permission of customerPermissions) {
    await prisma.user_permissions.create({
      data: {
        user_id: customer.id,
        permission_id: permission.id,
        assigned_by: subdealer.id,
      },
    })
  }
  console.log(`✅ Assigned ${customerPermissions.length} permissions to customer@demo.com`)

  console.log('\n✨ Database seeding completed successfully!')
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