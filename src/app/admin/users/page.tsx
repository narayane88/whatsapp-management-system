'use client'

import { Container, Loader, Center, Stack, Text, Title, Group, ThemeIcon, Skeleton, Box, Button, Badge, Paper, Card } from '@mantine/core'
import { Suspense, lazy } from 'react'
import { IconUserPlus, IconUsers } from '@tabler/icons-react'
import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'

// Lazy load the heavy UserManagementSystem component
const UserManagementSystem = lazy(() => import('@/components/admin/UserManagementSystem'))

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
  // Statistics and data are now handled within UserManagementSystem component

  return (
    <PagePermissionGuard requiredPermissions={['users.page.access']}>
      <AdminLayout>
        <AdminPageWrapper
          title="User Management System"
          subtitle="Comprehensive user administration with role-based access control and permission management"
          breadcrumbs={[
            { title: 'Users', href: '/admin/users' }
          ]}
          enableNotifications={true}
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
          {/* Main User Management System - includes all stats and functionality */}
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