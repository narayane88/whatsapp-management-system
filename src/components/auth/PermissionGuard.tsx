'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Box, Loader, Text, Alert, Button, Stack } from '@mantine/core'
import { FiAlertTriangle, FiLock } from 'react-icons/fi'

interface PermissionGuardProps {
  children: ReactNode
  requiredPermission?: string
  requiredRole?: string
  fallbackUrl?: string
  showFallback?: boolean
}

export default function PermissionGuard({
  children,
  requiredPermission,
  requiredRole,
  fallbackUrl = '/auth/signin',
  showFallback = true
}: PermissionGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check permissions when session changes
  useEffect(() => {
    const checkPermissions = async () => {
      setIsLoading(true)
      
      // If no session, redirect to login
      if (status === 'unauthenticated') {
        router.push(fallbackUrl)
        return
      }

      // If still loading session, wait
      if (status === 'loading' || !session?.user?.email) {
        setIsLoading(true)
        return
      }

      // If no specific permission required, allow access
      if (!requiredPermission && !requiredRole) {
        setHasPermission(true)
        setIsLoading(false)
        return
      }

      try {
        // Check role-based access
        if (requiredRole && session.user.role !== requiredRole) {
          // Allow OWNER to access everything
          if (session.user.role !== 'OWNER') {
            setHasPermission(false)
            setIsLoading(false)
            return
          }
        }

        // Check permission-based access
        if (requiredPermission) {
          const response = await fetch('/api/auth/check-permission', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permission: requiredPermission })
          })

          if (response.ok) {
            const data = await response.json()
            setHasPermission(data.hasPermission)
          } else {
            setHasPermission(false)
          }
        } else {
          setHasPermission(true)
        }
      } catch (error) {

        setHasPermission(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPermissions()
  }, [session, status, requiredPermission, requiredRole, router, fallbackUrl])

  // Show loading state
  if (status === 'loading' || isLoading) {
    return (
      <Box ta="center" p="xl" style={{ minHeight: '200px' }}>
        <Loader size="lg" />
        <Text mt="md" c="dimmed">Checking permissions...</Text>
      </Box>
    )
  }

  // Show access denied if no permission
  if (hasPermission === false) {
    if (!showFallback) {
      return null
    }

    return (
      <Box ta="center" p="xl">
        <Stack align="center" gap="md">
          <Box component={FiLock} size={48} c="red.5" />
          
          <Alert 
            icon={<Box component={FiAlertTriangle} />} 
            title="Access Denied" 
            color="red"
            style={{ maxWidth: '400px' }}
          >
            <Stack gap="sm">
              <Text size="sm">
                You don't have permission to access this resource.
              </Text>
              
              {requiredPermission && (
                <Text size="xs" c="dimmed">
                  Required permission: <strong>{requiredPermission}</strong>
                </Text>
              )}
              
              {requiredRole && (
                <Text size="xs" c="dimmed">
                  Required role: <strong>{requiredRole}</strong>
                </Text>
              )}
              
              <Text size="xs" c="dimmed">
                Current role: <strong>{session?.user?.role || 'Unknown'}</strong>
              </Text>
            </Stack>
          </Alert>

          <Button 
            variant="outline" 
            onClick={() => {
              // Redirect based on user role
              const userRole = session?.user?.role
              if (userRole === 'CUSTOMER') {
                router.push('/customer')
              } else {
                router.push('/admin')
              }
            }}
          >
            Go to {session?.user?.role === 'CUSTOMER' ? 'Customer Panel' : 'Admin Dashboard'}
          </Button>
        </Stack>
      </Box>
    )
  }

  // Render children if permission granted
  return <>{children}</>
}