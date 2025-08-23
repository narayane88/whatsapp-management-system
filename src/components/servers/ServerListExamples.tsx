'use client'

import { useState } from 'react'
import { Stack, Title, Text, Group, Button, Select, Switch, Badge } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import ServerList, { ServerConfig } from './ServerList'
import { SERVER_LIST_CONFIGS, QUICK_ACTIONS, createServerListConfig } from './ServerListConfigs'

// Sample server data for demonstration
const SAMPLE_SERVERS: ServerConfig[] = [
  {
    id: 1,
    name: 'WA-Server-01',
    hostname: 'wa-prod-01.company.com',
    ipAddress: '192.168.1.10',
    port: 3001,
    status: 'Online',
    environment: 'Production',
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
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    name: 'WA-Server-02',
    hostname: 'wa-prod-02.company.com',
    ipAddress: '192.168.1.11',
    port: 3002,
    status: 'Online',
    environment: 'Production',
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
    createdAt: '2024-01-16T14:20:00Z'
  },
  {
    id: 3,
    name: 'WA-Server-03',
    hostname: 'wa-maint-01.company.com',
    ipAddress: '192.168.1.12',
    port: 3003,
    status: 'Maintenance',
    environment: 'Production',
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
    createdAt: '2024-01-10T09:15:00Z'
  },
  {
    id: 4,
    name: 'WA-Dev-01',
    hostname: 'wa-dev-01.company.com',
    ipAddress: '192.168.2.10',
    port: 3005,
    status: 'Offline',
    environment: 'Development',
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
    createdAt: '2024-01-20T16:45:00Z'
  },
  {
    id: 5,
    name: 'WA-Staging-01',
    hostname: 'wa-staging-01.company.com',
    ipAddress: '192.168.3.10',
    port: 3006,
    status: 'Warning',
    environment: 'Staging',
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
    createdAt: '2024-01-18T11:30:00Z'
  },
  {
    id: 6,
    name: 'Local-Baileys',
    hostname: 'localhost',
    ipAddress: '127.0.0.1',
    port: 3005,
    status: 'Online',
    environment: 'Development',
    location: 'Local',
    capacity: 10,
    activeUsers: 0,
    messagesPerDay: 0,
    uptime: 100,
    lastHeartbeat: 'Just now',
    version: '1.0.0',
    resources: {
      cpu: 15,
      memory: 25,
      storage: 10,
      network: 5
    },
    whatsappInstances: 0,
    createdAt: '2024-08-15T10:26:00Z',
    metadata: {
      isLocal: true,
      baileysBased: true
    }
  }
]

