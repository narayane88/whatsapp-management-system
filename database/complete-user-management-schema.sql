-- Complete User Management System Schema
-- Hierarchy: User Permissions => Roles => Users

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create Users table (enhanced)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "parentId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    profile_image VARCHAR(500),
    phone VARCHAR(20),
    address TEXT,
    dealer_code VARCHAR(20) UNIQUE,
    notes TEXT
);

-- Create Permissions table (granular permissions)
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL, -- what resource (users, roles, packages, etc.)
    action VARCHAR(50) NOT NULL,   -- what action (create, read, update, delete, manage)
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Roles table (role-based access)
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    level INTEGER DEFAULT 1, -- hierarchy level (1=highest, 5=lowest)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Role-Permission junction table (many-to-many)
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Create User-Role junction table (many-to-many, users can have multiple roles)
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false, -- one primary role per user
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- for temporary role assignments
    UNIQUE(user_id, role_id)
);

-- Create User-specific Permissions table (direct user permissions, override role permissions)
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT true, -- true=allow, false=deny (overrides role permissions)
    reason TEXT, -- why this permission was granted/denied
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- for temporary permissions
    UNIQUE(user_id, permission_id)
);

-- Insert System Permissions
INSERT INTO permissions (name, description, category, resource, action, is_system) VALUES
-- User Management
('users.create', 'Create new users', 'User Management', 'users', 'create', true),
('users.read', 'View users list and details', 'User Management', 'users', 'read', true),
('users.update', 'Edit user information', 'User Management', 'users', 'update', true),
('users.delete', 'Delete users', 'User Management', 'users', 'delete', true),
('users.manage', 'Full user management access', 'User Management', 'users', 'manage', true),
('users.impersonate', 'Login as another user', 'User Management', 'users', 'impersonate', true),

-- Role Management
('roles.create', 'Create new roles', 'Role Management', 'roles', 'create', true),
('roles.read', 'View roles list and details', 'Role Management', 'roles', 'read', true),
('roles.update', 'Edit role information', 'Role Management', 'roles', 'update', true),
('roles.delete', 'Delete roles', 'Role Management', 'roles', 'delete', true),
('roles.assign', 'Assign roles to users', 'Role Management', 'roles', 'assign', true),

-- Permission Management
('permissions.create', 'Create custom permissions', 'Permission Management', 'permissions', 'create', true),
('permissions.read', 'View permissions list', 'Permission Management', 'permissions', 'read', true),
('permissions.update', 'Edit permission details', 'Permission Management', 'permissions', 'update', true),
('permissions.delete', 'Delete custom permissions', 'Permission Management', 'permissions', 'delete', true),
('permissions.assign', 'Assign permissions to roles/users', 'Permission Management', 'permissions', 'assign', true),

-- WhatsApp Management
('whatsapp.instances.create', 'Create WhatsApp instances', 'WhatsApp', 'instances', 'create', true),
('whatsapp.instances.read', 'View WhatsApp instances', 'WhatsApp', 'instances', 'read', true),
('whatsapp.instances.update', 'Edit WhatsApp instances', 'WhatsApp', 'instances', 'update', true),
('whatsapp.instances.delete', 'Delete WhatsApp instances', 'WhatsApp', 'instances', 'delete', true),
('whatsapp.messages.send', 'Send WhatsApp messages', 'WhatsApp', 'messages', 'send', true),
('whatsapp.messages.read', 'Read WhatsApp messages', 'WhatsApp', 'messages', 'read', true),

-- Package Management
('packages.create', 'Create packages', 'Package Management', 'packages', 'create', true),
('packages.read', 'View packages', 'Package Management', 'packages', 'read', true),
('packages.update', 'Edit packages', 'Package Management', 'packages', 'update', true),
('packages.delete', 'Delete packages', 'Package Management', 'packages', 'delete', true),

-- Financial
('finance.transactions.read', 'View transactions', 'Financial', 'transactions', 'read', true),
('finance.payouts.create', 'Process payouts', 'Financial', 'payouts', 'create', true),
('finance.payouts.read', 'View payouts', 'Financial', 'payouts', 'read', true),
('finance.reports.read', 'View financial reports', 'Financial', 'reports', 'read', true),

-- System
('system.settings.read', 'View system settings', 'System', 'settings', 'read', true),
('system.settings.update', 'Modify system settings', 'System', 'settings', 'update', true),
('system.logs.read', 'View system logs', 'System', 'logs', 'read', true),
('system.backup.create', 'Create system backups', 'System', 'backup', 'create', true);

