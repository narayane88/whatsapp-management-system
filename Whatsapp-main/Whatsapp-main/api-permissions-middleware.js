/**
 * ===============================================
 * WhatsApp Management System - API Permissions Middleware
 * Ready-to-use middleware for Node.js/Express applications
 * ===============================================
 */

const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// ===============================================
// DATABASE CONNECTION CONFIGURATION
// ===============================================
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'whatsapp_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// ===============================================
// PERMISSION CATEGORIES & MAPPINGS
// ===============================================
const PERMISSION_CATEGORIES = {
    USER_MANAGEMENT: 'User Management',
    ROLE_MANAGEMENT: 'Role Management', 
    PACKAGE_MANAGEMENT: 'Package Management',
    FINANCIAL: 'Financial',
    MESSAGING: 'Messaging',
    SYSTEM: 'System',
    ANALYTICS: 'Analytics',
    SUPPORT: 'Support',
    SERVER_MANAGEMENT: 'Server Management'
};

const PERMISSION_LEVELS = {
    READ: 'read',
    WRITE: 'write', 
    DELETE: 'delete',
    ADMIN: 'admin'
};

// ===============================================
// CORE AUTHENTICATION MIDDLEWARE
// ===============================================

/**
 * Verify JWT token and extract user information
 */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token is required',
            code: 'MISSING_TOKEN'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Fetch complete user information from database
        const [rows] = await pool.execute(`
            SELECT u.id, u.name, u.email, u.role_id, u.status, u.dealer_code,
                   r.name as role_name, r.display_name as role_display_name
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = ? AND u.status = 'active'
        `, [decoded.userId]);

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }

        req.user = {
            id: rows[0].id,
            name: rows[0].name,
            email: rows[0].email,
            roleId: rows[0].role_id,
            roleName: rows[0].role_name,
            roleDisplayName: rows[0].role_display_name,
            status: rows[0].status,
            dealerCode: rows[0].dealer_code
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({
            success: false,
            error: 'Invalid token',
            code: 'TOKEN_VERIFICATION_FAILED'
        });
    }
};

// ===============================================
// PERMISSION CHECKING UTILITIES
// ===============================================

/**
 * Get all permissions for a user
 */
const getUserPermissions = async (userId) => {
    const [rows] = await pool.execute(`
        SELECT DISTINCT p.id, p.name, p.description, p.category
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ? AND u.status = 'active'
        ORDER BY p.category, p.name
    `, [userId]);

    return rows;
};

/**
 * Check if user has specific permission
 */
const hasPermission = async (userId, permissionId) => {
    const [rows] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ? AND p.id = ? AND u.status = 'active'
    `, [userId, permissionId]);

    return rows[0].count > 0;
};

/**
 * Check if user has any permission in a category
 */
const hasCategoryPermission = async (userId, category) => {
    const [rows] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ? AND p.category = ? AND u.status = 'active'
    `, [userId, category]);

    return rows[0].count > 0;
};

/**
 * Check if user can manage another user (hierarchy check)
 */
const canManageUser = async (managerId, targetUserId) => {
    const [managerRows] = await pool.execute(`
        SELECT role_id, dealer_code FROM users WHERE id = ?
    `, [managerId]);
    
    const [targetRows] = await pool.execute(`
        SELECT role_id, parent_id FROM users WHERE id = ?
    `, [targetUserId]);

    if (managerRows.length === 0 || targetRows.length === 0) {
        return false;
    }

    const manager = managerRows[0];
    const target = targetRows[0];

    // Owner can manage everyone
    const [ownerRole] = await pool.execute(`
        SELECT id FROM roles WHERE name = 'OWNER'
    `);
    if (manager.role_id === ownerRole[0].id) return true;

    // SubDealer can manage their customers and employees
    const [subdealerRole] = await pool.execute(`
        SELECT id FROM roles WHERE name = 'SUBDEALER'
    `);
    if (manager.role_id === subdealerRole[0].id) {
        return target.parent_id === managerId;
    }

    return false;
};

