/**
 * StandardCard - Unified Card Component
 * 
 * This component provides consistent card layout and styling across the application
 * with standardized variants, padding, and interactive states.
 */

'use client'

import { forwardRef } from 'react'
import { Card, CardProps, Stack, Group, Text, ActionIcon } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { designSystem } from '@/styles/design-system'
import { StandardCardProps } from './types'

const StandardCard = forwardRef<HTMLDivElement, StandardCardProps>(
  ({
    children,
    variant = 'elevated',
    size = 'md',
    title,
    subtitle,
    headerActions,
    footer,
    padding = 'md',
    hoverable = false,
    className,
    style,
    'data-testid': testId,
    ...props
  }, ref) => {
    
    // Map our design system sizes to padding values
    const paddingMap = {
      xs: designSystem.spacing.sm,
      sm: designSystem.spacing.md,
      md: designSystem.spacing.lg,
      lg: designSystem.spacing.xl,
      xl: designSystem.spacing.xxl
    }
    
    // Get variant styles
    const getVariantStyles = () => {
      switch (variant) {
        case 'elevated':
          return {
            boxShadow: designSystem.shadows.md,
            border: 'none',
            backgroundColor: '#ffffff'
          }
        case 'flat':
          return {
            boxShadow: 'none',
            border: 'none',
            backgroundColor: '#ffffff'
          }
        case 'bordered':
          return {
            boxShadow: 'none',
            border: `1px solid ${designSystem.colors.neutral[200]}`,
            backgroundColor: '#ffffff'
          }
        default:
          return {
            boxShadow: designSystem.shadows.sm,
            border: 'none',
            backgroundColor: '#ffffff'
          }
      }
    }
    
    const variantStyles = getVariantStyles()
    const cardPadding = paddingMap[padding]
    
    // Header component if title is provided
    const renderHeader = () => {
      if (!title && !headerActions) return null
      
      return (
        <Card.Section 
          p={cardPadding}
          style={{ 
            borderBottom: `1px solid ${designSystem.colors.neutral[100]}`,
            backgroundColor: designSystem.colors.neutral[50]
          }}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              {title && (
                <Text 
                  size="lg" 
                  fw={designSystem.typography.weights.semibold}
                  c={designSystem.colors.neutral[900]}
                  mb={subtitle ? 4 : 0}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text 
                  size="sm" 
                  c={designSystem.colors.neutral[600]}
                  fw={designSystem.typography.weights.normal}
                >
                  {subtitle}
                </Text>
              )}
            </div>
            {headerActions && (
              <div>{headerActions}</div>
            )}
          </Group>
        </Card.Section>
      )
    }
    
    // Footer component if provided
    const renderFooter = () => {
      if (!footer) return null
      
      return (
        <Card.Section 
          p={cardPadding}
          style={{ 
            borderTop: `1px solid ${designSystem.colors.neutral[100]}`,
            backgroundColor: designSystem.colors.neutral[50]
          }}
        >
          {footer}
        </Card.Section>
      )
    }
    
    return (
      <Card
        ref={ref}
        className={className}
        data-testid={testId}
        withBorder={variant === 'bordered'}
        radius={designSystem.borderRadius.xl}
        styles={{
          root: {
            ...variantStyles,
            borderRadius: designSystem.borderRadius.xl,
            transition: designSystem.transitions.normal,
            fontFamily: designSystem.typography.fonts.primary,
            
            // Hoverable state
            ...(hoverable && {
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: variant === 'elevated' 
                  ? designSystem.shadows.lg 
                  : designSystem.shadows.md
              }
            }),
            
            // Focus state for accessibility
            '&:focus': {
              outline: `2px solid ${designSystem.colors.whatsapp.primary}`,
              outlineOffset: '2px'
            },
            
            ...style
          }
        }}
        {...props}
      >
        {renderHeader()}
        
        <Card.Section p={cardPadding}>
          {children}
        </Card.Section>
        
        {renderFooter()}
      </Card>
    )
  }
)

StandardCard.displayName = 'StandardCard'

export default StandardCard