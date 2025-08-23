-- Fresh Database Seeding Script for WhatsApp Management System
-- This script provides complete setup for a new database instance

-- ==============================================
-- CLEAN START (Use with caution!)
-- ==============================================
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permission_templates CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
-- Note: users table kept intact to preserve existing user data

-- ==============================================
-- CREATE TABLES
-- ==============================================

-- Roles Table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions Table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    is_system BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission Junction Table
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true,
    UNIQUE(role_id, permission_id)
);

-- User-Role Junction Table
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Direct User Permissions (Override role permissions)
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true,
    reason TEXT,
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(user_id, permission_id)
);

-- Permission Templates
CREATE TABLE permission_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions INTEGER[] NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_system BOOLEAN DEFAULT false
);

-- ==============================================
-- SEED SYSTEM ROLES
-- ==============================================
INSERT INTO roles (name, description, level, is_system) VALUES
('OWNER', 'System owner with full access to everything', 1, true),
('ADMIN', 'Administrator with management capabilities', 2, true),
('MANAGER', 'Manager with team and operational oversight', 3, true),
('SUBDEALER', 'Sub-dealer with limited business operations', 4, true),
('EMPLOYEE', 'Employee with operational access', 5, true),
('CUSTOMER', 'Customer with basic access', 6, true);

-- ==============================================
-- SEED COMPREHENSIVE PERMISSIONS
-- ==============================================

-- User Management Permissions
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('users.create', 'Create new users in the system', 'User Management', 'users', 'create', true),
('users.read', 'View users list and basic details', 'User Management', 'users', 'read', true),
('users.update', 'Edit user information and settings', 'User Management', 'users', 'update', true),
('users.delete', 'Delete users from the system', 'User Management', 'users', 'delete', true),
('users.manage', 'Full user management access', 'User Management', 'users', 'manage', true),
('users.impersonate', 'Login as another user for support', 'User Management', 'users', 'impersonate', true),
('users.export', 'Export user data and reports', 'User Management', 'users', 'export', true),
('users.import', 'Import users from external sources', 'User Management', 'users', 'import', true);

-- Role Management Permissions
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('roles.create', 'Create new roles and define permissions', 'Role Management', 'roles', 'create', true),
('roles.read', 'View roles list and permissions', 'Role Management', 'roles', 'read', true),
('roles.update', 'Edit role information and permissions', 'Role Management', 'roles', 'update', true),
('roles.delete', 'Delete non-system roles', 'Role Management', 'roles', 'delete', true),
('roles.assign', 'Assign roles to users', 'Role Management', 'roles', 'assign', true),
('roles.manage', 'Full role management access', 'Role Management', 'roles', 'manage', true);

-- Permission Management Permissions
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('permissions.create', 'Create new custom permissions', 'Permission Management', 'permissions', 'create', true),
('permissions.read', 'View permissions list and details', 'Permission Management', 'permissions', 'read', true),
('permissions.update', 'Edit permission information', 'Permission Management', 'permissions', 'update', true),
('permissions.delete', 'Delete custom permissions', 'Permission Management', 'permissions', 'delete', true),
('permissions.assign', 'Assign permissions to roles and users', 'Permission Management', 'permissions', 'assign', true),
('permissions.view', 'View permission management interface', 'Permission Management', 'permissions', 'view', true),
('permissions.edit', 'Edit permissions in permission manager', 'Permission Management', 'permissions', 'edit', true),
('permissions.system.manage', 'Manage system-level permissions', 'Permission Management', 'permissions', 'system.manage', true);

-- WhatsApp Instance Management
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('whatsapp.instances.create', 'Create new WhatsApp instances', 'WhatsApp', 'whatsapp.instances', 'create', true),
('whatsapp.instances.read', 'View WhatsApp instances and status', 'WhatsApp', 'whatsapp.instances', 'read', true),
('whatsapp.instances.update', 'Modify WhatsApp instance settings', 'WhatsApp', 'whatsapp.instances', 'update', true),
('whatsapp.instances.delete', 'Delete WhatsApp instances', 'WhatsApp', 'whatsapp.instances', 'delete', true),
('whatsapp.instances.manage', 'Full WhatsApp instance management', 'WhatsApp', 'whatsapp.instances', 'manage', true),
('whatsapp.instances.connect', 'Connect/disconnect WhatsApp instances', 'WhatsApp', 'whatsapp.instances', 'connect', true),
('whatsapp.instances.restart', 'Restart WhatsApp instances', 'WhatsApp', 'whatsapp.instances', 'restart', true);

