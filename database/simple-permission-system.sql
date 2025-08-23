-- Simple Permission System - Role-Based Only
-- Remove complex user_permissions table and simplify

-- Drop the complex user_permissions table
DROP TABLE IF EXISTS user_permissions CASCADE;

-- Drop the complex database function if it exists
DROP FUNCTION IF EXISTS user_has_permission(VARCHAR, VARCHAR);

-- Create a simple permission checking function that only uses roles
CREATE OR REPLACE FUNCTION user_has_permission_simple(user_email VARCHAR, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    -- Check if user has permission through their roles only
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

-- Create a function to get user's role level for hierarchy checks
CREATE OR REPLACE FUNCTION get_user_role_level(user_email VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    role_level INTEGER := 999; -- Default to lowest level
BEGIN
    SELECT COALESCE(MIN(r.level), 999)
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE LOWER(u.email) = LOWER(user_email)
      AND u."isActive" = true
      AND ur.is_primary = true
    INTO role_level;

    RETURN role_level;
END;
$$ LANGUAGE plpgsql;

-- Update existing system to work with simplified permissions
-- Clean up any remaining user permission references
DELETE FROM role_permissions 
WHERE permission_id IN (
    SELECT id FROM permissions 
    WHERE name LIKE '%.user_permissions.%'
);

DELETE FROM permissions 
WHERE name LIKE '%.user_permissions.%';

-- Ensure all system roles have proper permissions
-- Grant basic permissions to each role level

-- OWNER (Level 1) - Full access
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'OWNER'
  AND p.is_system = true
ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;

-- ADMIN (Level 2) - Most permissions except system-critical ones
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'ADMIN'
  AND p.is_system = true
  AND p.name NOT IN ('system.backup', 'system.restore', 'users.impersonate')
ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;

-- SUBDEALER (Level 3) - Customer management and basic operations
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'SUBDEALER'
  AND p.is_system = true
  AND p.name IN (
    'users.read',
    'dealers.customers.assign',
    'dealers.payouts.view',
    'whatsapp.instances.read',
    'whatsapp.messages.send',
    'whatsapp.messages.read',
    'packages.read'
  )
ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;

-- EMPLOYEE (Level 4) - Basic operations only
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'EMPLOYEE'
  AND p.is_system = true
  AND p.name IN (
    'users.read',
    'whatsapp.instances.read',
    'whatsapp.messages.read',
    'packages.read'
  )
ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;

-- CUSTOMER (Level 5) - Very limited access
INSERT INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, true
FROM roles r, permissions p
WHERE r.name = 'CUSTOMER'
  AND p.is_system = true
  AND p.name IN (
    'whatsapp.instances.read',
    'whatsapp.messages.read'
  )
ON CONFLICT (role_id, permission_id) DO UPDATE SET granted = true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON role_permissions(role_id, permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON user_roles(user_id, role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);

-- Create a view for easy permission checking
CREATE OR REPLACE VIEW user_role_permissions AS
SELECT 
    u.id as user_id,
    u.email,
    u.name as user_name,
    r.name as role_name,
    r.level as role_level,
    p.name as permission_name,
    p.description as permission_description,
    p.category as permission_category,
    ur.is_primary
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u."isActive" = true 
  AND rp.granted = true
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

-- Test the simplified system
SELECT 'Simple Permission System Setup Complete!' as status;

-- Show summary
SELECT 
    'SUMMARY' as info,
    (SELECT COUNT(*) FROM users WHERE "isActive" = true) as active_users,
    (SELECT COUNT(*) FROM roles) as total_roles,
    (SELECT COUNT(*) FROM permissions WHERE is_system = true) as system_permissions,
    (SELECT COUNT(*) FROM role_permissions WHERE granted = true) as granted_permissions;