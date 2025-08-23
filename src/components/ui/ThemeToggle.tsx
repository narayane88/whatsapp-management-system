'use client'

import { ActionIcon, Tooltip } from '@mantine/core'
import { FiSun, FiMoon } from 'react-icons/fi'
import { useTheme } from '@/hooks/useTheme'
import { predefinedThemes } from '@/types/theme'

interface ThemeToggleProps {
  size?: number
  variant?: 'default' | 'filled' | 'light' | 'outline' | 'subtle' | 'transparent'
}

export function ThemeToggle({ size = 30, variant = 'default' }: ThemeToggleProps) {
  const { currentTheme, setTheme } = useTheme()
  
  const toggleTheme = () => {
    // Toggle between light and dark themes
    const lightTheme = predefinedThemes.find(t => t.id === 'light')
    const darkTheme = predefinedThemes.find(t => t.id === 'dark')
    
    if (currentTheme.other?.colorScheme === 'light') {
      if (darkTheme) setTheme(darkTheme)
    } else {
      if (lightTheme) setTheme(lightTheme)
    }
  }
  
  const isLight = currentTheme.other?.colorScheme === 'light'
  
  return (
    <Tooltip label={`Switch to ${isLight ? 'dark' : 'light'} theme`}>
      <ActionIcon
        variant={variant}
        onClick={toggleTheme}
        size={size}
        aria-label="Toggle theme"
      >
        {isLight ? <FiMoon size={16} /> : <FiSun size={16} />}
      </ActionIcon>
    </Tooltip>
  )
}