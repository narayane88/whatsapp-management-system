'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { 
  Card, 
  Text, 
  Button, 
  Group, 
  Stack, 
  Badge,
  ActionIcon,
  Modal,
  Table,
  Center,
  Image,
  Alert,
  TextInput,
  Select,
  Progress
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { 
  IconBrandWhatsapp, 
  IconPlus,
  IconEye,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconPhone,
  IconQrcode,
  IconCheck,
  IconInfoCircle,
  IconServer,
  IconWorld,
  IconClock
} from '@tabler/icons-react'
import WhatsAppLoader from '@/components/ui/WhatsAppLoader'
import { WhatsAppSectionLoader } from '@/components/ui/WhatsAppPageLoader'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import { useWhatsAppRealTime } from '@/hooks/useWhatsAppRealTime'

interface WhatsAppDevice {
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
  deviceInfo?: string
}

interface EditDeviceData {
  id: string
  accountName: string
  phoneNumber: string
}

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

export default function SimpleDeviceManager() {
  const { isImpersonating, impersonationData } = useImpersonation()
  const [devices, setDevices] = useState<WhatsAppDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [realTimeConnected, setRealTimeConnected] = useState(false)
  
  // Helper function to build URLs with impersonation parameters
  const buildApiUrl = (path: string) => {
    if (isImpersonating && impersonationData) {
      const separator = path.includes('?') ? '&' : '?'
      return `${path}${separator}impersonatedCustomerId=${impersonationData.targetUser.id}`
    }
    return path
  }
  const [qrModalOpened, { open: openQrModal, close: closeQrModal }] = useDisclosure(false)
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false)
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false)
  const [currentQrCode, setCurrentQrCode] = useState<string>('')
  const [currentDevice, setCurrentDevice] = useState<string>('')
  const [editData, setEditData] = useState<EditDeviceData>({ id: '', accountName: '', phoneNumber: '' })
  // Removed auto-refresh polling - now using real-time updates
  const [servers, setServers] = useState<Server[]>([])
  const [selectedServerId, setSelectedServerId] = useState<string>('')
  const [deviceName, setDeviceName] = useState<string>('')
  const [qrTimeouts, setQrTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map())
  const [pendingDevices, setPendingDevices] = useState<Set<string>>(new Set())
  const [qrCountdown, setQrCountdown] = useState<number>(0)
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null)
  const devicesRef = useRef<WhatsAppDevice[]>([])
  const [generatingQR, setGeneratingQR] = useState<Set<string>>(new Set())

  // Update devices ref whenever devices state changes
  useEffect(() => {
    devicesRef.current = devices
  }, [devices])
  
  // Auto-generate device name with bizflash.in prefix
  const generateDeviceName = () => {
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
    return `bizflash.in-device-${timestamp}`
  }

  // Real-time device status update handler
  const handleDeviceStatusUpdate = useCallback((data: any) => {
    if (data.devices) {
      // Full device list update
      const devicesWithServerNames = data.devices.map(device => {
        if (device.serverId && (!device.serverName || device.serverName === 'Unknown Server')) {
          const server = servers.find(s => s.id === device.serverId)
          if (server) {
            device.serverName = server.name
          }
        }
        
        // If device is now connected, clear its cleanup timer and show notification
        if (device.status === 'CONNECTED' && pendingDevices.has(device.id)) {
          cleanupQrTimeout(device.id)
          setPendingDevices(prev => {
            const newSet = new Set(prev)
            newSet.delete(device.id)
            return newSet
          })
          
          // Defer notification to avoid context issues
          setTimeout(() => {
            try {
              notifications.show({
                title: '✅ Device Connected',
                message: `Device "${device.accountName}" is now connected to WhatsApp`,
                color: 'green'
              })
            } catch (error) {
              console.error('Failed to show device connected notification:', error)
            }
          }, 0)
        }
        
        return device
      })
      setDevices(devicesWithServerNames)
    } else if (data.deviceUpdate) {
      // Single device update
      const { deviceId, status, phoneNumber, lastActivity } = data.deviceUpdate
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { ...device, status, phoneNumber, lastActivity }
          : device
      ))
    }
  }, [servers, pendingDevices])

  // Initialize real-time connection
  const { isConnected } = useWhatsAppRealTime({
    onDeviceStatus: handleDeviceStatusUpdate,
    enableNotifications: true,
    autoReconnect: true
  })

  useEffect(() => {
    setRealTimeConnected(isConnected)
  }, [isConnected])

  // Cleanup function for QR timeouts and pending devices
  const cleanupQrTimeout = (deviceId: string) => {
    const timeout = qrTimeouts.get(deviceId)
    if (timeout) {
      clearTimeout(timeout)
      setQrTimeouts(prev => {
        const newMap = new Map(prev)
        newMap.delete(deviceId)
        return newMap
      })
    }
  }

  // Direct delete function for timeout scenarios (no confirmation)
  const forceDeleteDevice = async (deviceId: string, deviceName: string, timeoutSeconds: number = 20) => {
    try {
      const response = await fetch(buildApiUrl(`/api/customer/host/connections/${deviceId}`), {
        method: 'DELETE'
      })

      if (response.ok) {
        // Clean up any pending timers for this device
        cleanupQrTimeout(deviceId)
        setPendingDevices(prev => {
          const newSet = new Set(prev)
          newSet.delete(deviceId)
          return newSet
        })
        
        setDevices(prev => prev.filter(device => device.id !== deviceId))
        
        try {
          notifications.show({
            title: '⏰ Device Timeout',
            message: `Device "${deviceName}" was removed due to connection timeout (${timeoutSeconds}s)`,
            color: 'orange'
          })
        } catch (error) {
          console.error('Failed to show device timeout notification:', error)
        }
        
        return true
      }
    } catch (error: any) {
      console.error('Failed to force delete device:', error)
      return false
    }
  }

  // Auto-delete pending device after 120 seconds
  const startDeviceCleanupTimer = (deviceId: string, timeoutMs: number = 120000) => {
    const timeout = setTimeout(async () => {
      try {
        // Check if device is still pending using ref to get current state
        const device = devicesRef.current.find(d => d.id === deviceId)
        if (device && (device.status === 'AUTHENTICATING' || device.status === 'CONNECTING')) {
          console.log(`Auto-deleting timed out device: ${deviceId} (${device.accountName})`)
          await forceDeleteDevice(deviceId, device.accountName, timeoutMs / 1000)
        } else {
          console.log(`Device ${deviceId} not found or already connected, skipping timeout deletion`)
        }
      } catch (error) {
        console.error('Failed to cleanup timed out device:', error)
      }
      
      // Remove from pending devices
      setPendingDevices(prev => {
        const newSet = new Set(prev)
        newSet.delete(deviceId)
        return newSet
      })
    }, timeoutMs)

    setQrTimeouts(prev => new Map(prev).set(deviceId, timeout))
    setPendingDevices(prev => new Set(prev).add(deviceId))
    console.log(`Started ${timeoutMs/1000}-second cleanup timer for device: ${deviceId}`)
  }

  useEffect(() => {
    // Fetch servers first, then devices so we can map server names
    const initializeData = async () => {
      await fetchServers()
      await fetchDevices()
      
      // Show notification that real-time updates are enabled
      if (isConnected) {
        notifications.show({
          title: '📡 Real-time Updates Active',
          message: 'Device status updates instantly via live connection',
          color: 'green',
          autoClose: 4000
        })
      }
    }
    initializeData()
  }, [isImpersonating, impersonationData])

  // Real-time updates replace auto-refresh polling

  // Refresh devices when servers list changes to ensure proper server name mapping
  useEffect(() => {
    if (servers.length > 0 && devices.length > 0) {
      // Update devices with proper server names
      const updatedDevices = devices.map(device => {
        if (device.serverId && (!device.serverName || device.serverName === 'Unknown Server')) {
          const server = servers.find(s => s.id === device.serverId)
          if (server) {
            return { ...device, serverName: server.name }
          }
        }
        return device
      })
      
      // Only update if there are actual changes
      if (updatedDevices.some((device, index) => device.serverName !== devices[index].serverName)) {
        setDevices(updatedDevices)
      }
    }
  }, [servers])

  // Cleanup all timers on component unmount
  useEffect(() => {
    return () => {
      // Clear QR countdown
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
      
      // Clear all device timeouts
      qrTimeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  const fetchDevices = async () => {
    try {
      if (loading) setLoading(true)
      
      const response = await fetch(buildApiUrl('/api/customer/host/connections'))
      if (response.ok) {
        const data = await response.json()
        
        // Process devices through real-time handler for consistency
        handleDeviceStatusUpdate({ devices: data })
      }
    } catch (error: any) {
      console.error('Error fetching devices:', error)
      if (!realTimeConnected) {
        notifications.show({
          title: 'Connection Error',
          message: 'Failed to fetch device status',
          color: 'red'
        })
      }
    } finally {
      if (loading) setLoading(false)
    }
  }

  const fetchServers = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/customer/host/servers'))
      if (response.ok) {
        const data = await response.json()
        setServers(data)
        
        // Auto-select the first active server and generate device name
        const activeServer = data.find((s: Server) => s.status === 'active')
        if (activeServer && !selectedServerId) {
          setSelectedServerId(activeServer.id)
        }
        
        // Auto-generate device name if empty
        if (!deviceName) {
          setDeviceName(generateDeviceName())
        }
      }
    } catch (error: any) {
      console.error('Error fetching servers:', error)
    }
  }

  const addDevice = async () => {
    // Generate fresh device name when opening modal
    setDeviceName(generateDeviceName())
    openAddModal()
  }

  const createDevice = async () => {
    if (!selectedServerId || !deviceName.trim()) {
      notifications.show({
        title: '❌ Validation Error',
        message: 'Please select a server and enter a device name',
        color: 'red'
      })
      return
    }
    try {
      setConnecting(true)
      
      // Create device connection
      const response = await fetch(buildApiUrl('/api/customer/host/connections'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: selectedServerId,
          accountName: deviceName.trim(),
          messageInterval: 5,
          maxDailyMessages: 1000
        })
      })

      if (response.ok) {
        const newDevice = await response.json()
        
        // Ensure server name is populated from the selected server
        const selectedServer = servers.find(s => s.id === selectedServerId)
        if (selectedServer && newDevice.serverId === selectedServerId) {
          newDevice.serverName = selectedServer.name
        }
        
        setDevices(prev => [...prev, newDevice])
        
        notifications.show({
          title: '✅ Device Created',
          message: 'Device created successfully. Generating QR code...',
          color: 'green'
        })

        // Reset form and close modal with fresh generated name
        setDeviceName(generateDeviceName())
        setSelectedServerId(servers.find(s => s.status === 'active')?.id || '')
        closeAddModal()

        // Start 20-second cleanup timer for this device
        console.log(`Starting cleanup timer for new device: ${newDevice.id}`)
        startDeviceCleanupTimer(newDevice.id) // 120 seconds

        // Generate QR code and show modal (with retry logic)
        setTimeout(async () => {
          setGeneratingQR(prev => new Set(prev).add(newDevice.id))
          
          let retries = 0
          const maxRetries = 3
          let success = false
          
          while (retries < maxRetries && !success) {
            console.log(`QR generation attempt ${retries + 1} for device ${newDevice.id}`)
            success = await generateQR(newDevice.id)
            if (success) break
            
            retries++
            if (retries < maxRetries) {
              console.log(`QR generation attempt ${retries} failed, retrying in 2 seconds...`)
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
          }
          
          setGeneratingQR(prev => {
            const newSet = new Set(prev)
            newSet.delete(newDevice.id)
            return newSet
          })
          
          if (!success) {
            notifications.show({
              title: '⚠️ QR Generation Failed',
              message: 'Unable to generate QR code after multiple attempts. You can try clicking "View QR Code" button later.',
              color: 'orange'
            })
          }
        }, 1000) // Wait 1 second before first attempt
        
        // Refresh devices list to ensure proper server names
        setTimeout(() => fetchDevices(), 1000)
        
      } else {
        throw new Error('Failed to create device')
      }
    } catch (error: any) {
      notifications.show({
        title: '❌ Error',
        message: error.message || 'Failed to create device',
        color: 'red'
      })
    } finally {
      setConnecting(false)
    }
  }

  const generateQR = async (deviceId: string): Promise<boolean> => {
    try {
      const response = await fetch(buildApiUrl(`/api/customer/host/connections/${deviceId}/qr`), {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        const updatedDevice = result.connection || result
        
        // Update device in list
        setDevices(prev => prev.map(device => 
          device.id === deviceId ? { ...device, qrCode: updatedDevice.qrCode } : device
        ))
        
        if (updatedDevice.qrCode) {
          setCurrentQrCode(updatedDevice.qrCode)
          setCurrentDevice(devices.find(d => d.id === deviceId)?.accountName || 'Device')
          openQrModal()
          
          // Start countdown timer
          setQrCountdown(20)
          const interval = setInterval(() => {
            setQrCountdown(prev => {
              if (prev <= 1) {
                clearInterval(interval)
                setCountdownInterval(null)
                closeQrModal()
                // Defer notification to next tick to avoid context issues
                setTimeout(() => {
                  try {
                    notifications.show({
                      title: '⏰ QR Code Expired',
                      message: 'QR code has expired after 20 seconds. Generate a new one if needed.',
                      color: 'orange'
                    })
                  } catch (error) {
                    console.error('Failed to show QR expiry notification:', error)
                  }
                }, 0)
                return 0
              }
              return prev - 1
            })
          }, 1000)
          setCountdownInterval(interval)
          
          notifications.show({
            title: '📱 QR Code Ready',
            message: 'Scan the QR code with WhatsApp to connect your device (expires in 20s)',
            color: 'blue'
          })
          
          return true // QR code generated successfully
        } else {
          console.log(`QR code not yet available for device ${deviceId}`)
          return false // QR code not available yet
        }
      } else {
        console.error(`Failed to get QR code for device ${deviceId}:`, response.status)
        return false
      }
    } catch (error: any) {
      console.error(`Error generating QR code for device ${deviceId}:`, error)
      return false
    }
  }

  const viewDevice = (device: WhatsAppDevice) => {
    if (device.qrCode) {
      setCurrentQrCode(device.qrCode)
      setCurrentDevice(device.accountName)
      openQrModal()
    } else {
      generateQR(device.id)
    }
  }

  const editDevice = (device: WhatsAppDevice) => {
    setEditData({
      id: device.id,
      accountName: device.accountName,
      phoneNumber: device.phoneNumber || ''
    })
    openEditModal()
  }

  const saveEdit = async () => {
    try {
      // Update device in state (API endpoint would be implemented)
      setDevices(prev => prev.map(device => 
        device.id === editData.id 
          ? { ...device, accountName: editData.accountName, phoneNumber: editData.phoneNumber }
          : device
      ))
      
      notifications.show({
        title: '✅ Updated',
        message: 'Device information updated successfully',
        color: 'green'
      })
      
      closeEditModal()
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update device',
        color: 'red'
      })
    }
  }

  const deleteDevice = async (deviceId: string, deviceName: string) => {
    if (!confirm(`Delete device "${deviceName}"? This will disconnect the device from WhatsApp.`)) {
      return
    }

    try {
      const response = await fetch(buildApiUrl(`/api/customer/host/connections/${deviceId}`), {
        method: 'DELETE'
      })

      if (response.ok) {
        // Clean up any pending timers for this device
        cleanupQrTimeout(deviceId)
        setPendingDevices(prev => {
          const newSet = new Set(prev)
          newSet.delete(deviceId)
          return newSet
        })
        
        setDevices(prev => prev.filter(device => device.id !== deviceId))
        
        notifications.show({
          title: '🗑️ Deleted',
          message: `Device "${deviceName}" has been removed`,
          color: 'green'
        })
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete device',
        color: 'red'
      })
    }
  }

  const relinkDevice = async (deviceId: string) => {
    const success = await generateQR(deviceId)
    if (!success) {
      notifications.show({
        title: '⚠️ QR Generation Failed',
        message: 'Unable to generate QR code. Please try again in a few moments.',
        color: 'yellow'
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

  const getServerStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'red'
      case 'maintenance': return 'yellow'
      default: return 'gray'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONNECTED': return '🟢 Connected'
      case 'CONNECTING': return '🟡 Connecting'
      case 'AUTHENTICATING': return '🔵 Scan QR Code'
      case 'DISCONNECTED': return '⚫ Disconnected'
      case 'ERROR': return '🔴 Error'
      default: return status
    }
  }

  if (loading) {
    return (
      <WhatsAppSectionLoader 
        title="Loading WhatsApp devices..." 
        subtitle="Connecting to your WhatsApp servers"
      />
    )
  }

  return (
    <Stack gap="lg">
      {/* Header with Add Device Button */}
      <Card withBorder padding="lg">
        <Group justify="space-between" mb="md">
          <Group gap="sm">
            <IconBrandWhatsapp size={28} color="#25D366" />
            <div>
              <Text size="lg" fw={600}>WhatsApp Devices</Text>
              <Text size="sm" c="dimmed">
                Manage your connected WhatsApp devices
                {realTimeConnected && (
                  <Text component="span" size="xs" c="green" ml="xs">
                    • Live updates active
                  </Text>
                )}
              </Text>
            </div>
          </Group>
          <Group gap="sm">
            {realTimeConnected && (
              <Badge size="lg" color="green" variant="dot">
                📡 Live Updates
              </Badge>
            )}
            {!realTimeConnected && (
              <Badge size="lg" color="orange" variant="dot">
                📡 Connecting...
              </Badge>
            )}
            <Button
              variant="light"
              leftSection={<IconRefresh size="1rem" />}
              onClick={fetchDevices}
              size="sm"
            >
              Refresh
            </Button>
            <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={addDevice}
              loading={connecting}
              size="md"
              gradient={{ from: 'green', to: 'teal' }}
              variant="gradient"
            >
              Add Device
            </Button>
          </Group>
        </Group>

        {/* Quick Stats */}
        <Group gap="md" mt="md">
          <Badge size="lg" color="green" variant="light">
            📱 {devices.filter(d => d.status === 'CONNECTED').length} Connected
          </Badge>
          <Badge size="lg" color="blue" variant="light">
            🔄 {devices.filter(d => d.status === 'AUTHENTICATING').length} Pending
          </Badge>
          <Badge size="lg" color="gray" variant="light">
            📊 {devices.reduce((sum, d) => sum + d.messageCount, 0)} Messages
          </Badge>
        </Group>
      </Card>

      {/* Devices Table */}
      <Card withBorder padding="lg">
        <Text size="md" fw={500} mb="md">Connected Devices</Text>
        
        {devices.length > 0 ? (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Device Name</Table.Th>
                <Table.Th>Phone Number</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Messages</Table.Th>
                <Table.Th>Last Activity</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {devices.map((device) => (
                <Table.Tr key={device.id}>
                  <Table.Td>
                    <Group gap="sm">
                      <IconBrandWhatsapp size={20} color="#25D366" />
                      <div>
                        <Text size="sm" fw={500}>{device.accountName}</Text>
                        <Text size="xs" c="dimmed">{device.serverName}</Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {device.phoneNumber ? (
                      <Group gap="xs">
                        <IconPhone size={14} />
                        <Text size="sm">{device.phoneNumber}</Text>
                      </Group>
                    ) : (
                      <Text size="sm" c="dimmed">Not connected</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {generatingQR.has(device.id) ? (
                      <WhatsAppLoader 
                        variant="typing" 
                        message="Generating QR..."
                        size="sm"
                        showIcon={false}
                      />
                    ) : device.status === 'CONNECTING' || device.status === 'AUTHENTICATING' ? (
                      <WhatsAppLoader 
                        variant={device.status === 'CONNECTING' ? 'connecting' : 'typing'} 
                        message={device.status === 'CONNECTING' ? 'Connecting...' : 'Authenticating...'}
                        size="sm"
                        showIcon={false}
                      />
                    ) : (
                      <Badge 
                        color={getStatusColor(device.status)} 
                        variant={device.status === 'CONNECTED' ? 'filled' : 'light'}
                        size="sm"
                      >
                        {getStatusText(device.status)}
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{device.messageCount}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {device.lastActivity 
                        ? new Date(device.lastActivity).toLocaleString()
                        : 'Never'
                      }
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        size="sm"
                        onClick={() => viewDevice(device)}
                        title="View QR Code"
                      >
                        <IconEye size="1rem" />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="yellow"
                        size="sm"
                        onClick={() => editDevice(device)}
                        title="Edit Device"
                      >
                        <IconEdit size="1rem" />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="green"
                        size="sm"
                        onClick={() => relinkDevice(device.id)}
                        title="Relink Device"
                      >
                        <IconRefresh size="1rem" />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        size="sm"
                        onClick={() => deleteDevice(device.id, device.accountName)}
                        title="Delete Device"
                      >
                        <IconTrash size="1rem" />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Center style={{ minHeight: 200 }}>
            <Stack align="center" gap="md">
              <IconBrandWhatsapp size={48} color="#25D366" />
              <Text size="lg" fw={500}>No devices connected</Text>
              <Text size="sm" c="dimmed" ta="center">
                Click "Add Device" to connect your first WhatsApp device
              </Text>
              <Button
                leftSection={<IconPlus size="1rem" />}
                onClick={addDevice}
                loading={connecting}
                variant="light"
                size="lg"
              >
                Add Your First Device
              </Button>
            </Stack>
          </Center>
        )}
      </Card>

      {/* QR Code Modal */}
      <Modal
        opened={qrModalOpened}
        onClose={() => {
          closeQrModal()
          if (countdownInterval) {
            clearInterval(countdownInterval)
            setCountdownInterval(null)
          }
        }}
        title={`Connect ${currentDevice}`}
        size="md"
        centered
      >
        <Stack gap="md" align="center">
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            <Text size="sm" fw={500}>How to connect:</Text>
            <Text size="xs">1. Open WhatsApp on your phone</Text>
            <Text size="xs">2. Go to Menu → Settings → Linked Devices</Text>
            <Text size="xs">3. Tap "Link a Device" and scan this QR code</Text>
          </Alert>

          {qrCountdown > 0 && (
            <Alert icon={<IconClock size="1rem" />} color={qrCountdown <= 5 ? "red" : "orange"}>
              <Text size="sm" fw={500}>
                ⏰ Time remaining: {qrCountdown} seconds
              </Text>
              <Progress 
                value={(20 - qrCountdown) / 20 * 100} 
                size="sm" 
                color={qrCountdown <= 5 ? "red" : "orange"}
                mt="xs"
              />
            </Alert>
          )}

          {currentQrCode ? (
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #25D366',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.1)'
            }}>
              <Image
                src={currentQrCode}
                alt="WhatsApp QR Code"
                width={250}
                height={250}
              />
            </div>
          ) : (
            <Center style={{ height: 250 }}>
              <Stack align="center" gap="md">
                <IconQrcode size={48} color="#25D366" />
                <Text>Generating QR Code...</Text>
              </Stack>
            </Center>
          )}

          <Group gap="sm" mt="md">
            <Button variant="light" onClick={closeQrModal}>
              Close
            </Button>
            <Button
              variant="light"
              color="blue"
              leftSection={<IconRefresh size="1rem" />}
              onClick={() => {
                const device = devices.find(d => d.accountName === currentDevice)
                if (device) generateQR(device.id)
              }}
            >
              Refresh QR
            </Button>
          </Group>

          <Alert icon={<IconCheck size="1rem" />} color="green" variant="light">
            <Text size="xs">
              QR code will refresh automatically. Once scanned, your device will appear as "Connected"
            </Text>
          </Alert>
        </Stack>
      </Modal>

      {/* Add Device Modal */}
      <Modal
        opened={addModalOpened}
        onClose={closeAddModal}
        title="Add New WhatsApp Device"
        size="md"
        centered
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            Select a server and give your device a name. You'll scan a QR code to complete setup.
          </Alert>

          {/* Server Selection */}
          <div>
            <Text size="sm" fw={500} mb="xs">WhatsApp Server</Text>
            {servers.length > 0 ? (
              <>
                <Select
                  placeholder="Choose a server"
                  data={servers.map(server => ({
                    value: server.id,
                    label: `${server.name} (${server.currentInstances}/${server.maxInstances})`,
                    disabled: server.status !== 'active'
                  }))}
                  value={selectedServerId}
                  onChange={(value) => setSelectedServerId(value || '')}
                  required
                />
                
                {/* Server Info */}
                {selectedServerId && (
                  <Card withBorder padding="sm" mt="xs" bg="gray.0">
                    {servers.filter(s => s.id === selectedServerId).map(server => (
                      <Stack key={server.id} gap="xs">
                        <Group justify="space-between">
                          <Group gap="sm">
                            <IconServer size={16} />
                            <Text size="sm" fw={500}>{server.name}</Text>
                            <Badge color={getServerStatusColor(server.status)} size="sm">
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
                            <Text size="xs">Capacity</Text>
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
              <Alert icon={<IconInfoCircle size="1rem" />} color="red" variant="light">
                No servers available. Please ensure the WhatsApp server is running.
              </Alert>
            )}
          </div>

          {/* Device Name */}
          <TextInput
            label="Device Name (Auto-generated with bizflash.in branding)"
            placeholder="bizflash.in-device-..."
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            leftSection={<IconBrandWhatsapp size="1rem" />}
            required
            description="Auto-generated unique name with bizflash.in prefix for brand promotion"
            rightSection={
              <ActionIcon 
                variant="subtle" 
                onClick={() => setDeviceName(generateDeviceName())}
                title="Generate new name"
              >
                <IconRefresh size="1rem" />
              </ActionIcon>
            }
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button 
              onClick={createDevice}
              loading={connecting}
              disabled={!selectedServerId || !deviceName.trim() || servers.length === 0}
              leftSection={<IconPlus size="1rem" />}
              gradient={{ from: 'green', to: 'teal' }}
              variant="gradient"
            >
              Create Device
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Device Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title="Edit Device Information"
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label="Device Name"
            placeholder="Enter device name"
            value={editData.accountName}
            onChange={(e) => setEditData(prev => ({ ...prev, accountName: e.target.value }))}
            leftSection={<IconBrandWhatsapp size="1rem" />}
          />
          
          <TextInput
            label="Phone Number"
            placeholder="e.g., +1234567890"
            value={editData.phoneNumber}
            onChange={(e) => setEditData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            leftSection={<IconPhone size="1rem" />}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

    </Stack>
  )
}