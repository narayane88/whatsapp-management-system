-- Cleanup script to remove old compiled permission system

-- Drop any compiled permission tables if they exist
DROP TABLE IF EXISTS compiled_permissions CASCADE;
DROP TABLE IF EXISTS compiled_user_permissions CASCADE;
DROP TABLE IF EXISTS compiled_role_permissions CASCADE;

-- Drop any compiled permission functions if they exist
DROP FUNCTION IF EXISTS user_has_permission_simple(text, text) CASCADE;
DROP FUNCTION IF EXISTS get_compiled_permissions(text) CASCADE;
DROP FUNCTION IF EXISTS check_compiled_permission(text, text) CASCADE;

-- Clean up any old permission-related views
DROP VIEW IF EXISTS user_compiled_permissions CASCADE;
DROP VIEW IF EXISTS role_compiled_permissions CASCADE;

-- Remove any old indexes related to compiled permissions
DROP INDEX IF EXISTS idx_compiled_permissions_name;
DROP INDEX IF EXISTS idx_compiled_user_permissions_user_email;
DROP INDEX IF EXISTS idx_compiled_role_permissions_role;

-- Show remaining permission-related tables (should only be the new dynamic ones)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%permission%'
ORDER BY table_name;

-- Show current permission system tables structure
\d permissions;
\d role_permissions; 
\d user_permissions;

-- Count of records in each table
SELECT 'permissions' as table_name, count(*) as count FROM permissions
UNION ALL
SELECT 'role_permissions', count(*) FROM role_permissions
UNION ALL  
SELECT 'user_permissions', count(*) FROM user_permissions
ORDER BY table_name;