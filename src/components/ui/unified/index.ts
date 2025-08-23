/**
 * Unified UI Component Library - Central Export
 * 
 * This file exports all standardized UI components to ensure consistent usage
 * across the entire WhatsApp Management System application.
 */

// Interactive Components
export { default as StandardButton } from './StandardButton'
export { default as StandardCard } from './StandardCard'
export { default as StandardModal } from './StandardModal'

// Data Display Components
export { default as StatusBadge } from './StatusBadge'
export { default as MetricCard } from './MetricCard'
export { default as EmptyState } from './EmptyState'
export { default as LoadingState } from './LoadingState'

// Feedback Components
export { default as AlertMessage } from './AlertMessage'

// Typography Components
export { default as Heading } from './Heading'
export { default as Text } from './Text'

// Export types
export type {
  PageHeaderProps,
  StandardButtonProps,
  StandardCardProps,
  StatusBadgeProps,
  MetricCardProps,
  AlertMessageProps,
  StandardModalProps,
  LoadingStateProps,
  EmptyStateProps,
  HeadingProps,
  TextProps,
  ComponentSize,
  ComponentColor,
  ButtonVariant,
  CardVariant,
  StatusType
} from './types'