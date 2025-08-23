'use client'

import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  Switch,
  Alert,
  Box,
  Text,
} from '@mantine/core'
import { FiInfo } from 'react-icons/fi'
import { useState } from 'react'

interface CreatePermissionModalProps {
  opened: boolean
  onClose: () => void
  categories: string[]
  onSubmit: (permission: {
    id: string
    name: string
    description: string
    category: string
  }) => void
}

export default function CreatePermissionModal({
  opened,
  onClose,
  categories,
  onSubmit
}: CreatePermissionModalProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    category: ''
  })
  const [createNewCategory, setCreateNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')

  const categoryOptions = categories.map(cat => ({ value: cat, label: cat }))

  const handleSubmit = () => {
    const finalCategory = createNewCategory ? newCategory : formData.category
    
    onSubmit({
      ...formData,
      category: finalCategory,
      id: formData.id || `${finalCategory.toLowerCase().replace(/\s+/g, '_')}.${formData.name.toLowerCase().replace(/\s+/g, '_')}`
    })
    
    // Reset form
    setFormData({ id: '', name: '', description: '', category: '' })
    setCreateNewCategory(false)
    setNewCategory('')
    onClose()
  }

  const isValid = formData.name && formData.description && (formData.category || newCategory)

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create New Permission"
      size="lg"
    >
      <Stack gap="md">
        <TextInput
          label="Permission Name *"
          placeholder="e.g., View Reports"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />

        <TextInput
          label="Permission ID"
          placeholder="Auto-generated or custom (e.g., reports.view)"
          value={formData.id}
          onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
          description="Leave empty to auto-generate from name and category"
        />

        <Textarea
          label="Description *"
          placeholder="Describe what this permission allows..."
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          minRows={3}
          required
        />

        <Stack gap="sm">
          <Switch
            label="Create new category"
            checked={createNewCategory}
            onChange={(e) => setCreateNewCategory(e.currentTarget.checked)}
          />

          {createNewCategory ? (
            <TextInput
              label="New Category *"
              placeholder="e.g., Content Management"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              required
            />
          ) : (
            <Select
              label="Category *"
              placeholder="Select a category"
              data={categoryOptions}
              value={formData.category}
              onChange={(value) => setFormData(prev => ({ ...prev, category: value || '' }))}
              required
            />
          )}
        </Stack>

        <Alert variant="light" color="blue" title="Permission Guidelines" icon={<Box component={FiInfo} />}>
          <Stack gap="xs">
            <Text size="sm">
              • Use descriptive names that clearly indicate what the permission allows
            </Text>
            <Text size="sm">
              • Follow the pattern: category.action (e.g., users.create, reports.view)
            </Text>
            <Text size="sm">
              • Custom permissions can be modified or deleted later
            </Text>
          </Stack>
        </Alert>

        <Group justify="flex-end" mt="lg">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button color="green" onClick={handleSubmit} disabled={!isValid}>
            Create Permission
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}