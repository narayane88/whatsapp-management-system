-- Enhanced Page and Menu Access Permissions
-- This adds specific permissions for each admin page and menu item

-- ====================================
-- PAGE ACCESS PERMISSIONS
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
-- Dashboard Access
('dashboard.admin.access', 'Access admin dashboard page', 'Page Access', 'dashboard', 'access', true),

-- Customer Management Pages
('customers.page.access', 'Access customers management page', 'Page Access', 'customers', 'access', true),
('customers.details.view', 'View customer detail pages', 'Page Access', 'customers', 'details', true),

-- Package Management Pages  
('packages.page.access', 'Access packages management page', 'Page Access', 'packages', 'access', true),
('packages.create.page', 'Access package creation page', 'Page Access', 'packages', 'create_page', true),
('packages.edit.page', 'Access package edit pages', 'Page Access', 'packages', 'edit_page', true),

-- Voucher Management Pages
('vouchers.page.access', 'Access vouchers management page', 'Page Access', 'vouchers', 'access', true),
('vouchers.create.page', 'Access voucher creation page', 'Page Access', 'vouchers', 'create_page', true),

-- Transaction Pages
('transactions.page.access', 'Access transactions page', 'Page Access', 'transactions', 'access', true),
('transactions.details.view', 'View transaction detail pages', 'Page Access', 'transactions', 'details', true),
('transactions.reports.access', 'Access transaction reports', 'Page Access', 'transactions', 'reports', true),

-- Subscription Pages
('subscriptions.page.access', 'Access subscriptions management page', 'Page Access', 'subscriptions', 'access', true),
('subscriptions.create.page', 'Access subscription creation page', 'Page Access', 'subscriptions', 'create_page', true),

-- BizCoins Pages
('bizpoints.page.access', 'Access BizCoins management page', 'Page Access', 'bizpoints', 'access', true),
('bizpoints.transfer.page', 'Access BizCoins transfer page', 'Page Access', 'bizpoints', 'transfer_page', true),
('bizpoints.commission.page', 'Access commission settings page', 'Page Access', 'bizpoints', 'commission_page', true),

-- User Management Pages
('users.page.access', 'Access users management page', 'Page Access', 'users', 'access', true),
('users.create.page', 'Access user creation page', 'Page Access', 'users', 'create_page', true),
('users.edit.page', 'Access user edit pages', 'Page Access', 'users', 'edit_page', true),
('users.roles.page', 'Access user roles management', 'Page Access', 'users', 'roles_page', true),

-- Server Management Pages
('servers.page.access', 'Access WhatsApp servers page', 'Page Access', 'servers', 'access', true),
('servers.config.page', 'Access server configuration pages', 'Page Access', 'servers', 'config_page', true),

-- API Documentation Pages
('api.docs.page.access', 'Access API documentation page', 'Page Access', 'api_docs', 'access', true),

-- Languages Pages
('languages.page.access', 'Access languages settings page', 'Page Access', 'languages', 'access', true),

-- Settings Pages
('settings.page.access', 'Access system settings page', 'Page Access', 'settings', 'access', true),
('settings.security.access', 'Access security settings tab', 'Page Access', 'settings', 'security', true),
('settings.company.access', 'Access company settings tab', 'Page Access', 'settings', 'company', true),
('settings.themes.access', 'Access themes settings tab', 'Page Access', 'settings', 'themes', true)
ON CONFLICT (name) DO NOTHING;

