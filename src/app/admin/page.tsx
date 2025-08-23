'use client'

import {
  Container,
  SimpleGrid,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Button,
  Flex,
  Card,
  Table,
  Progress,
  Paper,
  Box,
  rem,
  ActionIcon,
  Tooltip,
  Divider,
  ThemeIcon,
  RingProgress,
  Center,
  Skeleton,
  Alert,
  Timeline,
  Anchor
} from '@mantine/core'
import { 
  IconUsers, 
  IconMessageCircle, 
  IconServer, 
  IconTrendingUp, 
  IconTrendingDown,
  IconRefresh,
  IconEye,
  IconActivity,
  IconClock,
  IconAlertTriangle,
  IconCheck,
  IconCurrencyDollar,
  IconChartBar,
  IconSettings,
  IconBell,
  IconCalendar,
  IconDatabase,
  IconWorld
} from '@tabler/icons-react'
import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import { useCompanyProfile } from '@/hooks/useCompanyProfile'
import { useTheme } from '@/hooks/useTheme'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernProgress, 
  ModernAlert,
  ModernContainer
} from '@/components/ui/modern-components'
import {
  ResponsiveGrid,
  ResponsiveTwoColumn,
  ResponsiveCardGrid
} from '@/components/ui/responsive-layout'
import { useState, useEffect } from 'react'
import { useDashboardData } from '@/hooks/useDashboardData'

