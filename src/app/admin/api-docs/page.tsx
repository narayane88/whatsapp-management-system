'use client'

// Force dynamic rendering to avoid build-time issues
export const dynamic = 'force-dynamic'

import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Badge,
  SimpleGrid,
  Button,
  Tabs,
  Alert,
  Code,
  Divider,
  ActionIcon,
  Tooltip,
  Box,
  Paper,
  Loader,
  Center,
  ThemeIcon
} from '@mantine/core'
import {
  FiBook,
  FiCode,
  FiGlobe,
  FiLock,
  FiUnlock,
  FiRefreshCw,
  FiExternalLink,
  FiShield,
  FiDatabase,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernAlert,
  ModernContainer
} from '@/components/ui/modern-components'
import {
  ResponsiveGrid,
  ResponsiveCardGrid,
  ResponsiveStack
} from '@/components/ui/responsive-layout'

interface APIRoute {
  path: string
  methods: string[]
  description: string
  authentication: boolean
  permissions: string[]
  category: string
  parameters: string[]
  response: string
  examples?: string
}

export default function APIDocsPage() {
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState<APIRoute[]>([])
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null)

  useEffect(() => {
    fetchAPIRoutes()
  }, [])

  const fetchAPIRoutes = async () => {
    try {
      const response = await fetch('/api/admin/api-docs')
      const data = await response.json()
      setRoutes(data.routes || [])
    } catch (error) {
      console.error('Failed to fetch API routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'blue'
      case 'POST': return 'green'
      case 'PUT': return 'orange'
      case 'DELETE': return 'red'
      case 'PATCH': return 'violet'
      default: return 'gray'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'admin': return 'red'
      case 'auth': return 'green'
      case 'users': return 'blue'
      case 'customers': return 'violet'
      default: return 'gray'
    }
  }

  const groupedRoutes = routes.reduce((acc, route) => {
    if (!acc[route.category]) {
      acc[route.category] = []
    }
    acc[route.category].push(route)
    return acc
  }, {} as Record<string, APIRoute[]>)

  const toggleRouteExpansion = (path: string) => {
    setExpandedRoute(expandedRoute === path ? null : path)
  }

  // Calculate stats
  const totalRoutes = routes.length
  const protectedRoutes = routes.filter(r => r.authentication).length
  const publicRoutes = totalRoutes - protectedRoutes

  return (
    <PagePermissionGuard requiredPermissions={['api.docs.access']}>
      <AdminLayout>
        <ModernContainer fluid>
          <ResponsiveStack gap="xl">
            {/* Enhanced Header */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.03) 100%)',
                border: '2px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.08)',
                padding: '32px'
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Group gap="lg">
                  <ThemeIcon 
                    size="2xl" 
                    variant="gradient" 
                    gradient={{ from: 'blue.6', to: 'indigo.5', deg: 135 }}
                    style={{
                      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <FiBook size={28} />
                  </ThemeIcon>
                  <Box>
                    <Title 
                      order={2} 
                      mb={8}
                      c="blue.7"
                    >
                      API Documentation
                    </Title>
                    <Text c="dimmed" size="xs" fw={500} mb="lg">
                      Comprehensive REST API documentation for WhatsApp management system
                    </Text>
                    
                    {/* Quick Stats Bar */}
                    <Group gap="xl">
                      <Group gap="xs">
                        <FiGlobe size={10} color="var(--mantine-color-blue-6)" />
                        <Text size="xs" c="dimmed">Total Routes:</Text>
                        <Text size="xs" fw={700} c="blue.7">
                          {totalRoutes}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <FiLock size={10} color="var(--mantine-color-red-6)" />
                        <Text size="xs" c="dimmed">Protected:</Text>
                        <Text size="xs" fw={700} c="red.7">
                          {protectedRoutes}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <FiUnlock size={10} color="var(--mantine-color-green-6)" />
                        <Text size="xs" c="dimmed">Public:</Text>
                        <Text size="xs" fw={700} c="green.7">
                          {publicRoutes}
                        </Text>
                      </Group>
                    </Group>
                  </Box>
                </Group>
                
                <Group gap="sm">
                  <Tooltip label="Refresh API docs">
                    <ActionIcon 
                      size="lg" 
                      variant="light" 
                      color="blue"
                      onClick={fetchAPIRoutes}
                      loading={loading}
                    >
                      <FiRefreshCw size={10} />
                    </ActionIcon>
                  </Tooltip>
                  
                  <ModernBadge variant="success">
                    <Group gap={4}>
                      <FiShield size={10} />
                      API Active
                    </Group>
                  </ModernBadge>
                </Group>
              </Group>
            </ModernCard>

            {/* API Documentation Content */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                border: '2px solid rgba(59, 130, 246, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.06)',
                overflow: 'hidden'
              }}
            >
              {loading ? (
                <Center>
                  <Stack align="center" gap="lg" p="xl">
                    <Loader variant="dots" size="lg" color="blue" />
                    <Text size="xs" c="dimmed">Loading API documentation...</Text>
                  </Stack>
                </Center>
              ) : (
                <Tabs defaultValue="overview" variant="outline">
                  <Tabs.List 
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
                      borderBottom: '2px solid rgba(59, 130, 246, 0.15)'
                    }} 
                    p="md"
                  >
                    <Tabs.Tab value="overview">
                      <Group gap="xs">
                        <FiBook size={10} />
                        <Text size="xs">Overview</Text>
                      </Group>
                    </Tabs.Tab>
                    {Object.keys(groupedRoutes).map(category => (
                      <Tabs.Tab key={category} value={category}>
                        <Group gap="xs">
                          <FiCode size={10} />
                          <Text size="xs">{category}</Text>
                          <ModernBadge size="xs" color={getCategoryColor(category)}>
                            {groupedRoutes[category].length}
                          </ModernBadge>
                        </Group>
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>

                  <Tabs.Panel value="overview" p="md">
                    <Stack gap="md">
                      <Text size="xs" c="dimmed">
                        This API documentation provides comprehensive information about all available endpoints in the WhatsApp management system.
                      </Text>
                      
                      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                        {Object.entries(groupedRoutes).map(([category, categoryRoutes]) => (
                          <Card key={category} p="md" withBorder>
                            <Stack gap="xs">
                              <Group gap="xs">
                                <ModernBadge size="xs" color={getCategoryColor(category)}>
                                  {category}
                                </ModernBadge>
                                <Text size="xs" fw={600}>{categoryRoutes.length} routes</Text>
                              </Group>
                              <Text size="xs" c="dimmed">
                                {category} related API endpoints
                              </Text>
                            </Stack>
                          </Card>
                        ))}
                      </SimpleGrid>
                    </Stack>
                  </Tabs.Panel>

                  {Object.entries(groupedRoutes).map(([category, routes]) => (
                    <Tabs.Panel key={category} value={category} p="md">
                      <Stack gap="md">
                        {routes.map((route) => (
                          <Card 
                            key={route.path} 
                            shadow="sm" 
                            padding="md" 
                            radius="md" 
                            withBorder
                          >
                            <Group justify="space-between" align="flex-start">
                              <Stack gap="xs" style={{ flex: 1 }}>
                                <Group gap="xs">
                                  {route.methods.map(method => (
                                    <ModernBadge key={method} size="xs" color={getMethodColor(method)}>
                                      {method}
                                    </ModernBadge>
                                  ))}
                                  <Code fw={600}>{route.path}</Code>
                                  {route.authentication && (
                                    <ModernBadge size="xs" color="red" variant="light">
                                      Auth Required
                                    </ModernBadge>
                                  )}
                                </Group>
                                
                                <Text size="xs" c="dimmed">
                                  {route.description}
                                </Text>

                                {route.permissions.length > 0 && (
                                  <Group gap="xs">
                                    <Text size="xs" fw={500}>Permissions:</Text>
                                    {route.permissions.slice(0, 3).map(perm => (
                                      <ModernBadge key={perm} size="xs" color="orange" variant="outline">
                                        {perm}
                                      </ModernBadge>
                                    ))}
                                    {route.permissions.length > 3 && (
                                      <ModernBadge size="xs" color="gray">
                                        +{route.permissions.length - 3} more
                                      </ModernBadge>
                                    )}
                                  </Group>
                                )}
                              </Stack>
                              
                              <ActionIcon 
                                variant="light" 
                                size="lg"
                                onClick={() => toggleRouteExpansion(route.path)}
                              >
                                {expandedRoute === route.path ? 
                                  <FiChevronUp size={10} /> : 
                                  <FiChevronDown size={10} />
                                }
                              </ActionIcon>
                            </Group>

                            {expandedRoute === route.path && (
                              <Paper p="md" bg="gray.0" mt="md" radius="md">
                                <Text size="xs">
                                  Detailed API documentation would be displayed here...
                                </Text>
                              </Paper>
                            )}
                          </Card>
                        ))}
                      </Stack>
                    </Tabs.Panel>
                  ))}
                </Tabs>
              )}
            </ModernCard>
          </ResponsiveStack>
        </ModernContainer>
      </AdminLayout>
    </PagePermissionGuard>
  )
}