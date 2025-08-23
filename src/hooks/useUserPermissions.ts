import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { User, SessionUser } from '@/types/user'

// Define specific permissions for user management tasks
export interface UserPermissions {
  canViewUsers: boolean
  canCreateUsers: boolean
  canEditUsers: boolean
  canDeleteUsers: boolean
  canViewUserDetails: boolean
  canManageRoles: boolean
  canResetPasswords: boolean
  canToggleUserStatus: boolean
  canViewUserActivity: boolean
  canManageMessageLimits: boolean
  canViewUserTransactions: boolean
  canAssignPackages: boolean
}

// Role hierarchy and permissions mapping
const ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  OWNER: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewUserDetails: true,
    canManageRoles: true,
    canResetPasswords: true,
    canToggleUserStatus: true,
    canViewUserActivity: true,
    canManageMessageLimits: true,
    canViewUserTransactions: true,
    canAssignPackages: true,
  },
  SUBDEALER: {
    canViewUsers: true,
    canCreateUsers: true, // Only customers and employees
    canEditUsers: true, // Limited to their created users
    canDeleteUsers: false,
    canViewUserDetails: true,
    canManageRoles: false, // Cannot change roles
    canResetPasswords: true, // Only for their users
    canToggleUserStatus: true, // Only for their users
    canViewUserActivity: true,
    canManageMessageLimits: true, // Limited to their users
    canViewUserTransactions: false,
    canAssignPackages: true, // Only packages they have access to
  },
  EMPLOYEE: {
    canViewUsers: true, // Only customers
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewUserDetails: true, // Limited view
    canManageRoles: false,
    canResetPasswords: false,
    canToggleUserStatus: false,
    canViewUserActivity: false,
    canManageMessageLimits: false,
    canViewUserTransactions: false,
    canAssignPackages: false,
  },
  CUSTOMER: {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewUserDetails: false,
    canManageRoles: false,
    canResetPasswords: false,
    canToggleUserStatus: false,
    canViewUserActivity: false,
    canManageMessageLimits: false,
    canViewUserTransactions: false,
    canAssignPackages: false,
  },
}

export const useUserPermissions = () => {
  const { data: session } = useSession()
  
  const sessionUser = session?.user as SessionUser
  const userRole = sessionUser?.role
  
  const permissions = useMemo(() => {
    if (!userRole) {
      return ROLE_PERMISSIONS.CUSTOMER // Default to most restrictive
    }
    
    const roleUpper = userRole.toUpperCase()
    return ROLE_PERMISSIONS[roleUpper] || ROLE_PERMISSIONS.CUSTOMER
  }, [userRole])

  const currentUserRole = ((session?.user as SessionUser)?.role?.toUpperCase()) || 'CUSTOMER'
  const currentUserId = (session?.user as SessionUser)?.id

  // Helper function to check if current user can manage a specific user
  const canManageUser = (targetUser: User) => {
    // No one can manage OWNER accounts (protection rule)
    if (targetUser?.role?.toUpperCase() === 'OWNER') {
      return false
    }
    
    if (currentUserRole === 'OWNER') {
      // Owner can manage all users except other owners
      return targetUser?.role?.toUpperCase() !== 'OWNER'
    }
    
    if (currentUserRole === 'SUBDEALER') {
      // SubDealer can manage users they created or customers/employees
      const targetParentId = targetUser?.parentId
      const currentUserIdNum = parseInt(currentUserId || '0')
      
      return (targetParentId === currentUserIdNum) || 
             ['CUSTOMER', 'EMPLOYEE'].includes(targetUser?.role?.toUpperCase())
    }
    
    return false
  }

  // Helper function to check if current user can assign a specific role
  const canAssignRole = (targetRole: string) => {
    const role = targetRole.toUpperCase()
    
    if (currentUserRole === 'OWNER') {
      // Owner can assign any role except OWNER (for security)
      return role !== 'OWNER'
    }
    
    if (currentUserRole === 'SUBDEALER') {
      // SubDealer can only assign CUSTOMER and EMPLOYEE roles
      return ['CUSTOMER', 'EMPLOYEE'].includes(role)
    }
    
    return false
  }

  // Helper function to get allowed roles for user creation/editing
  const getAllowedRoles = () => {
    if (currentUserRole === 'OWNER') {
      // Owner can assign all roles except OWNER (for security)
      return ['SUBDEALER', 'EMPLOYEE', 'CUSTOMER']
    }
    
    if (currentUserRole === 'SUBDEALER') {
      // SubDealer can only assign lower-level roles
      return ['EMPLOYEE', 'CUSTOMER']
    }
    
    return []
  }

  return {
    permissions,
    currentUserRole,
    currentUserId,
    canManageUser,
    canAssignRole,
    getAllowedRoles,
  }
}