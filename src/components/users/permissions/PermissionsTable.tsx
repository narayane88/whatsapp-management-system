'use client'

import {
  Card,
  Table,
  Text,
  Badge,
  Group,
  ActionIcon,
  Stack,
  Box,
} from '@mantine/core'
import {
  FiEye,
  FiEdit3,
  FiTrash2,
  FiShield,
  FiKey,
} from 'react-icons/fi'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  isSystemPermission: boolean
  createdAt: string
}

interface PermissionsTableProps {
  permissions: Permission[]
  onView: (permission: Permission) => void
  onEdit: (permission: Permission) => void
  onDelete: (permission: Permission) => void
  getCategoryColor: (category: string) => string
}

export default function PermissionsTable({
  permissions,
  onView,
  onEdit,
  onDelete,
  getCategoryColor
}: PermissionsTableProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Table.ScrollContainer minWidth={800}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Permission</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {permissions.map((permission) => (
              <Table.Tr key={permission.id}>
                <Table.Td>
                  <Stack gap={2}>
                    <Group gap="xs">
                      <Box component={FiKey} size={16} c="blue.6" />
                      <Text fw={500}>{permission.name}</Text>
                    </Group>
                    <Text size="xs" c="dimmed" ff="monospace">
                      {permission.id}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Badge 
                    color={getCategoryColor(permission.category)} 
                    variant="light"
                    size="sm"
                  >
                    {permission.category}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" style={{ maxWidth: '300px' }}>
                    {permission.description}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Box component={FiShield} size={14} c={permission.isSystemPermission ? 'orange.6' : 'gray.6'} />
                    <Badge 
                      color={permission.isSystemPermission ? 'orange' : 'gray'} 
                      variant="light"
                      size="sm"
                    >
                      {permission.isSystemPermission ? 'System' : 'Custom'}
                    </Badge>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {new Date(permission.createdAt).toLocaleDateString()}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => onView(permission)}
                      aria-label="View permission details"
                    >
                      <Box component={FiEye} />
                    </ActionIcon>
                    {!permission.isSystemPermission && (
                      <>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => onEdit(permission)}
                          aria-label="Edit permission"
                        >
                          <Box component={FiEdit3} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => onDelete(permission)}
                          aria-label="Delete permission"
                        >
                          <Box component={FiTrash2} />
                        </ActionIcon>
                      </>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  )
}