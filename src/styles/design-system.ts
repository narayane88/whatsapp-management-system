/**
 * WhatsApp Management System - Unified Design System
 * 
 * This file contains all design constants, tokens, and configurations
 * to ensure consistent UI across the entire application.
 */

import { MantineColorsTuple, createTheme } from '@mantine/core'

// =============================================================================
// TYPOGRAPHY SYSTEM
// =============================================================================

export const typography = {
  fonts: {
    primary: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
    mono: `'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'Ubuntu Mono', monospace`,
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  },
  
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px  
    md: '1rem',       // 16px (base)
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    xxl: '1.5rem',    // 24px
    xxxl: '2rem',     // 32px
    xxxxl: '2.5rem',  // 40px
    xxxxxl: '3rem'    // 48px
  },
  
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8
  }
} as const

// =============================================================================
// SPACING SYSTEM (Based on 4px base unit)
// =============================================================================

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  xxl: '2rem',     // 32px
  xxxl: '3rem',    // 48px
  xxxxl: '4rem',   // 64px
  xxxxxl: '6rem'   // 96px
} as const

// =============================================================================
// COLOR SYSTEM
// =============================================================================

export const brandColors = {
  // WhatsApp Brand Colors
  whatsapp: {
    primary: '#25D366',
    secondary: '#128C7E', 
    dark: '#075E54',
    light: '#DCF8C6'
  },
  
  // Status Colors
  status: {
    success: '#10B981',
    warning: '#F59E0B', 
    error: '#EF4444',
    info: '#3B82F6'
  },
  
  // Neutral Colors
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6', 
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  },
  
  // Business Colors
  business: {
    primary: '#2563EB',
    secondary: '#7C3AED',
    accent: '#059669'
  }
} as const

// Mantine Color Tuples for theme integration
export const mantineColors: Record<string, MantineColorsTuple> = {
  whatsapp: [
    '#F0FDF4',
    '#DCFCE7', 
    '#BBF7D0',
    '#86EFAC',
    '#4ADE80',
    '#25D366', // Primary WhatsApp green
    '#16A34A',
    '#15803D',
    '#166534',
    '#14532D'
  ],
  business: [
    '#EFF6FF',
    '#DBEAFE',
    '#BFDBFE', 
    '#93C5FD',
    '#60A5FA',
    '#2563EB', // Primary business blue
    '#1D4ED8',
    '#1E40AF',
    '#1E3A8A',
    '#1F2937'
  ],
  success: [
    '#F0FDF4',
    '#DCFCE7',
    '#BBF7D0',
    '#86EFAC', 
    '#4ADE80',
    '#10B981', // Success green
    '#059669',
    '#047857',
    '#065F46',
    '#064E3B'
  ],
  warning: [
    '#FFFBEB',
    '#FEF3C7',
    '#FDE68A',
    '#FCD34D',
    '#FBBF24',
    '#F59E0B', // Warning amber
    '#D97706',
    '#B45309',
    '#92400E',
    '#78350F'
  ],
  error: [
    '#FEF2F2',
    '#FEE2E2',
    '#FECACA',
    '#FCA5A5',
    '#F87171',
    '#EF4444', // Error red
    '#DC2626',
    '#B91C1C',
    '#991B1B',
    '#7F1D1D'
  ]
}

// =============================================================================
// COMPONENT SIZES
// =============================================================================

export const componentSizes = {
  button: {
    xs: { height: '28px', padding: '0 12px', fontSize: typography.sizes.xs },
    sm: { height: '32px', padding: '0 16px', fontSize: typography.sizes.sm },
    md: { height: '40px', padding: '0 20px', fontSize: typography.sizes.md },
    lg: { height: '48px', padding: '0 24px', fontSize: typography.sizes.lg },
    xl: { height: '56px', padding: '0 32px', fontSize: typography.sizes.xl }
  },
  
  input: {
    xs: { height: '28px', fontSize: typography.sizes.xs },
    sm: { height: '32px', fontSize: typography.sizes.sm },
    md: { height: '40px', fontSize: typography.sizes.md },
    lg: { height: '48px', fontSize: typography.sizes.lg },
    xl: { height: '56px', fontSize: typography.sizes.xl }
  },
  
  card: {
    xs: { padding: spacing.md, borderRadius: '6px' },
    sm: { padding: spacing.lg, borderRadius: '8px' },
    md: { padding: spacing.xl, borderRadius: '12px' },
    lg: { padding: spacing.xxl, borderRadius: '16px' },
    xl: { padding: spacing.xxxl, borderRadius: '20px' }
  }
} as const

