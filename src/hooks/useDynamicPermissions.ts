'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { dynamicPermissionManager } from '@/utils/dynamicPermissions'

interface UseDynamicPermissionsReturn {
  hasPermission: (permission: string) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasRole: (role: string) => boolean
  isOwner: boolean
  isAdmin: boolean
  isSubDealer: boolean
  isEmployee: boolean
  isCustomer: boolean
  userPermissions: string[]
  allPermissions: any[]
  permissionsByCategory: Record<string, any[]>
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Dynamic permissions hook using real database permissions
 * Replaces the compiled permission system
 */
export function useDynamicPermissions(): UseDynamicPermissionsReturn {
  const { data: session, status } = useSession()
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [allPermissions, setAllPermissions] = useState<any[]>([])
  const [permissionsByCategory, setPermissionsByCategory] = useState<Record<string, any[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Role normalization function
  const normalizeRole = useCallback((role: string): string => {
    if (!role) return ''
    
    const normalized = role.toUpperCase().replace(/\s+/g, '')
    
    // Map database variations to standard role names
    if (normalized === 'SHREEDELALER' || normalized === 'DELALER' || normalized === 'DEALER') {
      return 'SUBDEALER'
    }
    
    return normalized
  }, [])

  // Ultra-fast role checks (compiled at render time)
  const roleChecks = useMemo(() => {
    const normalizedRole = normalizeRole(session?.user?.role || '')
    return {
      isOwner: normalizedRole === 'OWNER',
      isAdmin: normalizedRole === 'ADMIN',
      isSubDealer: normalizedRole === 'SUBDEALER',
      isEmployee: normalizedRole === 'EMPLOYEE',
      isCustomer: normalizedRole === 'CUSTOMER'
    }
  }, [session?.user?.role, normalizeRole])

  // Initialize and load permissions
  const loadPermissions = useCallback(async () => {
    if (status === 'loading') return
    
    try {
      setIsLoading(true)
      setError(null)

      // Initialize the dynamic permission manager
      await dynamicPermissionManager.initialize()

      if (!session?.user?.email || !session?.user?.role) {
        dynamicPermissionManager.setUserRole('')
        setUserPermissions([])
        setAllPermissions([])
        setPermissionsByCategory({})
        setIsLoading(false)
        return
      }

      const userRole = session.user.role
      const normalizedRole = normalizeRole(userRole)

      // Set user role in permission manager
      dynamicPermissionManager.setUserRole(normalizedRole)

      // Get user's effective permissions
      const effectivePermissions = dynamicPermissionManager.getUserPermissions()
      setUserPermissions(effectivePermissions)

      // Get all available permissions
      const allPerms = dynamicPermissionManager.getAllPermissions()
      setAllPermissions(allPerms)

      // Get permissions grouped by category
      const byCategory = dynamicPermissionManager.getPermissionsByCategory()
      setPermissionsByCategory(byCategory)

      console.log(`✅ Dynamic permissions loaded: ${effectivePermissions.length} user permissions, ${allPerms.length} total permissions`)

    } catch (err) {
      console.error('❌ Failed to load dynamic permissions:', err)
      setError('Failed to load permissions')
      setUserPermissions([])
      setAllPermissions([])
      setPermissionsByCategory({})
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.email, session?.user?.role, status, normalizeRole])

  // Load permissions on mount and when session changes
  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  // Permission check functions
  const hasPermission = useCallback((permission: string): boolean => {
    return dynamicPermissionManager.hasPermission(permission)
  }, [])

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return dynamicPermissionManager.hasAllPermissions(permissions)
  }, [])

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return dynamicPermissionManager.hasAnyPermission(permissions)
  }, [])

  const hasRole = useCallback((role: string): boolean => {
    return normalizeRole(session?.user?.role || '') === normalizeRole(role)
  }, [session?.user?.role, normalizeRole])

  const refresh = useCallback(async () => {
    await loadPermissions()
  }, [loadPermissions])

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    ...roleChecks,
    userPermissions,
    allPermissions,
    permissionsByCategory,
    isLoading,
    error,
    refresh
  }
}