// ===============================================
// PERMISSION MIDDLEWARE FUNCTIONS
// ===============================================

/**
 * Require specific permission
 */
const requirePermission = (permissionId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            const hasAccess = await hasPermission(req.user.id, permissionId);
            
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    error: `Permission denied. Required: ${permissionId}`,
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                error: 'Permission check failed',
                code: 'PERMISSION_CHECK_ERROR'
            });
        }
    };
};

/**
 * Require any permission from a list
 */
const requireAnyPermission = (permissionIds) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            let hasAccess = false;
            for (const permissionId of permissionIds) {
                if (await hasPermission(req.user.id, permissionId)) {
                    hasAccess = true;
                    break;
                }
            }

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    error: `Permission denied. Required one of: ${permissionIds.join(', ')}`,
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                error: 'Permission check failed',
                code: 'PERMISSION_CHECK_ERROR'
            });
        }
    };
};

/**
 * Require all permissions from a list
 */
const requireAllPermissions = (permissionIds) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            for (const permissionId of permissionIds) {
                if (!await hasPermission(req.user.id, permissionId)) {
                    return res.status(403).json({
                        success: false,
                        error: `Permission denied. Required: ${permissionId}`,
                        code: 'INSUFFICIENT_PERMISSIONS'
                    });
                }
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                error: 'Permission check failed',
                code: 'PERMISSION_CHECK_ERROR'
            });
        }
    };
};

/**
 * Require role-based access
 */
