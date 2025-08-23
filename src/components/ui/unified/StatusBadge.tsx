/**
 * StatusBadge - Unified Status Badge Component
 * 
 * This component provides consistent status indication across the application
 * with standardized colors, sizes, and optional pulse animation.
 */

'use client'

import { forwardRef } from 'react'
import { Badge, Group, rem } from '@mantine/core'
import { 
  IconCircleCheck, 
  IconCircleX, 
  IconClock, 
  IconWifi, 
  IconWifiOff,
  IconAlertTriangle,
  IconCheck,
  IconX
} from '@tabler/icons-react'
import { designSystem } from '@/styles/design-system'
import { StatusBadgeProps } from './types'

const StandardStatusBadge = forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({
    status,
    size = 'md',
    label,
    showIcon = true,
    pulse = false,
    className,
    style,
    'data-testid': testId,
    ...props
  }, ref) => {
    
    // Map our sizes to Mantine sizes and icon sizes
    const sizeMap = {
      xs: { badge: 'xs', icon: rem(12) },
      sm: { badge: 'sm', icon: rem(14) },
      md: { badge: 'md', icon: rem(16) },
      lg: { badge: 'lg', icon: rem(18) },
      xl: { badge: 'xl', icon: rem(20) }
    }
    
    // Get status configuration
    const getStatusConfig = () => {
      switch (status) {
        case 'online':
          return {
            color: 'green',
            bgColor: designSystem.colors.success[50],
            textColor: designSystem.colors.success[700],
            borderColor: designSystem.colors.success[200],
            icon: IconWifi,
            defaultLabel: 'Online'
          }
        case 'offline':
          return {
            color: 'gray',
            bgColor: designSystem.colors.neutral[100],
            textColor: designSystem.colors.neutral[600],
            borderColor: designSystem.colors.neutral[300],
            icon: IconWifiOff,
            defaultLabel: 'Offline'
          }
        case 'pending':
          return {
            color: 'yellow',
            bgColor: designSystem.colors.warning[50],
            textColor: designSystem.colors.warning[700],
            borderColor: designSystem.colors.warning[200],
            icon: IconClock,
            defaultLabel: 'Pending'
          }
        case 'active':
          return {
            color: 'green',
            bgColor: designSystem.colors.success[50],
            textColor: designSystem.colors.success[700],
            borderColor: designSystem.colors.success[200],
            icon: IconCircleCheck,
            defaultLabel: 'Active'
          }
        case 'inactive':
          return {
            color: 'gray',
            bgColor: designSystem.colors.neutral[100],
            textColor: designSystem.colors.neutral[600],
            borderColor: designSystem.colors.neutral[300],
            icon: IconCircleX,
            defaultLabel: 'Inactive'
          }
        case 'error':
          return {
            color: 'red',
            bgColor: designSystem.colors.error[50],
            textColor: designSystem.colors.error[700],
            borderColor: designSystem.colors.error[200],
            icon: IconX,
            defaultLabel: 'Error'
          }
        case 'success':
          return {
            color: 'green',
            bgColor: designSystem.colors.success[50],
            textColor: designSystem.colors.success[700],
            borderColor: designSystem.colors.success[200],
            icon: IconCheck,
            defaultLabel: 'Success'
          }
        case 'warning':
          return {
            color: 'orange',
            bgColor: designSystem.colors.warning[50],
            textColor: designSystem.colors.warning[700],
            borderColor: designSystem.colors.warning[200],
            icon: IconAlertTriangle,
            defaultLabel: 'Warning'
          }
        default:
          return {
            color: 'gray',
            bgColor: designSystem.colors.neutral[100],
            textColor: designSystem.colors.neutral[600],
            borderColor: designSystem.colors.neutral[300],
            icon: IconCircleX,
            defaultLabel: 'Unknown'
          }
      }
    }
    
    const statusConfig = getStatusConfig()
    const sizeConfig = sizeMap[size]
    const StatusIcon = statusConfig.icon
    const displayLabel = label || statusConfig.defaultLabel
    
    return (
      <Badge
        ref={ref}
        className={className}
        data-testid={testId}
        size={sizeConfig.badge}
        variant="light"
        color={statusConfig.color}
        styles={{
          root: {
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.textColor,
            border: `1px solid ${statusConfig.borderColor}`,
            borderRadius: designSystem.borderRadius.full,
            fontWeight: designSystem.typography.weights.medium,
            fontFamily: designSystem.typography.fonts.primary,
            textTransform: 'none',
            letterSpacing: '0.025em',
            
            // Pulse animation for status indicators
            ...(pulse && {
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  opacity: 1
                },
                '50%': {
                  opacity: 0.7
                },
                '100%': {
                  opacity: 1
                }
              }
            }),
            
            ...style
          }
        }}
        leftSection={showIcon ? (
          <StatusIcon 
            size={sizeConfig.icon} 
            stroke={1.5}
            style={{ 
              color: statusConfig.textColor,
              marginRight: rem(2) 
            }}
          />
        ) : undefined}
        {...props}
      >
        {displayLabel}
      </Badge>
    )
  }
)

StandardStatusBadge.displayName = 'StatusBadge'

export default StandardStatusBadge