-- ====================================
-- MENU VISIBILITY PERMISSIONS
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
-- Menu Item Visibility
('menu.dashboard.view', 'Show dashboard in navigation menu', 'Menu Visibility', 'menu', 'dashboard', true),
('menu.customers.view', 'Show customers in navigation menu', 'Menu Visibility', 'menu', 'customers', true),
('menu.packages.view', 'Show packages in navigation menu', 'Menu Visibility', 'menu', 'packages', true),
('menu.vouchers.view', 'Show vouchers in navigation menu', 'Menu Visibility', 'menu', 'vouchers', true),
('menu.transactions.view', 'Show transactions in navigation menu', 'Menu Visibility', 'menu', 'transactions', true),
('menu.subscriptions.view', 'Show subscriptions in navigation menu', 'Menu Visibility', 'menu', 'subscriptions', true),
('menu.bizpoints.view', 'Show BizCoins in navigation menu', 'Menu Visibility', 'menu', 'bizpoints', true),
('menu.users.view', 'Show users in navigation menu', 'Menu Visibility', 'menu', 'users', true),
('menu.servers.view', 'Show servers in navigation menu', 'Menu Visibility', 'menu', 'servers', true),
('menu.api_docs.view', 'Show API docs in navigation menu', 'Menu Visibility', 'menu', 'api_docs', true),
('menu.languages.view', 'Show languages in navigation menu', 'Menu Visibility', 'menu', 'languages', true),
('menu.settings.view', 'Show settings in navigation menu', 'Menu Visibility', 'menu', 'settings', true)
ON CONFLICT (name) DO NOTHING;

-- ====================================
-- SPECIFIC FEATURE PERMISSIONS
-- ====================================
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
-- Subscription Management
('subscriptions.assign', 'Assign subscriptions to users', 'Subscription Management', 'subscriptions', 'assign', true),
('subscriptions.cancel', 'Cancel user subscriptions', 'Subscription Management', 'subscriptions', 'cancel', true),
('subscriptions.renew', 'Renew user subscriptions', 'Subscription Management', 'subscriptions', 'renew', true),
('subscriptions.pricing.manage', 'Manage subscription pricing', 'Subscription Management', 'subscriptions', 'pricing', true),

-- BizCoins Management
('bizpoints.transfer', 'Transfer BizCoins between accounts', 'BizCoins Management', 'bizpoints', 'transfer', true),
('bizpoints.withdraw', 'Process BizCoins withdrawals', 'BizCoins Management', 'bizpoints', 'withdraw', true),
('bizpoints.history.view', 'View BizCoins transaction history', 'BizCoins Management', 'bizpoints', 'history', true),
('bizpoints.rates.manage', 'Manage BizCoins exchange rates', 'BizCoins Management', 'bizpoints', 'rates', true),

-- Enhanced Transaction Permissions
('transactions.approve', 'Approve pending transactions', 'Transaction Management', 'transactions', 'approve', true),
('transactions.reject', 'Reject pending transactions', 'Transaction Management', 'transactions', 'reject', true),
('transactions.refund', 'Process transaction refunds', 'Transaction Management', 'transactions', 'refund', true),
('transactions.bulk.process', 'Process bulk transactions', 'Transaction Management', 'transactions', 'bulk', true),

-- ====================================
-- ACTION BUTTON ACCESS PERMISSIONS
-- ====================================

-- Customer Management Actions
('customers.create.button', 'Show create customer button', 'Action Buttons', 'customers', 'create_button', true),
('customers.edit.button', 'Show edit customer button', 'Action Buttons', 'customers', 'edit_button', true),
('customers.delete.button', 'Show delete customer button', 'Action Buttons', 'customers', 'delete_button', true),
('customers.view.button', 'Show view customer details button', 'Action Buttons', 'customers', 'view_button', true),
('customers.suspend.button', 'Show suspend customer button', 'Action Buttons', 'customers', 'suspend_button', true),
('customers.activate.button', 'Show activate customer button', 'Action Buttons', 'customers', 'activate_button', true),
('customers.export.button', 'Show export customers button', 'Action Buttons', 'customers', 'export_button', true),
('customers.import.button', 'Show import customers button', 'Action Buttons', 'customers', 'import_button', true),

-- Package Management Actions
('packages.create.button', 'Show create package button', 'Action Buttons', 'packages', 'create_button', true),
('packages.edit.button', 'Show edit package button', 'Action Buttons', 'packages', 'edit_button', true),
('packages.delete.button', 'Show delete package button', 'Action Buttons', 'packages', 'delete_button', true),
('packages.duplicate.button', 'Show duplicate package button', 'Action Buttons', 'packages', 'duplicate_button', true),
('packages.activate.button', 'Show activate package button', 'Action Buttons', 'packages', 'activate_button', true),
('packages.deactivate.button', 'Show deactivate package button', 'Action Buttons', 'packages', 'deactivate_button', true),
('packages.pricing.button', 'Show manage pricing button', 'Action Buttons', 'packages', 'pricing_button', true),