const requireRole = (roleNames) => {
    const roles = Array.isArray(roleNames) ? roleNames : [roleNames];
    
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!roles.includes(req.user.roleName)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Required role: ${roles.join(' or ')}`,
                code: 'INSUFFICIENT_ROLE'
            });
        }

        next();
    };
};

/**
 * Owner only access
 */
const requireOwner = requireRole('OWNER');

/**
 * SubDealer or higher access
 */
const requireSubDealerOrHigher = requireRole(['OWNER', 'SUBDEALER']);

/**
 * Employee or higher access
 */
const requireEmployeeOrHigher = requireRole(['OWNER', 'SUBDEALER', 'EMPLOYEE']);

/**
 * Check resource ownership or management rights
 */
const requireResourceAccess = (resourceType) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            const resourceId = req.params.id || req.body.id;
            if (!resourceId) {
                return res.status(400).json({
                    success: false,
                    error: 'Resource ID required',
                    code: 'MISSING_RESOURCE_ID'
                });
            }

            let hasAccess = false;

            switch (resourceType) {
                case 'user':
                    // Check if user can manage the target user
                    hasAccess = await canManageUser(req.user.id, resourceId);
                    break;
                    
                case 'self':
                    // User can only access their own data
                    hasAccess = (req.user.id == resourceId);
                    break;
                    
                default:
                    hasAccess = false;
            }

            // Owner can access everything
            if (req.user.roleName === 'OWNER') {
                hasAccess = true;
            }

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied to this resource',
                    code: 'RESOURCE_ACCESS_DENIED'
                });
            }

            next();
        } catch (error) {
            console.error('Resource access check error:', error);
            res.status(500).json({
                success: false,
                error: 'Resource access check failed',
                code: 'RESOURCE_ACCESS_ERROR'
            });
        }
    };
};

// ===============================================
// DEALER CODE VALIDATION MIDDLEWARE
// ===============================================

/**
 * Validate dealer code for customer operations
 */
const validateDealerCode = async (req, res, next) => {
    try {
        const dealerCode = req.body.dealerCode || req.params.dealerCode;
        
        if (!dealerCode) {
            return res.status(400).json({
                success: false,
                error: 'Dealer code is required',
                code: 'MISSING_DEALER_CODE'
            });
        }

        // Validate dealer code format
        const dealerCodeRegex = /^WA-[A-Z]{4}-[0-9]{4}$/;
        if (!dealerCodeRegex.test(dealerCode)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid dealer code format. Expected: WA-XXXX-YYYY',
                code: 'INVALID_DEALER_CODE_FORMAT'
            });
        }

        // Check if dealer exists and is active
        const [rows] = await pool.execute(`
            SELECT u.id, u.name, u.email, u.status
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.dealer_code = ? AND r.name = 'SUBDEALER' AND u.status = 'active'
        `, [dealerCode]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Dealer code not found or inactive',
                code: 'DEALER_NOT_FOUND'
            });
        }

        req.dealer = rows[0];
        next();
    } catch (error) {
        console.error('Dealer validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Dealer validation failed',
            code: 'DEALER_VALIDATION_ERROR'
        });
    }
};

// ===============================================
// RATE LIMITING BY ROLE
// ===============================================

const rateLimitByRole = {
    OWNER: { requests: 1000, window: 60000 }, // 1000 requests per minute
    SUBDEALER: { requests: 500, window: 60000 }, // 500 requests per minute
    EMPLOYEE: { requests: 200, window: 60000 }, // 200 requests per minute
    CUSTOMER: { requests: 100, window: 60000 } // 100 requests per minute
};

const requestCounts = new Map();

const roleBasedRateLimit = (req, res, next) => {
    if (!req.user) {
        return next();
    }

    const userRole = req.user.roleName;
    const userId = req.user.id;
    const now = Date.now();
    
    const limit = rateLimitByRole[userRole] || rateLimitByRole.CUSTOMER;
    const key = `${userId}_${userRole}`;
    
    if (!requestCounts.has(key)) {
        requestCounts.set(key, { count: 1, resetTime: now + limit.window });
        return next();
    }
    
    const userLimit = requestCounts.get(key);
    
    if (now > userLimit.resetTime) {
        userLimit.count = 1;
        userLimit.resetTime = now + limit.window;
        return next();
    }
    
    if (userLimit.count >= limit.requests) {
        return res.status(429).json({
            success: false,
            error: `Rate limit exceeded for ${userRole}. Max ${limit.requests} requests per minute.`,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
        });
    }
    
    userLimit.count++;
    next();
};

// ===============================================
// AUDIT LOGGING MIDDLEWARE
// ===============================================

const auditLog = (action, resourceType = null) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        
        res.json = function(data) {
            // Log the action after response
            if (req.user && res.statusCode < 400) {
                logUserAction(req.user.id, action, resourceType, {
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    params: req.params,
                    query: req.query,
                    statusCode: res.statusCode
                }).catch(console.error);
            }
            
            originalJson.call(this, data);
        };
        
        next();
    };
};

const logUserAction = async (userId, action, resourceType, metadata) => {
    try {
        await pool.execute(`
            INSERT INTO audit_logs (user_id, action, resource_type, metadata, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [
            userId,
            action,
            resourceType,
            JSON.stringify(metadata),
            metadata.ip,
            metadata.userAgent
        ]);
    } catch (error) {
        console.error('Audit logging error:', error);
    }
};

// ===============================================
// COMBINED MIDDLEWARE FUNCTIONS
// ===============================================

/**
 * Complete user management access control
 */
const userManagementAccess = [
    authenticateToken,
    requirePermission('users.view'),
    roleBasedRateLimit,
    auditLog('user_access', 'user')
];

/**
 * Complete messaging access control
 */
const messagingAccess = [
    authenticateToken,
    requirePermission('messages.send'),
    roleBasedRateLimit,
    auditLog('message_send', 'message')
];

/**
 * Complete financial access control
 */
const financialAccess = [
    authenticateToken,
    requireAnyPermission(['transactions.view', 'billing.view', 'payouts.view']),
    roleBasedRateLimit,
    auditLog('financial_access', 'financial')
];

// ===============================================
// API ROUTE EXAMPLES
// ===============================================

