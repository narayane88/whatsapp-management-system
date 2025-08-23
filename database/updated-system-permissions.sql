-- Updated System Permissions for WhatsApp Management System
-- Based on current project analysis

-- Clear existing permissions and start fresh
DELETE FROM user_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE is_system = true);
DELETE FROM role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE is_system = true);
DELETE FROM permissions WHERE is_system = true;

-- Insert comprehensive system permissions based on current project structure

-- ====================================
-- 1. USER MANAGEMENT
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('users.create', 'Create new users and accounts', 'User Management', 'users', 'create', true),
('users.read', 'View users list and profile details', 'User Management', 'users', 'read', true),
('users.update', 'Edit user information and profiles', 'User Management', 'users', 'update', true),
('users.delete', 'Delete user accounts', 'User Management', 'users', 'delete', true),
('users.manage', 'Full user account management', 'User Management', 'users', 'manage', true),
('users.impersonate', 'Login as another user', 'User Management', 'users', 'impersonate', true),
('users.export', 'Export user data', 'User Management', 'users', 'export', true),
('users.credit.manage', 'Manage user credits and balances', 'User Management', 'users', 'credit', true),
('users.avatar.upload', 'Upload and manage user avatars', 'User Management', 'users', 'avatar', true);

-- ====================================
-- 2. ROLE & PERMISSION MANAGEMENT
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('roles.create', 'Create new roles', 'Role Management', 'roles', 'create', true),
('roles.read', 'View roles and permissions', 'Role Management', 'roles', 'read', true),
('roles.update', 'Edit role information and permissions', 'Role Management', 'roles', 'update', true),
('roles.delete', 'Delete custom roles', 'Role Management', 'roles', 'delete', true),
('roles.assign', 'Assign roles to users', 'Role Management', 'roles', 'assign', true),
('roles.system.manage', 'Manage system roles', 'Role Management', 'roles', 'system', true),
('permissions.create', 'Create custom permissions', 'Permission Management', 'permissions', 'create', true),
('permissions.read', 'View permissions list', 'Permission Management', 'permissions', 'read', true),
('permissions.update', 'Edit permission details', 'Permission Management', 'permissions', 'update', true),
('permissions.delete', 'Delete custom permissions', 'Permission Management', 'permissions', 'delete', true),
('permissions.assign', 'Assign permissions to roles/users', 'Permission Management', 'permissions', 'assign', true),
('permissions.system.manage', 'Manage system permissions', 'Permission Management', 'permissions', 'system', true),
('permission.templates.manage', 'Manage permission templates', 'Permission Management', 'templates', 'manage', true);

-- ====================================
-- 3. WHATSAPP MANAGEMENT
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('whatsapp.instances.create', 'Create WhatsApp instances', 'WhatsApp Management', 'instances', 'create', true),
('whatsapp.instances.read', 'View WhatsApp instances', 'WhatsApp Management', 'instances', 'read', true),
('whatsapp.instances.update', 'Edit WhatsApp instances', 'WhatsApp Management', 'instances', 'update', true),
('whatsapp.instances.delete', 'Delete WhatsApp instances', 'WhatsApp Management', 'instances', 'delete', true),
('whatsapp.instances.manage', 'Full WhatsApp instance management', 'WhatsApp Management', 'instances', 'manage', true),
('whatsapp.messages.send', 'Send WhatsApp messages', 'WhatsApp Management', 'messages', 'send', true),
('whatsapp.messages.read', 'View WhatsApp messages', 'WhatsApp Management', 'messages', 'read', true),
('whatsapp.messages.manage', 'Full message management', 'WhatsApp Management', 'messages', 'manage', true),
('whatsapp.accounts.create', 'Connect new WhatsApp accounts', 'WhatsApp Management', 'accounts', 'create', true),
('whatsapp.accounts.read', 'View WhatsApp accounts', 'WhatsApp Management', 'accounts', 'read', true),
('whatsapp.accounts.update', 'Edit WhatsApp accounts', 'WhatsApp Management', 'accounts', 'update', true),
('whatsapp.accounts.delete', 'Disconnect WhatsApp accounts', 'WhatsApp Management', 'accounts', 'delete', true),
('whatsapp.servers.create', 'Add new WhatsApp servers', 'WhatsApp Management', 'servers', 'create', true),
('whatsapp.servers.read', 'View server information', 'WhatsApp Management', 'servers', 'read', true),
('whatsapp.servers.update', 'Edit server configurations', 'WhatsApp Management', 'servers', 'update', true),
('whatsapp.servers.delete', 'Remove servers', 'WhatsApp Management', 'servers', 'delete', true),
('whatsapp.servers.manage', 'Full server management', 'WhatsApp Management', 'servers', 'manage', true);

