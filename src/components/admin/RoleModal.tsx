'use client'

import {
  Box,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  Card,
  Modal,
  TextInput,
  Textarea,
  Tabs,
  Checkbox,
  NumberInput,
  ScrollArea,
  SimpleGrid
} from '@mantine/core'
import {
  FiShield,
  FiKey,
  FiSave,
  FiTrash2
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { usePermissions } from '@/hooks/usePermissions'

interface Role {
  id: number
  name: string
  description: string
  level: number
  is_system: boolean
  user_count: number
  permissions?: Permission[]
}

interface Permission {
  id: number
  name: string
  description: string
  category: string
  resource: string
  action: string
  is_system: boolean
  role_count: number
  user_count: number
}

interface RoleModalProps {
  opened: boolean
  onClose: () => void
  role: Role | null
  permissions: Permission[]
  isEditMode: boolean
  onSave: (roleData: any) => Promise<void>
  onDelete?: (roleId: number) => Promise<void>
}

export default function RoleModal({ opened, onClose, role, permissions, isEditMode, onSave, onDelete }: RoleModalProps) {
  const { hasPermission } = usePermissions()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 5,
    selectedPermissions: [] as number[]
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        level: role.level,
        selectedPermissions: role.permissions?.map(p => p.id) || []
      })
    } else {
      setFormData({
        name: '',
        description: '',
        level: 5,
        selectedPermissions: []
      })
    }
  }, [role, opened])

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Name and description are required',
        color: 'red'
      })
      return
    }

    setLoading(true)
    try {
      const roleData = {
        ...(role?.id && { id: role.id }),
        name: formData.name.trim(),
        description: formData.description.trim(),
        level: formData.level,
        permissions: formData.selectedPermissions
      }
      
      await onSave(roleData)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!role?.id || !onDelete) return
    
    if (confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      setLoading(true)
      try {
        await onDelete(role.id)
      } finally {
        setLoading(false)
      }
    }
  }

  const togglePermission = (permissionId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionId)
        ? prev.selectedPermissions.filter(id => id !== permissionId)
        : [...prev.selectedPermissions, permissionId]
    }))
  }

  const togglePermissionCategory = (categoryPermissions: Permission[], allSelected: boolean) => {
    const categoryIds = categoryPermissions.map(p => p.id)
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        selectedPermissions: prev.selectedPermissions.filter(id => !categoryIds.includes(id))
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        selectedPermissions: [...new Set([...prev.selectedPermissions, ...categoryIds])]
      }))
    }
  }

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  const getRoleBadgeColor = (level: number) => {
    switch (level) {
      case 1: return 'red'
      case 2: return 'orange'
      case 3: return 'blue'
      case 4: return 'green'
      case 5: return 'gray'
      default: return 'gray'
    }
  }

  const canEdit = isEditMode && (!role?.is_system || hasPermission('roles.system.manage'))
  const canDelete = role && !role.is_system && role.user_count === 0 && hasPermission('roles.delete')

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Box component={FiShield} />
          <Text>
            {isEditMode 
              ? (role ? 'Edit Role' : 'Create Role')
              : `View Role: ${role?.name}`
            }
          </Text>
          {role?.is_system && (
            <Badge color="red" variant="outline" size="sm">System</Badge>
          )}
        </Group>
      }
      size="xl"
    >
      <Tabs defaultValue="basic">
        <Tabs.List>
          <Tabs.Tab value="basic" leftSection={<Box component={FiShield} />}>
            Basic Info
          </Tabs.Tab>
          <Tabs.Tab value="permissions" leftSection={<Box component={FiKey} />}>
            Permissions ({formData.selectedPermissions.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="basic" pt="md">
          <Stack gap="md">
            <TextInput
              label="Role Name"
              placeholder="Enter role name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              disabled={!canEdit}
            />

            <Textarea
              label="Description"
              placeholder="Describe the role's purpose and responsibilities"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              minRows={3}
              required
              disabled={!canEdit}
            />

            <NumberInput
              label="Hierarchy Level"
              description="Lower numbers have higher authority (1=Owner, 5=Customer)"
              value={formData.level}
              onChange={(value) => setFormData(prev => ({ ...prev, level: value || 5 }))}
              min={1}
              max={5}
              required
              disabled={!canEdit}
            />

            {role && (
              <Card withBorder>
                <SimpleGrid cols={2} spacing="md">
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">Users with this role</Text>
                    <Text fw={500}>{role.user_count} users</Text>
                  </Stack>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">Role Level</Text>
                    <Badge color={getRoleBadgeColor(formData.level)}>
                      Level {formData.level}
                    </Badge>
                  </Stack>
                </SimpleGrid>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="permissions" pt="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Select permissions for this role
              </Text>
              <Badge variant="outline">
                {formData.selectedPermissions.length} of {permissions.length} selected
              </Badge>
            </Group>

            <ScrollArea h={400}>
              <Stack gap="md">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                  const selectedInCategory = categoryPermissions.filter(p => 
                    formData.selectedPermissions.includes(p.id)
                  ).length
                  const allSelected = selectedInCategory === categoryPermissions.length
                  const someSelected = selectedInCategory > 0 && selectedInCategory < categoryPermissions.length

                  return (
                    <Card key={category} withBorder>
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Checkbox
                            label={category}
                            fw={500}
                            checked={allSelected}
                            indeterminate={someSelected}
                            onChange={() => togglePermissionCategory(categoryPermissions, allSelected)}
                            disabled={!canEdit}
                          />
                          <Badge variant="outline" size="sm">
                            {selectedInCategory}/{categoryPermissions.length}
                          </Badge>
                        </Group>

                        <Stack gap="xs" pl="md">
                          {categoryPermissions.map((permission) => (
                            <Checkbox
                              key={permission.id}
                              label={
                                <Box>
                                  <Text size="sm">{permission.name}</Text>
                                  <Text size="xs" c="dimmed">{permission.description}</Text>
                                </Box>
                              }
                              checked={formData.selectedPermissions.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              disabled={!canEdit}
                            />
                          ))}
                        </Stack>
                      </Stack>
                    </Card>
                  )
                })}
              </Stack>
            </ScrollArea>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Group justify="space-between" mt="xl">
        <Group gap="xs">
          {canDelete && (
            <Button
              color="red"
              variant="outline"
              onClick={handleDelete}
              loading={loading}
              leftSection={<Box component={FiTrash2} />}
            >
              Delete Role
            </Button>
          )}
        </Group>

        <Group gap="xs">
          <Button variant="outline" onClick={onClose}>
            {isEditMode ? 'Cancel' : 'Close'}
          </Button>
          {canEdit && (
            <Button
              onClick={handleSubmit}
              loading={loading}
              leftSection={<Box component={FiSave} />}
            >
              {role ? 'Update Role' : 'Create Role'}
            </Button>
          )}
        </Group>
      </Group>
    </Modal>
  )
}