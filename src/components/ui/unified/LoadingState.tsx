/**
 * LoadingState - Unified Loading Component
 * 
 * This component provides consistent loading indicators across the application
 * with various sizes, overlay options, and custom messages.
 */

'use client'

import { forwardRef } from 'react'
import { Stack, Loader, Text, Overlay, Box, rem } from '@mantine/core'
import { designSystem } from '@/styles/design-system'
import { LoadingStateProps } from './types'

const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({
    size = 'md',
    message = 'Loading...',
    overlay = false,
    className,
    style,
    'data-testid': testId,
    ...props
  }, ref) => {
    
    // Size configurations
    const sizeConfig = {
      xs: {
        loader: 'xs',
        text: 'xs',
        spacing: 'xs',
        padding: designSystem.spacing.sm
      },
      sm: {
        loader: 'sm',
        text: 'sm',
        spacing: 'sm',
        padding: designSystem.spacing.md
      },
      md: {
        loader: 'md',
        text: 'sm',
        spacing: 'md',
        padding: designSystem.spacing.lg
      },
      lg: {
        loader: 'lg',
        text: 'md',
        spacing: 'md',
        padding: designSystem.spacing.xl
      },
      xl: {
        loader: 'xl',
        text: 'lg',
        spacing: 'lg',
        padding: designSystem.spacing.xxl
      }
    }
    
    const currentSizeConfig = sizeConfig[size]
    
    const LoadingContent = () => (
      <Stack 
        align="center" 
        justify="center"
        gap={currentSizeConfig.spacing}
        p={currentSizeConfig.padding}
        className={className}
        style={{
          fontFamily: designSystem.typography.fonts.primary,
          ...style
        }}
        data-testid={testId}
        {...props}
      >
        <Loader 
          size={currentSizeConfig.loader}
          color={designSystem.colors.whatsapp.primary}
          type="bars"
        />
        
        {message && (
          <Text 
            size={currentSizeConfig.text}
            c={designSystem.colors.neutral[600]}
            fw={designSystem.typography.weights.medium}
            ta="center"
          >
            {message}
          </Text>
        )}
      </Stack>
    )
    
    if (overlay) {
      return (
        <Box 
          ref={ref}
          style={{ 
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: rem(200)
          }}
        >
          <Overlay 
            color="#ffffff"
            backgroundOpacity={0.85}
            blur={2}
            zIndex={designSystem.zIndex.overlay}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: designSystem.borderRadius.lg
            }}
          >
            <LoadingContent />
          </Overlay>
        </Box>
      )
    }
    
    return (
      <Box ref={ref}>
        <LoadingContent />
      </Box>
    )
  }
)

LoadingState.displayName = 'LoadingState'

export default LoadingState