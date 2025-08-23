/**
 * EmptyState - Unified Empty State Component
 * 
 * This component provides consistent empty state displays across the application
 * when no data or content is available.
 */

'use client'

import { forwardRef } from 'react'
import { Stack, Text, Box, rem } from '@mantine/core'
import { IconInbox } from '@tabler/icons-react'
import { designSystem } from '@/styles/design-system'
import { EmptyStateProps } from './types'

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({
    icon,
    title,
    description,
    actions,
    size = 'md',
    className,
    style,
    'data-testid': testId,
    ...props
  }, ref) => {
    
    // Size configurations
    const sizeConfig = {
      xs: {
        iconSize: rem(32),
        spacing: 'xs',
        titleSize: 'sm',
        descriptionSize: 'xs',
        padding: designSystem.spacing.md
      },
      sm: {
        iconSize: rem(40),
        spacing: 'sm',
        titleSize: 'md',
        descriptionSize: 'sm',
        padding: designSystem.spacing.lg
      },
      md: {
        iconSize: rem(48),
        spacing: 'md',
        titleSize: 'lg',
        descriptionSize: 'sm',
        padding: designSystem.spacing.xl
      },
      lg: {
        iconSize: rem(64),
        spacing: 'lg',
        titleSize: 'xl',
        descriptionSize: 'md',
        padding: designSystem.spacing.xxl
      },
      xl: {
        iconSize: rem(80),
        spacing: 'xl',
        titleSize: 'xxl',
        descriptionSize: 'lg',
        padding: designSystem.spacing.xxxl
      }
    }
    
    const currentSizeConfig = sizeConfig[size]
    const EmptyIcon = icon || IconInbox
    
    return (
      <Box
        ref={ref}
        className={className}
        data-testid={testId}
        p={currentSizeConfig.padding}
        style={{
          textAlign: 'center',
          fontFamily: designSystem.typography.fonts.primary,
          ...style
        }}
        {...props}
      >
        <Stack align="center" gap={currentSizeConfig.spacing}>
          {/* Icon */}
          <Box
            style={{
              color: designSystem.colors.neutral[400],
              opacity: 0.8
            }}
          >
            {typeof EmptyIcon === 'function' ? (
              <EmptyIcon 
                size={currentSizeConfig.iconSize} 
                stroke={1.5}
              />
            ) : (
              EmptyIcon
            )}
          </Box>
          
          {/* Title */}
          <Text 
            size={currentSizeConfig.titleSize}
            fw={designSystem.typography.weights.semibold}
            c={designSystem.colors.neutral[700]}
          >
            {title}
          </Text>
          
          {/* Description */}
          {description && (
            <Text 
              size={currentSizeConfig.descriptionSize}
              c={designSystem.colors.neutral[500]}
              fw={designSystem.typography.weights.normal}
              lh={designSystem.typography.lineHeights.relaxed}
              maw={rem(400)}
            >
              {description}
            </Text>
          )}
          
          {/* Actions */}
          {actions && (
            <Box mt="md">
              {actions}
            </Box>
          )}
        </Stack>
      </Box>
    )
  }
)

EmptyState.displayName = 'EmptyState'

export default EmptyState