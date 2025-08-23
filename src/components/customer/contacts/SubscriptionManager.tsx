'use client'

import { useEffect, useState } from 'react'
import { 
  Stack,
  Group,
  Button,
  TextInput,
  Table,
  Badge,
  Card,
  Text,
  Switch,
  Modal,
  Textarea,
  Select,
  Alert,
  Pagination,
  LoadingOverlay,
  ActionIcon,
  Grid,
  Progress
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  IconSearch,
  IconBell,
  IconBellOff,
  IconMessageCircle,
  IconInfoCircle,
  IconSend,
  IconUsers,
  IconPlus
} from '@tabler/icons-react'

interface SubscriberContact {
  id: string
  name: string
  phoneNumber: string
  email?: string
  isSubscribed: boolean
  subscriptionDate?: string
  unsubscriptionDate?: string
  subscriptionSource: 'manual' | 'opt_in' | 'import' | 'api'
  groups: string[]
  messagesSent: number
  lastMessageDate?: string
}

interface BroadcastForm {
  message: string
  groupFilter: string
  subscribersOnly: boolean
  instanceId: string
}

interface SubscriptionManagerProps {
  onStatsChange: () => void
}

export default function SubscriptionManager({ onStatsChange }: SubscriptionManagerProps) {
  const [subscribers, setSubscribers] = useState<SubscriberContact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('subscribed')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    totalUnsubscribed: 0,
    newThisWeek: 0,
    messagesSentThisMonth: 0
  })
  
  const [broadcastModalOpened, { open: openBroadcastModal, close: closeBroadcastModal }] = useDisclosure(false)

  const broadcastForm = useForm<BroadcastForm>({
    initialValues: {
      message: '',
      groupFilter: '',
      subscribersOnly: true,
      instanceId: '',
    },
    validate: {
      message: (value) => (!value ? 'Message is required' : null),
      instanceId: (value) => (!value ? 'WhatsApp instance is required' : null),
    },
  })

  useEffect(() => {
    fetchSubscribers()
    fetchSubscriptionStats()
  }, [currentPage, searchTerm, statusFilter])

  const fetchSubscribers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        status: statusFilter,
      })

      const response = await fetch(`/api/customer/contacts/subscriptions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSubscribers(data.subscribers)
        setTotalPages(data.totalPages)
      } else {
        // Mock data for now
        setSubscribers([
          {
            id: '1',
            name: 'John Smith',
            phoneNumber: '+1234567890',
            email: 'john@example.com',
            isSubscribed: true,
            subscriptionDate: new Date(Date.now() - 86400000 * 30).toISOString(),
            subscriptionSource: 'opt_in',
            groups: ['VIP Customers', 'Newsletter'],
            messagesSent: 45,
            lastMessageDate: new Date(Date.now() - 86400000 * 2).toISOString()
          },
          {
            id: '2',
            name: 'Jane Doe',
            phoneNumber: '+1234567891',
            email: 'jane@example.com',
            isSubscribed: true,
            subscriptionDate: new Date(Date.now() - 86400000 * 15).toISOString(),
            subscriptionSource: 'manual',
            groups: ['Newsletter'],
            messagesSent: 23,
            lastMessageDate: new Date(Date.now() - 86400000 * 5).toISOString()
          },
          {
            id: '3',
            name: 'Bob Wilson',
            phoneNumber: '+1234567892',
            email: 'bob@example.com',
            isSubscribed: false,
            subscriptionDate: new Date(Date.now() - 86400000 * 60).toISOString(),
            unsubscriptionDate: new Date(Date.now() - 86400000 * 5).toISOString(),
            subscriptionSource: 'import',
            groups: [],
            messagesSent: 12,
            lastMessageDate: new Date(Date.now() - 86400000 * 10).toISOString()
          }
        ])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Subscribers fetch error:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load subscribers',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptionStats = async () => {
    try {
      const response = await fetch('/api/customer/contacts/subscription-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        // Mock data for now
        setStats({
          totalSubscribers: 142,
          totalUnsubscribed: 8,
          newThisWeek: 12,
          messagesSentThisMonth: 1250
        })
      }
    } catch (error) {
      console.error('Subscription stats error:', error)
    }
  }

  const handleToggleSubscription = async (contactId: string, isSubscribed: boolean) => {
    try {
      const response = await fetch(`/api/customer/contacts/${contactId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSubscribed: !isSubscribed }),
      })

      if (response.ok) {
        fetchSubscribers()
        fetchSubscriptionStats()
        onStatsChange()
        notifications.show({
          title: 'Success',
          message: `Contact ${!isSubscribed ? 'subscribed' : 'unsubscribed'}`,
          color: 'green',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update subscription',
        color: 'red',
      })
    }
  }

  const handleBroadcast = async (values: BroadcastForm) => {
    try {
      const response = await fetch('/api/customer/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          targetType: 'subscribers',
          filters: {
            subscriptionStatus: values.subscribersOnly ? 'subscribed' : 'all',
            groups: values.groupFilter ? [values.groupFilter] : []
          }
        }),
      })

      if (response.ok) {
        const result = await response.json()
        notifications.show({
          title: 'Broadcast Sent',
          message: `Message queued for ${result.recipientCount} recipients`,
          color: 'green',
        })
        closeBroadcastModal()
        broadcastForm.reset()
      } else {
        throw new Error('Failed to send broadcast')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to send broadcast message',
        color: 'red',
      })
    }
  }

  const getSubscriptionColor = (isSubscribed: boolean) => {
    return isSubscribed ? 'green' : 'red'
  }

  const getSubscriptionIcon = (isSubscribed: boolean) => {
    return isSubscribed ? <IconBell size="1rem" /> : <IconBellOff size="1rem" />
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'opt_in': return 'green'
      case 'manual': return 'blue'
      case 'import': return 'orange'
      case 'api': return 'purple'
      default: return 'gray'
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} />
      
      <Stack gap="md">
        {/* Stats Cards */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="md" bg="green.0">
              <Group gap="sm">
                <IconBell size={20} color="green" />
                <div>
                  <Text size="lg" fw={700} c="green">{stats.totalSubscribers}</Text>
                  <Text size="xs" c="dimmed">Subscribed</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="md" bg="red.0">
              <Group gap="sm">
                <IconBellOff size={20} color="red" />
                <div>
                  <Text size="lg" fw={700} c="red">{stats.totalUnsubscribed}</Text>
                  <Text size="xs" c="dimmed">Unsubscribed</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="md" bg="blue.0">
              <Group gap="sm">
                <IconUsers size={20} color="blue" />
                <div>
                  <Text size="lg" fw={700} c="blue">{stats.newThisWeek}</Text>
                  <Text size="xs" c="dimmed">New This Week</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="md" bg="orange.0">
              <Group gap="sm">
                <IconMessageCircle size={20} color="orange" />
                <div>
                  <Text size="lg" fw={700} c="orange">{stats.messagesSentThisMonth}</Text>
                  <Text size="xs" c="dimmed">Messages This Month</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Filters and Actions */}
        <Group justify="space-between">
          <Group gap="sm">
            <TextInput
              placeholder="Search subscribers..."
              leftSection={<IconSearch size="1rem" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              style={{ minWidth: 250 }}
            />
            <Select
              placeholder="Filter by status"
              data={[
                { value: 'subscribed', label: 'Subscribed Only' },
                { value: 'unsubscribed', label: 'Unsubscribed Only' },
                { value: 'all', label: 'All Contacts' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || 'subscribed')}
            />
          </Group>
          
          <Button 
            leftSection={<IconSend size="1rem" />}
            onClick={openBroadcastModal}
          >
            Broadcast Message
          </Button>
        </Group>

        {/* Subscribers Table */}
        {subscribers.length > 0 ? (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Contact</Table.Th>
                <Table.Th>Phone</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th>Groups</Table.Th>
                <Table.Th>Messages</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {subscribers.map((subscriber) => (
                <Table.Tr key={subscriber.id}>
                  <Table.Td>
                    <div>
                      <Text fw={500} size="sm">{subscriber.name}</Text>
                      {subscriber.email && (
                        <Text size="xs" c="dimmed">{subscriber.email}</Text>
                      )}
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{subscriber.phoneNumber}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={4}>
                      <Group gap="xs">
                        {getSubscriptionIcon(subscriber.isSubscribed)}
                        <Badge color={getSubscriptionColor(subscriber.isSubscribed)} size="sm">
                          {subscriber.isSubscribed ? 'Subscribed' : 'Unsubscribed'}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {subscriber.isSubscribed 
                          ? `Since ${new Date(subscriber.subscriptionDate!).toLocaleDateString()}`
                          : `Unsubscribed ${new Date(subscriber.unsubscriptionDate!).toLocaleDateString()}`
                        }
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getSourceColor(subscriber.subscriptionSource)} size="sm" variant="light">
                      {subscriber.subscriptionSource.replace('_', ' ')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {subscriber.groups.slice(0, 2).map((group) => (
                        <Badge key={group} variant="light" size="xs">
                          {group}
                        </Badge>
                      ))}
                      {subscriber.groups.length > 2 && (
                        <Badge variant="light" size="xs" c="dimmed">
                          +{subscriber.groups.length - 2}
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <div>
                      <Text size="sm" fw={500}>{subscriber.messagesSent}</Text>
                      {subscriber.lastMessageDate && (
                        <Text size="xs" c="dimmed">
                          Last: {new Date(subscriber.lastMessageDate).toLocaleDateString()}
                        </Text>
                      )}
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Switch
                      checked={subscriber.isSubscribed}
                      onChange={() => handleToggleSubscription(subscriber.id, subscriber.isSubscribed)}
                      size="sm"
                      onLabel="ON"
                      offLabel="OFF"
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            No subscribers found matching your filters.
          </Alert>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Group justify="center">
            <Pagination 
              total={totalPages} 
              value={currentPage} 
              onChange={setCurrentPage}
            />
          </Group>
        )}
      </Stack>

      {/* Broadcast Modal */}
      <Modal 
        opened={broadcastModalOpened} 
        onClose={closeBroadcastModal} 
        title="Broadcast Message"
        size="lg"
      >
        <form onSubmit={broadcastForm.onSubmit(handleBroadcast)}>
          <Stack gap="md">
            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
              This will send a message to all selected subscribers. Be mindful of message limits and spam policies.
            </Alert>

            <Select
              label="WhatsApp Instance"
              placeholder="Select instance to send from"
              data={[
                { value: '1', label: 'Business Account (+1234567890)' },
                { value: '2', label: 'Support Account (+1234567891)' },
              ]}
              {...broadcastForm.getInputProps('instanceId')}
              required
            />

            <Textarea
              label="Message"
              placeholder="Enter your broadcast message..."
              rows={4}
              {...broadcastForm.getInputProps('message')}
              required
            />

            <Select
              label="Target Group (Optional)"
              placeholder="Send to specific group only"
              data={[
                { value: '', label: 'All Contacts' },
                { value: 'vip-customers', label: 'VIP Customers' },
                { value: 'newsletter', label: 'Newsletter Subscribers' },
                { value: 'support-leads', label: 'Support Leads' },
              ]}
              {...broadcastForm.getInputProps('groupFilter')}
            />

            <Switch
              label="Subscribers Only"
              description="Only send to contacts who have subscribed to receive messages"
              {...broadcastForm.getInputProps('subscribersOnly')}
            />

            <Alert color="yellow">
              Estimated recipients: {statusFilter === 'subscribed' ? stats.totalSubscribers : stats.totalSubscribers + stats.totalUnsubscribed}
            </Alert>

            <Group justify="flex-end">
              <Button variant="subtle" onClick={closeBroadcastModal}>
                Cancel
              </Button>
              <Button 
                type="submit"
                leftSection={<IconSend size="1rem" />}
                color="orange"
              >
                Send Broadcast
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  )
}