-- WhatsApp Messaging
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('whatsapp.messages.send', 'Send WhatsApp messages', 'WhatsApp', 'whatsapp.messages', 'send', true),
('whatsapp.messages.read', 'View WhatsApp messages and chats', 'WhatsApp', 'whatsapp.messages', 'read', true),
('whatsapp.messages.delete', 'Delete WhatsApp messages', 'WhatsApp', 'whatsapp.messages', 'delete', true),
('whatsapp.messages.bulk', 'Send bulk WhatsApp messages', 'WhatsApp', 'whatsapp.messages', 'bulk', true),
('whatsapp.messages.schedule', 'Schedule WhatsApp messages', 'WhatsApp', 'whatsapp.messages', 'schedule', true),
('whatsapp.messages.template', 'Use WhatsApp message templates', 'WhatsApp', 'whatsapp.messages', 'template', true);

-- Contact Management
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('contacts.create', 'Add new contacts', 'Contact Management', 'contacts', 'create', true),
('contacts.read', 'View contacts list and details', 'Contact Management', 'contacts', 'read', true),
('contacts.update', 'Edit contact information', 'Contact Management', 'contacts', 'update', true),
('contacts.delete', 'Delete contacts', 'Contact Management', 'contacts', 'delete', true),
('contacts.import', 'Import contacts from files', 'Contact Management', 'contacts', 'import', true),
('contacts.export', 'Export contacts to files', 'Contact Management', 'contacts', 'export', true),
('contacts.manage', 'Full contact management access', 'Contact Management', 'contacts', 'manage', true);

-- Package Management
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('packages.create', 'Create new service packages', 'Package Management', 'packages', 'create', true),
('packages.read', 'View available packages and pricing', 'Package Management', 'packages', 'read', true),
('packages.update', 'Modify package details and pricing', 'Package Management', 'packages', 'update', true),
('packages.delete', 'Remove packages from system', 'Package Management', 'packages', 'delete', true),
('packages.assign', 'Assign packages to users', 'Package Management', 'packages', 'assign', true),
('packages.manage', 'Full package management access', 'Package Management', 'packages', 'manage', true);

-- Billing & Finance
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('billing.read', 'View billing information and invoices', 'Billing', 'billing', 'read', true),
('billing.create', 'Generate invoices and billing records', 'Billing', 'billing', 'create', true),
('billing.update', 'Modify billing details and amounts', 'Billing', 'billing', 'update', true),
('billing.manage', 'Full billing management access', 'Billing', 'billing', 'manage', true),
('finance.reports', 'Access financial reports and analytics', 'Billing', 'finance', 'reports', true);

-- System Administration
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('system.settings', 'Access system settings and configuration', 'System', 'system', 'settings', true),
('system.logs', 'View system logs and audit trails', 'System', 'system', 'logs', true),
('system.backup', 'Create and manage system backups', 'System', 'system', 'backup', true),
('system.maintenance', 'Perform system maintenance tasks', 'System', 'system', 'maintenance', true),
('system.monitor', 'Monitor system health and performance', 'System', 'system', 'monitor', true);

-- Analytics & Reports
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
('analytics.view', 'View analytics dashboard and metrics', 'Analytics', 'analytics', 'view', true),
('reports.create', 'Generate custom reports', 'Analytics', 'reports', 'create', true),
('reports.export', 'Export reports in various formats', 'Analytics', 'reports', 'export', true),
('analytics.advanced', 'Access advanced analytics features', 'Analytics', 'analytics', 'advanced', true);

-- ==============================================
-- ASSIGN PERMISSIONS TO SYSTEM ROLES
-- ==============================================

-- OWNER Role - Full Access
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'OWNER';

-- ADMIN Role - Management Access (exclude system-level)
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'ADMIN' 
AND p.name NOT IN ('users.impersonate', 'permissions.system.manage', 'system.backup', 'system.maintenance');

-- MANAGER Role - Operational Management
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'MANAGER'
AND p.category IN ('Contact Management', 'WhatsApp', 'Package Management', 'Analytics')
AND p.action NOT IN ('delete', 'manage');

-- SUBDEALER Role - Business Operations
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'SUBDEALER'
AND (
    (p.category = 'WhatsApp' AND p.action IN ('read', 'send', 'template'))
    OR (p.category = 'Contact Management' AND p.action IN ('create', 'read', 'update', 'import'))
    OR (p.category = 'Package Management' AND p.action IN ('read'))
    OR (p.category = 'Analytics' AND p.action = 'view')
    OR (p.name IN ('users.read', 'billing.read'))
);

