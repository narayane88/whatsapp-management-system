'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Container,
  Card,
  Stack,
  Group,
  Button,
  Text,
  Title,
  Badge,
  LoadingOverlay,
  Alert,
  Table,
  ActionIcon,
  Modal,
  Textarea,
  Switch,
  NumberInput,
  Select,
  Pagination,
  Center
} from '@mantine/core'
import {
  IconRefresh,
  IconTrash,
  IconPlayerPause,
  IconPlayerPlay,
  IconEye,
  IconMessage,
  IconPhoto,
  IconFile,
  IconVideo,
  IconMusic,
  IconMapPin,
  IconClock,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconSettings,
  IconPlayerStop
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import CustomerHeader from '@/components/customer/CustomerHeader'

interface QueueMessage {
  id: string
  to: string
  message: string
  messageType: string
  attachmentUrl?: string
  deviceId: string
  deviceName: string
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'paused'
  priority: number
  scheduledAt?: string
  createdAt: string
  attempts: number
  lastError?: string
}

interface QueueSettings {
  enabled: boolean
  interval: number // seconds
  batchSize: number
  maxRetries: number
  retryDelay: number // seconds
}

interface QueueStats {
  totalMessages: number
  pendingMessages: number
  processingMessages: number
  sentMessages: number
  failedMessages: number
  messagesPerMinute: number
  estimatedTimeRemaining: string
}

export default function MessageQueuePage() {
  const [messages, setMessages] = useState<QueueMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [settings, setSettings] = useState<QueueSettings>({
    enabled: false,
    interval: 10,
    batchSize: 1,
    maxRetries: 3,
    retryDelay: 30
  })
  const [stats, setStats] = useState<QueueStats>({
    totalMessages: 0,
    pendingMessages: 0,
    processingMessages: 0,
    sentMessages: 0,
    failedMessages: 0,
    messagesPerMinute: 0,
    estimatedTimeRemaining: '0 minutes'
  })
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<QueueMessage | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchQueueData()
    fetchSettings()
    
    // Auto-refresh every 5 seconds when processing
    const interval = setInterval(() => {
      if (isProcessing) {
        fetchQueueData()
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [isProcessing])

  const fetchQueueData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      else setRefreshing(true)

      const response = await fetch('/api/customer/whatsapp/queue')
      const result = await response.json()

      if (response.ok) {
        // Sort messages by createdAt (latest first)
        const sortedMessages = (result.messages || []).sort((a: QueueMessage, b: QueueMessage) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        setMessages(sortedMessages)
        setStats(result.stats || {
          totalMessages: 0,
          pendingMessages: 0,
          processingMessages: 0,
          sentMessages: 0,
          failedMessages: 0,
          messagesPerMinute: 0,
          estimatedTimeRemaining: '0 minutes'
        })
        if (result.settings) {
          setSettings(result.settings)
          setIsProcessing(result.settings.enabled)
        }
      } else {
        throw new Error(result.error || 'Failed to fetch queue data')
      }
      
    } catch (error) {
      console.error('Error fetching queue data:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch queue data',
        color: 'red'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/customer/whatsapp/queue?action=settings')
      const result = await response.json()
      
      if (response.ok && result.settings) {
        setSettings(result.settings)
        setIsProcessing(result.settings.enabled)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const saveSettings = async (newSettings: QueueSettings) => {
    try {
      const response = await fetch('/api/customer/whatsapp/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateSettings',
          settings: newSettings
        })
      })

      const result = await response.json()

      if (response.ok) {
        setSettings(newSettings)
        setIsProcessing(newSettings.enabled)
        
        notifications.show({
          title: 'Settings Saved',
          message: 'Queue settings updated successfully',
          color: 'green'
        })
        
        setSettingsModalOpen(false)
        fetchQueueData(false)
      } else {
        throw new Error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save settings',
        color: 'red'
      })
    }
  }

  const toggleQueueProcessing = async () => {
    const newSettings = { ...settings, enabled: !settings.enabled }
    await saveSettings(newSettings)
  }

  const clearQueue = async () => {
    if (confirm('Are you sure you want to clear all messages from the queue?')) {
      try {
        const response = await fetch('/api/customer/whatsapp/queue?action=clear', {
          method: 'DELETE'
        })

        const result = await response.json()

        if (response.ok) {
          setMessages([])
          notifications.show({
            title: 'Queue Cleared',
            message: 'All messages removed from queue',
            color: 'green'
          })
          fetchQueueData(false)
        } else {
          throw new Error(result.error || 'Failed to clear queue')
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to clear queue',
          color: 'red'
        })
      }
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/customer/whatsapp/queue?messageId=${messageId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId))
        notifications.show({
          title: 'Message Deleted',
          message: 'Message removed from queue',
          color: 'green'
        })
        fetchQueueData(false)
      } else {
        throw new Error(result.error || 'Failed to delete message')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete message',
        color: 'red'
      })
    }
  }

  const retryMessage = async (messageId: string) => {
    try {
      const response = await fetch('/api/customer/whatsapp/queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          action: 'retry'
        })
      })

      const result = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Message Queued',
          message: 'Message added back to queue for retry',
          color: 'green'
        })
        fetchQueueData(false)
      } else {
        throw new Error(result.error || 'Failed to retry message')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to retry message',
        color: 'red'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'blue'
      case 'processing': return 'orange'
      case 'sent': return 'green'
      case 'failed': return 'red'
      case 'paused': return 'gray'
      default: return 'gray'
    }
  }

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <IconMessage size="1rem" />
      case 'image': return <IconPhoto size="1rem" />
      case 'document': return <IconFile size="1rem" />
      case 'video': return <IconVideo size="1rem" />
      case 'audio': return <IconMusic size="1rem" />
      case 'location': return <IconMapPin size="1rem" />
      default: return <IconMessage size="1rem" />
    }
  }

  // Paginated messages
  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return messages.slice(startIndex, endIndex)
  }, [messages, currentPage, itemsPerPage])

  const totalPages = Math.ceil(messages.length / itemsPerPage)

  // Reset to first page when messages change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [messages.length, totalPages, currentPage])

  if (loading) {
    return <LoadingOverlay visible />
  }

  return (
    <div>
      <CustomerHeader 
        title="Message Queue"
        subtitle="Manage and monitor automated message sending with configurable intervals"
        badge={{ label: isProcessing ? 'Processing' : 'Paused', color: isProcessing ? 'green' : 'orange' }}
      />
      
      <Container size="xl" py="md">
        <Stack gap="lg">
          {/* Queue Controls */}
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Title order={3}>Queue Control</Title>
              <Group gap="sm">
                <Button
                  variant="light"
                  leftSection={<IconSettings size="1rem" />}
                  onClick={() => setSettingsModalOpen(true)}
                  size="sm"
                >
                  Settings
                </Button>
                <Button
                  variant={settings.enabled ? "filled" : "light"}
                  color={settings.enabled ? "red" : "green"}
                  leftSection={settings.enabled ? <IconPlayerPause size="1rem" /> : <IconPlayerPlay size="1rem" />}
                  onClick={toggleQueueProcessing}
                  size="sm"
                >
                  {settings.enabled ? 'Pause Queue' : 'Start Queue'}
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconRefresh size="1rem" />}
                  onClick={() => fetchQueueData(false)}
                  loading={refreshing}
                  size="sm"
                >
                  Refresh
                </Button>
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size="1rem" />}
                  onClick={clearQueue}
                  size="sm"
                  disabled={messages.length === 0}
                >
                  Clear All
                </Button>
              </Group>
            </Group>
            
            {/* Queue Status */}
            <Group gap="md">
              <Text size="sm">
                <strong>Status:</strong> {settings.enabled ? 'Processing' : 'Paused'}
              </Text>
              <Text size="sm">
                <strong>Interval:</strong> {settings.interval}s between messages
              </Text>
              <Text size="sm">
                <strong>Rate:</strong> {stats.messagesPerMinute} messages/minute
              </Text>
              <Text size="sm">
                <strong>ETA:</strong> {stats.estimatedTimeRemaining}
              </Text>
            </Group>
          </Card>

          {/* Statistics Cards */}
          <Group grow>
            <Card withBorder padding="md" style={{ backgroundColor: '#e3f2fd' }}>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Messages</Text>
                  <Text size="xl" fw={700}>{stats.totalMessages}</Text>
                </div>
                <IconMessage size={24} color="#1976d2" />
              </Group>
            </Card>
            
            <Card withBorder padding="md" style={{ backgroundColor: '#fff3e0' }}>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Pending</Text>
                  <Text size="xl" fw={700}>{stats.pendingMessages}</Text>
                </div>
                <IconClock size={24} color="#f57c00" />
              </Group>
            </Card>
            
            <Card withBorder padding="md" style={{ backgroundColor: '#e8f5e8' }}>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Sent</Text>
                  <Text size="xl" fw={700}>{stats.sentMessages}</Text>
                </div>
                <IconCheck size={24} color="#388e3c" />
              </Group>
            </Card>
            
            <Card withBorder padding="md" style={{ backgroundColor: '#ffebee' }}>
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Failed</Text>
                  <Text size="xl" fw={700}>{stats.failedMessages}</Text>
                </div>
                <IconX size={24} color="#d32f2f" />
              </Group>
            </Card>
          </Group>

          {/* Messages Table */}
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Title order={4}>Queue Messages ({messages.length})</Title>
              {messages.length > itemsPerPage && (
                <Text size="sm" c="dimmed">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, messages.length)} of {messages.length}
                </Text>
              )}
            </Group>

            {messages.length > 0 ? (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>To</Table.Th>
                      <Table.Th>Content</Table.Th>
                      <Table.Th>Device</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Priority</Table.Th>
                      <Table.Th>Created</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedMessages.map((message) => (
                      <Table.Tr key={message.id}>
                        <Table.Td>
                          <Group gap="xs">
                            {getMessageTypeIcon(message.messageType)}
                            <Text size="sm">{message.messageType}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{message.to}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={2} style={{ maxWidth: 200 }}>
                            {message.message}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{message.deviceName}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Badge color={getStatusColor(message.status)} size="sm">
                              {message.status}
                            </Badge>
                            {message.lastError && (
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="red"
                                onClick={() => {
                                  notifications.show({
                                    title: 'Error Details',
                                    message: message.lastError,
                                    color: 'red'
                                  })
                                }}
                              >
                                <IconAlertCircle size={14} />
                              </ActionIcon>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={message.priority > 0 ? 'orange' : 'blue'} size="sm">
                            {message.priority > 0 ? 'High' : 'Normal'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {new Date(message.createdAt).toLocaleString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              onClick={() => {
                                setSelectedMessage(message)
                                setViewModalOpen(true)
                              }}
                            >
                              <IconEye size={14} />
                            </ActionIcon>
                            
                            {message.status === 'failed' && (
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="green"
                                onClick={() => retryMessage(message.id)}
                              >
                                <IconRefresh size={14} />
                              </ActionIcon>
                            )}
                            
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => deleteMessage(message.id)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                
                {/* Pagination */}
                {messages.length > itemsPerPage && (
                  <Center mt="xl">
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                      siblings={1}
                      boundaries={1}
                    />
                  </Center>
                )}
              </>
            ) : (
              <Alert icon={<IconMessage size="1rem" />} color="blue">
                <Text size="sm" fw={500}>No messages in queue</Text>
                <Text size="xs">
                  Messages sent from the Send Messages page will appear here for processing.
                </Text>
              </Alert>
            )}
          </Card>
        </Stack>
      </Container>

      {/* Settings Modal */}
      <Modal
        opened={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="Queue Settings"
        size="md"
      >
        <Stack gap="md">
          <Switch
            label="Enable Queue Processing"
            description="When enabled, messages will be automatically sent with configured intervals"
            checked={settings.enabled}
            onChange={(event) => setSettings({ ...settings, enabled: event.currentTarget.checked })}
          />

          <NumberInput
            label="Send Interval (seconds)"
            description="Time delay between sending each message"
            value={settings.interval}
            onChange={(value) => setSettings({ ...settings, interval: Number(value) || 10 })}
            min={5}
            max={300}
            step={5}
          />

          <NumberInput
            label="Batch Size"
            description="Number of messages to process at once"
            value={settings.batchSize}
            onChange={(value) => setSettings({ ...settings, batchSize: Number(value) || 1 })}
            min={1}
            max={5}
          />

          <NumberInput
            label="Max Retries"
            description="Maximum number of retry attempts for failed messages"
            value={settings.maxRetries}
            onChange={(value) => setSettings({ ...settings, maxRetries: Number(value) || 3 })}
            min={0}
            max={10}
          />

          <NumberInput
            label="Retry Delay (seconds)"
            description="Time delay before retrying failed messages"
            value={settings.retryDelay}
            onChange={(value) => setSettings({ ...settings, retryDelay: Number(value) || 30 })}
            min={10}
            max={600}
            step={10}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setSettingsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveSettings(settings)}>
              Save Settings
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Message Details Modal */}
      <Modal
        opened={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Message Details"
        size="md"
      >
        {selectedMessage && (
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={500}>Message ID:</Text>
              <Text>{selectedMessage.id}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Type:</Text>
              <Group gap="xs">
                {getMessageTypeIcon(selectedMessage.messageType)}
                <Text>{selectedMessage.messageType}</Text>
              </Group>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>To:</Text>
              <Text>{selectedMessage.to}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Status:</Text>
              <Badge color={getStatusColor(selectedMessage.status)}>
                {selectedMessage.status}
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Device:</Text>
              <Text>{selectedMessage.deviceName}</Text>
            </Group>
            <div>
              <Text fw={500} mb="xs">Message Content:</Text>
              <Textarea
                value={selectedMessage.message}
                readOnly
                autosize
                minRows={3}
                maxRows={8}
              />
            </div>
            {selectedMessage.attachmentUrl && (
              <Group justify="space-between">
                <Text fw={500}>Attachment:</Text>
                <Text size="sm" c="blue" style={{ wordBreak: 'break-all' }}>
                  {selectedMessage.attachmentUrl}
                </Text>
              </Group>
            )}
            <Group justify="space-between">
              <Text fw={500}>Created:</Text>
              <Text>{new Date(selectedMessage.createdAt).toLocaleString()}</Text>
            </Group>
            <Group justify="space-between">
              <Text fw={500}>Attempts:</Text>
              <Text>{selectedMessage.attempts} / {settings.maxRetries}</Text>
            </Group>
            {selectedMessage.lastError && (
              <div>
                <Text fw={500} mb="xs" c="red">Last Error:</Text>
                <Alert icon={<IconAlertCircle size="1rem" />} color="red">
                  <Text size="sm">{selectedMessage.lastError}</Text>
                </Alert>
              </div>
            )}
          </Stack>
        )}
      </Modal>
    </div>
  )
}