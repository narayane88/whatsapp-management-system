'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'

interface ImpersonatedUser {
  id: number
  email: string
  name: string
}

interface AdminUser {
  id: number
  email: string
  name: string
}

interface ImpersonationData {
  targetUser: ImpersonatedUser
  adminUser: AdminUser
  startedAt: string
}

interface ImpersonationContextType {
  isImpersonating: boolean
  impersonationData: ImpersonationData | null
  startImpersonation: (customerId: number) => Promise<boolean>
  endImpersonation: () => Promise<boolean>
  loading: boolean
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined)

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonationData, setImpersonationData] = useState<ImpersonationData | null>(null)
  const [loading, setLoading] = useState(false)

  // Load impersonation state from localStorage on mount
  useEffect(() => {
    const storedImpersonation = localStorage.getItem('impersonation_data')
    if (storedImpersonation) {
      try {
        const data = JSON.parse(storedImpersonation)
        setImpersonationData(data)
        setIsImpersonating(true)
        // Ensure cookie is set
        document.cookie = 'impersonation_active=true; path=/; max-age=86400'
      } catch (error) {
        console.error('Failed to parse stored impersonation data:', error)
        localStorage.removeItem('impersonation_data')
        // Remove any stale cookie
        document.cookie = 'impersonation_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
    }
  }, [])

  const startImpersonation = async (customerId: number): Promise<boolean> => {
    if (!session?.user?.email) {
      notifications.show({
        title: 'Error',
        message: 'You must be logged in to impersonate users',
        color: 'red'
      })
      return false
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customerId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start impersonation')
      }

      const data = await response.json()
      
      // Store impersonation data
      setImpersonationData(data.impersonation)
      setIsImpersonating(true)
      localStorage.setItem('impersonation_data', JSON.stringify(data.impersonation))
      
      // Set cookie for middleware
      document.cookie = 'impersonation_active=true; path=/; max-age=86400'

      notifications.show({
        title: 'Impersonation Started',
        message: data.message,
        color: 'blue'
      })

      // Redirect to customer dashboard with impersonation flag
      setTimeout(() => {
        router.push('/customer?impersonating=true')
      }, 1000)

      return true
    } catch (error) {
      notifications.show({
        title: 'Impersonation Failed',
        message: error instanceof Error ? error.message : 'Failed to start impersonation',
        color: 'red'
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const endImpersonation = async (): Promise<boolean> => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to end impersonation')
      }

      // Clear impersonation state
      setImpersonationData(null)
      setIsImpersonating(false)
      localStorage.removeItem('impersonation_data')
      
      // Remove cookie
      document.cookie = 'impersonation_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

      notifications.show({
        title: 'Impersonation Ended',
        message: 'You are now back to your admin account',
        color: 'green'
      })

      // Redirect to admin dashboard
      setTimeout(() => {
        router.push('/admin')
      }, 1000)

      return true
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to end impersonation',
        color: 'red'
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        impersonationData,
        startImpersonation,
        endImpersonation,
        loading
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  )
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext)
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider')
  }
  return context
}