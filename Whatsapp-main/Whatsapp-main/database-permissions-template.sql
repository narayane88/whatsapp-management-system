-- ===============================================
-- WhatsApp Management System - Database Permissions Template
-- Ready-to-use SQL for User Roles and Permissions System
-- ===============================================

-- ===============================================
-- 1. DATABASE SCHEMA - CORE TABLES
-- ===============================================

-- Create Permissions Table
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    is_system_permission BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Roles Table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Role-Permission Mapping Table
CREATE TABLE role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- Create Users Table (Enhanced)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20),
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    parent_id INT NULL,
    language VARCHAR(10) DEFAULT 'hi',
    avatar TEXT NULL,
    dealer_code VARCHAR(20) NULL UNIQUE,
    referred_by_dealer_code VARCHAR(20) NULL,
    package_id INT NULL,
    messages_used INT DEFAULT 0,
    messages_limit INT DEFAULT 0,
    last_login TIMESTAMP NULL,
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_dealer_code (dealer_code),
    INDEX idx_referred_by_dealer_code (referred_by_dealer_code),
    INDEX idx_email (email),
    INDEX idx_mobile (mobile)
);

-- Create User Sessions Table
CREATE TABLE user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_last_activity (last_activity)
);

-- ===============================================
-- 2. SYSTEM PERMISSIONS - ORGANIZED BY CATEGORY
-- ===============================================

-- User Management Permissions
INSERT INTO permissions (id, name, description, category, is_system_permission) VALUES
('users.create', 'Create Users', 'Ability to create new user accounts', 'User Management', TRUE),
('users.view', 'View Users', 'Access user list and basic information', 'User Management', TRUE),
('users.edit', 'Edit Users', 'Modify existing user information and settings', 'User Management', TRUE),
('users.delete', 'Delete Users', 'Permanently remove user accounts', 'User Management', TRUE),
('users.impersonate', 'Impersonate Users', 'Login as another user for support purposes', 'User Management', FALSE),
('users.export', 'Export Users', 'Export user data to various formats', 'User Management', FALSE);

-- Role & Permission Management
INSERT INTO permissions (id, name, description, category, is_system_permission) VALUES
('roles.create', 'Create Roles', 'Create new user roles and permissions', 'Role Management', TRUE),
('roles.view', 'View Roles', 'View existing roles and their permissions', 'Role Management', TRUE),
('roles.edit', 'Edit Roles', 'Modify existing roles and their permissions', 'Role Management', TRUE),
('roles.delete', 'Delete Roles', 'Remove custom roles from the system', 'Role Management', TRUE),
('permissions.assign', 'Assign Permissions', 'Assign permissions to roles and users', 'Role Management', TRUE),
('permissions.create', 'Create Permissions', 'Create custom permissions', 'Role Management', FALSE);

-- Package & Subscription Management
INSERT INTO permissions (id, name, description, category, is_system_permission) VALUES
('packages.create', 'Create Packages', 'Create new service packages', 'Package Management', TRUE),
('packages.view', 'View Packages', 'View available packages and details', 'Package Management', TRUE),
('packages.edit', 'Edit Packages', 'Modify package details and pricing', 'Package Management', TRUE),
('packages.delete', 'Delete Packages', 'Remove packages from the system', 'Package Management', TRUE),
('packages.assign', 'Assign Packages', 'Assign packages to customers', 'Package Management', TRUE);

-- Financial Management
INSERT INTO permissions (id, name, description, category, is_system_permission) VALUES
('transactions.view', 'View Transactions', 'Access transaction history and details', 'Financial', TRUE),
('transactions.create', 'Create Transactions', 'Process payments and create transactions', 'Financial', TRUE),
('transactions.edit', 'Edit Transactions', 'Modify transaction details', 'Financial', FALSE),
('payouts.view', 'View Payouts', 'Access payout information', 'Financial', TRUE),
('payouts.create', 'Create Payouts', 'Process and create new payouts', 'Financial', TRUE),
('payouts.approve', 'Approve Payouts', 'Approve pending payouts', 'Financial', FALSE),
('billing.view', 'View Billing', 'Access billing information and invoices', 'Financial', TRUE),
('billing.manage', 'Manage Billing', 'Create and manage billing records', 'Financial', FALSE);

-- WhatsApp & Messaging
INSERT INTO permissions (id, name, description, category, is_system_permission) VALUES
('messages.send', 'Send Messages', 'Send WhatsApp messages through the system', 'Messaging', TRUE),
('messages.view', 'View Messages', 'View message history and logs', 'Messaging', TRUE),
('messages.bulk', 'Bulk Messaging', 'Send bulk messages to multiple recipients', 'Messaging', FALSE),
('instances.create', 'Create Instances', 'Create new WhatsApp instances', 'Messaging', TRUE),
('instances.view', 'View Instances', 'View WhatsApp instances', 'Messaging', TRUE),
('instances.edit', 'Edit Instances', 'Modify WhatsApp instance settings', 'Messaging', TRUE),
('instances.delete', 'Delete Instances', 'Remove WhatsApp instances', 'Messaging', TRUE),
('contacts.import', 'Import Contacts', 'Import contact lists', 'Messaging', FALSE),
('contacts.export', 'Export Contacts', 'Export contact data', 'Messaging', FALSE),
('contacts.manage', 'Manage Contacts', 'Create, edit, and organize contacts', 'Messaging', FALSE);