-- Voucher Management Actions
('vouchers.create.button', 'Show create voucher button', 'Action Buttons', 'vouchers', 'create_button', true),
('vouchers.edit.button', 'Show edit voucher button', 'Action Buttons', 'vouchers', 'edit_button', true),
('vouchers.delete.button', 'Show delete voucher button', 'Action Buttons', 'vouchers', 'delete_button', true),
('vouchers.activate.button', 'Show activate voucher button', 'Action Buttons', 'vouchers', 'activate_button', true),
('vouchers.deactivate.button', 'Show deactivate voucher button', 'Action Buttons', 'vouchers', 'deactivate_button', true),
('vouchers.generate.button', 'Show generate voucher codes button', 'Action Buttons', 'vouchers', 'generate_button', true),
('vouchers.bulk.button', 'Show bulk voucher operations button', 'Action Buttons', 'vouchers', 'bulk_button', true),

-- Transaction Management Actions
('transactions.view.button', 'Show view transaction details button', 'Action Buttons', 'transactions', 'view_button', true),
('transactions.approve.button', 'Show approve transaction button', 'Action Buttons', 'transactions', 'approve_button', true),
('transactions.reject.button', 'Show reject transaction button', 'Action Buttons', 'transactions', 'reject_button', true),
('transactions.refund.button', 'Show refund transaction button', 'Action Buttons', 'transactions', 'refund_button', true),
('transactions.export.button', 'Show export transactions button', 'Action Buttons', 'transactions', 'export_button', true),
('transactions.filter.button', 'Show advanced filter button', 'Action Buttons', 'transactions', 'filter_button', true),
('transactions.bulk.button', 'Show bulk transaction operations button', 'Action Buttons', 'transactions', 'bulk_button', true),

-- Subscription Management Actions
('subscriptions.create.button', 'Show create subscription button', 'Action Buttons', 'subscriptions', 'create_button', true),
('subscriptions.edit.button', 'Show edit subscription button', 'Action Buttons', 'subscriptions', 'edit_button', true),
('subscriptions.cancel.button', 'Show cancel subscription button', 'Action Buttons', 'subscriptions', 'cancel_button', true),
('subscriptions.renew.button', 'Show renew subscription button', 'Action Buttons', 'subscriptions', 'renew_button', true),
('subscriptions.suspend.button', 'Show suspend subscription button', 'Action Buttons', 'subscriptions', 'suspend_button', true),
('subscriptions.upgrade.button', 'Show upgrade subscription button', 'Action Buttons', 'subscriptions', 'upgrade_button', true),
('subscriptions.downgrade.button', 'Show downgrade subscription button', 'Action Buttons', 'subscriptions', 'downgrade_button', true),

-- BizCoins Management Actions
('bizpoints.transfer.button', 'Show transfer BizCoins button', 'Action Buttons', 'bizpoints', 'transfer_button', true),
('bizpoints.add.button', 'Show add BizCoins button', 'Action Buttons', 'bizpoints', 'add_button', true),
('bizpoints.deduct.button', 'Show deduct BizCoins button', 'Action Buttons', 'bizpoints', 'deduct_button', true),
('bizpoints.withdraw.button', 'Show withdraw request button', 'Action Buttons', 'bizpoints', 'withdraw_button', true),
('bizpoints.history.button', 'Show transaction history button', 'Action Buttons', 'bizpoints', 'history_button', true),
('bizpoints.rates.button', 'Show manage rates button', 'Action Buttons', 'bizpoints', 'rates_button', true),
('bizpoints.commission.button', 'Show commission settings button', 'Action Buttons', 'bizpoints', 'commission_button', true),

