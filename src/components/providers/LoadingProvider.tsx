'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import WhatsAppPageLoader from '@/components/ui/WhatsAppPageLoader'

interface LoadingContextType {
  showLoading: (
    variant?: 'connecting' | 'loading' | 'sending' | 'custom',
    message?: string,
    showProgress?: boolean
  ) => void
  hideLoading: () => void
  isLoading: boolean
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

interface LoadingProviderProps {
  children: ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState<{
    variant: 'connecting' | 'loading' | 'sending' | 'custom'
    message?: string
    showProgress?: boolean
  }>({
    variant: 'loading',
    message: undefined,
    showProgress: false
  })

  const showLoading = (
    variant: 'connecting' | 'loading' | 'sending' | 'custom' = 'loading',
    message?: string,
    showProgress = false
  ) => {
    setLoadingConfig({ variant, message, showProgress })
    setIsLoading(true)
  }

  const hideLoading = () => {
    setIsLoading(false)
  }

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading }}>
      {children}
      {isLoading && (
        <WhatsAppPageLoader
          variant={loadingConfig.variant}
          customMessage={loadingConfig.message}
          showProgress={loadingConfig.showProgress}
          fullScreen={true}
        />
      )}
    </LoadingContext.Provider>
  )
}

// Hook for API calls with loading
export function useLoadingApi() {
  const { showLoading, hideLoading } = useLoading()

  const withLoading = async <T,>(
    apiCall: () => Promise<T>,
    options?: {
      variant?: 'connecting' | 'loading' | 'sending' | 'custom'
      message?: string
      showProgress?: boolean
    }
  ): Promise<T> => {
    try {
      showLoading(options?.variant, options?.message, options?.showProgress)
      const result = await apiCall()
      return result
    } finally {
      hideLoading()
    }
  }

  return { withLoading }
}