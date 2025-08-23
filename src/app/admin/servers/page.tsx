'use client'

import {
  Box,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  Card,
  SimpleGrid,
  ActionIcon,
  Modal,
  TextInput,
  Progress,
  Select,
  Alert,
  Loader,
  Center,
  Image,
  Tabs,
  Code,
  ThemeIcon,
  Tooltip,
  RingProgress
} from '@mantine/core'
import { 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiServer, 
  FiPlay, 
  FiPause, 
  FiRotateCcw, 
  FiActivity,
  FiUsers,
  FiMessageSquare,
  FiCpu,
  FiHardDrive,
  FiWifi,
  FiCamera,
  FiLink,
  FiAlertTriangle,
  FiHeart
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernProgress, 
  ModernAlert,
  ModernContainer
} from '@/components/ui/modern-components'
import {
  ResponsiveGrid,
  ResponsiveTwoColumn,
  ResponsiveCardGrid,
  ResponsiveStack
} from '@/components/ui/responsive-layout'

interface Server {
  id: number;
  name: string;
  hostname: string;
  ipAddress: string;
  port: number;
  status: 'Online' | 'Offline' | 'Maintenance' | 'Warning';
  environment: 'Production' | 'Staging' | 'Development';
  location: string;
  capacity: number;
  activeUsers: number;
  messagesPerDay: number;
  uptime: number;
  lastHeartbeat: string;
  version: string;
  resources: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  whatsappInstances: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    name: string;
    email: string;
  } | null;
}

interface Statistics {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  maintenanceServers: number;
  warningServers: number;
  totalUsers: number;
  totalMessages: number;
  totalInstances: number;
  averageUptime: number;
}

interface CreateServerData {
  name: string;
  hostname: string;
  ipAddress: string;
  port: number;
  environment: string;
  location: string;
  capacity: number;
  whatsappInstances: number;
  version: string;
}

interface AddServerData {
  name: string;
  hostname: string;
  port: number;
  environment: string;
  location: string;
  status: string;
  maxInstances: number;
  features: string[];
  description: string;
}

