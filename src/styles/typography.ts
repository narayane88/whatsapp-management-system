/**
 * Typography Utilities - Consistent Typography System
 * 
 * This file provides utility functions and classes for consistent typography
 * across the WhatsApp Management System application.
 */

import { designSystem } from './design-system'

// Typography scale mapping
export const typographyScale = {
  // Font sizes
  sizes: {
    xs: designSystem.typography.sizes.xs,
    sm: designSystem.typography.sizes.sm,
    md: designSystem.typography.sizes.md,
    lg: designSystem.typography.sizes.lg,
    xl: designSystem.typography.sizes.xl,
    xxl: designSystem.typography.sizes.xxl,
    xxxl: designSystem.typography.sizes.xxxl
  },
  
  // Font weights
  weights: {
    normal: designSystem.typography.weights.normal,
    medium: designSystem.typography.weights.medium,
    semibold: designSystem.typography.weights.semibold,
    bold: designSystem.typography.weights.bold,
    extrabold: designSystem.typography.weights.extrabold
  },
  
  // Line heights
  lineHeights: {
    tight: designSystem.typography.lineHeights.tight,
    normal: designSystem.typography.lineHeights.normal,
    relaxed: designSystem.typography.lineHeights.relaxed,
    loose: designSystem.typography.lineHeights.loose
  },
  
  // Font families
  fonts: {
    primary: designSystem.typography.fonts.primary,
    heading: designSystem.typography.fonts.heading,
    mono: designSystem.typography.fonts.mono
  }
} as const

