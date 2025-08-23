'use client'

import { useEffect, useState } from 'react'
import { 
  Card, 
  Text, 
  Button, 
  Group, 
  Stack, 
  Select,
  TextInput,
  Alert,
  Progress,
  LoadingOverlay,
  Stepper,
  Container,
  Badge,
  ActionIcon,
  Timeline,
  Center,
  Image
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  IconServer, 
  IconBrandWhatsapp, 
  IconQrcode, 
  IconRefresh,
  IconInfoCircle,
  IconDeviceMobile,
  IconWorld,
  IconClock,
  IconMessage,
  IconCheck,
  IconScan,
  IconArrowLeft,
  IconArrowRight,
  IconWifi,
  IconPhone,
  IconSettings
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import WhatsAppQRModal from '@/components/qr/WhatsAppQRModal'

interface Server {
  id: string
  name: string
  url: string
  status: 'active' | 'inactive' | 'maintenance'
  location: string
  maxInstances: number
  currentInstances: number
  ping: number
}

interface ConnectionForm {
  serverId: string
  accountName: string
  messageInterval: number
  maxDailyMessages: number
}

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
  instructions?: string
}

export default function DeviceConnector() {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [newConnection, setNewConnection] = useState<WhatsAppConnection | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Auto-generate device name with bizflash.in prefix
  const generateDeviceName = () => {
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
    return `bizflash.in-device-${timestamp}`
  }

  const form = useForm<ConnectionForm>({
    initialValues: {
      serverId: '',
      accountName: generateDeviceName(),
      messageInterval: 5,
      maxDailyMessages: 1000,
    },
    validate: {
      serverId: (value) => (!value ? 'Server is required' : null),
      accountName: (value) => (!value ? 'Account name is required' : null),
      messageInterval: (value) => (value < 5 || value > 60 ? 'Message interval must be between 5-60 seconds' : null),
      maxDailyMessages: (value) => (value < 1 || value > 5000 ? 'Daily message limit must be between 1-5000' : null),
    },
  })

  useEffect(() => {
    fetchServers()
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
      }
    }
  }, [])

  const fetchServers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customer/host/servers')
      if (response.ok) {
        const data = await response.json()
        setServers(data)
        
        // Auto-select the first active server
        const activeServer = data.find((s: Server) => s.status === 'active')
        if (activeServer) {
          form.setFieldValue('serverId', activeServer.id)
        }
      } else {
        setServers([])
        notifications.show({
          title: 'Warning',
          message: 'WhatsApp server is not available. Please ensure localhost:3005 is running.',
          color: 'yellow',
        })
      }
    } catch (error: any) {
      console.error('Failed to fetch servers:', error)
      setServers([])
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to WhatsApp server.',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnectivity = async () => {
    try {
      const whatsappTest = await fetch('http://localhost:3005/api/health')
      return {
        whatsappServer: whatsappTest.ok,
        whatsappStatus: whatsappTest.status
      }
    } catch (error) {
      return {
        whatsappServer: false,
        error: error.message
      }
    }
  }

  const handleCreateConnection = async (values: ConnectionForm) => {
    try {
      setConnecting(true)
      setActiveStep(1)
      
      // Test connectivity
      const connectivity = await testConnectivity()
      
      if (!connectivity.whatsappServer) {
        notifications.show({
          title: '⚠️ Server Offline',
          message: 'WhatsApp server is not responding. Please check if localhost:3005 is running.',
          color: 'orange',
        })
      }
      
      setActiveStep(2)
      
      const response = await fetch('/api/customer/host/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      
      if (response.ok) {
        const connection = await response.json()
        setNewConnection(connection)
        setActiveStep(3)
        
        notifications.show({
          title: '✅ Device Connection Created!',
          message: connection.instructions || 'WhatsApp connection created successfully',
          color: 'green',
        })
        
        // Auto-refresh for QR code if not immediately available
        if (connection.qrCode) {
          setQrModalOpen(true)
        } else {
          startAutoRefresh(connection.id)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create connection')
      }
    } catch (error: any) {
      console.error('Connection creation error:', error)
      notifications.show({
        title: '❌ Connection Failed',
        message: error.message || 'Failed to create WhatsApp connection',
        color: 'red',
      })
      setActiveStep(0)
    } finally {
      setConnecting(false)
    }
  }

  const startAutoRefresh = (connectionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/customer/host/connections/${connectionId}/refresh`, {
          method: 'POST',
        })
        
        if (response.ok) {
          const updatedConnection = await response.json()
          setNewConnection(updatedConnection)
          
          if (updatedConnection.qrCode) {
            setQrModalOpen(true)
            clearInterval(interval)
            setAutoRefreshInterval(null)
          }
        }
      } catch (error) {
        console.error('Auto-refresh error:', error)
      }
    }, 3000)
    
    setAutoRefreshInterval(interval)
    
    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(interval)
      setAutoRefreshInterval(null)
    }, 30000)
  }

  const generateQR = async () => {
    if (!newConnection) return
    
    try {
      const response = await fetch(`/api/customer/host/connections/${newConnection.id}/qr`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        const updatedConnection = result.connection || result
        
        setNewConnection(prev => ({ ...prev, qrCode: updatedConnection.qrCode } as WhatsAppConnection))
        
        if (updatedConnection.qrCode) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'red'
      case 'maintenance': return 'yellow'
      default: return 'gray'
    }
  }

  if (loading) {
    return <LoadingOverlay visible />
  }

  return (
    <Container size="md">
      <Stack gap="lg">
        {/* Back Navigation */}
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size="1rem" />}
            onClick={() => router.push('/customer/whatsapp/devices')}
          >
            Back to Device Management
          </Button>
        </Group>

        {/* Connection Steps */}
        <Card withBorder padding="lg">
          <Stepper active={activeStep} breakpoint="sm">
            <Stepper.Step 
              label="Setup" 
              description="Configure device settings"
              icon={<IconSettings size="1rem" />}
            />
            <Stepper.Step 
              label="Connect" 
              description="Connecting to server"
              icon={<IconServer size="1rem" />}
            />
            <Stepper.Step 
              label="Create" 
              description="Creating device session"
              icon={<IconDeviceMobile size="1rem" />}
            />
            <Stepper.Step 
              label="Scan QR" 
              description="Link your WhatsApp"
              icon={<IconQrcode size="1rem" />}
            />
            <Stepper.Step 
              label="Complete" 
              description="Device connected"
              icon={<IconCheck size="1rem" />}
            />
          </Stepper>
        </Card>

        {/* Step Content */}
        {activeStep === 0 && (
          <Card withBorder padding="lg">
            <form onSubmit={form.onSubmit(handleCreateConnection)}>
              <Stack gap="md">
                <Group gap="sm" mb="md">
                  <IconBrandWhatsapp size={24} color="#25D366" />
                  <Text size="lg" fw={600}>Connect New WhatsApp Device</Text>
                </Group>
                
                <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                  You will need to scan a QR code with your WhatsApp mobile app to connect this device.
                </Alert>

                {/* Server Selection */}
                <Text size="sm" fw={500} mb="xs">Select WhatsApp Server</Text>
                {servers.length > 0 ? (
                  <>
                    <Select
                      placeholder="Choose a server"
                      data={servers.map(server => ({
                        value: server.id,
                        label: `${server.name} (${server.currentInstances || 0}/${server.maxInstances || 50})`,
                        disabled: server.status !== 'active'
                      }))}
                      {...form.getInputProps('serverId')}
                      required
                    />
                    
                    {/* Server Overview */}
                    {form.values.serverId && (
                      <Card withBorder padding="md" bg="gray.0">
                        {servers.filter(s => s.id === form.values.serverId).map(server => (
                          <Stack key={server.id} gap="xs">
                            <Group justify="space-between">
                              <Group gap="sm">
                                <IconServer size={16} />
                                <Text size="sm" fw={500}>{server.name}</Text>
                                <Badge color={getStatusColor(server.status)} size="sm">
                                  {server.status}
                                </Badge>
                              </Group>
                              <Text size="xs" c="dimmed">Ping: {server.ping}ms</Text>
                            </Group>
                            
                            <Group gap="sm">
                              <IconWorld size={14} />
                              <Text size="xs" c="dimmed">{server.location}</Text>
                            </Group>
                            
                            <Stack gap={2}>
                              <Group justify="space-between">
                                <Text size="xs">Server Capacity</Text>
                                <Text size="xs">{server.currentInstances}/{server.maxInstances}</Text>
                              </Group>
                              <Progress 
                                value={(server.currentInstances / server.maxInstances) * 100} 
                                size="xs"
                                color={server.currentInstances < server.maxInstances * 0.8 ? 'blue' : 'orange'}
                              />
                            </Stack>
                          </Stack>
                        ))}
                      </Card>
                    )}
                  </>
                ) : (
                  <Alert icon={<IconInfoCircle size="1rem" />} color="red">
                    No WhatsApp servers available. Please ensure localhost:3005 is running.
                  </Alert>
                )}

                {/* Device Settings */}
                <TextInput
                  label="Device Name (Auto-generated with bizflash.in branding)"
                  placeholder="bizflash.in-device-..."
                  {...form.getInputProps('accountName')}
                  required
                  description="Auto-generated unique name with bizflash.in prefix for brand promotion"
                  rightSection={
                    <ActionIcon 
                      variant="subtle" 
                      onClick={() => form.setFieldValue('accountName', generateDeviceName())}
                      title="Generate new name"
                    >
                      <IconRefresh size="1rem" />
                    </ActionIcon>
                  }
                />

                {/* Advanced Settings */}
                <Stack gap="md">
                  <Text size="sm" fw={500}>Message Queue Settings</Text>
                  
                  <Group grow>
                    <TextInput
                      label="Message Interval (seconds)"
                      placeholder="5"
                      type="number"
                      min={5}
                      max={60}
                      description="Delay between messages (5-60 seconds)"
                      leftSection={<IconClock size="1rem" />}
                      {...form.getInputProps('messageInterval')}
                      required
                    />
                    <TextInput
                      label="Daily Message Limit"
                      placeholder="1000"
                      type="number"
                      min={1}
                      max={5000}
                      description="Maximum messages per day (1-5000)"
                      leftSection={<IconMessage size="1rem" />}
                      {...form.getInputProps('maxDailyMessages')}
                      required
                    />
                  </Group>
                </Stack>

                <Alert icon={<IconInfoCircle size="1rem" />} color="blue" variant="light">
                  <Text size="sm" mb="xs" fw={500}>Recommended Settings:</Text>
                  <Text size="xs">• <strong>Interval:</strong> 5-10 seconds prevents spam detection</Text>
                  <Text size="xs">• <strong>Daily Limit:</strong> 1000 messages/day is safe for most accounts</Text>
                  <Text size="xs">• <strong>Higher limits:</strong> May trigger WhatsApp's anti-spam system</Text>
                </Alert>

                <Group justify="flex-end" mt="md">
                  <Button 
                    type="submit" 
                    leftSection={<IconBrandWhatsapp size="1rem" />}
                    rightSection={<IconArrowRight size="1rem" />}
                    loading={connecting}
                    disabled={servers.length === 0}
                    size="md"
                    gradient={{ from: 'green', to: 'teal' }}
                    variant="gradient"
                  >
                    Connect Device
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        )}

        {/* Connecting Steps */}
        {(activeStep === 1 || activeStep === 2) && (
          <Card withBorder padding="lg">
            <Stack align="center" gap="md">
              <IconBrandWhatsapp size={48} color="#25D366" />
              <Text size="lg" fw={600}>Connecting Your Device...</Text>
              <Progress value={activeStep === 1 ? 33 : 66} size="lg" style={{ width: '100%' }} animated />
              
              <Timeline active={activeStep - 1} bulletSize={24}>
                <Timeline.Item bullet={<IconServer size={12} />} title="Server Connection">
                  <Text c="dimmed" size="sm">
                    Testing connectivity to WhatsApp server
                  </Text>
                </Timeline.Item>

                <Timeline.Item bullet={<IconDeviceMobile size={12} />} title="Device Registration">
                  <Text c="dimmed" size="sm">
                    Creating device session and generating credentials
                  </Text>
                </Timeline.Item>

                <Timeline.Item bullet={<IconQrcode size={12} />} title="QR Code Generation">
                  <Text c="dimmed" size="sm">
                    Preparing QR code for mobile app scanning
                  </Text>
                </Timeline.Item>
              </Timeline>
            </Stack>
          </Card>
        )}

        {/* QR Code Step */}
        {activeStep === 3 && newConnection && (
          <Card withBorder padding="lg">
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="sm">
                  <IconQrcode size={24} color="#25D366" />
                  <div>
                    <Text size="lg" fw={600}>Scan QR Code</Text>
                    <Text size="sm" c="dimmed">Device: {newConnection.accountName}</Text>
                  </div>
                </Group>
                <Badge color="blue" variant="light">
                  Ready to Scan
                </Badge>
              </Group>

              <Alert icon={<IconScan size="1rem" />} color="blue">
                <Text size="sm" fw={500}>How to connect:</Text>
                <Text size="xs">1. Open WhatsApp on your phone</Text>
                <Text size="xs">2. Go to Menu (⋮) → Settings → Linked Devices</Text>
                <Text size="xs">3. Tap "Link a Device" and scan the QR code below</Text>
              </Alert>

              {newConnection.qrCode ? (
                <Stack align="center" gap="md">
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: 'white', 
                    borderRadius: '12px',
                    border: '2px solid #25D366',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.1)'
                  }}>
                    <Image
                      src={newConnection.qrCode}
                      alt="WhatsApp QR Code"
                      width={200}
                      height={200}
                      style={{ display: 'block' }}
                    />
                  </div>
                  
                  <Group gap="sm">
                    <Button
                      variant="light"
                      leftSection={<IconScan size="1rem" />}
                      onClick={() => setQrModalOpen(true)}
                    >
                      View Large QR Code
                    </Button>
                    <Button
                      variant="light"
                      color="blue"
                      leftSection={<IconRefresh size="1rem" />}
                      onClick={generateQR}
                    >
                      Refresh QR Code
                    </Button>
                  </Group>

                  <Alert icon={<IconClock size="1rem" />} color="yellow">
                    QR codes expire after 20 seconds. Click "Refresh" if the code expires.
                  </Alert>
                </Stack>
              ) : (
                <Stack align="center" gap="md">
                  <Progress value={100} animated color="blue" size="lg" style={{ width: '100%' }} />
                  <Text c="dimmed" ta="center">Generating QR Code...</Text>
                  <Button
                    variant="light"
                    leftSection={<IconRefresh size="1rem" />}
                    onClick={generateQR}
                  >
                    Generate QR Code
                  </Button>
                </Stack>
              )}

              <Group justify="space-between" mt="lg">
                <Button
                  variant="subtle"
                  leftSection={<IconArrowLeft size="1rem" />}
                  onClick={() => router.push('/customer/whatsapp/devices')}
                >
                  Go to Device Management
                </Button>
                <Button
                  variant="light"
                  rightSection={<IconArrowRight size="1rem" />}
                  onClick={() => router.push('/customer/whatsapp')}
                >
                  Continue to WhatsApp
                </Button>
              </Group>
            </Stack>
          </Card>
        )}

        {/* Success Step */}
        {activeStep === 4 && newConnection && (
          <Card withBorder padding="lg" bg="green.0">
            <Stack align="center" gap="md">
              <IconCheck size={64} color="green" />
              <Text size="xl" fw={600} c="green">Device Connected Successfully!</Text>
              <Text size="sm" c="dimmed" ta="center">
                Your WhatsApp device "{newConnection.accountName}" is now linked and ready to use.
                {newConnection.phoneNumber && ` Connected phone: ${newConnection.phoneNumber}`}
              </Text>
              
              <Group gap="sm" mt="lg">
                <Button
                  leftSection={<IconDeviceMobile size="1rem" />}
                  onClick={() => router.push('/customer/whatsapp/devices')}
                >
                  Manage Devices
                </Button>
                <Button
                  variant="light"
                  rightSection={<IconMessage size="1rem" />}
                  onClick={() => router.push('/customer/whatsapp')}
                >
                  Start Messaging
                </Button>
              </Group>
            </Stack>
          </Card>
        )}

        {/* WhatsApp-style QR Modal */}
        <WhatsAppQRModal
          opened={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          qrCode={newConnection?.qrCode}
          accountName={newConnection?.accountName || 'WhatsApp Device'}
          serverName={newConnection?.serverName || 'WhatsApp Server'}
          autoClose={true}
          countdownSeconds={30}
        />
      </Stack>
    </Container>
  )
}