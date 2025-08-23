'use client'

import { useTheme } from './useTheme'

/**
 * Hook to get theme-aware colors for consistent theming across the app
 */
export function useThemeColors() {
  const { currentTheme } = useTheme()

  return {
    // Primary colors
    primary: currentTheme.primaryColor,
    primaryLight: `${currentTheme.primaryColor}.1`,
    primaryMedium: `${currentTheme.primaryColor}.4`,
    primaryDark: `${currentTheme.primaryColor}.6`,
    primaryStrong: `${currentTheme.primaryColor}.7`,
    primaryText: `${currentTheme.primaryColor}.8`,

    // Background colors based on color scheme
    background: currentTheme.other?.colorScheme === 'dark' ? 'dark.9' : 'gray.1',
    backgroundLight: currentTheme.other?.colorScheme === 'dark' ? 'dark.8' : 'gray.0',
    backgroundCard: currentTheme.other?.colorScheme === 'dark' ? 'dark.7' : 'white',

    // Text colors
    text: currentTheme.other?.colorScheme === 'dark' ? 'gray.1' : 'gray.9',
    textDimmed: 'dimmed',

    // Border colors
    border: currentTheme.other?.colorScheme === 'dark' ? 'dark.4' : 'gray.3',

    // CSS custom properties
    cssVars: {
      primary: `var(--mantine-color-${currentTheme.primaryColor}-6)`,
      primaryLight: `var(--mantine-color-${currentTheme.primaryColor}-1)`,
      primaryBorder: `var(--mantine-color-${currentTheme.primaryColor}-3)`,
      primaryHover: `var(--mantine-color-${currentTheme.primaryColor}-7)`,
    },

    // Theme info
    theme: currentTheme,
    isDark: currentTheme.other?.colorScheme === 'dark'
  }
}