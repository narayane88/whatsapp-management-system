'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDynamicPermissions } from './useDynamicPermissions'

interface DashboardStats {
  label: string
  value: string
  change: number
  icon: string
  color: string
  description: string
  progress: number
}

interface RecentTransaction {
  id: string
  user: string
  amount: string
  type: string
  status: string
  time: string
  method: string
  description: string
}

interface ServerStatus {
  name: string
  status: string
  uptime: string
  users: number
  messages: number
  location: string
  load: number
  memory: number
  lastChecked: string
}

interface RecentActivity {
  title: string
  description: string
  time: string
  type: string
  color: string
}

interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  storageUsage: number
  networkIO: number
  serverHealth: number
}

interface DashboardPermissions {
  canViewUsers: boolean
  canViewTransactions: boolean
  canViewServers: boolean
  canViewSystemMetrics: boolean
  accessLevel: number
  accessType: string
}

interface DashboardData {
  stats: DashboardStats[]
  recentTransactions: RecentTransaction[]
  serverStatus: ServerStatus[]
  recentActivities: RecentActivity[]
  systemMetrics: SystemMetrics
  permissions: DashboardPermissions
}

interface UseDashboardDataReturn {
  data: DashboardData | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { hasPermission, isLoading: permissionsLoading } = useDynamicPermissions()

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if user has dashboard access permission
      if (!permissionsLoading && !hasPermission('dashboard.admin.access')) {
        setError('Insufficient permissions to view dashboard')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Always fetch fresh data
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required')
        } else if (response.status === 403) {
          throw new Error('Insufficient permissions to view dashboard')
        } else {
          let errorMessage = `HTTP error! status: ${response.status}`
          try {
            const errorData = await response.json()
            if (errorData && typeof errorData.error === 'string') {
              errorMessage = errorData.error
            } else if (errorData && typeof errorData.message === 'string') {
              errorMessage = errorData.message
            }
          } catch (parseError) {
            // If JSON parsing fails, use the default error message
            console.warn('Failed to parse error response as JSON:', parseError)
          }
          throw new Error(errorMessage)
        }
      }

      const dashboardData = await response.json()
      setData(dashboardData)
      setError(null)
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [hasPermission, permissionsLoading])

  // Fetch data on mount and when permissions are loaded
  useEffect(() => {
    if (!permissionsLoading) {
      fetchDashboardData()
    }
  }, [fetchDashboardData, permissionsLoading])

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!data || error) return

    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [data, error, fetchDashboardData])

  return {
    data,
    isLoading: isLoading || permissionsLoading,
    error,
    refresh: fetchDashboardData
  }
}