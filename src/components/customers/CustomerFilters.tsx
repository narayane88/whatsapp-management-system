'use client'

import { Group, TextInput, Select, Button, Card, Badge, ActionIcon } from '@mantine/core'
import { FiSearch, FiX } from 'react-icons/fi'

interface CustomerFiltersProps {
  searchTerm: string
  statusFilter: string
  roleFilter: string
  packageFilter: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string | null) => void
  onRoleChange: (value: string | null) => void
  onPackageChange: (value: string | null) => void
  onClearFilters: () => void
  totalResults?: number
}

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' }
]

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'SUBDEALER', label: 'Sub Dealer' },
  { value: 'EMPLOYEE', label: 'Employee' }
]

export default function CustomerFilters({
  searchTerm,
  statusFilter,
  roleFilter,
  packageFilter,
  onSearchChange,
  onStatusChange,
  onRoleChange,
  onPackageChange,
  onClearFilters,
  totalResults
}: CustomerFiltersProps) {
  const hasActiveFilters = searchTerm || statusFilter || roleFilter || packageFilter

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <TextInput
            placeholder="Search customers..."
            leftSection={<FiSearch size={16} />}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            w={250}
          />
          
          <Select
            placeholder="Status"
            data={statusOptions}
            value={statusFilter}
            onChange={onStatusChange}
            w={120}
            clearable
          />
          
          <Select
            placeholder="Role"
            data={roleOptions}
            value={roleFilter}
            onChange={onRoleChange}
            w={140}
            clearable
          />
          
          <Select
            placeholder="Package"
            data={[{ value: '', label: 'All Packages' }]}
            value={packageFilter}
            onChange={onPackageChange}
            w={140}
            clearable
          />
        </Group>

        <Group>
          {totalResults !== undefined && (
            <Badge variant="light" size="lg">
              {totalResults} customers
            </Badge>
          )}
          
          {hasActiveFilters && (
            <Button
              variant="light"
              color="gray"
              leftSection={<FiX size={16} />}
              onClick={onClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </Group>
      </Group>
    </Card>
  )
}