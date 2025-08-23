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
  Modal,
  Select,
  TextInput,
  Alert,
  Image,
  Center,
  Progress,
  ActionIcon,
  Tabs,
  LoadingOverlay,
  Divider,
  Collapse,
  Textarea,
  Container
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  IconServer, 
  IconBrandWhatsapp, 
  IconQrcode, 
  IconRefresh,
  IconTrash,
  IconPlus,
  IconWifi,
  IconWifiOff,
  IconInfoCircle,
  IconDeviceMobile,
  IconWorld,
  IconSettings,
  IconChevronDown,
  IconChevronUp,
  IconScan,
  IconClock,
  IconMessage,
  IconEdit,
  IconCheck,
  IconSend,
  IconPhoto,
  IconFile,
  IconVideo,
  IconMusic,
  IconMapPin,
  IconArrowRight
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import WhatsAppConnectionTester from '@/components/debug/WhatsAppConnectionTester'
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

interface WhatsAppConnection {
  id: string
  serverId: string
  serverName: string
  accountName: string
  phoneNumber?: string
  status: 'connecting' | 'connected' | 'disconnected' | 'qr_required'
  qrCode?: string
  lastActivity?: string
  messageCount: number
}

interface ConnectionForm {
  serverId: string
  accountName: string
  messageInterval: number
  maxDailyMessages: number
}

