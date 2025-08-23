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
  Textarea,
  Select,
  Loader,
  Alert,
} from '@mantine/core'
import { 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiEye, 
  FiShield,
  FiInfo,
  FiUsers,
  FiSettings,
  FiLock,
  FiCheck,
  FiX,
  FiKey
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useUserPermissions } from '@/hooks/useUserPermissions'
import PermissionsStats from './permissions/PermissionsStats'
import PermissionsFilters from './permissions/PermissionsFilters'
import PermissionsTable from './permissions/PermissionsTable'
import CreatePermissionModal from './permissions/CreatePermissionModal'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  isSystemPermission: boolean
  createdAt: string
}

interface RolePermissionAssignment {
  roleId: number
  roleName: string
  permissions: string[]
  userCount: number
}

export default function UserPermissionsTab() {
  const { data: session } = useSession()
  const { permissions: userPermissions } = useUserPermissions()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch permissions from API
  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/permissions')
      const data = await response.json()
      
      if (data.success) {
        setPermissions(data.data)
      } else {
        setError(data.error || 'Failed to fetch permissions')
      }
    } catch (error) {

      setError('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  // Default permissions as fallback
  const fallbackPermissions: Permission[] = [
    // User Management Permissions
    { id: 'users.create', name: 'Create Users', description: 'Ability to create new user accounts', category: 'User Management', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'users.edit', name: 'Edit Users', description: 'Modify existing user information and settings', category: 'User Management', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'users.delete', name: 'Delete Users', description: 'Permanently remove user accounts', category: 'User Management', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'users.view', name: 'View Users', description: 'Access user list and basic information', category: 'User Management', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'users.impersonate', name: 'Impersonate Users', description: 'Login as another user for support purposes', category: 'User Management', isSystemPermission: false, createdAt: '2024-01-15' },
    
    // Role & Permission Management
    { id: 'roles.create', name: 'Create Roles', description: 'Create new user roles and permissions', category: 'Role Management', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'roles.edit', name: 'Edit Roles', description: 'Modify existing roles and their permissions', category: 'Role Management', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'roles.delete', name: 'Delete Roles', description: 'Remove custom roles from the system', category: 'Role Management', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'permissions.assign', name: 'Assign Permissions', description: 'Assign permissions to roles and users', category: 'Role Management', isSystemPermission: true, createdAt: '2024-01-01' },
    
    // Package Management
    { id: 'packages.create', name: 'Create Packages', description: 'Create new service packages', category: 'Package Management', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'packages.edit', name: 'Edit Packages', description: 'Modify package details and pricing', category: 'Package Management', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'packages.delete', name: 'Delete Packages', description: 'Remove packages from the system', category: 'Package Management', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'packages.assign', name: 'Assign Packages', description: 'Assign packages to customers', category: 'Package Management', isSystemPermission: true, createdAt: '2024-01-01' },
    
    // Financial Management
    { id: 'transactions.view', name: 'View Transactions', description: 'Access transaction history and details', category: 'Financial', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'transactions.create', name: 'Create Transactions', description: 'Process payments and create transactions', category: 'Financial', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'payouts.manage', name: 'Manage Payouts', description: 'Process and manage user payouts', category: 'Financial', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'billing.view', name: 'View Billing', description: 'Access billing information and invoices', category: 'Financial', isSystemPermission: true, createdAt: '2024-01-01' },
    
    // WhatsApp & Messaging
    { id: 'messages.send', name: 'Send Messages', description: 'Send WhatsApp messages through the system', category: 'Messaging', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'messages.bulk', name: 'Bulk Messaging', description: 'Send bulk messages to multiple recipients', category: 'Messaging', isSystemPermission: false, createdAt: '2024-01-20' },
    { id: 'instances.manage', name: 'Manage Instances', description: 'Create and manage WhatsApp instances', category: 'Messaging', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'contacts.manage', name: 'Manage Contacts', description: 'Import and manage contact lists', category: 'Messaging', isSystemPermission: false, createdAt: '2024-01-25' },
    
    // System & Settings
    { id: 'settings.manage', name: 'Manage Settings', description: 'Access and modify system settings', category: 'System', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'api.access', name: 'API Access', description: 'Access system APIs and integrations', category: 'System', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'logs.view', name: 'View Logs', description: 'Access system logs and audit trails', category: 'System', isSystemPermission: false, createdAt: '2024-02-01' },
    { id: 'backup.manage', name: 'Manage Backups', description: 'Create and restore system backups', category: 'System', isSystemPermission: false, createdAt: '2024-02-05' },
    
    // Analytics & Reports
    { id: 'reports.view', name: 'View Reports', description: 'Access system reports and analytics', category: 'Analytics', isSystemPermission: true, createdAt: '2024-01-01' },
    { id: 'analytics.advanced', name: 'Advanced Analytics', description: 'Access detailed analytics and insights', category: 'Analytics', isSystemPermission: false, createdAt: '2024-01-30' },
    
    // Support & Help
    { id: 'support.manage', name: 'Manage Support', description: 'Handle customer support tickets', category: 'Support', isSystemPermission: false, createdAt: '2024-02-10' },
    { id: 'tickets.create', name: 'Create Tickets', description: 'Create support tickets', category: 'Support', isSystemPermission: false, createdAt: '2024-02-10' }
  ]

  // Use loaded permissions or fallback
  const currentPermissions = permissions.length > 0 ? permissions : fallbackPermissions
  const categories = [...new Set(currentPermissions.map(p => p.category))]

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'User Management': 'blue',
      'Role Management': 'violet',
      'Package Management': 'green',
      'Financial': 'orange',
      'Messaging': 'teal',
      'System': 'red',
      'Analytics': 'indigo',
      'Support': 'pink'
    }
    return colors[category] || 'gray'
  }

  // Filter permissions based on search and category
  const filteredPermissions = currentPermissions.filter(permission => {
    const matchesSearch = !searchTerm || 
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !filterCategory || permission.category === filterCategory
    
    return matchesSearch && matchesCategory
  })

  const handleViewPermission = (permission: Permission) => {
    setSelectedPermission(permission)
    // Show permission details modal
  }

  const handleEditPermission = (permission: Permission) => {
    if (permission.isSystemPermission) return
    setSelectedPermission(permission)
    setIsEditModalOpen(true)
  }

  const handleDeletePermission = (permission: Permission) => {
    if (permission.isSystemPermission) return
    // Show confirmation dialog

  }

  const handleCreatePermission = (newPermission: { id: string; name: string; description: string; category: string }) => {
    // Add to permissions list (in real app, make API call)
    const permission: Permission = {
      ...newPermission,
      isSystemPermission: false,
      createdAt: new Date().toISOString()
    }
    setPermissions(prev => [...prev, permission])
  }

  // Loading state
  if (loading) {
    return (
      <Stack align="center" py="xl">
        <Loader size="md" />
        <Text>Loading permissions...</Text>
      </Stack>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="light" color="red" title="Error">
        {error}
      </Alert>
    )
  }

  return (
    <Stack gap="lg">
      {/* Stats Section */}
      <PermissionsStats permissions={currentPermissions} categories={categories} />

      {/* Role Permission Matrix Summary */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section withBorder inheritPadding py="xs">
          <Group justify="space-between">
            <Box>
              <Title order={4}>Role Permission Matrix</Title>
              <Text size="sm" c="dimmed">
                Overview of permissions assigned to each role
              </Text>
            </Box>
            <Button
              variant="outline"
              leftSection={<Box component={FiSettings} />}
              onClick={() => setIsAssignModalOpen(true)}
            >
              Manage Assignments
            </Button>
          </Group>
        </Card.Section>

        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="md" mt="md">
          {['OWNER', 'SUBDEALER', 'EMPLOYEE', 'CUSTOMER'].map((role) => (
            <Card key={role} shadow="xs" padding="md" radius="md" withBorder>
              <Stack gap="xs" align="center">
                <Group gap="xs">
                  <Box component={FiShield} c={getCategoryColor('Role Management')} />
                  <Badge color={getCategoryColor('Role Management')} variant="light">
                    {role}
                  </Badge>
                </Group>
                <Text size="sm" fw={500}>
                  {role === 'OWNER' ? 'All Permissions' : `${Math.floor(Math.random() * 15 + 5)} permissions`}
                </Text>
                <Text size="xs" c="dimmed">
                  {Math.floor(Math.random() * 3 + 1)} users
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Card>

      {/* Filters Section */}
      <PermissionsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        categories={categories}
        onCreatePermission={() => setIsCreateModalOpen(true)}
      />

      {/* Permissions Table */}
      <PermissionsTable
        permissions={filteredPermissions}
        onView={handleViewPermission}
        onEdit={handleEditPermission}
        onDelete={handleDeletePermission}
        getCategoryColor={getCategoryColor}
      />

      {/* Create Permission Modal */}
      <CreatePermissionModal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        categories={categories}
        onSubmit={handleCreatePermission}
      />

      {/* Assignment Modal */}
      <Modal
        opened={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Manage Role Permissions"
        size="xl"
      >
        <Stack gap="md">
          <Alert variant="light" color="blue" title="Role Assignment" icon={<Box component={FiInfo} />}>
            Select permissions to assign to each role. Changes will affect all users with these roles.
          </Alert>
          
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button color="blue">
              Save Assignments
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}