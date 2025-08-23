import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db, DatabaseService, UserWithRole } from '@/lib/database'

// Simple role-based permission checking function using centralized database
export async function hasPermission(userEmail: string, requiredPermission: string): Promise<boolean> {
  try {
    // Normalize email to lowercase for consistency
    const normalizedEmail = userEmail.toLowerCase().trim()

    const user = await db.getCurrentUser(normalizedEmail)
    if (!user) {
      console.log(`🔒 Permission check failed: User not found for '${normalizedEmail}'`)
      return false
    }

    const hasAccess = await db.hasUserPermission(user.user_id, requiredPermission)
    
    if (hasAccess) {
      console.log(`✅ Permission granted: '${requiredPermission}' for user '${normalizedEmail}'`)
    } else {
      console.log(`❌ Permission denied: '${requiredPermission}' for user '${normalizedEmail}' (Level ${user.level} - ${user.role_name})`)
    }

    return hasAccess
  } catch (error) {
    console.error('💥 Permission check error:', error)
    return false
  }
}

// Get current user's permissions using centralized database
export async function getCurrentUserPermissions(): Promise<string[]> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return []
    }

    const user = await db.getCurrentUser(session.user.email)
    if (!user) {
      return []
    }

    return await db.getUserPermissions(user.user_id)
  } catch (error) {
    console.error('💥 Error getting user permissions:', error)
    return []
  }
}

// Check if current session user has permission
export async function checkCurrentUserPermission(requiredPermission: string): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {

      return false
    }

    return await hasPermission(session.user.email, requiredPermission)
  } catch (error) {

    return false
  }
}

// Get user details with roles and permissions using centralized database
export async function getCurrentUserDetails() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return null
    }

    const user = await db.getCurrentUser(session.user.email)
    if (!user) {
      return null
    }

    const permissions = await db.getUserPermissions(user.user_id)

    return {
      id: user.user_id,
      name: user.name,
      email: user.email,
      isActive: true,
      primary_role: user.role_name,
      role_level: user.level,
      permissions
    }
  } catch (error) {
    console.error('💥 Error getting user details:', error)
    return null
  }
}

// Common permission constants to prevent typos
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_ADMIN_READ: 'dashboard.admin.read',
  
  // Users
  USERS_PAGE_ACCESS: 'users.page.access',
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  
  // Customers
  CUSTOMERS_PAGE_ACCESS: 'customers.page.access',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_UPDATE: 'customers.update',
  
  // Packages
  PACKAGES_PAGE_ACCESS: 'packages.page.access',
  PACKAGES_CREATE: 'packages.create.button',
  PACKAGES_READ: 'packages.read',
  
  // BizPoints
  BIZPOINTS_PAGE_ACCESS: 'bizpoints.page.access',
  BIZPOINTS_ADD: 'bizpoints.add.button',
  
  // Company
  COMPANY_PROFILE_READ: 'company.profile.read',
  COMPANY_PROFILE_UPDATE: 'company.profile.update',
  
  // Subscriptions
  SUBSCRIPTIONS_PAGE_ACCESS: 'subscriptions.page.access',
  
  // Transactions
  TRANSACTIONS_PAGE_ACCESS: 'transactions.page.access',
  TRANSACTIONS_READ: 'transactions.read',
} as const

// Type for permission names
export type PermissionName = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Utility to generate standardized permission error response
export function generatePermissionErrorResponse(
  requiredPermission: string,
  userEmail: string,
  context: string = 'operation'
) {
  return {
    error: 'Insufficient permissions',
    details: process.env.NODE_ENV === 'development' ? {
      requiredPermission,
      userEmail,
      message: `User does not have the required permission to ${context}`
    } : undefined
  }
}