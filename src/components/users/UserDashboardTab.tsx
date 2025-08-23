'use client'

import {
  Box,
  Title,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  Badge,
  Card,
  Table,
  SimpleGrid,
  ActionIcon,
  Modal,
  Switch,
  Select,
  Textarea,
  Container,
  Tabs,
  RingProgress,
  Progress,
} from '@mantine/core'
import { 
  FiUsers,
  FiEye,
  FiTrendingUp,
  FiTrendingDown,
  FiMessageSquare,
  FiCalendar,
  FiActivity,
  FiCreditCard,
  FiPackage,
  FiShield,
  FiPhone,
  FiMail,
  FiGlobe,
  FiClock,
  FiBarChart,
  FiPieChart
} from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useUserPermissions } from '@/hooks/useUserPermissions'

interface UserDetail {
  id: number
  name: string
  email: string
  mobile: string
  role: string
  status: 'Active' | 'Inactive'
  language: string
  package: string
  parentId: number | null
  createdAt: string
  lastLogin: string
  
  // Analytics data
  messagesUsed: number
  messagesLimit: number
  messagesSentToday: number
  messagesSentThisWeek: number
  messagesSentThisMonth: number
  
  // Financial data
  totalSpent: number
  currentBalance: number
  totalTransactions: number
  lastTransaction: string
  
  // Activity data
  loginCount: number
  lastActivity: string
  activeHours: number[]
  deviceInfo: string
  ipAddress: string
  
  // Performance metrics
  successRate: number
  responseTime: number
  errorCount: number
}

