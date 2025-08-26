'use client'

import { Container, Loader, Center, Stack, Text, Title, Group, ThemeIcon, Skeleton, Box, Button, Badge, Paper, Card } from '@mantine/core'
import { Suspense, lazy, useState, useEffect } from 'react'
import { IconUsers, IconUserCheck, IconSettings, IconPlus, IconRefresh, IconShield, IconUserPlus, IconUserMinus, IconClock } from '@tabler/icons-react'
import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { notifications } from '@mantine/notifications'

// Lazy load the heavy UserManagementSystem component
const UserManagementSystem = lazy(() => import('@/components/admin/UserManagementSystem'))

// User statistics interface
interface UserStats {
  total: number
  active: number
  pending: number
  blocked: number
}

function LoadingFallback() {
  return (
    <Stack gap="xl">
      {/* Enhanced Header Skeleton */}
      <Card
        withBorder
        p="xl"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(167, 139, 250, 0.03) 100%)',
          border: '2px solid rgba(139, 92, 246, 0.15)',
          borderRadius: '20px'
        }}
      >
        <Group gap="lg" mb="lg">
          <Skeleton height={56} width={56} radius="xl" />
          <Box>
            <Skeleton height={32} width={280} mb={8} />
            <Skeleton height={20} width={400} mb={12} />
            <Group gap="lg">
              <Skeleton height={16} width={100} />
              <Skeleton height={16} width={120} />
              <Skeleton height={16} width={110} />
            </Group>
          </Box>
        </Group>
      </Card>
      
      {/* Enhanced Stats Grid Skeleton */}
      <Group grow>
        {[1, 2, 3, 4].map((i) => (
          <Card 
            key={i}
            withBorder
            p="lg"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
              border: '2px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '16px'
            }}
          >
            <Group justify="space-between" mb="lg">
              <Group gap="sm">
                <Skeleton height={40} width={40} radius="xl" />
                <Box>
                  <Skeleton height={16} width={100} mb={4} />
                  <Skeleton height={12} width={80} />
                </Box>
              </Group>
            </Group>
            <Skeleton height={48} width={120} mb="sm" />
            <Group gap="sm">
              <Skeleton height={24} width={24} radius="md" />
              <Skeleton height={16} width={80} />
            </Group>
          </Card>
        ))}
      </Group>
      
      {/* Enhanced Main Content Skeleton */}
      <Card
        withBorder
        p="xl"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          border: '1px solid rgba(226, 232, 240, 0.6)',
          borderRadius: '20px'
        }}
      >
        <Box
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(167, 139, 250, 0.06) 100%)',
            padding: '20px 24px',
            margin: '-28px -28px 24px -28px',
            borderRadius: '20px 20px 0 0'
          }}
        >
          <Group justify="space-between">
            <Group gap="sm">
              <Skeleton height={32} width={32} radius="md" />
              <Skeleton height={24} width={180} />
            </Group>
            <Group gap="sm">
              <Skeleton height={36} width={100} radius="md" />
              <Skeleton height={36} width={80} radius="md" />
            </Group>
          </Group>
        </Box>
        
        {/* Enhanced Table Skeleton */}
        <Stack gap="md">
          {[1, 2, 3, 4, 5].map((i) => (
            <Box 
              key={i}
              style={{
                padding: '16px',
                background: i % 2 === 0 ? 'rgba(248, 250, 252, 0.3)' : 'white',
                borderRadius: '12px',
                border: '1px solid rgba(226, 232, 240, 0.4)'
              }}
            >
              <Group justify="space-between">
                <Group gap="md">
                  <Skeleton height={40} width={40} radius="xl" />
                  <Box>
                    <Skeleton height={16} width={140} mb={4} />
                    <Skeleton height={12} width={100} />
                  </Box>
                </Group>
                <Group gap="sm">
                  <Skeleton height={24} width={80} radius="md" />
                  <Skeleton height={24} width={60} radius="md" />
                  <Skeleton height={32} width={32} radius="md" />
                  <Skeleton height={32} width={32} radius="md" />
                </Group>
              </Group>
            </Box>
          ))}
        </Stack>
      </Card>
      
      {/* Enhanced Loading Indicator */}
      <Center>
        <Card
          withBorder
          p="xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(167, 139, 250, 0.03) 100%)',
            border: '2px solid rgba(139, 92, 246, 0.15)',
            borderRadius: '16px',
            textAlign: 'center'
          }}
        >
          <Stack align="center" gap="lg">
            <ThemeIcon 
              size="4xl" 
              variant="gradient" 
              gradient={{ from: 'violet.5', to: 'purple.4', deg: 135 }}
              style={{
                animation: 'pulse 2s infinite'
              }}
            >
              <IconUsers size={48} />
            </ThemeIcon>
            <Box>
              <Text size="xs" fw={600} c="violet.7" mb={3}>
                Loading User Management System
              </Text>
              <Text size="xs" c="dimmed" fw={400}>
                Initializing secure user interface with role-based permissions
              </Text>
            </Box>
            <Loader size="xs" />
          </Stack>
        </Card>
      </Center>
    </Stack>
  )
}