export default function AdminDashboard() {
  const { profile } = useCompanyProfile()
  const { currentTheme } = useTheme()
  const { data: dashboardData, isLoading, error, refresh } = useDashboardData()
  
  console.log('AdminDashboard: Component rendering', { 
    profile, 
    currentTheme, 
    isLoading, 
    hasData: !!dashboardData,
    error 
  })
  
  const refreshData = () => {
    refresh()
  }

  // Show error state if there's an error
  if (error) {
    return (
      <PagePermissionGuard requiredPermissions={['dashboard.admin.access']}>
        <AdminLayout>
          <ModernContainer fluid>
            <Stack gap="xl">
              <ModernAlert variant="danger" title="Dashboard Error">
                {error}
                <Group mt="md">
                  <ModernButton variant="secondary" onClick={refreshData}>
                    Try Again
                  </ModernButton>
                </Group>
              </ModernAlert>
            </Stack>
          </ModernContainer>
        </AdminLayout>
      </PagePermissionGuard>
    )
  }

  // Use real data if available, fallback to placeholder data
  const stats = dashboardData?.stats || [
    {
      label: 'Total Users',
      value: '2,543',
      change: 12.5,
      icon: IconUsers,
      color: 'brand',
      description: 'Active registered users',
      progress: 85
    },
    {
      label: 'Messages Today',
      value: '45,210',
      change: 8.2,
      icon: IconMessageCircle,
      color: 'blue',
      description: 'Messages sent today',
      progress: 73
    },
    {
      label: 'Active Servers',
      value: '8/12',
      change: -2.1,
      icon: IconServer,
      color: 'orange',
      description: 'Online WhatsApp servers',
      progress: 67
    },
    {
      label: 'Revenue (Month)',
      value: '₹12,847',
      change: 15.3,
      icon: IconCurrencyDollar,
      color: 'green',
      description: 'Monthly recurring revenue',
      progress: 92
    }
  ]

  const recentTransactions = dashboardData?.recentTransactions || [
    { 
      id: 'TXN001', 
      user: 'John Doe', 
      amount: '₹125.00', 
      type: 'Package Purchase', 
      status: 'Completed', 
      time: '2 min ago',
      method: 'Credit Card',
      description: 'Premium WhatsApp Package'
    },
    { 
      id: 'TXN002', 
      user: 'Jane Smith', 
      amount: '₹85.50', 
      type: 'Voucher Recharge', 
      status: 'Pending', 
      time: '5 min ago',
      method: 'Bank Transfer',
      description: 'Message Credits Topup'
    },
    { 
      id: 'TXN003', 
      user: 'Mike Johnson', 
      amount: '₹200.00', 
      type: 'Subscription', 
      status: 'Failed', 
      time: '12 min ago',
      method: 'PayPal',
      description: 'Annual Business Plan'
    },
    { 
      id: 'TXN004', 
      user: 'Sarah Wilson', 
      amount: '₹65.25', 
      type: 'Message Credits', 
      status: 'Processing', 
      time: '18 min ago',
      method: 'Credit Card',
      description: 'Bulk SMS Package'
    },
    { 
      id: 'TXN005', 
      user: 'David Brown', 
      amount: '₹150.00', 
      type: 'Package Purchase', 
      status: 'Cancelled', 
      time: '25 min ago',
      method: 'Crypto',
      description: 'Enterprise Package'
    },
    { 
      id: 'TXN006', 
      user: 'Lisa Chen', 
      amount: '₹75.00', 
      type: 'Refund', 
      status: 'Refunded', 
      time: '30 min ago',
      method: 'PayPal',
      description: 'Package Refund'
    },
  ]

  const serverStatus = dashboardData?.serverStatus || [
    { 
      name: 'WA-Server-01', 
      status: 'Online', 
      uptime: '99.9%', 
      users: 450, 
      messages: 12543,
      location: 'US-East',
      load: 45,
      memory: 68,
      lastChecked: '30s ago'
    },
    { 
      name: 'WA-Server-02', 
      status: 'Online', 
      uptime: '98.5%', 
      users: 325, 
      messages: 8921,
      location: 'US-West',
      load: 32,
      memory: 54,
      lastChecked: '45s ago'
    },
    { 
      name: 'WA-Server-03', 
      status: 'Maintenance', 
      uptime: '95.2%', 
      users: 0, 
      messages: 0,
      location: 'EU-Central',
      load: 0,
      memory: 12,
      lastChecked: '2m ago'
    },
    { 
      name: 'WA-Server-04', 
      status: 'Online', 
      uptime: '99.1%', 
      users: 678, 
      messages: 15420,
      location: 'Asia-Pacific',
      load: 78,
      memory: 82,
      lastChecked: '15s ago'
    },
  ]
  
  const recentActivities = dashboardData?.recentActivities || [
    {
      title: 'New user registration',
      description: 'john.doe@example.com registered for Premium plan',
      time: '2 minutes ago',
      type: 'user',
      color: 'blue'
    },
    {
      title: 'Server maintenance completed',
      description: 'WA-Server-03 is back online after scheduled maintenance',
      time: '15 minutes ago',
      type: 'server',
      color: 'green'
    },
    {
      title: 'High memory usage alert',
      description: 'WA-Server-04 memory usage reached 82%',
      time: '1 hour ago',
      type: 'alert',
      color: 'orange'
    },
    {
      title: 'Payment processed',
      description: 'Transaction TXN001 processed successfully',
      time: '2 hours ago',
      type: 'payment',
      color: 'green'
    }
  ]

  // Get permissions for conditional rendering
  const permissions = dashboardData?.permissions || {
    canViewUsers: false,
    canViewTransactions: false,
    canViewServers: false,
    canViewSystemMetrics: false,
    accessLevel: 5,
    accessType: 'filtered'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Online': return 'green'
      case 'Offline': return 'red'
      case 'Maintenance': return 'orange'
      case 'Warning': return 'yellow'
      case 'Critical': return 'red'
      case 'Healthy': return 'teal'
      default: return 'gray'
    }
  }

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'Online': return { from: 'green.5', to: 'emerald.4', deg: 135 }
      case 'Offline': return { from: 'red.5', to: 'pink.4', deg: 135 }
      case 'Maintenance': return { from: 'orange.5', to: 'yellow.4', deg: 135 }
      case 'Warning': return { from: 'yellow.5', to: 'orange.4', deg: 135 }
      case 'Critical': return { from: 'red.6', to: 'rose.5', deg: 135 }
      case 'Healthy': return { from: 'teal.5', to: 'cyan.4', deg: 135 }
      default: return { from: 'gray.5', to: 'gray.4', deg: 135 }
    }
  }

  const getTransactionStatusColor = (status: string) => {
    // Normalize status to handle case variations
    const normalizedStatus = status?.toLowerCase();
    
    switch (normalizedStatus) {
      case 'success':
      case 'completed':
      case 'complete':
        return 'green'
      
      case 'pending':
      case 'processing':
      case 'in_progress':
        return 'orange'
      
      case 'failed':
      case 'error':
      case 'declined':
        return 'red'
      
      case 'cancelled':
      case 'canceled':
        return 'gray'
      
      case 'refunded':
      case 'refund':
        return 'violet'
      
      default: 
        return 'blue'
    }
  }

  const getTransactionStatusGradient = (status: string) => {
    // Normalize status to handle case variations
    const normalizedStatus = status?.toLowerCase();
    
    switch (normalizedStatus) {
      case 'success':
      case 'completed':
      case 'complete':
        return { from: 'green.5', to: 'emerald.4', deg: 135 }
      
      case 'pending':
      case 'processing':
      case 'in_progress':
        return { from: 'orange.5', to: 'yellow.4', deg: 135 }
      
      case 'failed':
      case 'error':
      case 'declined':
        return { from: 'red.5', to: 'pink.4', deg: 135 }
      
      case 'cancelled':
      case 'canceled':
      case 'cancelled':
        return { from: 'gray.5', to: 'gray.4', deg: 135 }
      
      case 'refunded':
      case 'refund':
        return { from: 'violet.5', to: 'purple.4', deg: 135 }
      
      default: 
        console.log('Unknown status:', status)
        return { from: 'blue.5', to: 'cyan.4', deg: 135 }
    }
  }

  // Icon mapping for dynamic stats
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'IconUsers': return IconUsers
      case 'IconCurrencyDollar': return IconCurrencyDollar
      case 'IconServer': return IconServer
      case 'IconTrendingUp': return IconTrendingUp
      case 'IconMessageCircle': return IconMessageCircle
      default: return IconActivity
    }
  }

  return (
    <PagePermissionGuard requiredPermissions={['dashboard.admin.access']}>
      <AdminLayout>
      <ModernContainer fluid>
        <Stack gap="xl">
          {/* Enhanced Page Header */}
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
              <Box>
                <Group gap="lg" mb="lg">
                  <ThemeIcon 
                    size="2xl" 
                    variant="gradient" 
                    gradient={{ from: 'blue.6', to: 'indigo.5', deg: 135 }}
                    style={{
                      boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <IconChartBar size={28} />
                  </ThemeIcon>
                  <Box>
                    <Title 
                      order={2} 
                      mb={6}
                      c="dark.8"
                      fw={600}
                    >
                      {profile.company_name} Dashboard
                    </Title>
                    <Text c="dimmed" size="xs" fw={500}>
                      Real-time system monitoring and analytics platform
                    </Text>
                  </Box>
                </Group>
                
                <Group mt="md" gap="lg">
                  <Group gap="xs">
                    <IconDatabase size={16} />
                    <Text size="xs" c="dimmed">
                      {profile.city}, {profile.state}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconWorld size={16} />
                    <Text size="xs" c="dimmed">
                      {profile.mobile_number}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <IconBell size={16} />
                    <Text size="xs" c="dimmed">
                      {profile.email}
                    </Text>
                  </Group>
                  {dashboardData && (
                    <Group gap="xs">
                      <IconSettings size={16} />
                      <Text size="xs" c="dimmed">
                        Access Level {permissions.accessLevel} ({permissions.accessType})
                      </Text>
                    </Group>
                  )}
                </Group>
              </Box>
              
              <Group gap="sm">
                <Tooltip label="Refresh all data">
                  <ActionIcon 
                    size="xs" 
                    variant="light" 
                    color="blue"
                    onClick={refreshData}
                    loading={isLoading}
                  >
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                
                <ModernBadge variant="success">
                  <Group gap={4}>
                    <IconCheck size={12} />
                    System Online
                  </Group>
                </ModernBadge>
                
                <Group gap={4}>
                  <IconClock size={14} />
                  <Text size="xs" c="dimmed">
                    Last updated: {new Date().toLocaleTimeString()}
                  </Text>
                </Group>
              </Group>
            </Group>
          </ModernCard>

          {/* Enhanced Stats Grid */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            {stats.map((stat, index) => {
              const Icon = typeof stat.icon === 'string' ? getIconComponent(stat.icon) : stat.icon
              return (
                <Card 
                  key={index} 
                  shadow="md" 
                  padding="md" 
                  radius="lg" 
                  withBorder
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                    border: `2px solid var(--mantine-color-${stat.color}-2)`,
                    transition: 'all 0.3s ease',
                    height: 'auto',
                    minHeight: '140px'
                  }}
                  onMouseEnter={(e: any) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={(e: any) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {isLoading ? (
                    <Stack gap="sm">
                      <Skeleton height={20} />
                      <Skeleton height={32} />
                      <Skeleton height={16} />
                    </Stack>
                  ) : (
                    <Stack gap="sm">
                      {/* Header */}
                      <Group justify="space-between" align="flex-start">
                        <Group gap="xs">
                          <ThemeIcon 
                            size="xs" 
                            variant="gradient" 
                            gradient={{ from: stat.color, to: `${stat.color}.7`, deg: 135 }}
                          >
                            <Icon size={16} />
                          </ThemeIcon>
                          <Box>
                            <Text 
                              c={`${stat.color}.7`} 
                              size="xs" 
                              fw={600} 
                              tt="uppercase"
                              lh={1.2}
                            >
                              {stat.label}
                            </Text>
                            <Text size="xs" c="dimmed" lh={1.1}>
                              {stat.description}
                            </Text>
                          </Box>
                        </Group>
                      </Group>
                      
                      {/* Main Value and Progress */}
                      <Group justify="space-between" align="center">
                        <Box>
                          <Text 
                            size="xs" 
                            fw={700} 
                            c={`${stat.color}.8`}
                            lh={1}
                            style={{ fontSize: '1.75rem' }}
                          >
                            {stat.value}
                          </Text>
                          
                          {/* Change Indicator */}
                          <Group gap="xs" mt={4}>
                            <ThemeIcon 
                              size="xs" 
                              variant="light" 
                              color={stat.change > 0 ? 'green' : 'red'}
                            >
                              {stat.change > 0 ? 
                                <IconTrendingUp size={10} /> : 
                                <IconTrendingDown size={10} />
                              }
                            </ThemeIcon>
                            <Text 
                              c={stat.change > 0 ? 'green.7' : 'red.7'} 
                              size="xs" 
                              fw={500}
                              lh={1}
                            >
                              {Math.abs(stat.change)}%
                            </Text>
                          </Group>
                        </Box>
                        
                        {/* Progress Ring */}
                        <RingProgress
                          size={50}
                          thickness={5}
                          sections={[
                            { 
                              value: stat.progress, 
                              color: stat.color
                            }
                          ]}
                          label={
                            <Text size="xs" ta="center" fw={600} c={`${stat.color}.7`}>
                              {stat.progress}%
                            </Text>
                          }
                        />
                      </Group>
                    </Stack>
                  )}
                </Card>
              )
            })}
          </SimpleGrid>

          <ResponsiveTwoColumn leftSpan={8} rightSpan={4} gap="xl">
            <Stack gap="xl">
              {/* Enhanced Server Status - Only show if user has server access */}
              {permissions.canViewServers && (
                <ModernCard
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.03) 100%)',
                    border: '2px solid rgba(34, 197, 94, 0.15)',
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(34, 197, 94, 0.08)',
                    padding: '28px'
                  }}
                >
                <Box
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.08) 100%)',
                    padding: '20px 24px',
                    margin: '-28px -28px 28px -28px',
                    borderRadius: '20px 20px 0 0',
                    borderBottom: '2px solid rgba(34, 197, 94, 0.2)'
                  }}
                >
                  <Group justify="space-between">
                    <Group gap="md">
                      <ThemeIcon 
                        variant="gradient" 
                        gradient={{ from: 'green.6', to: 'emerald.5', deg: 135 }}
                        size="xs"
                        style={{
                          boxShadow: '0 8px 20px rgba(34, 197, 94, 0.4)'
                        }}
                      >
                        <IconServer size={24} />
                      </ThemeIcon>
                      <Box>
                        <Title order={3} c="green.7" fw={700}>Server Infrastructure</Title>
                        <Text size="xs" c="dimmed" fw={500}>
                          Real-time monitoring of WhatsApp server instances
                        </Text>
                      </Box>
                    </Group>
                    <Group gap="sm">
                      <ModernButton 
                        variant="ghost" 
                        size="xs" 
                        onClick={refreshData}
                        style={{
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '12px'
                        }}
                      >
                        <IconRefresh size={16} />
                        Refresh
                      </ModernButton>
                      <ModernButton 
                        variant="ghost" 
                        size="xs"
                        style={{
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '12px'
                        }}
                      >
                        <IconEye size={16} />
                        View All
                      </ModernButton>
                    </Group>
                  </Group>
                </Box>

                <Stack gap="md">
                  {serverStatus.map((server, index) => (
                    <ModernCard key={index} withBorder>
                      <Group justify="space-between" align="flex-start" mb="md">
                        <Group gap="xs">
                          <ThemeIcon 
                            size="xs" 
                            variant="light" 
                            color={getStatusColor(server.status)}
                          >
                            <IconActivity size={14} />
                          </ThemeIcon>
                          <Box>
                            <Group gap="xs" mb={2}>
                              <Text fw={600} size="xs">{server.name}</Text>
                              <Badge 
                                size="xs"
                                variant="gradient"
                                gradient={getStatusGradient(server.status)}
                                style={{
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                                }}
                              >
                                {server.status}
                              </Badge>
                              <Text size="xs" c="dimmed">
                                {server.location}
                              </Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              Last checked: {server.lastChecked}
                            </Text>
                          </Box>
                        </Group>
                        <Text size="xs" fw={500} c="green">
                          {server.uptime} uptime
                        </Text>
                      </Group>
                      
                      <SimpleGrid cols={4} spacing="sm">
                        <Box>
                          <Text size="xs" c="dimmed" mb={2}>Active Users</Text>
                          <Text fw={600} size="xs">{server.users.toLocaleString()}</Text>
                        </Box>
                        <Box>
                          <Text size="xs" c="dimmed" mb={2}>Messages</Text>
                          <Text fw={600} size="xs">{server.messages.toLocaleString()}</Text>
                        </Box>
                        <Box>
                          <Text size="xs" c="dimmed" mb={2}>CPU Load</Text>
                          <Progress 
                            value={server.load} 
                            color={server.load > 80 ? 'red' : server.load > 60 ? 'yellow' : 'green'} 
                            size="xs" 
                          />
                          <Text size="xs" c="dimmed" mt={1}>{server.load}%</Text>
                        </Box>
                        <Box>
                          <Text size="xs" c="dimmed" mb={2}>Memory</Text>
                          <Progress 
                            value={server.memory} 
                            color={server.memory > 80 ? 'red' : server.memory > 60 ? 'yellow' : 'green'} 
                            size="xs" 
                          />
                          <Text size="xs" c="dimmed" mt={1}>{server.memory}%</Text>
                        </Box>
                      </SimpleGrid>
                    </ModernCard>
                  ))}
                </Stack>
                </ModernCard>
              )}
              
              {/* Activity Timeline */}
              <ModernCard>
                <Group gap="sm" mb="lg">
                  <ThemeIcon size="xs" variant="light" color="violet">
                    <IconClock size={10} />
                  </ThemeIcon>
                  <Text size="xs" fw={600}>Recent Activity</Text>
                </Group>
                
                <Timeline active={-1} bulletSize={20} lineWidth={2}>
                  {recentActivities.map((activity, index) => (
                    <Timeline.Item 
                      key={index}
                      bullet={
                        <ThemeIcon size="xs" variant="light" color={activity.color}>
                          {activity.type === 'user' && <IconUsers size={10} />}
                          {activity.type === 'server' && <IconServer size={10} />}
                          {activity.type === 'alert' && <IconAlertTriangle size={10} />}
                          {activity.type === 'payment' && <IconCurrencyDollar size={10} />}
                        </ThemeIcon>
                      }
                      title={<Text size="xs" fw={500}>{activity.title}</Text>}
                    >
                      <Text size="xs" c="dimmed" mb={2}>
                        {activity.description}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {activity.time}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </ModernCard>
            </Stack>

            {/* Enhanced System Performance - Only show if user has system metrics access */}
            {permissions.canViewSystemMetrics && (
              <ModernCard>
              <Group gap="sm" mb="lg">
                <ThemeIcon size="xs" variant="light" color="green">
                  <IconActivity size={10} />
                </ThemeIcon>
                <Text size="xs" fw={600}>System Performance</Text>
              </Group>

              <Stack gap="xl">
                {[
                  { 
                    label: 'CPU Usage', 
                    value: dashboardData?.systemMetrics?.cpuUsage || 45, 
                    color: 'blue', 
                    icon: IconChartBar 
                  },
                  { 
                    label: 'Memory Usage', 
                    value: dashboardData?.systemMetrics?.memoryUsage || 67, 
                    color: 'orange', 
                    icon: IconDatabase 
                  },
                  { 
                    label: 'Storage Usage', 
                    value: dashboardData?.systemMetrics?.storageUsage || 34, 
                    color: 'green', 
                    icon: IconServer 
                  },
                  { 
                    label: 'Network I/O', 
                    value: dashboardData?.systemMetrics?.networkIO || 23, 
                    color: 'violet', 
                    icon: IconWorld 
                  },
                ].map((metric, index) => (
                  <Box key={index}>
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <ThemeIcon size="xs" variant="light" color={metric.color}>
                          <metric.icon size={10} />
                        </ThemeIcon>
                        <Text size="xs" fw={500}>{metric.label}</Text>
                      </Group>
                      <Group gap="xs">
                        <Text size="xs" fw={600}>{metric.value}%</Text>
                        <Text size="xs" c="dimmed">
                          {metric.value < 50 ? 'Normal' : 
                           metric.value < 80 ? 'Moderate' : 'High'}
                        </Text>
                      </Group>
                    </Group>
                    <ModernProgress 
                      value={metric.value} 
                      variant={
                        metric.value < 50 ? 'success' : 
                        metric.value < 80 ? 'warning' : 'danger'
                      } 
                      size="xs" 
                    />
                  </Box>
                ))}
                
                {/* System Health Alert */}
                <ModernAlert variant="info" title="System Health Status">
                  All systems are operating within normal parameters. 
                  <Anchor size="xs" ml={4}>View detailed metrics →</Anchor>
                </ModernAlert>
              </Stack>
              </ModernCard>
            )}
          </ResponsiveTwoColumn>

          {/* Enhanced Recent Transactions - Only show if user can view transactions */}
          {permissions.canViewTransactions && (
            <ModernCard>
            <Group justify="space-between" mb="lg">
              <Group gap="sm">
                <ThemeIcon variant="light" color="green">
                  <IconCurrencyDollar size={18} />
                </ThemeIcon>
                <Title order={4}>Recent Transactions</Title>
              </Group>
              <Group gap="sm">
                <ModernButton variant="ghost" size="xs">
                  <IconEye size={14} />
                  View All
                </ModernButton>
                <ModernButton variant="secondary" size="xs">
                  <IconSettings size={14} />
                  Export
                </ModernButton>
              </Group>
            </Group>

            <Table.ScrollContainer minWidth={800}>
              <Table 
                striped 
                highlightOnHover
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  borderSpacing: '0 2px',
                  borderCollapse: 'separate'
                }}
              >
                <Table.Thead
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
                    borderBottom: '2px solid rgba(59, 130, 246, 0.1)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  <Table.Tr>
                    <Table.Th style={{ 
                      fontWeight: 700, 
                      color: 'var(--mantine-color-blue-7)', 
                      padding: '12px 10px',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '140px'
                    }}>Transaction</Table.Th>
                    <Table.Th style={{ 
                      fontWeight: 700, 
                      color: 'var(--mantine-color-blue-7)', 
                      padding: '12px 10px',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '140px'
                    }}>Customer</Table.Th>
                    <Table.Th style={{ 
                      fontWeight: 700, 
                      color: 'var(--mantine-color-blue-7)', 
                      padding: '12px 10px',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '100px',
                      textAlign: 'center'
                    }}>Amount</Table.Th>
                    <Table.Th style={{ 
                      fontWeight: 700, 
                      color: 'var(--mantine-color-blue-7)', 
                      padding: '12px 10px',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '100px',
                      textAlign: 'center'
                    }}>Method</Table.Th>
                    <Table.Th style={{ 
                      fontWeight: 700, 
                      color: 'var(--mantine-color-blue-7)', 
                      padding: '12px 10px',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '100px',
                      textAlign: 'center'
                    }}>Status</Table.Th>
                    <Table.Th style={{ 
                      fontWeight: 700, 
                      color: 'var(--mantine-color-blue-7)', 
                      padding: '12px 10px',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '120px'
                    }}>Time</Table.Th>
                    <Table.Th style={{ 
                      fontWeight: 700, 
                      color: 'var(--mantine-color-blue-7)', 
                      padding: '12px 10px',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      minWidth: '80px',
                      textAlign: 'center'
                    }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {recentTransactions.map((transaction, index) => (
                    <Table.Tr 
                      key={transaction.id}
                      style={{
                        borderBottom: '1px solid rgba(226, 232, 240, 0.4)',
                        background: index % 2 === 0 ? 'rgba(248, 250, 252, 0.3)' : 'white',
                        transition: 'all 0.2s ease',
                        height: '60px'
                      }}
                      onMouseEnter={(e: any) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.04)'
                        e.currentTarget.style.transform = 'scale(1.002)'
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseLeave={(e: any) => {
                        e.currentTarget.style.background = index % 2 === 0 ? 'rgba(248, 250, 252, 0.3)' : 'white'
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                        <Box
                          style={{
                            padding: '6px 10px',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
                            borderRadius: '8px',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                          }}
                        >
                          <Text ff="monospace" size="xs" fw={700} c="blue.7">
                            {transaction.id}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={1} mt={1}>
                            {transaction.description}
                          </Text>
                        </Box>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ThemeIcon size="xs" variant="light" color="blue">
                            <IconUsers size={10} />
                          </ThemeIcon>
                          <Text fw={500} size="xs">{transaction.user}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="xs">
                          {transaction.amount}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {transaction.method}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          size="xs"
                          variant="gradient"
                          gradient={getTransactionStatusGradient(transaction.status)}
                          style={{
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            padding: '4px 8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                          }}
                        >
                          {transaction.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconClock size={10} />
                          <Text size="xs" c="dimmed">
                            {transaction.time}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label="View details">
                          <ActionIcon variant="subtle" size="xs">
                            <IconEye size={10} />
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            </ModernCard>
          )}
        </Stack>
      </ModernContainer>
      </AdminLayout>
    </PagePermissionGuard>
  )
}