-- User Management Actions
('users.create.button', 'Show create user button', 'Action Buttons', 'users', 'create_button', true),
('users.edit.button', 'Show edit user button', 'Action Buttons', 'users', 'edit_button', true),
('users.delete.button', 'Show delete user button', 'Action Buttons', 'users', 'delete_button', true),
('users.activate.button', 'Show activate user button', 'Action Buttons', 'users', 'activate_button', true),
('users.deactivate.button', 'Show deactivate user button', 'Action Buttons', 'users', 'deactivate_button', true),
('users.roles.button', 'Show manage roles button', 'Action Buttons', 'users', 'roles_button', true),
('users.permissions.button', 'Show manage permissions button', 'Action Buttons', 'users', 'permissions_button', true),
('users.credit.button', 'Show credit balance button', 'Action Buttons', 'users', 'credit_button', true),
('users.password.button', 'Show reset password button', 'Action Buttons', 'users', 'password_button', true),

-- Server Management Actions
('servers.create.button', 'Show add server button', 'Action Buttons', 'servers', 'create_button', true),
('servers.edit.button', 'Show edit server button', 'Action Buttons', 'servers', 'edit_button', true),
('servers.delete.button', 'Show delete server button', 'Action Buttons', 'servers', 'delete_button', true),
('servers.start.button', 'Show start server button', 'Action Buttons', 'servers', 'start_button', true),
('servers.stop.button', 'Show stop server button', 'Action Buttons', 'servers', 'stop_button', true),
('servers.restart.button', 'Show restart server button', 'Action Buttons', 'servers', 'restart_button', true),
('servers.config.button', 'Show configure server button', 'Action Buttons', 'servers', 'config_button', true),
('servers.logs.button', 'Show view logs button', 'Action Buttons', 'servers', 'logs_button', true),

-- Settings Actions
('settings.save.button', 'Show save settings button', 'Action Buttons', 'settings', 'save_button', true),
('settings.reset.button', 'Show reset settings button', 'Action Buttons', 'settings', 'reset_button', true),
('settings.backup.button', 'Show backup settings button', 'Action Buttons', 'settings', 'backup_button', true),
('settings.restore.button', 'Show restore settings button', 'Action Buttons', 'settings', 'restore_button', true),
('settings.export.button', 'Show export configuration button', 'Action Buttons', 'settings', 'export_button', true),
('settings.import.button', 'Show import configuration button', 'Action Buttons', 'settings', 'import_button', true)
ON CONFLICT (name) DO NOTHING;

-- ====================================
-- UPDATE ROLE ASSIGNMENTS
-- ====================================

