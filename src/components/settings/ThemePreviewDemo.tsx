'use client'

import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  SimpleGrid,
  Box,
  Progress,
  Avatar,
  Table,
  ActionIcon,
  Alert,
  Switch,
  TextInput,
  Select,
  Tabs
} from '@mantine/core'
import * as Fi from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import { CustomTheme } from '@/types/theme'

interface ThemePreviewDemoProps {
  theme: CustomTheme
}

export default function ThemePreviewDemo({ theme }: ThemePreviewDemoProps) {
  const sampleData = [
    { id: 1, name: 'John Doe', role: 'Customer', status: 'Active', usage: 75, messages: 3500, limit: 5000 },
    { id: 2, name: 'Jane Smith', role: 'SubDealer', status: 'Active', usage: 45, messages: 4500, limit: 10000 },
    { id: 3, name: 'Bob Wilson', role: 'Employee', status: 'Inactive', usage: 20, messages: 200, limit: 1000 }
  ]

  return (
    <Stack gap="lg" style={{ minHeight: '600px' }}>
      {/* Header Section */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between">
          <Stack gap="xs">
            <Group gap="md">
              <Box component={Fi.FiSettings} size={24} c={`${theme.primaryColor}.6`} />
              <Title order={3} c="gray.8">
                WhatsApp Management Dashboard
              </Title>
            </Group>
            <Text c="dimmed">
              Preview of how your dashboard looks with the {theme.name} theme
            </Text>
          </Stack>
          <Badge color={theme.primaryColor} size="lg">
            {theme.name}
          </Badge>
        </Group>
      </Card>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={Fi.FiUsers} size={20} c={`${theme.primaryColor}.5`} />
              <Text size="xl" fw="bold" c={`${theme.primaryColor}.5`}>
                1,234
              </Text>
            </Group>
            <Text size="sm" c="dimmed">Total Users</Text>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={Fi.FiTrendingUp} size={20} c="green.5" />
              <Text size="xl" fw="bold" c="green.5">
                892
              </Text>
            </Group>
            <Text size="sm" c="dimmed">Active Users</Text>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={Fi.FiMessageSquare} size={20} c="violet.5" />
              <Text size="xl" fw="bold" c="violet.5">
                45.2K
              </Text>
            </Group>
            <Text size="sm" c="dimmed">Messages Sent</Text>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FaRupeeSign} size={20} c="orange.5" />
              <Text size="xl" fw="bold" c="orange.5">
                ₹12,450
              </Text>
            </Group>
            <Text size="sm" c="dimmed">Revenue</Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Interactive Components */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Form Components */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={5}>Form Components</Title>
            <TextInput label="Search Users" placeholder="Enter user name..." />
            <Select
              label="User Role"
              placeholder="Select role"
              data={[
                { value: 'owner', label: 'Owner' },
                { value: 'subdealer', label: 'SubDealer' },
                { value: 'customer', label: 'Customer' }
              ]}
            />
            <Group>
              <Button color={theme.primaryColor}>Primary Action</Button>
              <Button color={theme.primaryColor} variant="light">Secondary</Button>
              <Button color={theme.primaryColor} variant="outline">Outline</Button>
            </Group>
            <Switch label="Enable notifications" />
          </Stack>
        </Card>

        {/* Progress and Status */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Title order={5}>Progress & Status</Title>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Server Performance</Text>
                <Text size="sm" c={`${theme.primaryColor}.6`}>85%</Text>
              </Group>
              <Progress value={85} color={theme.primaryColor} size="md" radius="md" />
            </Stack>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Message Delivery</Text>
                <Text size="sm" c="green.6">92%</Text>
              </Group>
              <Progress value={92} color="green" size="md" radius="md" />
            </Stack>
            <Group>
              <Badge color={theme.primaryColor}>Active</Badge>
              <Badge color={theme.primaryColor} variant="light">Pending</Badge>
              <Badge color={theme.primaryColor} variant="outline">Complete</Badge>
              <Badge color="red">Error</Badge>
            </Group>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Table Preview */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={5}>User Management Table</Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Usage</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sampleData.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar size="sm" radius="xl">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Text fw={500} size="sm">{user.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={theme.primaryColor} variant="light" size="sm">
                      {user.role}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={user.status === 'Active' ? 'green' : 'red'} variant="light">
                      {user.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      <Group justify="space-between" style={{ minWidth: 120 }}>
                        <Text size="xs">{user.messages} / {user.limit}</Text>
                        <Text size="xs" c={user.usage > 80 ? 'red' : `${theme.primaryColor}.6`}>
                          {user.usage}%
                        </Text>
                      </Group>
                      <Progress
                        value={user.usage}
                        color={user.usage > 80 ? 'red' : theme.primaryColor}
                        size="xs"
                        radius="md"
                      />
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon size="sm" variant="subtle" color={theme.primaryColor}>
                        <Box component={Fi.FiEye} />
                      </ActionIcon>
                      <ActionIcon size="sm" variant="subtle" color="blue">
                        <Box component={Fi.FiEdit3} />
                      </ActionIcon>
                      <ActionIcon size="sm" variant="subtle" color="red">
                        <Box component={Fi.FiTrash2} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>

      {/* Alerts and Notifications */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Alert variant="light" color={theme.primaryColor} title="System Status">
          All systems are running normally. Theme preview is active.
        </Alert>
        <Alert variant="light" color="green" title="Success" icon={<Box component={Fi.FiCheck} />}>
          Theme applied successfully to all components.
        </Alert>
      </SimpleGrid>

      {/* Tabs Preview */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Tabs defaultValue="overview" color={theme.primaryColor}>
          <Tabs.List>
            <Tabs.Tab value="overview">
              <Group gap="xs">
                <Box component={Fi.FiActivity} size={16} />
                <Text>Overview</Text>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="servers">
              <Group gap="xs">
                <Box component={Fi.FiServer} size={16} />
                <Text>Servers</Text>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="settings">
              <Group gap="xs">
                <Box component={Fi.FiSettings} size={16} />
                <Text>Settings</Text>
              </Group>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Text size="sm" c="dimmed">
              This tab shows how navigation tabs look with the {theme.name} theme.
            </Text>
          </Tabs.Panel>

          <Tabs.Panel value="servers" pt="md">
            <Text size="sm" c="dimmed">
              Server management interface would appear here with consistent theming.
            </Text>
          </Tabs.Panel>

          <Tabs.Panel value="settings" pt="md">
            <Text size="sm" c="dimmed">
              Settings panel maintains the same color scheme throughout.
            </Text>
          </Tabs.Panel>
        </Tabs>
      </Card>
    </Stack>
  )
}