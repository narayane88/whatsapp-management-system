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

interface UserFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filterRole: string
  onRoleChange: (value: string) => void
  onCreateUser: () => void
  onManageDealerCodes: () => void
}

export default function UserFilters({
  searchTerm,
  onSearchChange,
  filterRole,
  onRoleChange,
  onCreateUser,
  onManageDealerCodes
}: UserFiltersProps) {
  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'OWNER', label: 'Owner' },
    { value: 'SUBDEALER', label: 'SubDealer' },
    { value: 'EMPLOYEE', label: 'Employee' },
    { value: 'CUSTOMER', label: 'Customer' },
  ]

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" wrap="wrap" gap="md">
        <Group gap="md" style={{ flex: 1 }}>
          <TextInput
            placeholder="Search users by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            leftSection={<Box component={FiSearch} />}
            style={{ minWidth: '300px' }}
          />
          <Select
            placeholder="Filter by role"
            data={roleOptions}
            value={filterRole}
            onChange={(value) => onRoleChange(value || '')}
            leftSection={<Box component={FiFilter} />}
            style={{ minWidth: '150px' }}
            clearable
          />
        </Group>
        <Group>
          <Button
            variant="outline"
            leftSection={<Box component={FiFilter} />}
            onClick={onManageDealerCodes}
          >
            Dealer Codes
          </Button>
          <Button
            color="green"
            leftSection={<Box component={FiPlus} />}
            onClick={onCreateUser}
          >
            Create User
          </Button>
        </Group>
      </Group>
    </Card>
  )
}