'use client'

import {
  Box,
  Text,
  Stack,
  Group,
  Badge,
  SimpleGrid,
  ActionIcon,
  Modal,
  Progress,
  Alert,
  Loader,
  Center,
  Image,
  Tabs,
  ThemeIcon,
  Tooltip,
  RingProgress,
  Button
} from '@mantine/core'
import { 
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
  FiEdit3,
  FiTrash2,
  FiEye,
  FiMoreVertical
} from 'react-icons/fi'
import { useState } from 'react'
import { notifications } from '@mantine/notifications'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernProgress 
} from '@/components/ui/modern-components'
import {
  ResponsiveGrid,
  ResponsiveCardGrid
} from '@/components/ui/responsive-layout'

export interface ServerConfig {
  id: string | number
  name: string
  hostname?: string
  ipAddress?: string
  port?: number
  status: 'Online' | 'Offline' | 'Maintenance' | 'Warning' | 'Connecting' | 'Error'
  environment?: 'Production' | 'Staging' | 'Development'
  location?: string
  capacity?: number
  activeUsers?: number
  messagesPerDay?: number
  uptime?: number
  lastHeartbeat?: string
  version?: string
  resources?: {
    cpu?: number
    memory?: number
    storage?: number
    network?: number
  }
  whatsappInstances?: number
  createdAt?: string
  updatedAt?: string
  metadata?: Record<string, any>
}

export interface ServerListAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  color: string
  variant?: 'filled' | 'light' | 'outline' | 'subtle'
  disabled?: (server: ServerConfig) => boolean
  loading?: (server: ServerConfig, loadingStates: Record<string, string | null>) => boolean
  onClick: (server: ServerConfig) => void | Promise<void>
  tooltip?: string
  permission?: string
}

export interface ServerListConfig {
  // Display options
  layout: 'grid' | 'list' | 'cards'
  showStats?: boolean
  showResources?: boolean
  showActions?: boolean
  showDetails?: boolean
  compact?: boolean
  
  // Grid options
  columns?: { base: number, sm?: number, md?: number, lg?: number, xl?: number }
  
  // Styling
  theme?: 'default' | 'green' | 'blue' | 'purple' | 'orange'
  borderRadius?: number
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  
  // Actions
  quickActions?: ServerListAction[]
  menuActions?: ServerListAction[]
  
  // Callbacks
  onServerClick?: (server: ServerConfig) => void
  onServerDoubleClick?: (server: ServerConfig) => void
  onRefresh?: () => void
  
  // Filtering & Sorting
  filter?: (server: ServerConfig) => boolean
  sort?: (a: ServerConfig, b: ServerConfig) => number
  
  // Custom renderers
  customServerCard?: (server: ServerConfig, defaultCard: React.ReactNode) => React.ReactNode
  customResourceDisplay?: (resources: ServerConfig['resources']) => React.ReactNode
  customStatusBadge?: (status: ServerConfig['status']) => React.ReactNode
}

interface ServerListProps {
  servers: ServerConfig[]
  config: ServerListConfig
  loading?: boolean
  error?: string | null
  loadingStates?: Record<string, string | null>
  className?: string
  style?: React.CSSProperties
}

const DEFAULT_CONFIG: ServerListConfig = {
  layout: 'cards',
  showStats: true,
  showResources: true,
  showActions: true,
  showDetails: true,
  compact: false,
  columns: { base: 1, lg: 2 },
  theme: 'default',
  spacing: 'md',
  quickActions: [],
  menuActions: []
}

