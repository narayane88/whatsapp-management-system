'use client'

import {
  Box,
  Button,
  Card,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
  Select,
  Modal,
  ActionIcon,
  Badge,
  Alert,
  Title,
  Tabs,
  NumberInput,
  Textarea,
  SimpleGrid,
  Divider,
  Progress,
  Avatar,
  ScrollArea
} from '@mantine/core'
import {
  FiPlus,
  FiEdit3,
  FiEye,
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiMapPin,
  FiLink,
  FiUnlink,
  FiCalculator
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { usePermissions } from '@/hooks/usePermissions'

interface Dealer {
  id: number
  name: string
  email: string
  dealer_code: string
  dealer_type: string
  dealer_commission: number
  dealer_territory: string
  dealer_status: string
  customer_count?: number
  total_revenue?: number
  customers?: Customer[]
}

interface Customer {
  id: number
  name: string
  email: string
  dealer_code: string
  assigned_at: string
  commission_rate: number
  territory: string
  status: string
}

interface DealerCustomerRelationship {
  id: number
  dealer_id: number
  customer_id: number
  dealer_name: string
  customer_name: string
  commission_rate: number
  territory: string
  status: string
  assigned_at: string
}

export default function DealerManagement() {
  const { hasPermission, isOwner, isAdmin } = usePermissions()
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [relationships, setRelationships] = useState<DealerCustomerRelationship[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dealers')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'assign' | 'commission' | 'territory'>('assign')
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)
  
  // Form state
  const [assignForm, setAssignForm] = useState({
    dealerId: '',
    customerIds: [] as string[],
    commissionRate: 5.0,
    territory: '',
    notes: ''
  })

  useEffect(() => {
    loadDealers()
    loadCustomers()
    loadRelationships()
  }, [])

  const loadDealers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dealers')
      const data = await response.json()
      
      if (response.ok) {
        setDealers(data.dealers || [])
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to load dealers',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      
      if (response.ok) {
        setCustomers(data.customers || [])
      }
    } catch (error) {

    }
  }

  const loadRelationships = async () => {
    try {
      const response = await fetch('/api/dealer-customers')
      const data = await response.json()
      
      if (response.ok) {
        setRelationships(data.relationships || [])
      }
    } catch (error) {

    }
  }

  const handleAssignCustomers = async () => {
    if (!assignForm.dealerId || assignForm.customerIds.length === 0) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please select dealer and at least one customer',
        color: 'red'
      })
      return
    }

    try {
      const response = await fetch('/api/dealer-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealerId: parseInt(assignForm.dealerId),
          customerIds: assignForm.customerIds.map(id => parseInt(id)),
          commissionRate: assignForm.commissionRate,
          territory: assignForm.territory,
          notes: assignForm.notes
        })
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: `Assigned ${assignForm.customerIds.length} customer(s) to dealer`,
          color: 'green'
        })
        handleCloseModal()
        loadRelationships()
        loadDealers()
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Assignment failed',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  const handleUpdateCommission = async (relationshipId: number, newRate: number) => {
    try {
      const response = await fetch('/api/dealer-customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: relationshipId,
          commissionRate: newRate
        })
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Commission rate updated',
          color: 'green'
        })
        loadRelationships()
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update commission',
        color: 'red'
      })
    }
  }

  const handleUnassignCustomer = async (relationshipId: number) => {
    try {
      const response = await fetch(`/api/dealer-customers?id=${relationshipId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Customer unassigned from dealer',
          color: 'green'
        })
        loadRelationships()
        loadDealers()
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to unassign customer',
        color: 'red'
      })
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setAssignForm({
      dealerId: '',
      customerIds: [],
      commissionRate: 5.0,
      territory: '',
      notes: ''
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'red'
      case 'suspended': return 'yellow'
      default: return 'gray'
    }
  }

  const availableCustomers = customers.filter(customer => 
    !relationships.some(rel => 
      rel.customer_id === customer.id && rel.status === 'active'
    )
  )

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Box>
          <Title order={3}>Dealer Management</Title>
          <Text c="dimmed">Manage SubDealer relationships and commissions</Text>
        </Box>
        {hasPermission('dealers.customers.assign') && (
          <Button
            leftSection={<Box component={FiPlus} />}
            onClick={() => {
              setModalType('assign')
              setIsModalOpen(true)
            }}
          >
            Assign Customers
          </Button>
        )}
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="dealers" leftSection={<Box component={FiUsers} />}>
            Dealers ({dealers.length})
          </Tabs.Tab>
          <Tabs.Tab value="relationships" leftSection={<Box component={FiLink} />}>
            Relationships ({relationships.length})
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<Box component={FiTrendingUp} />}>
            Analytics
          </Tabs.Tab>
        </Tabs.List>

        {/* Dealers Tab */}
        <Tabs.Panel value="dealers" pt="md">
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            {dealers.map((dealer) => (
              <Card key={dealer.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Avatar size="sm" color="blue">
                        {dealer.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Stack gap={0}>
                        <Text fw={500}>{dealer.name}</Text>
                        <Text size="xs" c="dimmed">{dealer.dealer_code}</Text>
                      </Stack>
                    </Group>
                    <Badge color={getStatusColor(dealer.dealer_status)}>
                      {dealer.dealer_status}
                    </Badge>
                  </Group>

                  <SimpleGrid cols={2} spacing="md">
                    <Stack gap={0} align="center">
                      <Text size="lg" fw={700} c="blue.6">
                        {dealer.customer_count || 0}
                      </Text>
                      <Text size="xs" c="dimmed">Customers</Text>
                    </Stack>
                    <Stack gap={0} align="center">
                      <Text size="lg" fw={700} c="green.6">
                        {dealer.dealer_commission}%
                      </Text>
                      <Text size="xs" c="dimmed">Commission</Text>
                    </Stack>
                  </SimpleGrid>

                  {dealer.dealer_territory && (
                    <Group gap="xs">
                      <Box component={FiMapPin} size={14} />
                      <Text size="sm" c="dimmed">{dealer.dealer_territory}</Text>
                    </Group>
                  )}

                  <Divider />

                  <Group gap="xs">
                    <Button
                      variant="subtle"
                      size="sm"
                      leftSection={<Box component={FiEye} />}
                      onClick={() => setSelectedDealer(dealer)}
                    >
                      View Details
                    </Button>
                    
                    {hasPermission('dealers.commission.manage') && (
                      <Button
                        variant="subtle"
                        size="sm"
                        color="green"
                        leftSection={<Box component={FiDollarSign} />}
                        onClick={() => {
                          setSelectedDealer(dealer)
                          setModalType('commission')
                          setIsModalOpen(true)
                        }}
                      >
                        Commission
                      </Button>
                    )}
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        {/* Relationships Tab */}
        <Tabs.Panel value="relationships" pt="md">
          <Card withBorder>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Dealer</Table.Th>
                  <Table.Th>Customer</Table.Th>
                  <Table.Th>Commission</Table.Th>
                  <Table.Th>Territory</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {relationships.map((rel) => (
                  <Table.Tr key={rel.id}>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text fw={500}>{rel.dealer_name}</Text>
                        <Text size="xs" c="dimmed">Since {new Date(rel.assigned_at).toLocaleDateString()}</Text>
                      </Stack>
                    </Table.Td>
                    
                    <Table.Td>
                      <Text>{rel.customer_name}</Text>
                    </Table.Td>
                    
                    <Table.Td>
                      <Badge color="green" variant="outline">
                        {rel.commission_rate}%
                      </Badge>
                    </Table.Td>
                    
                    <Table.Td>
                      <Text size="sm" c="dimmed">{rel.territory || 'Not set'}</Text>
                    </Table.Td>
                    
                    <Table.Td>
                      <Badge color={getStatusColor(rel.status)}>
                        {rel.status}
                      </Badge>
                    </Table.Td>
                    
                    <Table.Td>
                      <Group gap="xs">
                        {hasPermission('dealers.commission.manage') && (
                          <ActionIcon
                            variant="subtle"
                            color="yellow"
                            onClick={() => {
                              const newRate = prompt('Enter new commission rate (%)', rel.commission_rate.toString())
                              if (newRate && !isNaN(parseFloat(newRate))) {
                                handleUpdateCommission(rel.id, parseFloat(newRate))
                              }
                            }}
                          >
                            <Box component={FiEdit3} />
                          </ActionIcon>
                        )}
                        
                        {hasPermission('dealers.customers.assign') && (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => {
                              if (confirm('Are you sure you want to unassign this customer?')) {
                                handleUnassignCustomer(rel.id)
                              }
                            }}
                          >
                            <Box component={FiUnlink} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        {/* Analytics Tab */}
        <Tabs.Panel value="analytics" pt="md">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            <Card withBorder>
              <Stack gap="md">
                <Title order={4}>Dealer Performance</Title>
                <Stack gap="sm">
                  {dealers.map((dealer) => {
                    const customerCount = dealer.customer_count || 0
                    const maxCustomers = Math.max(...dealers.map(d => d.customer_count || 0)) || 1
                    const percentage = (customerCount / maxCustomers) * 100
                    
                    return (
                      <Box key={dealer.id}>
                        <Group justify="space-between" mb="xs">
                          <Text size="sm" fw={500}>{dealer.name}</Text>
                          <Text size="sm" c="dimmed">{customerCount} customers</Text>
                        </Group>
                        <Progress value={percentage} color="blue" size="sm" />
                      </Box>
                    )
                  })}
                </Stack>
              </Stack>
            </Card>

            <Card withBorder>
              <Stack gap="md">
                <Title order={4}>Commission Overview</Title>
                <SimpleGrid cols={2} spacing="md">
                  <Stack gap={0} align="center">
                    <Text size="xl" fw={700} c="green.6">
                      {relationships.reduce((sum, rel) => sum + rel.commission_rate, 0).toFixed(1)}%
                    </Text>
                    <Text size="sm" c="dimmed">Total Commission</Text>
                  </Stack>
                  <Stack gap={0} align="center">
                    <Text size="xl" fw={700} c="blue.6">
                      {relationships.length ? (relationships.reduce((sum, rel) => sum + rel.commission_rate, 0) / relationships.length).toFixed(1) : 0}%
                    </Text>
                    <Text size="sm" c="dimmed">Average Commission</Text>
                  </Stack>
                </SimpleGrid>
              </Stack>
            </Card>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      {/* Assign Customers Modal */}
      <Modal
        opened={isModalOpen && modalType === 'assign'}
        onClose={handleCloseModal}
        title="Assign Customers to Dealer"
        size="md"
      >
        <Stack gap="md">
          <Select
            label="Select Dealer"
            placeholder="Choose a dealer"
            value={assignForm.dealerId}
            onChange={(value) => setAssignForm(prev => ({ ...prev, dealerId: value || '' }))}
            data={dealers.map(dealer => ({
              value: dealer.id.toString(),
              label: `${dealer.name} (${dealer.dealer_code})`
            }))}
            required
          />

          <Select
            label="Select Customers"
            placeholder="Choose customers to assign"
            value={assignForm.customerIds}
            onChange={(value) => setAssignForm(prev => ({ ...prev, customerIds: value || [] }))}
            data={availableCustomers.map(customer => ({
              value: customer.id.toString(),
              label: `${customer.name} (${customer.email})`
            }))}
            multiple
            required
          />

          <NumberInput
            label="Commission Rate (%)"
            value={assignForm.commissionRate}
            onChange={(value) => setAssignForm(prev => ({ ...prev, commissionRate: value || 5.0 }))}
            min={0}
            max={100}
            step={0.5}
            precision={1}
          />

          <TextInput
            label="Territory"
            placeholder="Assign territory (optional)"
            value={assignForm.territory}
            onChange={(e) => setAssignForm(prev => ({ ...prev, territory: e.target.value }))}
          />

          <Textarea
            label="Notes"
            placeholder="Additional notes (optional)"
            value={assignForm.notes}
            onChange={(e) => setAssignForm(prev => ({ ...prev, notes: e.target.value }))}
            minRows={2}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleAssignCustomers}>
              Assign Customers
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Dealer Details Modal */}
      <Modal
        opened={!!selectedDealer}
        onClose={() => setSelectedDealer(null)}
        title={`Dealer Details: ${selectedDealer?.name}`}
        size="lg"
      >
        {selectedDealer && (
          <Stack gap="md">
            <SimpleGrid cols={2} spacing="md">
              <Stack gap="xs">
                <Text size="sm" c="dimmed">Dealer Code</Text>
                <Text fw={500}>{selectedDealer.dealer_code}</Text>
              </Stack>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">Commission Rate</Text>
                <Text fw={500}>{selectedDealer.dealer_commission}%</Text>
              </Stack>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">Territory</Text>
                <Text>{selectedDealer.dealer_territory || 'Not assigned'}</Text>
              </Stack>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">Status</Text>
                <Badge color={getStatusColor(selectedDealer.dealer_status)}>
                  {selectedDealer.dealer_status}
                </Badge>
              </Stack>
            </SimpleGrid>

            <Divider />

            <Stack gap="xs">
              <Text fw={500}>Assigned Customers</Text>
              <Text size="sm" c="dimmed">
                {relationships.filter(rel => rel.dealer_id === selectedDealer.id).length} customers assigned
              </Text>
              
              <ScrollArea h={200}>
                <Stack gap="xs">
                  {relationships
                    .filter(rel => rel.dealer_id === selectedDealer.id)
                    .map(rel => (
                      <Group key={rel.id} justify="space-between" p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-1)', borderRadius: '4px' }}>
                        <Text size="sm">{rel.customer_name}</Text>
                        <Badge size="sm" color="green">{rel.commission_rate}%</Badge>
                      </Group>
                    ))}
                </Stack>
              </ScrollArea>
            </Stack>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}