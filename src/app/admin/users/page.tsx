'use client'

import { Container, Loader, Center, Stack, Text, Title, Group, ThemeIcon, Skeleton, Box } from '@mantine/core'
import { Suspense, lazy } from 'react'
import { IconUsers, IconUserCheck, IconSettings } from '@tabler/icons-react'
import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import { ModernCard, ModernContainer, ModernLoader } from '@/components/ui/modern-components'
import { ResponsiveStack } from '@/components/ui/responsive-layout'

// Lazy load the heavy UserManagementSystem component
const UserManagementSystem = lazy(() => import('@/components/admin/UserManagementSystem'))

function LoadingFallback() {
  return (
    <ResponsiveStack gap="xl">
      {/* Enhanced Header Skeleton */}
      <ModernCard
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(167, 139, 250, 0.03) 100%)',
          border: '2px solid rgba(139, 92, 246, 0.15)',
          borderRadius: '20px',
          padding: '32px'
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
      </ModernCard>
      
      {/* Enhanced Stats Grid Skeleton */}
      <Group grow>
        {[1, 2, 3, 4].map((i) => (
          <ModernCard 
            key={i}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
              border: '2px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '16px',
              padding: '24px'
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
          </ModernCard>
        ))}
      </Group>
      
      {/* Enhanced Main Content Skeleton */}
      <ModernCard
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          border: '1px solid rgba(226, 232, 240, 0.6)',
          borderRadius: '20px',
          padding: '28px'
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
      </ModernCard>
      
      {/* Enhanced Loading Indicator */}
      <Center>
        <ModernCard
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(167, 139, 250, 0.03) 100%)',
            border: '2px solid rgba(139, 92, 246, 0.15)',
            borderRadius: '16px',
            padding: '32px',
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
            <ModernLoader variant="primary" size="xs" />
          </Stack>
        </ModernCard>
      </Center>
    </ResponsiveStack>
  )
}

export default function UsersPage() {
  return (
    <PagePermissionGuard requiredPermissions={['users.page.access']}>
      <AdminLayout>
        <ModernContainer fluid>
          {/* Enhanced Page Header */}
          <ModernCard 
            mb="xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(167, 139, 250, 0.03) 100%)',
              border: '2px solid rgba(139, 92, 246, 0.15)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.08)',
              padding: '32px'
            }}
          >
            <Group gap="lg">
              <ThemeIcon 
                size="2xl" 
                variant="gradient" 
                gradient={{ from: 'violet.6', to: 'purple.5', deg: 135 }}
                style={{
                  boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)'
                }}
              >
                <IconUsers size={28} />
              </ThemeIcon>
              <Box>
                <Title 
                  order={1} 
                  mb={8}
                  c="dark.8"
                  fw={600}
                >
                  User Management System
                </Title>
                <Text c="dimmed" size="md" fw={500}>
                  Comprehensive user administration with role-based access control and permission management
                </Text>
                
                {/* Quick Status Indicators */}
                <Group gap="xl" mt="md">
                  <Group gap="xs">
                    <IconUserCheck size={16} color="var(--mantine-color-green-6)" />
                    <Text size="xs" c="green.6" fw={600}>Active Users</Text>
                  </Group>
                  <Group gap="xs">
                    <IconSettings size={16} color="var(--mantine-color-violet-6)" />
                    <Text size="xs" c="violet.6" fw={600}>Role Management</Text>
                  </Group>
                  <Group gap="xs">
                    <ThemeIcon size="xs" variant="light" color="blue">
                      <IconUsers size={12} />
                    </ThemeIcon>
                    <Text size="xs" c="blue.6" fw={600}>Permission Control</Text>
                  </Group>
                </Group>
              </Box>
            </Group>
          </ModernCard>
          
          <Suspense fallback={<LoadingFallback />}>
            <UserManagementSystem />
          </Suspense>
        </ModernContainer>
      </AdminLayout>
    </PagePermissionGuard>
  )
}