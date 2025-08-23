'use client'

import {
  Box,
  Title,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  Badge,
  Card,
  Table,
  SimpleGrid,
  ActionIcon,
  Modal,
  Select,
  ThemeIcon,
  Container,
} from '@mantine/core'
import { FiPlus, FiEye, FiCheck, FiX, FiClock, FiUsers, FiTrendingUp } from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import { useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernAlert,
  ModernContainer
} from '@/components/ui/modern-components'
import {
  ResponsiveGrid,
  ResponsiveCardGrid,
  ResponsiveStack
} from '@/components/ui/responsive-layout'

export default function PayoutsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const payouts = [
    {
      id: 'PAY-2024-001',
      subDealerId: 'sd_123',
      subDealerName: 'Alex Johnson',
      subDealerEmail: 'alex@dealer.com',
      amount: 1250.00,
      commission: 15.5,
      period: '2024-07',
      status: 'Pending',
      requestDate: '2024-08-01',
      processedDate: null,
      paymentMethod: 'Bank Transfer',
      accountDetails: 'Account: ****1234',
      transactions: 45,
      totalSales: 8064.52
    },
    {
      id: 'PAY-2024-002',
      subDealerId: 'sd_456',
      subDealerName: 'Maria Rodriguez',
      subDealerEmail: 'maria@dealer.com',
      amount: 890.75,
      commission: 12.0,
      period: '2024-07',
      status: 'Completed',
      requestDate: '2024-07-31',
      processedDate: '2024-08-02',
      paymentMethod: 'PayPal',
      accountDetails: 'maria.rodriguez@paypal.com',
      transactions: 32,
      totalSales: 7423.00
    },
    {
      id: 'PAY-2024-003',
      subDealerId: 'sd_789',
      subDealerName: 'David Chen',
      subDealerEmail: 'david@dealer.com',
      amount: 2100.50,
      commission: 18.0,
      period: '2024-07',
      status: 'Processing',
      requestDate: '2024-08-01',
      processedDate: null,
      paymentMethod: 'Crypto',
      accountDetails: 'Wallet: 1A2B...XY9Z',
      transactions: 78,
      totalSales: 11669.44
    },
    {
      id: 'PAY-2024-004',
      subDealerId: 'sd_321',
      subDealerName: 'Sarah Thompson',
      subDealerEmail: 'sarah@dealer.com',
      amount: 450.25,
      commission: 10.0,
      period: '2024-06',
      status: 'Rejected',
      requestDate: '2024-07-15',
      processedDate: '2024-07-16',
      paymentMethod: 'Bank Transfer',
      accountDetails: 'Account: ****5678',
      transactions: 18,
      totalSales: 4502.50
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'green'
      case 'Processing': return 'blue'
      case 'Pending': return 'yellow'
      case 'Rejected': return 'red'
      default: return 'gray'
    }
  }

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = payout.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.subDealerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.subDealerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !filterStatus || payout.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalPayouts = payouts.length
  const pendingPayouts = payouts.filter(p => p.status === 'Pending').length
  const totalAmount = payouts
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const totalTransactions = payouts.reduce((sum, p) => sum + p.transactions, 0)

  return (
    <PagePermissionGuard requiredPermissions={['payouts.page.access']}>
      <AdminLayout>
        <ModernContainer fluid>
          <ResponsiveStack gap="xl">
            {/* Enhanced Header */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(245, 158, 11, 0.03) 100%)',
                border: '2px solid rgba(251, 146, 60, 0.15)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(251, 146, 60, 0.08)',
                padding: '32px'
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Group gap="lg">
                  <ThemeIcon 
                    size="2xl" 
                    variant="gradient" 
                    gradient={{ from: 'orange.6', to: 'amber.5', deg: 135 }}
                    style={{
                      boxShadow: '0 8px 24px rgba(251, 146, 60, 0.3)'
                    }}
                  >
                    <FaRupeeSign size={28} />
                  </ThemeIcon>
                  <Box>
                    <Title 
                      order={2} 
                      mb={8}
                      c="orange.7"
                    >
                      Payout Management
                    </Title>
                    <Text c="dimmed" size="xs" fw={500} mb="lg">
                      Manage SubDealer commission payouts and transaction details
                    </Text>
                    
                    {/* Quick Stats Bar */}
                    <Group gap="xl">
                      <Group gap="xs">
                        <FaRupeeSign size={10} color="var(--mantine-color-orange-6)" />
                        <Text size="xs" c="dimmed">Total:</Text>
                        <Text size="xs" fw={700} c="orange.7">
                          {totalPayouts}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <FiClock size={10} color="var(--mantine-color-amber-6)" />
                        <Text size="xs" c="dimmed">Pending:</Text>
                        <Text size="xs" fw={700} c="amber.7">
                          {pendingPayouts}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <FiTrendingUp size={10} color="var(--mantine-color-green-6)" />
                        <Text size="xs" c="dimmed">Paid:</Text>
                        <Text size="xs" fw={700} c="green.7">
                          ₹{totalAmount.toFixed(0)}
                        </Text>
                      </Group>
                    </Group>
                  </Box>
                </Group>
              </Group>
            </ModernCard>

            {/* Stats Cards */}
            <ResponsiveCardGrid cols={{ base: 2, md: 4 }} spacing="lg">
              <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
                <Stack align="center" gap="xs">
                  <Group gap="xs">
                    <Box component={FaRupeeSign} size={16} c="orange.5" />
                    <Text size="xs" style={{ fontSize: '1.75rem' }} fw="bold" c="orange.5">
                      {totalPayouts}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">Total Payouts</Text>
                </Stack>
              </ModernCard>
              <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
                <Stack align="center" gap="xs">
                  <Group gap="xs">
                    <Box component={FiClock} size={16} c="amber.5" />
                    <Text size="xs" style={{ fontSize: '1.75rem' }} fw="bold" c="amber.5">
                      {pendingPayouts}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">Pending Review</Text>
                </Stack>
              </ModernCard>
              <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
                <Stack align="center" gap="xs">
                  <Group gap="xs">
                    <Box component={FiTrendingUp} size={16} c="green.5" />
                    <Text size="xs" style={{ fontSize: '1.75rem' }} fw="bold" c="green.5">
                      ₹{totalAmount.toFixed(0)}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">Paid Amount</Text>
                </Stack>
              </ModernCard>
              <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
                <Stack align="center" gap="xs">
                  <Group gap="xs">
                    <Box component={FiUsers} size={16} c="orange.6" />
                    <Text size="xs" style={{ fontSize: '1.75rem' }} fw="bold" c="orange.6">
                      {totalTransactions}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">Total Transactions</Text>
                </Stack>
              </ModernCard>
            </ResponsiveCardGrid>

            {/* Filters and Actions */}
            <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" wrap="wrap" gap="md">
                <Group gap="md" style={{ flex: 1 }}>
                  <TextInput
                    size="xs"
                    placeholder="Search payouts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '300px' }}
                  />
                  <Select
                    size="xs"
                    placeholder="All Status"
                    value={filterStatus}
                    onChange={(value) => setFilterStatus(value || '')}
                    data={[
                      { value: '', label: 'All Status' },
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Processing', label: 'Processing' },
                      { value: 'Completed', label: 'Completed' },
                      { value: 'Rejected', label: 'Rejected' }
                    ]}
                    style={{ minWidth: '120px' }}
                  />
                </Group>
                <ModernButton
                  color="orange"
                  onClick={() => setIsCreateModalOpen(true)}
                  leftSection={<Box component={FiPlus} size={10} />}
                  size="xs"
                >
                  Process Payout
                </ModernButton>
              </Group>
            </ModernCard>

            {/* Payouts Table */}
            <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
          <Table.ScrollContainer minWidth={1200}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Payout ID</Table.Th>
                  <Table.Th>SubDealer</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Commission</Table.Th>
                  <Table.Th>Period</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Payment</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredPayouts.map((payout) => (
                  <Table.Tr key={payout.id}>
                    <Table.Td>
                      <Text ff="monospace" size="xs" fw="500">
                        {payout.id}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text fw="500" size="xs">{payout.subDealerName}</Text>
                        <Text size="xs" c="dimmed">{payout.subDealerEmail}</Text>
                        <Text size="xs" c="blue.6">
                          {payout.transactions} transactions
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text fw="bold" size="xs" style={{ fontSize: '1.1rem' }} c="green.6">
                          ₹{payout.amount.toFixed(2)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Sales: ₹{payout.totalSales.toFixed(2)}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Text fw="500" c="violet.6" size="xs">
                        {payout.commission}%
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{payout.period}</Text>
                    </Table.Td>
                    <Table.Td>
                      <ModernBadge color={getStatusColor(payout.status)} variant="light" size="xs">
                        {payout.status}
                      </ModernBadge>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap="xs">
                        <Text size="xs">{payout.paymentMethod}</Text>
                        <Text size="xs" c="dimmed">{payout.accountDetails}</Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          aria-label="View details"
                        >
                          <Box component={FiEye} size={10} />
                        </ActionIcon>
                        {payout.status === 'Pending' && (
                          <>
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color="green"
                              aria-label="Approve payout"
                            >
                              <Box component={FiCheck} size={10} />
                            </ActionIcon>
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color="red"
                              aria-label="Reject payout"
                            >
                              <Box component={FiX} size={10} />
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
            </ModernCard>

        {/* Process Payout Modal */}
        <Modal
          opened={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Process New Payout"
          size="xs"
        >
          <Stack gap="md">
            <Select
              label="SubDealer"
              placeholder="Select SubDealer"
              data={[
                { value: 'sd_123', label: 'Alex Johnson' },
                { value: 'sd_456', label: 'Maria Rodriguez' },
                { value: 'sd_789', label: 'David Chen' },
                { value: 'sd_321', label: 'Sarah Thompson' }
              ]}
            />

            <SimpleGrid cols={2} spacing="md">
              <Select
                label="Period"
                placeholder="Select period"
                data={[
                  { value: '2024-08', label: 'August 2024' },
                  { value: '2024-07', label: 'July 2024' },
                  { value: '2024-06', label: 'June 2024' }
                ]}
              />
              <TextInput
                type="number"
                label="Commission Rate (%)"
                placeholder="15.0"
                step="0.1"
              />
            </SimpleGrid>

            <Select
              label="Payment Method"
              placeholder="Select payment method"
              data={[
                { value: 'bank', label: 'Bank Transfer' },
                { value: 'paypal', label: 'PayPal' },
                { value: 'crypto', label: 'Cryptocurrency' },
                { value: 'check', label: 'Check' }
              ]}
            />

            <TextInput
              label="Account Details"
              placeholder="Enter payment account details"
              description="Enter bank account, PayPal email, or crypto wallet"
            />

            <SimpleGrid cols={2} spacing="md">
              <TextInput
                type="number"
                label="Total Sales Amount"
                placeholder="0.00"
                step="0.01"
                readOnly
                style={{ backgroundColor: 'var(--mantine-color-gray-1)' }}
              />
              <TextInput
                type="number"
                label="Payout Amount"
                placeholder="0.00"
                step="0.01"
                readOnly
                style={{ backgroundColor: 'var(--mantine-color-gray-1)' }}
              />
            </SimpleGrid>

            <Group justify="flex-end" mt="lg">
              <ModernButton variant="outline" onClick={() => setIsCreateModalOpen(false)} size="xs">
                Cancel
              </ModernButton>
              <ModernButton color="orange" size="xs">
                Process Payout
              </ModernButton>
            </Group>
          </Stack>
        </Modal>
          </ResponsiveStack>
        </ModernContainer>
      </AdminLayout>
    </PagePermissionGuard>
  )
}