export default function WhatsAppHostManager() {
  const router = useRouter()
  const [servers, setServers] = useState<Server[]>([])
  const [connections, setConnections] = useState<WhatsAppConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [qrModalOpened, { open: openQrModal, close: closeQrModal }] = useDisclosure(false)
  const [selectedConnection, setSelectedConnection] = useState<WhatsAppConnection | null>(null)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [showDebugTools, setShowDebugTools] = useState(false)
  const [whatsappQRModalOpen, setWhatsappQRModalOpen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const form = useForm<ConnectionForm>({
    initialValues: {
      serverId: '',
      accountName: '',
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
    fetchServersAndConnections()
  }, [])

  // Auto-refresh effect similar to debug page
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshAllConnections()
      }, 3000) // 3 second intervals for faster updates
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, connections])

  const fetchServersAndConnections = async () => {
    try {
      setLoading(true)
      
      // Fetch servers from real API
      try {
        const serversResponse = await fetch('/api/customer/host/servers')
        if (serversResponse.ok) {
          const serversData = await serversResponse.json()
          setServers(serversData)
        } else {
          console.warn('Servers API returned:', serversResponse.status, serversResponse.statusText)
          setServers([]) // No servers available
          notifications.show({
            title: 'Warning',
            message: 'WhatsApp server is not available. Please ensure localhost:3005 is running.',
            color: 'yellow',
          })
        }
      } catch (serverError: any) {
        console.error('Failed to fetch servers:', serverError?.message || serverError)
        setServers([]) // No servers available
        notifications.show({
          title: 'Error',
          message: 'Failed to connect to WhatsApp server. Please check if localhost:3005 is running.',
          color: 'red',
        })
      }

      // Fetch connections from real API
      try {
        const connectionsResponse = await fetch('/api/customer/host/connections')
        if (connectionsResponse.ok) {
          const connectionsData = await connectionsResponse.json()
          setConnections(connectionsData)
          console.log('Connections loaded:', connectionsData.length, 'connections')
        } else {
          console.warn('Connections API returned:', connectionsResponse.status, connectionsResponse.statusText)
          setConnections([]) // Start with empty connections
        }
      } catch (connectionError: any) {
        console.error('Failed to fetch connections:', connectionError?.message || connectionError)
        setConnections([]) // Start with empty connections
      }
    } catch (error: any) {
      console.error('Host data fetch error:', error)
      notifications.show({
        title: 'Error',
        message: error?.message || 'Failed to load host data',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  // Test server connectivity before creating connection
  const testServerConnection = async () => {
    try {
      console.log('Testing server connectivity...')
      
      // Test frontend API
      const apiTest = await fetch('/api/customer/host/servers', { method: 'GET' })
      console.log('Frontend API test:', apiTest.status, apiTest.statusText)
      
      // Test WhatsApp server
      const whatsappTest = await fetch('http://localhost:3005/api/health', { method: 'GET' })
      console.log('WhatsApp server test:', whatsappTest.status, whatsappTest.statusText)
      
      return {
        frontendApi: apiTest.ok,
        whatsappServer: whatsappTest.ok,
        frontendStatus: apiTest.status,
        whatsappStatus: whatsappTest.status
      }
    } catch (error: any) {
      console.error('Server connectivity test failed:', error)
      return {
        frontendApi: false,
        whatsappServer: false,
        error: error.message
      }
    }
  }

  const handleCreateConnection = async (values: ConnectionForm) => {
    console.log('🚀 handleCreateConnection called with values:', values)
    console.log('🚀 Function execution started at:', new Date().toISOString())
    
    try {
      setConnectingId(values.serverId)
      console.log('✅ Set connecting ID:', values.serverId)
      
      // Test connectivity first
      console.log('🔍 Testing server connectivity...')
      const connectivity = await testServerConnection()
      console.log('🔍 Server connectivity result:', connectivity)
      
      if (!connectivity.frontendApi) {
        notifications.show({
          title: '⚠️ Frontend API Issue',
          message: `Frontend API is not responding (Status: ${connectivity.frontendStatus})`,
          color: 'orange',
          autoClose: 8000
        })
      }
      
      if (!connectivity.whatsappServer) {
        notifications.show({
          title: '⚠️ WhatsApp Server Issue',
          message: `WhatsApp server is not responding (Status: ${connectivity.whatsappStatus || 'No connection'})`,
          color: 'orange',
          autoClose: 8000
        })
      }
      
      console.log('📡 Making API request to /api/customer/host/connections')
      console.log('📡 Request payload:', JSON.stringify(values, null, 2))
      
      const response = await fetch('/api/customer/host/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      
      console.log('📡 API Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        const newConnection = await response.json()
        console.log('Connection created:', newConnection)
        
        setConnections(prev => [...prev, newConnection])
        
        notifications.show({
          title: '✅ Connection Created!',
          message: newConnection.instructions || 'WhatsApp connection created successfully',
          color: 'green',
        })
        
        // Always show QR modal for immediate scanning
        setSelectedConnection(newConnection)
        openQrModal()
        
        // Show WhatsApp-style QR modal immediately if available, or after refresh
        if (newConnection.qrCode) {
          setSelectedConnection(newConnection)
          setWhatsappQRModalOpen(true)
        } else {
          // Auto-refresh for QR code if not immediately available
          const refreshInterval = setInterval(() => {
            handleRefreshConnection(newConnection.id)
          }, 3000)
          setAutoRefreshInterval(refreshInterval)
          
          // Stop after 30 seconds
          setTimeout(() => {
            if (refreshInterval) {
              clearInterval(refreshInterval)
              setAutoRefreshInterval(null)
            }
          }, 30000)
        }
        
        close()
        form.reset()
      } else {
        // Wrap error handling in try-catch for safety
        try {
          // Handle different error status codes
          let errorMessage = 'Failed to create connection'
          let errorDetails = ''
        
        try {
          console.log('🔍 Attempting to parse error response JSON...')
          const errorData = await response.json()
          console.log('🔍 Parsed error data:', errorData)
          
          // Safely extract error message
          if (errorData && typeof errorData === 'object') {
            errorMessage = errorData.error || errorData.message || errorMessage
            errorDetails = errorData.details || errorData.detail || ''
          }
        } catch (jsonError) {
          console.log('⚠️ Failed to parse error response as JSON:', jsonError)
          // Response is not JSON, use status text
          errorMessage = (response && response.statusText) ? response.statusText : errorMessage
        }
        
        // Provide more specific error messages based on status code
        const statusCode = response?.status || 0
        switch (statusCode) {
          case 401:
            errorMessage = 'Authentication required. Please sign in again.'
            break
          case 403:
            errorMessage = 'Access denied. Customer role required.'
            break
          case 400:
            errorMessage = errorMessage || 'Invalid request data. Please check your inputs.'
            break
          case 404:
            errorMessage = 'User not found. Please contact support.'
            break
          case 409:
            errorMessage = errorMessage || 'Account name already exists. Please choose a different name.'
            break
          case 500:
            errorMessage = 'Server error. Please try again later.'
            if (errorDetails.includes('WhatsApp server')) {
              errorMessage += ' (WhatsApp server may be offline)'
            }
            break
          case 502:
          case 503:
          case 504:
            errorMessage = 'WhatsApp server is unavailable. Please ensure localhost:3005 is running.'
            break
        }
        
        // Enhanced error logging with safety checks
        const errorInfo = {
          status: response?.status || 'Unknown',
          statusText: response?.statusText || 'Unknown',
          url: response?.url || 'Unknown',
          headers: response?.headers ? Object.fromEntries(response.headers.entries()) : {},
          errorMessage: errorMessage || 'Unknown error',
          errorDetails: errorDetails || 'No details',
          timestamp: new Date().toISOString(),
          values: values ? JSON.stringify(values) : 'No values'
        }
        
        // Safe error logging with null checks
        try {
          console.error('Connection creation failed:', errorInfo)
          // Safe response logging - only log serializable properties
          const safeResponse = response ? {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            ok: response.ok,
            redirected: response.redirected,
            type: response.type
          } : null
          console.error('Response details:', safeResponse)
          console.error('Error details string:', errorDetails || 'No error details')
          console.error('Full error message:', errorMessage || 'No error message')
        } catch (loggingError) {
          console.error('Error while logging error details:', String(loggingError))
          console.error('Basic error info:', { 
            status: response?.status || 'unknown', 
            message: errorMessage || 'unknown error' 
          })
        }
        
        notifications.show({
          title: '❌ Connection Failed',
          message: errorMessage || 'An unknown error occurred while creating the connection',
          color: 'red',
          autoClose: 8000
        })
        
        return // Don't throw error, just return after showing notification
        
        } catch (errorHandlingError) {
          // Fallback error handling if something goes wrong in error processing
          console.error('Error while handling connection error:', errorHandlingError)
          notifications.show({
            title: '❌ Connection Failed',
            message: 'An unexpected error occurred while creating the connection',
            color: 'red',
            autoClose: 8000
          })
          return
        }
      }
    } catch (error: any) {
      // Enhanced error logging for catch block
      const catchErrorInfo = {
        error: error,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorString: String(error),
        errorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        timestamp: new Date().toISOString(),
        values: JSON.stringify(values)
      }
      
      console.error('Create connection catch error:', catchErrorInfo)
      // Safe error object logging
      const safeError = error ? {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500), // Limit stack trace length
        constructor: error.constructor?.name
      } : null
      console.error('Safe error object:', safeError)
      console.error('Error constructor:', error?.constructor?.name || 'unknown')
      
      let errorMessage = 'Failed to create WhatsApp connection'
      
      // Handle different types of errors
      if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        errorMessage = 'Network error: Unable to connect to server. Please check your internet connection.'
      } else if (error?.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused: Backend server may be offline.'
      } else if (error?.message?.includes('timeout')) {
        errorMessage = 'Request timeout: Server is taking too long to respond.'
      } else if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.toString && typeof error.toString === 'function') {
        errorMessage = error.toString()
      }
      
      notifications.show({
        title: '🚨 Network Error',
        message: errorMessage,
        color: 'red',
        autoClose: 10000
      })
    } finally {
      setConnectingId(null)
    }
  }

  const handleRefreshConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/customer/host/connections/${connectionId}/refresh`, {
        method: 'POST',
      })

      if (response.ok) {
        const updatedConnection = await response.json()
        setConnections(prev => prev.map(conn => 
          conn.id === connectionId ? updatedConnection : conn
        ))
        
        // Update selected connection if it's the same one
        if (selectedConnection && selectedConnection.id === connectionId) {
          setSelectedConnection(updatedConnection)
        }
        
        // Show WhatsApp-style QR modal when QR code becomes available
        if (updatedConnection.qrCode) {
          setSelectedConnection(updatedConnection)
          setWhatsappQRModalOpen(true)
        }
        
        notifications.show({
          title: 'Connection Refreshed',
          message: updatedConnection.qrCode ? 'Fresh QR code generated!' : 'Status updated',
          color: 'green'
        })
      }
    } catch (error: any) {
      // Safe error logging for refresh connection
      const safeRefreshError = error ? {
        name: error.name || 'unknown',
        message: error.message || 'unknown error',
        stack: error.stack?.substring(0, 300) // Limit stack trace
      } : 'unknown error'
      console.error('Refresh connection error:', safeRefreshError)
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
        await handleRefreshConnection(connection.id)
        // Small delay between requests to avoid overwhelming server
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    } finally {
      setRefreshing(false)
    }
  }

  // Manual QR generation (like debug page)
  const generateQRForConnection = async (connectionId: string) => {
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
          setWhatsappQRModalOpen(true)
          
          notifications.show({
            title: '🆕 Fresh QR Code Generated!',
            message: 'New QR code ready - scan with your WhatsApp mobile app',
            color: 'green'
          })
        } else {
          notifications.show({
            title: 'QR Code Not Ready',
            message: 'QR code is still generating. Try again in a few seconds.',
            color: 'yellow'
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

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/customer/host/connections/${connectionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setConnections(prev => prev.filter(conn => conn.id !== connectionId))
        notifications.show({
          title: 'Success',
          message: 'Connection removed',
          color: 'green',
        })
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error?.message || 'Failed to remove connection',
        color: 'red',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'green'
      case 'connecting': return 'yellow'
      case 'qr_required': return 'blue'
      case 'disconnected': return 'gray'
      case 'active': return 'green'
      case 'inactive': return 'red'
      case 'maintenance': return 'yellow'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <IconWifi size="1rem" />
      case 'qr_required': return <IconQrcode size="1rem" />
      case 'disconnected': return <IconWifiOff size="1rem" />
      default: return <IconDeviceMobile size="1rem" />
    }
  }

  if (loading) {
    return <LoadingOverlay visible />
  }

  return (
    <Stack gap="lg">
      {/* Simple Device Management */}
      <Card withBorder padding="lg" style={{ borderColor: '#25D366', backgroundColor: '#f8fffe' }}>
        <Group justify="space-between" mb="md">
          <Group gap="sm">
            <IconBrandWhatsapp size={28} color="#25D366" />
            <div>
              <Text size="lg" fw={600} c="#25D366">WhatsApp Device Management</Text>
              <Text size="sm" c="dimmed">Connect and manage your WhatsApp devices easily</Text>
            </div>
          </Group>
          <Group gap="sm">
            <Button
              variant="light"
              color="blue"
              leftSection={<IconDeviceMobile size="1rem" />}
              onClick={() => router.push('/customer/whatsapp/devices')}
            >
              Manage Devices
            </Button>
            <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={async () => {
                // Quick add device and redirect to management
                try {
                  const response = await fetch('/api/customer/host/connections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      serverId: '1',
                      accountName: `Device-${Date.now()}`,
                      messageInterval: 5,
                      maxDailyMessages: 1000
                    })
                  })
                  
                  if (response.ok) {
                    notifications.show({
                      title: '✅ Device Created',
                      message: 'Device created! Redirecting to device management...',
                      color: 'green'
                    })
                    router.push('/customer/whatsapp/devices')
                  }
                } catch (error) {
                  notifications.show({
                    title: '❌ Error',
                    message: 'Failed to create device',
                    color: 'red'
                  })
                }
              }}
              gradient={{ from: 'green', to: 'teal' }}
              variant="gradient"
            >
              Add Device
            </Button>
          </Group>
        </Group>
        
        <Alert icon={<IconInfoCircle size="1rem" />} color="green" variant="light">
          <Text size="sm">
            <strong>Simple Device Management:</strong> Click "Add Device" to instantly create and connect a new WhatsApp device, or "Manage Devices" to view your existing devices.
          </Text>
        </Alert>
      </Card>

      {/* Debug Tools */}
      <Card withBorder padding="md" style={{ borderColor: '#e0e7ff' }}>
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            <IconSettings size={16} color="#6366f1" />
            <Text size="sm" fw={500} c="indigo">
              Development Tools
            </Text>
          </Group>
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={() => setShowDebugTools(!showDebugTools)}
          >
            {showDebugTools ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />}
          </ActionIcon>
        </Group>
        <Collapse in={showDebugTools}>
          <WhatsAppConnectionTester 
            serverUrl="http://localhost:3005"
            showInProduction={true}
            compact={true}
          />
        </Collapse>
      </Card>

      {/* Server Overview */}
      <Card withBorder padding="lg">
        <Group justify="space-between" mb="md">
          <Text size="lg" fw={600}>Available Servers</Text>
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
              variant="light"
              color="orange"
              leftSection={<IconInfoCircle size="1rem" />}
              onClick={async () => {
                const connectivity = await testServerConnection()
                notifications.show({
                  title: '🔍 Server Status',
                  message: `Frontend API: ${connectivity.frontendApi ? '✅ OK' : '❌ Failed'} | WhatsApp Server: ${connectivity.whatsappServer ? '✅ OK' : '❌ Failed'}`,
                  color: connectivity.frontendApi && connectivity.whatsappServer ? 'green' : 'orange',
                  autoClose: 10000
                })
              }}
              size="sm"
            >
              Test Servers
            </Button>
            <Button 
              variant="light"
              leftSection={<IconScan size="1rem" />}
              onClick={() => {
                // Quick scan for existing device with default settings
                const activeServer = servers.find(s => s.status === 'active')
                if (activeServer) {
                  const quickScanValues = {
                    serverId: activeServer.id,
                    accountName: `Device-${Date.now()}`,
                    messageInterval: 5,
                    maxDailyMessages: 1000
                  }
                  form.setValues(quickScanValues)
                  handleCreateConnection(quickScanValues)
                } else {
                  notifications.show({
                    title: 'No Active Server',
                    message: 'Please ensure a WhatsApp server is running',
                    color: 'orange'
                  })
                }
              }}
              disabled={!servers.some(s => s.status === 'active')}
            >
              Quick Scan Device
            </Button>
            <Button 
              leftSection={<IconPlus size="1rem" />}
              onClick={open}
            >
              Add WhatsApp Connection
            </Button>
          </Group>
        </Group>
        
        <Grid>
          {servers.map((server) => (
            <Grid.Col key={server.id} span={{ base: 12, md: 4 }}>
              <Card withBorder padding="md" bg="gray.0">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <IconServer size={20} />
                      <Text fw={500} size="sm">{server.name}</Text>
                    </Group>
                    <Badge color={getStatusColor(server.status)} size="sm">
                      {server.status}
                    </Badge>
                  </Group>
                  
                  <Group gap="sm">
                    <IconWorld size={14} />
                    <Text size="xs" c="dimmed">{server.location}</Text>
                  </Group>
                  
                  <Stack gap={4}>
                    <Group justify="space-between">
                      <Text size="xs">Capacity</Text>
                      <Text size="xs">{server.currentInstances}/{server.maxInstances}</Text>
                    </Group>
                    <Progress 
                      value={(server.currentInstances / server.maxInstances) * 100} 
                      size="xs"
                      color={server.currentInstances < server.maxInstances * 0.8 ? 'blue' : 'orange'}
                    />
                  </Stack>
                  
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">Ping: {server.ping}ms</Text>
                    <Text size="xs" c="dimmed">{server.url}</Text>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Card>

      {/* WhatsApp Connections */}
      <Card withBorder padding="lg">
        <Text size="lg" fw={600} mb="md">WhatsApp Connections</Text>
        
        {connections.length > 0 ? (
          <Stack gap="md">
            {connections.map((connection) => (
              <Card 
                key={connection.id} 
                withBorder 
                padding="md" 
                bg={connection.status === 'connected' ? '#e8f5e8' : 'gray.0'}
                style={connection.status === 'connected' ? { 
                  borderColor: '#28a745',
                  boxShadow: '0 2px 8px rgba(40, 167, 69, 0.15)'
                } : undefined}
              >
                <Group justify="space-between">
                  <Group gap="md">
                    <IconBrandWhatsapp size={24} color="#25D366" />
                    <div>
                      <Text fw={500}>{connection.accountName}</Text>
                      <Text size="sm" c="dimmed">{connection.serverName}</Text>
                      {connection.phoneNumber && (
                        <Text size="xs" c="dimmed">📞 {connection.phoneNumber}</Text>
                      )}
                      <Text size="xs" c="dimmed">ID: {connection.id}</Text>
                    </div>
                  </Group>
                  
                  <Group gap="md">
                    <div style={{ textAlign: 'right' }}>
                      <Group gap="xs">
                        {getStatusIcon(connection.status)}
                        <Badge 
                          color={getStatusColor(connection.status)} 
                          size="sm"
                          variant={connection.status === 'connected' ? 'filled' : 'light'}
                          style={connection.status === 'connected' ? {
                            fontWeight: 'bold'
                          } : undefined}
                        >
                          {connection.status === 'connected' ? '🟢 CONNECTED' : connection.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        📨 {connection.messageCount} messages
                      </Text>
                      {connection.lastActivity && (
                        <Text size="xs" c="dimmed">
                          🕐 Last: {new Date(connection.lastActivity).toLocaleString()}
                        </Text>
                      )}
                      <Text size="xs" c="dimmed">
                        📅 Created: {new Date(connection.createdAt || Date.now()).toLocaleString()}
                      </Text>
                    </div>
                    
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="green"
                        onClick={() => {
                          if (connection.qrCode) {
                            setSelectedConnection(connection)
                            setWhatsappQRModalOpen(true)
                          } else {
                            generateQRForConnection(connection.id)
                          }
                        }}
                        title={connection.qrCode ? "Show QR Code" : "Generate Fresh QR Code"}
                      >
                        <IconQrcode size="1rem" />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="green"
                        onClick={() => {
                          // Pre-fill form with existing settings for editing
                          form.setValues({
                            serverId: connection.serverId,
                            accountName: connection.accountName,
                            messageInterval: 5, // Default, could be retrieved from API
                            maxDailyMessages: 1000 // Default, could be retrieved from API
                          })
                          open()
                        }}
                        title="Edit Device Settings"
                      >
                        <IconEdit size="1rem" />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleRefreshConnection(connection.id)}
                        title="Refresh Connection"
                      >
                        <IconRefresh size="1rem" />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDeleteConnection(connection.id)}
                        title="Remove Device"
                      >
                        <IconTrash size="1rem" />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Group>
                
                {/* QR Code Display (like debug page) */}
                {connection.qrCode && (
                  <Card withBorder padding="md" mt="md" style={{ backgroundColor: '#f8f9fa' }}>
                    <Stack align="center" gap="md">
                      <Group gap="sm" justify="center">
                        <IconBrandWhatsapp size={20} color="#25d366" />
                        <Text size="sm" fw={500} c="#25d366">Ready to Connect</Text>
                        <Badge color="green" size="xs" variant="light">
                          Fresh QR - Scan Now
                        </Badge>
                      </Group>
                      
                      <div style={{ 
                        padding: '15px', 
                        backgroundColor: 'white', 
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                      }}>
                        <Image
                          src={connection.qrCode}
                          alt="WhatsApp QR Code - Scan with your phone"
                          width={180}
                          height={180}
                          style={{ display: 'block' }}
                        />
                      </div>
                      
                      <Stack gap="xs" align="center">
                        <Text size="xs" fw={500} c="#495057">Scan with WhatsApp</Text>
                        <Text size="xs" c="#6c757d" ta="center">
                          1. Open WhatsApp → Menu → Linked Devices<br/>
                          2. Tap "Link a Device" and scan this QR code
                        </Text>
                        <Group gap="xs">
                          <Button
                            size="xs"
                            variant="light"
                            color="green"
                            leftSection={<IconQrcode size="0.8rem" />}
                            onClick={() => {
                              setSelectedConnection(connection)
                              setWhatsappQRModalOpen(true)
                            }}
                          >
                            Large View
                          </Button>
                          <Button
                            size="xs"
                            variant="light"
                            color="blue"
                            leftSection={<IconRefresh size="0.8rem" />}
                            onClick={() => generateQRForConnection(connection.id)}
                          >
                            Refresh QR
                          </Button>
                        </Group>
                      </Stack>
                    </Stack>
                  </Card>
                )}
                
                {/* No QR Code State (like debug page) */}
                {!connection.qrCode && connection.status !== 'connected' && (
                  <Alert icon={<IconQrcode size="1rem" />} color="blue" mt="md">
                    <Group justify="space-between" align="center">
                      <div>
                        <Text size="sm" fw={500}>QR Code Required</Text>
                        <Text size="xs" c="dimmed">
                          Generate a QR code to connect your WhatsApp mobile app
                        </Text>
                      </div>
                      <Button
                        size="xs"
                        leftSection={<IconScan size="0.8rem" />}
                        onClick={() => generateQRForConnection(connection.id)}
                        variant="light"
                        color="blue"
                      >
                        Generate QR
                      </Button>
                    </Group>
                  </Alert>
                )}
                
                {/* Connection Success State */}
                {connection.status === 'connected' && (
                  <Alert icon={<IconCheck size="1rem" />} color="green" mt="md">
                    <Text size="sm" fw={500}>✅ Device Connected Successfully!</Text>
                    <Text size="xs" c="dimmed">
                      Your WhatsApp device is linked and ready to send messages
                      {connection.phoneNumber && ` • Phone: ${connection.phoneNumber}`}
                    </Text>
                  </Alert>
                )}
              </Card>
            ))}
          </Stack>
        ) : (
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            No WhatsApp connections found. Create your first connection to get started.
          </Alert>
        )}
      </Card>

      {/* Add Connection Modal */}
      <Modal opened={opened} onClose={close} title="Add WhatsApp Connection" size="md">
        <form onSubmit={form.onSubmit(handleCreateConnection)}>
          <Stack gap="md">
            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
              You will need to scan a QR code with your WhatsApp mobile app to connect.
            </Alert>
            

            {servers.length > 0 ? (
              <Select
                label="Select Server"
                placeholder="Choose a server"
                data={servers.map(server => ({
                  value: server.id,
                  label: `${server.name} (${server.currentInstances || 0}/${server.maxInstances || 50})`,
                  disabled: server.status !== 'active'
                }))}
                {...form.getInputProps('serverId')}
                required
              />
            ) : (
              <Alert icon={<IconInfoCircle size="1rem" />} color="red">
                No WhatsApp servers available. Please ensure localhost:3005 is running.
              </Alert>
            )}

            <TextInput
              label="Account Name"
              placeholder="e.g., Business Account, Support Line"
              {...form.getInputProps('accountName')}
              required
            />

            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Message Interval (seconds)"
                  placeholder="5"
                  type="number"
                  min={5}
                  max={60}
                  description="Delay between messages in queue (5-60 seconds)"
                  leftSection={<IconClock size="1rem" />}
                  {...form.getInputProps('messageInterval')}
                  required
                />
              </Grid.Col>
              <Grid.Col span={6}>
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
              </Grid.Col>
            </Grid>

            <Alert icon={<IconInfoCircle size="1rem" />} color="blue" variant="light">
              <Text size="sm" mb="xs" fw={500}>Message Queue Settings:</Text>
              <Text size="xs">• <strong>Interval:</strong> Time delay between sending queued messages</Text>
              <Text size="xs">• <strong>Daily Limit:</strong> Prevents account suspension due to spam detection</Text>
              <Text size="xs">• <strong>Recommended:</strong> 5-10 seconds interval, max 1000 messages/day</Text>
            </Alert>

            <Group justify="flex-end">
              <Button variant="subtle" onClick={close}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                leftSection={<IconBrandWhatsapp size="1rem" />}
                loading={connectingId === form.values.serverId}
                disabled={servers.length === 0}
              >
                Create Connection
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* QR Code Modal */}
      <Modal 
        opened={qrModalOpened} 
        onClose={() => {
          if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval)
            setAutoRefreshInterval(null)
          }
          closeQrModal()
        }} 
        title="Scan QR Code" 
        size="md"
        centered
      >
        {selectedConnection && (
          <Stack gap="md" align="center">
            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
              Open WhatsApp on your phone → Settings → Connected Devices → Connect a Device
            </Alert>

            <Text size="sm" ta="center" c="dimmed">
              Connection: <strong>{selectedConnection.accountName}</strong><br />
              Server: <strong>{selectedConnection.serverName}</strong>
            </Text>

            <Divider />

            {selectedConnection.qrCode ? (
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                <Image
                  src={selectedConnection.qrCode}
                  alt="WhatsApp QR Code"
                  width={256}
                  height={256}
                />
              </div>
            ) : (
              <Center style={{ height: 256 }}>
                <Stack align="center" gap="md">
                  <Progress value={100} animated color="blue" size="sm" style={{ width: '200px' }} />
                  <Text c="dimmed">Generating QR Code...</Text>
                  <Text size="xs" c="dimmed">This may take a few seconds</Text>
                </Stack>
              </Center>
            )}

            <Group>
              <Button
                variant="light"
                leftSection={<IconRefresh size="1rem" />}
                onClick={() => handleRefreshConnection(selectedConnection.id)}
              >
                Refresh QR Code
              </Button>
              <Button onClick={closeQrModal}>
                Close
              </Button>
            </Group>

            <Alert icon={<IconInfoCircle size="1rem" />} color="yellow">
              QR codes expire after 20 seconds. Click "Refresh" if needed.
            </Alert>
          </Stack>
        )}
      </Modal>

      {/* WhatsApp-style QR Modal */}
      <WhatsAppQRModal
        opened={whatsappQRModalOpen}
        onClose={() => {
          setWhatsappQRModalOpen(false)
          // Don't clear selectedConnection as it might be needed for other operations
        }}
        qrCode={selectedConnection?.qrCode}
        accountName={selectedConnection?.accountName || 'WhatsApp Account'}
        serverName={selectedConnection?.serverName || 'WhatsApp Server'}
        autoClose={true}
        countdownSeconds={30}
      />
    </Stack>
  )
}
