/**
 * Text - Unified Text Component
 * 
 * This component provides consistent text styling across the application
 * with standardized sizes, colors, and text handling.
 */

'use client'

import { forwardRef } from 'react'
import { Text as MantineText, TextProps as MantineTextProps } from '@mantine/core'
import { designSystem } from '@/styles/design-system'
import { TextProps } from './types'

const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({
    children,
    size = 'md',
    color = 'neutral',
    weight = 'normal',
    align = 'left',
    truncate = false,
    className,
    style,
    'data-testid': testId,
    ...props
  }, ref) => {
    
    // Map our sizes to design system typography
    const sizeMap = {
      xs: designSystem.typography.sizes.xs,
      sm: designSystem.typography.sizes.sm,
      md: designSystem.typography.sizes.md,
      lg: designSystem.typography.sizes.lg,
      xl: designSystem.typography.sizes.xl
    }
    
    // Get color configuration
    const getColorValue = () => {
      switch (color) {
        case 'whatsapp':
          return designSystem.colors.whatsapp.primary
        case 'business':
          return designSystem.colors.business.primary
        case 'success':
          return designSystem.colors.success[600]
        case 'warning':
          return designSystem.colors.warning[600]
        case 'error':
          return designSystem.colors.error[600]
        case 'neutral':
        default:
          return designSystem.colors.neutral[700]
      }
    }
    
    // Get font weight value
    const getWeightValue = () => {
      switch (weight) {
        case 'normal':
          return designSystem.typography.weights.normal
        case 'medium':
          return designSystem.typography.weights.medium
        case 'semibold':
          return designSystem.typography.weights.semibold
        case 'bold':
          return designSystem.typography.weights.bold
        default:
          return designSystem.typography.weights.normal
      }
    }
    
    const fontSize = sizeMap[size]
    const colorValue = getColorValue()
    const weightValue = getWeightValue()
    
    return (
      <MantineText
        ref={ref}
        className={className}
        data-testid={testId}
        truncate={truncate ? 'end' : undefined}
        style={{
          fontFamily: designSystem.typography.fonts.primary,
          fontSize: fontSize,
          fontWeight: weightValue,
          color: colorValue,
          textAlign: align,
          lineHeight: designSystem.typography.lineHeights.relaxed,
          
          // Responsive text sizing for smaller screens
          '@media (max-width: 768px)': {
            fontSize: size === 'xl' 
              ? designSystem.typography.sizes.lg 
              : fontSize
          },
          
          ...style
        }}
        {...props}
      >
        {children}
      </MantineText>
    )
  }
)

Text.displayName = 'Text'

export default Text