// Text style presets for common UI patterns
export const textPresets = {
  // Heading styles
  headings: {
    h1: {
      fontSize: typographyScale.sizes.xxxl,
      fontWeight: typographyScale.weights.bold,
      lineHeight: typographyScale.lineHeights.tight,
      fontFamily: typographyScale.fonts.heading,
      letterSpacing: '-0.025em',
      color: designSystem.colors.neutral[900]
    },
    h2: {
      fontSize: typographyScale.sizes.xxl,
      fontWeight: typographyScale.weights.semibold,
      lineHeight: typographyScale.lineHeights.tight,
      fontFamily: typographyScale.fonts.heading,
      letterSpacing: '-0.025em',
      color: designSystem.colors.neutral[900]
    },
    h3: {
      fontSize: typographyScale.sizes.xl,
      fontWeight: typographyScale.weights.semibold,
      lineHeight: typographyScale.lineHeights.tight,
      fontFamily: typographyScale.fonts.heading,
      color: designSystem.colors.neutral[900]
    },
    h4: {
      fontSize: typographyScale.sizes.lg,
      fontWeight: typographyScale.weights.semibold,
      lineHeight: typographyScale.lineHeights.normal,
      fontFamily: typographyScale.fonts.heading,
      color: designSystem.colors.neutral[900]
    },
    h5: {
      fontSize: typographyScale.sizes.md,
      fontWeight: typographyScale.weights.medium,
      lineHeight: typographyScale.lineHeights.normal,
      fontFamily: typographyScale.fonts.heading,
      color: designSystem.colors.neutral[900]
    },
    h6: {
      fontSize: typographyScale.sizes.sm,
      fontWeight: typographyScale.weights.medium,
      lineHeight: typographyScale.lineHeights.normal,
      fontFamily: typographyScale.fonts.heading,
      color: designSystem.colors.neutral[900]
    }
  },
  
  // Body text styles
  body: {
    large: {
      fontSize: typographyScale.sizes.lg,
      fontWeight: typographyScale.weights.normal,
      lineHeight: typographyScale.lineHeights.relaxed,
      fontFamily: typographyScale.fonts.primary,
      color: designSystem.colors.neutral[700]
    },
    normal: {
      fontSize: typographyScale.sizes.md,
      fontWeight: typographyScale.weights.normal,
      lineHeight: typographyScale.lineHeights.relaxed,
      fontFamily: typographyScale.fonts.primary,
      color: designSystem.colors.neutral[700]
    },
    small: {
      fontSize: typographyScale.sizes.sm,
      fontWeight: typographyScale.weights.normal,
      lineHeight: typographyScale.lineHeights.normal,
      fontFamily: typographyScale.fonts.primary,
      color: designSystem.colors.neutral[600]
    },
    caption: {
      fontSize: typographyScale.sizes.xs,
      fontWeight: typographyScale.weights.normal,
      lineHeight: typographyScale.lineHeights.normal,
      fontFamily: typographyScale.fonts.primary,
      color: designSystem.colors.neutral[500]
    }
  },
  
  // UI element text styles
  ui: {
    button: {
      fontSize: typographyScale.sizes.sm,
      fontWeight: typographyScale.weights.medium,
      lineHeight: typographyScale.lineHeights.normal,
      fontFamily: typographyScale.fonts.primary,
      letterSpacing: '0.025em'
    },
    label: {
      fontSize: typographyScale.sizes.sm,
      fontWeight: typographyScale.weights.medium,
      lineHeight: typographyScale.lineHeights.normal,
      fontFamily: typographyScale.fonts.primary,
      color: designSystem.colors.neutral[700]
    },
    input: {
      fontSize: typographyScale.sizes.md,
      fontWeight: typographyScale.weights.normal,
      lineHeight: typographyScale.lineHeights.normal,
      fontFamily: typographyScale.fonts.primary,
      color: designSystem.colors.neutral[900]
    },
    placeholder: {
      fontSize: typographyScale.sizes.md,
      fontWeight: typographyScale.weights.normal,
      lineHeight: typographyScale.lineHeights.normal,
      fontFamily: typographyScale.fonts.primary,
      color: designSystem.colors.neutral[400]
    }
  },
  
  // Special text styles
  special: {
    code: {
      fontSize: typographyScale.sizes.sm,
      fontWeight: typographyScale.weights.normal,
      lineHeight: typographyScale.lineHeights.relaxed,
      fontFamily: typographyScale.fonts.mono,
      color: designSystem.colors.neutral[800],
      backgroundColor: designSystem.colors.neutral[100],
      padding: '0.125rem 0.25rem',
      borderRadius: designSystem.borderRadius.sm
    },
    link: {
      fontSize: 'inherit',
      fontWeight: 'inherit',
      lineHeight: 'inherit',
      fontFamily: 'inherit',
      color: designSystem.colors.whatsapp.primary,
      textDecoration: 'none',
      cursor: 'pointer',
      transition: designSystem.transitions.normal
    },
    accent: {
      fontSize: 'inherit',
      fontWeight: typographyScale.weights.semibold,
      lineHeight: 'inherit',
      fontFamily: 'inherit',
      color: designSystem.colors.whatsapp.primary
    }
  }
} as const

// Responsive typography utilities
export const responsiveTypography = {
  // Responsive heading styles
  heading: {
    responsive: `
      font-size: ${typographyScale.sizes.xxl};
      @media (max-width: 768px) {
        font-size: ${typographyScale.sizes.xl};
      }
    `,
    
    responsiveLarge: `
      font-size: ${typographyScale.sizes.xxxl};
      @media (max-width: 768px) {
        font-size: ${typographyScale.sizes.xxl};
      }
    `
  },
  
  // Responsive body text
  body: {
    responsive: `
      font-size: ${typographyScale.sizes.md};
      line-height: ${typographyScale.lineHeights.relaxed};
      @media (max-width: 768px) {
        font-size: ${typographyScale.sizes.sm};
        line-height: ${typographyScale.lineHeights.normal};
      }
    `
  }
} as const

// Utility functions for getting typography values
export const getTypographyValue = {
  fontSize: (size: keyof typeof typographyScale.sizes): string => {
    return typographyScale.sizes[size]
  },
  
  fontWeight: (weight: keyof typeof typographyScale.weights): number => {
    return typographyScale.weights[weight]
  },
  
  lineHeight: (height: keyof typeof typographyScale.lineHeights): number => {
    return typographyScale.lineHeights[height]
  },
  
  fontFamily: (family: keyof typeof typographyScale.fonts): string => {
    return typographyScale.fonts[family]
  }
} as const

// Typography CSS classes as template strings
export const typographyClasses = {
  // Font size utilities
  'text-xs': `font-size: ${typographyScale.sizes.xs};`,
  'text-sm': `font-size: ${typographyScale.sizes.sm};`,
  'text-md': `font-size: ${typographyScale.sizes.md};`,
  'text-lg': `font-size: ${typographyScale.sizes.lg};`,
  'text-xl': `font-size: ${typographyScale.sizes.xl};`,
  'text-xxl': `font-size: ${typographyScale.sizes.xxl};`,
  'text-xxxl': `font-size: ${typographyScale.sizes.xxxl};`,
  
  // Font weight utilities
  'font-normal': `font-weight: ${typographyScale.weights.normal};`,
  'font-medium': `font-weight: ${typographyScale.weights.medium};`,
  'font-semibold': `font-weight: ${typographyScale.weights.semibold};`,
  'font-bold': `font-weight: ${typographyScale.weights.bold};`,
  'font-extrabold': `font-weight: ${typographyScale.weights.extrabold};`,
  
  // Line height utilities
  'leading-tight': `line-height: ${typographyScale.lineHeights.tight};`,
  'leading-normal': `line-height: ${typographyScale.lineHeights.normal};`,
  'leading-relaxed': `line-height: ${typographyScale.lineHeights.relaxed};`,
  'leading-loose': `line-height: ${typographyScale.lineHeights.loose};`,
  
  // Font family utilities
  'font-primary': `font-family: ${typographyScale.fonts.primary};`,
  'font-heading': `font-family: ${typographyScale.fonts.heading};`,
  'font-mono': `font-family: ${typographyScale.fonts.mono};`,
  
  // Text alignment utilities
  'text-left': 'text-align: left;',
  'text-center': 'text-align: center;',
  'text-right': 'text-align: right;',
  'text-justify': 'text-align: justify;',
  
  // Text decoration utilities
  'no-underline': 'text-decoration: none;',
  'underline': 'text-decoration: underline;',
  'line-through': 'text-decoration: line-through;',
  
  // Text transform utilities
  'uppercase': 'text-transform: uppercase;',
  'lowercase': 'text-transform: lowercase;',
  'capitalize': 'text-transform: capitalize;',
  'normal-case': 'text-transform: none;',
  
  // Text overflow utilities
  'truncate': `
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  'text-ellipsis': 'text-overflow: ellipsis;',
  'text-clip': 'text-overflow: clip;'
} as const

// Component-specific typography configurations
export const componentTypography = {
  // Button typography variants
  button: {
    small: {
      ...textPresets.ui.button,
      fontSize: typographyScale.sizes.xs
    },
    medium: textPresets.ui.button,
    large: {
      ...textPresets.ui.button,
      fontSize: typographyScale.sizes.md
    }
  },
  
  // Card typography
  card: {
    title: {
      fontSize: typographyScale.sizes.lg,
      fontWeight: typographyScale.weights.semibold,
      lineHeight: typographyScale.lineHeights.tight,
      color: designSystem.colors.neutral[900]
    },
    subtitle: {
      fontSize: typographyScale.sizes.sm,
      fontWeight: typographyScale.weights.normal,
      lineHeight: typographyScale.lineHeights.normal,
      color: designSystem.colors.neutral[600]
    },
    content: textPresets.body.normal
  },
  
  // Form typography
  form: {
    label: textPresets.ui.label,
    input: textPresets.ui.input,
    error: {
      fontSize: typographyScale.sizes.sm,
      fontWeight: typographyScale.weights.normal,
      color: designSystem.colors.status.error
    },
    help: {
      fontSize: typographyScale.sizes.sm,
      fontWeight: typographyScale.weights.normal,
      color: designSystem.colors.neutral[500]
    }
  }
} as const

// Type definitions for typography utilities
export type FontSize = keyof typeof typographyScale.sizes
export type FontWeight = keyof typeof typographyScale.weights
export type LineHeight = keyof typeof typographyScale.lineHeights
export type FontFamily = keyof typeof typographyScale.fonts