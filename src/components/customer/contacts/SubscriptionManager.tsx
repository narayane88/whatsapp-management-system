'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { useWhatsAppRealTime } from '@/hooks/useWhatsAppRealTime'

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

interface ConnectedDevice {
  id: string
  accountName: string
  phoneNumber?: string
  status: string
  serverName: string
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
  
  // WhatsApp devices state
  const [devices, setDevices] = useState<ConnectedDevice[]>([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  
  // Groups state for Target Group dropdown
  const [groups, setGroups] = useState<any[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [selectedGroupRecipients, setSelectedGroupRecipients] = useState(0)
  
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

  // Real-time device status updates
  const handleDeviceStatusUpdate = useCallback((data: any) => {
    if (data.devices) {
      // Show all devices, not just connected ones
      setDevices(data.devices)
    }
  }, [])

  // Initialize real-time connection
  const { isConnected } = useWhatsAppRealTime({
    onDeviceStatus: handleDeviceStatusUpdate,
    enableNotifications: false, // Don't need notifications in this component
    enableSounds: false,
    autoReconnect: true
  })

  useEffect(() => {
    fetchSubscribers()
    fetchSubscriptionStats()
    fetchConnectedDevices()
    fetchGroups()
  }, [currentPage, searchTerm, statusFilter])

  // Recalculate recipients when group selection or subscriber filter changes
  useEffect(() => {
    if (broadcastForm.values.groupFilter) {
      calculateGroupRecipients(broadcastForm.values.groupFilter, broadcastForm.values.subscribersOnly)
    } else {
      setSelectedGroupRecipients(0)
    }
  }, [broadcastForm.values.groupFilter, broadcastForm.values.subscribersOnly])

  const fetchSubscribers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        status: statusFilter,
      })

      // Use the contacts API with subscription filters
      const contactsParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        ...(statusFilter === 'subscribed' && { isSubscribed: 'true' }),
        ...(statusFilter === 'unsubscribed' && { isSubscribed: 'false' })
      })
      const response = await fetch(`/api/customer/contacts?${contactsParams}`)
      if (response.ok) {
        const data = await response.json()
        // Map API response to component format
        const mappedSubscribers = data.data.map((contact: any) => ({
          id: contact.id,
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          email: contact.email,
          isSubscribed: contact.isSubscribed,
          subscriptionDate: contact.createdAt,
          subscriptionSource: 'manual',
          groups: contact.groups ? contact.groups.map((g: any) => g.group.name) : [],
          messagesSent: 0,
          lastMessageDate: null
        }))
        setSubscribers(mappedSubscribers)
        setTotalPages(data.pagination.totalPages)
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

  const fetchConnectedDevices = async () => {
    try {
      setDevicesLoading(true)
      const response = await fetch('/api/customer/host/connections')
      if (response.ok) {
        const allDevices = await response.json()
        // Process through real-time handler for consistency
        handleDeviceStatusUpdate({ devices: allDevices })
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch connected devices',
        color: 'red'
      })
    } finally {
      setDevicesLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      setGroupsLoading(true)
      const response = await fetch('/api/customer/groups')
      if (response.ok) {
        const groupsData = await response.json()
        setGroups(groupsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch groups',
        color: 'red'
      })
    } finally {
      setGroupsLoading(false)
    }
  }

  const calculateGroupRecipients = async (groupId: string, subscribersOnly: boolean) => {
    if (!groupId) {
      setSelectedGroupRecipients(0)
      return
    }

    try {
      console.log(`🔍 Calculating recipients for group ${groupId}, subscribersOnly: ${subscribersOnly}`)
      const groupResponse = await fetch(`/api/customer/groups/${groupId}`)
      if (groupResponse.ok) {
        const groupData = await groupResponse.json()
        const contactMembers = groupData.contacts || []
        
        console.log('📋 Group contact members data:', contactMembers)
        
        // Extract the actual contact data from the nested structure
        const contacts = contactMembers.map((member: any) => member.contact)
        
        console.log('📊 Actual contact details:', contacts.map((c: any) => ({
          name: c.name,
          phoneNumber: c.phoneNumber,
          isSubscribed: c.isSubscribed,
          isBlocked: c.isBlocked
        })))
        
        let count = 0
        if (subscribersOnly) {
          const subscribedContacts = contacts.filter((contact: any) => contact.isSubscribed && !contact.isBlocked)
          count = subscribedContacts.length
          console.log(`✅ Subscribed & unblocked contacts: ${count}`)
        } else {
          const unblockedContacts = contacts.filter((contact: any) => !contact.isBlocked)
          count = unblockedContacts.length
          console.log(`📋 All unblocked contacts: ${count}`)
        }
        
        setSelectedGroupRecipients(count)
        console.log(`🎯 Final recipient count: ${count}`)
      }
    } catch (error) {
      console.error('Error calculating group recipients:', error)
      setSelectedGroupRecipients(0)
    }
  }

  const fetchSubscriptionStats = async () => {
    try {
      const response = await fetch('/api/customer/contacts/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalSubscribers: data.subscribedContacts,
          totalUnsubscribed: data.unsubscribedContacts,
          newThisWeek: 0, // Not available in current API
          messagesSentThisMonth: 0 // Not available in current API
        })
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
      // Get the selected device
      const selectedDeviceObj = devices.find(device => device.id === values.instanceId)
      if (!selectedDeviceObj) {
        notifications.show({
          title: 'Error',
          message: 'Selected device not found',
          color: 'red',
        })
        return
      }

      // Build recipient list based on filters
      let recipients: SubscriberContact[] = []
      
      if (values.groupFilter) {
        // Get contacts from specific group
        try {
          const groupResponse = await fetch(`/api/customer/groups/${values.groupFilter}`)
          if (groupResponse.ok) {
            const groupData = await groupResponse.json()
            recipients = groupData.contacts || []
            
            // Apply subscription filter
            if (values.subscribersOnly) {
              recipients = recipients.filter(contact => contact.isSubscribed && !contact.isBlocked)
            }
          }
        } catch (groupError) {
          console.error('Failed to fetch group contacts:', groupError)
          notifications.show({
            title: 'Error',
            message: 'Failed to fetch group contacts',
            color: 'red',
          })
          return
        }
      } else {
        // Use current subscribers list
        recipients = subscribers.filter(contact => {
          if (values.subscribersOnly) {
            return contact.isSubscribed && !contact.isBlocked
          }
          return !contact.isBlocked
        })
      }

      if (recipients.length === 0) {
        notifications.show({
          title: 'No Recipients',
          message: 'No contacts match the selected criteria',
          color: 'yellow',
        })
        return
      }

      // Add messages to queue (like bulk messaging page)
      let successCount = 0
      let failureCount = 0
      
      notifications.show({
        title: 'Queueing Broadcast',
        message: `Adding ${recipients.length} messages to queue...`,
        color: 'blue',
      })

      for (const recipient of recipients) {
        try {
          const queueData = {
            toNumber: recipient.phoneNumber,
            message: values.message,
            messageType: 'text',
            priority: 0,
            instanceId: selectedDeviceObj.accountName,
            instanceName: selectedDeviceObj.accountName,
            metadata: {
              messageType: 'text',
              recipientName: recipient.name,
              broadcastMessageId: Date.now().toString(),
              source: 'subscription_broadcast'
            }
          }

          const response = await fetch('/api/customer/whatsapp/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queueData)
          })

          if (response.ok) {
            successCount++
          } else {
            failureCount++
            const errorText = await response.text()
            console.error(`Failed to queue message for ${recipient.phoneNumber}:`, errorText)
          }
          
        } catch (sendError) {
          failureCount++
          console.error(`Error queueing message for ${recipient.phoneNumber}:`, sendError)
        }
      }

      // Show final results
      if (successCount > 0) {
        notifications.show({
          title: 'Broadcast Queued',
          message: `Successfully queued ${successCount}/${recipients.length} messages${failureCount > 0 ? `. ${failureCount} failed to queue.` : ''}`,
          color: successCount === recipients.length ? 'green' : 'yellow',
          autoClose: 5000
        })
      } else {
        notifications.show({
          title: 'Broadcast Failed',
          message: `Failed to queue all ${recipients.length} messages`,
          color: 'red',
        })
      }
      
      closeBroadcastModal()
      broadcastForm.reset()
      
    } catch (error) {
      console.error('Broadcast error:', error)
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
            onClick={() => {
              // Refresh devices and groups when opening broadcast modal
              fetchConnectedDevices()
              fetchGroups()
              openBroadcastModal()
            }}
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
              placeholder={devicesLoading ? "Loading devices..." : devices.length === 0 ? "No devices available" : "Select instance to send from"}
              data={devices.map(device => ({
                value: device.id,
                label: `${device.accountName} (${device.phoneNumber || 'No phone'}) - ${device.status}`
              }))}
              {...broadcastForm.getInputProps('instanceId')}
              required
              disabled={devicesLoading || devices.length === 0}
            />
            
            {devices.length > 0 && (
              <Alert color="blue" variant="light">
                {devices.length} instance(s) available
              </Alert>
            )}
            
            {devices.length === 0 && !devicesLoading && (
              <Alert color="yellow" variant="light">
                No WhatsApp instances available. Please connect a device first.
              </Alert>
            )}

            <Textarea
              label="Message"
              placeholder="Enter your broadcast message..."
              rows={4}
              {...broadcastForm.getInputProps('message')}
              required
            />

            <Select
              label="Target Group (Optional)"
              placeholder={groupsLoading ? "Loading groups..." : "Send to specific group only"}
              data={[
                { value: '', label: 'All Contacts' },
                ...groups.map(group => ({
                  value: group.id,
                  label: `${group.name} (${group._count?.contacts || 0} contacts)`
                }))
              ]}
              {...broadcastForm.getInputProps('groupFilter')}
              disabled={groupsLoading}
              onChange={(value) => {
                broadcastForm.setFieldValue('groupFilter', value || '')
                // Manually trigger recipient calculation
                if (value) {
                  calculateGroupRecipients(value, broadcastForm.values.subscribersOnly)
                } else {
                  setSelectedGroupRecipients(0)
                }
              }}
            />

            <Switch
              label="Subscribers Only"
              description="Only send to contacts who have subscribed to receive messages"
              {...broadcastForm.getInputProps('subscribersOnly')}
            />

            <Alert color="blue" variant="light">
              Estimated recipients: {
                (() => {
                  if (broadcastForm.values.groupFilter) {
                    return broadcastForm.values.subscribersOnly ? 
                      `${selectedGroupRecipients} (subscribed from group)` : 
                      `${selectedGroupRecipients} (from group)`
                  } else {
                    return broadcastForm.values.subscribersOnly ? 
                      stats.totalSubscribers : 
                      stats.totalSubscribers + stats.totalUnsubscribed
                  }
                })()
              }
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