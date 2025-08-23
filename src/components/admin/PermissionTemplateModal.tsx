'use client'

import {
  Stack,
  Group,
  Button,
  TextInput,
  Textarea,
  Text,
  Badge,
  Card,
  Checkbox,
  SimpleGrid,
  ScrollArea,
  Alert,
  Divider
} from '@mantine/core'
import { useState, useEffect } from 'react'
import { FiSave, FiX, FiKey, FiCheck } from 'react-icons/fi'

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

interface PermissionTemplate {
  id?: number
  name: string
  description: string
  permissions: number[]
  is_system?: boolean
}

interface PermissionTemplateModalProps {
  template: PermissionTemplate | null
  permissions: Permission[]
  onSave: (templateData: any) => Promise<void>
  onClose: () => void
}

export default function PermissionTemplateModal({
  template,
  permissions,
  onSave,
  onClose
}: PermissionTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedPermissions: new Set<number>()
  })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        selectedPermissions: new Set(template.permissions)
      })
    } else {
      setFormData({
        name: '',
        description: '',
        selectedPermissions: new Set()
      })
    }
  }, [template])

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a template name')
      return
    }

    if (formData.selectedPermissions.size === 0) {
      alert('Please select at least one permission')
      return
    }

    setLoading(true)
    try {
      await onSave({
        id: template?.id,
        name: formData.name,
        description: formData.description,
        permissions: Array.from(formData.selectedPermissions)
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (permissionId: number) => {
    const newSelected = new Set(formData.selectedPermissions)
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId)
    } else {
      newSelected.add(permissionId)
    }
    setFormData(prev => ({
      ...prev,
      selectedPermissions: newSelected
    }))
  }

  const selectAllInCategory = (category: string) => {
    const categoryPermissions = permissions
      .filter(p => p.category === category)
      .map(p => p.id)
    
    const newSelected = new Set(formData.selectedPermissions)
    categoryPermissions.forEach(id => newSelected.add(id))
    
    setFormData(prev => ({
      ...prev,
      selectedPermissions: newSelected
    }))
  }

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const permissionsByCategory = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <Stack gap="md">
      {/* Template Basic Info */}
      <Card withBorder>
        <Stack gap="md">
          <TextInput
            label="Template Name"
            placeholder="e.g., Sales Team, Customer Support"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Describe what this template is for and who should use it"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            minRows={2}
          />

          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {formData.selectedPermissions.size} permissions selected
            </Text>
            {template?.is_system && (
              <Badge color="blue" variant="outline">System Template</Badge>
            )}
          </Group>
        </Stack>
      </Card>

      {/* Permission Selection */}
      <Card withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500}>Select Permissions</Text>
            <TextInput
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="sm"
              style={{ width: 200 }}
            />
          </Group>

          <ScrollArea h={400}>
            <Stack gap="md">
              {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                <Card key={category} withBorder p="sm">
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Group gap="sm">
                        <Text fw={500} size="sm">{category}</Text>
                        <Badge size="xs" variant="outline">
                          {categoryPermissions.length} permissions
                        </Badge>
                      </Group>
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => selectAllInCategory(category)}
                      >
                        Select All
                      </Button>
                    </Group>

                    <SimpleGrid cols={1} spacing="xs">
                      {categoryPermissions.map((permission) => (
                        <Group key={permission.id} gap="sm" wrap="nowrap">
                          <Checkbox
                            checked={formData.selectedPermissions.has(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                          />
                          <Stack gap={2} style={{ flex: 1 }}>
                            <Group justify="space-between">
                              <Text size="sm" fw={500}>{permission.name}</Text>
                              <Group gap="xs">
                                {permission.is_system && (
                                  <Badge size="xs" color="red" variant="outline">System</Badge>
                                )}
                                <Badge size="xs" color="blue" variant="outline">
                                  {permission.role_count}R
                                </Badge>
                              </Group>
                            </Group>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {permission.description}
                            </Text>
                          </Stack>
                        </Group>
                      ))}
                    </SimpleGrid>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        </Stack>
      </Card>

      {formData.selectedPermissions.size > 0 && (
        <Alert color="blue" title="Selected Permissions Summary">
          <Text size="sm">
            This template will include <strong>{formData.selectedPermissions.size}</strong> permissions 
            across <strong>{Object.keys(permissionsByCategory).filter(cat => 
              permissionsByCategory[cat].some(p => formData.selectedPermissions.has(p.id))
            ).length}</strong> categories.
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
          disabled={formData.selectedPermissions.size === 0}
        >
          {template ? 'Update Template' : 'Create Template'}
        </Button>
      </Group>
    </Stack>
  )
}