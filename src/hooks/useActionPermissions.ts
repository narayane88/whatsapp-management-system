'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface ActionPermissions {
  [key: string]: boolean
}

export function useActionPermissions(): {
  hasPermission: (permissionName: string) => boolean
  hasAnyPermission: (permissionNames: string[]) => boolean
  hasAllPermissions: (permissionNames: string[]) => boolean
  loading: boolean
  permissions: ActionPermissions
} {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState<ActionPermissions>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const fetchPermissions = async () => {
      if (status === 'loading') return
      if (!session?.user?.email) {
        if (isMounted) {
          setPermissions({})
          setLoading(false)
        }
        return
      }

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch('/api/admin/users/permissions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!isMounted) return

        if (response.ok) {
          const data = await response.json()
          const permissionMap: ActionPermissions = {}
          
          // Convert array of permissions to boolean map
          data.permissions?.forEach((permission: { name: string }) => {
            permissionMap[permission.name] = true
          })
          
          setPermissions(permissionMap)
        } else {
          console.warn('Failed to fetch permissions:', response.status, response.statusText)
          setPermissions({})
        }
      } catch (error) {
        if (!isMounted) return
        
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Permission fetch request timed out')
        } else {
          console.error('Error fetching permissions:', error)
        }
        setPermissions({})
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchPermissions()
    
    return () => {
      isMounted = false
    }
  }, [session?.user?.email, status])

  const hasPermission = (permissionName: string): boolean => {
    return permissions[permissionName] === true
  }

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(name => permissions[name] === true)
  }

  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return permissionNames.every(name => permissions[name] === true)
  }

  return {
    hasPermission,
    hasAnyPermission, 
    hasAllPermissions,
    loading,
    permissions
  }
}

// Convenience hook for action button permissions
export function useActionButtonPermission(buttonPermission: string): {
  canShow: boolean
  loading: boolean
} {
  const { hasPermission, loading, permissions } = useActionPermissions()
  
  // If still loading, allow access (fail-open for better UX)
  // In production, you might want fail-closed (canShow: false) for security
  const canShow = loading ? false : hasPermission(buttonPermission)
  
  return {
    canShow,
    loading
  }
}

// Pre-defined permission groups for common use cases
export const PERMISSION_GROUPS = {
  CUSTOMER_MANAGEMENT: [
    'customers.create.button',
    'customers.edit.button', 
    'customers.delete.button',
    'customers.view.button'
  ],
  PACKAGE_MANAGEMENT: [
    'packages.create.button',
    'packages.edit.button',
    'packages.delete.button',
    'packages.activate.button'
  ],
  TRANSACTION_MANAGEMENT: [
    'transactions.approve.button',
    'transactions.reject.button',
    'transactions.refund.button',
    'transactions.view.button'
  ],
  USER_MANAGEMENT: [
    'users.create.button',
    'users.edit.button',
    'users.delete.button',
    'users.roles.button'
  ],
  SERVER_MANAGEMENT: [
    'servers.create.button',
    'servers.edit.button',
    'servers.delete.button',
    'servers.config.button'
  ],
  BIZCOINS_MANAGEMENT: [
    'bizpoints.transfer.button',
    'bizpoints.add.button',
    'bizpoints.deduct.button',
    'bizpoints.withdraw.button'
  ]
} as const

// Hook for checking permission groups
export function usePermissionGroup(groupName: keyof typeof PERMISSION_GROUPS): {
  hasAnyPermission: boolean
  hasAllPermissions: boolean
  loading: boolean
  permissions: string[]
} {
  const { hasAnyPermission, hasAllPermissions, loading } = useActionPermissions()
  const permissions = PERMISSION_GROUPS[groupName]
  
  return {
    hasAnyPermission: hasAnyPermission(permissions),
    hasAllPermissions: hasAllPermissions(permissions),
    loading,
    permissions
  }
}