-- OWNER - Full access to all pages, menus, and action buttons
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'OWNER' 
AND (p.name LIKE '%.page.access'
     OR p.name LIKE 'menu.%.view'
     OR p.name LIKE '%.button'
     OR p.name IN ('subscriptions.assign', 'subscriptions.cancel', 'subscriptions.renew', 'subscriptions.pricing.manage',
                   'bizpoints.transfer', 'bizpoints.withdraw', 'bizpoints.history.view', 'bizpoints.rates.manage',
                   'transactions.approve', 'transactions.reject', 'transactions.refund', 'transactions.bulk.process'))
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 
    WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- ADMIN - Most pages, menus, and action buttons except critical system functions
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'ADMIN' 
AND (p.name LIKE '%.page.access' OR p.name LIKE 'menu.%.view' OR p.name LIKE '%.button')
AND p.name NOT IN ('settings.security.access', 'users.roles.page', 'users.delete.button', 'users.permissions.button',
                   'settings.reset.button', 'settings.restore.button', 'servers.delete.button')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 
    WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- ADMIN - Selected advanced features
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'ADMIN' 
AND p.name IN ('subscriptions.assign', 'subscriptions.cancel', 'subscriptions.renew',
              'bizpoints.transfer', 'bizpoints.history.view',
              'transactions.approve', 'transactions.reject', 'transactions.refund')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 
    WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- SUBDEALER - Customer and business focused (with selective action buttons)
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'SUBDEALER' 
AND p.name IN (
    -- Page Access
    'dashboard.admin.access',
    'customers.page.access', 'customers.details.view',
    'packages.page.access', 
    'subscriptions.page.access', 'subscriptions.create.page',
    'vouchers.page.access',
    'transactions.page.access', 'transactions.details.view',
    'servers.page.access',
    'bizpoints.page.access',
    -- Menu Visibility
    'menu.dashboard.view', 'menu.customers.view', 'menu.packages.view',
    'menu.subscriptions.view', 'menu.vouchers.view', 'menu.transactions.view',
    'menu.servers.view', 'menu.bizpoints.view',
    -- Action Buttons (limited)
    'customers.create.button', 'customers.edit.button', 'customers.view.button', 'customers.suspend.button', 'customers.activate.button',
    'packages.create.button', 'packages.edit.button', 'packages.activate.button', 'packages.deactivate.button',
    'subscriptions.create.button', 'subscriptions.edit.button', 'subscriptions.cancel.button', 'subscriptions.renew.button', 'subscriptions.upgrade.button',
    'vouchers.create.button', 'vouchers.edit.button', 'vouchers.activate.button', 'vouchers.generate.button',
    'transactions.view.button', 'transactions.export.button', 'transactions.filter.button',
    'bizpoints.transfer.button', 'bizpoints.add.button', 'bizpoints.history.button',
    'servers.config.button', 'servers.logs.button',
    -- Features
    'subscriptions.assign', 'subscriptions.cancel', 'subscriptions.renew',
    'bizpoints.transfer', 'bizpoints.history.view',
    'vouchers.redeem'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 
    WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- EMPLOYEE - Basic read-only operations with minimal action buttons
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'EMPLOYEE' 
AND p.name IN (
    -- Page Access (limited)
    'dashboard.admin.access',
    'customers.page.access', 'customers.details.view',
    'packages.page.access',
    'transactions.page.access', 'transactions.details.view',
    'servers.page.access',
    -- Menu Visibility (limited)
    'menu.dashboard.view', 'menu.customers.view', 'menu.packages.view',
    'menu.transactions.view', 'menu.servers.view',
    -- Action Buttons (very limited - mainly view/read operations)
    'customers.view.button', 'customers.export.button',
    'packages.create.button', 'packages.edit.button',
    'transactions.view.button', 'transactions.export.button', 'transactions.filter.button',
    'servers.logs.button',
    -- Features (basic)
    'vouchers.redeem'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 
    WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- CUSTOMER - Minimal self-service access with very limited action buttons
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'CUSTOMER' 
AND p.name IN (
    -- Page Access (very limited)
    'dashboard.admin.access',
    'packages.page.access',
    'transactions.page.access',
    -- Menu Visibility (minimal)
    'menu.dashboard.view', 'menu.packages.view', 'menu.transactions.view',
    -- Action Buttons (self-service only)
    'transactions.view.button', 'transactions.export.button',
    -- Features (self-service only)
    'vouchers.redeem'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp2 
    WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
);

-- Create performance indexes for fast permission lookups
CREATE INDEX IF NOT EXISTS idx_permissions_page_access ON permissions(name) WHERE name LIKE '%.page.access';
CREATE INDEX IF NOT EXISTS idx_permissions_menu_view ON permissions(name) WHERE name LIKE 'menu.%.view';
CREATE INDEX IF NOT EXISTS idx_permissions_button ON permissions(name) WHERE name LIKE '%.button';
CREATE INDEX IF NOT EXISTS idx_permissions_system ON permissions(is_system) WHERE is_system = true;

-- Show detailed permission summary with action buttons
SELECT 
    r.name as role_name,
    r.level,
    COUNT(CASE WHEN p.name LIKE '%.page.access' THEN 1 END) as page_permissions,
    COUNT(CASE WHEN p.name LIKE 'menu.%.view' THEN 1 END) as menu_permissions,
    COUNT(CASE WHEN p.name LIKE '%.button' THEN 1 END) as action_buttons,
    COUNT(CASE WHEN p.name NOT LIKE '%.page.access' AND p.name NOT LIKE 'menu.%.view' AND p.name NOT LIKE '%.button' THEN 1 END) as feature_permissions,
    COUNT(*) as total_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.granted = true
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_system = true
WHERE r.is_system = true
GROUP BY r.id, r.name, r.level
ORDER BY r.level;