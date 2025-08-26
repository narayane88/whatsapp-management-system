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
  IconInfoCircle,
  IconPackage,
  IconCoin,
  IconUserCircle,
  IconDevices,
  IconSend,
  IconHistory,
  IconMail,
  IconList,
  IconHome,
  IconFileText,
  IconChartBar,
  IconSettings
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
      {/* Quick Stats Summary */}
      <Card withBorder padding="lg" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)',
        border: '2px solid rgba(99, 102, 241, 0.1)'
      }}>
        <Group justify="space-between" mb="md">
          <Text size="xl" fw={700} c="indigo">Customer Dashboard Overview</Text>
          <Badge size="lg" variant="light" color="indigo">
            {isImpersonating ? `Viewing: ${impersonationData?.targetUser?.email}` : session?.user?.email}
          </Badge>
        </Group>
        <Grid>
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700} c="green">{stats?.whatsappInstances || 0}</Text>
              <Text size="xs" c="dimmed">WhatsApp Devices</Text>
            </div>
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700} c="blue">{stats?.totalContacts?.toLocaleString() || 0}</Text>
              <Text size="xs" c="dimmed">Total Contacts</Text>
            </div>
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700} c="violet">{stats?.messagesSent?.toLocaleString() || 0}</Text>
              <Text size="xs" c="dimmed">Messages Sent</Text>
            </div>
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <div style={{ textAlign: 'center' }}>
              <Text size="xl" fw={700} c="orange">{stats?.messagesToday || 0}</Text>
              <Text size="xs" c="dimmed">Today's Messages</Text>
            </div>
          </Grid.Col>
        </Grid>
      </Card>

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

      {/* Quick Actions Bar */}
      <Card withBorder padding="md" style={{
        background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, rgba(168, 85, 247, 0.05) 50%, rgba(34, 197, 94, 0.05) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.1)'
      }}>
        <Group justify="center" gap="sm">
          <Button 
            leftSection={<IconSend size="1rem" />}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            component="a"
            href="/customer/whatsapp/send"
            size="sm"
          >
            Send Message
          </Button>
          <Button 
            leftSection={<IconDevices size="1rem" />}
            variant="gradient"
            gradient={{ from: 'green', to: 'lime' }}
            component="a"
            href="/customer/whatsapp/devices"
            size="sm"
          >
            Connect Device
          </Button>
          <Button 
            leftSection={<IconUsers size="1rem" />}
            variant="gradient"
            gradient={{ from: 'violet', to: 'grape' }}
            component="a"
            href="/customer/contacts"
            size="sm"
          >
            Add Contacts
          </Button>
          <Button 
            leftSection={<IconPackage size="1rem" />}
            variant="gradient"
            gradient={{ from: 'orange', to: 'yellow' }}
            component="a"
            href="/customer/subscription"
            size="sm"
          >
            Upgrade Plan
          </Button>
        </Group>
      </Card>

      {/* Detailed Statistics */}
      <Stack gap="md">
        <Text size="xl" fw={700}>Detailed Statistics</Text>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder padding="lg" style={{ 
              height: '100%',
              background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.05) 0%, rgba(37, 211, 102, 0.02) 100%)'
            }}>
              <Group gap="sm">
                <div style={{
                  padding: '12px',
                  borderRadius: '50%',
                  background: 'rgba(37, 211, 102, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconBrandWhatsapp size={24} color="#25D366" />
                </div>
                <div>
                  <Text size="xl" fw={700} c="green">
                    {stats?.whatsappInstances || 0}
                  </Text>
                  <Text size="sm" c="dimmed" fw={500}>
                    WhatsApp Devices
                  </Text>
                  <Text size="xs" c={stats?.whatsappInstances > 0 ? 'green' : 'red'} fw={500}>
                    {stats?.whatsappInstances > 0 ? '● Connected' : '● No devices'}
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder padding="lg" style={{ 
              height: '100%',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)'
            }}>
              <Group gap="sm">
                <div style={{
                  padding: '12px',
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconUsers size={24} color="#3b82f6" />
                </div>
                <div>
                  <Text size="xl" fw={700} c="blue">
                    {stats?.totalContacts?.toLocaleString() || 0}
                  </Text>
                  <Text size="sm" c="dimmed" fw={500}>
                    Total Contacts
                  </Text>
                  <Text size="xs" c="blue" fw={500}>
                    ● Ready for messaging
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder padding="lg" style={{ 
              height: '100%',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(168, 85, 247, 0.02) 100%)'
            }}>
              <Group gap="sm" align="flex-start">
                <div style={{
                  padding: '12px',
                  borderRadius: '50%',
                  background: 'rgba(168, 85, 247, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconMessageCircle size={24} color="#a855f7" />
                </div>
                <div style={{ flex: 1 }}>
                  <Text size="xl" fw={700} c="violet">
                    {stats?.messagesSent?.toLocaleString() || 0}
                  </Text>
                  <Text size="sm" c="dimmed" fw={500} mb="xs">
                    Messages Sent
                  </Text>
                  <Group gap="md">
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

          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder padding="lg" style={{ 
              height: '100%',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)'
            }}>
              <Group gap="sm">
                <div style={{
                  padding: '12px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconList size={24} color="#f59e0b" />
                </div>
                <div>
                  <Text size="xl" fw={700} c="orange">
                    {stats?.queuedMessages || 0}
                  </Text>
                  <Text size="sm" c="dimmed" fw={500}>
                    Queued Messages
                  </Text>
                  <Text size="xs" c="orange" fw={500}>
                    ● Pending delivery
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder padding="lg" style={{ 
              height: '100%',
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(236, 72, 153, 0.02) 100%)'
            }}>
              <Group gap="sm">
                <div style={{
                  padding: '12px',
                  borderRadius: '50%',
                  background: 'rgba(236, 72, 153, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconKey size={24} color="#ec4899" />
                </div>
                <div>
                  <Text size="xl" fw={700} c="pink">
                    {stats?.apiKeys || 0}
                  </Text>
                  <Text size="sm" c="dimmed" fw={500}>
                    API Keys
                  </Text>
                  <Text size="xs" c="pink" fw={500}>
                    ● Active integrations
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
            <Card withBorder padding="lg" style={{ 
              height: '100%',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%)'
            }}>
              <Group gap="sm">
                <div style={{
                  padding: '12px',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconServer size={24} color="#22c55e" />
                </div>
                <div>
                  <Text size="xl" fw={700} c="green">
                    Online
                  </Text>
                  <Text size="sm" c="dimmed" fw={500}>
                    System Status
                  </Text>
                  <Text size="xs" c="green" fw={500}>
                    ● All services running
                  </Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>

      {/* Navigation Cards Grid */}
      <Stack gap="lg">
        <Text size="xl" fw={700}>Navigation Center</Text>
        
        {/* WhatsApp Management Section */}
        <Card withBorder padding="lg" style={{ background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.05) 0%, rgba(37, 211, 102, 0.02) 100%)' }}>
          <Text size="lg" fw={600} mb="md" c="green">WhatsApp Management</Text>
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconDevices size="1rem" />}
                variant="light"
                color="green"
                component="a"
                href="/customer/whatsapp/devices"
                size="sm"
              >
                Device Management
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconSend size="1rem" />}
                variant="light"
                color="green"
                component="a"
                href="/customer/whatsapp/send"
                size="sm"
              >
                Send Message
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconMail size="1rem" />}
                variant="light"
                color="green"
                component="a"
                href="/customer/whatsapp/bulk"
                size="sm"
              >
                Bulk Messages
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconList size="1rem" />}
                variant="light"
                color="green"
                component="a"
                href="/customer/whatsapp/queue"
                size="sm"
              >
                Message Queue
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconHistory size="1rem" />}
                variant="light"
                color="green"
                component="a"
                href="/customer/whatsapp/sent"
                size="sm"
              >
                Sent Messages
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconBrandWhatsapp size="1rem" />}
                variant="light"
                color="green"
                component="a"
                href="/customer/whatsapp"
                size="sm"
              >
                WhatsApp Overview
              </Button>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Account Management Section */}
        <Card withBorder padding="lg" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)' }}>
          <Text size="lg" fw={600} mb="md" c="blue">Account & Billing</Text>
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconPackage size="1rem" />}
                variant="light"
                color="blue"
                component="a"
                href="/customer/subscription"
                size="sm"
              >
                Manage Subscription
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconPackage size="1rem" />}
                variant="light"
                color="blue"
                component="a"
                href="/customer/packages"
                size="sm"
              >
                Browse Packages
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconCoin size="1rem" />}
                variant="light"
                color="blue"
                component="a"
                href="/customer/bizcoins"
                size="sm"
              >
                BizCoins Wallet
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconUserCircle size="1rem" />}
                variant="light"
                color="blue"
                component="a"
                href="/customer/profile"
                size="sm"
              >
                Profile Settings
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconHome size="1rem" />}
                variant="light"
                color="blue"
                component="a"
                href="/customer/host"
                size="sm"
              >
                Host Settings
              </Button>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Data & API Management Section */}
        <Card withBorder padding="lg" style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(168, 85, 247, 0.02) 100%)' }}>
          <Text size="lg" fw={600} mb="md" c="violet">Data & API Management</Text>
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconUsers size="1rem" />}
                variant="light"
                color="violet"
                component="a"
                href="/customer/contacts"
                size="sm"
              >
                Manage Contacts
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconKey size="1rem" />}
                variant="light"
                color="violet"
                component="a"
                href="/customer/api-keys"
                size="sm"
              >
                API Keys
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Button 
                fullWidth
                leftSection={<IconFileText size="1rem" />}
                variant="light"
                color="violet"
                component="a"
                href="/customer/api-keys/docs"
                size="sm"
              >
                API Documentation
              </Button>
            </Grid.Col>
          </Grid>
        </Card>
      </Stack>
    </Stack>
  )
}