-- ====================================
-- 4. CUSTOMER MANAGEMENT
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('customers.create', 'Create new customers', 'Customer Management', 'customers', 'create', true),
('customers.read', 'View customer information', 'Customer Management', 'customers', 'read', true),
('customers.update', 'Edit customer details', 'Customer Management', 'customers', 'update', true),
('customers.delete', 'Delete customer accounts', 'Customer Management', 'customers', 'delete', true),
('customers.manage', 'Full customer management', 'Customer Management', 'customers', 'manage', true),
('customers.export', 'Export customer data', 'Customer Management', 'customers', 'export', true),
('customers.impersonate', 'Login as customer', 'Customer Management', 'customers', 'impersonate', true),
('dealers.create', 'Create dealer accounts', 'Customer Management', 'dealers', 'create', true),
('dealers.read', 'View dealer information', 'Customer Management', 'dealers', 'read', true),
('dealers.update', 'Edit dealer details', 'Customer Management', 'dealers', 'update', true),
('dealers.delete', 'Delete dealer accounts', 'Customer Management', 'dealers', 'delete', true),
('dealers.manage', 'Full dealer management', 'Customer Management', 'dealers', 'manage', true);

-- ====================================
-- 5. PACKAGE MANAGEMENT
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('packages.create', 'Create subscription packages', 'Package Management', 'packages', 'create', true),
('packages.read', 'View package information', 'Package Management', 'packages', 'read', true),
('packages.update', 'Edit package details and pricing', 'Package Management', 'packages', 'update', true),
('packages.delete', 'Delete packages', 'Package Management', 'packages', 'delete', true),
('packages.manage', 'Full package management', 'Package Management', 'packages', 'manage', true),
('subscriptions.create', 'Create user subscriptions', 'Package Management', 'subscriptions', 'create', true),
('subscriptions.read', 'View subscription details', 'Package Management', 'subscriptions', 'read', true),
('subscriptions.update', 'Modify subscriptions', 'Package Management', 'subscriptions', 'update', true),
('subscriptions.delete', 'Cancel subscriptions', 'Package Management', 'subscriptions', 'delete', true),
('subscriptions.manage', 'Full subscription management', 'Package Management', 'subscriptions', 'manage', true);

-- ====================================
-- 6. FINANCIAL MANAGEMENT
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('finance.transactions.read', 'View transaction history', 'Financial Management', 'transactions', 'read', true),
('finance.transactions.create', 'Create manual transactions', 'Financial Management', 'transactions', 'create', true),
('finance.transactions.update', 'Edit transaction details', 'Financial Management', 'transactions', 'update', true),
('finance.transactions.delete', 'Delete transactions', 'Financial Management', 'transactions', 'delete', true),
('finance.transactions.manage', 'Full transaction management', 'Financial Management', 'transactions', 'manage', true),
('finance.bizpoints.read', 'View BizPoints information', 'Financial Management', 'bizpoints', 'read', true),
('finance.bizpoints.create', 'Add BizPoints to accounts', 'Financial Management', 'bizpoints', 'create', true),
('finance.bizpoints.update', 'Modify BizPoints balances', 'Financial Management', 'bizpoints', 'update', true),
('finance.bizpoints.delete', 'Remove BizPoints', 'Financial Management', 'bizpoints', 'delete', true),
('finance.bizpoints.manage', 'Full BizPoints management', 'Financial Management', 'bizpoints', 'manage', true),
('finance.bizpoints.commission', 'Manage commission settings', 'Financial Management', 'bizpoints', 'commission', true),
('finance.payouts.read', 'View payout information', 'Financial Management', 'payouts', 'read', true),
('finance.payouts.create', 'Process payouts', 'Financial Management', 'payouts', 'create', true),
('finance.payouts.update', 'Edit payout details', 'Financial Management', 'payouts', 'update', true),
('finance.payouts.manage', 'Full payout management', 'Financial Management', 'payouts', 'manage', true),
('finance.reports.read', 'View financial reports', 'Financial Management', 'reports', 'read', true),
('finance.reports.export', 'Export financial data', 'Financial Management', 'reports', 'export', true);

