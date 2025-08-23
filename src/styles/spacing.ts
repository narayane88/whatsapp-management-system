/**
 * Spacing Utilities - Consistent Spacing System
 * 
 * This file provides utility functions and classes for consistent spacing
 * across the WhatsApp Management System application.
 */

import { designSystem } from './design-system'

// Spacing scale mapping for components
export const spacingScale = {
  none: '0',
  xs: designSystem.spacing.xs,
  sm: designSystem.spacing.sm,
  md: designSystem.spacing.md,
  lg: designSystem.spacing.lg,
  xl: designSystem.spacing.xl,
  xxl: designSystem.spacing.xxl,
  xxxl: designSystem.spacing.xxxl,
  xxxxl: designSystem.spacing.xxxxl,
  xxxxxl: designSystem.spacing.xxxxxl
} as const

// Utility function to get spacing value
export const getSpacing = (size: keyof typeof spacingScale): string => {
  return spacingScale[size]
}

// Common spacing patterns for layouts
export const layoutSpacing = {
  // Page-level spacing
  page: {
    padding: spacingScale.xl,
    paddingMobile: spacingScale.lg,
    maxWidth: '1200px',
    sectionGap: spacingScale.xxxl
  },
  
  // Card spacing
  card: {
    padding: spacingScale.lg,
    paddingCompact: spacingScale.md,
    gap: spacingScale.md,
    headerGap: spacingScale.sm
  },
  
  // Form spacing
  form: {
    fieldGap: spacingScale.lg,
    fieldGapCompact: spacingScale.md,
    groupGap: spacingScale.xl,
    buttonGap: spacingScale.md
  },
  
  // Navigation spacing
  navigation: {
    itemGap: spacingScale.sm,
    sectionGap: spacingScale.lg,
    padding: spacingScale.md
  },
  
  // List spacing
  list: {
    itemGap: spacingScale.sm,
    sectionGap: spacingScale.lg,
    padding: spacingScale.md
  },
  
  // Modal spacing
  modal: {
    padding: spacingScale.xl,
    headerGap: spacingScale.lg,
    contentGap: spacingScale.md,
    footerGap: spacingScale.lg
  }
} as const

// Responsive spacing utilities
export const responsiveSpacing = {
  // Responsive padding classes
  padding: {
    responsive: `
      padding: ${spacingScale.lg};
      @media (max-width: 768px) {
        padding: ${spacingScale.md};
      }
    `,
    
    responsiveX: `
      padding-left: ${spacingScale.lg};
      padding-right: ${spacingScale.lg};
      @media (max-width: 768px) {
        padding-left: ${spacingScale.md};
        padding-right: ${spacingScale.md};
      }
    `,
    
    responsiveY: `
      padding-top: ${spacingScale.lg};
      padding-bottom: ${spacingScale.lg};
      @media (max-width: 768px) {
        padding-top: ${spacingScale.md};
        padding-bottom: ${spacingScale.md};
      }
    `
  },
  
  // Responsive margin classes
  margin: {
    responsive: `
      margin: ${spacingScale.lg};
      @media (max-width: 768px) {
        margin: ${spacingScale.md};
      }
    `,
    
    responsiveY: `
      margin-top: ${spacingScale.lg};
      margin-bottom: ${spacingScale.lg};
      @media (max-width: 768px) {
        margin-top: ${spacingScale.md};
        margin-bottom: ${spacingScale.md};
      }
    `
  },
  
  // Gap utilities for flexbox and grid
  gap: {
    responsive: `
      gap: ${spacingScale.lg};
      @media (max-width: 768px) {
        gap: ${spacingScale.md};
      }
    `,
    
    responsiveSmall: `
      gap: ${spacingScale.md};
      @media (max-width: 768px) {
        gap: ${spacingScale.sm};
      }
    `
  }
} as const

// Component-specific spacing configurations
export const componentSpacing = {
  // Button spacing
  button: {
    paddingX: {
      xs: spacingScale.sm,
      sm: spacingScale.md,
      md: spacingScale.lg,
      lg: spacingScale.xl,
      xl: spacingScale.xxl
    },
    paddingY: {
      xs: spacingScale.xs,
      sm: spacingScale.sm,
      md: spacingScale.md,
      lg: spacingScale.lg,
      xl: spacingScale.xl
    },
    gap: spacingScale.sm
  },
  
  // Input spacing
  input: {
    paddingX: spacingScale.md,
    paddingY: spacingScale.sm,
    gap: spacingScale.xs
  },
  
  // Table spacing
  table: {
    cellPadding: spacingScale.md,
    cellPaddingCompact: spacingScale.sm,
    rowGap: spacingScale.xs,
    headerPadding: spacingScale.lg
  },
  
  // Dashboard spacing
  dashboard: {
    gridGap: spacingScale.lg,
    gridGapMobile: spacingScale.md,
    cardGap: spacingScale.md,
    sectionGap: spacingScale.xxl
  }
} as const