export default function UserDashboardTab() {
  const { data: session } = useSession()
  const { permissions } = useUserPermissions()
  
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [timeRange, setTimeRange] = useState('30d')

  // Sample user data with Indian localization
  const users: UserDetail[] = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      mobile: '+91-98765-43210',
      role: 'OWNER',
      status: 'Active',
      language: 'Hindi',
      package: 'Enterprise',
      parentId: null,
      createdAt: '2024-01-01',
      lastLogin: '2 hours ago',
      messagesUsed: 15420,
      messagesLimit: 50000,
      messagesSentToday: 245,
      messagesSentThisWeek: 1680,
      messagesSentThisMonth: 6250,
      totalSpent: 125000,
      currentBalance: 50000,
      totalTransactions: 156,
      lastTransaction: '2024-08-07',
      loginCount: 342,
      lastActivity: '2 hours ago',
      activeHours: [9, 10, 11, 14, 15, 16, 17],
      deviceInfo: 'Chrome on Windows',
      ipAddress: '192.168.1.100',
      successRate: 98.5,
      responseTime: 1200,
      errorCount: 3
    },
    {
      id: 2,
      name: 'Priya Sharma',
      email: 'priya@example.com',
      mobile: '+91-87654-32109',
      role: 'SUBDEALER',
      status: 'Active',
      language: 'Hindi',
      package: 'Professional',
      parentId: 1,
      createdAt: '2024-01-15',
      lastLogin: '1 day ago',
      messagesUsed: 8500,
      messagesLimit: 25000,
      messagesSentToday: 125,
      messagesSentThisWeek: 850,
      messagesSentThisMonth: 3200,
      totalSpent: 75000,
      currentBalance: 25000,
      totalTransactions: 89,
      lastTransaction: '2024-08-06',
      loginCount: 156,
      lastActivity: '1 day ago',
      activeHours: [10, 11, 12, 15, 16, 17],
      deviceInfo: 'Safari on iPhone',
      ipAddress: '192.168.1.101',
      successRate: 96.8,
      responseTime: 1450,
      errorCount: 7
    },
    {
      id: 3,
      name: 'Amit Patel',
      email: 'amit@example.com',
      mobile: '+91-76543-21098',
      role: 'CUSTOMER',
      status: 'Active',
      language: 'English',
      package: 'Basic',
      parentId: 2,
      createdAt: '2024-02-01',
      lastLogin: '5 minutes ago',
      messagesUsed: 450,
      messagesLimit: 1000,
      messagesSentToday: 15,
      messagesSentThisWeek: 125,
      messagesSentThisMonth: 450,
      totalSpent: 5000,
      currentBalance: 1500,
      totalTransactions: 12,
      lastTransaction: '2024-08-08',
      loginCount: 45,
      lastActivity: '5 minutes ago',
      activeHours: [9, 18, 19, 20],
      deviceInfo: 'Chrome on Android',
      ipAddress: '192.168.1.102',
      successRate: 94.2,
      responseTime: 1800,
      errorCount: 2
    }
  ]

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = !filterRole || user.role === filterRole
    
    return matchesSearch && matchesRole
  })

  // Calculate summary stats
  const totalUsers = filteredUsers.length
  const activeUsers = filteredUsers.filter(u => u.status === 'Active').length
  const totalMessages = filteredUsers.reduce((sum, u) => sum + u.messagesUsed, 0)
  const totalRevenue = filteredUsers.reduce((sum, u) => sum + u.totalSpent, 0)

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'red'
    if (percentage >= 70) return 'orange'
    return 'green'
  }

  const handleViewDetails = (user: UserDetail) => {
    setSelectedUser(user)
    setIsDetailsModalOpen(true)
  }

  return (
    <Stack gap="lg">
      {/* Summary Stats */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FiUsers} size={20} c="blue.5" />
              <Text size="xl" fw="bold" c="blue.5">
                {totalUsers}
              </Text>
            </Group>
            <Text size="sm" c="dimmed">Total Users</Text>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FiActivity} size={20} c="green.5" />
              <Text size="xl" fw="bold" c="green.5">
                {activeUsers}
              </Text>
            </Group>
            <Text size="sm" c="dimmed">Active Users</Text>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FiMessageSquare} size={20} c="violet.5" />
              <Text size="xl" fw="bold" c="violet.5">
                {totalMessages.toLocaleString()}
              </Text>
            </Group>
            <Text size="sm" c="dimmed">Total Messages</Text>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FaRupeeSign} size={20} c="orange.5" />
              <Text size="xl" fw="bold" c="orange.5">
                ₹{totalRevenue.toLocaleString()}
              </Text>
            </Group>
            <Text size="sm" c="dimmed">Total Revenue</Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Filters */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" wrap="wrap" gap="md">
          <Group gap="md" style={{ flex: 1 }}>
            <TextInput
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '300px' }}
            />
            <Select
              placeholder="All Roles"
              value={filterRole}
              onChange={(value) => setFilterRole(value || '')}
              data={[
                { value: '', label: 'All Roles' },
                { value: 'OWNER', label: 'Owner' },
                { value: 'SUBDEALER', label: 'SubDealer' },
                { value: 'EMPLOYEE', label: 'Employee' },
                { value: 'CUSTOMER', label: 'Customer' }
              ]}
              style={{ minWidth: '120px' }}
            />
            <Select
              placeholder="Time Range"
              value={timeRange}
              onChange={(value) => setTimeRange(value || '30d')}
              data={[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
                { value: '1y', label: 'Last year' }
              ]}
              style={{ minWidth: '120px' }}
            />
          </Group>
        </Group>
      </Card>

      {/* User Analytics Grid */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        {filteredUsers.map((user) => {
          const usagePercentage = getUsagePercentage(user.messagesUsed, user.messagesLimit)
          const usageColor = getUsageColor(usagePercentage)
          
          return (
            <Card key={user.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Group justify="space-between">
                  <Group>
                    <Stack gap={2}>
                      <Text fw={500}>{user.name}</Text>
                      <Badge color="blue" variant="light" size="sm">
                        {user.role}
                      </Badge>
                    </Stack>
                  </Group>
                  <ActionIcon
                    variant="subtle"
                    onClick={() => handleViewDetails(user)}
                    aria-label="View details"
                  >
                    <Box component={FiEye} />
                  </ActionIcon>
                </Group>
              </Card.Section>

              <Stack gap="md" mt="md">
                {/* Usage Progress */}
                <Box>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>Message Usage</Text>
                    <Text size="sm" c={`${usageColor}.6`}>
                      {usagePercentage}%
                    </Text>
                  </Group>
                  <Progress
                    value={usagePercentage}
                    color={usageColor}
                    size="md"
                    radius="md"
                  />
                  <Group justify="space-between" mt={4}>
                    <Text size="xs" c="dimmed">
                      {user.messagesUsed.toLocaleString()} used
                    </Text>
                    <Text size="xs" c="dimmed">
                      {user.messagesLimit.toLocaleString()} limit
                    </Text>
                  </Group>
                </Box>

                {/* Quick Stats */}
                <SimpleGrid cols={2} spacing="sm">
                  <Box>
                    <Text size="xs" c="dimmed">Today</Text>
                    <Text fw={500}>{user.messagesSentToday}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">This Week</Text>
                    <Text fw={500}>{user.messagesSentThisWeek}</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Success Rate</Text>
                    <Text fw={500} c="green.6">{user.successRate}%</Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">Last Login</Text>
                    <Text fw={500}>{user.lastLogin}</Text>
                  </Box>
                </SimpleGrid>

                {/* Financial Info */}
                <Group justify="space-between" p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-1)', borderRadius: 'var(--mantine-radius-md)' }}>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">Total Spent</Text>
                    <Text fw={500} c="orange.6">₹{user.totalSpent.toLocaleString()}</Text>
                  </Stack>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed">Balance</Text>
                    <Text fw={500} c="green.6">₹{user.currentBalance.toLocaleString()}</Text>
                  </Stack>
                </Group>
              </Stack>
            </Card>
          )
        })}
      </SimpleGrid>

      {/* User Details Modal */}
      <Modal
        opened={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`User Analytics - ${selectedUser?.name}`}
        size="xl"
      >
        {selectedUser && (
          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {/* User Info */}
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Stack gap="sm">
                  <Group>
                    <Stack gap="xs">
                      <Text fw={500} size="lg">{selectedUser.name}</Text>
                      <Badge color="blue" variant="light">{selectedUser.role}</Badge>
                    </Stack>
                  </Group>
                  <Stack gap="xs">
                    <Group gap="xs">
                      <Box component={FiMail} size={14} c="gray.6" />
                      <Text size="sm">{selectedUser.email}</Text>
                    </Group>
                    <Group gap="xs">
                      <Box component={FiPhone} size={14} c="gray.6" />
                      <Text size="sm">{selectedUser.mobile}</Text>
                    </Group>
                    <Group gap="xs">
                      <Box component={FiPackage} size={14} c="gray.6" />
                      <Text size="sm">{selectedUser.package} Package</Text>
                    </Group>
                  </Stack>
                </Stack>
              </Card>

              {/* Performance Metrics */}
              <Card shadow="xs" padding="md" radius="md" withBorder>
                <Stack gap="sm">
                  <Text fw={500} size="md">Performance Metrics</Text>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Success Rate:</Text>
                      <Badge color="green" variant="light">
                        {selectedUser.successRate}%
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Response Time:</Text>
                      <Text size="sm" fw={500}>{selectedUser.responseTime}ms</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Error Count:</Text>
                      <Badge color={selectedUser.errorCount > 5 ? 'red' : 'yellow'} variant="light">
                        {selectedUser.errorCount}
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Login Count:</Text>
                      <Text size="sm" fw={500}>{selectedUser.loginCount}</Text>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            </SimpleGrid>

            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}