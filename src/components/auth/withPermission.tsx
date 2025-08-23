'use client'

import { ComponentType } from 'react'
import PermissionGuard from './PermissionGuard'

interface WithPermissionOptions {
  requiredPermission?: string
  requiredRole?: string
  fallbackUrl?: string
  showFallback?: boolean
}

/**
 * Higher-order component that wraps a component with permission checking
 */
export function withPermission<T extends Record<string, any>>(
  Component: ComponentType<T>,
  options: WithPermissionOptions = {}
) {
  const {
    requiredPermission,
    requiredRole,
    fallbackUrl = '/auth/signin',
    showFallback = true
  } = options

  const WithPermissionComponent = (props: T) => {
    return (
      <PermissionGuard
        requiredPermission={requiredPermission}
        requiredRole={requiredRole}
        fallbackUrl={fallbackUrl}
        showFallback={showFallback}
      >
        <Component {...props} />
      </PermissionGuard>
    )
  }

  WithPermissionComponent.displayName = `withPermission(${Component.displayName || Component.name})`

  return WithPermissionComponent
}

// Convenience functions for common permission patterns
export const withOwnerAccess = <T extends Record<string, any>>(Component: ComponentType<T>) =>
  withPermission(Component, { requiredRole: 'OWNER' })

export const withAdminAccess = <T extends Record<string, any>>(Component: ComponentType<T>) =>
  withPermission(Component, { requiredRole: 'ADMIN' })

export const withUserManagement = <T extends Record<string, any>>(Component: ComponentType<T>) =>
  withPermission(Component, { requiredPermission: 'users.read' })

export const withRoleManagement = <T extends Record<string, any>>(Component: ComponentType<T>) =>
  withPermission(Component, { requiredPermission: 'roles.read' })

export const withPermissionManagement = <T extends Record<string, any>>(Component: ComponentType<T>) =>
  withPermission(Component, { requiredPermission: 'permissions.read' })