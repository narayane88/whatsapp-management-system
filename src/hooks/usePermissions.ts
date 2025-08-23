'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { monitorApiCall, permissionCacheMonitor } from '@/utils/performance'

interface UsePermissionsReturn {
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  isOwner: boolean
  isAdmin: boolean
  isSubDealer: boolean
  isEmployee: boolean
  isCustomer: boolean
  userPermissions: string[]
  isLoading: boolean
  error: string | null
}

export function usePermissions(): UsePermissionsReturn {
  const { data: session } = useSession()
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user permissions when session changes
  useEffect(() => {
    const loadPermissions = async () => {
      if (!session?.user?.email) {
        setUserPermissions([])
        setIsLoading(false)
        return
      }

      // PERFORMANCE FIX: Check if permissions are already cached in sessionStorage
      const cacheKey = `permissions_${session.user.email}`
      const cached = sessionStorage.getItem(cacheKey)
      
      if (cached) {
        try {
          const { permissions, timestamp } = JSON.parse(cached)
          // Use cache for 5 minutes
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            permissionCacheMonitor.hit()
            setUserPermissions(permissions || [])
            setIsLoading(false)
            setError(null)
            return
          }
        } catch (e) {
          // Invalid cache, continue to fetch
        }
      }

      permissionCacheMonitor.miss()

      try {
        setIsLoading(true)
        
        const permissions = await monitorApiCall('/api/auth/user-permissions', async () => {
          const response = await fetch('/api/auth/user-permissions', {
            cache: 'force-cache', // Enable browser caching
            headers: {
              'Cache-Control': 'max-age=300' // 5 minutes
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            return data.permissions || []
          } else {
            throw new Error('Failed to load permissions')
          }
        })
        
        setUserPermissions(permissions)
        setError(null)
        
        // Cache in sessionStorage
        sessionStorage.setItem(cacheKey, JSON.stringify({
          permissions,
          timestamp: Date.now()
        }))
        
      } catch (err) {
        setError('Error loading permissions')
        setUserPermissions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPermissions()
  }, [session?.user?.email])

  // Helper functions
  const hasPermission = (permission: string): boolean => {
    if (!session?.user) return false
    
    // OWNER has all permissions
    if (session.user.role === 'OWNER') return true
    
    return userPermissions.includes(permission)
  }

  const hasRole = (role: string): boolean => {
    return session?.user?.role === role
  }

  // Role checks
  const isOwner = session?.user?.role === 'OWNER'
  const isAdmin = session?.user?.role === 'ADMIN'
  const isSubDealer = session?.user?.role === 'SUBDEALER'
  const isEmployee = session?.user?.role === 'EMPLOYEE'
  const isCustomer = session?.user?.role === 'CUSTOMER'

  return {
    hasPermission,
    hasRole,
    isOwner,
    isAdmin,
    isSubDealer,
    isEmployee,
    isCustomer,
    userPermissions,
    isLoading,
    error
  }
}