/**
 * Dynamic permission system that uses real database permissions
 * Replaces the hardcoded compiled system with database-driven permissions
 */

interface DatabasePermission {
  id: number
  name: string
  description?: string
}

interface DatabaseRole {
  id: number
  name: string
  level: number
}

interface RolePermission {
  role_name: string
  permission_name: string
  granted: boolean
}

/**
 * Dynamic Permission Manager - Uses real database permissions
 */
class DynamicPermissionManager {
  private permissions: Map<string, DatabasePermission> = new Map()
  private roles: Map<string, DatabaseRole> = new Map() 
  private rolePermissions: Map<string, Set<string>> = new Map()
  private userRole: string = ''
  private userCustomPermissions: Set<string> = new Set()
  private isInitialized = false

  /**
   * Initialize with database permissions
   */
  async initialize(): Promise<void> {
    try {
      const response = await fetch('/api/auth/user-permissions')
      if (!response.ok) throw new Error('Failed to fetch user permissions')
      
      const data = await response.json()
      
      // Load user permissions directly from the auth API response
      this.userCustomPermissions.clear()
      if (data.permissions && Array.isArray(data.permissions)) {
        data.permissions.forEach((permission: string) => {
          this.userCustomPermissions.add(permission)
        })
      }
      
      // Set user role from the response
      this.userRole = data.role || ''

      this.isInitialized = true
      console.log(`✅ Dynamic permissions initialized: ${this.userCustomPermissions.size} user permissions, role: ${this.userRole}`)
      
    } catch (error) {
      console.error('❌ Failed to initialize dynamic permissions:', error)
      throw error
    }
  }

  /**
   * Set user role for permission checking
   */
  setUserRole(role: string): void {
    this.userRole = this.normalizeRole(role)
  }

  /**
   * Set custom user permissions (for non-role-based users)
   */
  setUserCustomPermissions(permissions: string[]): void {
    this.userCustomPermissions.clear()
    permissions.forEach(perm => this.userCustomPermissions.add(perm))
  }

  /**
   * Normalize role names to handle database variations
   */
  private normalizeRole(role: string): string {
    if (!role) return ''
    
    const normalized = role.toUpperCase().replace(/\s+/g, '')
    
    // Map database variations to standard role names
    if (normalized === 'SHREEDELALER' || normalized === 'DELALER' || normalized === 'DEALER') {
      return 'SUBDEALER'
    }
    
    return normalized
  }

  /**
   * Check if user has permission
   */
  hasPermission(permissionName: string): boolean {
    if (!this.isInitialized) {
      console.warn('⚠️ Permission manager not initialized')
      return false
    }

    // OWNER always has all permissions
    if (this.userRole === 'OWNER') return true

    // Check if user has this permission (already includes both role and direct permissions from backend)
    return this.userCustomPermissions.has(permissionName)
  }

  /**
   * Check if user has all permissions
   */
  hasAllPermissions(permissionNames: string[]): boolean {
    return permissionNames.every(perm => this.hasPermission(perm))
  }

  /**
   * Check if user has any of the permissions
   */
  hasAnyPermission(permissionNames: string[]): boolean {
    return permissionNames.some(perm => this.hasPermission(perm))
  }

  /**
   * Get all available permissions
   */
  getAllPermissions(): DatabasePermission[] {
    return Array.from(this.permissions.values())
  }

  /**
   * Get user's effective permissions
   */
  getUserPermissions(): string[] {
    if (!this.isInitialized) return []

    const permissions: Set<string> = new Set()

    // Add role-based permissions
    if (this.userRole && this.rolePermissions.has(this.userRole)) {
      const rolePerms = this.rolePermissions.get(this.userRole)!
      rolePerms.forEach(perm => permissions.add(perm))
    }

    // Add custom permissions
    this.userCustomPermissions.forEach(perm => permissions.add(perm))

    return Array.from(permissions)
  }

  /**
   * Get permissions by category (based on naming pattern)
   */
  getPermissionsByCategory(): Record<string, DatabasePermission[]> {
    const categories: Record<string, DatabasePermission[]> = {}
    
    this.permissions.forEach(permission => {
      const parts = permission.name.split('.')
      const category = parts[0] || 'other'
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1)
      
      if (!categories[categoryName]) {
        categories[categoryName] = []
      }
      categories[categoryName].push(permission)
    })

    return categories
  }

  /**
   * Get role information
   */
  getRoleInfo(roleName: string): DatabaseRole | undefined {
    return this.roles.get(this.normalizeRole(roleName))
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }
}

// Global instance
export const dynamicPermissionManager = new DynamicPermissionManager()

/**
 * Route to permission mapping for dynamic permissions
 */
export const DYNAMIC_ROUTE_PERMISSIONS = new Map<string, string[]>([
  ['/admin', ['dashboard.admin.access']],
  ['/admin/users', ['users.page.access']],
  ['/admin/customers', ['customers.page.access']],
  ['/admin/transactions', ['transactions.page.access']],
  ['/admin/subscriptions', ['subscriptions.page.access']],
  ['/admin/vouchers', ['vouchers.page.access']],
  ['/admin/servers', ['servers.page.access']],
  ['/admin/bizpoints', ['bizpoints.page.access']],
  ['/admin/api-docs', ['api.docs.page.access']],
  ['/admin/packages', ['packages.page.access']],
  ['/admin/languages', ['languages.page.access']],
  ['/admin/settings', ['settings.page.access']],
])

/**
 * Dynamic permission check function
 */
export function dynamicHasPermission(permission: string): boolean {
  return dynamicPermissionManager.hasPermission(permission)
}

/**
 * Dynamic multiple permission check
 */
export function dynamicHasAllPermissions(permissions: string[]): boolean {
  return dynamicPermissionManager.hasAllPermissions(permissions)
}

/**
 * Dynamic route permission check
 */
export function dynamicCheckRoutePermission(route: string): boolean {
  const requiredPermissions = DYNAMIC_ROUTE_PERMISSIONS.get(route)
  if (!requiredPermissions) return true
  
  return dynamicPermissionManager.hasAllPermissions(requiredPermissions)
}