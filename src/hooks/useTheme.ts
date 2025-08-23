'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { CustomTheme, predefinedThemes } from '@/types/theme'

interface ThemeContextType {
  currentTheme: CustomTheme
  setTheme: (theme: CustomTheme) => void
  themes: CustomTheme[]
  isLoading: boolean
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function useThemeState() {
  const [currentTheme, setCurrentTheme] = useState<CustomTheme>(predefinedThemes[0])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load theme from localStorage on mount
    const loadTheme = () => {
      try {
        const savedTheme = localStorage.getItem('whatsapp-theme')
        if (savedTheme) {
          const parsed = JSON.parse(savedTheme)
          const foundTheme = predefinedThemes.find(theme => theme.id === parsed.id)
          if (foundTheme) {
            setCurrentTheme(foundTheme)
          }
        }
      } catch (error) {

      } finally {
        setIsLoading(false)
      }
    }

    loadTheme()
  }, [])

  const setTheme = (theme: CustomTheme) => {
    setCurrentTheme(theme)
    try {
      localStorage.setItem('whatsapp-theme', JSON.stringify({ id: theme.id }))
    } catch (error) {

    }
  }

  return {
    currentTheme,
    setTheme,
    themes: predefinedThemes,
    isLoading
  }
}