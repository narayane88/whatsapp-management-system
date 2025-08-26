'use client'

import { useState, useEffect } from 'react'
import { Badge, Group, Text, Tooltip, ActionIcon, Progress, Box } from '@mantine/core'
import { IconWifi, IconWifiOff, IconRefresh, IconServer, IconUsers, IconBrandWhatsapp } from '@tabler/icons-react'

interface SystemStatus {
  isOnline: boolean
  serverLoad: number
  activeUsers: number
  whatsappConnections: number
  lastUpdated: Date
}

export default function AdminStatusIndicator() {
  const [status, setStatus] = useState<SystemStatus>({
    isOnline: true,
    serverLoad: 45,
    activeUsers: 12,
    whatsappConnections: 8,
    lastUpdated: new Date()
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(prev => ({
        ...prev,
        serverLoad: Math.max(10, Math.min(95, prev.serverLoad + (Math.random() - 0.5) * 10)),
        activeUsers: Math.max(5, Math.min(50, prev.activeUsers + Math.floor((Math.random() - 0.5) * 4))),
        whatsappConnections: Math.max(3, Math.min(25, prev.whatsappConnections + Math.floor((Math.random() - 0.5) * 2))),
        lastUpdated: new Date()
      }))
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const refreshStatus = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setStatus(prev => ({
      ...prev,
      lastUpdated: new Date()
    }))
    setIsRefreshing(false)
  }

  const getLoadColor = (load: number) => {
    if (load < 50) return 'green'
    if (load < 80) return 'yellow'
    return 'red'
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Group gap="sm">
      {/* Connection Status */}
      <Tooltip label={`System ${status.isOnline ? 'Online' : 'Offline'}`}>
        <Badge
          size="sm"
          variant="dot"
          color={status.isOnline ? 'green' : 'red'}
        >
          {status.isOnline ? 'Online' : 'Offline'}
        </Badge>
      </Tooltip>

      {/* Server Load */}
      <Tooltip label={`Server Load: ${status.serverLoad.toFixed(1)}%`}>
        <Group gap="xs">
          <IconServer size={14} color={`var(--mantine-color-${getLoadColor(status.serverLoad)}-6)`} />
          <Progress
            value={status.serverLoad}
            size="sm"
            style={{ width: 40 }}
            color={getLoadColor(status.serverLoad)}
          />
          <Text size="xs" c="dimmed">
            {status.serverLoad.toFixed(0)}%
          </Text>
        </Group>
      </Tooltip>

      {/* Active Users */}
      <Tooltip label={`${status.activeUsers} Active Users`}>
        <Group gap="xs">
          <IconUsers size={14} color="var(--mantine-color-blue-6)" />
          <Text size="xs" c="dimmed">
            {status.activeUsers}
          </Text>
        </Group>
      </Tooltip>

      {/* WhatsApp Connections */}
      <Tooltip label={`${status.whatsappConnections} WhatsApp Connections`}>
        <Group gap="xs">
          <IconBrandWhatsapp size={14} color="var(--mantine-color-green-6)" />
          <Text size="xs" c="dimmed">
            {status.whatsappConnections}
          </Text>
        </Group>
      </Tooltip>

      {/* Last Updated */}
      <Tooltip label={`Last updated: ${status.lastUpdated.toLocaleString()}`}>
        <Group gap="xs">
          <Text size="xs" c="dimmed">
            {formatTime(status.lastUpdated)}
          </Text>
          <ActionIcon
            size="xs"
            variant="subtle"
            onClick={refreshStatus}
            loading={isRefreshing}
          >
            <IconRefresh size={12} />
          </ActionIcon>
        </Group>
      </Tooltip>
    </Group>
  )
}