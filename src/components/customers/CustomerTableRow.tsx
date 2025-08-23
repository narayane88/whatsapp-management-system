'use client'

import {
  Table,
  Text,
  Badge,
  Group,
  Avatar,
  Stack,
  ActionIcon,
  Menu,
  Tooltip,
  Button
} from '@mantine/core'
import { 
  FiEye, 
  FiEdit3, 
  FiTrash2, 
  FiMoreVertical,
  FiUserX,
  FiUserCheck,
  FiLogIn
} from 'react-icons/fi'
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions'

interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  mobile?: string
  isActive: boolean
  parentId?: number
  dealer_code?: string
  customer_status: string
  created_at: string
  account_balance: number | string
  message_balance: number | string
  last_login?: string
  registration_source?: string
  dealer_name?: string
  dealer_dealer_code?: string
  role: string
  package_id?: string
  package_expiry?: string
  package_name?: string
  package_price?: number
  package_status: string
  avatar?: string
  language?: string
  address?: string
  notes?: string
}

interface CustomerTableRowProps {
  customer: Customer
  index: number
  onView: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onToggleStatus: (customer: Customer) => void
  onImpersonate: (customer: Customer) => void
}

export default function CustomerTableRow({
  customer,
  index,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onImpersonate
}: CustomerTableRowProps) {
  const { hasPermission } = useDynamicPermissions()
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'green'
      case 'inactive':
        return 'red'
      case 'suspended':
        return 'orange'
      default:
        return 'gray'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CUSTOMER':
        return 'blue'
      case 'SUBDEALER':
        return 'purple'
      case 'EMPLOYEE':
        return 'orange'
      default:
        return 'gray'
    }
  }

  return (
    <Table.Tr
      style={{
        borderBottom: '1px solid rgba(226, 232, 240, 0.4)',
        background: index % 2 === 0 ? 'rgba(248, 250, 252, 0.3)' : 'white',
        transition: 'all 0.2s ease',
        height: '55px'
      }}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.04)'
        e.currentTarget.style.transform = 'scale(1.002)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)'
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.background = index % 2 === 0 ? 'rgba(248, 250, 252, 0.3)' : 'white'
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Customer Details */}
      <Table.Td style={{ padding: '10px 12px', verticalAlign: 'middle', borderRight: '1px solid rgba(226, 232, 240, 0.3)' }}>
        <Group gap="xs">
          <Avatar
            src={customer.avatar}
            size="xs"
            radius="xl"
            name={customer.name}
          />
          <Stack gap={1}>
            <Text fw={600} size="xs">
              {customer.name}
            </Text>
            <Text size="xs" c="dimmed">
              {customer.email}
            </Text>
            {customer.mobile && (
              <Text size="xs" c="dimmed">
                📱 {customer.mobile}
              </Text>
            )}
          </Stack>
        </Group>
      </Table.Td>

      {/* Status & Role */}
      <Table.Td style={{ padding: '10px 12px', verticalAlign: 'middle', textAlign: 'center', borderRight: '1px solid rgba(226, 232, 240, 0.3)' }}>
        <Stack gap={2}>
          <Badge
            color={getStatusColor(customer.customer_status)}
            variant="filled"
            size="xs"
            style={{
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              padding: '4px 8px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            {customer.customer_status}
          </Badge>
          <Badge
            color={getRoleColor(customer.role)}
            variant="light"
            size="xs"
          >
            {customer.role}
          </Badge>
        </Stack>
      </Table.Td>

      {/* Dealer Info */}
      <Table.Td style={{ padding: '10px 12px', verticalAlign: 'middle', borderRight: '1px solid rgba(226, 232, 240, 0.3)' }}>
        {customer.dealer_name ? (
          <Stack gap={1}>
            <Text size="xs" fw={600}>{customer.dealer_name}</Text>
            <Text size="xs" c="dimmed">
              Code: {customer.dealer_dealer_code}
            </Text>
          </Stack>
        ) : (
          <Text size="xs" c="dimmed">
            No Dealer
          </Text>
        )}
      </Table.Td>

      {/* Package Info */}
      <Table.Td style={{ padding: '10px 12px', verticalAlign: 'middle', textAlign: 'center', borderRight: '1px solid rgba(226, 232, 240, 0.3)' }}>
        {customer.package_name ? (
          <Stack gap={1}>
            <Text size="xs" fw={600}>{customer.package_name}</Text>
            <Text size="xs" c="dimmed">
              ₹{customer.package_price} | {customer.package_status}
            </Text>
            {customer.package_expiry && (
              <Text size="xs" c="dimmed">
                Expires: {formatDate(customer.package_expiry)}
              </Text>
            )}
          </Stack>
        ) : (
          <Text size="xs" c="dimmed">
            No Package
          </Text>
        )}
      </Table.Td>

      {/* Balances */}
      <Table.Td style={{ padding: '10px 12px', verticalAlign: 'middle', textAlign: 'center', borderRight: '1px solid rgba(226, 232, 240, 0.3)' }}>
        <Stack gap={1}>
          <Text size="xs" fw={600} c="green.7">
            BizCoins: ₹{(parseFloat(customer.account_balance) || 0).toFixed(2)}
          </Text>
          <Text size="xs" c="dimmed">
            Messages: {customer.message_balance || 0}
          </Text>
        </Stack>
      </Table.Td>

      {/* Last Login */}
      <Table.Td style={{ padding: '10px 12px', verticalAlign: 'middle', borderRight: '1px solid rgba(226, 232, 240, 0.3)' }}>
        <Text size="xs" c="dimmed" fw={500}>
          {customer.last_login ? formatDate(customer.last_login) : 'Never'}
        </Text>
      </Table.Td>

      {/* Actions */}
      <Table.Td style={{ padding: '10px 12px', verticalAlign: 'middle', textAlign: 'center' }}>
        <Group gap="xs" justify="center">
          {/* Quick Actions */}
          {hasPermission('customers.read') && (
            <ActionIcon
              size="xs"
              variant="gradient"
              gradient={{ from: 'blue.5', to: 'cyan.4', deg: 135 }}
              onClick={() => onView(customer)}
              aria-label="View customer"
              style={{
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s ease',
                borderRadius: '6px'
              }}
            >
              <FiEye size={12} />
            </ActionIcon>
          )}

          {hasPermission('customers.update') && (
            <ActionIcon
              size="xs"
              variant="gradient"
              gradient={{ from: 'orange.5', to: 'yellow.4', deg: 135 }}
              onClick={() => onEdit(customer)}
              aria-label="Edit customer"
              style={{
                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
                transition: 'all 0.2s ease',
                borderRadius: '6px'
              }}
            >
              <FiEdit3 size={12} />
            </ActionIcon>
          )}

          {/* More Actions Menu */}
          <Menu shadow="md" width={180}>
            <Menu.Target>
              <ActionIcon 
                size="xs"
                variant="gradient"
                gradient={{ from: 'gray.5', to: 'gray.4', deg: 135 }}
                style={{
                  boxShadow: '0 2px 8px rgba(107, 114, 128, 0.3)',
                  transition: 'all 0.2s ease',
                  borderRadius: '6px'
                }}
              >
                <FiMoreVertical size={12} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {/* Status Toggle */}
              {customer.isActive ? (
                hasPermission('customers.suspend') && (
                  <Menu.Item
                    color="orange"
                    onClick={() => onToggleStatus(customer)}
                    leftSection={<FiUserX size={10} />}
                  >
                    Suspend
                  </Menu.Item>
                )
              ) : (
                hasPermission('customers.activate') && (
                  <Menu.Item
                    color="green"
                    onClick={() => onToggleStatus(customer)}
                    leftSection={<FiUserCheck size={10} />}
                  >
                    Activate
                  </Menu.Item>
                )
              )}

              {/* Impersonate */}
              {hasPermission('customers.impersonate') && (
                <Menu.Item
                  color="blue"
                  onClick={() => onImpersonate(customer)}
                  leftSection={<FiLogIn size={10} />}
                >
                  Impersonate
                </Menu.Item>
              )}

              <Menu.Divider />

              {/* Delete */}
              {hasPermission('customers.delete') && (
                <Menu.Item
                  color="red"
                  onClick={() => onDelete(customer)}
                  leftSection={<FiTrash2 size={10} />}
                >
                  Delete
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}