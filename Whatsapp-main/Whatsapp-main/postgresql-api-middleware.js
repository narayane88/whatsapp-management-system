/**
 * ===============================================
 * WhatsApp Management System - PostgreSQL API Permissions Middleware
 * Ready-to-use middleware for Node.js/Express with PostgreSQL
 * ===============================================
 */

const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// ===============================================
// POSTGRESQL CONNECTION CONFIGURATION
// ===============================================
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'whatsapp_system',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
    connectionTimeoutMillis: 2000, // How long to try getting connection
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

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
    SERVER_MANAGEMENT: 'Server Management',
    DEALER_MANAGEMENT: 'Dealer Management'
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
        const result = await pool.query(`
            SELECT u.id, u.uuid, u.name, u.email, u.role_id, u.status, u.dealer_code,
                   r.name as role_name, r.display_name as role_display_name
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = $1 AND u.status = 'active'
        `, [decoded.userId]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }

        const user = result.rows[0];
        req.user = {
            id: user.id,
            uuid: user.uuid,
            name: user.name,
            email: user.email,
            roleId: user.role_id,
            roleName: user.role_name,
            roleDisplayName: user.role_display_name,
            status: user.status,
            dealerCode: user.dealer_code
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
 * Get all permissions for a user using PostgreSQL function
 */
const getUserPermissions = async (userId) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT p.id, p.name, p.description, p.category
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE u.id = $1 AND u.status = 'active'
            ORDER BY p.category, p.name
        `, [userId]);

        return result.rows;
    } catch (error) {
        console.error('Error getting user permissions:', error);
        throw error;
    }
};

/**
 * Check if user has specific permission using PostgreSQL function
 */
const hasPermission = async (userId, permissionId) => {
    try {
        const result = await pool.query(`
            SELECT COUNT(*) as count
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE u.id = $1 AND p.id = $2 AND u.status = 'active'
        `, [userId, permissionId]);

        return parseInt(result.rows[0].count) > 0;
    } catch (error) {
        console.error('Error checking permission:', error);
        throw error;
    }
};

/**
 * Check if user has any permission in a category
 */
const hasCategoryPermission = async (userId, category) => {
    try {
        const result = await pool.query(`
            SELECT COUNT(*) as count
            FROM users u
            JOIN roles r ON u.role_id = r.id
            JOIN role_permissions rp ON r.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE u.id = $1 AND p.category = $2 AND u.status = 'active'
        `, [userId, category]);

        return parseInt(result.rows[0].count) > 0;
    } catch (error) {
        console.error('Error checking category permission:', error);
        throw error;
    }
};

/**
 * Check if user can manage another user (hierarchy check)
 */
const canManageUser = async (managerId, targetUserId) => {
    try {
        const managerResult = await pool.query(`
            SELECT u.role_id, u.dealer_code, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1
        `, [managerId]);
        
        const targetResult = await pool.query(`
            SELECT u.role_id, u.parent_id, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = $1
        `, [targetUserId]);

        if (managerResult.rows.length === 0 || targetResult.rows.length === 0) {
            return false;
        }

        const manager = managerResult.rows[0];
        const target = targetResult.rows[0];

        // Owner can manage everyone
        if (manager.role_name === 'OWNER') return true;

        // SubDealer can manage their customers and employees
        if (manager.role_name === 'SUBDEALER') {
            return target.parent_id === managerId;
        }

        // Manager can manage employees and customers under them
        if (manager.role_name === 'MANAGER') {
            return target.parent_id === managerId && 
                   ['EMPLOYEE', 'CUSTOMER'].includes(target.role_name);
        }

        return false;
    } catch (error) {
        console.error('Error checking user management permission:', error);
        return false;
    }
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
        const result = await pool.query(`
            SELECT u.id, u.name, u.email, u.status
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.dealer_code = $1 AND r.name = 'SUBDEALER' AND u.status = 'active'
        `, [dealerCode]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Dealer code not found or inactive',
                code: 'DEALER_NOT_FOUND'
            });
        }

        req.dealer = result.rows[0];
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
// RATE LIMITING BY ROLE (Redis recommended for production)
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
        await pool.query(`
            INSERT INTO audit_logs (user_id, action, resource_type, metadata, ip_address, user_agent, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
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
// SESSION MANAGEMENT
// ===============================================

/**
 * Update user session activity
 */
const updateSession = async (req, res, next) => {
    if (req.user) {
        try {
            const sessionId = req.headers['x-session-id'] || req.sessionID || `session_${req.user.id}_${Date.now()}`;
            
            await pool.query(`
                INSERT INTO user_sessions (id, user_id, ip_address, user_agent, payload, last_activity)
                VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT (id) 
                DO UPDATE SET last_activity = NOW(), payload = $5
            `, [
                sessionId,
                req.user.id,
                req.ip,
                req.headers['user-agent'],
                JSON.stringify({
                    route: req.path,
                    method: req.method
                })
            ]);
        } catch (error) {
            console.error('Session update error:', error);
            // Don't block request on session update failure
        }
    }
    next();
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
    updateSession,
    auditLog('user_access', 'user')
];

/**
 * Complete messaging access control
 */
const messagingAccess = [
    authenticateToken,
    requirePermission('messages.send'),
    roleBasedRateLimit,
    updateSession,
    auditLog('message_send', 'message')
];

/**
 * Complete financial access control
 */
const financialAccess = [
    authenticateToken,
    requireAnyPermission(['transactions.view', 'billing.view', 'payouts.view']),
    roleBasedRateLimit,
    updateSession,
    auditLog('financial_access', 'financial')
];

// ===============================================
// UTILITY FUNCTIONS FOR CONTROLLERS
// ===============================================

/**
 * Get user's permission list (for frontend)
 */
const getUserPermissionsList = async (req, res) => {
    try {
        const permissions = await getUserPermissions(req.user.id);
        
        // Get role details
        const roleResult = await pool.query(`
            SELECT r.name, r.display_name, r.description, r.is_system_role
            FROM roles r
            WHERE r.id = $1
        `, [req.user.roleId]);

        res.json({
            success: true,
            data: {
                permissions,
                role: {
                    name: req.user.roleName,
                    displayName: req.user.roleDisplayName,
                    description: roleResult.rows[0]?.description,
                    isSystemRole: roleResult.rows[0]?.is_system_role
                },
                user: {
                    id: req.user.id,
                    uuid: req.user.uuid,
                    name: req.user.name,
                    email: req.user.email,
                    dealerCode: req.user.dealerCode
                }
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

/**
 * Get role permission matrix (for admin)
 */
const getRolePermissionMatrix = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.name as role_name, r.display_name, 
                   ARRAY_AGG(p.id ORDER BY p.category, p.name) as permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            GROUP BY r.id, r.name, r.display_name
            ORDER BY r.name
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching role permission matrix:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch role permission matrix'
        });
    }
};

// ===============================================
// DEALER SPECIFIC FUNCTIONS
// ===============================================

/**
 * Get dealer performance data
 */
const getDealerPerformance = async (req, res) => {
    try {
        const dealerId = req.params.dealerId || req.user.id;
        
        // Check if user can access this dealer's data
        if (dealerId !== req.user.id && req.user.roleName !== 'OWNER') {
            return res.status(403).json({
                success: false,
                error: 'Access denied to dealer performance data',
                code: 'DEALER_ACCESS_DENIED'
            });
        }

        const result = await pool.query(`
            SELECT * FROM dealer_performance_view WHERE dealer_id = $1
        `, [dealerId]);

        res.json({
            success: true,
            data: result.rows[0] || null
        });
    } catch (error) {
        console.error('Error fetching dealer performance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dealer performance'
        });
    }
};

// ===============================================
// CLEANUP FUNCTIONS
// ===============================================

/**
 * Clean up expired sessions (call periodically)
 */
const cleanupExpiredSessions = async () => {
    try {
        const result = await pool.query(`
            DELETE FROM user_sessions 
            WHERE last_activity < NOW() - INTERVAL '7 days'
            RETURNING id
        `);
        
        console.log(`Cleaned up ${result.rowCount} expired sessions`);
    } catch (error) {
        console.error('Error cleaning up sessions:', error);
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
    updateSession,
    
    // Combined middleware
    userManagementAccess,
    messagingAccess,
    financialAccess,
    
    // Utility endpoints
    getUserPermissionsList,
    checkPermissionEndpoint,
    getRolePermissionMatrix,
    getDealerPerformance,
    
    // Cleanup functions
    cleanupExpiredSessions,
    
    // Database pool for direct access
    pool,
    
    // Constants
    PERMISSION_CATEGORIES,
    PERMISSION_LEVELS
};

// ===============================================
// EXAMPLE INTEGRATION FOR EXPRESS APP
// ===============================================

/**
 * Complete example of integrating this middleware:
 * 
 * const express = require('express');
 * const permissions = require('./postgresql-api-middleware');
 * 
 * const app = express();
 * app.use(express.json());
 * 
 * // Apply authentication to all API routes
 * app.use('/api', permissions.authenticateToken);
 * 
 * // User management routes
 * app.get('/api/users', permissions.userManagementAccess, (req, res) => {
 *     // Your controller logic here
 * });
 * 
 * app.post('/api/users', [
 *     permissions.requirePermission('users.create'),
 *     permissions.auditLog('user_create', 'user')
 * ], (req, res) => {
 *     // Your controller logic here
 * });
 * 
 * // Authentication endpoints
 * app.get('/api/auth/permissions', permissions.authenticateToken, permissions.getUserPermissionsList);
 * app.get('/api/auth/check/:permission', permissions.authenticateToken, permissions.checkPermissionEndpoint);
 * app.get('/api/admin/role-matrix', permissions.requireOwner, permissions.getRolePermissionMatrix);
 * 
 * // Dealer endpoints
 * app.get('/api/dealers/:dealerId/performance', permissions.requireSubDealerOrHigher, permissions.getDealerPerformance);
 * 
 * // Customer registration with dealer validation
 * app.post('/api/customers/register', permissions.validateDealerCode, (req, res) => {
 *     // req.dealer will contain validated dealer info
 * });
 * 
 * // Start cleanup job
 * setInterval(permissions.cleanupExpiredSessions, 24 * 60 * 60 * 1000); // Daily
 * 
 * app.listen(3000, () => {
 *     console.log('Server running with PostgreSQL permission middleware');
 * });
 */