export default function ServerList({
  servers,
  config,
  loading = false,
  error = null,
  loadingStates = {},
  className,
  style
}: ServerListProps) {
  const [selectedServer, setSelectedServer] = useState<ServerConfig | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const { 
    layout, 
    showStats, 
    showResources, 
    showActions, 
    showDetails,
    compact,
    columns,
    theme,
    spacing,
    quickActions,
    menuActions,
    filter,
    sort,
    onServerClick,
    onServerDoubleClick
  } = mergedConfig

  // Apply filtering and sorting
  let processedServers = [...servers]
  if (filter) {
    processedServers = processedServers.filter(filter)
  }
  if (sort) {
    processedServers.sort(sort)
  }

  const getThemeColors = () => {
    switch (theme) {
      case 'green':
        return {
          primary: 'green',
          secondary: 'emerald',
          gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.03) 100%)',
          border: 'rgba(34, 197, 94, 0.15)',
          shadow: 'rgba(34, 197, 94, 0.08)'
        }
      case 'blue':
        return {
          primary: 'blue',
          secondary: 'cyan',
          gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.03) 100%)',
          border: 'rgba(59, 130, 246, 0.15)',
          shadow: 'rgba(59, 130, 246, 0.08)'
        }
      case 'purple':
        return {
          primary: 'purple',
          secondary: 'violet',
          gradient: 'linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)',
          border: 'rgba(147, 51, 234, 0.15)',
          shadow: 'rgba(147, 51, 234, 0.08)'
        }
      case 'orange':
        return {
          primary: 'orange',
          secondary: 'amber',
          gradient: 'linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(245, 158, 11, 0.03) 100%)',
          border: 'rgba(251, 146, 60, 0.15)',
          shadow: 'rgba(251, 146, 60, 0.08)'
        }
      default:
        return {
          primary: 'gray',
          secondary: 'dark',
          gradient: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          border: 'rgba(226, 232, 240, 0.4)',
          shadow: 'rgba(0, 0, 0, 0.06)'
        }
    }
  }

  const getStatusColor = (status: ServerConfig['status']) => {
    switch (status) {
      case 'Online': return 'green'
      case 'Offline': return 'red'
      case 'Maintenance': return 'yellow'
      case 'Warning': return 'orange'
      case 'Connecting': return 'blue'
      case 'Error': return 'red'
      default: return 'gray'
    }
  }

  const getEnvironmentColor = (env?: string) => {
    switch (env) {
      case 'Production': return 'blue'
      case 'Staging': return 'orange'
      case 'Development': return 'purple'
      default: return 'gray'
    }
  }

  const getResourceColor = (percentage?: number) => {
    if (!percentage) return 'gray'
    if (percentage >= 80) return 'red'
    if (percentage >= 60) return 'orange'
    return 'green'
  }

  const handleServerAction = async (action: ServerListAction, server: ServerConfig) => {
    try {
      await action.onClick(server)
    } catch (error) {
      console.error('Server action error:', error)
      notifications.show({
        title: 'Action Failed',
        message: `Failed to ${action.label.toLowerCase()}`,
        color: 'red'
      })
    }
  }

  const handleServerClick = (server: ServerConfig) => {
    if (onServerClick) {
      onServerClick(server)
    } else if (showDetails) {
      setSelectedServer(server)
      setDetailsModalOpen(true)
    }
  }

  const handleServerDoubleClick = (server: ServerConfig) => {
    if (onServerDoubleClick) {
      onServerDoubleClick(server)
    }
  }

  const renderServerCard = (server: ServerConfig) => {
    const themeColors = getThemeColors()
    
    const defaultCard = (
      <ModernCard 
        key={server.id}
        interactive
        style={{
          background: themeColors.gradient,
          border: `2px solid ${themeColors.border}`,
          borderRadius: compact ? '12px' : '16px',
          boxShadow: `0 4px 16px ${themeColors.shadow}`,
          transition: 'all 0.3s ease',
          padding: compact ? '16px' : '24px',
          cursor: onServerClick ? 'pointer' : 'default',
          ...style
        }}
        onMouseEnter={(e: any) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = `0 12px 32px ${themeColors.shadow.replace('0.08', '0.12')}`
        }}
        onMouseLeave={(e: any) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = `0 4px 16px ${themeColors.shadow}`
        }}
        onClick={() => handleServerClick(server)}
        onDoubleClick={() => handleServerDoubleClick(server)}
      >
        {/* Server Header */}
        <Box
          style={{
            background: `linear-gradient(135deg, ${themeColors.border.replace('0.15', '0.08')} 0%, ${themeColors.border.replace('0.15', '0.06')} 100%)`,
            borderRadius: '12px',
            padding: compact ? '12px' : '16px',
            marginBottom: compact ? '16px' : '20px',
            border: `1px solid ${themeColors.border}`
          }}
        >
          <Group justify="space-between" align="flex-start">
            <Group gap={compact ? 'sm' : 'md'}>
              <ThemeIcon 
                size={compact ? 'sm' : 'md'} 
                variant="gradient" 
                gradient={{ from: getStatusColor(server.status), to: `${getStatusColor(server.status)}.7`, deg: 135 }}
                style={{
                  boxShadow: `0 4px 12px rgba(var(--mantine-color-${getStatusColor(server.status)}-6-rgb), 0.3)`
                }}
              >
                <FiServer size={compact ? 16 : 20} />
              </ThemeIcon>
              <Box>
                <Group gap="sm" mb={4}>
                  <Text fw={700} size={compact ? 'sm' : 'md'} c="dark.8">{server.name}</Text>
                  {mergedConfig.customStatusBadge ? 
                    mergedConfig.customStatusBadge(server.status) : 
                    <ModernBadge 
                      variant={server.status === 'Online' ? 'success' : 
                             server.status === 'Maintenance' ? 'warning' : 
                             server.status === 'Warning' ? 'warning' : 'danger'}
                      size={compact ? 'xs' : 'sm'}
                    >
                      {server.status}
                    </ModernBadge>
                  }
                </Group>
                {server.environment && (
                  <Group gap="sm">
                    <ModernBadge 
                      variant="outline" 
                      size="xs"
                      style={{
                        backgroundColor: `var(--mantine-color-${getEnvironmentColor(server.environment)}-0)`,
                        color: `var(--mantine-color-${getEnvironmentColor(server.environment)}-7)`,
                        borderColor: `var(--mantine-color-${getEnvironmentColor(server.environment)}-3)`
                      }}
                    >
                      {server.environment}
                    </ModernBadge>
                    {server.location && (
                      <Group gap="xs">
                        <FiActivity size={12} />
                        <Text size="xs" c="dimmed" fw={500}>{server.location}</Text>
                      </Group>
                    )}
                  </Group>
                )}
              </Box>
            </Group>
            
            {showActions && (quickActions?.length || menuActions?.length) && (
              <Group gap="xs">
                {quickActions?.slice(0, compact ? 2 : 4).map((action) => (
                  <Tooltip key={action.id} label={action.tooltip || action.label}>
                    <ActionIcon
                      size={compact ? 'sm' : 'md'}
                      variant="gradient"
                      gradient={{ from: action.color, to: `${action.color}.7`, deg: 135 }}
                      disabled={action.disabled?.(server) || false}
                      loading={action.loading?.(server, loadingStates) || false}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleServerAction(action, server)
                      }}
                      style={{
                        borderRadius: '8px',
                        boxShadow: `0 2px 8px rgba(var(--mantine-color-${action.color}-6-rgb), 0.3)`,
                        border: `1px solid rgba(var(--mantine-color-${action.color}-4-rgb), 0.3)`,
                        backgroundColor: action.disabled?.(server) 
                          ? 'rgba(229, 231, 235, 0.5)' 
                          : `var(--mantine-color-${action.color}-0)`,
                        color: action.disabled?.(server) 
                          ? 'rgba(156, 163, 175, 1)' 
                          : `var(--mantine-color-${action.color}-7)`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <action.icon size={compact ? 14 : 16} />
                    </ActionIcon>
                  </Tooltip>
                ))}
                {menuActions?.length && (
                  <Tooltip label="More actions">
                    <ActionIcon
                      size={compact ? 'sm' : 'md'}
                      variant="gradient"
                      gradient={{ from: 'gray.5', to: 'gray.7', deg: 135 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle menu actions
                      }}
                      style={{
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(107, 114, 128, 0.3)',
                        border: '1px solid rgba(156, 163, 175, 0.3)',
                        backgroundColor: 'var(--mantine-color-gray-0)',
                        color: 'var(--mantine-color-gray-7)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <FiMoreVertical size={compact ? 14 : 16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            )}
          </Group>
        </Box>

        {/* Server Details */}
        {showDetails && (
          <Stack gap={compact ? 'sm' : 'md'}>
            <SimpleGrid cols={2} spacing={compact ? 'sm' : 'md'}>
              <Stack gap="xs">
                {server.hostname && (
                  <Group justify="space-between">
                    <Text c="dimmed" size="xs">Hostname:</Text>
                    <Text ff="monospace" size="xs">{server.hostname}</Text>
                  </Group>
                )}
                {server.ipAddress && (
                  <Group justify="space-between">
                    <Text c="dimmed" size="xs">IP Address:</Text>
                    <Text ff="monospace" size="xs">{server.ipAddress}</Text>
                  </Group>
                )}
                {server.port && (
                  <Group justify="space-between">
                    <Text c="dimmed" size="xs">Port:</Text>
                    <Text ff="monospace" size="xs">{server.port}</Text>
                  </Group>
                )}
                {server.version && (
                  <Group justify="space-between">
                    <Text c="dimmed" size="xs">Version:</Text>
                    <Text size="xs">{server.version}</Text>
                  </Group>
                )}
              </Stack>
              
              <Stack gap="xs">
                {server.uptime !== undefined && (
                  <Group justify="space-between">
                    <Text c="dimmed" size="xs">Uptime:</Text>
                    <Text size="xs">{server.uptime}%</Text>
                  </Group>
                )}
                {server.whatsappInstances !== undefined && (
                  <Group justify="space-between">
                    <Text c="dimmed" size="xs">Instances:</Text>
                    <Text size="xs">{server.whatsappInstances}</Text>
                  </Group>
                )}
                {server.capacity !== undefined && server.activeUsers !== undefined && (
                  <Group justify="space-between">
                    <Text c="dimmed" size="xs">Capacity:</Text>
                    <Text size="xs">{server.activeUsers}/{server.capacity}</Text>
                  </Group>
                )}
                {server.lastHeartbeat && (
                  <Group justify="space-between">
                    <Text c="dimmed" size="xs">Last Seen:</Text>
                    <Text size="xs">{server.lastHeartbeat}</Text>
                  </Group>
                )}
              </Stack>
            </SimpleGrid>

            {/* Resources */}
            {showResources && server.resources && (
              <Box
                style={{
                  background: 'linear-gradient(135deg, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.8) 100%)',
                  borderRadius: '12px',
                  padding: compact ? '12px' : '16px',
                  border: '1px solid rgba(226, 232, 240, 0.6)'
                }}
              >
                <Group gap="sm" mb={compact ? 'sm' : 'md'}>
                  <ThemeIcon size="sm" variant="light" color={themeColors.primary}>
                    <FiActivity size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="xs" c={`${themeColors.primary}.7`}>Resource Usage</Text>
                </Group>
                
                {mergedConfig.customResourceDisplay ? 
                  mergedConfig.customResourceDisplay(server.resources) :
                  <Stack gap={compact ? 'xs' : 'sm'}>
                    {[
                      { label: 'CPU', value: server.resources.cpu, icon: FiCpu, color: 'blue' },
                      { label: 'Memory', value: server.resources.memory, icon: FiHardDrive, color: 'violet' },
                      { label: 'Storage', value: server.resources.storage, icon: FiHardDrive, color: 'orange' },
                      { label: 'Network', value: server.resources.network, icon: FiWifi, color: 'green' }
                    ].filter(resource => resource.value !== undefined).map((resource) => (
                      <Box key={resource.label}>
                        <Group justify="space-between" mb="xs">
                          <Group gap="xs">
                            <ThemeIcon size="xs" variant="light" color={resource.color}>
                              <resource.icon size={10} />
                            </ThemeIcon>
                            <Text size="xs" fw={500} c="dark.6">{resource.label}</Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="xs" fw={600} c={`${resource.color}.7`}>
                              {resource.value}%
                            </Text>
                            <Text size="xs" c="dimmed">
                              {resource.value! < 50 ? 'Low' : 
                               resource.value! < 80 ? 'Normal' : 'High'}
                            </Text>
                          </Group>
                        </Group>
                        <ModernProgress 
                          value={resource.value!} 
                          variant={
                            resource.value! < 50 ? 'success' : 
                            resource.value! < 80 ? 'warning' : 'danger'
                          } 
                          size="xs" 
                          style={{
                            height: '6px'
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                }
              </Box>
            )}

            {/* Stats */}
            {showStats && (server.activeUsers !== undefined || server.messagesPerDay !== undefined) && (
              <SimpleGrid cols={2} spacing="lg" style={{ 
                marginTop: compact ? '12px' : '16px', 
                paddingTop: compact ? '12px' : '16px', 
                borderTop: `2px solid ${themeColors.border}` 
              }}>
                {server.activeUsers !== undefined && (
                  <Box
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.03) 100%)',
                      borderRadius: '12px',
                      padding: compact ? '12px' : '16px',
                      border: '1px solid rgba(59, 130, 246, 0.15)',
                      textAlign: 'center'
                    }}
                  >
                    <Group gap="xs" justify="center" mb="xs">
                      <ThemeIcon size="xs" variant="light" color="blue">
                        <FiUsers size={12} />
                      </ThemeIcon>
                      <Text size="xs" c="blue.6" fw={600}>Active Users</Text>
                    </Group>
                    <Text 
                      size={compact ? 'sm' : 'md'} 
                      fw={800} 
                      style={{
                        background: 'linear-gradient(135deg, var(--mantine-color-blue-7) 0%, var(--mantine-color-indigo-6) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {server.activeUsers.toLocaleString()}
                    </Text>
                  </Box>
                )}
                {server.messagesPerDay !== undefined && (
                  <Box
                    style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.03) 100%)',
                      borderRadius: '12px',
                      padding: compact ? '12px' : '16px',
                      border: '1px solid rgba(34, 197, 94, 0.15)',
                      textAlign: 'center'
                    }}
                  >
                    <Group gap="xs" justify="center" mb="xs">
                      <ThemeIcon size="xs" variant="light" color="green">
                        <FiMessageSquare size={12} />
                      </ThemeIcon>
                      <Text size="xs" c="green.6" fw={600}>Messages/Day</Text>
                    </Group>
                    <Text 
                      size={compact ? 'sm' : 'md'} 
                      fw={800} 
                      style={{
                        background: 'linear-gradient(135deg, var(--mantine-color-green-7) 0%, var(--mantine-color-emerald-6) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {server.messagesPerDay.toLocaleString()}
                    </Text>
                  </Box>
                )}
              </SimpleGrid>
            )}
          </Stack>
        )}
      </ModernCard>
    )

    return mergedConfig.customServerCard ? 
      mergedConfig.customServerCard(server, defaultCard) : 
      defaultCard
  }

  if (loading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Loader size="xl" color={getThemeColors().primary} />
          <Text c="dimmed">Loading servers...</Text>
        </Stack>
      </Center>
    )
  }

  if (error) {
    return (
      <Alert color="red" title="Failed to load servers">
        {error}
      </Alert>
    )
  }

  if (processedServers.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <ThemeIcon size="xl" variant="light" color="gray">
            <FiServer size={32} />
          </ThemeIcon>
          <Text c="dimmed">No servers found</Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Box className={className} style={style}>
      {layout === 'grid' ? (
        <ResponsiveGrid cols={columns} spacing={spacing}>
          {processedServers.map(renderServerCard)}
        </ResponsiveGrid>
      ) : layout === 'cards' ? (
        <ResponsiveCardGrid minCardWidth={compact ? 320 : 400} gap={spacing}>
          {processedServers.map(renderServerCard)}
        </ResponsiveCardGrid>
      ) : (
        <Stack gap={spacing}>
          {processedServers.map(renderServerCard)}
        </Stack>
      )}

      {/* Server Details Modal */}
      <Modal
        opened={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={selectedServer ? `Server Details: ${selectedServer.name}` : 'Server Details'}
        size="md"
      >
        {selectedServer && (
          <Stack gap="md">
            {/* Add detailed server information here */}
            <Text>Detailed view for {selectedServer.name}</Text>
            <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
          </Stack>
        )}
      </Modal>
    </Box>
  )
}