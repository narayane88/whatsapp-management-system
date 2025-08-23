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
  Avatar,
} from '@mantine/core'
import { 
  FiKey, 
  FiCopy, 
  FiEye, 
  FiUsers,
  FiTrendingUp,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiDownload
} from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import { useState } from 'react'
import { generateDealerCode, formatDealerCode, DealerCodeInfo } from '@/utils/dealerCode'

export default function DealerCodeManager() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedDealer, setSelectedDealer] = useState<DealerCodeInfo | null>(null)

  // Mock dealer codes data with Indian localization
  const dealerCodes: DealerCodeInfo[] = [
    {
      code: 'WA-RAKU-0001',
      dealerId: 1,
      dealerName: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      isActive: true,
      createdAt: '2024-01-15',
      customerCount: 25,
      totalRevenue: 425000
    },
    {
      code: 'WA-PRSH-0002',
      dealerId: 2,
      dealerName: 'Priya Sharma',
      email: 'priya@example.com',
      isActive: true,
      createdAt: '2024-01-20',
      customerCount: 18,
      totalRevenue: 315000
    },
    {
      code: 'WA-AMIT-0003',
      dealerId: 3,
      dealerName: 'Amit Patel',
      email: 'amit@example.com',
      isActive: false,
      createdAt: '2024-02-01',
      customerCount: 5,
      totalRevenue: 85000
    }
  ]

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    // In a real app, show a toast notification

  }

  const regenerateCode = (dealerId: number) => {
    const dealer = dealerCodes.find(d => d.dealerId === dealerId)
    if (dealer) {
      const newCode = generateDealerCode(dealer.dealerName, dealerId)

      // In a real app, this would update the database
    }
  }

  const handleViewDetails = (dealer: DealerCodeInfo) => {
    setSelectedDealer(dealer)
    setIsDetailsModalOpen(true)
  }

  const filteredDealers = dealerCodes.filter(dealer =>
    dealer.dealerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dealer.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCustomers = dealerCodes.reduce((sum, d) => sum + d.customerCount, 0)
  const totalRevenue = dealerCodes.reduce((sum, d) => sum + d.totalRevenue, 0)
  const activeDealers = dealerCodes.filter(d => d.isActive).length

  return (
    <Stack gap="lg">
      {/* Header */}
      <Box>
        <Title order={2} c="dark.8" mb="xs">
          Dealer Code Management
        </Title>
        <Text c="dimmed">
          Manage dealer codes, track performance, and monitor referrals
        </Text>
      </Box>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FiKey} size={20} c="blue.5" />
              <Text size="xl" fw="bold" c="blue.5">
                {dealerCodes.length}
              </Text>
            </Group>
            <Text size="sm" c="dimmed">Total Dealer Codes</Text>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FiUsers} size={20} c="green.5" />
              <Text size="xl" fw="bold" c="green.5">
                {activeDealers}
              </Text>
            </Group>
            <Text size="sm" c="dimmed">Active Dealers</Text>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FiTrendingUp} size={20} c="violet.5" />
              <Text size="xl" fw="bold" c="violet.5">
                {totalCustomers}
              </Text>
            </Group>
            <Text size="sm" c="dimmed">Total Referrals</Text>
          </Stack>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack align="center" gap="xs">
            <Group gap="xs">
              <Box component={FaRupeeSign} size={20} c="orange.5" />
              <Text size="xl" fw="bold" c="orange.5">
                ₹{totalRevenue.toLocaleString()}
              </Text>
            </Group>
            <Text size="sm" c="dimmed">Total Revenue</Text>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Search and Filters */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" wrap="wrap" gap="md">
          <Group gap="md" style={{ flex: 1 }}>
            <TextInput
              placeholder="Search dealer codes, names, or emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftSection={<Box component={FiSearch} />}
              style={{ maxWidth: '300px' }}
            />
          </Group>
          <Group>
            <Button variant="outline" leftSection={<Box component={FiFilter} />}>
              Filter
            </Button>
            <Button variant="outline" leftSection={<Box component={FiDownload} />}>
              Export
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Dealer Codes Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Table.ScrollContainer minWidth={800}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Dealer</Table.Th>
                <Table.Th>Dealer Code</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Referrals</Table.Th>
                <Table.Th>Revenue</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {filteredDealers.map((dealer) => (
                  <Table.Tr key={dealer.dealerId}>
                    <Table.Td>
                      <Group>
                        <Avatar size="sm">
                          {dealer.dealerName.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Stack gap={2}>
                          <Text fw={500}>{dealer.dealerName}</Text>
                          <Text size="sm" c="dimmed">{dealer.email}</Text>
                        </Stack>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group>
                        <Stack gap={2}>
                          <Group gap="xs">
                            <Box component={FiKey} size={14} c="blue.6" />
                            <Text ff="monospace" size="sm" c="blue.6">
                              {formatDealerCode(dealer.code)}
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed">
                            ID: {dealer.dealerId}
                          </Text>
                        </Stack>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => copyToClipboard(dealer.code)}
                          aria-label="Copy code"
                        >
                          <Box component={FiCopy} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={dealer.isActive ? 'green' : 'gray'} 
                        variant="light"
                      >
                        {dealer.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text fw={500}>{dealer.customerCount}</Text>
                        <Text size="xs" c="dimmed">customers</Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text fw={500} c="green.6">
                          ₹{dealer.totalRevenue.toLocaleString()}
                        </Text>
                        <Text size="xs" c="dimmed">total</Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(dealer.createdAt).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={() => handleViewDetails(dealer)}
                          aria-label="View details"
                        >
                          <Box component={FiEye} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="orange"
                          onClick={() => regenerateCode(dealer.dealerId)}
                          aria-label="Regenerate code"
                        >
                          <Box component={FiRefreshCw} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      {/* Dealer Details Modal */}
      <Modal 
        opened={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Dealer Code Details - ${selectedDealer?.dealerName}`}
        size="xl"
      >
        {selectedDealer && (
          <Stack gap="lg">
            {/* Dealer Info */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group gap="md" align="flex-start">
                <Avatar size="lg">
                  {selectedDealer.dealerName.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Stack style={{ flex: 1 }} gap="sm">
                  <Group>
                    <Text fw="bold" size="lg">{selectedDealer.dealerName}</Text>
                    <Badge color={selectedDealer.isActive ? 'green' : 'gray'}>
                      {selectedDealer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Group>
                  <Text c="dimmed">{selectedDealer.email}</Text>
                  <Group>
                    <Box component={FiKey} c="blue.6" />
                    <Text ff="monospace" c="blue.6">
                      {formatDealerCode(selectedDealer.code)}
                    </Text>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      onClick={() => copyToClipboard(selectedDealer.code)}
                      aria-label="Copy code"
                    >
                      <Box component={FiCopy} />
                    </ActionIcon>
                  </Group>
                </Stack>
              </Group>
            </Card>

            {/* Performance Stats */}
            <SimpleGrid cols={2} spacing="md">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack align="center" gap="xs">
                  <Text size="xl" fw="bold" c="violet.5">
                    {selectedDealer.customerCount}
                  </Text>
                  <Text size="sm" c="dimmed">Total Referrals</Text>
                </Stack>
              </Card>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack align="center" gap="xs">
                  <Text size="xl" fw="bold" c="green.5">
                    ₹{selectedDealer.totalRevenue.toLocaleString()}
                  </Text>
                  <Text size="sm" c="dimmed">Total Revenue</Text>
                </Stack>
              </Card>
            </SimpleGrid>

            {/* Additional Info */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Title order={4}>Additional Information</Title>
              </Card.Section>
              <SimpleGrid cols={2} spacing="md" mt="md">
                <Box>
                  <Text c="dimmed" size="sm">Created Date:</Text>
                  <Text fw={500}>
                    {new Date(selectedDealer.createdAt).toLocaleDateString()}
                  </Text>
                </Box>
                <Box>
                  <Text c="dimmed" size="sm">Dealer ID:</Text>
                  <Text fw={500}>{selectedDealer.dealerId}</Text>
                </Box>
                <Box>
                  <Text c="dimmed" size="sm">Average Revenue per Customer:</Text>
                  <Text fw={500}>
                    ₹{selectedDealer.customerCount > 0 ? Math.round(selectedDealer.totalRevenue / selectedDealer.customerCount) : 0}
                  </Text>
                </Box>
                <Box>
                  <Text c="dimmed" size="sm">Code Format:</Text>
                  <Text fw={500}>WA-XXXX-YYYY</Text>
                </Box>
              </SimpleGrid>
            </Card>
            
            <Group justify="flex-end" mt="lg">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
              <Button color="blue">
                Manage Customers
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}