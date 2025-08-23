/**
 * StandardModal - Unified Modal Component
 * 
 * This component provides consistent modal dialogs across the application
 * with standardized styling, sizes, and accessibility features.
 */

'use client'

import { forwardRef } from 'react'
import { Modal, ModalProps, Group, Text, ActionIcon, Stack, Button } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { designSystem } from '@/styles/design-system'
import { StandardModalProps } from './types'

const StandardModal = forwardRef<HTMLDivElement, StandardModalProps>(
  ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    size = 'md',
    actions,
    closeOnBackdrop = true,
    showCloseButton = true,
    className,
    style,
    'data-testid': testId,
    ...props
  }, ref) => {
    
    // Map our design system sizes to modal sizes
    const sizeMap = {
      xs: '320px',
      sm: '400px',
      md: '500px',
      lg: '700px',
      xl: '900px'
    }
    
    // Render modal header
    const renderHeader = () => {
      if (!title && !showCloseButton) return null
      
      return (
        <Group justify="space-between" align="flex-start" mb="md">
          <div style={{ flex: 1 }}>
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
          
          {showCloseButton && (
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={onClose}
              aria-label="Close modal"
              styles={{
                root: {
                  color: designSystem.colors.neutral[500],
                  '&:hover': {
                    backgroundColor: designSystem.colors.neutral[100],
                    color: designSystem.colors.neutral[700]
                  }
                }
              }}
            >
              <IconX size={18} stroke={1.5} />
            </ActionIcon>
          )}
        </Group>
      )
    }
    
    // Render modal actions
    const renderActions = () => {
      if (!actions) return null
      
      return (
        <Group 
          justify="flex-end" 
          mt="xl" 
          pt="md"
          style={{
            borderTop: `1px solid ${designSystem.colors.neutral[200]}`
          }}
        >
          {actions}
        </Group>
      )
    }
    
    return (
      <Modal
        opened={isOpen}
        onClose={onClose}
        size={sizeMap[size]}
        title="" // We handle title in our custom header
        centered
        closeOnClickOutside={closeOnBackdrop}
        closeOnEscape={true}
        withCloseButton={false} // We handle close button in our custom header
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3
        }}
        styles={{
          root: {
            ...style
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)'
          },
          content: {
            borderRadius: designSystem.borderRadius.xl,
            border: `1px solid ${designSystem.colors.neutral[200]}`,
            boxShadow: designSystem.shadows.xxl,
            fontFamily: designSystem.typography.fonts.primary,
            backgroundColor: '#ffffff'
          },
          header: {
            padding: 0,
            minHeight: 0,
            borderBottom: 'none'
          },
          body: {
            padding: designSystem.spacing.xl,
            fontSize: designSystem.typography.sizes.md,
            lineHeight: designSystem.typography.lineHeights.relaxed,
            color: designSystem.colors.neutral[700]
          }
        }}
        transitionProps={{
          transition: 'fade',
          duration: 200,
          timingFunction: 'ease-in-out'
        }}
        className={className}
        data-testid={testId}
        {...props}
      >
        <Stack gap="md">
          {renderHeader()}
          
          <div>
            {children}
          </div>
          
          {renderActions()}
        </Stack>
      </Modal>
    )
  }
)

StandardModal.displayName = 'StandardModal'

export default StandardModal