/**
 * StandardButton - Unified Button Component
 * 
 * This component provides a consistent button implementation across the application
 * with standardized variants, sizes, and interactions.
 */

'use client'

import { forwardRef } from 'react'
import { Button, ButtonProps, Loader } from '@mantine/core'
import { designSystem } from '@/styles/design-system'
import { StandardButtonProps } from './types'

const StandardButton = forwardRef<HTMLButtonElement, StandardButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md', 
    color = 'whatsapp',
    disabled = false,
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    onClick,
    type = 'button',
    className,
    style,
    'data-testid': testId,
    ...props
  }, ref) => {
    
    // Map our design system sizes to Mantine sizes
    const sizeMap = {
      xs: 'xs',
      sm: 'sm', 
      md: 'md',
      lg: 'lg',
      xl: 'xl'
    } as const

    // Map variants to Mantine variants and styles
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            variant: 'filled' as const,
            color: color === 'whatsapp' ? 'green' : color
          }
        case 'secondary':
          return {
            variant: 'outline' as const,
            color: color === 'whatsapp' ? 'green' : color
          }
        case 'ghost':
          return {
            variant: 'subtle' as const,
            color: color === 'whatsapp' ? 'green' : color
          }
        case 'danger':
          return {
            variant: 'filled' as const,
            color: 'red'
          }
        default:
          return {
            variant: 'filled' as const,
            color: 'green'
          }
      }
    }

    const variantStyles = getVariantStyles()
    
    // Get size-specific styles from design system
    const getSizeStyles = () => {
      const sizeConfig = designSystem.componentSizes.button[size]
      return {
        height: sizeConfig.height,
        padding: sizeConfig.padding,
        fontSize: sizeConfig.fontSize
      }
    }

    const sizeStyles = getSizeStyles()

    return (
      <Button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        fullWidth={fullWidth}
        leftSection={loading ? <Loader size="xs" color="white" /> : leftIcon}
        rightSection={rightIcon}
        onClick={onClick}
        className={className}
        data-testid={testId}
        size={sizeMap[size]}
        {...variantStyles}
        styles={{
          root: {
            ...sizeStyles,
            borderRadius: designSystem.borderRadius.lg,
            fontWeight: designSystem.typography.weights.medium,
            transition: designSystem.transitions.normal,
            fontFamily: designSystem.typography.fonts.primary,
            
            // Custom WhatsApp brand styling
            ...(color === 'whatsapp' && variant === 'primary' && {
              backgroundColor: designSystem.colors.whatsapp.primary,
              borderColor: designSystem.colors.whatsapp.primary,
              '&:hover': {
                backgroundColor: designSystem.colors.whatsapp.secondary,
                borderColor: designSystem.colors.whatsapp.secondary
              },
              '&:active': {
                backgroundColor: designSystem.colors.whatsapp.dark,
                borderColor: designSystem.colors.whatsapp.dark
              }
            }),
            
            // Secondary WhatsApp styling
            ...(color === 'whatsapp' && variant === 'secondary' && {
              color: designSystem.colors.whatsapp.primary,
              borderColor: designSystem.colors.whatsapp.primary,
              '&:hover': {
                backgroundColor: designSystem.colors.whatsapp.light,
                borderColor: designSystem.colors.whatsapp.secondary
              }
            }),
            
            // Ghost WhatsApp styling
            ...(color === 'whatsapp' && variant === 'ghost' && {
              color: designSystem.colors.whatsapp.primary,
              '&:hover': {
                backgroundColor: designSystem.colors.whatsapp.light
              }
            }),
            
            // Disabled state
            '&:disabled': {
              opacity: 0.6,
              cursor: 'not-allowed',
              pointerEvents: 'none'
            },
            
            // Focus state for accessibility
            '&:focus': {
              outline: `2px solid ${designSystem.colors.whatsapp.primary}`,
              outlineOffset: '2px'
            },
            
            ...style
          },
          
          // Loading state adjustments
          ...(loading && {
            inner: {
              opacity: 0.7
            }
          })
        }}
        {...props}
      >
        {children}
      </Button>
    )
  }
)

StandardButton.displayName = 'StandardButton'

export default StandardButton