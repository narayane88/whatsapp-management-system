import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting extended database seeding...')

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

  // Create all roles with more detail
  console.log('📋 Creating comprehensive roles...')
  
  const ownerRole = await prisma.roles.create({
    data: {
      name: 'OWNER',
      description: 'System Owner with full access to all features and settings',
      level: 1,
      is_system: true,
    },
  })

  const adminRole = await prisma.roles.create({
    data: {
      name: 'ADMIN',
      description: 'Administrative access with system management capabilities',
      level: 2,
      is_system: true,
    },
  })

  const managerRole = await prisma.roles.create({
    data: {
      name: 'MANAGER',
      description: 'Manager with team and resource oversight',
      level: 3,
      is_system: false,
    },
  })

  const subdealerRole = await prisma.roles.create({
    data: {
      name: 'SUBDEALER',
      description: 'Subdealer who can manage customers and resell packages',
      level: 4,
      is_system: false,
    },
  })

  const resellerRole = await prisma.roles.create({
    data: {
      name: 'RESELLER',
      description: 'Reseller with limited customer management',
      level: 5,
      is_system: false,
    },
  })

  const employeeRole = await prisma.roles.create({
    data: {
      name: 'EMPLOYEE',
      description: 'Employee with operational access',
      level: 6,
      is_system: false,
    },
  })

  const customerRole = await prisma.roles.create({
    data: {
      name: 'CUSTOMER',
      description: 'End customer using WhatsApp services',
      level: 7,
      is_system: false,
    },
  })

  const guestRole = await prisma.roles.create({
    data: {
      name: 'GUEST',
      description: 'Guest with minimal view-only access',
      level: 8,
      is_system: false,
    },
  })

  console.log('✅ 8 Roles created')

  // Create demo users
  console.log('👥 Creating demo users...')

  const owner = await prisma.user.create({
    data: {
      email: 'owner@demo.com',
      name: 'System Owner',
      password: hashedPassword,
      phone: '+1234567890',
      dealer_type: 'owner',
      dealer_code: 'OWNER001',
      isActive: true,
      account_balance: 100000,
      message_balance: 1000000,
      biz_points: 50000,
      commission_rate: 20,
    },
  })

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      name: 'Admin User',
      password: hashedPassword,
      phone: '+1234567891',
      dealer_type: 'admin',
      dealer_code: 'ADMIN001',
      isActive: true,
      account_balance: 50000,
      message_balance: 500000,
      biz_points: 25000,
      commission_rate: 15,
    },
  })

  const manager = await prisma.user.create({
    data: {
      email: 'manager@demo.com',
      name: 'Manager User',
      password: hashedPassword,
      phone: '+1234567892',
      dealer_type: 'manager',
      dealer_code: 'MGR001',
      isActive: true,
      account_balance: 30000,
      message_balance: 300000,
      biz_points: 15000,
      commission_rate: 12,
    },
  })

  const subdealer = await prisma.user.create({
    data: {
      email: 'subdealer@demo.com',
      name: 'Sub Dealer',
      password: hashedPassword,
      phone: '+1234567893',
      dealer_type: 'subdealer',
      dealer_code: 'SD001',
      dealer_territory: 'Region A',
      isActive: true,
      account_balance: 20000,
      message_balance: 200000,
      biz_points: 10000,
      commission_rate: 10,
    },
  })

  const reseller = await prisma.user.create({
    data: {
      email: 'reseller@demo.com',
      name: 'Reseller User',
      password: hashedPassword,
      phone: '+1234567894',
      dealer_type: 'reseller',
      dealer_code: 'RS001',
      dealer_territory: 'Region B',
      isActive: true,
      account_balance: 10000,
      message_balance: 100000,
      biz_points: 5000,
      commission_rate: 8,
    },
  })

  const employee = await prisma.user.create({
    data: {
      email: 'employee@demo.com',
      name: 'Employee User',
      password: hashedPassword,
      phone: '+1234567895',
      dealer_type: 'employee',
      isActive: true,
      account_balance: 5000,
      message_balance: 50000,
      biz_points: 2500,
    },
  })

  const customer = await prisma.user.create({
    data: {
      email: 'customer@demo.com',
      name: 'Customer User',
      password: hashedPassword,
      phone: '+1234567896',
      dealer_type: 'user',
      customer_status: 'active',
      registration_source: 'web',
      isActive: true,
      account_balance: 1000,
      message_balance: 10000,
      biz_points: 500,
    },
  })

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@demo.com',
      name: 'Customer Two',
      password: hashedPassword,
      phone: '+1234567897',
      dealer_type: 'user',
      customer_status: 'active',
      registration_source: 'mobile',
      isActive: true,
      account_balance: 500,
      message_balance: 5000,
      biz_points: 250,
    },
  })

  const guest = await prisma.user.create({
    data: {
      email: 'guest@demo.com',
      name: 'Guest User',
      password: hashedPassword,
      phone: '+1234567898',
      dealer_type: 'guest',
      isActive: true,
      account_balance: 0,
      message_balance: 0,
      biz_points: 0,
    },
  })

  console.log('✅ 9 Demo users created')

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
      user_id: manager.id,
      role_id: managerRole.id,
      assigned_by: admin.id,
    },
  })

  await prisma.user_roles.create({
    data: {
      user_id: subdealer.id,
      role_id: subdealerRole.id,
      assigned_by: admin.id,
    },
  })

  await prisma.user_roles.create({
    data: {
      user_id: reseller.id,
      role_id: resellerRole.id,
      assigned_by: manager.id,
    },
  })

  await prisma.user_roles.create({
    data: {
      user_id: employee.id,
      role_id: employeeRole.id,
      assigned_by: manager.id,
    },
  })

  await prisma.user_roles.create({
    data: {
      user_id: customer.id,
      role_id: customerRole.id,
      assigned_by: subdealer.id,
    },
  })

  await prisma.user_roles.create({
    data: {
      user_id: customer2.id,
      role_id: customerRole.id,
      assigned_by: reseller.id,
    },
  })

  await prisma.user_roles.create({
    data: {
      user_id: guest.id,
      role_id: guestRole.id,
      assigned_by: admin.id,
    },
  })

  console.log('✅ Roles assigned to all users')

  // Create comprehensive permissions
  console.log('🔐 Creating comprehensive permissions...')

  const permissionCategories = [
    // Dashboard & Analytics
    { category: 'DASHBOARD', actions: ['VIEW', 'EDIT', 'EXPORT', 'CUSTOMIZE'] },
    { category: 'ANALYTICS', actions: ['VIEW', 'EXPORT', 'CREATE_REPORT', 'SCHEDULE_REPORT'] },
    { category: 'REPORTS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'SCHEDULE'] },
    
    // User Management
    { category: 'USERS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'SUSPEND', 'ACTIVATE', 'EXPORT', 'IMPORT'] },
    { category: 'ROLES', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN'] },
    { category: 'PERMISSIONS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN', 'REVOKE'] },
    
    // WhatsApp Instance Management
    { category: 'INSTANCES', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'CONNECT', 'DISCONNECT', 'RESTART', 'BACKUP', 'RESTORE'] },
    { category: 'SERVERS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'RESTART', 'MONITOR'] },
    
    // Messaging
    { category: 'MESSAGES', actions: ['VIEW', 'SEND', 'DELETE', 'SCHEDULE', 'BROADCAST', 'EXPORT', 'IMPORT'] },
    { category: 'TEMPLATES', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'USE'] },
    { category: 'CAMPAIGNS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXECUTE', 'PAUSE', 'RESUME', 'SCHEDULE'] },
    
    // Contact Management
    { category: 'CONTACTS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'IMPORT', 'EXPORT', 'MERGE', 'TAG'] },
    { category: 'GROUPS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'JOIN', 'LEAVE', 'MANAGE_MEMBERS'] },
    { category: 'LABELS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN'] },
    
    // Automation & Integration
    { category: 'AUTOMATION', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ENABLE', 'DISABLE', 'TEST'] },
    { category: 'WEBHOOKS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'TEST', 'MONITOR'] },
    { category: 'API_KEYS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'REGENERATE', 'MONITOR'] },
    { category: 'INTEGRATIONS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'CONFIGURE', 'TEST'] },
    
    // Financial
    { category: 'BILLING', actions: ['VIEW', 'MANAGE', 'EXPORT', 'CREATE_INVOICE', 'REFUND'] },
    { category: 'PACKAGES', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN', 'PURCHASE'] },
    { category: 'VOUCHERS', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'REDEEM', 'TRANSFER'] },
    { category: 'TRANSACTIONS', actions: ['VIEW', 'CREATE', 'APPROVE', 'REJECT', 'EXPORT'] },
    { category: 'PAYOUTS', actions: ['VIEW', 'CREATE', 'APPROVE', 'PROCESS', 'CANCEL'] },
    
    // System Settings
    { category: 'SETTINGS', actions: ['VIEW', 'EDIT', 'BACKUP', 'RESTORE'] },
    { category: 'SECURITY', actions: ['VIEW', 'EDIT', 'AUDIT', 'MONITOR', 'CONFIGURE_2FA'] },
    { category: 'LOGS', actions: ['VIEW', 'EXPORT', 'DELETE', 'ANALYZE'] },
    { category: 'BACKUP', actions: ['VIEW', 'CREATE', 'RESTORE', 'DELETE', 'SCHEDULE'] },
    
    // Support & Help
    { category: 'SUPPORT', actions: ['VIEW', 'CREATE_TICKET', 'RESPOND', 'CLOSE', 'ESCALATE'] },
    { category: 'DOCUMENTATION', actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'] },
  ]

  const permissions = []
  for (const { category, actions } of permissionCategories) {
    for (const action of actions) {
      const permission = await prisma.permissions.create({
        data: {
          name: `${category}_${action}`,
          description: `${action} ${category.toLowerCase()} resources`,
          category,
          resource: category,
          action,
          is_system: ['USERS', 'ROLES', 'PERMISSIONS', 'SECURITY'].includes(category),
        },
      })
      permissions.push(permission)
    }
  }

  console.log(`✅ Created ${permissions.length} comprehensive permissions`)

  // Assign permissions to users based on roles
  console.log('👤 Assigning permissions to users based on roles...')
  
  // Owner gets ALL permissions
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

  // Admin gets all except owner-level financial and security
  const adminPermissions = permissions.filter(p => 
    !p.name.includes('BILLING_REFUND') && 
    !p.name.includes('PAYOUTS_PROCESS') &&
    !p.name.includes('SECURITY_CONFIGURE_2FA') &&
    !p.name.includes('BACKUP_DELETE')
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

  // Manager gets management permissions
  const managerPermissions = permissions.filter(p => 
    !p.name.includes('BILLING_REFUND') && 
    !p.name.includes('BILLING_MANAGE') &&
    !p.name.includes('PAYOUTS') &&
    !p.name.includes('SECURITY_CONFIGURE') &&
    !p.name.includes('SETTINGS_RESTORE') &&
    !p.name.includes('BACKUP_DELETE') &&
    !p.name.includes('ROLES_DELETE') &&
    !p.name.includes('PERMISSIONS_DELETE') &&
    !p.name.includes('SERVERS')
  )
  for (const permission of managerPermissions) {
    await prisma.user_permissions.create({
      data: {
        user_id: manager.id,
        permission_id: permission.id,
        assigned_by: admin.id,
      },
    })
  }
  console.log(`✅ Assigned ${managerPermissions.length} permissions to manager@demo.com`)

  // Subdealer gets customer and instance management
  const subdealerPermissions = permissions.filter(p => 
    p.name.includes('DASHBOARD_VIEW') ||
    p.name.includes('ANALYTICS_VIEW') ||
    p.name.includes('USERS_VIEW') ||
    (p.name.includes('USERS') && p.name.includes('CREATE')) ||
    p.name.includes('INSTANCES') ||
    p.name.includes('MESSAGES') ||
    p.name.includes('CONTACTS') ||
    p.name.includes('GROUPS') ||
    p.name.includes('CAMPAIGNS') ||
    p.name.includes('TEMPLATES') ||
    p.name.includes('AUTOMATION') ||
    (p.name.includes('PACKAGES') && !p.name.includes('DELETE')) ||
    (p.name.includes('VOUCHERS') && !p.name.includes('DELETE')) ||
    p.name.includes('TRANSACTIONS_VIEW') ||
    p.name.includes('REPORTS_VIEW') ||
    p.name.includes('SUPPORT')
  )
  for (const permission of subdealerPermissions) {
    await prisma.user_permissions.create({
      data: {
        user_id: subdealer.id,
        permission_id: permission.id,
        assigned_by: admin.id,
      },
    })
  }
  console.log(`✅ Assigned ${subdealerPermissions.length} permissions to subdealer@demo.com`)

  // Reseller gets limited customer management
  const resellerPermissions = permissions.filter(p => 
    p.name.includes('DASHBOARD_VIEW') ||
    p.name.includes('ANALYTICS_VIEW') ||
    (p.name.includes('INSTANCES') && !p.name.includes('DELETE')) ||
    (p.name.includes('MESSAGES') && !p.name.includes('DELETE')) ||
    (p.name.includes('CONTACTS') && !p.name.includes('DELETE')) ||
    (p.name.includes('GROUPS_VIEW')) ||
    (p.name.includes('CAMPAIGNS_VIEW')) ||
    (p.name.includes('TEMPLATES_VIEW')) ||
    p.name.includes('PACKAGES_VIEW') ||
    p.name.includes('VOUCHERS_REDEEM') ||
    p.name.includes('TRANSACTIONS_VIEW') ||
    p.name.includes('SUPPORT_VIEW') ||
    p.name.includes('SUPPORT_CREATE_TICKET')
  )
  for (const permission of resellerPermissions) {
    await prisma.user_permissions.create({
      data: {
        user_id: reseller.id,
        permission_id: permission.id,
        assigned_by: manager.id,
      },
    })
  }
  console.log(`✅ Assigned ${resellerPermissions.length} permissions to reseller@demo.com`)

  // Employee gets operational permissions
  const employeePermissions = permissions.filter(p => 
    p.name.includes('DASHBOARD_VIEW') ||
    p.name.includes('MESSAGES_VIEW') ||
    p.name.includes('MESSAGES_SEND') ||
    p.name.includes('CONTACTS_VIEW') ||
    p.name.includes('GROUPS_VIEW') ||
    p.name.includes('TEMPLATES_VIEW') ||
    p.name.includes('CAMPAIGNS_VIEW') ||
    p.name.includes('REPORTS_VIEW') ||
    p.name.includes('SUPPORT_VIEW') ||
    p.name.includes('SUPPORT_CREATE_TICKET') ||
    p.name.includes('DOCUMENTATION_VIEW')
  )
  for (const permission of employeePermissions) {
    await prisma.user_permissions.create({
      data: {
        user_id: employee.id,
        permission_id: permission.id,
        assigned_by: manager.id,
      },
    })
  }
  console.log(`✅ Assigned ${employeePermissions.length} permissions to employee@demo.com`)

  // Customer gets basic permissions
  const customerPermissions = permissions.filter(p => 
    p.name.includes('DASHBOARD_VIEW') ||
    (p.name.includes('INSTANCES') && (p.name.includes('VIEW') || p.name.includes('CONNECT') || p.name.includes('DISCONNECT'))) ||
    (p.name.includes('MESSAGES') && !p.name.includes('DELETE') && !p.name.includes('IMPORT')) ||
    p.name.includes('CONTACTS_VIEW') ||
    p.name.includes('CONTACTS_CREATE') ||
    p.name.includes('CONTACTS_EDIT') ||
    p.name.includes('GROUPS_VIEW') ||
    p.name.includes('TEMPLATES_VIEW') ||
    p.name.includes('TEMPLATES_USE') ||
    p.name.includes('CAMPAIGNS_VIEW') ||
    p.name.includes('PACKAGES_VIEW') ||
    p.name.includes('TRANSACTIONS_VIEW') ||
    p.name.includes('SUPPORT_VIEW') ||
    p.name.includes('SUPPORT_CREATE_TICKET') ||
    p.name.includes('DOCUMENTATION_VIEW')
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
  for (const permission of customerPermissions) {
    await prisma.user_permissions.create({
      data: {
        user_id: customer2.id,
        permission_id: permission.id,
        assigned_by: reseller.id,
      },
    })
  }
  console.log(`✅ Assigned ${customerPermissions.length} permissions to customer@demo.com`)
  console.log(`✅ Assigned ${customerPermissions.length} permissions to customer2@demo.com`)

  // Guest gets minimal view-only permissions
  const guestPermissions = permissions.filter(p => 
    p.name === 'DASHBOARD_VIEW' ||
    p.name === 'DOCUMENTATION_VIEW' ||
    p.name === 'PACKAGES_VIEW' ||
    p.name === 'SUPPORT_VIEW'
  )
  for (const permission of guestPermissions) {
    await prisma.user_permissions.create({
      data: {
        user_id: guest.id,
        permission_id: permission.id,
        assigned_by: admin.id,
      },
    })
  }
  console.log(`✅ Assigned ${guestPermissions.length} permissions to guest@demo.com`)

  // Create dealer-customer relationships
  console.log('🤝 Creating dealer-customer relationships...')
  
  await prisma.dealer_customers.create({
    data: {
      dealer_id: subdealer.id,
      customer_id: customer.id,
      assigned_by: admin.id,
      commission_rate: 5.00,
      status: 'active',
    },
  })

  await prisma.dealer_customers.create({
    data: {
      dealer_id: reseller.id,
      customer_id: customer2.id,
      assigned_by: manager.id,
      commission_rate: 3.00,
      status: 'active',
    },
  })

  console.log('✅ Dealer-customer relationships created')

  console.log('\n✨ Extended database seeding completed successfully!')
  console.log('\n📝 Demo credentials (all passwords: demo123):')
  console.log('═══════════════════════════════════════════════')
  console.log('🔑 FULL ACCESS:')
  console.log('  - Owner: owner@demo.com (Full system access)')
  console.log('  - Admin: admin@demo.com (Administrative access)')
  console.log('\n🔑 MANAGEMENT:')
  console.log('  - Manager: manager@demo.com (Team management)')
  console.log('  - Subdealer: subdealer@demo.com (Customer management)')
  console.log('  - Reseller: reseller@demo.com (Limited reselling)')
  console.log('\n🔑 OPERATIONAL:')
  console.log('  - Employee: employee@demo.com (Basic operations)')
  console.log('\n🔑 END USERS:')
  console.log('  - Customer: customer@demo.com (Service user)')
  console.log('  - Customer2: customer2@demo.com (Service user)')
  console.log('  - Guest: guest@demo.com (View-only access)')
  console.log('═══════════════════════════════════════════════')
  console.log(`\n📊 Summary:`)
  console.log(`  - ${8} roles created`)
  console.log(`  - ${9} users created`)
  console.log(`  - ${permissions.length} unique permissions created`)
  console.log(`  - Permissions assigned based on role hierarchy`)
  console.log(`  - Dealer-customer relationships established`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })