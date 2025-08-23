/**
 * Layout Utilities - Consistent Layout System
 * 
 * This file provides utility functions and patterns for consistent layouts
 * across the WhatsApp Management System application.
 */

import { designSystem } from './design-system'
import { spacingScale } from './spacing'

// Container configurations
export const containers = {
  // Page-level containers
  page: {
    maxWidth: '1200px',
    padding: spacingScale.xl,
    paddingMobile: spacingScale.lg,
    margin: '0 auto',
    
    css: `
      max-width: 1200px;
      margin: 0 auto;
      padding: ${spacingScale.xl};
      @media (max-width: 768px) {
        padding: ${spacingScale.lg};
      }
    `
  },
  
  // Content containers
  content: {
    maxWidth: '800px',
    padding: spacingScale.lg,
    paddingMobile: spacingScale.md,
    margin: '0 auto',
    
    css: `
      max-width: 800px;
      margin: 0 auto;
      padding: ${spacingScale.lg};
      @media (max-width: 768px) {
        padding: ${spacingScale.md};
      }
    `
  },
  
  // Narrow containers for forms
  narrow: {
    maxWidth: '480px',
    padding: spacingScale.md,
    margin: '0 auto',
    
    css: `
      max-width: 480px;
      margin: 0 auto;
      padding: ${spacingScale.md};
    `
  },
  
  // Full width containers
  fluid: {
    width: '100%',
    padding: spacingScale.lg,
    paddingMobile: spacingScale.md,
    
    css: `
      width: 100%;
      padding: ${spacingScale.lg};
      @media (max-width: 768px) {
        padding: ${spacingScale.md};
      }
    `
  }
} as const

// Grid system configurations
export const gridSystem = {
  // Standard grid
  standard: {
    columns: 12,
    gap: spacingScale.lg,
    gapMobile: spacingScale.md,
    
    css: `
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: ${spacingScale.lg};
      @media (max-width: 768px) {
        gap: ${spacingScale.md};
      }
    `
  },
  
  // Auto-fit grid for cards
  cards: {
    minColumnWidth: '300px',
    gap: spacingScale.lg,
    gapMobile: spacingScale.md,
    
    css: `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: ${spacingScale.lg};
      @media (max-width: 768px) {
        gap: ${spacingScale.md};
        grid-template-columns: 1fr;
      }
    `
  },
  
  // Metrics grid for dashboard
  metrics: {
    minColumnWidth: '250px',
    gap: spacingScale.md,
    gapMobile: spacingScale.sm,
    
    css: `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: ${spacingScale.md};
      @media (max-width: 768px) {
        gap: ${spacingScale.sm};
        grid-template-columns: 1fr;
      }
    `
  },
  
  // Two column layout
  twoColumn: {
    gap: spacingScale.xl,
    gapMobile: spacingScale.lg,
    ratio: '2fr 1fr', // Main content + sidebar
    
    css: `
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: ${spacingScale.xl};
      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
        gap: ${spacingScale.lg};
      }
    `
  }
} as const

// Flexbox patterns
export const flexPatterns = {
  // Center content both ways
  center: {
    css: `
      display: flex;
      align-items: center;
      justify-content: center;
    `
  },
  
  // Space between items
  spaceBetween: {
    css: `
      display: flex;
      align-items: center;
      justify-content: space-between;
    `
  },
  
  // Vertical stack
  column: {
    gap: spacingScale.md,
    
    css: `
      display: flex;
      flex-direction: column;
      gap: ${spacingScale.md};
    `
  },
  
  // Horizontal row
  row: {
    gap: spacingScale.md,
    
    css: `
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: ${spacingScale.md};
    `
  },
  
  // Wrap content
  wrap: {
    gap: spacingScale.md,
    
    css: `
      display: flex;
      flex-wrap: wrap;
      gap: ${spacingScale.md};
    `
  }
} as const

// Common layout components
export const layoutComponents = {
  // Header layout
  header: {
    height: '64px',
    padding: `0 ${spacingScale.xl}`,
    paddingMobile: `0 ${spacingScale.lg}`,
    
    css: `
      height: 64px;
      padding: 0 ${spacingScale.xl};
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid ${designSystem.colors.neutral[200]};
      background-color: white;
      position: sticky;
      top: 0;
      z-index: ${designSystem.zIndex.sticky};
      @media (max-width: 768px) {
        padding: 0 ${spacingScale.lg};
      }
    `
  },
  
  // Sidebar layout
  sidebar: {
    width: '280px',
    widthCollapsed: '64px',
    padding: spacingScale.lg,
    
    css: `
      width: 280px;
      padding: ${spacingScale.lg};
      border-right: 1px solid ${designSystem.colors.neutral[200]};
      background-color: white;
      height: 100vh;
      position: sticky;
      top: 0;
      overflow-y: auto;
      
      &.collapsed {
        width: 64px;
        padding: ${spacingScale.md};
      }
      
      @media (max-width: 1024px) {
        position: fixed;
        top: 0;
        left: 0;
        z-index: ${designSystem.zIndex.modal};
        transform: translateX(-100%);
        transition: transform ${designSystem.transitions.normal};
        
        &.open {
          transform: translateX(0);
        }
      }
    `
  },
  
  // Main content area
  main: {
    flex: 1,
    padding: spacingScale.xl,
    paddingMobile: spacingScale.lg,
    
    css: `
      flex: 1;
      padding: ${spacingScale.xl};
      min-height: calc(100vh - 64px);
      @media (max-width: 768px) {
        padding: ${spacingScale.lg};
      }
    `
  },
  
  // Footer layout
  footer: {
    padding: `${spacingScale.lg} ${spacingScale.xl}`,
    paddingMobile: `${spacingScale.lg} ${spacingScale.lg}`,
    
    css: `
      padding: ${spacingScale.lg} ${spacingScale.xl};
      border-top: 1px solid ${designSystem.colors.neutral[200]};
      background-color: ${designSystem.colors.neutral[50]};
      @media (max-width: 768px) {
        padding: ${spacingScale.lg};
      }
    `
  }
} as const

// Card and panel layouts
export const cardLayouts = {
  // Standard card
  standard: {
    padding: spacingScale.lg,
    borderRadius: designSystem.borderRadius.xl,
    
    css: `
      padding: ${spacingScale.lg};
      border-radius: ${designSystem.borderRadius.xl};
      border: 1px solid ${designSystem.colors.neutral[200]};
      background-color: white;
      box-shadow: ${designSystem.shadows.sm};
    `
  },
  
  // Compact card
  compact: {
    padding: spacingScale.md,
    borderRadius: designSystem.borderRadius.lg,
    
    css: `
      padding: ${spacingScale.md};
      border-radius: ${designSystem.borderRadius.lg};
      border: 1px solid ${designSystem.colors.neutral[200]};
      background-color: white;
    `
  },
  
  // Elevated card
  elevated: {
    padding: spacingScale.lg,
    borderRadius: designSystem.borderRadius.xl,
    
    css: `
      padding: ${spacingScale.lg};
      border-radius: ${designSystem.borderRadius.xl};
      background-color: white;
      box-shadow: ${designSystem.shadows.md};
    `
  }
} as const

// Form layouts
export const formLayouts = {
  // Standard form
  standard: {
    maxWidth: '600px',
    gap: spacingScale.lg,
    
    css: `
      max-width: 600px;
      display: flex;
      flex-direction: column;
      gap: ${spacingScale.lg};
    `
  },
  
  // Inline form
  inline: {
    gap: spacingScale.md,
    
    css: `
      display: flex;
      align-items: end;
      gap: ${spacingScale.md};
      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
      }
    `
  },
  
  // Grid form
  grid: {
    gap: spacingScale.lg,
    columns: 2,
    
    css: `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: ${spacingScale.lg};
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    `
  }
} as const

// Responsive breakpoints
export const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1200px',
  wide: '1400px'
} as const

// Media query utilities
export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.tablet})`,
  wide: `@media (min-width: ${breakpoints.wide})`,
  
  // Mobile first approach
  mobileUp: `@media (min-width: ${breakpoints.mobile})`,
  tabletUp: `@media (min-width: ${breakpoints.tablet})`,
  desktopUp: `@media (min-width: ${breakpoints.desktop})`
} as const

// Z-index layers
export const zIndexLayers = {
  base: designSystem.zIndex.base,
  docked: designSystem.zIndex.docked,
  dropdown: designSystem.zIndex.dropdown,
  sticky: designSystem.zIndex.sticky,
  banner: designSystem.zIndex.banner,
  overlay: designSystem.zIndex.overlay,
  modal: designSystem.zIndex.modal,
  popover: designSystem.zIndex.popover,
  tooltip: designSystem.zIndex.tooltip,
  toast: designSystem.zIndex.toast
} as const

// Type definitions
export type ContainerType = keyof typeof containers
export type GridType = keyof typeof gridSystem
export type FlexPattern = keyof typeof flexPatterns
export type LayoutComponent = keyof typeof layoutComponents
export type CardLayout = keyof typeof cardLayouts
export type FormLayout = keyof typeof formLayouts