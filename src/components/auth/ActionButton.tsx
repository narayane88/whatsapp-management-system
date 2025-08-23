'use client'

import { ReactNode } from 'react'
import { Button, ButtonProps, ActionIcon, ActionIconProps, Tooltip } from '@mantine/core'
import { usePermissions } from '@/hooks/usePermissions'

interface ActionButtonProps extends Omit<ButtonProps, 'children'> {
  permission: string
  children: ReactNode
  fallback?: ReactNode
  showTooltipWhenDisabled?: boolean
  tooltipLabel?: string
}

interface ActionIconButtonProps extends Omit<ActionIconProps, 'children'> {
  permission: string
  children: ReactNode
  fallback?: ReactNode
  showTooltipWhenDisabled?: boolean
  tooltipLabel?: string
}

/**
 * Permission-aware Button component
 * Only shows the button if user has the required permission
 */
export function ActionButton({ 
  permission, 
  children, 
  fallback = null, 
  showTooltipWhenDisabled = false,
  tooltipLabel,
  ...props 
}: ActionButtonProps) {
  const { hasPermission, isLoading } = usePermissions()

  // Show loading state
  if (isLoading) {
    return <Button {...props} loading disabled />
  }

  // Check if user has the required permission
  const canShow = hasPermission(permission)

  // Hide button if no permission
  if (!canShow) {
    if (showTooltipWhenDisabled && tooltipLabel) {
      return (
        <Tooltip label={tooltipLabel}>
          <Button {...props} disabled>
            {children}
          </Button>
        </Tooltip>
      )
    }
    return <>{fallback}</>
  }

  return <Button {...props}>{children}</Button>
}

/**
 * Permission-aware ActionIcon component
 * Only shows the action icon if user has the required permission
 */
export function ActionIconButton({ 
  permission, 
  children, 
  fallback = null,
  showTooltipWhenDisabled = false,
  tooltipLabel,
  ...props 
}: ActionIconButtonProps) {
  const { hasPermission, isLoading } = usePermissions()

  // Show loading state
  if (isLoading) {
    return <ActionIcon {...props} loading disabled />
  }

  // Check if user has the required permission
  const canShow = hasPermission(permission)

  // Hide button if no permission
  if (!canShow) {
    if (showTooltipWhenDisabled && tooltipLabel) {
      return (
        <Tooltip label={tooltipLabel}>
          <ActionIcon {...props} disabled>
            {children}
          </ActionIcon>
        </Tooltip>
      )
    }
    return <>{fallback}</>
  }

  return <ActionIcon {...props}>{children}</ActionIcon>
}

/**
 * Wrapper component that conditionally renders children based on permissions
 */
interface PermissionWrapperProps {
  permission: string | string[]
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean // When true, requires all permissions. When false, requires any permission
  loading?: ReactNode
}

export function PermissionWrapper({ 
  permission, 
  children, 
  fallback = null, 
  requireAll = false,
  loading: loadingComponent
}: PermissionWrapperProps) {
  const { hasPermission, isLoading } = usePermissions()

  if (isLoading) {
    return <>{loadingComponent || null}</>
  }

  // Handle single permission
  if (typeof permission === 'string') {
    const canShow = hasPermission(permission)
    if (!canShow) {
      return <>{fallback}</>
    }
    return <>{children}</>
  }

  // Handle multiple permissions
  const checkPermissions = requireAll 
    ? permission.every(p => hasPermission(p))
    : permission.some(p => hasPermission(p))

  if (!checkPermissions) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Pre-configured action buttons for common operations
export const CommonActionButtons = {
  Create: ({ permission, ...props }: Omit<ActionButtonProps, 'children'>) => (
    <ActionButton permission={permission} variant="filled" {...props}>
      Create
    </ActionButton>
  ),
  
  Edit: ({ permission, ...props }: Omit<ActionButtonProps, 'children'>) => (
    <ActionButton permission={permission} variant="light" {...props}>
      Edit
    </ActionButton>
  ),
  
  Delete: ({ permission, ...props }: Omit<ActionButtonProps, 'children'>) => (
    <ActionButton permission={permission} variant="light" color="red" {...props}>
      Delete
    </ActionButton>
  ),
  
  View: ({ permission, ...props }: Omit<ActionButtonProps, 'children'>) => (
    <ActionButton permission={permission} variant="subtle" {...props}>
      View
    </ActionButton>
  ),
  
  Export: ({ permission, ...props }: Omit<ActionButtonProps, 'children'>) => (
    <ActionButton permission={permission} variant="default" {...props}>
      Export
    </ActionButton>
  )
}

export default ActionButton