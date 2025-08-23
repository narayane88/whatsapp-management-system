'use client'

import { ReactNode, useEffect, useState } from 'react'
import { MantineProvider, createTheme, MantineColorsTuple } from '@mantine/core'
import { ThemeContext, useThemeState } from '@/hooks/useTheme'

interface ThemeProviderProps {
  children: ReactNode
}

export function CustomThemeProvider({ children }: ThemeProviderProps) {
  const themeState = useThemeState()
  const { currentTheme, isLoading } = themeState
  const [mounted, setMounted] = useState(false)

  // Ensure client-side hydration is complete
  useEffect(() => {
    setMounted(true)
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Theme loading timed out, forcing mount')
        setMounted(true)
      }
    }, 3000)
    
    return () => clearTimeout(timeout)
  }, [])

  // Create Mantine theme based on current theme
  const mantineTheme = createTheme({
    primaryColor: currentTheme.primaryColor,
    ...(currentTheme.colors && { colors: currentTheme.colors }),
    ...(currentTheme.components && { components: currentTheme.components }),
    ...(currentTheme.other && { other: currentTheme.other })
  })

  if (!mounted) {
    return (
      <MantineProvider defaultColorScheme="light">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading theme...
        </div>
      </MantineProvider>
    )
  }

  return (
    <ThemeContext.Provider value={themeState}>
      <MantineProvider 
        theme={mantineTheme} 
        defaultColorScheme={currentTheme.other?.colorScheme || 'light'}
      >
        {children}
      </MantineProvider>
    </ThemeContext.Provider>
  )
}