-- ====================================
-- 7. VOUCHER MANAGEMENT
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('vouchers.create', 'Create discount vouchers', 'Voucher Management', 'vouchers', 'create', true),
('vouchers.read', 'View voucher information', 'Voucher Management', 'vouchers', 'read', true),
('vouchers.update', 'Edit voucher details', 'Voucher Management', 'vouchers', 'update', true),
('vouchers.delete', 'Delete vouchers', 'Voucher Management', 'vouchers', 'delete', true),
('vouchers.manage', 'Full voucher management', 'Voucher Management', 'vouchers', 'manage', true),
('vouchers.redeem', 'Redeem vouchers for customers', 'Voucher Management', 'vouchers', 'redeem', true),
('vouchers.validate', 'Validate voucher codes', 'Voucher Management', 'vouchers', 'validate', true);

-- ====================================
-- 8. SYSTEM ADMINISTRATION
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('system.settings.read', 'View system settings', 'System Administration', 'settings', 'read', true),
('system.settings.update', 'Modify system settings', 'System Administration', 'settings', 'update', true),
('system.settings.manage', 'Full system settings management', 'System Administration', 'settings', 'manage', true),
('system.logs.read', 'View system logs', 'System Administration', 'logs', 'read', true),
('system.logs.delete', 'Clear system logs', 'System Administration', 'logs', 'delete', true),
('system.health.read', 'View system health status', 'System Administration', 'health', 'read', true),
('system.backup.create', 'Create system backups', 'System Administration', 'backup', 'create', true),
('system.backup.restore', 'Restore from backups', 'System Administration', 'backup', 'restore', true),
('system.maintenance.manage', 'Manage system maintenance', 'System Administration', 'maintenance', 'manage', true);

-- ====================================
-- 9. SECURITY MANAGEMENT
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('security.settings.read', 'View security settings', 'Security Management', 'security', 'read', true),
('security.settings.update', 'Modify security policies', 'Security Management', 'security', 'update', true),
('security.events.read', 'View security event logs', 'Security Management', 'events', 'read', true),
('security.events.manage', 'Manage security events', 'Security Management', 'events', 'manage', true),
('security.sessions.read', 'View user sessions', 'Security Management', 'sessions', 'read', true),
('security.sessions.terminate', 'Terminate user sessions', 'Security Management', 'sessions', 'terminate', true),
('security.ip.restrictions.read', 'View IP restrictions', 'Security Management', 'restrictions', 'read', true),
('security.ip.restrictions.manage', 'Manage IP restrictions', 'Security Management', 'restrictions', 'manage', true),
('security.audit.read', 'View audit logs', 'Security Management', 'audit', 'read', true),
('security.audit.export', 'Export audit data', 'Security Management', 'audit', 'export', true);

-- ====================================
-- 10. API & DOCUMENTATION
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('api.docs.read', 'View API documentation', 'API Management', 'documentation', 'read', true),
('api.docs.update', 'Update API documentation', 'API Management', 'documentation', 'update', true),
('api.keys.create', 'Create API keys', 'API Management', 'keys', 'create', true),
('api.keys.read', 'View API keys', 'API Management', 'keys', 'read', true),
('api.keys.update', 'Edit API keys', 'API Management', 'keys', 'update', true),
('api.keys.delete', 'Delete API keys', 'API Management', 'keys', 'delete', true),
('api.usage.read', 'View API usage statistics', 'API Management', 'usage', 'read', true),
('api.rate.limits.manage', 'Manage API rate limits', 'API Management', 'limits', 'manage', true);

-- ====================================
-- 11. COMPANY PROFILE & BRANDING
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('company.profile.read', 'View company profile', 'Company Management', 'profile', 'read', true),
('company.profile.update', 'Edit company profile', 'Company Management', 'profile', 'update', true),
('company.branding.update', 'Update company branding', 'Company Management', 'branding', 'update', true),
('company.themes.read', 'View available themes', 'Company Management', 'themes', 'read', true),
('company.themes.update', 'Change system themes', 'Company Management', 'themes', 'update', true),
('company.languages.read', 'View language settings', 'Company Management', 'languages', 'read', true),
('company.languages.update', 'Update language settings', 'Company Management', 'languages', 'update', true);

