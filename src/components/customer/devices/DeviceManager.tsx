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
  ActionIcon,
  LoadingOverlay,
  Alert,
  Progress,
  Container,
  Image,
  Tabs,
  Center
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { 
  IconBrandWhatsapp, 
  IconQrcode, 
  IconRefresh,
  IconTrash,
  IconPlus,
  IconWifi,
  IconWifiOff,
  IconInfoCircle,
  IconDeviceMobile,
  IconCheck,
  IconClock,
  IconMessage,
  IconPhone,
  IconServer,
  IconSettings,
  IconScan,
  IconArrowRight
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import WhatsAppQRModal from '@/components/qr/WhatsAppQRModal'

interface WhatsAppConnection {
  id: string
  serverId: string
  serverName: string
  accountName: string
  phoneNumber?: string
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'AUTHENTICATING' | 'ERROR'
  qrCode?: string
  lastActivity?: string
  messageCount: number
  createdAt?: string
  updatedAt?: string
}

export default function DeviceManager() {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<WhatsAppConnection | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchConnections()
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshAllConnections()
      }, 3000) // 3 second intervals
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, connections])

  const fetchConnections = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customer/host/connections')
      if (response.ok) {
        const data = await response.json()
        setConnections(data)
        console.log('Loaded connections:', data.length)
      } else {
        console.warn('Failed to fetch connections:', response.status)
        setConnections([])
      }
    } catch (error: any) {
      console.error('Error fetching connections:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load device connections',
        color: 'red',
      })
      setConnections([])
    } finally {
      setLoading(false)
    }
  }

  const refreshConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/customer/host/connections/${connectionId}/refresh`, {
        method: 'POST',
      })

      if (response.ok) {
        const updatedConnection = await response.json()
        setConnections(prev => prev.map(conn => 
          conn.id === connectionId ? updatedConnection : conn
        ))
        
        notifications.show({
          title: 'Connection Refreshed',
          message: updatedConnection.qrCode ? 'Fresh QR code generated!' : 'Status updated',
          color: 'green'
        })
      }
    } catch (error: any) {
      console.error('Refresh connection error:', error)
      notifications.show({
        title: 'Error',
        message: error?.message || 'Failed to refresh connection',
        color: 'red',
      })
    }
  }

  const refreshAllConnections = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      for (const connection of connections) {
        await refreshConnection(connection.id)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    } finally {
      setRefreshing(false)
    }
  }

  const generateQR = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/customer/host/connections/${connectionId}/qr`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        const updatedConnection = result.connection || result
        
        setConnections(prev => prev.map(conn => 
          conn.id === connectionId ? { ...conn, qrCode: updatedConnection.qrCode } : conn
        ))
        
        if (updatedConnection.qrCode) {
          const connection = connections.find(c => c.id === connectionId)
          setSelectedConnection({ ...connection, qrCode: updatedConnection.qrCode } as WhatsAppConnection)
          setQrModalOpen(true)
          
          notifications.show({
            title: '🆕 Fresh QR Code Generated!',
            message: 'New QR code ready - scan with your WhatsApp mobile app',
            color: 'green'
          })
        }
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Failed to generate QR code',
        color: 'red'
      })
    }
  }

  const deleteConnection = async (connectionId: string, accountName: string) => {
    if (!confirm(`Are you sure you want to remove device "${accountName}"?\n\nThis will:\n• Log out the device from WhatsApp\n• Delete all session files\n• Remove all message history\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/customer/host/connections/${connectionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        setConnections(prev => prev.filter(conn => conn.id !== connectionId))
        
        notifications.show({
          title: '🗑️ Device Removed',
          message: `Device "${accountName}" has been disconnected and removed\n${result.deviceLoggedOut ? '📱 Device logged out from WhatsApp' : ''}\n${result.sessionCleaned ? '🗂️ Session files cleaned up' : ''}`,
          color: 'green',
        })
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Failed to remove device',
        color: 'red',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'green'
      case 'CONNECTING': return 'yellow'
      case 'AUTHENTICATING': return 'blue'
      case 'DISCONNECTED': return 'gray'
      case 'ERROR': return 'red'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED': return <IconWifi size="1rem" />
      case 'AUTHENTICATING': return <IconQrcode size="1rem" />
      case 'DISCONNECTED': return <IconWifiOff size="1rem" />
      case 'ERROR': return <IconWifiOff size="1rem" />
      default: return <IconDeviceMobile size="1rem" />
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'CONNECTED': return '🟢 CONNECTED'
      case 'CONNECTING': return '🟡 CONNECTING'
      case 'AUTHENTICATING': return '🔵 SCAN QR CODE'
      case 'DISCONNECTED': return '⚫ DISCONNECTED'
      case 'ERROR': return '🔴 ERROR'
      default: return status
    }
  }

  if (loading) {
    return <LoadingOverlay visible />
  }

  const connectedDevices = connections.filter(conn => conn.status === 'CONNECTED')
  const pendingDevices = connections.filter(conn => conn.status !== 'CONNECTED')

  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Quick Actions */}
        <Card withBorder padding="lg">
          <Group justify="space-between" mb="md">
            <Text size="lg" fw={600}>Device Management</Text>
            <Group gap="sm">
              <Button
                variant={autoRefresh ? 'filled' : 'light'}
                color={autoRefresh ? 'green' : 'blue'}
                leftSection={<IconRefresh size="1rem" />}
                onClick={() => setAutoRefresh(!autoRefresh)}
                size="sm"
              >
                Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
              </Button>
              <Button 
                variant="light"
                leftSection={<IconRefresh size="1rem" />}
                onClick={refreshAllConnections}
                loading={refreshing}
                size="sm"
              >
                Refresh All
              </Button>
              <Button 
                leftSection={<IconPlus size="1rem" />}
                onClick={() => router.push('/customer/whatsapp/devices/connect')}
                gradient={{ from: 'green', to: 'teal' }}
                variant="gradient"
              >
                Connect New Device
              </Button>
            </Group>
          </Group>

          {/* Statistics */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder padding="md" bg="green.0">
                <Group gap="sm">
                  <IconCheck size={20} color="green" />
                  <div>
                    <Text size="xl" fw={700} c="green">{connectedDevices.length}</Text>
                    <Text size="xs" c="dimmed">Connected Devices</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder padding="md" bg="blue.0">
                <Group gap="sm">
                  <IconClock size={20} color="blue" />
                  <div>
                    <Text size="xl" fw={700} c="blue">{pendingDevices.length}</Text>
                    <Text size="xs" c="dimmed">Pending Connections</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder padding="md" bg="indigo.0">
                <Group gap="sm">
                  <IconMessage size={20} color="indigo" />
                  <div>
                    <Text size="xl" fw={700} c="indigo">
                      {connections.reduce((sum, conn) => sum + conn.messageCount, 0)}
                    </Text>
                    <Text size="xs" c="dimmed">Total Messages</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder padding="md" bg="gray.0">
                <Group gap="sm">
                  <IconDeviceMobile size={20} color="gray" />
                  <div>
                    <Text size="xl" fw={700} c="gray">{connections.length}</Text>
                    <Text size="xs" c="dimmed">Total Devices</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Device List */}
        {connections.length > 0 ? (
          <Tabs defaultValue="all" variant="outline">
            <Tabs.List>
              <Tabs.Tab value="all" leftSection={<IconDeviceMobile size="1rem" />}>
                All Devices ({connections.length})
              </Tabs.Tab>
              <Tabs.Tab value="connected" leftSection={<IconWifi size="1rem" />}>
                Connected ({connectedDevices.length})
              </Tabs.Tab>
              <Tabs.Tab value="pending" leftSection={<IconClock size="1rem" />}>
                Pending ({pendingDevices.length})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="all">
              <Stack gap="md" mt="md">
                {connections.map((connection) => (
                  <DeviceCard 
                    key={connection.id} 
                    connection={connection}
                    onRefresh={refreshConnection}
                    onGenerateQR={generateQR}
                    onDelete={deleteConnection}
                    onShowQR={(conn) => {
                      setSelectedConnection(conn)
                      setQrModalOpen(true)
                    }}
                  />
                ))}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="connected">
              <Stack gap="md" mt="md">
                {connectedDevices.map((connection) => (
                  <DeviceCard 
                    key={connection.id} 
                    connection={connection}
                    onRefresh={refreshConnection}
                    onGenerateQR={generateQR}
                    onDelete={deleteConnection}
                    onShowQR={(conn) => {
                      setSelectedConnection(conn)
                      setQrModalOpen(true)
                    }}
                  />
                ))}
                {connectedDevices.length === 0 && (
                  <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                    No connected devices. Connect a new device to get started.
                  </Alert>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="pending">
              <Stack gap="md" mt="md">
                {pendingDevices.map((connection) => (
                  <DeviceCard 
                    key={connection.id} 
                    connection={connection}
                    onRefresh={refreshConnection}
                    onGenerateQR={generateQR}
                    onDelete={deleteConnection}
                    onShowQR={(conn) => {
                      setSelectedConnection(conn)
                      setQrModalOpen(true)
                    }}
                  />
                ))}
                {pendingDevices.length === 0 && (
                  <Alert icon={<IconCheck size="1rem" />} color="green">
                    All devices are connected! Great job.
                  </Alert>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        ) : (
          <Card withBorder padding="xl">
            <Center>
              <Stack align="center" gap="md">
                <IconBrandWhatsapp size={48} color="#25D366" />
                <Text size="lg" fw={500}>No WhatsApp Devices</Text>
                <Text size="sm" c="dimmed" ta="center">
                  You haven't connected any WhatsApp devices yet.<br/>
                  Click the button below to connect your first device.
                </Text>
                <Button 
                  size="lg"
                  leftSection={<IconPlus size="1.2rem" />}
                  rightSection={<IconArrowRight size="1rem" />}
                  onClick={() => router.push('/customer/whatsapp/devices/connect')}
                  gradient={{ from: 'green', to: 'teal' }}
                  variant="gradient"
                >
                  Connect Your First Device
                </Button>
              </Stack>
            </Center>
          </Card>
        )}

        {/* WhatsApp-style QR Modal */}
        <WhatsAppQRModal
          opened={qrModalOpen}
          onClose={() => {
            setQrModalOpen(false)
            setSelectedConnection(null)
          }}
          qrCode={selectedConnection?.qrCode}
          accountName={selectedConnection?.accountName || 'WhatsApp Device'}
          serverName={selectedConnection?.serverName || 'WhatsApp Server'}
          autoClose={true}
          countdownSeconds={30}
        />
      </Stack>
    </Container>
  )
}

// Device Card Component
interface DeviceCardProps {
  connection: WhatsAppConnection
  onRefresh: (id: string) => void
  onGenerateQR: (id: string) => void
  onDelete: (id: string, name: string) => void
  onShowQR: (connection: WhatsAppConnection) => void
}

function DeviceCard({ connection, onRefresh, onGenerateQR, onDelete, onShowQR }: DeviceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'green'
      case 'CONNECTING': return 'yellow'
      case 'AUTHENTICATING': return 'blue'
      case 'DISCONNECTED': return 'gray'
      case 'ERROR': return 'red'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED': return <IconWifi size="1rem" />
      case 'AUTHENTICATING': return <IconQrcode size="1rem" />
      case 'DISCONNECTED': return <IconWifiOff size="1rem" />
      case 'ERROR': return <IconWifiOff size="1rem" />
      default: return <IconDeviceMobile size="1rem" />
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'CONNECTED': return '🟢 CONNECTED'
      case 'CONNECTING': return '🟡 CONNECTING'
      case 'AUTHENTICATING': return '🔵 SCAN QR CODE'
      case 'DISCONNECTED': return '⚫ DISCONNECTED'
      case 'ERROR': return '🔴 ERROR'
      default: return status
    }
  }

  return (
    <Card 
      withBorder 
      padding="md" 
      bg={connection.status === 'CONNECTED' ? '#e8f5e8' : 'white'}
      style={connection.status === 'CONNECTED' ? { 
        borderColor: '#28a745',
        boxShadow: '0 2px 8px rgba(40, 167, 69, 0.15)'
      } : undefined}
    >
      <Group justify="space-between">
        <Group gap="md">
          <IconBrandWhatsapp size={32} color="#25D366" />
          <div>
            <Group gap="sm">
              <Text fw={500} size="lg">{connection.accountName}</Text>
              {connection.phoneNumber && (
                <Group gap="xs">
                  <IconPhone size="0.8rem" />
                  <Text size="sm" c="dimmed">{connection.phoneNumber}</Text>
                </Group>
              )}
            </Group>
            <Text size="sm" c="dimmed">{connection.serverName}</Text>
            <Group gap="sm" mt="xs">
              <Group gap="xs">
                {getStatusIcon(connection.status)}
                <Badge 
                  color={getStatusColor(connection.status)} 
                  size="sm"
                  variant={connection.status === 'CONNECTED' ? 'filled' : 'light'}
                >
                  {getStatusDisplay(connection.status)}
                </Badge>
              </Group>
              <Badge variant="outline" size="xs">
                📨 {connection.messageCount} messages
              </Badge>
            </Group>
            {connection.lastActivity && (
              <Text size="xs" c="dimmed" mt="xs">
                🕐 Last activity: {new Date(connection.lastActivity).toLocaleString()}
              </Text>
            )}
          </div>
        </Group>
        
        <Group gap="xs">
          {connection.status === 'AUTHENTICATING' && (
            <ActionIcon
              variant="light"
              color="green"
              size="lg"
              onClick={() => {
                if (connection.qrCode) {
                  onShowQR(connection)
                } else {
                  onGenerateQR(connection.id)
                }
              }}
              title={connection.qrCode ? "Show QR Code" : "Generate QR Code"}
            >
              <IconQrcode size="1.2rem" />
            </ActionIcon>
          )}
          <ActionIcon
            variant="light"
            color="blue"
            onClick={() => onRefresh(connection.id)}
            title="Refresh Connection"
          >
            <IconRefresh size="1rem" />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color="red"
            onClick={() => onDelete(connection.id, connection.accountName)}
            title="Remove Device"
          >
            <IconTrash size="1rem" />
          </ActionIcon>
        </Group>
      </Group>

      {/* QR Code Display for Authenticating devices */}
      {connection.status === 'AUTHENTICATING' && connection.qrCode && (
        <Card withBorder padding="md" mt="md" bg="blue.0">
          <Stack align="center" gap="sm">
            <Group gap="sm" justify="center">
              <IconBrandWhatsapp size={20} color="#25d366" />
              <Text size="sm" fw={500} c="#25d366">Ready to Scan</Text>
              <Badge color="blue" size="xs" variant="light">
                Fresh QR Code
              </Badge>
            </Group>
            
            <div style={{ 
              padding: '10px', 
              backgroundColor: 'white', 
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <Image
                src={connection.qrCode}
                alt="WhatsApp QR Code"
                width={120}
                height={120}
                style={{ display: 'block' }}
              />
            </div>
            
            <Button
              size="xs"
              variant="light"
              color="blue"
              leftSection={<IconScan size="0.8rem" />}
              onClick={() => onShowQR(connection)}
            >
              View Large QR Code
            </Button>
          </Stack>
        </Card>
      )}

      {/* Success State for Connected devices */}
      {connection.status === 'CONNECTED' && (
        <Alert icon={<IconCheck size="1rem" />} color="green" mt="md">
          <Text size="sm" fw={500}>✅ Device Connected Successfully!</Text>
          <Text size="xs" c="dimmed">
            Your WhatsApp device is linked and ready to send messages
          </Text>
        </Alert>
      )}
    </Card>
  )
}