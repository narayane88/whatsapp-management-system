'use client'

import {
  Stack,
  Alert,
  Button,
  Text,
  Center,
  Loader,
  Paper,
  Title
} from '@mantine/core'
import { FiLock, FiArrowLeft, FiHome } from 'react-icons/fi'
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import Link from 'next/link'

interface PagePermissionGuardProps {
  children: React.ReactNode
  requiredPermissions: string | string[]
  fallbackPath?: string
  showFallback?: boolean
  customMessage?: string
  pageName?: string
}

export default function PagePermissionGuard({
  children,
  requiredPermissions,
  fallbackPath = '/admin',
  showFallback = true,
  customMessage,
  pageName
}: PagePermissionGuardProps) {
  const { hasPermission, userPermissions, isLoading } = useDynamicPermissions()
  const router = useRouter()
  
  // Memoize required permissions array to prevent re-renders
  const requiredPermsArray = useMemo(() => 
    Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
  , [requiredPermissions])

  // Calculate access directly with useMemo - no useEffect needed
  const { hasAccess, grantedPermissions } = useMemo(() => {
    if (isLoading) {
      return { hasAccess: false, grantedPermissions: [] }
    }

    // Check if user has all required permissions
    const accessGranted = requiredPermsArray.every(permission => hasPermission(permission))

    // Calculate granted permissions for display
    const granted = requiredPermsArray.filter(permission => hasPermission(permission))

    return { hasAccess: accessGranted, grantedPermissions: granted }
  }, [hasPermission, requiredPermsArray, isLoading])

  // Show loading state
  if (isLoading) {
    return (
      <Center style={{ minHeight: 400 }}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Checking permissions...</Text>
        </Stack>
      </Center>
    )
  }

  // Show access denied if user doesn't have permission
  if (!hasAccess) {
    if (!showFallback) {
      return null
    }

    return (
      <Center style={{ minHeight: 400 }}>
        <Paper withBorder shadow="md" p="xl" radius="md" style={{ maxWidth: 500, width: '100%' }}>
          <Stack align="center" gap="lg">
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'var(--mantine-color-red-1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FiLock size={32} color="var(--mantine-color-red-6)" />
            </div>

            <Stack align="center" gap="sm">
              <Title order={3} c="red">Access Denied</Title>
              <Text ta="center" c="dimmed">
                {customMessage || `You don't have permission to access ${pageName || 'this page'}.`}
              </Text>
              
              <Text size="sm" c="dimmed" ta="center">
                You don't have sufficient permissions to access this page.
              </Text>
            </Stack>

            <Alert color="orange" title="Required Permissions" style={{ width: '100%' }}>
              <Text size="sm">
                This page requires the following permissions:
              </Text>
              <Stack gap="xs" mt="sm">
                {requiredPermsArray.map((permission) => (
                  <Text key={permission} size="sm" ff="monospace" c="dimmed">
                    • {permission}
                  </Text>
                ))}
              </Stack>
              
              {grantedPermissions.length > 0 && (
                <>
                  <Text size="sm" mt="md" c="green">
                    You have access to:
                  </Text>
                  <Stack gap="xs" mt="xs">
                    {grantedPermissions.map((permission) => (
                      <Text key={permission} size="sm" ff="monospace" c="green">
                        ✓ {permission}
                      </Text>
                    ))}
                  </Stack>
                </>
              )}
            </Alert>

            <Stack gap="sm" style={{ width: '100%' }}>
              <Button
                component={Link}
                href={fallbackPath}
                leftSection={<FiArrowLeft size={16} />}
                variant="outline"
                fullWidth
              >
                Go Back
              </Button>
              
              <Button
                component={Link}
                href="/admin"
                leftSection={<FiHome size={16} />}
                fullWidth
              >
                Go to Dashboard
              </Button>
            </Stack>

            <Text size="xs" c="dimmed" ta="center" mt="md">
              If you believe you should have access to this page, please contact your administrator.
            </Text>
          </Stack>
        </Paper>
      </Center>
    )
  }

  // Render children if user has access
  return <>{children}</>
}