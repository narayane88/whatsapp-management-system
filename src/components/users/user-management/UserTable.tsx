'use client'

import {
  Card,
  Table,
  Text,
  Badge,
  Group,
  ActionIcon,
  Stack,
  Box,
  Progress,
} from '@mantine/core'
import {
  FiEye,
  FiEdit3,
  FiTrash2,
  FiKey,
  FiUserCheck,
  FiUserX,
  FiPhone,
  FiMail,
} from 'react-icons/fi'

interface User {
  id: number
  name: string
  email: string
  mobile: string
  role: string
  status: string
  lastLogin: string
  messagesUsed: number
  messagesLimit: number
  package: string
  totalTransactions: number
  language: string
  isActive: boolean
  dealerCode?: string | null
  referredByDealerCode?: string | null
}

interface UserTableProps {
  users: User[]
  onView: (user: User) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onToggleStatus: (user: User) => void
  onResetPassword: (user: User) => void
  canManageUser: (targetUser: User) => boolean
}

export default function UserTable({
  users,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onResetPassword,
  canManageUser
}: UserTableProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'red'
      case 'SUBDEALER': return 'orange'
      case 'EMPLOYEE': return 'blue'
      case 'CUSTOMER': return 'green'
      default: return 'gray'
    }
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'red'
    if (percentage >= 70) return 'orange'
    return 'green'
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Table.ScrollContainer minWidth={1200}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>User</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Contact</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Package</Table.Th>
              <Table.Th>Message Usage</Table.Th>
              <Table.Th>Last Login</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => {
              const usagePercentage = getUsagePercentage(user.messagesUsed, user.messagesLimit)
              const usageColor = getUsageColor(usagePercentage)
              
              return (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    <Group gap="sm">
                      <Stack gap={2}>
                        <Text fw={500} size="sm">{user.name}</Text>
                        <Text size="xs" c="dimmed">ID: {user.id}</Text>
                        {user.dealerCode && (
                          <Group gap="xs">
                            <Box component={FiKey} size={12} c="blue.6" />
                            <Text size="xs" ff="monospace" c="blue.6">
                              {user.dealerCode}
                            </Text>
                          </Group>
                        )}
                      </Stack>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getRoleColor(user.role)} variant="light" size="sm">
                      {user.role}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Group gap="xs">
                        <Box component={FiMail} size={12} c="gray.6" />
                        <Text size="xs">{user.email}</Text>
                      </Group>
                      <Group gap="xs">
                        <Box component={FiPhone} size={12} c="gray.6" />
                        <Text size="xs">{user.mobile}</Text>
                      </Group>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Box component={user.isActive ? FiUserCheck : FiUserX} 
                           size={14} c={user.isActive ? 'green.6' : 'red.6'} />
                      <Badge color={user.isActive ? 'green' : 'red'} variant="light" size="sm">
                        {user.status}
                      </Badge>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>{user.package}</Text>
                    <Text size="xs" c="dimmed">{user.totalTransactions} transactions</Text>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      <Group gap="xs" justify="space-between">
                        <Text size="xs" c="dimmed">
                          {user.messagesUsed.toLocaleString()} / {user.messagesLimit.toLocaleString()}
                        </Text>
                        <Text size="xs" c={`${usageColor}.6`}>
                          {usagePercentage}%
                        </Text>
                      </Group>
                      <Progress
                        value={usagePercentage}
                        color={usageColor}
                        size="xs"
                        radius="md"
                      />
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{user.lastLogin}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => onView(user)}
                        aria-label="View user details"
                      >
                        <Box component={FiEye} />
                      </ActionIcon>
                      
                      {canManageUser(user) && (
                        <>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => onEdit(user)}
                            aria-label="Edit user"
                          >
                            <Box component={FiEdit3} />
                          </ActionIcon>
                          
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color={user.isActive ? 'red' : 'green'}
                            onClick={() => onToggleStatus(user)}
                            aria-label={user.isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            <Box component={user.isActive ? FiUserX : FiUserCheck} />
                          </ActionIcon>
                          
                          {user.role !== 'OWNER' && (
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => onDelete(user)}
                              aria-label="Delete user"
                            >
                              <Box component={FiTrash2} />
                            </ActionIcon>
                          )}
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  )
}