// Utility CSS classes as template strings for styled-components or CSS-in-JS
export const spacingClasses = {
  // Margin utilities
  'mt-xs': `margin-top: ${spacingScale.xs};`,
  'mt-sm': `margin-top: ${spacingScale.sm};`,
  'mt-md': `margin-top: ${spacingScale.md};`,
  'mt-lg': `margin-top: ${spacingScale.lg};`,
  'mt-xl': `margin-top: ${spacingScale.xl};`,
  'mt-xxl': `margin-top: ${spacingScale.xxl};`,
  
  'mb-xs': `margin-bottom: ${spacingScale.xs};`,
  'mb-sm': `margin-bottom: ${spacingScale.sm};`,
  'mb-md': `margin-bottom: ${spacingScale.md};`,
  'mb-lg': `margin-bottom: ${spacingScale.lg};`,
  'mb-xl': `margin-bottom: ${spacingScale.xl};`,
  'mb-xxl': `margin-bottom: ${spacingScale.xxl};`,
  
  'ml-xs': `margin-left: ${spacingScale.xs};`,
  'ml-sm': `margin-left: ${spacingScale.sm};`,
  'ml-md': `margin-left: ${spacingScale.md};`,
  'ml-lg': `margin-left: ${spacingScale.lg};`,
  'ml-xl': `margin-left: ${spacingScale.xl};`,
  'ml-auto': `margin-left: auto;`,
  
  'mr-xs': `margin-right: ${spacingScale.xs};`,
  'mr-sm': `margin-right: ${spacingScale.sm};`,
  'mr-md': `margin-right: ${spacingScale.md};`,
  'mr-lg': `margin-right: ${spacingScale.lg};`,
  'mr-xl': `margin-right: ${spacingScale.xl};`,
  'mr-auto': `margin-right: auto;`,
  
  // Padding utilities
  'pt-xs': `padding-top: ${spacingScale.xs};`,
  'pt-sm': `padding-top: ${spacingScale.sm};`,
  'pt-md': `padding-top: ${spacingScale.md};`,
  'pt-lg': `padding-top: ${spacingScale.lg};`,
  'pt-xl': `padding-top: ${spacingScale.xl};`,
  'pt-xxl': `padding-top: ${spacingScale.xxl};`,
  
  'pb-xs': `padding-bottom: ${spacingScale.xs};`,
  'pb-sm': `padding-bottom: ${spacingScale.sm};`,
  'pb-md': `padding-bottom: ${spacingScale.md};`,
  'pb-lg': `padding-bottom: ${spacingScale.lg};`,
  'pb-xl': `padding-bottom: ${spacingScale.xl};`,
  'pb-xxl': `padding-bottom: ${spacingScale.xxl};`,
  
  'pl-xs': `padding-left: ${spacingScale.xs};`,
  'pl-sm': `padding-left: ${spacingScale.sm};`,
  'pl-md': `padding-left: ${spacingScale.md};`,
  'pl-lg': `padding-left: ${spacingScale.lg};`,
  'pl-xl': `padding-left: ${spacingScale.xl};`,
  
  'pr-xs': `padding-right: ${spacingScale.xs};`,
  'pr-sm': `padding-right: ${spacingScale.sm};`,
  'pr-md': `padding-right: ${spacingScale.md};`,
  'pr-lg': `padding-right: ${spacingScale.lg};`,
  'pr-xl': `padding-right: ${spacingScale.xl};`,
  
  // Gap utilities
  'gap-xs': `gap: ${spacingScale.xs};`,
  'gap-sm': `gap: ${spacingScale.sm};`,
  'gap-md': `gap: ${spacingScale.md};`,
  'gap-lg': `gap: ${spacingScale.lg};`,
  'gap-xl': `gap: ${spacingScale.xl};`,
  'gap-xxl': `gap: ${spacingScale.xxl};`
} as const

// Type definitions for spacing utilities
export type SpacingSize = keyof typeof spacingScale
export type SpacingValue = (typeof spacingScale)[SpacingSize]