-- System Administration
INSERT INTO permissions (id, name, description, category, is_system_permission) VALUES
('system.settings', 'Manage Settings', 'Access and modify system settings', 'System', TRUE),
('system.logs', 'View System Logs', 'Access system logs and audit trails', 'System', FALSE),
('system.backup', 'Manage Backups', 'Create and restore system backups', 'System', FALSE),
('system.maintenance', 'System Maintenance', 'Perform system maintenance tasks', 'System', FALSE),
('api.access', 'API Access', 'Access system APIs and integrations', 'System', TRUE),
('api.keys', 'Manage API Keys', 'Create and manage API keys', 'System', FALSE);

-- Analytics & Reports
INSERT INTO permissions (id, name, description, category, is_system_permission) VALUES
('reports.view', 'View Reports', 'Access basic system reports and analytics', 'Analytics', TRUE),
('reports.advanced', 'Advanced Analytics', 'Access detailed analytics and insights', 'Analytics', FALSE),
('reports.export', 'Export Reports', 'Export reports in various formats', 'Analytics', FALSE),
('analytics.dashboard', 'Analytics Dashboard', 'Access comprehensive analytics dashboard', 'Analytics', FALSE);

-- Support & Help Desk
INSERT INTO permissions (id, name, description, category, is_system_permission) VALUES
('support.tickets', 'Manage Tickets', 'Handle customer support tickets', 'Support', FALSE),
('support.chat', 'Live Chat Support', 'Provide live chat support', 'Support', FALSE),
('support.knowledge', 'Knowledge Base', 'Manage knowledge base articles', 'Support', FALSE);

-- Server Management
INSERT INTO permissions (id, name, description, category, is_system_permission) VALUES
('servers.view', 'View Servers', 'View server status and information', 'Server Management', TRUE),
('servers.manage', 'Manage Servers', 'Configure and manage servers', 'Server Management', FALSE),
('servers.restart', 'Restart Servers', 'Restart server instances', 'Server Management', FALSE);

-- ===============================================
-- 3. SYSTEM ROLES WITH INDIAN CONTEXT
-- ===============================================

-- Create System Roles
INSERT INTO roles (name, display_name, description, is_system_role) VALUES
('OWNER', 'मालिक (Owner)', 'System owner with full administrative privileges - complete system access', TRUE),
('SUBDEALER', 'उप-डीलर (SubDealer)', 'Regional dealer with user management and business operations', TRUE),
('EMPLOYEE', 'कर्मचारी (Employee)', 'Company employee with customer support and operational access', TRUE),
('CUSTOMER', 'ग्राहक (Customer)', 'End customer with self-service access and messaging capabilities', TRUE),
('MANAGER', 'प्रबंधक (Manager)', 'Department manager with team oversight capabilities', FALSE),
('SUPPORT_AGENT', 'सहायता एजेंट (Support Agent)', 'Customer support representative', FALSE),
('ANALYST', 'विश्लेषक (Analyst)', 'Data analyst with reporting and analytics access', FALSE);

-- ===============================================
-- 4. ROLE-PERMISSION ASSIGNMENTS
-- ===============================================

-- OWNER Role - All Permissions (Super Admin)
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'OWNER';

-- SUBDEALER Role - Business Operations
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'SUBDEALER' 
AND p.id IN (
    -- User Management
    'users.create', 'users.view', 'users.edit',
    -- Package Management
    'packages.view', 'packages.assign',
    -- Financial (View Only)
    'transactions.view', 'billing.view', 'payouts.view',
    -- Messaging
    'messages.send', 'messages.view', 'instances.view', 'instances.edit',
    'contacts.import', 'contacts.manage',
    -- Analytics
    'reports.view', 'analytics.dashboard'
);

-- EMPLOYEE Role - Customer Support
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'EMPLOYEE' 
AND p.id IN (
    -- User Management (View Only)
    'users.view',
    -- Support Functions
    'support.tickets', 'support.chat',
    -- Messaging (Limited)
    'messages.send', 'messages.view',
    -- Basic Reports
    'reports.view'
);

-- CUSTOMER Role - Self Service
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'CUSTOMER' 
AND p.id IN (
    -- Self Service
    'messages.send', 'messages.view',
    'billing.view',
    'support.tickets',
    'contacts.manage'
);

-- MANAGER Role - Department Management
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'MANAGER' 
AND p.id IN (
    -- User Management
    'users.view', 'users.edit',
    -- Analytics
    'reports.view', 'reports.advanced', 'analytics.dashboard',
    -- Messaging
    'messages.view', 'instances.view',
    -- Support
    'support.tickets'
);

