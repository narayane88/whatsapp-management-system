'use client'

import { useEffect, useState } from 'react'
import { 
  Grid, 
  Card, 
  Text, 
  Button, 
  Group, 
  Stack, 
  Badge, 
  Tabs,
  Alert,
  LoadingOverlay
} from '@mantine/core'
import { 
  IconBrandWhatsapp, 
  IconClock, 
  IconSend, 
  IconInbox, 
  IconExclamationMark,
  IconUsers,
  IconMessageCircle,
  IconInfoCircle
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

interface WhatsAppInstance {
  id: string
  name: string
  phoneNumber?: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR'
  lastSeenAt?: string
  messageCount: number
}

interface WhatsAppStats {
  instances: WhatsAppInstance[]
  totalMessages: number
  queuedMessages: number
  sentToday: number
  receivedToday: number
  complaints: number
  scheduledMessages: number
  groups: number
}

export default function WhatsAppOverview() {
  const [stats, setStats] = useState<WhatsAppStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWhatsAppStats()
  }, [])

  const fetchWhatsAppStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customer/whatsapp/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        // Mock data for now
        setStats({
          instances: [
            {
              id: '1',
              name: 'Business Account',
              phoneNumber: '+1234567890',
              status: 'CONNECTED',
              lastSeenAt: new Date().toISOString(),
              messageCount: 1250
            },
            {
              id: '2',
              name: 'Support Account',
              phoneNumber: '+1234567891',
              status: 'DISCONNECTED',
              lastSeenAt: new Date(Date.now() - 3600000).toISOString(),
              messageCount: 850
            }
          ],
          totalMessages: 2100,
          queuedMessages: 15,
          sentToday: 45,
          receivedToday: 38,
          complaints: 2,
          scheduledMessages: 8,
          groups: 5
        })
      }
    } catch (error) {
      console.error('WhatsApp stats error:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load WhatsApp data',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'green'
      case 'CONNECTING': return 'yellow'
      case 'DISCONNECTED': return 'gray'
      case 'ERROR': return 'red'
      default: return 'gray'
    }
  }

  if (loading) {
    return <LoadingOverlay visible />
  }

  return (
    <Stack gap="lg">
      {/* Overview Stats */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder padding="lg">
            <Group gap="sm">
              <IconClock size={24} color="#ffd43b" />
              <div>
                <Text size="xl" fw={700}>{stats?.queuedMessages || 0}</Text>
                <Text size="sm" c="dimmed">Queued</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder padding="lg">
            <Group gap="sm">
              <IconSend size={24} color="#51cf66" />
              <div>
                <Text size="xl" fw={700}>{stats?.sentToday || 0}</Text>
                <Text size="sm" c="dimmed">Sent Today</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder padding="lg">
            <Group gap="sm">
              <IconInbox size={24} color="#339af0" />
              <div>
                <Text size="xl" fw={700}>{stats?.receivedToday || 0}</Text>
                <Text size="sm" c="dimmed">Received Today</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder padding="lg">
            <Group gap="sm">
              <IconExclamationMark size={24} color="#ff6b6b" />
              <div>
                <Text size="xl" fw={700}>{stats?.complaints || 0}</Text>
                <Text size="sm" c="dimmed">Complaints</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* WhatsApp Instances */}
      <Card withBorder padding="lg">
        <Group justify="space-between" mb="md">
          <Text size="lg" fw={600}>WhatsApp Instances</Text>
          <Button 
            leftSection={<IconBrandWhatsapp size="1rem" />}
            component="a"
            href="/customer/host"
          >
            Add Instance
          </Button>
        </Group>
        
        {stats?.instances && stats.instances.length > 0 ? (
          <Stack gap="md">
            {stats.instances.map((instance) => (
              <Card key={instance.id} withBorder padding="md" bg="gray.0">
                <Group justify="space-between">
                  <Group gap="md">
                    <IconBrandWhatsapp size={24} color="#25D366" />
                    <div>
                      <Text fw={500}>{instance.name}</Text>
                      <Text size="sm" c="dimmed">{instance.phoneNumber}</Text>
                    </div>
                  </Group>
                  
                  <Group gap="md">
                    <div style={{ textAlign: 'right' }}>
                      <Text size="sm" fw={500}>{instance.messageCount} messages</Text>
                      <Text size="xs" c="dimmed">
                        Last seen: {instance.lastSeenAt ? 
                          new Date(instance.lastSeenAt).toLocaleString() : 
                          'Never'
                        }
                      </Text>
                    </div>
                    <Badge color={getStatusColor(instance.status)}>
                      {instance.status}
                    </Badge>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        ) : (
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            No WhatsApp instances found. Add your first instance to get started.
          </Alert>
        )}
      </Card>

      {/* Quick Navigation Tabs */}
      <Tabs defaultValue="queue">
        <Tabs.List>
          <Tabs.Tab 
            value="queue" 
            leftSection={<IconClock size="1rem" />}
          >
            Queue ({stats?.queuedMessages || 0})
          </Tabs.Tab>
          <Tabs.Tab 
            value="sent" 
            leftSection={<IconSend size="1rem" />}
          >
            Sent
          </Tabs.Tab>
          <Tabs.Tab 
            value="received" 
            leftSection={<IconInbox size="1rem" />}
          >
            Received
          </Tabs.Tab>
          <Tabs.Tab 
            value="complaints" 
            leftSection={<IconExclamationMark size="1rem" />}
          >
            Complaints ({stats?.complaints || 0})
          </Tabs.Tab>
          <Tabs.Tab 
            value="scheduled" 
            leftSection={<IconClock size="1rem" />}
          >
            Scheduled ({stats?.scheduledMessages || 0})
          </Tabs.Tab>
          <Tabs.Tab 
            value="groups" 
            leftSection={<IconUsers size="1rem" />}
          >
            Groups ({stats?.groups || 0})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="queue" pt="md">
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={600}>Message Queue</Text>
              <Button 
                component="a" 
                href="/customer/whatsapp/queue"
                leftSection={<IconMessageCircle size="1rem" />}
              >
                View All Queued Messages
              </Button>
            </Group>
            <Text c="dimmed">
              {stats?.queuedMessages || 0} messages waiting to be sent
            </Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="sent" pt="md">
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={600}>Sent Messages</Text>
              <Button 
                component="a" 
                href="/customer/whatsapp/sent"
                leftSection={<IconSend size="1rem" />}
              >
                View All Sent Messages
              </Button>
            </Group>
            <Text c="dimmed">
              {stats?.sentToday || 0} messages sent today
            </Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="received" pt="md">
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={600}>Received Messages</Text>
              <Button 
                component="a" 
                href="/customer/whatsapp/received"
                leftSection={<IconInbox size="1rem" />}
              >
                View All Received Messages
              </Button>
            </Group>
            <Text c="dimmed">
              {stats?.receivedToday || 0} messages received today
            </Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="complaints" pt="md">
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={600}>Complaints</Text>
              <Button 
                component="a" 
                href="/customer/whatsapp/complaints"
                leftSection={<IconExclamationMark size="1rem" />}
              >
                Manage Complaints
              </Button>
            </Group>
            <Text c="dimmed">
              {stats?.complaints || 0} active complaints to resolve
            </Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="scheduled" pt="md">
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={600}>Scheduled Messages</Text>
              <Button 
                component="a" 
                href="/customer/whatsapp/scheduled"
                leftSection={<IconClock size="1rem" />}
              >
                Manage Scheduled Messages
              </Button>
            </Group>
            <Text c="dimmed">
              {stats?.scheduledMessages || 0} messages scheduled for future delivery
            </Text>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="groups" pt="md">
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Text size="lg" fw={600}>WhatsApp Groups</Text>
              <Button 
                component="a" 
                href="/customer/whatsapp/groups"
                leftSection={<IconUsers size="1rem" />}
              >
                Manage Groups
              </Button>
            </Group>
            <Text c="dimmed">
              {stats?.groups || 0} groups available for messaging
            </Text>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}