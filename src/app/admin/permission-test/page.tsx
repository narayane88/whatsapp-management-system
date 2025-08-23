'use client'

import {
  Box,
  Title,
  Text,
  Stack,
  Group,
  Card,
  Badge,
  Button,
  Grid,
  Table,
  Paper,
  Alert,
  Code,
  Divider,
  ActionIcon,
  Tooltip,
  SimpleGrid,
  Progress,
  TextInput
} from '@mantine/core'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions'
import AdminLayout from '@/components/layout/AdminLayout'
import { 
  FiUser, 
  FiShield, 
  FiCheck, 
  FiX, 
  FiRefreshCw, 
  FiInfo,
  FiEye,
  FiSettings,
  FiDatabase,
  FiClock,
  FiZap,
  FiSearch,
  FiPlus
} from 'react-icons/fi'

// Dynamic permissions are now loaded from database - no hardcoded permissions needed

interface UserDetails {
  id: number
  name: string
  email: string
  role: string
  level?: number
  dealer_code?: string
  isActive: boolean
  created_at: string
}

export default function PermissionTestPage() {
  const { data: session } = useSession()
  const { 
    hasPermission, 
    hasAllPermissions, 
    hasAnyPermission,
    isLoading, 
    userPermissions,
    allPermissions,
    permissionsByCategory,
    isOwner,
    isAdmin,
    isSubDealer,
    isEmployee,
    isCustomer,
    error,
    refresh
  } = useDynamicPermissions()

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [customPermission, setCustomPermission] = useState('')
  const [customTestResults, setCustomTestResults] = useState<Array<{permission: string, result: boolean, timestamp: string}>>([])

  // Load user details
  useEffect(() => {
    const loadUserDetails = async () => {
      setLoadingDetails(true)
      try {
        const response = await fetch('/api/users/current-debug')
        if (response.ok) {
          const data = await response.json()
          setUserDetails(data.user)
        }
      } catch (error) {
        console.error('Failed to load user details:', error)
      } finally {
        setLoadingDetails(false)
      }
    }

    loadUserDetails()
  }, [refreshCount])

  // Test all permissions - now using dynamic permissions from database
  useEffect(() => {
    if (!isLoading && allPermissions.length > 0) {
      const results: Record<string, boolean> = {}
      allPermissions.forEach(permission => {
        results[permission.name] = hasPermission(permission.name)
      })
      setTestResults(results)
    }
  }, [hasPermission, isLoading, allPermissions])

  const handleRefresh = async () => {
    setRefreshCount(prev => prev + 1)
    // Refresh dynamic permissions
    await refresh()
  }

  const handleCustomPermissionTest = () => {
    if (!customPermission.trim()) return
    
    const result = hasPermission(customPermission.trim())
    const newTest = {
      permission: customPermission.trim(),
      result,
      timestamp: new Date().toLocaleTimeString()
    }
    
    setCustomTestResults(prev => [newTest, ...prev.slice(0, 9)]) // Keep last 10 tests
    setCustomPermission('')
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleCustomPermissionTest()
    }
  }

  const getRoleColor = (role: string) => {
    const normalizedRole = role?.toUpperCase().replace(/\s+/g, '')
    switch (normalizedRole) {
      case 'OWNER': return 'red'
      case 'ADMIN': return 'violet' 
      case 'SUBDEALER':
      case 'SHREEDELALER': return 'orange'
      case 'EMPLOYEE': return 'blue'
      case 'CUSTOMER': return 'green'
      default: return 'gray'
    }
  }

  const calculatePermissionStats = () => {
    const total = Object.keys(testResults).length
    const granted = Object.values(testResults).filter(Boolean).length
    return { total, granted, percentage: total > 0 ? (granted / total) * 100 : 0 }
  }

  const stats = calculatePermissionStats()

  if (loadingDetails || isLoading) {
    return (
      <AdminLayout>
        <Box p="md">
          <Text>Loading permission test page...</Text>
        </Box>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Box p="md">
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between">
            <div>
              <Title order={2}>🧪 Permission Test Laboratory</Title>
              <Text c="dimmed">
                Comprehensive permission testing and user detail inspection
              </Text>
            </div>
            <Group>
              <Button
                leftSection={<FiRefreshCw size={16} />}
                variant="outline"
                onClick={handleRefresh}
              >
                Refresh & Clear Cache
              </Button>
            </Group>
          </Group>

          {/* Permission System Status */}
          {error && (
            <Alert color="red" title="Permission System Error" icon={<FiX size={16} />}>
              {error}
            </Alert>
          )}

          {/* User Information Card */}
          <Card withBorder shadow="sm">
            <Card.Section withBorder inheritPadding py="xs">
              <Group justify="space-between">
                <Group gap="sm">
                  <FiUser size={20} />
                  <Text fw={600}>User Information</Text>
                </Group>
                <Badge color={getRoleColor(userDetails?.role || 'Unknown')} variant="filled">
                  {userDetails?.role || 'Unknown'}
                </Badge>
              </Group>
            </Card.Section>

            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md" mt="md">
              <Stack gap="xs">
                <Text size="xs" c="dimmed" fw={500}>Basic Details</Text>
                <Group gap="xs">
                  <Text size="xs" fw={500}>Name:</Text>
                  <Text size="xs">{userDetails?.name || 'N/A'}</Text>
                </Group>
                <Group gap="xs">
                  <Text size="xs" fw={500}>Email:</Text>
                  <Code>{userDetails?.email || session?.user?.email}</Code>
                </Group>
                <Group gap="xs">
                  <Text size="xs" fw={500}>ID:</Text>
                  <Text size="xs">{userDetails?.id}</Text>
                </Group>
              </Stack>

              <Stack gap="xs">
                <Text size="xs" c="dimmed" fw={500}>Role & Level</Text>
                <Group gap="xs">
                  <Text size="xs" fw={500}>Database Role:</Text>
                  <Badge color={getRoleColor(userDetails?.role)} size="xs">
                    {userDetails?.role}
                  </Badge>
                </Group>
                <Group gap="xs">
                  <Text size="xs" fw={500}>Session Role:</Text>
                  <Badge color={getRoleColor(session?.user?.role)} size="xs">
                    {session?.user?.role}
                  </Badge>
                </Group>
                <Group gap="xs">
                  <Text size="xs" fw={500}>Level:</Text>
                  <Badge color="blue" variant="outline" size="xs">
                    Level {userDetails?.level || 'Unknown'}
                  </Badge>
                </Group>
              </Stack>

              <Stack gap="xs">
                <Text size="xs" c="dimmed" fw={500}>Status & Code</Text>
                <Group gap="xs">
                  <Text size="xs" fw={500}>Status:</Text>
                  <Badge color={userDetails?.isActive ? 'green' : 'red'} size="xs">
                    {userDetails?.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Group>
                <Group gap="xs">
                  <Text size="xs" fw={500}>Dealer Code:</Text>
                  <Code>{userDetails?.dealer_code || 'N/A'}</Code>
                </Group>
                <Group gap="xs">
                  <Text size="xs" fw={500}>Created:</Text>
                  <Text size="xs" c="dimmed">
                    {userDetails?.created_at ? new Date(userDetails.created_at).toLocaleDateString() : 'N/A'}
                  </Text>
                </Group>
              </Stack>
            </SimpleGrid>
          </Card>

          {/* Role Analysis Card */}
          <Card withBorder shadow="sm">
            <Card.Section withBorder inheritPadding py="xs">
              <Group gap="sm">
                <FiShield size={20} />
                <Text fw={600}>Role Analysis</Text>
              </Group>
            </Card.Section>

            <SimpleGrid cols={{ base: 1, md: 5 }} spacing="md" mt="md">
              {[
                { label: 'Owner', value: isOwner, color: 'red' },
                { label: 'Admin', value: isAdmin, color: 'violet' },
                { label: 'SubDealer', value: isSubDealer, color: 'orange' },
                { label: 'Employee', value: isEmployee, color: 'blue' },
                { label: 'Customer', value: isCustomer, color: 'green' }
              ].map((role) => (
                <Paper key={role.label} withBorder p="sm" ta="center">
                  <Stack gap="xs" align="center">
                    {role.value ? (
                      <FiCheck size={20} color="var(--mantine-color-green-6)" />
                    ) : (
                      <FiX size={16} color="var(--mantine-color-gray-5)" />
                    )}
                    <Text size="xs" fw={500} c={role.value ? role.color : 'dimmed'}>
                      {role.label}
                    </Text>
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </Card>

          {/* Permission Summary */}
          <Card withBorder shadow="sm">
            <Card.Section withBorder inheritPadding py="xs">
              <Group justify="space-between">
                <Group gap="sm">
                  <FiZap size={20} />
                  <Text fw={600}>Permission Summary</Text>
                </Group>
                <Badge color="blue" variant="light">
                  {stats.granted}/{stats.total} permissions ({allPermissions.length} total in DB)
                </Badge>
              </Group>
            </Card.Section>

            <Stack gap="md" mt="md">
              <Group>
                <Text size="xs" fw={500}>Coverage:</Text>
                <Progress value={stats.percentage} size="xs" style={{ flex: 1 }} />
                <Text size="xs" c="dimmed">{stats.percentage.toFixed(1)}%</Text>
              </Group>
              
              <Group>
                <Text size="xs" fw={500}>Total Permissions:</Text>
                <Code>{userPermissions.length}</Code>
              </Group>
            </Stack>
          </Card>

          {/* Custom Permission Testing */}
          <Card withBorder shadow="sm">
            <Card.Section withBorder inheritPadding py="xs">
              <Group gap="sm">
                <FiSearch size={20} />
                <Text fw={600}>Custom Permission Testing</Text>
              </Group>
            </Card.Section>

            <Stack gap="md" mt="md">
              <Group>
                <TextInput
                  placeholder="Enter permission name (e.g., customers.create.button)"
                  value={customPermission}
                  onChange={(event) => setCustomPermission(event.currentTarget.value)}
                  onKeyPress={handleKeyPress}
                  style={{ flex: 1 }}
                  leftSection={<FiSearch size={16} />}
                />
                <Button
                  leftSection={<FiPlus size={16} />}
                  onClick={handleCustomPermissionTest}
                  disabled={!customPermission.trim()}
                >
                  Test Permission
                </Button>
              </Group>

              {customTestResults.length > 0 && (
                <div>
                  <Text size="xs" fw={500} mb="xs">Recent Tests:</Text>
                  <Stack gap="xs">
                    {customTestResults.map((test, index) => (
                      <Paper key={index} withBorder p="xs">
                        <Group justify="space-between">
                          <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                            {test.result ? (
                              <FiCheck size={14} color="var(--mantine-color-green-6)" />
                            ) : (
                              <FiX size={14} color="var(--mantine-color-red-6)" />
                            )}
                            <Code 
                              style={{ 
                                flex: 1, 
                                minWidth: 0, 
                                wordBreak: 'break-all',
                                backgroundColor: test.result ? 'var(--mantine-color-green-0)' : 'var(--mantine-color-red-0)'
                              }}
                              c={test.result ? 'green' : 'red'}
                            >
                              {test.permission}
                            </Code>
                          </Group>
                          <Badge 
                            color={test.result ? 'green' : 'red'} 
                            variant="light" 
                            size="xs"
                          >
                            {test.result ? 'GRANTED' : 'DENIED'}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {test.timestamp}
                          </Text>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </div>
              )}
            </Stack>
          </Card>

          {/* Dynamic Permission Test Results - All Database Permissions by Category */}
          {Object.entries(permissionsByCategory).map(([category, permissions]) => (
            <Card key={category} withBorder shadow="sm">
              <Card.Section withBorder inheritPadding py="xs">
                <Group justify="space-between">
                  <Text fw={600}>{category} ({permissions.length} permissions)</Text>
                  <Badge 
                    color={permissions.some(p => testResults[p.name]) ? 'green' : 'gray'} 
                    variant="light"
                  >
                    {permissions.filter(p => testResults[p.name]).length}/{permissions.length}
                  </Badge>
                </Group>
              </Card.Section>

              <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xs" mt="md">
                {permissions.map((permission) => {
                  const hasAccess = testResults[permission.name]
                  return (
                    <Paper key={permission.name} withBorder p="xs">
                      <Group gap="xs" justify="space-between">
                        <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                          {hasAccess ? (
                            <FiCheck size={14} color="var(--mantine-color-green-6)" />
                          ) : (
                            <FiX size={14} color="var(--mantine-color-red-6)" />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text 
                              size="xs" 
                              style={{ 
                                wordBreak: 'break-all',
                                fontFamily: 'var(--mantine-font-family-monospace)',
                                lineHeight: 1.3
                              }}
                              c={hasAccess ? 'green' : 'red'}
                            >
                              {permission.name}
                            </Text>
                            {permission.description && (
                              <Text size="10px" c="dimmed" mt="2px" style={{ lineHeight: 1.2 }}>
                                {permission.description}
                              </Text>
                            )}
                          </div>
                        </Group>
                      </Group>
                    </Paper>
                  )
                })}
              </SimpleGrid>
            </Card>
          ))}

          {/* Debug Information */}
          <Card withBorder shadow="sm">
            <Card.Section withBorder inheritPadding py="xs">
              <Group gap="sm">
                <FiDatabase size={20} />
                <Text fw={600}>Debug Information</Text>
              </Group>
            </Card.Section>

            <Stack gap="md" mt="md">
              <Group>
                <Text size="xs" fw={500}>Session Status:</Text>
                <Badge color={session ? 'green' : 'red'} size="xs">
                  {session ? 'Active' : 'None'}
                </Badge>
              </Group>
              
              <Group>
                <Text size="xs" fw={500}>Dynamic Permissions:</Text>
                <Badge color="blue" size="xs">
                  {allPermissions.length > 0 ? `${allPermissions.length} loaded` : 'Not Loaded'}
                </Badge>
              </Group>
              
              <div>
                <Text size="xs" fw={500} mb="xs">Raw Permissions:</Text>
                <Code block>
                  {JSON.stringify(userPermissions, null, 2)}
                </Code>
              </div>
            </Stack>
          </Card>
        </Stack>
      </Box>
    </AdminLayout>
  )
}