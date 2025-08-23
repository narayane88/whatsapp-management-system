'use client'

import { Card, Table, Loader, Group, Text, Stack, Pagination } from '@mantine/core'
import CustomerTableRow from './CustomerTableRow'

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

interface CustomerTableProps {
  customers: Customer[]
  loading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onView: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onToggleStatus: (customer: Customer) => void
  onImpersonate: (customer: Customer) => void
}

export default function CustomerTable({
  customers,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onImpersonate
}: CustomerTableProps) {
  if (loading) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="center" p="xl">
          <Loader size="xs" />
          <Text size="xs">Loading customers...</Text>
        </Group>
      </Card>
    )
  }

  if (customers.length === 0) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" gap="md" p="xl">
          <Text size="xs" c="dimmed">
            No customers found
          </Text>
          <Text size="xs" c="dimmed">
            Try adjusting your filters or create a new customer
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="md" 
      withBorder
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        border: '1px solid rgba(226, 232, 240, 0.6)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
        padding: '24px'
      }}
    >
      <Table.ScrollContainer minWidth={1200}>
        <Table 
          striped 
          highlightOnHover
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            borderSpacing: '0 1px',
            borderCollapse: 'separate'
          }}
        >
          <Table.Thead
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
              borderBottom: '2px solid rgba(59, 130, 246, 0.1)',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}
          >
            <Table.Tr>
              <Table.Th style={{ 
                fontWeight: 700, 
                color: 'var(--mantine-color-blue-7)', 
                padding: '14px 12px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                minWidth: '180px',
                borderRight: '1px solid rgba(59, 130, 246, 0.1)'
              }}>Customer Details</Table.Th>
              <Table.Th style={{ 
                fontWeight: 700, 
                color: 'var(--mantine-color-blue-7)', 
                padding: '14px 12px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                minWidth: '130px',
                textAlign: 'center',
                borderRight: '1px solid rgba(59, 130, 246, 0.1)'
              }}>Status & Role</Table.Th>
              <Table.Th style={{ 
                fontWeight: 700, 
                color: 'var(--mantine-color-blue-7)', 
                padding: '14px 12px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                minWidth: '130px',
                borderRight: '1px solid rgba(59, 130, 246, 0.1)'
              }}>Dealer</Table.Th>
              <Table.Th style={{ 
                fontWeight: 700, 
                color: 'var(--mantine-color-blue-7)', 
                padding: '14px 12px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                minWidth: '130px',
                textAlign: 'center',
                borderRight: '1px solid rgba(59, 130, 246, 0.1)'
              }}>Package</Table.Th>
              <Table.Th style={{ 
                fontWeight: 700, 
                color: 'var(--mantine-color-blue-7)', 
                padding: '14px 12px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                minWidth: '110px',
                textAlign: 'center',
                borderRight: '1px solid rgba(59, 130, 246, 0.1)'
              }}>Balances</Table.Th>
              <Table.Th style={{ 
                fontWeight: 700, 
                color: 'var(--mantine-color-blue-7)', 
                padding: '14px 12px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                minWidth: '110px',
                borderRight: '1px solid rgba(59, 130, 246, 0.1)'
              }}>Last Login</Table.Th>
              <Table.Th style={{ 
                fontWeight: 700, 
                color: 'var(--mantine-color-blue-7)', 
                padding: '14px 12px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                minWidth: '110px',
                textAlign: 'center'
              }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {customers.map((customer, index) => (
              <CustomerTableRow
                key={`customer-${customer.id}-${index}`}
                customer={customer}
                index={index}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
                onImpersonate={onImpersonate}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {totalPages > 1 && (
        <Group justify="center" mt="lg">
          <Pagination
            value={currentPage}
            onChange={onPageChange}
            total={totalPages}
            size="xs"
          />
        </Group>
      )}
    </Card>
  )
}