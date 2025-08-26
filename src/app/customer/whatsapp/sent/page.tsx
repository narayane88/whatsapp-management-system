'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Container,
  Card,
  Stack,
  Group,
  Button,
  Text,
  Title,
  Badge,
  Table,
  Alert,
  LoadingOverlay,
  Select,
  TextInput,
  ActionIcon,
  Tooltip,
  Modal,
  ScrollArea,
  Pagination,
  Grid
} from '@mantine/core'
import {
  IconSend,
  IconMessage,
  IconPhone,
  IconCalendar,
  IconCheck,
  IconX,
  IconRefresh,
  IconSearch,
  IconFilter,
  IconEye,
  IconTrash,
  IconDownload,
  IconMessageCircle,
  IconClock,
  IconUser,
  IconDeviceMobile,
  IconUsers
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import CustomerHeader from '@/components/customer/CustomerHeader'
import { useWhatsAppRealTime } from '@/hooks/useWhatsAppRealTime'

interface SentMessage {
  id: string
  recipientNumber: string
  recipientName?: string
  message: string
  messageType: string
  deviceName: string
  deviceId?: string
  devicePhone?: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  sentAt: string
  deliveredAt?: string
  readAt?: string
  errorMessage?: string
  messageId?: string
  attachmentUrl?: string
  metadata?: Record<string, unknown>
}

interface MessageStats {
  totalSent: number
  delivered: number
  read: number
  failed: number
  today: number
  thisWeek: number
  thisMonth: number
}

export default function MessageSentPage() {
  const [messages, setMessages] = useState<SentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [realTimeConnected, setRealTimeConnected] = useState(false)
  const [stats, setStats] = useState<MessageStats>({
    totalSent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  })
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deviceFilter, setDeviceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  
  // Modal
  const [selectedMessage, setSelectedMessage] = useState<SentMessage | null>(null)
  const [detailsOpened, { open: openDetails, close: closeDetails }] = useDisclosure(false)
  const [updatingContacts, setUpdatingContacts] = useState(false)

  useEffect(() => {
    fetchSentMessages()
  }, [currentPage, statusFilter, deviceFilter, searchQuery, dateFilter])

  // Real-time update handlers
  const handleMessageSent = useCallback((data: any) => {
    if (data.message) {
      // Add new sent message to the list
      setMessages(prev => [data.message, ...prev])
    }
    if (data.stats) {
      setStats(data.stats)
    }
  }, [])

  const handleStatsUpdate = useCallback((data: any) => {
    if (data.sentMessages) {
      setMessages(data.sentMessages)
    }
    if (data.stats) {
      setStats(data.stats)
    }
  }, [])

  // Initialize real-time connection
  const { isConnected } = useWhatsAppRealTime({
    onMessageSent: handleMessageSent,
    onStatsUpdate: handleStatsUpdate,
    enableNotifications: true, // Enable notifications and sounds
    enableSounds: true,
    autoReconnect: true
  })

  useEffect(() => {
    setRealTimeConnected(isConnected)
  }, [isConnected])

  const fetchSentMessages = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      })
      
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (deviceFilter !== 'all') params.set('device', deviceFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (dateFilter !== 'all') params.set('dateRange', dateFilter)
      
      const response = await fetch(`/api/customer/whatsapp/sent?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch sent messages')
      }
      
      const data = await response.json()
      
      setMessages(data.messages || [])
      setTotalCount(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 0)
      setStats({
        totalSent: data.stats?.totalSent || 0,
        delivered: data.stats?.delivered || 0,
        read: data.stats?.read || 0,
        failed: data.stats?.failed || 0,
        today: data.stats?.today || 0,
        thisWeek: data.stats?.thisWeek || 0,
        thisMonth: data.stats?.thisMonth || 0
      })
      
    } catch (error) {
      console.error('Error fetching sent messages:', error)
      if (!realTimeConnected) {
        notifications.show({
          title: 'Error',
          message: 'Failed to fetch sent messages',
          color: 'red'
        })
      }
      
      // Fallback to empty data
      setMessages([])
      setStats({
        totalSent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      })
    } finally {
      setLoading(false)
    }
  }


  const clearFilters = () => {
    setStatusFilter('all')
    setDeviceFilter('all')
    setSearchQuery('')
    setDateFilter('all')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'blue'
      case 'delivered': return 'green'
      case 'read': return 'teal'
      case 'failed': return 'red'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <IconSend size="0.8rem" />
      case 'delivered': return <IconCheck size="0.8rem" />
      case 'read': return <IconMessageCircle size="0.8rem" />
      case 'failed': return <IconX size="0.8rem" />
      default: return <IconClock size="0.8rem" />
    }
  }

  const viewMessageDetails = (message: SentMessage) => {
    setSelectedMessage(message)
    openDetails()
  }

  const exportMessages = () => {
    const csvContent = [
      ['Date', 'Time', 'Recipient', 'Name', 'Message', 'Type', 'Device Name', 'Device ID', 'Device Phone', 'Status'].join(','),
      ...messages.map(msg => [
        new Date(msg.sentAt).toLocaleDateString(),
        new Date(msg.sentAt).toLocaleTimeString(),
        msg.recipientNumber,
        msg.recipientName || '',
        `"${msg.message.replace(/"/g, '""')}"`,
        msg.messageType,
        msg.deviceName,
        msg.deviceId || '',
        msg.devicePhone || '',
        msg.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sent-messages-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    notifications.show({
      title: '📄 Export Complete',
      message: 'Sent messages exported to CSV file',
      color: 'green'
    })
  }

  const updateContactNames = async () => {
    try {
      setUpdatingContacts(true)
      
      const response = await fetch('/api/customer/whatsapp/contacts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to update contact names')
      }

      const data = await response.json()
      
      notifications.show({
        title: '✅ Contact Names Updated',
        message: `Updated ${data.data.totalUpdatedMessages} messages across ${data.data.totalRecipients} recipients`,
        color: 'green'
      })
      
      // Refresh the messages list to show updated names
      await fetchSentMessages()
      
    } catch (error) {
      console.error('Error updating contact names:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to update contact names from WhatsApp',
        color: 'red'
      })
    } finally {
      setUpdatingContacts(false)
    }
  }

  // Messages are already paginated from the server
  const paginatedMessages = messages

  if (loading) {
    return <LoadingOverlay visible />
  }

  return (
    <div>
      <CustomerHeader 
        title="Message Sent"
        subtitle="View and manage your sent WhatsApp messages with delivery tracking"
        badge={{ 
          label: realTimeConnected ? 'Live • Message History' : 'Message History', 
          color: realTimeConnected ? 'green' : 'blue' 
        }}
      />
      
      <Container size="xl" py="md">
        <Stack gap="lg">
          {/* Stats Cards */}
          <Grid>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Card withBorder padding="md" style={{ backgroundColor: '#e3f2fd' }}>
                <Group gap="sm">
                  <IconSend size="1.5rem" color="#1976d2" />
                  <div>
                    <Text size="xs" c="dimmed">Total Sent</Text>
                    <Text size="xl" fw={700}>{stats.totalSent}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Card withBorder padding="md" style={{ backgroundColor: '#e8f5e8' }}>
                <Group gap="sm">
                  <IconCheck size="1.5rem" color="#2e7d32" />
                  <div>
                    <Text size="xs" c="dimmed">Delivered</Text>
                    <Text size="xl" fw={700}>{stats.delivered}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Card withBorder padding="md" style={{ backgroundColor: '#e0f2f1' }}>
                <Group gap="sm">
                  <IconMessageCircle size="1.5rem" color="#00695c" />
                  <div>
                    <Text size="xs" c="dimmed">Read</Text>
                    <Text size="xl" fw={700}>{stats.read}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 3 }}>
              <Card withBorder padding="md" style={{ backgroundColor: '#ffebee' }}>
                <Group gap="sm">
                  <IconX size="1.5rem" color="#c62828" />
                  <div>
                    <Text size="xs" c="dimmed">Failed</Text>
                    <Text size="xl" fw={700}>{stats.failed}</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Filters */}
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <Title order={4}>📊 Message History</Title>
                {realTimeConnected && (
                  <Badge size="sm" color="green" variant="dot">
                    Live Updates
                  </Badge>
                )}
              </Group>
              <Group gap="sm">
                <Button
                  variant="light"
                  size="sm"
                  onClick={fetchSentMessages}
                  leftSection={<IconRefresh size="1rem" />}
                >
                  Refresh
                </Button>
                <Button
                  variant="light"
                  color="green"
                  size="sm"
                  onClick={exportMessages}
                  leftSection={<IconDownload size="1rem" />}
                  disabled={messages.length === 0}
                >
                  Export CSV
                </Button>
                <Button
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={updateContactNames}
                  leftSection={<IconUsers size="1rem" />}
                  loading={updatingContacts}
                  disabled={messages.length === 0}
                >
                  Update Names
                </Button>
              </Group>
            </Group>
            
            <Grid>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Status"
                  data={[
                    { value: 'all', label: 'All Status' },
                    { value: 'sent', label: 'Sent' },
                    { value: 'delivered', label: 'Delivered' },
                    { value: 'read', label: 'Read' },
                    { value: 'failed', label: 'Failed' }
                  ]}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value || 'all')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Device"
                  data={[
                    { value: 'all', label: 'All Devices' },
                    ...Array.from(new Set(messages.map(m => m.deviceName))).map(device => ({
                      value: device,
                      label: device
                    }))
                  ]}
                  value={deviceFilter}
                  onChange={(value) => setDeviceFilter(value || 'all')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Date Range"
                  data={[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' }
                  ]}
                  value={dateFilter}
                  onChange={(value) => setDateFilter(value || 'all')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput
                  label="Search"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftSection={<IconSearch size="1rem" />}
                />
              </Grid.Col>
            </Grid>

            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">
                Showing {paginatedMessages.length} of {totalCount} messages
              </Text>
              {(statusFilter !== 'all' || deviceFilter !== 'all' || searchQuery || dateFilter !== 'all') && (
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={clearFilters}
                  leftSection={<IconFilter size="0.8rem" />}
                >
                  Clear Filters
                </Button>
              )}
            </Group>
          </Card>

          {/* Messages Table */}
          <Card withBorder padding="lg">
            {paginatedMessages.length > 0 ? (
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Recipient</Table.Th>
                      <Table.Th>Message</Table.Th>
                      <Table.Th>Device Info</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Sent At</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedMessages.map((message) => (
                      <Table.Tr key={message.id}>
                        <Table.Td>
                          <div>
                            <Text size="sm" fw={500}>
                              {message.recipientName || 'Unknown'}
                            </Text>
                            <Text size="xs" c="dimmed" ff="monospace">
                              {message.recipientNumber}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <div style={{ maxWidth: 200 }}>
                            <Text size="sm" truncate="end">
                              {message.message}
                            </Text>
                            <Badge size="xs" variant="light" color="blue">
                              {message.messageType}
                            </Badge>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <div>
                            <Group gap="xs">
                              <IconDeviceMobile size="0.8rem" />
                              <div>
                                <Text size="sm" fw={500}>
                                  {message.devicePhone || 'Unknown'}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  ID: {message.deviceId || 'N/A'}
                                </Text>
                                <Text size="xs" c="dimmed" ff="monospace">
                                  {message.deviceName}
                                </Text>
                              </div>
                            </Group>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={getStatusColor(message.status)}
                            variant="light"
                            leftSection={getStatusIcon(message.status)}
                          >
                            {message.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <div>
                            <Text size="xs">
                              {new Date(message.sentAt).toLocaleDateString()}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {new Date(message.sentAt).toLocaleTimeString()}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="View Details">
                              <ActionIcon
                                variant="subtle"
                                onClick={() => viewMessageDetails(message)}
                              >
                                <IconEye size="1rem" />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            ) : (
              <Alert>
                <Text size="sm">No messages found matching your filters.</Text>
              </Alert>
            )}

            {/* Pagination */}
            {totalCount > pageSize && (
              <Group justify="center" mt="md">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  size="sm"
                />
              </Group>
            )}
          </Card>
        </Stack>
      </Container>

      {/* Message Details Modal */}
      <Modal
        opened={detailsOpened}
        onClose={closeDetails}
        title="Message Details"
        size="md"
      >
        {selectedMessage && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={500}>Message Information</Text>
              <Badge
                color={getStatusColor(selectedMessage.status)}
                leftSection={getStatusIcon(selectedMessage.status)}
              >
                {selectedMessage.status}
              </Badge>
            </Group>

            <div>
              <Text size="sm" fw={500} mb="xs">Recipient</Text>
              <Group gap="sm">
                <IconUser size="1rem" />
                <div>
                  <Text size="sm">{selectedMessage.recipientName || 'Unknown'}</Text>
                  <Text size="xs" c="dimmed" ff="monospace">{selectedMessage.recipientNumber}</Text>
                </div>
              </Group>
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">Message Content</Text>
              <Card withBorder padding="sm" style={{ backgroundColor: '#f8f9fa' }}>
                <Text size="sm">{selectedMessage.message}</Text>
              </Card>
              <Text size="xs" c="dimmed" mt="xs">
                Type: {selectedMessage.messageType}
              </Text>
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">Device & Timing</Text>
              <Grid>
                <Grid.Col span={12}>
                  <Group gap="xs" mb="xs">
                    <IconDeviceMobile size="1rem" />
                    <div>
                      <Text size="sm" fw={500}>
                        {selectedMessage.devicePhone || 'Unknown Phone'}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Device ID: {selectedMessage.deviceId || 'N/A'}
                      </Text>
                      <Text size="xs" c="dimmed" ff="monospace">
                        {selectedMessage.deviceName}
                      </Text>
                    </div>
                  </Group>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Group gap="xs">
                    <IconCalendar size="1rem" />
                    <Text size="sm">
                      {new Date(selectedMessage.sentAt).toLocaleString()}
                    </Text>
                  </Group>
                </Grid.Col>
              </Grid>
            </div>

            {selectedMessage.deliveredAt && (
              <div>
                <Text size="sm" fw={500} mb="xs">Delivery Info</Text>
                <Text size="sm" c="green">
                  Delivered: {new Date(selectedMessage.deliveredAt).toLocaleString()}
                </Text>
                {selectedMessage.readAt && (
                  <Text size="sm" c="teal">
                    Read: {new Date(selectedMessage.readAt).toLocaleString()}
                  </Text>
                )}
              </div>
            )}

            {selectedMessage.errorMessage && (
              <Alert color="red" icon={<IconX size="1rem" />}>
                <Text size="sm" fw={500}>Error</Text>
                <Text size="sm">{selectedMessage.errorMessage}</Text>
              </Alert>
            )}

            {selectedMessage.attachmentUrl && (
              <div>
                <Text size="sm" fw={500} mb="xs">Attachment</Text>
                <Text size="sm" c="blue" style={{ wordBreak: 'break-all' }}>
                  {selectedMessage.attachmentUrl}
                </Text>
              </div>
            )}
          </Stack>
        )}
      </Modal>
    </div>
  )
}