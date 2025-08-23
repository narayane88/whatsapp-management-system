'use client'

import {
  Card,
  Group,
  TextInput,
  Select,
  Button,
  Box,
} from '@mantine/core'
import {
  FiSearch,
  FiFilter,
  FiPlus,
} from 'react-icons/fi'

interface PermissionsFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterCategory: string
  onCategoryChange: (value: string) => void
  categories: string[]
  onCreatePermission: () => void
}

export default function PermissionsFilters({
  searchTerm,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  categories,
  onCreatePermission
}: PermissionsFiltersProps) {
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ]

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" wrap="wrap" gap="md">
        <Group gap="md" style={{ flex: 1 }}>
          <TextInput
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            leftSection={<Box component={FiSearch} />}
            style={{ minWidth: '250px' }}
          />
          <Select
            placeholder="Filter by category"
            data={categoryOptions}
            value={filterCategory}
            onChange={(value) => onCategoryChange(value || '')}
            leftSection={<Box component={FiFilter} />}
            style={{ minWidth: '200px' }}
            clearable
          />
        </Group>
        <Button
          color="green"
          leftSection={<Box component={FiPlus} />}
          onClick={onCreatePermission}
        >
          Create Permission
        </Button>
      </Group>
    </Card>
  )
}