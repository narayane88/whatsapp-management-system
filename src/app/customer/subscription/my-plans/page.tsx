'use client'

import { useState, useEffect } from 'react'
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
  Progress,
  Grid,
  ActionIcon,
  Tooltip,
  ScrollArea
} from '@mantine/core'
import {
  IconCrown,
  IconCalendar,
  IconMessage,
  IconRefresh,
  IconArrowLeft,
  IconCheck,
  IconX,
  IconClock,
  IconReceipt,
  IconPackage
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/navigation'
import CustomerHeader from '@/components/customer/CustomerHeader'

interface CurrentSubscription {
  id: string
  packageId: string
  packageName: string
  startDate: string
  endDate: string
  isActive: boolean
  messagesUsed: number
  messageLimit: number
  paymentMethod: string
  status: string
  price: number
  daysRemaining: number
}

interface SubscriptionHistory {
  id: string
  packageId: string
  packageName: string
  startDate: string
  endDate: string
  isActive: boolean
  messagesUsed: number
  messageLimit: number
  paymentMethod: string
  price: number
  status: string
  createdAt: string
}

interface MyPlansData {
  currentSubscription: CurrentSubscription | null
  subscriptionHistory: SubscriptionHistory[]
}

export default function MyPlansPage() {
  const router = useRouter()
  const [data, setData] = useState<MyPlansData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyPlans()
  }, [])

  const fetchMyPlans = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/customer/subscription', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription data')
      }
      
      const result = await response.json()
      setData({
        currentSubscription: result.currentSubscription,
        subscriptionHistory: result.subscriptionHistory
      })
      
    } catch (error) {
      console.error('Error fetching subscription data:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch subscription data',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green'
      case 'EXPIRED': return 'red'
      case 'PENDING': return 'yellow'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <IconCheck size="1rem" />
      case 'EXPIRED': return <IconX size="1rem" />
      case 'PENDING': return <IconClock size="1rem" />
      default: return <IconClock size="1rem" />
    }
  }

  if (loading) {
    return <LoadingOverlay visible />
  }

  if (!data) {
    return (
      <div>
        <CustomerHeader 
          title="My Subscriptions"
          subtitle="View your current plan and subscription history"
          badge={{ label: 'Account Management', color: 'blue' }}
        />
        <Container size="xl" py="md">
          <Alert color="red">Failed to load subscription data</Alert>
        </Container>
      </div>
    )
  }

  return (
    <div>
      <CustomerHeader 
        title="My Subscriptions"
        subtitle="View your current plan and subscription history"
        badge={{ label: 'Account Management', color: 'blue' }}
      />
      
      <Container size="xl" py="md">
        <Stack gap="lg">
          {/* Back Button */}
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size="1rem" />}
              onClick={() => router.push('/customer/subscription')}
            >
              Back to Packages
            </Button>
          </Group>

          {/* Current Subscription */}
          {data.currentSubscription ? (
            <Card withBorder padding="xl" style={{ backgroundColor: '#f0f8ff', border: '2px solid #4c6ef5' }}>
              <Group justify="space-between" mb="lg">
                <Group gap="sm">
                  <IconCrown size="2rem" color="#4c6ef5" />
                  <div>
                    <Title order={3}>Active Subscription</Title>
                    <Text c="dimmed">Your current plan details</Text>
                  </div>
                </Group>
                <Badge
                  color={getStatusColor(data.currentSubscription.status)}
                  variant="filled"
                  size="lg"
                  leftSection={getStatusIcon(data.currentSubscription.status)}
                >
                  {data.currentSubscription.status}
                </Badge>
              </Group>

              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <div>
                      <Text size="sm" c="dimmed">Package</Text>
                      <Text size="xl" fw={700}>{data.currentSubscription.packageName}</Text>
                    </div>
                    
                    <Group gap="xl">
                      <div>
                        <Text size="sm" c="dimmed">Monthly Price</Text>
                        <Text size="lg" fw={600}>₹{data.currentSubscription.price}</Text>
                      </div>
                      <div>
                        <Text size="sm" c="dimmed">Payment Method</Text>
                        <Text size="sm" fw={500} tt="capitalize">
                          {data.currentSubscription.paymentMethod}
                        </Text>
                      </div>
                    </Group>

                    <Group gap="xl">
                      <div>
                        <Text size="sm" c="dimmed">Start Date</Text>
                        <Text size="sm">
                          {new Date(data.currentSubscription.startDate).toLocaleDateString()}
                        </Text>
                      </div>
                      <div>
                        <Text size="sm" c="dimmed">End Date</Text>
                        <Text size="sm">
                          {new Date(data.currentSubscription.endDate).toLocaleDateString()}
                        </Text>
                      </div>
                    </Group>
                  </Stack>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap="md">
                    <div>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Days Remaining</Text>
                        <Text size="sm" fw={600} c="blue">
                          {data.currentSubscription.daysRemaining} days
                        </Text>
                      </Group>
                      <Progress 
                        value={Math.max(0, (data.currentSubscription.daysRemaining / 30) * 100)}
                        size="lg"
                        color="blue"
                      />
                    </div>

                    <div>
                      <Group justify="space-between" mb="xs">
                        <Text size="sm" c="dimmed">Messages Used</Text>
                        <Text size="sm" fw={600}>
                          {data.currentSubscription.messagesUsed}/{data.currentSubscription.messageLimit}
                        </Text>
                      </Group>
                      <Progress 
                        value={(data.currentSubscription.messagesUsed / data.currentSubscription.messageLimit) * 100}
                        size="lg"
                        color={data.currentSubscription.messagesUsed / data.currentSubscription.messageLimit > 0.8 ? 'red' : 'green'}
                      />
                    </div>

                    <Alert color="blue" icon={<IconMessage size="1rem" />}>
                      <Text size="sm">
                        You have {data.currentSubscription.messageLimit - data.currentSubscription.messagesUsed} messages remaining this month.
                      </Text>
                    </Alert>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>
          ) : (
            <Alert icon={<IconPackage size="1rem" />} color="orange">
              <Text size="sm">
                You don't have any active subscription. 
                <Button 
                  variant="subtle" 
                  size="sm" 
                  ml="sm"
                  onClick={() => router.push('/customer/subscription')}
                >
                  Browse Packages
                </Button>
              </Text>
            </Alert>
          )}

          {/* Subscription History */}
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Title order={4}>📋 Subscription History</Title>
              <Button
                variant="light"
                size="sm"
                onClick={fetchMyPlans}
                leftSection={<IconRefresh size="1rem" />}
              >
                Refresh
              </Button>
            </Group>

            {data.subscriptionHistory.length > 0 ? (
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Package</Table.Th>
                      <Table.Th>Duration</Table.Th>
                      <Table.Th>Price</Table.Th>
                      <Table.Th>Messages Used</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Payment Method</Table.Th>
                      <Table.Th>Created</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data.subscriptionHistory.map((subscription) => (
                      <Table.Tr key={subscription.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {subscription.packageName}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <IconCalendar size="0.8rem" />
                            <div>
                              <Text size="xs">
                                {new Date(subscription.startDate).toLocaleDateString()}
                              </Text>
                              <Text size="xs" c="dimmed">
                                to {new Date(subscription.endDate).toLocaleDateString()}
                              </Text>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            ₹{subscription.price}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Text size="sm">
                              {subscription.messagesUsed}/{subscription.messageLimit}
                            </Text>
                            {subscription.messageLimit > 0 && (
                              <Progress
                                value={(subscription.messagesUsed / subscription.messageLimit) * 100}
                                size="sm"
                                w={60}
                              />
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={getStatusColor(subscription.status)}
                            variant="light"
                            leftSection={getStatusIcon(subscription.status)}
                          >
                            {subscription.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" tt="capitalize">
                            {subscription.paymentMethod}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {new Date(subscription.createdAt).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            ) : (
              <Alert icon={<IconReceipt size="1rem" />}>
                <Text size="sm">No subscription history found.</Text>
              </Alert>
            )}
          </Card>
        </Stack>
      </Container>
    </div>
  )
}