export default function UsersPage() {
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    active: 0,
    pending: 0,
    blocked: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Simulate API call - replace with real endpoint
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data - replace with real API response
      setUserStats({
        total: 247,
        active: 189,
        pending: 32,
        blocked: 26
      })
    } catch (err) {
      setError('Failed to load user statistics')
      console.error('Error fetching user stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserStats()
  }, [])

  // Stats card data
  const statsCards = [
    {
      icon: IconUsers,
      label: 'Total Users',
      value: userStats.total,
      color: 'blue',
      description: 'All registered users'
    },
    {
      icon: IconUserCheck,
      label: 'Active Users',
      value: userStats.active,
      color: 'green',
      description: 'Currently active users'
    },
    {
      icon: IconClock,
      label: 'Pending Users',
      value: userStats.pending,
      color: 'yellow',
      description: 'Awaiting verification'
    },
    {
      icon: IconUserMinus,
      label: 'Blocked Users',
      value: userStats.blocked,
      color: 'red',
      description: 'Suspended accounts'
    }
  ]

  return (
    <PagePermissionGuard requiredPermissions={['users.page.access']}>
      <AdminLayout>
        <AdminPageWrapper
          title="User Management System"
          subtitle="Comprehensive user administration with role-based access control and permission management"
          breadcrumbs={[
            { title: 'Users', href: '/admin/users' }
          ]}
          loading={loading}
          error={error}
          onRefresh={fetchUserStats}
          enableNotifications={true}
          statusBadge={{
            label: `${userStats.active} Active`,
            color: 'green',
            variant: 'light'
          }}
          systemAlerts={[
            {
              type: 'info',
              title: 'System Status',
              message: 'User management system is operating normally',
              dismissible: true
            }
          ]}
          headerActions={
            <Button 
              leftSection={<IconUserPlus size={16} />}
              size="sm"
              variant="light"
            >
              Add User
            </Button>
          }
        >
          {/* User Statistics Cards */}
          <Group grow mb="xl">
            {statsCards.map((stat, index) => (
              <Card
                key={index}
                withBorder
                p="lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                  border: `2px solid var(--mantine-color-${stat.color}-2)`,
                  borderRadius: '16px',
                  transition: 'all 0.3s ease'
                }}
              >
                <Group justify="space-between" mb="lg">
                  <Group gap="sm">
                    <ThemeIcon 
                      size="lg" 
                      variant="light" 
                      color={stat.color}
                      style={{
                        borderRadius: '12px'
                      }}
                    >
                      <stat.icon size={20} />
                    </ThemeIcon>
                    <Box>
                      <Text size="sm" fw={600} c="dark.7">
                        {stat.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {stat.description}
                      </Text>
                    </Box>
                  </Group>
                </Group>
                
                <Text 
                  size="2rem" 
                  fw={700} 
                  c={`${stat.color}.6`}
                  mb="sm"
                >
                  {loading ? '-' : stat.value.toLocaleString()}
                </Text>
                
                <Group gap="sm">
                  <ThemeIcon 
                    size="xs" 
                    variant="light" 
                    color={stat.color}
                    style={{ borderRadius: '6px' }}
                  >
                    <IconRefresh size={10} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed">
                    Live data
                  </Text>
                </Group>
              </Card>
            ))}
          </Group>

          {/* Main User Management System */}
          <Card
            withBorder
            p="xl"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
              border: '1px solid rgba(226, 232, 240, 0.6)',
              borderRadius: '20px'
            }}
          >
            <Suspense fallback={<LoadingFallback />}>
              <UserManagementSystem />
            </Suspense>
          </Card>
        </AdminPageWrapper>
      </AdminLayout>
    </PagePermissionGuard>
  )
}