export default function ServerListExamples() {
  const [selectedConfig, setSelectedConfig] = useState<keyof typeof SERVER_LIST_CONFIGS>('ADMIN_DASHBOARD')
  const [loadingStates, setLoadingStates] = useState<Record<string, string | null>>({})
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)

  // Handle server actions
  const handleServerAction = async (actionId: string, server: ServerConfig) => {
    // Set loading state
    setLoadingStates(prev => ({ ...prev, [server.id]: actionId }))
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      notifications.show({
        title: 'Action Completed',
        message: `Successfully performed ${actionId} on ${server.name}`,
        color: 'green'
      })
      
      console.log(`Action ${actionId} performed on server:`, server.name)
    } catch (error) {
      notifications.show({
        title: 'Action Failed',
        message: `Failed to perform ${actionId} on ${server.name}`,
        color: 'red'
      })
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [server.id]: null }))
    }
  }

  // Custom actions with actual handlers
  const customActions = {
    start: {
      ...QUICK_ACTIONS.START,
      onClick: (server: ServerConfig) => handleServerAction('start', server)
    },
    stop: {
      ...QUICK_ACTIONS.STOP,
      onClick: (server: ServerConfig) => handleServerAction('stop', server)
    },
    restart: {
      ...QUICK_ACTIONS.RESTART,
      onClick: (server: ServerConfig) => handleServerAction('restart', server)
    },
    view: {
      ...QUICK_ACTIONS.VIEW,
      onClick: (server: ServerConfig) => {
        notifications.show({
          title: 'Server Details',
          message: `Viewing details for ${server.name}`,
          color: 'blue'
        })
      }
    },
    edit: {
      ...QUICK_ACTIONS.EDIT,
      onClick: (server: ServerConfig) => {
        notifications.show({
          title: 'Edit Server',
          message: `Opening editor for ${server.name}`,
          color: 'orange'
        })
      }
    },
    delete: {
      ...QUICK_ACTIONS.DELETE,
      onClick: (server: ServerConfig) => {
        if (confirm(`Are you sure you want to delete ${server.name}?`)) {
          notifications.show({
            title: 'Server Deleted',
            message: `${server.name} has been deleted`,
            color: 'red'
          })
        }
      }
    }
  }

  // Get current configuration with custom actions
  const getCurrentConfig = () => {
    const baseConfig = SERVER_LIST_CONFIGS[selectedConfig]
    return {
      ...baseConfig,
      quickActions: baseConfig.quickActions?.map(action => 
        customActions[action.id as keyof typeof customActions] || action
      ),
      menuActions: baseConfig.menuActions?.map(action => 
        customActions[action.id as keyof typeof customActions] || action
      ),
      // Apply online filter if enabled
      filter: showOnlineOnly ? 
        (server: ServerConfig) => {
          const baseFilter = baseConfig.filter?.(server) ?? true
          return baseFilter && server.status === 'Online'
        } : 
        baseConfig.filter,
      onServerClick: (server: ServerConfig) => {
        notifications.show({
          title: 'Server Selected',
          message: `Clicked on ${server.name}`,
          color: 'blue'
        })
      },
      onServerDoubleClick: (server: ServerConfig) => {
        notifications.show({
          title: 'Server Double Clicked',
          message: `Double clicked on ${server.name} - opening details`,
          color: 'green'
        })
      }
    }
  }

  return (
    <Stack gap="xl">
      {/* Configuration Controls */}
      <Group justify="space-between" align="flex-end">
        <Stack gap="sm" style={{ flex: 1 }}>
          <Title order={3}>Server List Configuration Demo</Title>
          <Text size="sm" c="dimmed">
            Choose different configurations to see how the ServerList component adapts
          </Text>
        </Stack>
        
        <Group gap="md">
          <Select
            label="Configuration"
            value={selectedConfig}
            onChange={(value) => setSelectedConfig(value as keyof typeof SERVER_LIST_CONFIGS)}
            data={Object.keys(SERVER_LIST_CONFIGS).map(key => ({
              value: key,
              label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
            }))}
            style={{ minWidth: 200 }}
          />
          
          <Switch
            label="Online only"
            checked={showOnlineOnly}
            onChange={(event) => setShowOnlineOnly(event.currentTarget.checked)}
          />
        </Group>
      </Group>

      {/* Configuration Info */}
      <Group gap="md">
        <Badge variant="light" color="blue">
          Layout: {SERVER_LIST_CONFIGS[selectedConfig].layout}
        </Badge>
        <Badge variant="light" color="green">
          Theme: {SERVER_LIST_CONFIGS[selectedConfig].theme}
        </Badge>
        <Badge variant="light" color="orange">
          Actions: {(SERVER_LIST_CONFIGS[selectedConfig].quickActions?.length || 0) + 
                   (SERVER_LIST_CONFIGS[selectedConfig].menuActions?.length || 0)}
        </Badge>
        <Badge variant="light" color="purple">
          Servers: {SAMPLE_SERVERS.filter(getCurrentConfig().filter || (() => true)).length}
        </Badge>
      </Group>

      {/* Server List */}
      <ServerList
        servers={SAMPLE_SERVERS}
        config={getCurrentConfig()}
        loadingStates={loadingStates}
      />
    </Stack>
  )
}

// Example of using ServerList with custom configuration
export function WhatsAppServerDashboard() {
  const [servers, setServers] = useState<ServerConfig[]>(SAMPLE_SERVERS)
  const [loading, setLoading] = useState(false)
  
  // Custom configuration for WhatsApp servers
  const whatsappConfig = createServerListConfig('WHATSAPP_ACCOUNTS', {
    onServerClick: (server) => {
      console.log('Opening WhatsApp account details for:', server.name)
    },
    customStatusBadge: (status) => (
      <Badge 
        variant={status === 'Online' ? 'filled' : 'light'}
        color={status === 'Online' ? 'green' : status === 'Offline' ? 'red' : 'yellow'}
        size="sm"
      >
        {status === 'Online' ? '🟢 Connected' : 
         status === 'Offline' ? '🔴 Disconnected' : 
         status === 'Connecting' ? '🟡 Connecting' : status}
      </Badge>
    )
  })

  return (
    <Stack gap="lg">
      <Title order={2}>WhatsApp Account Management</Title>
      <ServerList
        servers={servers}
        config={whatsappConfig}
        loading={loading}
      />
    </Stack>
  )
}

// Example of minimal server status list
export function ServerStatusWidget() {
  return (
    <ServerList
      servers={SAMPLE_SERVERS}
      config={SERVER_LIST_CONFIGS.STATUS_LIST}
    />
  )
}

// Example of monitoring dashboard
export function ServerMonitoringDashboard() {
  return (
    <ServerList
      servers={SAMPLE_SERVERS}
      config={{
        ...SERVER_LIST_CONFIGS.MONITORING_VIEW,
        onServerClick: (server) => {
          // Open monitoring details
          console.log('Opening monitoring for:', server.name)
        }
      }}
    />
  )
}