/**
 * Example usage in Express routes:
 * 
 * // User Management Routes
 * app.get('/api/users', userManagementAccess, getUsersController);
 * app.post('/api/users', [authenticateToken, requirePermission('users.create')], createUserController);
 * app.put('/api/users/:id', [authenticateToken, requirePermission('users.edit'), requireResourceAccess('user')], updateUserController);
 * app.delete('/api/users/:id', [authenticateToken, requirePermission('users.delete'), requireResourceAccess('user')], deleteUserController);
 * 
 * // Role Management Routes
 * app.get('/api/roles', [authenticateToken, requirePermission('roles.view')], getRolesController);
 * app.post('/api/roles', [authenticateToken, requireRole('OWNER')], createRoleController);
 * 
 * // Messaging Routes
 * app.post('/api/messages/send', messagingAccess, sendMessageController);
 * app.get('/api/messages', [authenticateToken, requirePermission('messages.view')], getMessagesController);
 * 
 * // Financial Routes
 * app.get('/api/transactions', financialAccess, getTransactionsController);
 * app.post('/api/payouts', [authenticateToken, requirePermission('payouts.create'), requireSubDealerOrHigher], createPayoutController);
 * 
 * // Customer Registration with Dealer Code
 * app.post('/api/customers/register', [validateDealerCode], registerCustomerController);
 */

// ===============================================
// UTILITY FUNCTIONS FOR CONTROLLERS
// ===============================================

/**
 * Get user's permission list (for frontend)
 */
const getUserPermissionsList = async (req, res) => {
    try {
        const permissions = await getUserPermissions(req.user.id);
        res.json({
            success: true,
            data: {
                permissions,
                role: req.user.roleName,
                roleDisplayName: req.user.roleDisplayName
            }
        });
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch permissions'
        });
    }
};

/**
 * Check specific permission (for frontend)
 */
const checkPermissionEndpoint = async (req, res) => {
    try {
        const { permission } = req.params;
        const hasAccess = await hasPermission(req.user.id, permission);
        
        res.json({
            success: true,
            data: {
                permission,
                hasAccess
            }
        });
    } catch (error) {
        console.error('Error checking permission:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check permission'
        });
    }
};

// ===============================================
// EXPORT ALL MIDDLEWARE AND UTILITIES
// ===============================================

module.exports = {
    // Core authentication
    authenticateToken,
    
    // Permission checking utilities
    getUserPermissions,
    hasPermission,
    hasCategoryPermission,
    canManageUser,
    
    // Permission middleware
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
    requireRole,
    requireOwner,
    requireSubDealerOrHigher,
    requireEmployeeOrHigher,
    requireResourceAccess,
    
    // Specialized middleware
    validateDealerCode,
    roleBasedRateLimit,
    auditLog,
    
    // Combined middleware
    userManagementAccess,
    messagingAccess,
    financialAccess,
    
    // Utility endpoints
    getUserPermissionsList,
    checkPermissionEndpoint,
    
    // Constants
    PERMISSION_CATEGORIES,
    PERMISSION_LEVELS
};

// ===============================================
// EXAMPLE INTEGRATION
// ===============================================

/**
 * Complete example of integrating this middleware:
 * 
 * const express = require('express');
 * const permissions = require('./api-permissions-middleware');
 * 
 * const app = express();
 * 
 * // Apply authentication to all API routes
 * app.use('/api', permissions.authenticateToken);
 * 
 * // User management routes
 * app.get('/api/users', permissions.requirePermission('users.view'), (req, res) => {
 *     // Your controller logic here
 * });
 * 
 * app.post('/api/users', permissions.requirePermission('users.create'), (req, res) => {
 *     // Your controller logic here
 * });
 * 
 * // Get current user's permissions (for frontend)
 * app.get('/api/auth/permissions', permissions.getUserPermissionsList);
 * 
 * // Check specific permission
 * app.get('/api/auth/check/:permission', permissions.checkPermissionEndpoint);
 * 
 * app.listen(3000, () => {
 *     console.log('Server running with permission middleware');
 * });
 */