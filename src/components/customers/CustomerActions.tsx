'use client'

import { Group, Button, Menu, ActionIcon } from '@mantine/core'
import { FiPlus, FiDownload, FiMoreVertical } from 'react-icons/fi'
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions'

interface CustomerActionsProps {
  onCreateCustomer: () => void
  onExport: (format: 'csv' | 'excel' | 'pdf') => void
  onImport: () => void
  onBulkActions: () => void
}

export default function CustomerActions({
  onCreateCustomer,
  onExport,
  onImport,
  onBulkActions
}: CustomerActionsProps) {
  const { hasPermission } = useDynamicPermissions()

  return (
    <Group>
      {/* Export Menu */}
      {hasPermission('customers.export') && (
        <Menu shadow="md" width={180}>
          <Menu.Target>
            <Button
              variant="light"
              leftSection={<FiDownload size={16} />}
            >
              Export
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item onClick={() => onExport('csv')}>
              Export as CSV
            </Menu.Item>
            <Menu.Item onClick={() => onExport('excel')}>
              Export as Excel
            </Menu.Item>
            <Menu.Item onClick={() => onExport('pdf')}>
              Export as PDF
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}

      {/* More Actions Menu */}
      <Menu shadow="md" width={160}>
        <Menu.Target>
          <ActionIcon variant="light" color="gray">
            <FiMoreVertical size={16} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          {hasPermission('customers.import') && (
            <Menu.Item onClick={onImport}>
              Import Customers
            </Menu.Item>
          )}
          <Menu.Item onClick={onBulkActions}>
            Bulk Actions
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      {/* Create Customer Button */}
      {hasPermission('customers.create') && (
        <Button
          color="green"
          leftSection={<FiPlus size={16} />}
          onClick={onCreateCustomer}
        >
          Add Customer
        </Button>
      )}
    </Group>
  )
}