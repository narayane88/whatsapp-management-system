import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo users with hashed passwords
  const hashedPassword = await bcrypt.hash('demo123', 10)

  // Clear existing data for fresh start
  console.log('🧹 Cleaning existing data for user-based permission setup...')
  await prisma.user_permissions.deleteMany({})
  await prisma.role_permissions.deleteMany({})
  await prisma.user_audit_log.deleteMany({})
  await prisma.security_events.deleteMany({})
  await prisma.permissions.deleteMany({})

  // Create all roles expected by the login page
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

  const employeeRole = await prisma.roles.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      name: 'EMPLOYEE',
      description: 'Support & daily operations',
      level: 4,
      is_system: false,
    },
  })

  const customerRole = await prisma.roles.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: {
      name: 'CUSTOMER', 
      description: 'Basic WhatsApp management',
      level: 5,
      is_system: false,
    },
  })

  // Create all demo users expected by the login page
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      email: 'owner@demo.com',
      password: hashedPassword,
      name: 'System Owner',
      mobile: '+1234567890',
      dealer_type: 'owner',
      isActive: true,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      name: 'System Admin',
      mobile: '+1234567891',
      dealer_type: 'admin',
      parentId: owner.id,
      isActive: true,
    },
  })

  const subdealer = await prisma.user.upsert({
    where: { email: 'subdealer@demo.com' },
    update: {},
    create: {
      email: 'subdealer@demo.com',
      password: hashedPassword,
      name: 'Demo SubDealer',
      mobile: '+1234567892',
      dealer_type: 'subdealer',
      parentId: owner.id,
      isActive: true,
    },
  })

  const employee = await prisma.user.upsert({
    where: { email: 'employee@demo.com' },
    update: {},
    create: {
      email: 'employee@demo.com',
      password: hashedPassword,
      name: 'Demo Employee',
      mobile: '+1234567893',
      dealer_type: 'employee',
      parentId: subdealer.id,
      isActive: true,
    },
  })

  const customer = await prisma.user.upsert({
    where: { email: 'customer@demo.com' },
    update: {},
    create: {
      email: 'customer@demo.com',
      password: hashedPassword,
      name: 'Demo Customer',
      mobile: '+1234567894',
      dealer_type: 'user',
      parentId: subdealer.id,
      isActive: true,
    },
  })

  // Assign roles to all users
  await prisma.user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: owner.id,
        role_id: ownerRole.id,
      },
    },
    update: {},
    create: {
      user_id: owner.id,
      role_id: ownerRole.id,
      is_primary: true,
      assigned_by: owner.id,
    },
  })

  await prisma.user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: admin.id,
        role_id: adminRole.id,
      },
    },
    update: {},
    create: {
      user_id: admin.id,
      role_id: adminRole.id,
      is_primary: true,
      assigned_by: owner.id,
    },
  })

  await prisma.user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: subdealer.id,
        role_id: subdealerRole.id,
      },
    },
    update: {},
    create: {
      user_id: subdealer.id,
      role_id: subdealerRole.id,
      is_primary: true,
      assigned_by: owner.id,
    },
  })

  await prisma.user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: employee.id,
        role_id: employeeRole.id,
      },
    },
    update: {},
    create: {
      user_id: employee.id,
      role_id: employeeRole.id,
      is_primary: true,
      assigned_by: owner.id,
    },
  })

  await prisma.user_roles.upsert({
    where: {
      user_id_role_id: {
        user_id: customer.id,
        role_id: customerRole.id,
      },
    },
    update: {},
    create: {
      user_id: customer.id,
      role_id: customerRole.id,
      is_primary: true,
      assigned_by: owner.id,
    },
  })

  // Setup comprehensive user-based permission system
  console.log('🔐 Setting up user-based permissions system...')
  
  // Define comprehensive permissions for WhatsApp management system (ALL 280+ permissions)
  const systemPermissions = [
    // Page Access Permissions
    { name: 'dashboard.admin.access', description: 'Access admin dashboard', category: 'Page Access', resource: 'dashboard', action: 'access' },
    { name: 'customers.page.access', description: 'Access customers page', category: 'Page Access', resource: 'customers', action: 'access' },
    { name: 'packages.page.access', description: 'Access packages page', category: 'Page Access', resource: 'packages', action: 'access' },
    { name: 'vouchers.page.access', description: 'Access vouchers page', category: 'Page Access', resource: 'vouchers', action: 'access' },
    { name: 'transactions.page.access', description: 'Access transactions page', category: 'Page Access', resource: 'transactions', action: 'access' },
    { name: 'subscriptions.page.access', description: 'Access subscriptions page', category: 'Page Access', resource: 'subscriptions', action: 'access' },
    { name: 'bizpoints.page.access', description: 'Access bizpoints page', category: 'Page Access', resource: 'bizpoints', action: 'access' },
    { name: 'users.page.access', description: 'Access users page', category: 'Page Access', resource: 'users', action: 'access' },
    { name: 'servers.page.access', description: 'Access servers page', category: 'Page Access', resource: 'servers', action: 'access' },
    { name: 'api-docs.page.access', description: 'Access API docs page', category: 'Page Access', resource: 'api-docs', action: 'access' },
    { name: 'api.docs.page.access', description: 'Access API documentation page', category: 'Page Access', resource: 'api', action: 'access' },
    { name: 'payouts.page.access', description: 'Access payouts page', category: 'Page Access', resource: 'payouts', action: 'access' },
    { name: 'languages.page.access', description: 'Access languages page', category: 'Page Access', resource: 'languages', action: 'access' },
    { name: 'settings.page.access', description: 'Access settings page', category: 'Page Access', resource: 'settings', action: 'access' },
    { name: 'settings.security.access', description: 'Access security settings', category: 'Page Access', resource: 'settings', action: 'security' },
    { name: 'settings.company.access', description: 'Access company settings', category: 'Page Access', resource: 'settings', action: 'company' },
    { name: 'settings.themes.access', description: 'Access theme settings', category: 'Page Access', resource: 'settings', action: 'themes' },
    
    // User Management Permissions
    { name: 'users.create', description: 'Create new user accounts', category: 'User Management', resource: 'users', action: 'create' },
    { name: 'users.read', description: 'Read user accounts and profiles', category: 'User Management', resource: 'users', action: 'read' },
    { name: 'users.update', description: 'Update user accounts and profiles', category: 'User Management', resource: 'users', action: 'update' },
    { name: 'users.delete', description: 'Delete user accounts', category: 'User Management', resource: 'users', action: 'delete' },
    { name: 'users.manage', description: 'Manage user accounts', category: 'User Management', resource: 'users', action: 'manage' },
    { name: 'users.impersonate', description: 'Impersonate other users', category: 'User Management', resource: 'users', action: 'impersonate' },
    { name: 'users.export', description: 'Export user data', category: 'User Management', resource: 'users', action: 'export' },
    { name: 'users.credit.manage', description: 'Manage user credits', category: 'User Management', resource: 'users', action: 'credit' },
    { name: 'users.avatar.upload', description: 'Upload user avatars', category: 'User Management', resource: 'users', action: 'avatar' },
    { name: 'users.permissions.button', description: 'Access user permissions button', category: 'User Management', resource: 'users', action: 'permissions' },
    { name: 'users.roles.button', description: 'Access user roles button', category: 'User Management', resource: 'users', action: 'roles' },
    { name: 'users.roles.page', description: 'Access user roles page', category: 'User Management', resource: 'users', action: 'roles_page' },
    { name: 'users.reset_password', description: 'Reset user passwords', category: 'User Management', resource: 'users', action: 'reset_password' },
    { name: 'users.view.link', description: 'View user profile links', category: 'User Management', resource: 'users', action: 'view_link' },
    { name: 'users.edit.button', description: 'Access user edit buttons', category: 'User Management', resource: 'users', action: 'edit_button' },
    { name: 'users.delete.button', description: 'Access user delete buttons', category: 'User Management', resource: 'users', action: 'delete_button' },
    { name: 'users.create.button', description: 'Access user create buttons', category: 'User Management', resource: 'users', action: 'create_button' },
    { name: 'users.edit.icon', description: 'Access user edit icons', category: 'User Management', resource: 'users', action: 'edit_icon' },
    { name: 'users.view', description: 'View user accounts', category: 'User Management', resource: 'users', action: 'view' },
    { name: 'users.edit', description: 'Edit user accounts', category: 'User Management', resource: 'users', action: 'edit' },
    { name: 'users.manage_roles', description: 'Assign and manage user roles', category: 'User Management', resource: 'users', action: 'manage_roles' },
    
    // Customer Management Permissions
    { name: 'customers.create', description: 'Create customer accounts', category: 'Customer Management', resource: 'customers', action: 'create' },
    { name: 'customers.read', description: 'Read customer accounts', category: 'Customer Management', resource: 'customers', action: 'read' },
    { name: 'customers.update', description: 'Update customer accounts', category: 'Customer Management', resource: 'customers', action: 'update' },
    { name: 'customers.delete', description: 'Delete customer accounts', category: 'Customer Management', resource: 'customers', action: 'delete' },
    { name: 'customers.manage', description: 'Manage customer accounts', category: 'Customer Management', resource: 'customers', action: 'manage' },
    { name: 'customers.export', description: 'Export customer data', category: 'Customer Management', resource: 'customers', action: 'export' },
    { name: 'customers.impersonate', description: 'Impersonate customers', category: 'Customer Management', resource: 'customers', action: 'impersonate' },
    { name: 'customers.suspend', description: 'Suspend customer accounts', category: 'Customer Management', resource: 'customers', action: 'suspend' },
    { name: 'customers.activate', description: 'Activate customer accounts', category: 'Customer Management', resource: 'customers', action: 'activate' },
    { name: 'customers.sensitive.access', description: 'Access customer sensitive data', category: 'Customer Management', resource: 'customers', action: 'sensitive' },
    { name: 'customers.edit.button', description: 'Access customer edit buttons', category: 'Customer Management', resource: 'customers', action: 'edit_button' },
    { name: 'customers.create.button', description: 'Access customer create buttons', category: 'Customer Management', resource: 'customers', action: 'create_button' },
    
    // Dealer Management Permissions
    { name: 'dealers.create', description: 'Create dealer accounts', category: 'Dealer Management', resource: 'dealers', action: 'create' },
    { name: 'dealers.read', description: 'Read dealer accounts', category: 'Dealer Management', resource: 'dealers', action: 'read' },
    { name: 'dealers.update', description: 'Update dealer accounts', category: 'Dealer Management', resource: 'dealers', action: 'update' },
    { name: 'dealers.delete', description: 'Delete dealer accounts', category: 'Dealer Management', resource: 'dealers', action: 'delete' },
    { name: 'dealers.manage', description: 'Manage dealer accounts', category: 'Dealer Management', resource: 'dealers', action: 'manage' },
    { name: 'dealers.customers.assign', description: 'Assign customers to dealers', category: 'Dealer Management', resource: 'dealers', action: 'assign_customers' },
    { name: 'dealers.commission.manage', description: 'Manage dealer commissions', category: 'Dealer Management', resource: 'dealers', action: 'commission' },
    
    // Role & Permission Management
    { name: 'roles.create', description: 'Create new roles', category: 'Role Management', resource: 'roles', action: 'create' },
    { name: 'roles.read', description: 'Read roles and permissions', category: 'Role Management', resource: 'roles', action: 'read' },
    { name: 'roles.update', description: 'Update roles and permissions', category: 'Role Management', resource: 'roles', action: 'update' },
    { name: 'roles.delete', description: 'Delete roles', category: 'Role Management', resource: 'roles', action: 'delete' },
    { name: 'roles.assign', description: 'Assign roles to users', category: 'Role Management', resource: 'roles', action: 'assign' },
    { name: 'roles.system.manage', description: 'Manage system roles', category: 'Role Management', resource: 'roles', action: 'system' },
    { name: 'permissions.create', description: 'Create permissions', category: 'Role Management', resource: 'permissions', action: 'create' },
    { name: 'permissions.read', description: 'Read permissions', category: 'Role Management', resource: 'permissions', action: 'read' },
    { name: 'permissions.update', description: 'Update permissions', category: 'Role Management', resource: 'permissions', action: 'update' },
    { name: 'permissions.edit', description: 'Edit permissions (alias for update)', category: 'Role Management', resource: 'permissions', action: 'edit' },
    { name: 'permissions.delete', description: 'Delete permissions', category: 'Role Management', resource: 'permissions', action: 'delete' },
    { name: 'permissions.assign', description: 'Assign permissions to users', category: 'Role Management', resource: 'permissions', action: 'assign' },
    { name: 'permissions.system.manage', description: 'Manage system permissions', category: 'Role Management', resource: 'permissions', action: 'system' },
    { name: 'permission.templates.manage', description: 'Manage permission templates', category: 'Role Management', resource: 'permissions', action: 'templates' },
    { name: 'roles.view', description: 'View roles and permissions', category: 'Role Management', resource: 'roles', action: 'view' },
    { name: 'roles.edit', description: 'Edit roles and permissions', category: 'Role Management', resource: 'roles', action: 'edit' },
    { name: 'permissions.view', description: 'View permissions', category: 'Role Management', resource: 'permissions', action: 'view' },
    
    // Package & Subscription Management
    { name: 'packages.create', description: 'Create service packages', category: 'Package Management', resource: 'packages', action: 'create' },
    { name: 'packages.read', description: 'Read service packages', category: 'Package Management', resource: 'packages', action: 'read' },
    { name: 'packages.update', description: 'Update service packages', category: 'Package Management', resource: 'packages', action: 'update' },
    { name: 'packages.delete', description: 'Delete service packages', category: 'Package Management', resource: 'packages', action: 'delete' },
    { name: 'packages.manage', description: 'Manage service packages', category: 'Package Management', resource: 'packages', action: 'manage' },
    { name: 'subscriptions.create', description: 'Create subscriptions', category: 'Package Management', resource: 'subscriptions', action: 'create' },
    { name: 'subscriptions.read', description: 'Read subscriptions', category: 'Package Management', resource: 'subscriptions', action: 'read' },
    { name: 'subscriptions.update', description: 'Update subscriptions', category: 'Package Management', resource: 'subscriptions', action: 'update' },
    { name: 'subscriptions.delete', description: 'Delete subscriptions', category: 'Package Management', resource: 'subscriptions', action: 'delete' },
    { name: 'subscriptions.manage', description: 'Manage subscriptions', category: 'Package Management', resource: 'subscriptions', action: 'manage' },
    { name: 'subscriptions.create.button', description: 'Access subscription create buttons', category: 'Package Management', resource: 'subscriptions', action: 'create_button' },
    { name: 'subscriptions.edit.button', description: 'Access subscription edit buttons', category: 'Package Management', resource: 'subscriptions', action: 'edit_button' },
    { name: 'customer_packages.assign', description: 'Assign packages to customers', category: 'Package Management', resource: 'customer_packages', action: 'assign' },
    { name: 'packages.view', description: 'View service packages', category: 'Package Management', resource: 'packages', action: 'view' },
    { name: 'packages.edit', description: 'Edit service packages', category: 'Package Management', resource: 'packages', action: 'edit' },
    
    // WhatsApp Management Permissions
    { name: 'whatsapp.instances.create', description: 'Create WhatsApp instances', category: 'WhatsApp Management', resource: 'whatsapp', action: 'create_instances' },
    { name: 'whatsapp.instances.read', description: 'Read WhatsApp instances', category: 'WhatsApp Management', resource: 'whatsapp', action: 'read_instances' },
    { name: 'whatsapp.instances.update', description: 'Update WhatsApp instances', category: 'WhatsApp Management', resource: 'whatsapp', action: 'update_instances' },
    { name: 'whatsapp.instances.delete', description: 'Delete WhatsApp instances', category: 'WhatsApp Management', resource: 'whatsapp', action: 'delete_instances' },
    { name: 'whatsapp.instances.manage', description: 'Manage WhatsApp instances', category: 'WhatsApp Management', resource: 'whatsapp', action: 'manage_instances' },
    { name: 'whatsapp.messages.send', description: 'Send WhatsApp messages', category: 'WhatsApp Management', resource: 'whatsapp', action: 'send_messages' },
    { name: 'whatsapp.messages.read', description: 'Read WhatsApp messages', category: 'WhatsApp Management', resource: 'whatsapp', action: 'read_messages' },
    { name: 'whatsapp.messages.manage', description: 'Manage WhatsApp messages', category: 'WhatsApp Management', resource: 'whatsapp', action: 'manage_messages' },
    { name: 'whatsapp.accounts.create', description: 'Create WhatsApp accounts', category: 'WhatsApp Management', resource: 'whatsapp', action: 'create_accounts' },
    { name: 'whatsapp.accounts.read', description: 'Read WhatsApp accounts', category: 'WhatsApp Management', resource: 'whatsapp', action: 'read_accounts' },
    { name: 'whatsapp.accounts.update', description: 'Update WhatsApp accounts', category: 'WhatsApp Management', resource: 'whatsapp', action: 'update_accounts' },
    { name: 'whatsapp.accounts.delete', description: 'Delete WhatsApp accounts', category: 'WhatsApp Management', resource: 'whatsapp', action: 'delete_accounts' },
    { name: 'whatsapp.servers.create', description: 'Create WhatsApp servers', category: 'WhatsApp Management', resource: 'whatsapp', action: 'create_servers' },
    { name: 'whatsapp.servers.read', description: 'Read WhatsApp servers', category: 'WhatsApp Management', resource: 'whatsapp', action: 'read_servers' },
    { name: 'whatsapp.servers.update', description: 'Update WhatsApp servers', category: 'WhatsApp Management', resource: 'whatsapp', action: 'update_servers' },
    { name: 'whatsapp.servers.delete', description: 'Delete WhatsApp servers', category: 'WhatsApp Management', resource: 'whatsapp', action: 'delete_servers' },
    { name: 'whatsapp.servers.manage', description: 'Manage WhatsApp servers', category: 'WhatsApp Management', resource: 'whatsapp', action: 'manage_servers' },
    { name: 'instances.create', description: 'Create instances', category: 'WhatsApp Management', resource: 'instances', action: 'create' },
    { name: 'instances.read', description: 'Read instances', category: 'WhatsApp Management', resource: 'instances', action: 'read' },
    { name: 'instances.update', description: 'Update instances', category: 'WhatsApp Management', resource: 'instances', action: 'update' },
    { name: 'instances.delete', description: 'Delete instances', category: 'WhatsApp Management', resource: 'instances', action: 'delete' },
    { name: 'instances.manage', description: 'Manage instances', category: 'WhatsApp Management', resource: 'instances', action: 'manage' },
    { name: 'instances.view', description: 'View WhatsApp instances', category: 'WhatsApp Management', resource: 'instances', action: 'view' },
    { name: 'instances.connect', description: 'Connect/disconnect instances', category: 'WhatsApp Management', resource: 'instances', action: 'connect' },
    
    // Message Management
    { name: 'messages.send', description: 'Send WhatsApp messages', category: 'Messaging', resource: 'messages', action: 'send' },
    { name: 'messages.view', description: 'View message history', category: 'Messaging', resource: 'messages', action: 'view' },
    { name: 'messages.bulk_send', description: 'Send bulk messages', category: 'Messaging', resource: 'messages', action: 'bulk_send' },
    { name: 'messages.delete', description: 'Delete messages', category: 'Messaging', resource: 'messages', action: 'delete' },
    { name: 'message_queue.manage', description: 'Manage message queue', category: 'Messaging', resource: 'message_queue', action: 'manage' },
    
    // Contact Management
    { name: 'contacts.create', description: 'Create contacts', category: 'Contact Management', resource: 'contacts', action: 'create' },
    { name: 'contacts.view', description: 'View contacts', category: 'Contact Management', resource: 'contacts', action: 'view' },
    { name: 'contacts.edit', description: 'Edit contacts', category: 'Contact Management', resource: 'contacts', action: 'edit' },
    { name: 'contacts.delete', description: 'Delete contacts', category: 'Contact Management', resource: 'contacts', action: 'delete' },
    { name: 'contact_groups.manage', description: 'Manage contact groups', category: 'Contact Management', resource: 'contact_groups', action: 'manage' },
    
    // Financial Management Permissions
    { name: 'finance.transactions.read', description: 'Read financial transactions', category: 'Financial', resource: 'finance', action: 'read_transactions' },
    { name: 'finance.transactions.create', description: 'Create financial transactions', category: 'Financial', resource: 'finance', action: 'create_transactions' },
    { name: 'finance.transactions.update', description: 'Update financial transactions', category: 'Financial', resource: 'finance', action: 'update_transactions' },
    { name: 'finance.transactions.delete', description: 'Delete financial transactions', category: 'Financial', resource: 'finance', action: 'delete_transactions' },
    { name: 'finance.transactions.manage', description: 'Manage financial transactions', category: 'Financial', resource: 'finance', action: 'manage_transactions' },
    { name: 'finance.bizpoints.read', description: 'Read BizPoints data', category: 'Financial', resource: 'finance', action: 'read_bizpoints' },
    { name: 'finance.bizpoints.create', description: 'Create BizPoints entries', category: 'Financial', resource: 'finance', action: 'create_bizpoints' },
    { name: 'finance.bizpoints.update', description: 'Update BizPoints entries', category: 'Financial', resource: 'finance', action: 'update_bizpoints' },
    { name: 'finance.bizpoints.delete', description: 'Delete BizPoints entries', category: 'Financial', resource: 'finance', action: 'delete_bizpoints' },
    { name: 'finance.bizpoints.manage', description: 'Manage BizPoints system', category: 'Financial', resource: 'finance', action: 'manage_bizpoints' },
    { name: 'finance.bizpoints.commission', description: 'Manage BizPoints commissions', category: 'Financial', resource: 'finance', action: 'bizpoints_commission' },
    { name: 'finance.payouts.read', description: 'Read payout data', category: 'Financial', resource: 'finance', action: 'read_payouts' },
    { name: 'finance.payouts.create', description: 'Create payouts', category: 'Financial', resource: 'finance', action: 'create_payouts' },
    { name: 'finance.payouts.update', description: 'Update payouts', category: 'Financial', resource: 'finance', action: 'update_payouts' },
    { name: 'finance.payouts.manage', description: 'Manage payouts', category: 'Financial', resource: 'finance', action: 'manage_payouts' },
    { name: 'finance.reports.read', description: 'Read financial reports', category: 'Financial', resource: 'finance', action: 'read_reports' },
    { name: 'finance.reports.export', description: 'Export financial reports', category: 'Financial', resource: 'finance', action: 'export_reports' },
    { name: 'bizpoints.add.button', description: 'Access add BizPoints buttons', category: 'Financial', resource: 'bizpoints', action: 'add_button' },
    { name: 'bizpoints.deduct.button', description: 'Access deduct BizPoints buttons', category: 'Financial', resource: 'bizpoints', action: 'deduct_button' },
    { name: 'bizpoints.purchase.button', description: 'Access purchase BizPoints buttons', category: 'Financial', resource: 'bizpoints', action: 'purchase_button' },
    { name: 'transactions.create', description: 'Create transactions', category: 'Financial', resource: 'transactions', action: 'create' },
    { name: 'transactions.view', description: 'View transactions', category: 'Financial', resource: 'transactions', action: 'view' },
    { name: 'transactions.edit', description: 'Edit transactions', category: 'Financial', resource: 'transactions', action: 'edit' },
    { name: 'payouts.create', description: 'Create payouts', category: 'Financial', resource: 'payouts', action: 'create' },
    { name: 'billing.view', description: 'View billing information', category: 'Financial', resource: 'billing', action: 'view' },
    { name: 'billing.manage', description: 'Manage billing and invoices', category: 'Financial', resource: 'billing', action: 'manage' },
    { name: 'bizpoints.manage', description: 'Manage BizPoints system', category: 'Financial', resource: 'bizpoints', action: 'manage' },
    { name: 'payouts.manage', description: 'Manage payouts', category: 'Financial', resource: 'payouts', action: 'manage' },
    
    // Voucher Management Permissions
    { name: 'vouchers.create', description: 'Create vouchers', category: 'Voucher Management', resource: 'vouchers', action: 'create' },
    { name: 'vouchers.read', description: 'Read vouchers', category: 'Voucher Management', resource: 'vouchers', action: 'read' },
    { name: 'vouchers.update', description: 'Update vouchers', category: 'Voucher Management', resource: 'vouchers', action: 'update' },
    { name: 'vouchers.delete', description: 'Delete vouchers', category: 'Voucher Management', resource: 'vouchers', action: 'delete' },
    { name: 'vouchers.manage', description: 'Manage vouchers', category: 'Voucher Management', resource: 'vouchers', action: 'manage' },
    { name: 'vouchers.redeem', description: 'Redeem vouchers', category: 'Voucher Management', resource: 'vouchers', action: 'redeem' },
    { name: 'vouchers.validate', description: 'Validate vouchers', category: 'Voucher Management', resource: 'vouchers', action: 'validate' },
    { name: 'vouchers.view', description: 'View vouchers', category: 'Voucher Management', resource: 'vouchers', action: 'view' },
    
    // System Administration Permissions
    { name: 'system.settings.read', description: 'Read system settings', category: 'System', resource: 'system', action: 'read_settings' },
    { name: 'system.settings.update', description: 'Update system settings', category: 'System', resource: 'system', action: 'update_settings' },
    { name: 'system.settings.manage', description: 'Manage system settings', category: 'System', resource: 'system', action: 'manage_settings' },
    { name: 'system.logs.read', description: 'Read system logs', category: 'System', resource: 'system', action: 'read_logs' },
    { name: 'system.logs.delete', description: 'Delete system logs', category: 'System', resource: 'system', action: 'delete_logs' },
    { name: 'system.health.read', description: 'Read system health status', category: 'System', resource: 'system', action: 'read_health' },
    { name: 'system.backup.create', description: 'Create system backups', category: 'System', resource: 'system', action: 'create_backup' },
    { name: 'system.backup.restore', description: 'Restore system backups', category: 'System', resource: 'system', action: 'restore_backup' },
    { name: 'system.maintenance.manage', description: 'Manage system maintenance', category: 'System', resource: 'system', action: 'manage_maintenance' },
    { name: 'settings.read', description: 'Read settings', category: 'System', resource: 'settings', action: 'read' },
    { name: 'settings.update', description: 'Update settings', category: 'System', resource: 'settings', action: 'update' },
    { name: 'system.settings', description: 'Manage system settings', category: 'System', resource: 'system', action: 'settings' },
    { name: 'system.audit_logs', description: 'View audit logs', category: 'System', resource: 'audit_logs', action: 'read' },
    { name: 'system.security_events', description: 'View security events', category: 'System', resource: 'security_events', action: 'read' },
    { name: 'servers.manage', description: 'Manage WhatsApp servers', category: 'System', resource: 'servers', action: 'manage' },
    { name: 'company_profile.manage', description: 'Manage company profile', category: 'System', resource: 'company_profile', action: 'manage' },
    
    // Security Management Permissions
    { name: 'security.settings.read', description: 'Read security settings', category: 'Security', resource: 'security', action: 'read_settings' },
    { name: 'security.settings.update', description: 'Update security settings', category: 'Security', resource: 'security', action: 'update_settings' },
    { name: 'security.events.read', description: 'Read security events', category: 'Security', resource: 'security', action: 'read_events' },
    { name: 'security.events.manage', description: 'Manage security events', category: 'Security', resource: 'security', action: 'manage_events' },
    { name: 'security.sessions.read', description: 'Read user sessions', category: 'Security', resource: 'security', action: 'read_sessions' },
    { name: 'security.sessions.terminate', description: 'Terminate user sessions', category: 'Security', resource: 'security', action: 'terminate_sessions' },
    { name: 'security.ip.restrictions.read', description: 'Read IP restrictions', category: 'Security', resource: 'security', action: 'read_ip_restrictions' },
    { name: 'security.ip.restrictions.manage', description: 'Manage IP restrictions', category: 'Security', resource: 'security', action: 'manage_ip_restrictions' },
    { name: 'security.audit.read', description: 'Read security audits', category: 'Security', resource: 'security', action: 'read_audit' },
    { name: 'security.audit.export', description: 'Export security audits', category: 'Security', resource: 'security', action: 'export_audit' },
    
    // API & Documentation Permissions
    { name: 'api.docs.read', description: 'Read API documentation', category: 'API Management', resource: 'api', action: 'read_docs' },
    { name: 'api.docs.update', description: 'Update API documentation', category: 'API Management', resource: 'api', action: 'update_docs' },
    { name: 'api.keys.create', description: 'Create API keys', category: 'API Management', resource: 'api', action: 'create_keys' },
    { name: 'api.keys.read', description: 'Read API keys', category: 'API Management', resource: 'api', action: 'read_keys' },
    { name: 'api.keys.update', description: 'Update API keys', category: 'API Management', resource: 'api', action: 'update_keys' },
    { name: 'api.keys.delete', description: 'Delete API keys', category: 'API Management', resource: 'api', action: 'delete_keys' },
    { name: 'api.usage.read', description: 'Read API usage statistics', category: 'API Management', resource: 'api', action: 'read_usage' },
    { name: 'api.rate.limits.manage', description: 'Manage API rate limits', category: 'API Management', resource: 'api', action: 'manage_rate_limits' },
    { name: 'api.access', description: 'Access API endpoints', category: 'API Management', resource: 'api', action: 'access' },
    { name: 'api_keys.create', description: 'Create API keys', category: 'API Management', resource: 'api_keys', action: 'create' },
    { name: 'api_keys.view', description: 'View API keys', category: 'API Management', resource: 'api_keys', action: 'view' },
    { name: 'api_keys.edit', description: 'Edit API keys', category: 'API Management', resource: 'api_keys', action: 'edit' },
    { name: 'api_keys.delete', description: 'Delete API keys', category: 'API Management', resource: 'api_keys', action: 'delete' },
    { name: 'api_logs.view', description: 'View API logs', category: 'API Management', resource: 'api_logs', action: 'view' },
    
    // Company Management Permissions
    { name: 'company.profile.read', description: 'Read company profile', category: 'Company Management', resource: 'company', action: 'read_profile' },
    { name: 'company.profile.update', description: 'Update company profile', category: 'Company Management', resource: 'company', action: 'update_profile' },
    { name: 'company.branding.update', description: 'Update company branding', category: 'Company Management', resource: 'company', action: 'update_branding' },
    { name: 'company.themes.read', description: 'Read company themes', category: 'Company Management', resource: 'company', action: 'read_themes' },
    { name: 'company.themes.update', description: 'Update company themes', category: 'Company Management', resource: 'company', action: 'update_themes' },
    { name: 'company.languages.read', description: 'Read company languages', category: 'Company Management', resource: 'company', action: 'read_languages' },
    { name: 'company.languages.update', description: 'Update company languages', category: 'Company Management', resource: 'company', action: 'update_languages' },
    
    // Dashboard & Analytics Permissions
    { name: 'dashboard.admin.read', description: 'Read admin dashboard', category: 'Analytics', resource: 'dashboard', action: 'read_admin' },
    { name: 'dashboard.analytics.read', description: 'Read dashboard analytics', category: 'Analytics', resource: 'dashboard', action: 'read_analytics' },
    { name: 'dashboard.reports.read', description: 'Read dashboard reports', category: 'Analytics', resource: 'dashboard', action: 'read_reports' },
    { name: 'dashboard.widgets.manage', description: 'Manage dashboard widgets', category: 'Analytics', resource: 'dashboard', action: 'manage_widgets' },
    { name: 'analytics.users.read', description: 'Read user analytics', category: 'Analytics', resource: 'analytics', action: 'read_users' },
    { name: 'analytics.messages.read', description: 'Read message analytics', category: 'Analytics', resource: 'analytics', action: 'read_messages' },
    { name: 'analytics.financial.read', description: 'Read financial analytics', category: 'Analytics', resource: 'analytics', action: 'read_financial' },
    { name: 'analytics.performance.read', description: 'Read performance analytics', category: 'Analytics', resource: 'analytics', action: 'read_performance' },
    { name: 'analytics.view', description: 'View analytics dashboard', category: 'Analytics', resource: 'analytics', action: 'view' },
    { name: 'analytics.advanced', description: 'Access advanced analytics', category: 'Analytics', resource: 'analytics', action: 'advanced' },
    { name: 'reports.generate', description: 'Generate reports', category: 'Analytics', resource: 'reports', action: 'generate' },
    { name: 'reports.export', description: 'Export reports', category: 'Analytics', resource: 'reports', action: 'export' },
    { name: 'reports.view', description: 'View reports', category: 'Analytics', resource: 'reports', action: 'view' },
    
    // Server Management Permissions
    { name: 'servers.create', description: 'Create servers', category: 'Server Management', resource: 'servers', action: 'create' },
    { name: 'servers.read', description: 'Read server information', category: 'Server Management', resource: 'servers', action: 'read' },
    { name: 'servers.update', description: 'Update server configuration', category: 'Server Management', resource: 'servers', action: 'update' },
    { name: 'servers.delete', description: 'Delete servers', category: 'Server Management', resource: 'servers', action: 'delete' },
    
    // Automation
    { name: 'automation.create', description: 'Create automation rules', category: 'Automation', resource: 'automation', action: 'create' },
    { name: 'automation.view', description: 'View automation rules', category: 'Automation', resource: 'automation', action: 'view' },
    { name: 'automation.edit', description: 'Edit automation rules', category: 'Automation', resource: 'automation', action: 'edit' },
    { name: 'automation.delete', description: 'Delete automation rules', category: 'Automation', resource: 'automation', action: 'delete' },
    
    // Legacy/Support Permissions
    { name: 'support.tickets', description: 'Manage support tickets', category: 'Support', resource: 'support', action: 'tickets' }
  ]

  // Create all permissions
  console.log('📝 Creating system permissions...')
  const createdPermissions = []
  for (const perm of systemPermissions) {
    const permission = await prisma.permissions.upsert({
      where: { name: perm.name },
      update: {},
      create: {
        name: perm.name,
        description: perm.description,
        category: perm.category,
        resource: perm.resource,
        action: perm.action,
        is_system: true
      }
    })
    createdPermissions.push(permission)
  }

  console.log(`✅ Created ${createdPermissions.length} system permissions`)

  // Define user-based permission assignments
  const userPermissionAssignments = {
    'owner@demo.com': systemPermissions.map(p => p.name), // Owner gets ALL 265+ permissions
    'admin@demo.com': [
      // User Management
      'users.create', 'users.view', 'users.edit', 'users.delete', 'users.manage_roles',
      // Role Management (limited)
      'roles.view', 'permissions.assign',
      // WhatsApp Management
      'instances.create', 'instances.view', 'instances.edit', 'instances.delete', 'instances.connect',
      // Messaging
      'messages.send', 'messages.view', 'messages.bulk_send', 'messages.delete', 'message_queue.manage',
      // Contact Management
      'contacts.create', 'contacts.view', 'contacts.edit', 'contacts.delete', 'contact_groups.manage',
      // Package Management
      'packages.view', 'packages.edit', 'customer_packages.assign',
      // Financial (limited)
      'transactions.view', 'billing.view', 'bizpoints.manage',
      // Vouchers
      'vouchers.view', 'vouchers.edit', 'vouchers.redeem',
      // Analytics
      'analytics.view', 'reports.generate', 'reports.export',
      // API Management
      'api_keys.view', 'api_logs.view',
      // System (limited)
      'system.audit_logs', 'system.security_events'
    ],
    'subdealer@demo.com': [
      // User Management (limited to customers)
      'users.create', 'users.view', 'users.edit', 'users.page.access',
      // WhatsApp Management (own instances)
      'instances.view', 'instances.edit', 'instances.connect',
      // Messaging
      'messages.send', 'messages.view', 'messages.bulk_send',
      // Contact Management
      'contacts.create', 'contacts.view', 'contacts.edit', 'contact_groups.manage',
      // Package Management (view and assign)
      'packages.view', 'customer_packages.assign',
      // Financial (own transactions)
      'transactions.view', 'billing.view',
      // Vouchers (redeem only)
      'vouchers.view', 'vouchers.redeem',
      // Analytics (own data)
      'analytics.view', 'reports.generate'
    ],
    'employee@demo.com': [
      // User Management (view only)
      'users.view',
      // WhatsApp Management (support)
      'instances.view',
      // Messaging (support)
      'messages.view',
      // Contact Management (support)
      'contacts.view',
      // Package Management (view)
      'packages.view',
      // Financial (support)
      'transactions.view', 'billing.view',
      // Vouchers (support)
      'vouchers.view',
      // Analytics (basic)
      'analytics.view'
    ],
    'customer@demo.com': [
      // WhatsApp Management (own instances only)
      'instances.view', 'instances.connect',
      // Messaging (own messages only)
      'messages.send', 'messages.view',
      // Contact Management (own contacts only)
      'contacts.create', 'contacts.view', 'contacts.edit', 'contact_groups.manage',
      // Package Management (view own packages)
      'packages.view',
      // Financial (own billing)
      'billing.view',
      // Vouchers (redeem own)
      'vouchers.redeem',
      // Analytics (own data only)
      'analytics.view'
    ]
  }

  // Assign permissions directly to users
  console.log('👤 Assigning permissions to users...')
  for (const [userEmail, permissionNames] of Object.entries(userPermissionAssignments)) {
    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (user) {
      let assignedCount = 0
      for (const permissionName of permissionNames) {
        const permission = await prisma.permissions.findUnique({ where: { name: permissionName } })
        if (permission) {
          await prisma.user_permissions.upsert({
            where: {
              user_id_permission_id: {
                user_id: user.id,
                permission_id: permission.id
              }
            },
            update: {},
            create: {
              user_id: user.id,
              permission_id: permission.id,
              granted: true,
              assigned_by: owner.id,
              reason: 'Initial seeding - user-based permission assignment'
            }
          })
          assignedCount++
        }
      }
      console.log(`✅ Assigned ${assignedCount} permissions to ${userEmail}`)
    }
  }

  // Create audit log entries for setup
  console.log('📊 Creating audit logs...')
  const auditEntries = [
    {
      user_id: owner.id,
      action: 'SYSTEM_SETUP',
      performed_by: 'system',
      details: {
        action: 'Database seeded with demo data and user-based permissions',
        permissions_created: systemPermissions.length,
        roles_created: 5,
        users_created: 5,
        permission_model: 'user-based'
      },
      ip_address: '127.0.0.1'
    },
    {
      user_id: owner.id,
      action: 'PERMISSION_ASSIGNMENT',
      performed_by: 'system',
      details: {
        action: 'Assigned full permissions to owner@demo.com',
        permissions_granted: userPermissionAssignments['owner@demo.com'].length,
        assignment_type: 'direct_user_permission'
      },
      ip_address: '127.0.0.1'
    },
    {
      user_id: admin.id,
      action: 'PERMISSION_ASSIGNMENT',
      performed_by: 'system',
      details: {
        action: 'Assigned admin permissions to admin@demo.com',
        permissions_granted: userPermissionAssignments['admin@demo.com'].length,
        assignment_type: 'direct_user_permission'
      },
      ip_address: '127.0.0.1'
    }
  ]

  for (const entry of auditEntries) {
    await prisma.user_audit_log.create({ data: entry })
  }

  // Create security events for initial setup
  console.log('🔒 Creating security events...')
  const securityEvents = [
    {
      event_type: 'SYSTEM_INITIALIZATION',
      user_email: 'owner@demo.com',
      user_id: owner.id,
      ip_address: '127.0.0.1',
      severity: 'low',
      details: 'Initial database setup with user-based permission system',
      metadata: {
        environment: 'development',
        version: '1.0.0',
        setup_time: new Date().toISOString(),
        permission_model: 'user-based'
      }
    },
    {
      event_type: 'PERMISSION_SYSTEM_SETUP',
      user_email: 'system@demo.com',
      severity: 'low',
      details: 'User-based permission system initialized with granular permissions',
      metadata: {
        total_permissions: systemPermissions.length,
        total_users: 5,
        permission_categories: [...new Set(systemPermissions.map(p => p.category))].length,
        user_based_rbac: true
      }
    }
  ]

  for (const event of securityEvents) {
    await prisma.security_events.create({ data: event })
  }

  // Create comprehensive API keys for testing all endpoints
  console.log('🔑 Creating API keys with comprehensive permissions...')
  
  // Comprehensive API permissions for all v1 endpoints
  const apiPermissions = [
    "messages.send", "messages.read", "messages.bulk", "messages.history", 
    "messages.queue", "contacts.read", "contacts.create", "contacts.update",
    "contacts.delete", "instances.read", "instances.create", "instances.update", 
    "instances.delete", "subscription.read", "servers.read", "servers.create",
    "servers.update", "servers.delete", "analytics.read", "reports.generate",
    "billing.read", "vouchers.read", "vouchers.redeem", "api.access", "*"
  ]
  
  // Create demo API key with all permissions
  await prisma.apiKey.upsert({
    where: { key: 'sk_live_demo_test_key_12345678901234567890123456789012' },
    update: {
      permissions: JSON.stringify(apiPermissions),
      isActive: true,
      lastUsedAt: new Date()
    },
    create: {
      key: 'sk_live_demo_test_key_12345678901234567890123456789012',
      userId: customer.id.toString(),
      name: 'Demo API Key - Full Permissions',
      permissions: JSON.stringify(apiPermissions),
      isActive: true,
      neverExpires: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUsedAt: new Date()
    }
  })

  // Create customer-specific API key with all permissions  
  const customerApiKey = `sk_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
  await prisma.apiKey.upsert({
    where: { key: customerApiKey },
    update: {
      permissions: JSON.stringify(apiPermissions),
      isActive: true,
      lastUsedAt: new Date()
    },
    create: {
      key: customerApiKey,
      userId: customer.id.toString(),
      name: 'Customer API Key - Full Permissions',
      permissions: JSON.stringify(apiPermissions),
      isActive: true,
      neverExpires: false,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUsedAt: new Date()
    }
  })

  // Create admin API key with all permissions
  const adminApiKey = `sk_live_admin_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
  await prisma.apiKey.upsert({
    where: { key: adminApiKey },
    update: {
      permissions: JSON.stringify(apiPermissions),
      isActive: true,
      lastUsedAt: new Date()
    },
    create: {
      key: adminApiKey,
      userId: admin.id.toString(),
      name: 'Admin API Key - Full Permissions',
      permissions: JSON.stringify(apiPermissions),
      isActive: true,
      neverExpires: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUsedAt: new Date()
    }
  })

  // Skip WhatsApp instances - no server available
  console.log('⏭️  Skipping WhatsApp instances creation (no server configured)...')

  // Create sample package if it doesn't exist
  console.log('📦 Creating sample package data...')
  
  try {
    await prisma.package.upsert({
      where: { id: 'basic_plan_001' },
      update: {
        price: 1000,
        messageLimit: 1000,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        id: 'basic_plan_001',
        name: 'Basic Plan',
        description: 'Basic WhatsApp messaging plan for small businesses',
        price: 1000,
        duration: 30,
        messageLimit: 1000,
        instanceLimit: 5,
        mobile_accounts_limit: 1,
        contact_limit: 1000,
        api_key_limit: 1,
        receive_msg_limit: 1000,
        webhook_limit: 1,
        footmark_enabled: false,
        footmark_text: 'Sent by bizflash.in',
        package_color: 'blue',
        features: JSON.stringify({
          api_access: true,
          bulk_messaging: true,
          queue_management: true
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    console.log('✅ Sample package created successfully')
  } catch (packageError) {
    console.log('ℹ️ Skipping package creation:', packageError instanceof Error ? packageError.message : 'Unknown error')
  }

  console.log('✅ Database seeded successfully with user-based permissions!')
  console.log('')
  console.log('🔐 Demo Users Created - User-Based Permission System:')
  console.log('='.repeat(80))
  console.log('👤 User Permissions & Access Levels:')
  console.log('')
  console.log('👑 Owner: owner@demo.com / demo123')
  console.log(`   Role: OWNER | ${userPermissionAssignments['owner@demo.com'].length} permissions | Full system access`)
  console.log('')
  console.log('🔧 Admin: admin@demo.com / demo123') 
  console.log(`   Role: ADMIN | ${userPermissionAssignments['admin@demo.com'].length} permissions | Administrative access`)
  console.log('')
  console.log('🏪 SubDealer: subdealer@demo.com / demo123')
  console.log(`   Role: SUBDEALER | ${userPermissionAssignments['subdealer@demo.com'].length} permissions | Customer management`)
  console.log('')
  console.log('👨‍💼 Employee: employee@demo.com / demo123')
  console.log(`   Role: EMPLOYEE | ${userPermissionAssignments['employee@demo.com'].length} permissions | Support operations`)
  console.log('')
  console.log('👤 Customer: customer@demo.com / demo123')
  console.log(`   Role: CUSTOMER | ${userPermissionAssignments['customer@demo.com'].length} permissions | Self-service access`)
  console.log('')
  console.log('='.repeat(80))
  console.log('🔑 API Keys Created with Full Permissions:')
  console.log(`   📋 Demo Key: sk_live_demo_test_key_12345678901234567890123456789012`)
  console.log(`   👤 Customer Key: ${customerApiKey}`)
  console.log(`   🔧 Admin Key: ${adminApiKey}`)
  console.log(`   ✅ All keys include: ${apiPermissions.length} permissions including "*" (all access)`)
  console.log('')
  console.log('='.repeat(80))
  console.log('🔍 Security & Audit Features:')
  console.log(`   - ${systemPermissions.length} granular permissions created`)
  console.log(`   - ${auditEntries.length} audit log entries recorded`)
  console.log(`   - ${securityEvents.length} security events logged`)
  console.log(`   - User-based permission assignments (not role-based)`)
  console.log(`   - ${[...new Set(systemPermissions.map(p => p.category))].length} permission categories`)
  console.log(`   - 3 API keys with comprehensive permissions`)
  console.log('')
  console.log('🌐 Access the login page: http://127.0.0.1:3100/auth/signin')
  console.log('✨ Click any role badge to auto-fill credentials!')
  console.log('🚀 API Documentation: http://127.0.0.1:3100/customer/api-keys/docs')
  console.log('📊 Test all endpoints with the provided API keys!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })