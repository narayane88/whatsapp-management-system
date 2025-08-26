'use client'

import { useEffect, useState } from 'react'
import { Grid, Card, Text, Group, Stack, Badge, Button, Loader, Alert } from '@mantine/core'
import { 
  IconBrandWhatsapp, 
  IconUsers, 
  IconMessageCircle, 
  IconKey,
  IconServer,
  IconClock,
  IconInfoCircle
} from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import { useCustomerNotifications } from '@/hooks/useCustomerNotifications'

interface DashboardStats {
  whatsappInstances: number
  totalContacts: number
  messagesSent: number
  messagesToday: number
  messagesThisMonth: number
  apiKeys: number
  queuedMessages: number
  activePackage?: {
    name: string
    price: number
    duration: number
    messageLimit: number | null
    messagesUsed: number
    remainingMessages: number | null
    startDate: string
    expiryDate: string
    daysRemaining: number
    status: string
    usagePercentage: number | null
  }
}

export default function CustomerDashboard() {
  const { data: session } = useSession()
  const { isImpersonating, impersonationData } = useImpersonation()
  const { showQuotaNotification, showSystemNotification } = useCustomerNotifications()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [isImpersonating, impersonationData])

  const fetchDashboardStats = async () => {
    try {
      // Build URL with impersonation parameter if needed
      let url = '/api/customer/dashboard'
      if (isImpersonating && impersonationData) {
        url += `?impersonatedCustomerId=${impersonationData.targetUser.id}`
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      const data = await response.json()
      setStats(data)
      
      // Check for quota notifications
      if (data.activePackage?.usagePercentage) {
        const { usagePercentage, messagesUsed, messageLimit } = data.activePackage
        
        if (usagePercentage >= 95) {
          showQuotaNotification(
            `Critical: ${usagePercentage}% quota used! ${messagesUsed}/${messageLimit} messages.`,
            'error'
          )
        } else if (usagePercentage >= 80) {
          showQuotaNotification(
            `Warning: ${usagePercentage}% quota used. ${messagesUsed}/${messageLimit} messages.`,
            'warning'
          )
        }
      }
      
      // Check for subscription expiry
      if (data.activePackage?.daysRemaining <= 3) {
        showSystemNotification(
          `Subscription expires in ${data.activePackage.daysRemaining} days. Please renew soon.`,
          'warning'
        )
      }
    } catch (error) {
      console.error('Dashboard stats error:', error)
      setError('Failed to load dashboard data')
      // Set mock data for now
      setStats({
        whatsappInstances: 2,
        totalContacts: 150,
        messagesSent: 1250,
        apiKeys: 1,
        queuedMessages: 5,
        activePackage: {
          name: 'Professional',
          expiryDate: '2024-12-31',
          status: 'Active'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Loader size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert icon={<IconInfoCircle size="1rem" />} color="red" mb="md">
        {error}
      </Alert>
    )
  }

  return (
    <Stack gap="lg">
      {/* Enhanced Package Status */}
      {stats?.activePackage ? (
        <Card withBorder padding="lg" style={{
          background: stats.activePackage.status === 'Active' ? 
            'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.03) 100%)' : 
            'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.03) 100%)',
          border: `2px solid ${stats.activePackage.status === 'Active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`
        }}>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Group gap="sm" mb="xs">
                  <Text size="sm" c="dimmed" fw={500}>Current Subscription</Text>
                  <Badge 
                    color={stats.activePackage.status === 'Active' ? 'green' : 'red'}
                    size="sm"
                    variant="light"
                  >
                    {stats.activePackage.status}
                  </Badge>
                </Group>
                <Text size="xl" fw={700} mb="xs">{stats.activePackage.name}</Text>
                <Group gap="lg">
                  <div>
                    <Text size="xs" c="dimmed">Price</Text>
                    <Text size="sm" fw={600}>₹{stats.activePackage.price}</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Duration</Text>
                    <Text size="sm" fw={600}>{stats.activePackage.duration} days</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Days Remaining</Text>
                    <Text size="sm" fw={600} c={stats.activePackage.daysRemaining <= 3 ? 'red' : 'dark'}>
                      {stats.activePackage.daysRemaining} days
                    </Text>
                  </div>
                </Group>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text size="xs" c="dimmed">Expires On</Text>
                <Text size="sm" fw={600}>
                  {new Date(stats.activePackage.expiryDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </div>
            </Group>

            {/* Message Usage */}
            {stats.activePackage.messageLimit && (
              <div>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>Message Usage</Text>
                  <Text size="sm" fw={600}>
                    {stats.activePackage.messagesUsed.toLocaleString()} / {stats.activePackage.messageLimit.toLocaleString()}
                  </Text>
                </Group>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: 'rgba(226, 232, 240, 0.5)', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${stats.activePackage.usagePercentage || 0}%`,
                    height: '100%',
                    backgroundColor: (stats.activePackage.usagePercentage || 0) >= 90 ? '#ef4444' : 
                                    (stats.activePackage.usagePercentage || 0) >= 75 ? '#f59e0b' : '#10b981',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <Group justify="space-between" mt="xs">
                  <Text size="xs" c="dimmed">
                    {stats.activePackage.remainingMessages?.toLocaleString() || 0} messages remaining
                  </Text>
                  <Text size="xs" c="dimmed">
                    {stats.activePackage.usagePercentage || 0}% used
                  </Text>
                </Group>
              </div>
            )}

            {stats.activePackage.daysRemaining <= 7 && stats.activePackage.status === 'Active' && (
              <Alert color="yellow" variant="light" size="sm">
                <Text size="xs">
                  ⚠️ Your subscription expires in {stats.activePackage.daysRemaining} days. Please renew to continue using the service.
                </Text>
              </Alert>
            )}
          </Stack>
        </Card>
      ) : (
        <Card withBorder padding="lg" style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.03) 100%)',
          border: '2px solid rgba(239, 68, 68, 0.15)'
        }}>
          <Group justify="space-between" align="center">
            <div>
              <Group gap="sm" mb="xs">
                <Text size="sm" c="dimmed" fw={500}>Subscription Status</Text>
                <Badge color="red" size="sm" variant="light">No Active Package</Badge>
              </Group>
              <Text size="xl" fw={700} c="red" mb="xs">No Subscription</Text>
              <Text size="sm" c="dimmed">
                You need an active subscription to send WhatsApp messages. Purchase a package to get started.
              </Text>
            </div>
            <Button 
              color="blue" 
              component="a" 
              href="/customer/subscription"
              size="sm"
            >
              Buy Package
            </Button>
          </Group>
        </Card>
      )}

      {/* Stats Grid */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="lg" style={{ height: '100%' }}>
            <Group gap="sm">
              <IconBrandWhatsapp size={24} color="#25D366" />
              <div>
                <Text size="xl" fw={700}>
                  {stats?.whatsappInstances || 0}
                </Text>
                <Text size="sm" c="dimmed">
                  WhatsApp Devices
                </Text>
                <Text size="xs" c="green" fw={500}>
                  {stats?.whatsappInstances > 0 ? 'Connected' : 'No devices'}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="lg" style={{ height: '100%' }}>
            <Group gap="sm">
              <IconUsers size={24} color="#339af0" />
              <div>
                <Text size="xl" fw={700}>
                  {stats?.totalContacts?.toLocaleString() || 0}
                </Text>
                <Text size="sm" c="dimmed">
                  Total Contacts
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="lg" style={{ height: '100%' }}>
            <Group gap="sm" align="flex-start">
              <IconMessageCircle size={24} color="#51cf66" />
              <div style={{ flex: 1 }}>
                <Text size="xl" fw={700}>
                  {stats?.messagesSent?.toLocaleString() || 0}
                </Text>
                <Text size="sm" c="dimmed" mb="xs">
                  Total Messages Sent
                </Text>
                <Group gap="lg">
                  <div>
                    <Text size="xs" c="dimmed">Today</Text>
                    <Text size="sm" fw={600} c="green">
                      {stats?.messagesToday?.toLocaleString() || 0}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">This Month</Text>
                    <Text size="sm" fw={600} c="blue">
                      {stats?.messagesThisMonth?.toLocaleString() || 0}
                    </Text>
                  </div>
                </Group>
              </div>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="lg" style={{ height: '100%' }}>
            <Group gap="sm">
              <IconClock size={24} color="#ffd43b" />
              <div>
                <Text size="xl" fw={700}>
                  {stats?.queuedMessages || 0}
                </Text>
                <Text size="sm" c="dimmed">
                  Queued Messages
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="lg" style={{ height: '100%' }}>
            <Group gap="sm">
              <IconKey size={24} color="#e599f7" />
              <div>
                <Text size="xl" fw={700}>
                  {stats?.apiKeys || 0}
                </Text>
                <Text size="sm" c="dimmed">
                  API Keys
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
          <Card withBorder padding="lg" style={{ height: '100%' }}>
            <Group gap="sm">
              <IconServer size={24} color="#ff6b6b" />
              <div>
                <Text size="xl" fw={700}>
                  Connected
                </Text>
                <Text size="sm" c="dimmed">
                  Server Status
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Quick Actions */}
      <Card withBorder padding="lg">
        <Text size="lg" fw={600} mb="md">Quick Actions</Text>
        <Group gap="sm">
          <Button 
            leftSection={<IconBrandWhatsapp size="1rem" />}
            variant="light"
            component="a"
            href="/customer/whatsapp"
          >
            Manage WhatsApp
          </Button>
          <Button 
            leftSection={<IconUsers size="1rem" />}
            variant="light"
            component="a"
            href="/customer/contacts"
          >
            Add Contacts
          </Button>
          <Button 
            leftSection={<IconMessageCircle size="1rem" />}
            variant="light"
            component="a"
            href="/customer/whatsapp/queue"
          >
            Send Message
          </Button>
          <Button 
            leftSection={<IconKey size="1rem" />}
            variant="light"
            component="a"
            href="/customer/api-keys/docs"
          >
            API Documentation
          </Button>
        </Group>
      </Card>
    </Stack>
  )
}