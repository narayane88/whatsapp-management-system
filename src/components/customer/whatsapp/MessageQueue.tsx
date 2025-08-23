'use client'

import { useEffect, useState } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Group, 
  Stack, 
  Badge, 
  Text, 
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Select,
  Alert,
  Pagination,
  LoadingOverlay
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  IconSend, 
  IconClock, 
  IconX, 
  IconEdit,
  IconTrash,
  IconPlus,
  IconInfoCircle
} from '@tabler/icons-react'

interface QueuedMessage {
  id: string
  toNumber: string
  message: string
  priority: number
  status: 'PENDING' | 'PROCESSING' | 'FAILED'
  attempts: number
  scheduledAt?: string
  createdAt: string
  instanceName?: string
}

interface NewMessageForm {
  toNumber: string
  message: string
  priority: number
  instanceId: string
  scheduledAt?: string
}

export default function MessageQueue() {
  const [messages, setMessages] = useState<QueuedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [opened, { open, close }] = useDisclosure(false)
  const [devices, setDevices] = useState<any[]>([])

  const form = useForm<NewMessageForm>({
    initialValues: {
      toNumber: '',
      message: '',
      priority: 0,
      instanceId: '',
      scheduledAt: '',
    },
    validate: {
      toNumber: (value) => (!value ? 'Phone number is required' : null),
      message: (value) => (!value ? 'Message is required' : null),
      instanceId: (value) => (!value ? 'WhatsApp instance is required' : null),
    },
  })

  useEffect(() => {
    fetchQueuedMessages()
    fetchConnectedDevices()
  }, [currentPage])

  const fetchConnectedDevices = async () => {
    try {
      const response = await fetch('/api/customer/host/connections')
      if (response.ok) {
        const allDevices = await response.json()
        const connectedDevices = allDevices.filter((device: any) => device.status === 'CONNECTED')
        setDevices(connectedDevices)
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    }
  }

  const fetchQueuedMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/customer/whatsapp/queue?page=${currentPage}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
        setTotalPages(data.totalPages)
      } else {
        // Mock data for now
        setMessages([
          {
            id: '1',
            toNumber: '+1234567890',
            message: 'Hello! This is a test message from our WhatsApp system.',
            priority: 0,
            status: 'PENDING',
            attempts: 0,
            scheduledAt: new Date(Date.now() + 3600000).toISOString(),
            createdAt: new Date().toISOString(),
            instanceName: 'Business Account'
          },
          {
            id: '2',
            toNumber: '+1234567891',
            message: 'Welcome to our service! We are excited to have you on board.',
            priority: 1,
            status: 'PROCESSING',
            attempts: 1,
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            instanceName: 'Support Account'
          },
          {
            id: '3',
            toNumber: '+1234567892',
            message: 'Your order has been confirmed and will be delivered soon.',
            priority: 2,
            status: 'FAILED',
            attempts: 3,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            instanceName: 'Business Account'
          }
        ])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Queue fetch error:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load message queue',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: NewMessageForm) => {
    try {
      const response = await fetch('/api/customer/whatsapp/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Message added to queue',
          color: 'green',
        })
        close()
        form.reset()
        fetchQueuedMessages()
      } else {
        throw new Error('Failed to add message')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to add message to queue',
        color: 'red',
      })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/customer/whatsapp/queue/${messageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Message removed from queue',
          color: 'green',
        })
        fetchQueuedMessages()
      } else {
        throw new Error('Failed to delete message')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to remove message from queue',
        color: 'red',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'blue'
      case 'PROCESSING': return 'yellow'
      case 'FAILED': return 'red'
      default: return 'gray'
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 0: return { label: 'Normal', color: 'blue' }
      case 1: return { label: 'High', color: 'orange' }
      case 2: return { label: 'Urgent', color: 'red' }
      default: return { label: 'Low', color: 'gray' }
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} />
      
      <Stack gap="lg">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {messages.length} messages in queue
          </Text>
          <Button 
            leftSection={<IconPlus size="1rem" />}
            onClick={open}
          >
            Add Message
          </Button>
        </Group>

        {messages.length > 0 ? (
          <Card withBorder padding="lg">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Recipient</Table.Th>
                  <Table.Th>Message</Table.Th>
                  <Table.Th>Instance</Table.Th>
                  <Table.Th>Priority</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Scheduled</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {messages.map((message) => {
                  const priority = getPriorityLabel(message.priority)
                  return (
                    <Table.Tr key={message.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{message.toNumber}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={2} style={{ maxWidth: 200 }}>
                          {message.message}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{message.instanceName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={priority.color} size="sm">
                          {priority.label}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(message.status)} size="sm">
                          {message.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {message.scheduledAt ? 
                            new Date(message.scheduledAt).toLocaleString() : 
                            'Now'
                          }
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon variant="subtle" color="blue">
                            <IconEdit size="1rem" />
                          </ActionIcon>
                          <ActionIcon 
                            variant="subtle" 
                            color="red"
                            onClick={() => handleDeleteMessage(message.id)}
                          >
                            <IconTrash size="1rem" />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>

            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination 
                  total={totalPages} 
                  value={currentPage} 
                  onChange={setCurrentPage}
                />
              </Group>
            )}
          </Card>
        ) : (
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            No messages in queue. Add your first message to get started.
          </Alert>
        )}
      </Stack>

      {/* Add Message Modal */}
      <Modal opened={opened} onClose={close} title="Add Message to Queue" size="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Recipient Phone Number"
              placeholder="+1234567890"
              {...form.getInputProps('toNumber')}
              required
            />

            <Select
              label="WhatsApp Device"
              placeholder="Select connected device"
              data={devices.map(device => ({
                value: device.id,
                label: `${device.phoneNumber ? `(${device.phoneNumber})` : 'No Phone'} - ${device.serverName}`
              }))}
              {...form.getInputProps('instanceId')}
              required
            />

            <Textarea
              label="Message"
              placeholder="Enter your message..."
              rows={4}
              {...form.getInputProps('message')}
              required
            />

            <Select
              label="Priority"
              data={[
                { value: '0', label: 'Normal' },
                { value: '1', label: 'High' },
                { value: '2', label: 'Urgent' },
              ]}
              {...form.getInputProps('priority')}
            />

            <TextInput
              label="Schedule For (Optional)"
              type="datetime-local"
              {...form.getInputProps('scheduledAt')}
            />

            <Group justify="flex-end">
              <Button variant="subtle" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" leftSection={<IconSend size="1rem" />}>
                Add to Queue
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  )
}