'use client'

import {
  Stack,
  Group,
  Button,
  TextInput,
  Textarea,
  Select,
  Text,
  Badge,
  Alert,
  SimpleGrid,
  Divider
} from '@mantine/core'
import { useState, useEffect } from 'react'
import { FiSave, FiX, FiInfo } from 'react-icons/fi'

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

interface PermissionFormModalProps {
  permission: Permission | null
  permissions: Permission[]
  onSave: (permissionData: any) => Promise<void>
  onClose: () => void
}

export default function PermissionFormModal({
  permission,
  permissions,
  onSave,
  onClose
}: PermissionFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    resource: '',
    action: ''
  })
  const [loading, setLoading] = useState(false)

  // Get unique categories, resources, and actions from existing permissions
  const categories = Array.from(new Set(permissions.map(p => p.category))).sort()
  const resources = Array.from(new Set(permissions.map(p => p.resource))).sort()
  const actions = Array.from(new Set(permissions.map(p => p.action))).sort()

  useEffect(() => {
    if (permission) {
      setFormData({
        name: permission.name,
        description: permission.description || '',
        category: permission.category,
        resource: permission.resource,
        action: permission.action
      })
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        resource: '',
        action: ''
      })
    }
  }, [permission])

  // Auto-generate permission name when resource and action are set
  useEffect(() => {
    if (formData.resource && formData.action && !permission) {
      const generatedName = `${formData.resource}.${formData.action}`
      setFormData(prev => ({ ...prev, name: generatedName }))
    }
  }, [formData.resource, formData.action, permission])

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      alert('Please enter a permission name')
      return
    }
    if (!formData.category.trim()) {
      alert('Please select or enter a category')
      return
    }
    if (!formData.resource.trim()) {
      alert('Please enter a resource')
      return
    }
    if (!formData.action.trim()) {
      alert('Please select or enter an action')
      return
    }

    // Check if permission name already exists (for new permissions)
    if (!permission) {
      const existingPermission = permissions.find(p => 
        p.name.toLowerCase() === formData.name.toLowerCase()
      )
      if (existingPermission) {
        alert(`Permission "${formData.name}" already exists. Please use a different name.`)
        return
      }
    }

    setLoading(true)
    try {
      await onSave({
        id: permission?.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        resource: formData.resource,
        action: formData.action
      })
    } finally {
      setLoading(false)
    }
  }

  const commonActions = [
    { value: 'create', label: 'create' },
    { value: 'read', label: 'read' },
    { value: 'update', label: 'update' },
    { value: 'delete', label: 'delete' },
    { value: 'manage', label: 'manage' },
    { value: 'view', label: 'view' },
    { value: 'edit', label: 'edit' },
    { value: 'assign', label: 'assign' },
    { value: 'export', label: 'export' },
    { value: 'import', label: 'import' }
  ]

  return (
    <Stack gap="md">
      <Alert icon={<FiInfo size={16} />} color="blue" title="Permission Information">
        <Text size="sm">
          {permission 
            ? `Editing ${permission.is_system ? 'system' : 'custom'} permission. System permissions have restrictions.`
            : 'Create a new custom permission. Use the format: resource.action (e.g., products.manage)'
          }
        </Text>
      </Alert>

      {/* Basic Information */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <TextInput
          label="Permission Name"
          placeholder="e.g., products.manage, reports.view"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          description="Unique identifier for this permission"
        />
        
        <Select
          label="Category"
          placeholder="Select or type category"
          value={formData.category}
          onChange={(value) => setFormData(prev => ({ ...prev, category: value || '' }))}
          data={categories.map(cat => ({ value: cat, label: cat }))}
          searchable
          creatable
          getCreateLabel={(query) => `+ Create category: ${query}`}
          onCreate={(query) => query}
          required
          description="Logical grouping for permissions"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Select
          label="Resource"
          placeholder="Select or type resource"
          value={formData.resource}
          onChange={(value) => setFormData(prev => ({ ...prev, resource: value || '' }))}
          data={resources.map(res => ({ value: res, label: res }))}
          searchable
          creatable
          getCreateLabel={(query) => `+ Create resource: ${query}`}
          onCreate={(query) => query}
          required
          description="What entity this permission controls"
        />
        
        <Select
          label="Action"
          placeholder="Select or type action"
          value={formData.action}
          onChange={(value) => setFormData(prev => ({ ...prev, action: value || '' }))}
          data={[
            ...commonActions,
            ...actions.filter(action => !commonActions.some(ca => ca.value === action))
              .map(action => ({ value: action, label: action }))
          ]}
          searchable
          creatable
          getCreateLabel={(query) => `+ Create action: ${query}`}
          onCreate={(query) => query}
          required
          description="What operation this permission allows"
        />
      </SimpleGrid>

      <Textarea
        label="Description"
        placeholder="Describe what this permission allows users to do"
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        minRows={3}
        description="Clear description helps users understand the permission"
      />

      {/* Permission Preview */}
      {formData.name && (
        <Alert color="green" title="Permission Preview">
          <Stack gap="xs">
            <Group>
              <Text size="sm" fw={500}>Name:</Text>
              <Badge variant="outline">{formData.name}</Badge>
            </Group>
            {formData.category && (
              <Group>
                <Text size="sm" fw={500}>Category:</Text>
                <Badge color="blue" variant="light">{formData.category}</Badge>
              </Group>
            )}
            <Group>
              <Text size="sm" fw={500}>Full Permission:</Text>
              <Text size="sm" c="dimmed">{formData.resource}.{formData.action} in {formData.category}</Text>
            </Group>
          </Stack>
        </Alert>
      )}

      {permission && (
        <Alert color="orange" title="Current Usage">
          <Text size="sm">
            This permission is currently assigned to <strong>{permission.role_count}</strong> role(s) 
            and <strong>{permission.user_count}</strong> user(s) directly.
          </Text>
        </Alert>
      )}

      <Divider />

      {/* Action Buttons */}
      <Group justify="flex-end">
        <Button
          variant="outline"
          leftSection={<FiX size={16} />}
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          leftSection={<FiSave size={16} />}
          onClick={handleSubmit}
          loading={loading}
          disabled={!formData.name || !formData.category || !formData.resource || !formData.action}
        >
          {permission ? 'Update Permission' : 'Create Permission'}
        </Button>
      </Group>
    </Stack>
  )
}