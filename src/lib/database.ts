/**
 * Centralized Database Utilities
 * 
 * This module provides a unified database connection and common query patterns
 * to eliminate code duplication across API routes and ensure cross-platform compatibility.
 */

import { Pool, PoolConfig } from 'pg'
import { getDatabaseConfig, getSSLConfig } from './db-config'

// Cross-platform database configuration
const createDatabaseConfig = (): PoolConfig => {
  // Use centralized database configuration
  const baseConfig = getDatabaseConfig();
  
  // Add connection pool settings
  return {
    ...baseConfig,
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '5'),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT || '10000'),
  }
}

// Singleton database connection pool
let pool: Pool | null = null

export const getDbPool = (): Pool => {
  if (!pool) {
    pool = new Pool(createDatabaseConfig())
    
    // Handle connection errors
    pool.on('error', (err) => {
      console.error('💥 Database connection error:', err)
    })
    
    pool.on('connect', () => {
      console.log('✅ Database connection established')
    })
  }
  
  return pool
}

// Common database operations
export class DatabaseService {
  private pool: Pool

  constructor() {
    this.pool = getDbPool()
  }

  /**
   * Get current user with role information
   */
  async getCurrentUser(email: string) {
    const result = await this.pool.query(`
      SELECT 
        u.id as user_id, 
        u.email, 
        u.name,
        r.level, 
        r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id AND ur.is_primary = true
      JOIN roles r ON ur.role_id = r.id
      WHERE LOWER(u.email) = LOWER($1) AND u."isActive" = true
      LIMIT 1
    `, [email])

    return result.rows.length > 0 ? result.rows[0] : null
  }

  /**
   * Check if user has specific permission
   */
  async hasUserPermission(userId: number, permissionName: string): Promise<boolean> {
    const result = await this.pool.query(`
      SELECT COUNT(*) as count
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1 AND p.name = $2
    `, [userId, permissionName])

    return parseInt(result.rows[0].count) > 0
  }

  /**
   * Get user's permissions
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    const result = await this.pool.query(`
      SELECT p.name
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1
      ORDER BY p.name
    `, [userId])

    return result.rows.map(row => row.name)
  }

  /**
   * Apply hierarchical access filtering for users
   */
  getHierarchicalUserFilter(currentUserLevel: number, currentUserId: number, accessType: string = 'filtered'): string {
    if (currentUserLevel === 1) {
      // Level 1 (SUPER USER) - No filtering
      return ''
    } else if (currentUserLevel === 2) {
      // Level 2 (ADMIN) - Configurable access
      if (accessType === 'full') {
        return ''
      } else {
        return ` AND (u.id = ${currentUserId} OR u."parentId" = ${currentUserId})`
      }
    } else if (currentUserLevel === 3) {
      // Level 3 (SUBDEALER) - Self + assigned customers
      return ` AND (u.id = ${currentUserId} OR u."parentId" = ${currentUserId})`
    } else {
      // Level 4+ - Self only
      return ` AND u.id = ${currentUserId}`
    }
  }

  /**
   * Execute query with error handling
   */
  async safeQuery(query: string, params: any[] = []) {
    try {
      return await this.pool.query(query, params)
    } catch (error) {
      console.error('💥 Database query error:', {
        query: query.substring(0, 100) + '...',
        params,
        error: error instanceof Error ? error.message : error
      })
      throw error
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1')
      return true
    } catch (error) {
      console.error('💥 Database connection test failed:', error)
      return false
    }
  }

  /**
   * Close database connection (for graceful shutdown)
   */
  async close() {
    if (pool) {
      await pool.end()
      pool = null
    }
  }
}

// Export singleton instance
export const db = new DatabaseService()

// Utility types for better TypeScript support
export interface UserWithRole {
  user_id: number
  email: string
  name: string
  level: number
  role_name: string
}

export interface PermissionCheck {
  hasPermission: boolean
  userLevel: number
  roleName: string
}

// Cross-platform compatibility helpers
export const isPlatformLinux = (): boolean => {
  return process.platform === 'linux'
}

export const isPlatformWindows = (): boolean => {
  return process.platform === 'win32'
}

export const getOptimalPoolSize = (): number => {
  // Adjust pool size based on platform and environment
  if (process.env.NODE_ENV === 'production') {
    return isPlatformLinux() ? 20 : 15
  }
  return isPlatformWindows() ? 10 : 8
}