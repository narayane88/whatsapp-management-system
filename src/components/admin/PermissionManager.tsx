'use client'

import {
  Box,
  Button,
  Card,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
  Select,
  Modal,
  ActionIcon,
  Badge,
  Alert,
  Title,
  SimpleGrid,
  Divider,
  Center,
  Loader,
  Textarea,
  Checkbox,
  ScrollArea,
  Tabs
} from '@mantine/core'
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiSave,
  FiKey,
  FiShield,
  FiCheck,
  FiX,
  FiLock,
  FiUnlock,
  FiSettings
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { usePermissions } from '@/hooks/usePermissions'

interface Permission {
  id: number
  name: string
  description: string
  category: string
  resource: string
  action: string
  is_system: boolean
  role_count?: number
  user_count?: number
}

interface Role {
  id: number
  name: string
  description: string
  level: number
}

export default function PermissionManager() {
  const { hasPermission, isOwner } = usePermissions()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Permission | null>(null)
  const [viewPermission, setViewPermission] = useState<Permission | null>(null)
  const [assignModal, setAssignModal] = useState<Permission | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    resource: '',
    action: ''
  })

  // Filters
  const [filters, setFilters] = useState({
    category: '',
    resource: '',
    system: '',
    search: ''
  })

  // Permission assignment state
  const [roleAssignments, setRoleAssignments] = useState<Record<number, boolean>>({})

  useEffect(() => {
    loadPermissions()
    loadRoles()
  }, [])

  const loadPermissions = async () => {
    if (!hasPermission('permissions.view')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/permissions')
      const data = await response.json()
      
      if (response.ok) {
        setPermissions(data.permissions || [])
        setCategories(data.categories || [])
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to load permissions',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      const data = await response.json()
      if (response.ok) {
        setRoles(data.roles || [])
      }
    } catch (error) {

    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.resource || !formData.action) {
      notifications.show({
        title: 'Validation Error',
        message: 'All fields are required',
        color: 'red'
      })
      return
    }

    try {
      const url = '/api/permissions'
      const method = editingPermission ? 'PUT' : 'POST'
      
      const payload = editingPermission 
        ? { ...formData, id: editingPermission.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: `Permission ${editingPermission ? 'updated' : 'created'} successfully`,
          color: 'green'
        })
        handleCloseModal()
        loadPermissions()
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Operation failed',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  const handleDelete = async (permission: Permission) => {
    try {
      const response = await fetch(`/api/permissions?id=${permission.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Permission deleted successfully',
          color: 'green'
        })
        loadPermissions()
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to delete permission',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
    setDeleteConfirm(null)
  }

  const handleEdit = (permission: Permission) => {
    if (permission.is_system && !hasPermission('permissions.system.manage')) {
      notifications.show({
        title: 'Access Denied',
        message: 'Cannot edit system permissions',
        color: 'red'
      })
      return
    }

    setEditingPermission(permission)
    setFormData({
      name: permission.name,
      description: permission.description || '',
      category: permission.category,
      resource: permission.resource,
      action: permission.action
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPermission(null)
    setFormData({
      name: '',
      description: '',
      category: '',
      resource: '',
      action: ''
    })
  }

  const openAssignModal = async (permission: Permission) => {
    if (!hasPermission('permissions.assign')) {
      notifications.show({
        title: 'Access Denied',
        message: 'Cannot assign permissions',
        color: 'red'
      })
      return
    }

    setAssignModal(permission)
    
    // Load current role assignments for this permission
    try {
      const response = await fetch(`/api/roles?include_permissions=true`)
      const data = await response.json()
      
      if (response.ok) {
        const assignments: Record<number, boolean> = {}
        data.roles.forEach((role: any) => {
          assignments[role.id] = role.permissions?.some((p: any) => p.id === permission.id) || false
        })
        setRoleAssignments(assignments)
      }
    } catch (error) {

    }
  }

  const handleRoleAssignment = async (roleId: number, granted: boolean) => {
    if (!assignModal) return

    try {
      const response = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: roleId,
          permissions: granted 
            ? [...(roles.find(r => r.id === roleId) as any)?.permissions?.map((p: any) => p.id) || [], assignModal.id]
            : (roles.find(r => r.id === roleId) as any)?.permissions?.filter((p: any) => p.id !== assignModal.id).map((p: any) => p.id) || []
        })
      })

      if (response.ok) {
        setRoleAssignments(prev => ({ ...prev, [roleId]: granted }))
        notifications.show({
          title: 'Success',
          message: `Permission ${granted ? 'granted to' : 'removed from'} role`,
          color: 'green'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update role assignment',
        color: 'red'
      })
    }
  }

  const filteredPermissions = permissions.filter(permission => {
    if (filters.category && permission.category !== filters.category) return false
    if (filters.resource && permission.resource !== filters.resource) return false
    if (filters.system === 'system' && !permission.is_system) return false
    if (filters.system === 'custom' && permission.is_system) return false
    if (filters.search) {
      const search = filters.search.toLowerCase()
      return permission.name.toLowerCase().includes(search) || 
             permission.description?.toLowerCase().includes(search) ||
             permission.category.toLowerCase().includes(search)
    }
    return true
  })

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  const uniqueResources = Array.from(new Set(permissions.map(p => p.resource))).sort()

  if (loading) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Loading permissions...</Text>
        </Stack>
      </Center>
    )
  }

  if (!hasPermission('permissions.view')) {
    return (
      <Center h={400}>
        <Alert color="red" title="Access Denied">
          <Text>You don't have permission to view the permission management system.</Text>
        </Alert>
      </Center>
    )
  }

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <Box>
          <Title order={3}>Permission Management System</Title>
          <Text c="dimmed">Manage system permissions and role assignments</Text>
        </Box>
        {hasPermission('permissions.create') && (
          <Button
            leftSection={<Box component={FiPlus} />}
            onClick={() => setIsModalOpen(true)}
          >
            Create Permission
          </Button>
        )}
      </Group>

      {/* Statistics */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        <Card withBorder>
          <Stack gap="xs" align="center">
            <Box component={FiKey} size={32} color="blue" />
            <Text size="xl" fw={700} c="blue.6">
              {permissions.length}
            </Text>
            <Text size="sm" c="dimmed" ta="center">Total Permissions</Text>
          </Stack>
        </Card>

        <Card withBorder>
          <Stack gap="xs" align="center">
            <Box component={FiLock} size={32} color="red" />
            <Text size="xl" fw={700} c="red.6">
              {permissions.filter(p => p.is_system).length}
            </Text>
            <Text size="sm" c="dimmed" ta="center">System Permissions</Text>
          </Stack>
        </Card>

        <Card withBorder>
          <Stack gap="xs" align="center">
            <Box component={FiUnlock} size={32} color="green" />
            <Text size="xl" fw={700} c="green.6">
              {permissions.filter(p => !p.is_system).length}
            </Text>
            <Text size="sm" c="dimmed" ta="center">Custom Permissions</Text>
          </Stack>
        </Card>

        <Card withBorder>
          <Stack gap="xs" align="center">
            <Box component={FiSettings} size={32} color="orange" />
            <Text size="xl" fw={700} c="orange.6">
              {Object.keys(groupedPermissions).length}
            </Text>
            <Text size="sm" c="dimmed" ta="center">Categories</Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Filters */}
      <Card withBorder>
        <Group gap="md">
          <Select
            placeholder="Filter by category"
            value={filters.category}
            onChange={(value) => setFilters(prev => ({ ...prev, category: value || '' }))}
            data={categories.map(cat => ({ value: cat, label: cat }))}
            clearable
            style={{ minWidth: 180 }}
          />
          
          <Select
            placeholder="Filter by resource"
            value={filters.resource}
            onChange={(value) => setFilters(prev => ({ ...prev, resource: value || '' }))}
            data={uniqueResources.map(res => ({ value: res, label: res }))}
            clearable
            style={{ minWidth: 150 }}
          />

          <Select
            placeholder="System/Custom"
            value={filters.system}
            onChange={(value) => setFilters(prev => ({ ...prev, system: value || '' }))}
            data={[
              { value: 'system', label: 'System Only' },
              { value: 'custom', label: 'Custom Only' }
            ]}
            clearable
            style={{ minWidth: 150 }}
          />
          
          <TextInput
            placeholder="Search permissions..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            style={{ minWidth: 200 }}
          />
          
          <Button
            variant="outline"
            onClick={() => setFilters({ category: '', resource: '', system: '', search: '' })}
          >
            Clear
          </Button>
        </Group>
      </Card>

      {/* Permissions by Category */}
      <Stack gap="md">
        {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
          <Card key={category} withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="sm">
                  <Text fw={500} size="lg">{category}</Text>
                  <Badge variant="outline">{categoryPermissions.length} permissions</Badge>
                </Group>
              </Group>

              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Permission</Table.Th>
                    <Table.Th>Resource</Table.Th>
                    <Table.Th>Action</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Usage</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {categoryPermissions.map((permission) => (
                    <Table.Tr key={permission.id}>
                      <Table.Td>
                        <Stack gap={0}>
                          <Text fw={500} size="sm">{permission.name}</Text>
                          <Text size="xs" c="dimmed" lineClamp={2}>
                            {permission.description}
                          </Text>
                        </Stack>
                      </Table.Td>
                      
                      <Table.Td>
                        <Badge variant="outline" size="sm">
                          {permission.resource}
                        </Badge>
                      </Table.Td>
                      
                      <Table.Td>
                        <Badge color="blue" variant="light" size="sm">
                          {permission.action}
                        </Badge>
                      </Table.Td>
                      
                      <Table.Td>
                        {permission.is_system ? (
                          <Badge color="red" variant="outline" size="sm">
                            <Group gap={4}>
                              <Box component={FiLock} size={10} />
                              System
                            </Group>
                          </Badge>
                        ) : (
                          <Badge color="green" variant="outline" size="sm">
                            <Group gap={4}>
                              <Box component={FiUnlock} size={10} />
                              Custom
                            </Group>
                          </Badge>
                        )}
                      </Table.Td>

                      <Table.Td>
                        <Group gap="xs">
                          <Badge size="xs" color="blue">
                            {permission.role_count || 0} roles
                          </Badge>
                        </Group>
                      </Table.Td>
                      
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => setViewPermission(permission)}
                            title="View Details"
                          >
                            <Box component={FiEye} />
                          </ActionIcon>
                          
                          {hasPermission('permissions.assign') && (
                            <ActionIcon
                              variant="subtle"
                              color="green"
                              onClick={() => openAssignModal(permission)}
                              title="Assign to Roles"
                            >
                              <Box component={FiShield} />
                            </ActionIcon>
                          )}
                          
                          {((permission.is_system && hasPermission('permissions.system.manage')) || 
                            (!permission.is_system && hasPermission('permissions.edit'))) && (
                            <ActionIcon
                              variant="subtle"
                              color="yellow"
                              onClick={() => handleEdit(permission)}
                              title="Edit Permission"
                            >
                              <Box component={FiEdit3} />
                            </ActionIcon>
                          )}
                          
                          {!permission.is_system && hasPermission('permissions.delete') && (
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => setDeleteConfirm(permission)}
                              title="Delete Permission"
                            >
                              <Box component={FiTrash2} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        ))}
      </Stack>

      {Object.keys(groupedPermissions).length === 0 && (
        <Center py="xl">
          <Stack align="center" gap="md">
            <Box component={FiKey} size={48} color="gray" />
            <Text c="dimmed">No permissions found</Text>
          </Stack>
        </Center>
      )}

      {/* Create/Edit Permission Modal */}
      <Modal
        opened={isModalOpen}
        onClose={handleCloseModal}
        title={
          <Group gap="sm">
            <Box component={editingPermission ? FiEdit3 : FiPlus} />
            <Text>{editingPermission ? 'Edit Permission' : 'Create Permission'}</Text>
          </Group>
        }
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Permission Name"
            placeholder="e.g., users.create"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <Textarea
            label="Description"
            placeholder="Describe what this permission allows"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            minRows={2}
            required
          />

          <Select
            label="Category"
            placeholder="Select or type category"
            value={formData.category}
            onChange={(value) => setFormData(prev => ({ ...prev, category: value || '' }))}
            data={categories.map(cat => ({ value: cat, label: cat }))}
            searchable
            creatable
            getCreateLabel={(query) => `+ Create ${query}`}
            onCreate={(query) => {
              setCategories(prev => [...prev, query])
              return query
            }}
            required
          />

          <Select
            label="Resource"
            placeholder="Select or type resource"
            value={formData.resource}
            onChange={(value) => setFormData(prev => ({ ...prev, resource: value || '' }))}
            data={uniqueResources.map(res => ({ value: res, label: res }))}
            searchable
            creatable
            getCreateLabel={(query) => `+ Create ${query}`}
            onCreate={(query) => query}
            required
          />

          <Select
            label="Action"
            placeholder="Select or type action"
            value={formData.action}
            onChange={(value) => setFormData(prev => ({ ...prev, action: value || '' }))}
            data={[
              { value: 'create', label: 'create' },
              { value: 'read', label: 'read' },
              { value: 'update', label: 'update' },
              { value: 'delete', label: 'delete' },
              { value: 'manage', label: 'manage' },
              { value: 'view', label: 'view' },
              { value: 'edit', label: 'edit' },
              { value: 'assign', label: 'assign' }
            ]}
            searchable
            creatable
            getCreateLabel={(query) => `+ Create ${query}`}
            onCreate={(query) => query}
            required
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              leftSection={<Box component={FiSave} />}
              onClick={handleSubmit}
            >
              {editingPermission ? 'Update' : 'Create'} Permission
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* View Permission Modal */}
      <Modal
        opened={!!viewPermission}
        onClose={() => setViewPermission(null)}
        title={
          <Group gap="sm">
            <Box component={FiKey} />
            <Text>Permission Details</Text>
          </Group>
        }
        size="md"
      >
        {viewPermission && (
          <Stack gap="md">
            <Card withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Name</Text>
                  <Text fw={500}>{viewPermission.name}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Description</Text>
                  <Text>{viewPermission.description || 'No description'}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Category</Text>
                  <Badge variant="outline">{viewPermission.category}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Resource</Text>
                  <Badge color="blue" variant="light">{viewPermission.resource}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Action</Text>
                  <Badge color="green" variant="light">{viewPermission.action}</Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Type</Text>
                  {viewPermission.is_system ? (
                    <Badge color="red" variant="outline">
                      <Group gap={4}>
                        <Box component={FiLock} size={10} />
                        System
                      </Group>
                    </Badge>
                  ) : (
                    <Badge color="green" variant="outline">
                      <Group gap={4}>
                        <Box component={FiUnlock} size={10} />
                        Custom
                      </Group>
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Card>
          </Stack>
        )}
      </Modal>

      {/* Role Assignment Modal */}
      <Modal
        opened={!!assignModal}
        onClose={() => setAssignModal(null)}
        title={
          <Group gap="sm">
            <Box component={FiShield} />
            <Text>Assign to Roles: {assignModal?.name}</Text>
          </Group>
        }
        size="md"
      >
        {assignModal && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Select which roles should have this permission:
            </Text>

            <Stack gap="sm">
              {roles.map((role) => (
                <Card key={role.id} withBorder={false} p="sm" bg="gray.0">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Text fw={500} size="sm">{role.name}</Text>
                      <Badge size="xs" color="blue">Level {role.level}</Badge>
                    </Group>
                    
                    <Checkbox
                      checked={roleAssignments[role.id] || false}
                      onChange={(e) => handleRoleAssignment(role.id, e.currentTarget.checked)}
                    />
                  </Group>
                  <Text size="xs" c="dimmed" pl="sm">
                    {role.description}
                  </Text>
                </Card>
              ))}
            </Stack>
          </Stack>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <Stack gap="md">
          <Alert color="red" title="Warning">
            <Text size="sm">
              Are you sure you want to delete permission "{deleteConfirm?.name}"?
              This will remove it from all roles and cannot be undone.
            </Text>
          </Alert>

          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete Permission
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}