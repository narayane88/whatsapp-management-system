'use client'

import {
  Box,
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Table,
  SimpleGrid,
  Card,
  Alert,
} from '@mantine/core'
import { 
  FiCheck, 
  FiX, 
  FiInfo,
  FiShield,
  FiUsers,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiKey,
  FiUserCheck,
  FiActivity,
  FiCreditCard
} from 'react-icons/fi'

const permissions = [
  { 
    key: 'canViewUsers', 
    label: 'View Users', 
    icon: FiEye,
    description: 'Can view user list and basic information' 
  },
  { 
    key: 'canCreateUsers', 
    label: 'Create Users', 
    icon: FiUsers,
    description: 'Can create new user accounts' 
  },
  { 
    key: 'canEditUsers', 
    label: 'Edit Users', 
    icon: FiEdit3,
    description: 'Can modify user information and settings' 
  },
  { 
    key: 'canDeleteUsers', 
    label: 'Delete Users', 
    icon: FiTrash2,
    description: 'Can permanently delete user accounts' 
  },
  { 
    key: 'canViewUserDetails', 
    label: 'View Details', 
    icon: FiInfo,
    description: 'Can view detailed user information and stats' 
  },
  { 
    key: 'canManageRoles', 
    label: 'Manage Roles', 
    icon: FiShield,
    description: 'Can assign and change user roles' 
  },
  { 
    key: 'canResetPasswords', 
    label: 'Reset Passwords', 
    icon: FiKey,
    description: 'Can reset user passwords' 
  },
  { 
    key: 'canToggleUserStatus', 
    label: 'Toggle Status', 
    icon: FiUserCheck,
    description: 'Can activate/deactivate user accounts' 
  },
  { 
    key: 'canViewUserActivity', 
    label: 'View Activity', 
    icon: FiActivity,
    description: 'Can view user activity logs and history' 
  },
  { 
    key: 'canManageMessageLimits', 
    label: 'Manage Limits', 
    icon: FiUsers,
    description: 'Can set and modify user message limits' 
  },
  { 
    key: 'canViewUserTransactions', 
    label: 'View Transactions', 
    icon: FiCreditCard,
    description: 'Can view user transaction history and financial data' 
  },
  { 
    key: 'canAssignPackages', 
    label: 'Assign Packages', 
    icon: FiUsers,
    description: 'Can assign service packages to users' 
  },
]

const rolePermissions = {
  OWNER: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewUserDetails: true,
    canManageRoles: true,
    canResetPasswords: true,
    canToggleUserStatus: true,
    canViewUserActivity: true,
    canManageMessageLimits: true,
    canViewUserTransactions: true,
    canAssignPackages: true,
  },
  SUBDEALER: {
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: false,
    canViewUserDetails: true,
    canManageRoles: false,
    canResetPasswords: true,
    canToggleUserStatus: true,
    canViewUserActivity: true,
    canManageMessageLimits: true,
    canViewUserTransactions: false,
    canAssignPackages: true,
  },
  EMPLOYEE: {
    canViewUsers: true,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewUserDetails: true,
    canManageRoles: false,
    canResetPasswords: false,
    canToggleUserStatus: false,
    canViewUserActivity: false,
    canManageMessageLimits: false,
    canViewUserTransactions: false,
    canAssignPackages: false,
  },
  CUSTOMER: {
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewUserDetails: false,
    canManageRoles: false,
    canResetPasswords: false,
    canToggleUserStatus: false,
    canViewUserActivity: false,
    canManageMessageLimits: false,
    canViewUserTransactions: false,
    canAssignPackages: false,
  },
}

const roles = ['OWNER', 'SUBDEALER', 'EMPLOYEE', 'CUSTOMER']

const getRoleColor = (role: string) => {
  switch (role) {
    case 'OWNER': return 'red'
    case 'SUBDEALER': return 'orange'
    case 'EMPLOYEE': return 'blue'
    case 'CUSTOMER': return 'green'
    default: return 'gray'
  }
}