-- SUPPORT_AGENT Role - Customer Support
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'SUPPORT_AGENT' 
AND p.id IN (
    'users.view',
    'support.tickets', 'support.chat', 'support.knowledge',
    'messages.view',
    'reports.view'
);

-- ANALYST Role - Data & Analytics
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'ANALYST' 
AND p.id IN (
    'reports.view', 'reports.advanced', 'reports.export',
    'analytics.dashboard',
    'users.view', 'transactions.view'
);

-- ===============================================
-- 5. DEFAULT ADMIN USER (SAMPLE)
-- ===============================================

-- Create default admin user (Owner)
INSERT INTO users (
    name, email, mobile, password_hash, role_id, status, language,
    messages_limit, dealer_code
) 
SELECT 
    'राजेश कुमार (Rajesh Kumar)', 
    'admin@whatsapp-system.com',
    '+91-98765-43210',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
    r.id,
    'active',
    'hi',
    100000,
    NULL
FROM roles r WHERE r.name = 'OWNER';

-- ===============================================
-- 6. USEFUL QUERIES FOR PERMISSION MANAGEMENT
-- ===============================================

-- Check user permissions
-- SELECT DISTINCT p.* 
-- FROM permissions p
-- JOIN role_permissions rp ON p.id = rp.permission_id
-- JOIN roles r ON rp.role_id = r.id
-- JOIN users u ON u.role_id = r.id
-- WHERE u.email = 'user@example.com';

-- Get role permission matrix
-- SELECT r.name as role_name, 
--        GROUP_CONCAT(p.name SEPARATOR ', ') as permissions
-- FROM roles r
-- LEFT JOIN role_permissions rp ON r.id = rp.role_id
-- LEFT JOIN permissions p ON rp.permission_id = p.id
-- GROUP BY r.id, r.name;

-- Count permissions by category
-- SELECT p.category, COUNT(*) as total_permissions,
--        SUM(CASE WHEN p.is_system_permission THEN 1 ELSE 0 END) as system_permissions,
--        SUM(CASE WHEN NOT p.is_system_permission THEN 1 ELSE 0 END) as custom_permissions
-- FROM permissions p
-- GROUP BY p.category;

-- ===============================================
-- 7. INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_system ON permissions(is_system_permission);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);

-- ===============================================
-- 8. STORED PROCEDURES FOR COMMON OPERATIONS
-- ===============================================

DELIMITER //

-- Procedure to check if user has specific permission
CREATE PROCEDURE CheckUserPermission(
    IN user_email VARCHAR(255),
    IN permission_name VARCHAR(100),
    OUT has_permission BOOLEAN
)
BEGIN
    DECLARE perm_count INT DEFAULT 0;
    
    SELECT COUNT(*)
    INTO perm_count
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.email = user_email 
    AND p.id = permission_name
    AND u.status = 'active';
    
    SET has_permission = (perm_count > 0);
END //

-- Procedure to assign permission to role
CREATE PROCEDURE AssignPermissionToRole(
    IN role_name VARCHAR(100),
    IN permission_id VARCHAR(100)
)
BEGIN
    INSERT IGNORE INTO role_permissions (role_id, permission_id)
    SELECT r.id, permission_id
    FROM roles r
    WHERE r.name = role_name;
END //

-- Procedure to get user permissions
CREATE PROCEDURE GetUserPermissions(
    IN user_email VARCHAR(255)
)
BEGIN
    SELECT DISTINCT p.id, p.name, p.description, p.category
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.email = user_email 
    AND u.status = 'active'
    ORDER BY p.category, p.name;
END //

DELIMITER ;

-- ===============================================
-- 9. SAMPLE DATA FOR TESTING
-- ===============================================

-- Insert sample SubDealer
INSERT INTO users (name, email, mobile, password_hash, role_id, status, language, dealer_code, messages_limit) 
SELECT 'प्रिया शर्मा (Priya Sharma)', 'priya@example.com', '+91-87654-32109',
       '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       r.id, 'active', 'hi', 'WA-PRSH-0002', 50000
FROM roles r WHERE r.name = 'SUBDEALER';

-- Insert sample Customer
INSERT INTO users (name, email, mobile, password_hash, role_id, status, language, referred_by_dealer_code, messages_limit) 
SELECT 'अमित पटेल (Amit Patel)', 'amit@example.com', '+91-76543-21098',
       '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       r.id, 'active', 'en', 'WA-PRSH-0002', 10000
FROM roles r WHERE r.name = 'CUSTOMER';

-- ===============================================
-- END OF TEMPLATE
-- ===============================================

-- This template provides:
-- ✅ Complete database schema with all necessary tables
-- ✅ Comprehensive permissions system organized by categories
-- ✅ Role-based access control with Indian context
-- ✅ Default system roles with appropriate permissions
-- ✅ Sample data for testing
-- ✅ Useful queries and stored procedures
-- ✅ Performance optimizations with indexes
-- ✅ Ready-to-use for production deployment