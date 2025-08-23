-- ===============================================
-- WhatsApp Management System - PostgreSQL Permissions Template
-- Ready-to-use SQL for User Roles and Permissions System
-- ===============================================

-- ===============================================
-- 1. DATABASE SCHEMA - CORE TABLES
-- ===============================================

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Permissions Table
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    is_system_permission BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Roles Table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Role-Permission Mapping Table
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL,
    permission_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- Create Users Table (Enhanced)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20),
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    parent_id INTEGER NULL,
    language VARCHAR(10) DEFAULT 'hi',
    avatar TEXT NULL,
    dealer_code VARCHAR(20) NULL UNIQUE,
    referred_by_dealer_code VARCHAR(20) NULL,
    package_id INTEGER NULL,
    messages_used INTEGER DEFAULT 0,
    messages_limit INTEGER DEFAULT 0,
    last_login TIMESTAMP NULL,
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create User Sessions Table
CREATE TABLE user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    ip_address INET,
    user_agent TEXT,
    payload JSONB,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Packages Table
CREATE TABLE packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    messages_limit INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Audit Logs Table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create Transactions Table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
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
('users.export', 'Export Users', 'Export user data to various formats', 'User Management', FALSE),
('users.reset_password', 'Reset User Password', 'Reset passwords for other users', 'User Management', TRUE);

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

-- Dealer Management
INSERT INTO permissions (id, name, description, category, is_system_permission) VALUES
('dealers.view', 'View Dealers', 'View dealer information and codes', 'Dealer Management', TRUE),
('dealers.create', 'Create Dealers', 'Create new dealer accounts', 'Dealer Management', TRUE),
('dealers.edit', 'Edit Dealers', 'Modify dealer information', 'Dealer Management', TRUE),
('dealers.codes', 'Manage Dealer Codes', 'Generate and manage dealer codes', 'Dealer Management', TRUE);

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
    'users.create', 'users.view', 'users.edit', 'users.reset_password',
    -- Dealer Management
    'dealers.view', 'dealers.codes',
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
-- 5. DEFAULT PACKAGES
-- ===============================================

INSERT INTO packages (name, display_name, description, messages_limit, price) VALUES
('starter', 'स्टार्टर (Starter)', 'Basic package for individual users', 5000, 999.00),
('basic', 'बेसिक (Basic)', 'Standard package for small businesses', 10000, 1999.00),
('professional', 'प्रोफेशनल (Professional)', 'Advanced package for growing businesses', 25000, 3999.00),
('enterprise', 'एंटरप्राइज़ (Enterprise)', 'Premium package for large organizations', 50000, 7999.00);

-- ===============================================
-- 6. DEFAULT ADMIN USER (SAMPLE)
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
-- 7. INDEXES FOR PERFORMANCE
-- ===============================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_dealer_code ON users(dealer_code);
CREATE INDEX idx_users_referred_by_dealer_code ON users(referred_by_dealer_code);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_parent_id ON users(parent_id);

-- Role permissions indexes
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Permissions indexes
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_system ON permissions(is_system_permission);

-- Sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Transactions indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- ===============================================
-- 8. STORED FUNCTIONS FOR COMMON OPERATIONS
-- ===============================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION check_user_permission(
    user_email VARCHAR(255),
    permission_name VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.email = user_email 
        AND p.id = permission_name
        AND u.status = 'active'
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql;

-- Function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_email VARCHAR(255))
RETURNS TABLE(
    permission_id VARCHAR(100),
    permission_name VARCHAR(255),
    description TEXT,
    category VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.id, p.name, p.description, p.category
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.email = user_email 
    AND u.status = 'active'
    ORDER BY p.category, p.name;
END;
$$ LANGUAGE plpgsql;

-- Function to assign permission to role
CREATE OR REPLACE FUNCTION assign_permission_to_role(
    role_name VARCHAR(100),
    permission_id VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
    role_id_var INTEGER;
    result BOOLEAN := FALSE;
BEGIN
    SELECT id INTO role_id_var FROM roles WHERE name = role_name;
    
    IF role_id_var IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (role_id_var, permission_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
        
        result := TRUE;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate dealer code
CREATE OR REPLACE FUNCTION generate_dealer_code(
    dealer_name VARCHAR(255),
    dealer_id INTEGER
) RETURNS VARCHAR(20) AS $$
DECLARE
    name_initials VARCHAR(2);
    random_letters VARCHAR(2);
    dealer_id_padded VARCHAR(4);
    dealer_code VARCHAR(20);
BEGIN
    -- Extract initials from dealer name
    name_initials := UPPER(SUBSTRING(
        STRING_AGG(SUBSTRING(word, 1, 1), '') 
        FROM (SELECT UNNEST(STRING_TO_ARRAY(dealer_name, ' ')) AS word) AS words, 
        1, 2
    ));
    
    -- Pad with 'A' if needed
    name_initials := RPAD(COALESCE(name_initials, ''), 2, 'A');
    
    -- Generate random letters
    random_letters := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 2));
    
    -- Pad dealer ID
    dealer_id_padded := LPAD(dealer_id::TEXT, 4, '0');
    
    -- Combine parts
    dealer_code := 'WA-' || name_initials || random_letters || '-' || dealer_id_padded;
    
    RETURN dealer_code;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- 9. TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ===============================================

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at 
    BEFORE UPDATE ON permissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at 
    BEFORE UPDATE ON packages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- 10. SAMPLE DATA FOR TESTING
-- ===============================================

-- Insert sample SubDealer
INSERT INTO users (name, email, mobile, password_hash, role_id, status, language, dealer_code, messages_limit, package_id) 
SELECT 'प्रिया शर्मा (Priya Sharma)', 'priya@example.com', '+91-87654-32109',
       '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       r.id, 'active', 'hi', 'WA-PRSH-0002', 50000, p.id
FROM roles r, packages p 
WHERE r.name = 'SUBDEALER' AND p.name = 'professional';

-- Insert sample Customer
INSERT INTO users (name, email, mobile, password_hash, role_id, status, language, referred_by_dealer_code, messages_limit, package_id) 
SELECT 'अमित पटेल (Amit Patel)', 'amit@example.com', '+91-76543-21098',
       '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       r.id, 'active', 'en', 'WA-PRSH-0002', 10000, p.id
FROM roles r, packages p 
WHERE r.name = 'CUSTOMER' AND p.name = 'basic';

-- Insert sample Employee
INSERT INTO users (name, email, mobile, password_hash, role_id, status, language, messages_limit, parent_id) 
SELECT 'सुनीता गुप्ता (Sunita Gupta)', 'sunita@example.com', '+91-65432-10987',
       '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
       r.id, 'active', 'hi', 25000, u.id
FROM roles r, users u
WHERE r.name = 'EMPLOYEE' AND u.email = 'priya@example.com';

-- ===============================================
-- 11. USEFUL QUERIES FOR PERMISSION MANAGEMENT
-- ===============================================

-- Check user permissions (Example usage)
-- SELECT * FROM get_user_permissions('admin@whatsapp-system.com');

-- Check specific permission (Example usage)
-- SELECT check_user_permission('priya@example.com', 'users.create');

-- Get role permission matrix
-- SELECT r.name as role_name, 
--        ARRAY_AGG(p.name ORDER BY p.category, p.name) as permissions
-- FROM roles r
-- LEFT JOIN role_permissions rp ON r.id = rp.role_id
-- LEFT JOIN permissions p ON rp.permission_id = p.id
-- GROUP BY r.id, r.name
-- ORDER BY r.name;

-- Count permissions by category
-- SELECT p.category, 
--        COUNT(*) as total_permissions,
--        COUNT(*) FILTER (WHERE p.is_system_permission) as system_permissions,
--        COUNT(*) FILTER (WHERE NOT p.is_system_permission) as custom_permissions
-- FROM permissions p
-- GROUP BY p.category
-- ORDER BY p.category;

-- Get users with specific permission
-- SELECT u.name, u.email, r.display_name as role
-- FROM users u
-- JOIN roles r ON u.role_id = r.id
-- JOIN role_permissions rp ON r.id = rp.role_id
-- WHERE rp.permission_id = 'users.create'
-- AND u.status = 'active';

-- Get dealer hierarchy
-- SELECT 
--     d.name as dealer_name,
--     d.dealer_code,
--     COUNT(c.id) as customer_count,
--     SUM(c.messages_used) as total_messages_used
-- FROM users d
-- LEFT JOIN users c ON c.referred_by_dealer_code = d.dealer_code
-- JOIN roles dr ON d.role_id = dr.id
-- WHERE dr.name = 'SUBDEALER'
-- GROUP BY d.id, d.name, d.dealer_code
-- ORDER BY customer_count DESC;

-- ===============================================
-- 12. VIEWS FOR COMMON QUERIES
-- ===============================================

-- User permissions view
CREATE VIEW user_permissions_view AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email,
    r.name as role_name,
    r.display_name as role_display_name,
    p.id as permission_id,
    p.name as permission_name,
    p.category as permission_category
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.status = 'active';

-- Role summary view
CREATE VIEW role_summary_view AS
SELECT 
    r.id,
    r.name,
    r.display_name,
    r.description,
    r.is_system_role,
    COUNT(DISTINCT rp.permission_id) as permission_count,
    COUNT(DISTINCT u.id) as user_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN users u ON r.id = u.role_id AND u.status = 'active'
GROUP BY r.id, r.name, r.display_name, r.description, r.is_system_role;

-- Dealer performance view
CREATE VIEW dealer_performance_view AS
SELECT 
    d.id as dealer_id,
    d.name as dealer_name,
    d.email as dealer_email,
    d.dealer_code,
    d.created_at as dealer_since,
    COUNT(c.id) as total_customers,
    COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_customers,
    SUM(c.messages_used) as total_messages_sent,
    COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'completed'), 0) as total_revenue
FROM users d
JOIN roles dr ON d.role_id = dr.id
LEFT JOIN users c ON c.referred_by_dealer_code = d.dealer_code
LEFT JOIN transactions t ON c.id = t.user_id
WHERE dr.name = 'SUBDEALER' AND d.status = 'active'
GROUP BY d.id, d.name, d.email, d.dealer_code, d.created_at;

-- ===============================================
-- END OF POSTGRESQL TEMPLATE
-- ===============================================

-- This PostgreSQL template provides:
-- ✅ Complete database schema optimized for PostgreSQL
-- ✅ UUID support for better distributed systems
-- ✅ JSONB columns for flexible metadata storage
-- ✅ INET type for proper IP address storage
-- ✅ Comprehensive permissions system organized by categories
-- ✅ Role-based access control with Indian context
-- ✅ PostgreSQL-specific functions and triggers
-- ✅ Optimized indexes for performance
-- ✅ Useful views for common queries
-- ✅ Sample data for testing
-- ✅ Ready-to-use for production deployment

-- To execute this template:
-- 1. Create your PostgreSQL database
-- 2. Run this entire SQL script
-- 3. Update your application's database connection settings
-- 4. Use the provided functions and views in your application