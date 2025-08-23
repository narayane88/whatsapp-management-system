/**
 * Heading - Unified Heading Component
 * 
 * This component provides consistent heading typography across the application
 * with proper hierarchy, colors, and responsive sizing.
 */

'use client'

import { forwardRef } from 'react'
import { Title, TitleProps } from '@mantine/core'
import { designSystem } from '@/styles/design-system'
import { HeadingProps } from './types'

const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({
    level,
    children,
    color = 'neutral',
    weight = 'semibold',
    align = 'left',
    className,
    style,
    'data-testid': testId,
    ...props
  }, ref) => {
    
    // Map heading levels to Mantine order and our typography scale
    const levelConfig = {
      1: {
        order: 1 as const,
        size: designSystem.typography.sizes.xxxl,
        lineHeight: designSystem.typography.lineHeights.tight
      },
      2: {
        order: 2 as const,
        size: designSystem.typography.sizes.xxl,
        lineHeight: designSystem.typography.lineHeights.tight
      },
      3: {
        order: 3 as const,
        size: designSystem.typography.sizes.xl,
        lineHeight: designSystem.typography.lineHeights.tight
      },
      4: {
        order: 4 as const,
        size: designSystem.typography.sizes.lg,
        lineHeight: designSystem.typography.lineHeights.normal
      },
      5: {
        order: 5 as const,
        size: designSystem.typography.sizes.md,
        lineHeight: designSystem.typography.lineHeights.normal
      },
      6: {
        order: 6 as const,
        size: designSystem.typography.sizes.sm,
        lineHeight: designSystem.typography.lineHeights.normal
      }
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
          return designSystem.colors.neutral[900]
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
          return designSystem.typography.weights.semibold
      }
    }
    
    const config = levelConfig[level]
    const colorValue = getColorValue()
    const weightValue = getWeightValue()
    
    return (
      <Title
        ref={ref}
        order={config.order}
        className={className}
        data-testid={testId}
        style={{
          fontFamily: designSystem.typography.fonts.heading,
          fontSize: config.size,
          fontWeight: weightValue,
          lineHeight: config.lineHeight,
          color: colorValue,
          textAlign: align,
          marginBottom: designSystem.spacing.md,
          letterSpacing: level <= 2 ? '-0.025em' : '0',
          ...style
        }}
        {...props}
      >
        {children}
      </Title>
    )
  }
)

Heading.displayName = 'Heading'

export default Heading