export default function ServersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false)
  const [selectedServer, setSelectedServer] = useState<Server | null>(null)
  const [servers, setServers] = useState<Server[]>([])
  const [statistics, setStatistics] = useState<Statistics>({ 
    totalServers: 0, onlineServers: 0, offlineServers: 0, 
    maintenanceServers: 0, warningServers: 0, totalUsers: 0, 
    totalMessages: 0, totalInstances: 0, averageUptime: 0 
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<{[key: number]: string | null}>({})
  const [createLoading, setCreateLoading] = useState(false)
  const [addServerLoading, setAddServerLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<{[key: string]: boolean}>({})
  const [healthCheckLoading, setHealthCheckLoading] = useState<{[key: string]: boolean}>({})
  const [serverHealthStatus, setServerHealthStatus] = useState<{[key: string]: {status: string, responseTime?: number, lastCheck?: string}}>({})
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [createServerData, setCreateServerData] = useState<CreateServerData>({
    name: '',
    hostname: '',
    ipAddress: '',
    port: 3001,
    environment: 'Development',
    location: 'Local',
    capacity: 100,
    whatsappInstances: 1,
    version: '1.0.0'
  })
  const [addServerData, setAddServerData] = useState<AddServerData>({
    name: '',
    hostname: '',
    port: 3110,
    environment: 'development',
    location: 'Local',
    status: 'active',
    maxInstances: 50,
    features: ['qr-generation', 'messaging'],
    description: ''
  })

  // Fetch servers from API
  const fetchServers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/servers')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setServers(data.servers || [])
      setStatistics(data.statistics || statistics)
    } catch (error) {
      console.error('Failed to fetch servers:', error)
      setError(error instanceof Error ? error.message : 'Failed to load servers')
      setServers([])
    } finally {
      setLoading(false)
    }
  }

  // Perform server action
  const performServerAction = async (serverId: number, action: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [serverId]: action }))
      
      const response = await fetch('/api/admin/servers/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serverId, action }),
      })

      const data = await response.json()

      if (response.ok) {
        setNotification({ message: data.message || `Server ${action} completed successfully`, type: 'success' })
        fetchServers() // Refresh servers list
      } else {
        setNotification({ message: data.error || `Failed to ${action} server`, type: 'error' })
      }
    } catch (error) {
      setNotification({ message: `Network error while performing ${action}`, type: 'error' })
    } finally {
      setActionLoading(prev => ({ ...prev, [serverId]: null }))
    }
  }

  // Connect new WhatsApp account
  const handleCreateServer = async () => {
    if (!createServerData.name) {
      setNotification({ message: 'Please enter an account name', type: 'error' })
      return
    }

    try {
      setCreateLoading(true)
      const response = await fetch('/api/admin/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: createServerData.name }),
      })

      const data = await response.json()

      if (response.ok) {
        setNotification({ message: 'WhatsApp account connection initiated. Please scan the QR code on your phone.', type: 'success' })
        setIsCreateModalOpen(false)
        setCreateServerData({
          name: '', hostname: '', ipAddress: '', port: 3001,
          environment: 'Development', location: 'Local', capacity: 100,
          whatsappInstances: 1, version: '1.0.0'
        })
        fetchServers() // Refresh servers list
      } else {
        setNotification({ message: data.error || 'Failed to connect WhatsApp account', type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error occurred', type: 'error' })
    } finally {
      setCreateLoading(false)
    }
  }

  // Refresh all servers
  const handleRefreshAll = () => {
    fetchServers()
  }

  // Open edit modal for server
  const handleEditServer = (server: Server) => {
    setSelectedServer(server)
    setQrCodeData(null)
    setIsEditModalOpen(true)
  }

  // Get QR code for account
  const handleGetQRCode = async (accountId: string) => {
    try {
      setEditLoading(true)
      const response = await fetch('/api/admin/servers/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'getQR', accountId }),
      })

      const data = await response.json()

      if (response.ok && data.data?.qrCode) {
        setQrCodeData(data.data.qrCode)
        setNotification({ message: 'QR code retrieved successfully', type: 'success' })
      } else {
        setNotification({ message: data.error || 'Failed to get QR code', type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error occurred', type: 'error' })
    } finally {
      setEditLoading(false)
    }
  }

  // Disconnect account
  const handleDisconnectAccount = async (accountId: string) => {
    try {
      setEditLoading(true)
      const response = await fetch('/api/admin/servers/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'disconnect', accountId }),
      })

      const data = await response.json()

      if (response.ok) {
        setNotification({ message: 'Account disconnected successfully', type: 'success' })
        setIsEditModalOpen(false)
        fetchServers() // Refresh servers list
      } else {
        setNotification({ message: data.error || 'Failed to disconnect account', type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error occurred', type: 'error' })
    } finally {
      setEditLoading(false)
    }
  }

  // Add new WhatsApp server
  const handleAddServer = async () => {
    // Validate required fields
    if (!addServerData.name || !addServerData.hostname || !addServerData.port) {
      setNotification({ message: 'Please fill in all required fields', type: 'error' })
      return
    }

    try {
      setAddServerLoading(true)
      const response = await fetch('/api/whatsapp-servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addServerData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setNotification({ message: 'WhatsApp server added successfully to configuration', type: 'success' })
        setIsAddServerModalOpen(false)
        setAddServerData({
          name: '',
          hostname: '',
          port: 3110,
          environment: 'development',
          location: 'Local',
          status: 'active',
          maxInstances: 50,
          features: ['qr-generation', 'messaging'],
          description: ''
        })
        fetchServers() // Refresh servers list
      } else {
        setNotification({ message: data.error || 'Failed to add WhatsApp server', type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error occurred', type: 'error' })
    } finally {
      setAddServerLoading(false)
    }
  }

  // Delete WhatsApp server
  const handleDeleteServer = async (serverId: string, serverName: string) => {
    if (!confirm(`Are you sure you want to delete "${serverName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeleteLoading(prev => ({ ...prev, [serverId]: true }))
      const response = await fetch(`/api/whatsapp-servers?serverId=${encodeURIComponent(serverId)}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setNotification({ message: 'WhatsApp server deleted successfully', type: 'success' })
        fetchServers() // Refresh servers list
      } else {
        setNotification({ message: data.error || 'Failed to delete WhatsApp server', type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error occurred', type: 'error' })
    } finally {
      setDeleteLoading(prev => ({ ...prev, [serverId]: false }))
    }
  }

  // Health check WhatsApp server
  const handleHealthCheck = async (serverId: string, serverUrl: string, serverName: string) => {
    try {
      setHealthCheckLoading(prev => ({ ...prev, [serverId]: true }))
      const startTime = Date.now()
      
      // Try to reach the server's health endpoint
      const healthUrl = `${serverUrl}/api/health`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      const currentTime = new Date().toLocaleTimeString()
      
      if (response.ok) {
        setServerHealthStatus(prev => ({
          ...prev,
          [serverId]: {
            status: 'healthy',
            responseTime: responseTime,
            lastCheck: currentTime
          }
        }))
        setNotification({ 
          message: `✅ ${serverName} is healthy (${responseTime}ms)`, 
          type: 'success' 
        })
      } else {
        setServerHealthStatus(prev => ({
          ...prev,
          [serverId]: {
            status: 'unhealthy',
            responseTime: responseTime,
            lastCheck: currentTime
          }
        }))
        setNotification({ 
          message: `❌ ${serverName} is unhealthy (HTTP ${response.status})`, 
          type: 'error' 
        })
      }
    } catch (error) {
      const responseTime = Date.now() - Date.now()
      const currentTime = new Date().toLocaleTimeString()
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        setServerHealthStatus(prev => ({
          ...prev,
          [serverId]: {
            status: 'timeout',
            lastCheck: currentTime
          }
        }))
        setNotification({ 
          message: `⏱️ ${serverName} health check timed out`, 
          type: 'error' 
        })
      } else {
        setServerHealthStatus(prev => ({
          ...prev,
          [serverId]: {
            status: 'error',
            lastCheck: currentTime
          }
        }))
        setNotification({ 
          message: `💥 ${serverName} is not reachable`, 
          type: 'error' 
        })
      }
    } finally {
      setHealthCheckLoading(prev => ({ ...prev, [serverId]: false }))
    }
  }

  useEffect(() => {
    fetchServers()
  }, [])

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const sampleServers = [
    {
      id: 1,
      name: 'WA-Server-01',
      hostname: 'wa-prod-01.company.com',
      ipAddress: '192.168.1.10',
      status: 'Online',
      location: 'US East',
      capacity: 500,
      activeUsers: 450,
      messagesPerDay: 12543,
      uptime: 99.9,
      lastHeartbeat: '30 seconds ago',
      version: '2.3.1',
      resources: {
        cpu: 45,
        memory: 67,
        storage: 34,
        network: 23
      },
      whatsappInstances: 5,
      port: 3001,
      environment: 'Production'
    },
    {
      id: 2,
      name: 'WA-Server-02',
      hostname: 'wa-prod-02.company.com',
      ipAddress: '192.168.1.11',
      status: 'Online',
      location: 'US West',
      capacity: 400,
      activeUsers: 325,
      messagesPerDay: 8921,
      uptime: 98.5,
      lastHeartbeat: '1 minute ago',
      version: '2.3.1',
      resources: {
        cpu: 32,
        memory: 54,
        storage: 28,
        network: 19
      },
      whatsappInstances: 4,
      port: 3002,
      environment: 'Production'
    },
    {
      id: 3,
      name: 'WA-Server-03',
      hostname: 'wa-maint-01.company.com',
      ipAddress: '192.168.1.12',
      status: 'Maintenance',
      location: 'EU Central',
      capacity: 600,
      activeUsers: 0,
      messagesPerDay: 0,
      uptime: 95.2,
      lastHeartbeat: '5 minutes ago',
      version: '2.2.8',
      resources: {
        cpu: 5,
        memory: 15,
        storage: 42,
        network: 2
      },
      whatsappInstances: 0,
      port: 3003,
      environment: 'Production'
    },
    {
      id: 4,
      name: 'WA-Server-04',
      hostname: 'wa-prod-03.company.com',
      ipAddress: '192.168.1.13',
      status: 'Online',
      location: 'Asia Pacific',
      capacity: 800,
      activeUsers: 678,
      messagesPerDay: 15420,
      uptime: 99.1,
      lastHeartbeat: '15 seconds ago',
      version: '2.3.1',
      resources: {
        cpu: 58,
        memory: 72,
        storage: 39,
        network: 31
      },
      whatsappInstances: 8,
      port: 3004,
      environment: 'Production'
    },
    {
      id: 5,
      name: 'WA-Dev-01',
      hostname: 'wa-dev-01.company.com',
      ipAddress: '192.168.2.10',
      status: 'Offline',
      location: 'Development',
      capacity: 100,
      activeUsers: 0,
      messagesPerDay: 0,
      uptime: 87.3,
      lastHeartbeat: '2 hours ago',
      version: '2.4.0-beta',
      resources: {
        cpu: 0,
        memory: 0,
        storage: 15,
        network: 0
      },
      whatsappInstances: 0,
      port: 3005,
      environment: 'Development'
    },
    {
      id: 6,
      name: 'WA-Server-05',
      hostname: 'wa-staging-01.company.com',
      ipAddress: '192.168.3.10',
      status: 'Warning',
      location: 'Staging',
      capacity: 200,
      activeUsers: 45,
      messagesPerDay: 1200,
      uptime: 92.8,
      lastHeartbeat: '3 minutes ago',
      version: '2.3.2-rc1',
      resources: {
        cpu: 85,
        memory: 91,
        storage: 67,
        network: 45
      },
      whatsappInstances: 2,
      port: 3006,
      environment: 'Staging'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Online': return 'green'
      case 'Offline': return 'red'
      case 'Maintenance': return 'yellow'
      case 'Warning': return 'orange'
      default: return 'gray'
    }
  }

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'Production': return 'blue'
      case 'Staging': return 'orange'
      case 'Development': return 'purple'
      default: return 'gray'
    }
  }

  const getResourceColor = (percentage: number) => {
    if (percentage >= 80) return 'red'
    if (percentage >= 60) return 'orange'
    return 'green'
  }

  // Show notification
  useEffect(() => {
    if (notification) {
      // You could use a toast library here instead of console.log
      console.log(`${notification.type}: ${notification.message}`)
    }
  }, [notification])

  return (
    <PagePermissionGuard requiredPermissions={['servers.page.access']}>
      <AdminLayout>
        <ModernContainer fluid>
          <ResponsiveStack gap="xl">
            {/* Enhanced Header */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.03) 100%)',
                border: '2px solid rgba(34, 197, 94, 0.15)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(34, 197, 94, 0.08)',
                padding: '32px'
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Group gap="lg">
                  <ThemeIcon 
                    size="2xl" 
                    color="green.7"
                    variant="filled"
                    style={{
                      boxShadow: '0 8px 24px rgba(var(--mantine-color-green-7), 0.3)'
                    }}
                  >
                    <FiServer size={28} />
                  </ThemeIcon>
                  <Box>
                    <Title 
                      order={2} 
                      mb={8}
                      c="green.7"
                    >
                      WhatsApp Server Management
                    </Title>
                    <Text c="dimmed" size="md" fw={500} mb="lg">
                      Monitor and manage WhatsApp accounts connected to your Baileys server infrastructure
                    </Text>
                    
                    {/* Quick Status Indicators */}
                    <Group gap="xl">
                      <Group gap="xs">
                        <FiServer size={16} color="var(--mantine-color-green-7)" />
                        <Text size="sm" c="dimmed">Total:</Text>
                        <Text size="sm" fw={700} c="green.7">
                          {statistics.totalServers}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <FiActivity size={16} color="var(--mantine-color-green-7)" />
                        <Text size="sm" c="dimmed">Online:</Text>
                        <Text size="sm" fw={700} c="green.7">
                          {statistics.onlineServers}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <FiUsers size={16} color="var(--mantine-color-green-7)" />
                        <Text size="sm" c="dimmed">Users:</Text>
                        <Text size="sm" fw={700} c="green.7">
                          {statistics.totalUsers.toLocaleString()}
                        </Text>
                      </Group>
                    </Group>
                  </Box>
                </Group>
                
                <Group gap="sm">
                  <Tooltip label="Refresh all servers">
                    <ActionIcon 
                      size="lg" 
                      variant="filled"
                      color="green.7"
                      onClick={handleRefreshAll}
                      loading={loading}
                      style={{
                        boxShadow: '0 4px 12px rgba(var(--mantine-color-green-7), 0.3)'
                      }}
                    >
                      <FiRotateCcw size={18} />
                    </ActionIcon>
                  </Tooltip>
                  
                  <ModernButton
                    leftSection={<FiServer size={16} />}
                    onClick={() => setIsAddServerModalOpen(true)}
                    style={{
                      backgroundColor: 'var(--mantine-color-green-7)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(var(--mantine-color-green-7), 0.3)',
                      color: 'white'
                    }}
                  >
                    Add New Server
                  </ModernButton>
                  
                  <ModernButton
                    leftSection={<FiPlus size={16} />}
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{
                      backgroundColor: 'var(--mantine-color-green-7)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(var(--mantine-color-green-7), 0.3)',
                      color: 'white'
                    }}
                  >
                    Connect Account
                  </ModernButton>
                </Group>
              </Group>
            </ModernCard>

            {/* Enhanced Statistics */}
            <ResponsiveCardGrid minCardWidth={240} gap="lg">
              {[
                {
                  label: 'Total Servers',
                  value: statistics.totalServers,
                  icon: FiServer,
                  color: 'green',
                  description: 'Infrastructure nodes',
                  change: 0,
                  progress: Math.min((statistics.totalServers / 10) * 100, 100)
                },
                {
                  label: 'Online Servers',
                  value: statistics.onlineServers,
                  icon: FiActivity,
                  color: 'emerald',
                  description: 'Active instances',
                  change: statistics.totalServers > 0 ? ((statistics.onlineServers / statistics.totalServers) * 100 - 80) : 0,
                  progress: statistics.totalServers > 0 ? (statistics.onlineServers / statistics.totalServers) * 100 : 0
                },
                {
                  label: 'Active Users',
                  value: statistics.totalUsers.toLocaleString(),
                  icon: FiUsers,
                  color: 'green',
                  description: 'Connected clients',
                  change: 15.3,
                  progress: Math.min((statistics.totalUsers / 5000) * 100, 100)
                },
                {
                  label: 'Messages/Day',
                  value: statistics.totalMessages.toLocaleString(),
                  icon: FiMessageSquare,
                  color: 'emerald',
                  description: 'Daily throughput',
                  change: 8.7,
                  progress: Math.min((statistics.totalMessages / 100000) * 100, 100)
                }
              ].map((stat, index) => (
                <ModernCard 
                  key={index} 
                  interactive
                  style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.95) 100%)',
                    border: '2px solid rgba(34, 197, 94, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.06)',
                    transition: 'all 0.4s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e: any) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(34, 197, 94, 0.15)'
                    e.currentTarget.style.borderColor = `var(--mantine-color-${stat.color}-4)`
                  }}
                  onMouseLeave={(e: any) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.06)'
                    e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.1)'
                  }}
                >
                  {/* Decorative background element */}
                  <Box
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '60px',
                      height: '60px',
                      background: `linear-gradient(135deg, var(--mantine-color-${stat.color}-1) 0%, var(--mantine-color-${stat.color}-2) 100%)`,
                      borderRadius: '0 12px 0 40px',
                      opacity: 0.6,
                      zIndex: 0
                    }}
                  />
                  
                  <Box style={{ position: 'relative', zIndex: 1 }}>
                    <Group justify="space-between" align="flex-start" mb="lg">
                      <Group gap="md">
                        <ThemeIcon 
                          size="xl" 
                          variant="gradient" 
                          gradient={{ from: stat.color, to: `${stat.color}.7`, deg: 135 }}
                          style={{
                            boxShadow: `0 6px 16px rgba(var(--mantine-color-${stat.color}-6-rgb), 0.4)`
                          }}
                        >
                          <stat.icon size={22} />
                        </ThemeIcon>
                        <Box>
                          <Text 
                            c={`${stat.color}.7`} 
                            size="sm" 
                            fw={700} 
                            tt="uppercase" 
                            mb={4}
                          >
                            {stat.label}
                          </Text>
                          <Text size="xs" c="dimmed" fw={500}>
                            {stat.description}
                          </Text>
                        </Box>
                      </Group>
                    </Group>
                    
                    <Group justify="space-between" align="flex-end" wrap="nowrap">
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text 
                          size={(() => {
                            const valueStr = stat.value.toString();
                            if (valueStr.length > 8) return 'xl';
                            if (valueStr.length > 6) return '2xl';
                            return '2xl';
                          })()} 
                          fw={800} 
                          lh={1}
                          mb="sm"
                          style={{
                            background: `linear-gradient(135deg, var(--mantine-color-${stat.color}-8) 0%, var(--mantine-color-${stat.color}-6) 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}
                        >
                          {stat.value}
                        </Text>
                        {stat.change !== 0 && (
                          <Group gap="xs">
                            <ThemeIcon 
                              size="sm" 
                              variant="light" 
                              color={stat.change > 0 ? 'green' : 'red'}
                            >
                              {stat.change > 0 ? '↗' : '↘'}
                            </ThemeIcon>
                            <Text 
                              c={stat.change > 0 ? 'green.7' : 'red.7'} 
                              size="xs" 
                              fw={600}
                            >
                              {Math.abs(stat.change).toFixed(1)}%
                            </Text>
                          </Group>
                        )}
                      </Box>
                      
                      <Box>
                        <RingProgress
                          size={60}
                          thickness={6}
                          sections={[
                            { 
                              value: stat.progress, 
                              color: stat.color
                            }
                          ]}
                          label={
                            <Text size="xs" ta="center" fw={600} c={`${stat.color}.7`}>
                              {Math.round(stat.progress)}%
                            </Text>
                          }
                          style={{
                            filter: `drop-shadow(0 4px 8px rgba(var(--mantine-color-${stat.color}-6-rgb), 0.3))`
                          }}
                        />
                      </Box>
                    </Group>
                  </Box>
                </ModernCard>
              ))}
            </ResponsiveCardGrid>

            {/* Compact Servers Grid */}
            <ResponsiveGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
              {(servers.length > 0 ? servers : sampleServers).map((server) => (
                <ModernCard 
                  key={server.id} 
                  interactive
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
                    border: '1px solid rgba(34, 197, 94, 0.08)',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.04)',
                    transition: 'all 0.3s ease',
                    padding: '16px',
                    minHeight: '200px'
                  }}
                  onMouseEnter={(e: any) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.12)'
                    e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.2)'
                  }}
                  onMouseLeave={(e: any) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.04)'
                    e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.08)'
                  }}
                >
                  {/* Compact Server Header */}
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                      <Group gap="sm">
                        <ThemeIcon 
                          size="md" 
                          variant="gradient" 
                          gradient={{ from: getStatusColor(server.status), to: `${getStatusColor(server.status)}.7`, deg: 135 }}
                          style={{
                            boxShadow: `0 2px 8px rgba(var(--mantine-color-${getStatusColor(server.status)}-6-rgb), 0.2)`
                          }}
                        >
                          <FiServer size={16} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text fw={700} size="sm" c="dark.8" mb={4}>{server.name}</Text>
                          <Group gap="xs">
                            <ModernBadge 
                              variant={server.status === 'Online' ? 'success' : 
                                     server.status === 'Maintenance' ? 'warning' : 
                                     server.status === 'Warning' ? 'warning' : 'danger'}
                              size="xs"
                            >
                              {server.status}
                            </ModernBadge>
                            {serverHealthStatus[server.id] && (
                              <ModernBadge 
                                variant={
                                  serverHealthStatus[server.id].status === 'healthy' ? 'success' :
                                  serverHealthStatus[server.id].status === 'unhealthy' ? 'danger' :
                                  serverHealthStatus[server.id].status === 'timeout' ? 'warning' : 'danger'
                                }
                                size="xs"
                              >
                                {serverHealthStatus[server.id].status === 'healthy' ? '💚' :
                                 serverHealthStatus[server.id].status === 'unhealthy' ? '❌' :
                                 serverHealthStatus[server.id].status === 'timeout' ? '⏱️' : '💥'} 
                                {serverHealthStatus[server.id].responseTime ? 
                                  `${serverHealthStatus[server.id].responseTime}ms` : 
                                  ''}
                              </ModernBadge>
                            )}
                          </Group>
                        </Box>
                      </Group>
                      
                      <Group gap="xs">
                        <Tooltip label="Health Check">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="teal"
                            loading={healthCheckLoading[server.id]}
                            onClick={() => handleHealthCheck(server.id, `http://${server.ipAddress}:${server.port}`, server.name)}
                            style={{
                              borderRadius: '6px'
                            }}
                          >
                            <FiHeart size={12} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete Server">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="red"
                            loading={deleteLoading[server.id]}
                            onClick={() => handleDeleteServer(server.id, server.name)}
                            style={{
                              borderRadius: '6px'
                            }}
                          >
                            <FiTrash2 size={12} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                    {/* Compact Server Info */}
                    <Stack gap="xs" style={{ fontSize: '12px' }}>
                      <Group justify="space-between">
                        <Text c="dimmed" size="xs">Environment:</Text>
                        <ModernBadge variant="outline" size="xs">
                          {server.environment}
                        </ModernBadge>
                      </Group>
                      <Group justify="space-between">
                        <Text c="dimmed" size="xs">Location:</Text>
                        <Text size="xs" c="dark.6">{server.location}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text c="dimmed" size="xs">URL:</Text>
                        <Text ff="monospace" size="xs" c="dark.6">
                          {server.ipAddress}:{server.port}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text c="dimmed" size="xs">Max Instances:</Text>
                        <Text size="xs" c="dark.6">{server.capacity}</Text>
                      </Group>
                    </Stack>

                    {/* Quick Stats */}
                    <Group justify="space-between" align="center" style={{ 
                      padding: '8px 12px', 
                      backgroundColor: 'rgba(34, 197, 94, 0.04)',
                      borderRadius: '8px',
                      marginTop: '8px'
                    }}>
                      <Group gap="md">
                        <Box ta="center">
                          <Text size="xs" c="dimmed">Users</Text>
                          <Text size="sm" fw={600} c="green.7">{server.activeUsers || 0}</Text>
                        </Box>
                        <Box ta="center">
                          <Text size="xs" c="dimmed">Uptime</Text>
                          <Text size="sm" fw={600} c="blue.7">{server.uptime || 0}%</Text>
                        </Box>
                        <Box ta="center">
                          <Text size="xs" c="dimmed">Version</Text>
                          <Text size="xs" fw={500} c="gray.7">{server.version}</Text>
                        </Box>
                      </Group>
                    </Group>
                  </Stack>
                </ModernCard>
              ))}
            </ResponsiveGrid>

        {/* Add Server Modal */}
        <Modal
          opened={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Connect New WhatsApp Account"
          size="md"
        >
          <Stack gap="md">
            <TextInput
              label="Account Name"
              placeholder="e.g., Business-Account-01"
              value={createServerData.name}
              onChange={(event) => setCreateServerData(prev => ({ ...prev, name: event.target.value || '' }))}
              required
              description="This will be used as the identifier for your WhatsApp account"
            />

            <Alert color="blue" title="Connection Process">
              After clicking &ldquo;Connect Account&rdquo;, you&rsquo;ll need to:
              <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Scan the QR code with WhatsApp on your phone</li>
                <li>Wait for the connection to be established</li>
                <li>The account will appear in your server dashboard</li>
              </ol>
            </Alert>

            <Group justify="flex-end" mt="lg">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                color="green"
                onClick={handleCreateServer}
                loading={createLoading}
              >
                Connect Account
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Edit Server/Account Modal */}
        <Modal
          opened={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={selectedServer ? `Manage WhatsApp Account: ${selectedServer.name}` : 'Manage Account'}
          size="lg"
        >
          {selectedServer && (
            <Stack gap="md">
              <Alert color="blue" title="Account Information">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Account Name:</Text>
                    <Text size="sm" fw="500">{selectedServer.name}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Status:</Text>
                    <Badge color={getStatusColor(selectedServer.status)} variant="light">
                      {selectedServer.status}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">WhatsApp Instances:</Text>
                    <Text size="sm" fw="500">{selectedServer.whatsappInstances}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Last Seen:</Text>
                    <Text size="sm">{selectedServer.lastHeartbeat}</Text>
                  </Group>
                </Stack>
              </Alert>

              <Tabs defaultValue="actions">
                <Tabs.List>
                  <Tabs.Tab value="actions">Account Actions</Tabs.Tab>
                  <Tabs.Tab value="qr">QR Code</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="actions" pt="md">
                  <Stack gap="md">
                    <Alert color="yellow" title="Available Actions">
                      Manage your WhatsApp account connection and status.
                    </Alert>
                    
                    <SimpleGrid cols={2} spacing="md">
                      <Button
                        variant="outline"
                        color="blue"
                        leftSection={<Box component={FiCamera} />}
                        onClick={() => handleGetQRCode(selectedServer.name.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        loading={editLoading}
                        disabled={selectedServer.status === 'Online'}
                      >
                        Get QR Code
                      </Button>
                      <Button
                        variant="outline"
                        color="red"
                        leftSection={<Box component={FiLink} />}
                        onClick={() => handleDisconnectAccount(selectedServer.name.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        loading={editLoading}
                        disabled={selectedServer.status === 'Offline'}
                      >
                        Disconnect
                      </Button>
                    </SimpleGrid>

                    {selectedServer.status === 'Offline' && (
                      <Alert color="red" title="Account Disconnected">
                        This account is currently disconnected. Use &ldquo;Get QR Code&rdquo; to reconnect.
                      </Alert>
                    )}

                    {selectedServer.status === 'Online' && (
                      <Alert color="green" title="Account Connected">
                        This account is currently connected and active.
                      </Alert>
                    )}
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="qr" pt="md">
                  <Stack gap="md" align="center">
                    {qrCodeData ? (
                      <>
                        <Alert color="green" title="QR Code Ready">
                          Scan this QR code with WhatsApp on your phone to connect the account.
                        </Alert>
                        <Box style={{ maxWidth: '300px', width: '100%' }}>
                          <Image
                            src={qrCodeData}
                            alt="WhatsApp QR Code"
                            style={{ width: '100%', height: 'auto' }}
                          />
                        </Box>
                        <Text size="sm" c="dimmed" ta="center">
                          Open WhatsApp → Settings → Linked Devices → Link a Device → Scan this code
                        </Text>
                      </>
                    ) : (
                      <Stack align="center" gap="md">
                        <Alert color="blue" title="No QR Code Available">
                          Click &ldquo;Get QR Code&rdquo; in the Actions tab to generate a new QR code for this account.
                        </Alert>
                        <Button
                          leftSection={<Box component={FiCamera} />}
                          onClick={() => handleGetQRCode(selectedServer.name.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                          loading={editLoading}
                        >
                          Generate QR Code
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </Tabs.Panel>
              </Tabs>

              <Group justify="flex-end" mt="lg">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Close
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>

        {/* Add New Server Modal */}
        <Modal
          opened={isAddServerModalOpen}
          onClose={() => setIsAddServerModalOpen(false)}
          title="Add New WhatsApp Server"
          size="lg"
        >
          <Stack gap="md">
            <Alert color="blue" title="Server Configuration">
              Add a new WhatsApp server to your infrastructure. This will be added to the global server configuration and can be used by customers.
            </Alert>

            <SimpleGrid cols={2} spacing="md">
              <TextInput
                label="Server Name"
                placeholder="e.g., WA-Server-05"
                value={addServerData.name}
                onChange={(event) => setAddServerData(prev => ({ ...prev, name: event.target.value }))}
                required
                description="Unique identifier for the server"
              />
              
              <TextInput
                label="Hostname/IP"
                placeholder="e.g., 127.0.0.1 or wa-server.domain.com"
                value={addServerData.hostname}
                onChange={(event) => setAddServerData(prev => ({ ...prev, hostname: event.target.value }))}
                required
                description="Server hostname or IP address"
              />
            </SimpleGrid>

            <SimpleGrid cols={2} spacing="md">
              <TextInput
                label="Port"
                placeholder="3110"
                type="number"
                value={addServerData.port.toString()}
                onChange={(event) => setAddServerData(prev => ({ ...prev, port: parseInt(event.target.value) || 3110 }))}
                required
                description="Server port number"
              />

              <Select
                label="Environment"
                value={addServerData.environment}
                onChange={(value) => setAddServerData(prev => ({ ...prev, environment: value || 'development' }))}
                data={[
                  { value: 'development', label: 'Development' },
                  { value: 'testing', label: 'Testing' },
                  { value: 'staging', label: 'Staging' },
                  { value: 'production', label: 'Production' }
                ]}
                required
                description="Server environment type"
              />
            </SimpleGrid>

            <SimpleGrid cols={2} spacing="md">
              <TextInput
                label="Location"
                placeholder="e.g., Local, US East, EU Central"
                value={addServerData.location}
                onChange={(event) => setAddServerData(prev => ({ ...prev, location: event.target.value }))}
                required
                description="Physical or logical location"
              />

              <Select
                label="Initial Status"
                value={addServerData.status}
                onChange={(value) => setAddServerData(prev => ({ ...prev, status: value || 'inactive' }))}
                data={[
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'active', label: 'Active' },
                  { value: 'maintenance', label: 'Maintenance' }
                ]}
                required
                description="Initial server status"
              />
            </SimpleGrid>

            <TextInput
              label="Max Instances"
              placeholder="50"
              type="number"
              value={addServerData.maxInstances.toString()}
              onChange={(event) => setAddServerData(prev => ({ ...prev, maxInstances: parseInt(event.target.value) || 50 }))}
              required
              description="Maximum WhatsApp instances this server can handle"
            />

            <TextInput
              label="Description"
              placeholder="e.g., High-performance server for production workloads"
              value={addServerData.description}
              onChange={(event) => setAddServerData(prev => ({ ...prev, description: event.target.value }))}
              description="Optional description for the server"
            />

            <Alert color="green" title="Features">
              This server will be configured with the following features:
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>QR Code Generation</li>
                <li>Message Sending & Receiving</li>
                <li>Contact Management</li>
                <li>Health Monitoring</li>
              </ul>
            </Alert>

            <Group justify="flex-end" mt="lg">
              <Button variant="outline" onClick={() => setIsAddServerModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                color="blue"
                onClick={handleAddServer}
                loading={addServerLoading}
                leftSection={<FiServer size={16} />}
              >
                Add Server
              </Button>
            </Group>
          </Stack>
        </Modal>
          </ResponsiveStack>
        </ModernContainer>
      </AdminLayout>
    </PagePermissionGuard>
  )
}