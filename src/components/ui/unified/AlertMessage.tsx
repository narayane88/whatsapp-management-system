/**
 * AlertMessage - Unified Alert Component
 * 
 * This component provides consistent alert and notification styling across the application
 * with standardized variants, icons, and dismissible functionality.
 */

'use client'

import { forwardRef } from 'react'
import { Alert, AlertProps, Group, ActionIcon, Text, rem } from '@mantine/core'
import { 
  IconInfoCircle, 
  IconCheck, 
  IconAlertTriangle, 
  IconX,
  IconAlertCircle 
} from '@tabler/icons-react'
import { designSystem } from '@/styles/design-system'
import { AlertMessageProps } from './types'

const AlertMessage = forwardRef<HTMLDivElement, AlertMessageProps>(
  ({
    type,
    title,
    children,
    dismissible = false,
    onDismiss,
    icon,
    actions,
    className,
    style,
    'data-testid': testId,
    ...props
  }, ref) => {
    
    // Get type configuration
    const getTypeConfig = () => {
      switch (type) {
        case 'success':
          return {
            color: 'green',
            backgroundColor: designSystem.colors.success[50],
            borderColor: designSystem.colors.success[200],
            iconColor: designSystem.colors.success[600],
            textColor: designSystem.colors.success[800],
            titleColor: designSystem.colors.success[900],
            defaultIcon: IconCheck
          }
        case 'warning':
          return {
            color: 'orange',
            backgroundColor: designSystem.colors.warning[50],
            borderColor: designSystem.colors.warning[200],
            iconColor: designSystem.colors.warning[600],
            textColor: designSystem.colors.warning[800],
            titleColor: designSystem.colors.warning[900],
            defaultIcon: IconAlertTriangle
          }
        case 'error':
          return {
            color: 'red',
            backgroundColor: designSystem.colors.error[50],
            borderColor: designSystem.colors.error[200],
            iconColor: designSystem.colors.error[600],
            textColor: designSystem.colors.error[800],
            titleColor: designSystem.colors.error[900],
            defaultIcon: IconAlertCircle
          }
        case 'info':
        default:
          return {
            color: 'blue',
            backgroundColor: designSystem.colors.info[50],
            borderColor: designSystem.colors.info[200],
            iconColor: designSystem.colors.info[600],
            textColor: designSystem.colors.info[800],
            titleColor: designSystem.colors.info[900],
            defaultIcon: IconInfoCircle
          }
      }
    }
    
    const typeConfig = getTypeConfig()
    const AlertIcon = icon || typeConfig.defaultIcon
    
    // Render custom title with dismiss button
    const renderTitle = () => {
      if (!title && !dismissible && !actions) return undefined
      
      return (
        <Group justify="space-between" align="flex-start" gap="md">
          <div style={{ flex: 1 }}>
            {title && (
              <Text 
                fw={designSystem.typography.weights.semibold}
                c={typeConfig.titleColor}
                size="sm"
              >
                {title}
              </Text>
            )}
          </div>
          
          <Group gap="xs" align="center">
            {actions && (
              <div>{actions}</div>
            )}
            
            {dismissible && onDismiss && (
              <ActionIcon
                variant="subtle"
                color={typeConfig.color}
                size="sm"
                onClick={onDismiss}
                aria-label="Dismiss alert"
                styles={{
                  root: {
                    color: typeConfig.iconColor,
                    '&:hover': {
                      backgroundColor: typeConfig.borderColor,
                      color: typeConfig.titleColor
                    }
                  }
                }}
              >
                <IconX size={rem(14)} stroke={1.5} />
              </ActionIcon>
            )}
          </Group>
        </Group>
      )
    }
    
    return (
      <Alert
        ref={ref}
        variant="light"
        color={typeConfig.color}
        title={renderTitle()}
        icon={<AlertIcon size={rem(18)} stroke={1.5} />}
        className={className}
        data-testid={testId}
        withCloseButton={false} // We handle this with our custom title
        styles={{
          root: {
            backgroundColor: typeConfig.backgroundColor,
            border: `1px solid ${typeConfig.borderColor}`,
            borderRadius: designSystem.borderRadius.lg,
            fontFamily: designSystem.typography.fonts.primary,
            color: typeConfig.textColor,
            
            ...style
          },
          icon: {
            color: typeConfig.iconColor
          },
          body: {
            fontSize: designSystem.typography.sizes.sm,
            lineHeight: designSystem.typography.lineHeights.relaxed
          },
          title: {
            marginBottom: title ? rem(4) : 0
          },
          message: {
            color: typeConfig.textColor,
            fontSize: designSystem.typography.sizes.sm,
            lineHeight: designSystem.typography.lineHeights.relaxed,
            marginTop: title ? rem(4) : 0
          }
        }}
        {...props}
      >
        {children}
      </Alert>
    )
  }
)

AlertMessage.displayName = 'AlertMessage'

export default AlertMessage