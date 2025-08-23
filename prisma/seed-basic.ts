import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo users with hashed passwords
  const hashedPassword = await bcrypt.hash('demo123', 10)

  // Clear existing data for fresh start
  console.log('🧹 Cleaning existing data...')
  
  // Delete in correct order to respect foreign key constraints
  await prisma.user_permissions.deleteMany({})
  await prisma.role_permissions.deleteMany({})
  await prisma.user_audit_log.deleteMany({})
  await prisma.security_events.deleteMany({})
  await prisma.apiKey.deleteMany({})
  await prisma.user_roles.deleteMany({})
  await prisma.whatsAppInstance.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.permissions.deleteMany({})
  await prisma.roles.deleteMany({})

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

  const employeeRole = await prisma.roles.create({
    data: {
      name: 'EMPLOYEE',
      description: 'Employee with limited access',
      level: 4,
      is_system: false,
    },
  })

  const customerRole = await prisma.roles.create({
    data: {
      name: 'CUSTOMER',
      description: 'Customer access to WhatsApp services',
      level: 5,
      is_system: false,
    },
  })

  console.log('✅ Roles created')

  // Create demo users
  console.log('👥 Creating demo users...')

  const owner = await prisma.user.create({
    data: {
      email: 'owner@demo.com',
      username: 'owner',
      name: 'System Owner',
      password: hashedPassword,
      first_name: 'System',
      last_name: 'Owner',
      role_id: ownerRole.id,
      status: 'ACTIVE',
      is_verified: true,
      phone: '+1234567890',
    },
  })

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      username: 'admin',
      name: 'Admin User',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role_id: adminRole.id,
      status: 'ACTIVE',
      is_verified: true,
      phone: '+1234567891',
    },
  })

  const subdealer = await prisma.user.create({
    data: {
      email: 'subdealer@demo.com',
      username: 'subdealer',
      name: 'Sub Dealer',
      password: hashedPassword,
      first_name: 'Sub',
      last_name: 'Dealer',
      role_id: subdealerRole.id,
      status: 'ACTIVE',
      is_verified: true,
      phone: '+1234567892',
    },
  })

  const employee = await prisma.user.create({
    data: {
      email: 'employee@demo.com',
      username: 'employee',
      name: 'Employee User',
      password: hashedPassword,
      first_name: 'Employee',
      last_name: 'User',
      role_id: employeeRole.id,
      status: 'ACTIVE',
      is_verified: true,
      phone: '+1234567893',
    },
  })

  const customer = await prisma.user.create({
    data: {
      email: 'customer@demo.com',
      username: 'customer',
      name: 'Customer User',
      password: hashedPassword,
      first_name: 'Customer',
      last_name: 'User',
      role_id: customerRole.id,
      status: 'ACTIVE',
      is_verified: true,
      phone: '+1234567894',
    },
  })

  console.log('✅ Demo users created')

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
          action,
        },
      })
      permissions.push(permission)
    }
  }

  console.log(`✅ Created ${permissions.length} permissions`)

  // Assign permissions to owner (all permissions)
  console.log('👤 Assigning permissions to users...')
  
  for (const permission of permissions) {
    await prisma.user_permissions.create({
      data: {
        user_id: owner.id,
        permission_id: permission.id,
      },
    })
  }
  console.log(`✅ Assigned ${permissions.length} permissions to owner@demo.com`)

  // Assign limited permissions to admin
  const adminPermissions = permissions.filter(p => 
    !p.name.includes('BILLING') && !p.name.includes('API_KEYS_DELETE')
  )
  for (const permission of adminPermissions) {
    await prisma.user_permissions.create({
      data: {
        user_id: admin.id,
        permission_id: permission.id,
      },
    })
  }
  console.log(`✅ Assigned ${adminPermissions.length} permissions to admin@demo.com`)

  // Assign limited permissions to subdealer
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
      },
    })
  }
  console.log(`✅ Assigned ${subdealerPermissions.length} permissions to subdealer@demo.com`)

  // Assign minimal permissions to customer
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
      },
    })
  }
  console.log(`✅ Assigned ${customerPermissions.length} permissions to customer@demo.com`)

  console.log('\n✨ Database seeding completed successfully!')
  console.log('\n📝 Demo credentials:')
  console.log('- Owner: owner@demo.com / demo123')
  console.log('- Admin: admin@demo.com / demo123')
  console.log('- Subdealer: subdealer@demo.com / demo123')
  console.log('- Employee: employee@demo.com / demo123')
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