-- ====================================
-- 12. DASHBOARD & ANALYTICS
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('dashboard.admin.read', 'View admin dashboard', 'Dashboard Access', 'admin', 'read', true),
('dashboard.analytics.read', 'View analytics dashboard', 'Dashboard Access', 'analytics', 'read', true),
('dashboard.reports.read', 'View dashboard reports', 'Dashboard Access', 'reports', 'read', true),
('dashboard.widgets.manage', 'Customize dashboard widgets', 'Dashboard Access', 'widgets', 'manage', true),
('analytics.users.read', 'View user analytics', 'Analytics', 'users', 'read', true),
('analytics.messages.read', 'View message analytics', 'Analytics', 'messages', 'read', true),
('analytics.financial.read', 'View financial analytics', 'Analytics', 'financial', 'read', true),
('analytics.performance.read', 'View performance metrics', 'Analytics', 'performance', 'read', true);

-- ====================================
-- ASSIGN PERMISSIONS TO SYSTEM ROLES
-- ====================================

-- OWNER Role - All permissions
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'OWNER' AND p.is_system = true;

-- ADMIN Role - Most permissions except critical system functions
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'ADMIN' AND p.is_system = true
AND p.name NOT IN (
    'users.impersonate',
    'customers.impersonate', 
    'system.backup.restore',
    'permissions.system.manage',
    'roles.system.manage',
    'security.sessions.terminate',
    'system.maintenance.manage'
);

-- SUBDEALER Role - Customer and WhatsApp management
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'SUBDEALER' AND p.is_system = true
AND p.name IN (
    -- User Management
    'users.create', 'users.read', 'users.update', 'users.credit.manage',
    -- Customer Management
    'customers.create', 'customers.read', 'customers.update', 'customers.manage',
    'dealers.read', 'dealers.update',
    -- WhatsApp Management
    'whatsapp.instances.create', 'whatsapp.instances.read', 'whatsapp.instances.update', 'whatsapp.instances.manage',
    'whatsapp.messages.send', 'whatsapp.messages.read', 'whatsapp.messages.manage',
    'whatsapp.accounts.create', 'whatsapp.accounts.read', 'whatsapp.accounts.update',
    'whatsapp.servers.read',
    -- Package Management
    'packages.read', 'subscriptions.read', 'subscriptions.create', 'subscriptions.update',
    -- Financial (limited)
    'finance.transactions.read', 'finance.bizpoints.read', 'finance.payouts.read',
    -- Voucher Management
    'vouchers.read', 'vouchers.redeem', 'vouchers.validate',
    -- Dashboard Access
    'dashboard.admin.read', 'dashboard.analytics.read', 'dashboard.reports.read',
    'analytics.users.read', 'analytics.messages.read'
);

-- EMPLOYEE Role - Basic operations
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'EMPLOYEE' AND p.is_system = true
AND p.name IN (
    -- User Management (limited)
    'users.read', 'customers.read',
    -- WhatsApp Management (basic)
    'whatsapp.instances.read', 'whatsapp.messages.send', 'whatsapp.messages.read',
    'whatsapp.accounts.read', 'whatsapp.servers.read',
    -- Package Management (view only)
    'packages.read', 'subscriptions.read',
    -- Financial (view only)
    'finance.transactions.read', 'finance.bizpoints.read',
    -- Voucher Management (basic)
    'vouchers.read', 'vouchers.redeem', 'vouchers.validate',
    -- Dashboard Access (limited)
    'dashboard.analytics.read', 'analytics.messages.read'
);

-- CUSTOMER Role - Self-service only
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'CUSTOMER' AND p.is_system = true
AND p.name IN (
    -- WhatsApp (own instances only)
    'whatsapp.instances.read', 'whatsapp.messages.send', 'whatsapp.messages.read',
    -- Package Information
    'packages.read', 'subscriptions.read',
    -- Own Financial Data
    'finance.transactions.read', 'finance.bizpoints.read',
    -- Voucher Redemption
    'vouchers.redeem', 'vouchers.validate',
    -- Company Information
    'company.profile.read'
);

-- Update timestamps
UPDATE roles SET updated_at = CURRENT_TIMESTAMP WHERE name IN ('OWNER', 'ADMIN', 'SUBDEALER', 'EMPLOYEE', 'CUSTOMER');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_system ON permissions(is_system);
CREATE INDEX IF NOT EXISTS idx_role_permissions_granted ON role_permissions(granted);

-- Show summary of permissions created
SELECT 
    category,
    COUNT(*) as permission_count
FROM permissions 
WHERE is_system = true 
GROUP BY category 
ORDER BY permission_count DESC;