export default function RolePermissionMatrix() {
  return (
    <Stack gap="lg">
      <Box ta="center">
        <Title order={1} mb="xs" c="gray.8">
          Role Permission Matrix
        </Title>
        <Text c="gray.6" mb="md">
          Comprehensive overview of user management permissions by role
        </Text>
      </Box>

      <Alert variant="light" color="blue" title="Important Security Rules" icon={<Box component={FiInfo} />}>
        <Stack gap="xs">
          <Text size="sm">
            • <Text span fw="bold">OWNER accounts are fully protected</Text> - cannot be deleted or managed by anyone
          </Text>
          <Text size="sm">
            • Only system administrators can create new OWNER accounts (outside this interface)
          </Text>
          <Text size="sm">
            • SubDealers can only manage users they created or Customer/Employee accounts
          </Text>
          <Text size="sm">
            • Employees can only view Customer accounts (read-only access)
          </Text>
          <Text size="sm">
            • All roles respect the hierarchy - no elevation of privileges
          </Text>
        </Stack>
      </Alert>

      {/* Role Overview Cards */}
      <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="md">
        {roles.map((role) => (
          <Card key={role} shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Group justify="center">
                <Badge color={getRoleColor(role)} size="lg" style={{ padding: '8px 16px' }}>
                  {role}
                </Badge>
              </Group>
            </Card.Section>
            <Stack align="center" gap="xs" mt="md">
              <Text size="xl" fw="bold" c="blue.5">
                {Object.values(rolePermissions[role as keyof typeof rolePermissions]).filter(Boolean).length}
              </Text>
              <Text size="sm" c="dimmed">
                / {permissions.length} permissions
              </Text>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {/* Detailed Permission Matrix */}
      <Box style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Group gap="xs">
                  <Box component={FiShield} />
                  <Text>Permission</Text>
                </Group>
              </Table.Th>
              {roles.map((role) => (
                <Table.Th key={role} ta="center">
                  <Badge color={getRoleColor(role)}>
                    {role}
                  </Badge>
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {permissions.map((permission) => {
              const Icon = permission.icon
              return (
                <Table.Tr key={permission.key}>
                  <Table.Td>
                    <Stack gap="xs">
                      <Group gap="xs">
                        <Box component={Icon} size={16} />
                        <Text fw="500">{permission.label}</Text>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {permission.description}
                      </Text>
                    </Stack>
                  </Table.Td>
                  {roles.map((role) => {
                    const hasPermission = rolePermissions[role as keyof typeof rolePermissions][permission.key as keyof typeof rolePermissions.OWNER]
                    return (
                      <Table.Td key={role} ta="center">
                        {hasPermission ? (
                          <Box component={FiCheck} c="green" size={18} />
                        ) : (
                          <Box component={FiX} c="red" size={18} />
                        )}
                      </Table.Td>
                    )
                  })}
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Box>

      {/* Role Hierarchy */}
      <Box>
        <Title order={3} mb="md" c="gray.7">
          Role Hierarchy & Management Rules
        </Title>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Group gap="xs">
                <Box component={FiShield} c="red.6" />
                <Title order={4} c="red.6">
                  OWNER
                </Title>
              </Group>
            </Card.Section>
            <Stack gap="xs" mt="md">
              <Text size="sm">• <Text span fw="bold" c="red.6">Full system access and control</Text></Text>
              <Text size="sm">• Can manage all users except other OWNERS</Text>
              <Text size="sm">• Complete access to financial data</Text>
              <Text size="sm">• <Text span fw="bold" c="orange.6">Protected account</Text> - cannot be deleted</Text>
              <Text size="sm">• Cannot create new OWNER accounts via UI</Text>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Group gap="xs">
                <Box component={FiUsers} c="orange.6" />
                <Title order={4} c="orange.6">
                  SUBDEALER
                </Title>
              </Group>
            </Card.Section>
            <Stack gap="xs" mt="md">
              <Text size="sm">• Can create Customer/Employee accounts</Text>
              <Text size="sm">• Manages users under their hierarchy</Text>
              <Text size="sm">• Limited financial access</Text>
              <Text size="sm">• Cannot assign Owner/SubDealer roles</Text>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Group gap="xs">
                <Box component={FiEye} c="blue.6" />
                <Title order={4} c="blue.6">
                  EMPLOYEE
                </Title>
              </Group>
            </Card.Section>
            <Stack gap="xs" mt="md">
              <Text size="sm">• View-only access to Customers</Text>
              <Text size="sm">• Cannot create or modify users</Text>
              <Text size="sm">• Limited to basic information</Text>
              <Text size="sm">• No administrative functions</Text>
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Group gap="xs">
                <Box component={FiUsers} c="green.6" />
                <Title order={4} c="green.6">
                  CUSTOMER
                </Title>
              </Group>
            </Card.Section>
            <Stack gap="xs" mt="md">
              <Text size="sm">• No user management access</Text>
              <Text size="sm">• Self-service account management</Text>
              <Text size="sm">• Cannot view other users</Text>
              <Text size="sm">• Restricted to personal dashboard</Text>
            </Stack>
          </Card>
        </SimpleGrid>
      </Box>
    </Stack>
  )
}