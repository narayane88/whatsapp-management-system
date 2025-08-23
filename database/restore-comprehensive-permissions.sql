-- Restore Comprehensive User Permission System
-- This restores direct user permissions alongside role-based permissions

-- Create User-specific Permissions table (direct user permissions)
CREATE TABLE IF NOT EXISTS user_permissions (
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

-- Create comprehensive permission checking function
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

-- Create permission templates for easy assignment
CREATE TABLE IF NOT EXISTS permission_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions INTEGER[] NOT NULL, -- Array of permission IDs
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_system BOOLEAN DEFAULT false
);

-- Insert basic permission templates
INSERT INTO permission_templates (name, description, permissions, is_system) VALUES
('Basic User', 'Standard user permissions for new accounts', ARRAY[
    (SELECT id FROM permissions WHERE name = 'users.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.read')
], true),

('Power User', 'Extended permissions for experienced users', ARRAY[
    (SELECT id FROM permissions WHERE name = 'users.read'),
    (SELECT id FROM permissions WHERE name = 'users.update'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.send'),
    (SELECT id FROM permissions WHERE name = 'packages.read')
], true),

('Manager', 'Management level permissions', ARRAY[
    (SELECT id FROM permissions WHERE name = 'users.read'),
    (SELECT id FROM permissions WHERE name = 'users.create'),
    (SELECT id FROM permissions WHERE name = 'users.update'),
    (SELECT id FROM permissions WHERE name = 'roles.read'),
    (SELECT id FROM permissions WHERE name = 'permissions.view'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.create'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.instances.read'),
    (SELECT id FROM permissions WHERE name = 'whatsapp.messages.send'),
    (SELECT id FROM permissions WHERE name = 'packages.read'),
    (SELECT id FROM permissions WHERE name = 'packages.create')
], true)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_granted ON user_permissions(granted);

-- Create a comprehensive view for user permissions
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
    up.assigned_at as direct_assigned_at
FROM users u
CROSS JOIN permissions p
LEFT JOIN user_permissions up ON u.id = up.user_id AND p.id = up.permission_id
LEFT JOIN (
    SELECT 
        ur.user_id,
        rp.permission_id,
        bool_or(rp.granted) as has_role_permission
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.expires_at IS NULL OR ur.expires_at > NOW()
    GROUP BY ur.user_id, rp.permission_id
) rp_agg ON u.id = rp_agg.user_id AND p.id = rp_agg.permission_id
WHERE u."isActive" = true;

-- Show summary
SELECT 'Comprehensive Permission System Restored!' as status;

SELECT 
    'SUMMARY' as info,
    (SELECT COUNT(*) FROM permissions) as total_permissions,
    (SELECT COUNT(*) FROM permission_templates) as permission_templates,
    (SELECT COUNT(*) FROM user_permissions) as direct_user_permissions;