// =============================================================================
// SHADOWS & ELEVATION
// =============================================================================

export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  xxl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
} as const

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: '0',
  xs: '2px',
  sm: '4px', 
  md: '6px',
  lg: '8px',
  xl: '12px',
  xxl: '16px',
  xxxl: '24px',
  full: '9999px'
} as const

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
  xs: '320px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1400px'
} as const

// =============================================================================
// Z-INDEX SCALE
// =============================================================================

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800
} as const

// =============================================================================
// ANIMATION & TRANSITIONS
// =============================================================================

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
  slower: '500ms ease-in-out'
} as const

export const animations = {
  fadeIn: 'fadeIn 200ms ease-in-out',
  slideUp: 'slideUp 300ms ease-out',
  slideDown: 'slideDown 300ms ease-out',
  scaleIn: 'scaleIn 200ms ease-out',
  bounce: 'bounce 600ms ease-in-out'
} as const

// =============================================================================
// LAYOUT CONSTANTS
// =============================================================================

export const layout = {
  header: {
    height: '64px',
    heightMobile: '56px'
  },
  sidebar: {
    width: '280px',
    widthCollapsed: '64px',
    widthMobile: '100%'
  },
  container: {
    maxWidth: '1200px',
    padding: spacing.xl
  },
  content: {
    maxWidth: '1024px',
    padding: spacing.lg
  }
} as const

// =============================================================================
// ICON STANDARDIZATION
// =============================================================================

export const iconSizes = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48
} as const

// =============================================================================
// COMPONENT VARIANTS
// =============================================================================

export const variants = {
  button: {
    primary: {
      backgroundColor: brandColors.whatsapp.primary,
      color: '#FFFFFF',
      borderColor: brandColors.whatsapp.primary
    },
    secondary: {
      backgroundColor: 'transparent',
      color: brandColors.whatsapp.primary,
      borderColor: brandColors.whatsapp.primary
    },
    ghost: {
      backgroundColor: 'transparent',
      color: brandColors.neutral[700],
      borderColor: 'transparent'
    }
  },
  
  card: {
    elevated: {
      boxShadow: shadows.md,
      borderColor: brandColors.neutral[200]
    },
    flat: {
      boxShadow: 'none',
      borderColor: brandColors.neutral[200]
    },
    bordered: {
      boxShadow: 'none', 
      borderWidth: '1px',
      borderColor: brandColors.neutral[300]
    }
  }
} as const

// =============================================================================
// UTILITY CLASSES
// =============================================================================

export const utilityClasses = {
  // Text utilities
  textCenter: { textAlign: 'center' as const },
  textLeft: { textAlign: 'left' as const },
  textRight: { textAlign: 'right' as const },
  
  // Spacing utilities  
  marginAuto: { margin: 'auto' },
  paddingZero: { padding: 0 },
  marginZero: { margin: 0 },
  
  // Display utilities
  flexCenter: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  flexBetween: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  flexStart: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'flex-start' 
  },
  
  // Visibility utilities
  hidden: { display: 'none' },
  visible: { display: 'block' }
} as const

// =============================================================================
// EXPORT DESIGN SYSTEM
// =============================================================================

export const designSystem = {
  typography,
  spacing,
  colors: brandColors,
  mantineColors,
  componentSizes,
  shadows,
  borderRadius,
  breakpoints,
  zIndex,
  transitions,
  animations,
  layout,
  iconSizes,
  variants,
  utilityClasses
} as const

export type DesignSystem = typeof designSystem

// Default export for easy importing
export default designSystem