-- Insert System Roles
INSERT INTO roles (name, description, is_system, level) VALUES
('OWNER', 'System owner with full access', true, 1),
('ADMIN', 'Administrator with most privileges', true, 2),
('SUBDEALER', 'Sub-dealer managing customers', true, 3),
('EMPLOYEE', 'Employee with limited access', true, 4),
('CUSTOMER', 'End customer with basic access', true, 5);

-- Assign permissions to OWNER role (all permissions)
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'OWNER';

-- Assign permissions to ADMIN role (most permissions except system-critical ones)
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'ADMIN' 
AND p.name NOT IN ('users.impersonate', 'system.backup.create', 'permissions.delete');

-- Assign permissions to SUBDEALER role
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'SUBDEALER' 
AND p.name IN (
    'users.create', 'users.read', 'users.update',
    'whatsapp.instances.create', 'whatsapp.instances.read', 'whatsapp.instances.update',
    'whatsapp.messages.send', 'whatsapp.messages.read',
    'packages.read', 'finance.transactions.read', 'finance.payouts.read'
);

-- Assign permissions to EMPLOYEE role
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'EMPLOYEE' 
AND p.name IN (
    'users.read', 'whatsapp.instances.read', 'whatsapp.messages.send', 'whatsapp.messages.read',
    'packages.read', 'finance.transactions.read'
);

-- Assign permissions to CUSTOMER role
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'CUSTOMER' 
AND p.name IN (
    'whatsapp.instances.read', 'whatsapp.messages.send', 'whatsapp.messages.read',
    'packages.read'
);

-- Insert demo users with hashed passwords (demo123)
INSERT INTO users (name, email, password, "isActive", dealer_code) VALUES
('System Owner', 'owner@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewE3GzOPnPAzkfDO', true, 'OWN001'),
('Admin User', 'admin@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewE3GzOPnPAzkfDO', true, 'ADM001'),
('Sub Dealer', 'subdealer@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewE3GzOPnPAzkfDO', true, 'SUB001'),
('Employee User', 'employee@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewE3GzOPnPAzkfDO', true, 'EMP001'),
('Customer User', 'customer@demo.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewE3GzOPnPAzkfDO', true, 'CUS001');

-- Assign primary roles to users
INSERT INTO user_roles (user_id, role_id, is_primary, assigned_by) VALUES
(1, 1, true, 1), -- Owner
(2, 2, true, 1), -- Admin  
(3, 3, true, 1), -- SubDealer
(4, 4, true, 1), -- Employee
(5, 5, true, 1); -- Customer

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users("isActive");
CREATE INDEX idx_users_dealer_code ON users(dealer_code);
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);

-- Create a view for easy permission checking
CREATE OR REPLACE VIEW user_effective_permissions AS
SELECT DISTINCT
    u.id as user_id,
    u.email,
    u.name as user_name,
    p.id as permission_id,
    p.name as permission_name,
    p.category,
    p.resource,
    p.action,
    CASE 
        WHEN up.granted IS NOT NULL THEN up.granted  -- Direct user permission overrides
        WHEN rp.granted IS NOT NULL THEN rp.granted  -- Role-based permission
        ELSE false
    END as has_permission,
    CASE 
        WHEN up.granted IS NOT NULL THEN 'direct'
        WHEN rp.granted IS NOT NULL THEN 'role'
        ELSE 'none'
    END as permission_source
FROM users u
CROSS JOIN permissions p
LEFT JOIN user_permissions up ON u.id = up.user_id AND p.id = up.permission_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id AND p.id = rp.permission_id
WHERE u."isActive" = true;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(user_email VARCHAR, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_effective_permissions
        WHERE email = user_email 
        AND permission_name = permission_name 
        AND has_permission = true
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's all permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_email VARCHAR)
RETURNS TABLE (
    permission_name VARCHAR,
    category VARCHAR,
    resource VARCHAR,
    action VARCHAR,
    source VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uep.permission_name::VARCHAR,
        uep.category::VARCHAR,
        uep.resource::VARCHAR,
        uep.action::VARCHAR,
        uep.permission_source::VARCHAR
    FROM user_effective_permissions uep
    WHERE uep.email = user_email AND uep.has_permission = true
    ORDER BY uep.category, uep.resource, uep.action;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE users IS 'Main users table with hierarchical structure';
COMMENT ON TABLE permissions IS 'Granular permissions for system resources';
COMMENT ON TABLE roles IS 'Role definitions with hierarchy levels';
COMMENT ON TABLE role_permissions IS 'Permissions assigned to roles';
COMMENT ON TABLE user_roles IS 'Roles assigned to users (many-to-many)';
COMMENT ON TABLE user_permissions IS 'Direct user permissions (override role permissions)';
COMMENT ON VIEW user_effective_permissions IS 'Complete view of user permissions from all sources';