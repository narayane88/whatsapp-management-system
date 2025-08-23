/**
 * Unified UI Component Library - Type Definitions
 * 
 * This file contains all type definitions for the standardized UI components
 */

import { ReactNode, CSSProperties } from 'react'

// Base Props for all components
export interface BaseComponentProps {
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

// Size variants used across components
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Color variants based on design system
export type ComponentColor = 
  | 'whatsapp' 
  | 'business' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'neutral'

// Button variants
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

// Card variants
export type CardVariant = 'elevated' | 'flat' | 'bordered'

// Status types for badges and indicators
export type StatusType = 'online' | 'offline' | 'pending' | 'active' | 'inactive' | 'error' | 'success' | 'warning'

// =============================================================================
// COMPONENT SPECIFIC PROPS
// =============================================================================

export interface PageHeaderProps extends BaseComponentProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  showBackButton?: boolean
  onBackClick?: () => void
}

export interface StandardButtonProps extends BaseComponentProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ComponentSize
  color?: ComponentColor
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface StandardCardProps extends BaseComponentProps {
  children: ReactNode
  variant?: CardVariant
  size?: ComponentSize
  title?: string
  subtitle?: string
  headerActions?: ReactNode
  footer?: ReactNode
  padding?: ComponentSize
  hoverable?: boolean
}

export interface StatusBadgeProps extends BaseComponentProps {
  status: StatusType
  size?: ComponentSize
  label?: string
  showIcon?: boolean
  pulse?: boolean
}

export interface MetricCardProps extends BaseComponentProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
    label?: string
  }
  icon?: ReactNode
  color?: ComponentColor
  size?: ComponentSize
  loading?: boolean
}

export interface AlertMessageProps extends BaseComponentProps {
  type: 'success' | 'warning' | 'error' | 'info'
  title?: string
  children: ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  icon?: ReactNode
  actions?: ReactNode
}

export interface DataTableColumn<T = any> {
  key: string
  header: string
  width?: string | number
  sortable?: boolean
  render?: (value: any, row: T, index: number) => ReactNode
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T = any> extends BaseComponentProps {
  data: T[]
  columns: DataTableColumn<T>[]
  loading?: boolean
  emptyMessage?: string
  pagination?: {
    current: number
    total: number
    pageSize: number
    onChange: (page: number) => void
  }
  sorting?: {
    key: string
    direction: 'asc' | 'desc'
    onChange: (key: string, direction: 'asc' | 'desc') => void
  }
  selection?: {
    selected: string[]
    onChange: (selected: string[]) => void
    getRowId: (row: T) => string
  }
}

export interface StandardFormProps extends BaseComponentProps {
  children: ReactNode
  onSubmit?: (event: React.FormEvent) => void
  loading?: boolean
  title?: string
  subtitle?: string
  actions?: ReactNode
  spacing?: ComponentSize
}

export interface StandardModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  size?: ComponentSize
  actions?: ReactNode
  closeOnBackdrop?: boolean
  showCloseButton?: boolean
}

export interface EmptyStateProps extends BaseComponentProps {
  icon?: ReactNode
  title: string
  description?: string
  actions?: ReactNode
  size?: ComponentSize
}

export interface LoadingStateProps extends BaseComponentProps {
  size?: ComponentSize
  message?: string
  overlay?: boolean
}

export interface BreadcrumbsProps extends BaseComponentProps {
  items: { label: string; href?: string; active?: boolean }[]
  separator?: ReactNode
  maxItems?: number
}

export interface TabNavigationProps extends BaseComponentProps {
  tabs: { 
    key: string
    label: string
    icon?: ReactNode
    disabled?: boolean
    badge?: string | number
  }[]
  activeTab: string
  onChange: (key: string) => void
  size?: ComponentSize
  variant?: 'default' | 'pills' | 'underline'
}

export interface PaginationProps extends BaseComponentProps {
  current: number
  total: number
  pageSize: number
  onChange: (page: number) => void
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean
  size?: ComponentSize
}

export interface IconWrapperProps extends BaseComponentProps {
  icon: ReactNode
  size?: ComponentSize
  color?: ComponentColor
  background?: boolean
  rounded?: boolean
}

export interface HeadingProps extends BaseComponentProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: ReactNode
  color?: ComponentColor
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  align?: 'left' | 'center' | 'right'
}

export interface TextProps extends BaseComponentProps {
  children: ReactNode
  size?: ComponentSize
  color?: ComponentColor
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  align?: 'left' | 'center' | 'right'
  truncate?: boolean
}

export interface LabelProps extends BaseComponentProps {
  children: ReactNode
  htmlFor?: string
  required?: boolean
  size?: ComponentSize
  weight?: 'normal' | 'medium' | 'semibold'
}