-- EMPLOYEE Role - Operational Access
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'EMPLOYEE'
AND (
    (p.category = 'WhatsApp' AND p.action IN ('read', 'send'))
    OR (p.category = 'Contact Management' AND p.action IN ('read', 'update'))
    OR (p.name IN ('users.read', 'packages.read', 'analytics.view'))
);

-- CUSTOMER Role - Basic Access
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'CUSTOMER'
AND p.name IN (
    'whatsapp.messages.read', 'whatsapp.instances.read', 
    'contacts.read', 'packages.read', 'billing.read'
);

-- ==============================================
-- CREATE PERMISSION TEMPLATES
-- ==============================================

INSERT INTO permission_templates (name, description, permissions, is_system) VALUES
('Basic User', 'Standard permissions for new users - messaging and viewing', 
 ARRAY[
    (SELECT id FROM permissions WHERE name = 'users.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.read'),
    (SELECT id FROM permissions WHERE name = 'contacts.read'),
    (SELECT id FROM permissions WHERE name = 'packages.read')
 ], true),

('Power User', 'Extended permissions for experienced users - includes messaging and basic management', 
 ARRAY[
    (SELECT id FROM permissions WHERE name = 'users.read'),
    (SELECT id FROM permissions WHERE name = 'users.update'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.connect'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.send'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.template'),
    (SELECT id FROM permissions WHERE name = 'contacts.create'),
    (SELECT id FROM permissions WHERE name = 'contacts.read'),
    (SELECT id FROM permissions WHERE name = 'contacts.update'),
    (SELECT id FROM permissions WHERE name = 'packages.read'),
    (SELECT id FROM permissions WHERE name = 'analytics.view')
 ], true),

('Manager', 'Management level permissions - team oversight and operational control', 
 ARRAY[
    (SELECT id FROM permissions WHERE name = 'users.read'),
    (SELECT id FROM permissions WHERE name = 'users.create'),
    (SELECT id FROM permissions WHERE name = 'users.update'),
    (SELECT id FROM permissions WHERE name = 'roles.read'),
    (SELECT id FROM permissions WHERE name = 'permissions.view'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.create'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.update'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.send'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.bulk'),
    (SELECT id FROM permissions WHERE name = 'contacts.manage'),
    (SELECT id FROM permissions WHERE name = 'packages.read'),
    (SELECT id FROM permissions WHERE name = 'packages.assign'),
    (SELECT id FROM permissions WHERE name = 'billing.read'),
    (SELECT id FROM permissions WHERE name = 'analytics.view'),
    (SELECT id FROM permissions WHERE name = 'reports.create')
 ], true),

('Operations Team', 'Operational staff permissions - daily operations and customer support', 
 ARRAY[
    (SELECT id FROM permissions WHERE name = 'users.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.connect'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.restart'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.send'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.template'),
    (SELECT id FROM permissions WHERE name = 'contacts.create'),
    (SELECT id FROM permissions WHERE name = 'contacts.read'),
    (SELECT id FROM permissions WHERE name = 'contacts.update'),
    (SELECT id FROM permissions WHERE name = 'contacts.import'),
    (SELECT id FROM permissions WHERE name = 'packages.read')
 ], true),

('Sales Team', 'Sales team permissions - customer management and package operations', 
 ARRAY[
    (SELECT id FROM permissions WHERE name = 'users.read'),
    (SELECT id FROM permissions WHERE name = 'contacts.create'),
    (SELECT id FROM permissions WHERE name = 'contacts.read'),
    (SELECT id FROM permissions WHERE name = 'contacts.update'),
    (SELECT id FROM permissions WHERE name = 'contacts.import'),
    (SELECT id FROM permissions WHERE name = 'contacts.export'),
    (SELECT id FROM permissions WHERE name = 'packages.read'),
    (SELECT id FROM permissions WHERE name = 'packages.assign'),
    (SELECT id FROM permissions WHERE name = 'billing.read'),
    (SELECT id FROM permissions WHERE name = 'billing.create'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.send'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.template'),
    (SELECT id FROM permissions WHERE name = 'analytics.view')
 ], true),

('Developer', 'Developer permissions - technical access and system monitoring', 
 ARRAY[
    (SELECT id FROM permissions WHERE name = 'users.read'),
    (SELECT id FROM permissions WHERE name = 'permissions.view'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.manage'),
    (SELECT id FROM permissions WHERE name = 'system.settings'),
    (SELECT id FROM permissions WHERE name = 'system.logs'),
    (SELECT id FROM permissions WHERE name = 'system.monitor'),
    (SELECT id FROM permissions WHERE name = 'analytics.advanced'),
    (SELECT id FROM permissions WHERE name = 'reports.create'),
    (SELECT id FROM permissions WHERE name = 'reports.export')
 ], true);

-- ==============================================
-- ASSIGN USERS TO ROLES (Based on existing users)
-- ==============================================

-- Assign System Owner to OWNER role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'owner@demo.com' AND r.name = 'OWNER'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign Admin User to ADMIN role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@demo.com' AND r.name = 'ADMIN'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign Sub Dealer to SUBDEALER role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'subdealer@demo.com' AND r.name = 'SUBDEALER'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign Employee User to EMPLOYEE role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'employee@demo.com' AND r.name = 'EMPLOYEE'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign Customer User to CUSTOMER role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'customer@demo.com' AND r.name = 'CUSTOMER'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ==============================================
-- CREATE PERMISSION CHECKING FUNCTIONS
-- ==============================================

-- Comprehensive permission checking function (direct + role-based)
CREATE OR REPLACE FUNCTION user_has_permission_comprehensive(user_email VARCHAR, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    -- Check direct user permissions first (these override role permissions)
    SELECT COALESCE(up.granted, false) INTO has_permission
    FROM users u
    JOIN user_permissions up ON u.id = up.user_id
    JOIN permissions p ON up.permission_id = p.id
    WHERE LOWER(u.email) = LOWER(user_email)
      AND u."isActive" = true
      AND p.name = permission_name
      AND (up.expires_at IS NULL OR up.expires_at > NOW())
    LIMIT 1;

    -- If direct permission found, return it (override)
    IF FOUND THEN
        RETURN has_permission;
    END IF;

    -- Otherwise check role-based permissions
    SELECT EXISTS(
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE LOWER(u.email) = LOWER(user_email)
          AND u."isActive" = true
          AND p.name = permission_name
          AND rp.granted = true
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ) INTO has_permission;

    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Simple role-based permission checking function
CREATE OR REPLACE FUNCTION user_has_permission_simple(user_email VARCHAR, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE LOWER(u.email) = LOWER(user_email)
          AND u."isActive" = true
          AND p.name = permission_name
          AND rp.granted = true
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- CREATE USEFUL VIEWS
-- ==============================================

-- Comprehensive view for user permissions
CREATE OR REPLACE VIEW user_comprehensive_permissions AS
SELECT 
    u.id as user_id,
    u.email,
    u.name as user_name,
    p.id as permission_id,
    p.name as permission_name,
    p.description as permission_description,
    p.category as permission_category,
    CASE 
        WHEN up.granted IS NOT NULL THEN up.granted
        ELSE COALESCE(rp_agg.has_role_permission, false)
    END as has_permission,
    CASE 
        WHEN up.granted IS NOT NULL THEN 'direct'
        WHEN rp_agg.has_role_permission THEN 'role'
        ELSE 'none'
    END as permission_source,
    up.reason as direct_reason,
    up.expires_at as direct_expires_at,
    up.assigned_at as direct_assigned_at,
    rp_agg.role_names as roles_granting_permission
FROM users u
CROSS JOIN permissions p
LEFT JOIN user_permissions up ON u.id = up.user_id AND p.id = up.permission_id
LEFT JOIN (
    SELECT 
        ur.user_id,
        rp.permission_id,
        bool_or(rp.granted) as has_role_permission,
        string_agg(r.name, ', ') as role_names
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.expires_at IS NULL OR ur.expires_at > NOW()
    GROUP BY ur.user_id, rp.permission_id
) rp_agg ON u.id = rp_agg.user_id AND p.id = rp_agg.permission_id
WHERE u."isActive" = true;

-- ==============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_granted ON user_permissions(granted);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);

-- ==============================================
-- SUMMARY REPORT
-- ==============================================
SELECT 'DATABASE SEEDING COMPLETED!' as status;

SELECT 
    'SUMMARY' as section,
    (SELECT COUNT(*) FROM roles) as total_roles,
    (SELECT COUNT(*) FROM permissions) as total_permissions,
    (SELECT COUNT(*) FROM permission_templates) as permission_templates,
    (SELECT COUNT(*) FROM role_permissions) as role_permission_assignments,
    (SELECT COUNT(*) FROM user_roles) as user_role_assignments;

-- Show role permission counts
SELECT 
    r.name as role_name,
    r.level,
    COUNT(rp.id) as permissions_count,
    r.is_system
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.level, r.is_system
ORDER BY r.level;

-- Show template details
SELECT 
    name,
    description,
    array_length(permissions, 1) as permission_count,
    is_system
FROM permission_templates
ORDER BY name;