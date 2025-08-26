'use client'

import { useState, useMemo } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Group,
  Indicator,
  Menu,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
  Tooltip,
  ThemeIcon,
  Box,
  Tabs,
  Switch,
  Select,
  Alert,
  Progress,
  Timeline
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { 
  IconBell, 
  IconBellOff, 
  IconSettings,
  IconCheck,
  IconX,
  IconUser,
  IconCreditCard,
  IconServer,
  IconShield,
  IconPackage,
  IconBrandWhatsapp,
  IconSystemUikit,
  IconAlertTriangle,
  IconInfoCircle,
  IconCircleCheck,
  IconExclamationMark,
  IconRefresh,
  IconTrash,
  IconFilter,
  IconVolume,
  IconVolumeOff,
  IconEye,
  IconEyeOff
} from '@tabler/icons-react'
import { useAdminNotifications } from '@/contexts/AdminNotificationContext'
import { AdminNotification } from '@/types/notifications'

const CATEGORY_ICONS = {
  user: IconUser,
  transaction: IconCreditCard,
  server: IconServer,
  security: IconShield,
  subscription: IconPackage,
  whatsapp: IconBrandWhatsapp,
  system: IconSystemUikit
}

const PRIORITY_COLORS = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  critical: 'red'
}

const TYPE_ICONS = {
  info: IconInfoCircle,
  success: IconCircleCheck,
  warning: IconExclamationMark,
  error: IconAlertTriangle,
  system: IconSystemUikit
}

interface NotificationItemProps {
  notification: AdminNotification
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onDismiss }) => {
  const CategoryIcon = CATEGORY_ICONS[notification.category] || IconSystemUikit
  const TypeIcon = TYPE_ICONS[notification.type] || IconInfoCircle
  const priorityColor = PRIORITY_COLORS[notification.priority] || 'gray'

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <Paper
      p="sm"
      withBorder
      style={{
        backgroundColor: notification.read ? 'transparent' : 'var(--mantine-color-blue-0)',
        borderLeft: `3px solid var(--mantine-color-${priorityColor}-6)`,
        opacity: notification.read ? 0.7 : 1
      }}
    >
      <Group gap="sm" justify="space-between" align="flex-start">
        <Group gap="sm" style={{ flex: 1 }}>
          <Indicator
            inline
            size={6}
            offset={4}
            position="top-end"
            color={priorityColor}
            disabled={notification.read}
          >
            <ThemeIcon
              variant="light"
              color={priorityColor}
              size="sm"
            >
              <CategoryIcon size={12} />
            </ThemeIcon>
          </Indicator>

          <Stack gap={4} style={{ flex: 1 }}>
            <Group gap="xs" justify="space-between">
              <Text size="sm" fw={notification.read ? 400 : 600} lineClamp={1}>
                {notification.title}
              </Text>
              <Group gap={4}>
                <TypeIcon size={12} style={{ color: `var(--mantine-color-${priorityColor}-6)` }} />
                <Text size="xs" c="dimmed">
                  {formatTime(notification.timestamp)}
                </Text>
              </Group>
            </Group>
            
            <Text size="xs" c="dimmed" lineClamp={2}>
              {notification.message}
            </Text>
            
            {notification.actions && notification.actions.length > 0 && (
              <Group gap="xs" mt={4}>
                {notification.actions.map((action) => (
                  <Button
                    key={action.id}
                    size="xs"
                    variant={action.type === 'primary' ? 'filled' : 'light'}
                    color={action.type === 'danger' ? 'red' : 'blue'}
                  >
                    {action.label}
                  </Button>
                ))}
              </Group>
            )}
          </Stack>
        </Group>

        <Group gap={4}>
          {!notification.read && (
            <Tooltip label="Mark as read">
              <ActionIcon
                size="xs"
                variant="subtle"
                color="blue"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <IconCheck size={12} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Dismiss">
            <ActionIcon
              size="xs"
              variant="subtle"
              color="red"
              onClick={() => onDismiss(notification.id)}
            >
              <IconX size={12} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Paper>
  )
}

export default function AdminNotificationBell() {
  const [settingsOpened, { toggle: toggleSettings }] = useDisclosure(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  
  const {
    notifications,
    stats,
    metrics,
    preferences,
    isConnected,
    connectionState,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    updatePreferences,
    reconnect,
    getNotificationsByCategory,
    getNotificationsByPriority,
    getUnreadNotifications
  } = useAdminNotifications()

  // Filter notifications based on current filters
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    if (filterCategory !== 'all') {
      filtered = getNotificationsByCategory(filterCategory)
    }

    if (filterPriority !== 'all') {
      filtered = getNotificationsByPriority(filterPriority)
    }

    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [notifications, filterCategory, filterPriority, getNotificationsByCategory, getNotificationsByPriority])

  const unreadCount = stats.unread

  return (
    <Menu
      shadow="xl"
      width={420}
      position="bottom-end"
      offset={12}
      withArrow
      closeOnItemClick={false}
    >
      <Menu.Target>
        <Tooltip
          label={
            isConnected 
              ? `${unreadCount} unread notifications` 
              : 'Notifications (disconnected)'
          }
          position="bottom"
        >
          <Indicator
            inline
            size={unreadCount > 0 ? 16 : 0}
            label={unreadCount > 99 ? '99+' : unreadCount}
            color="red"
            offset={4}
          >
            <ActionIcon
              variant={unreadCount > 0 ? 'filled' : 'light'}
              color={isConnected ? 'blue' : 'gray'}
              size="lg"
              radius="xl"
              style={{
                transition: 'all 0.2s ease',
                animation: unreadCount > 0 && connectionState === 'connected' ? 'pulse 2s infinite' : 'none'
              }}
            >
              {isConnected ? <IconBell size={18} /> : <IconBellOff size={18} />}
            </ActionIcon>
          </Indicator>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown p={0}>
        <Paper>
          {/* Header */}
          <Group p="md" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
            <Group gap="xs">
              <Title order={5}>Notifications</Title>
              <Badge
                size="sm"
                variant="light"
                color={connectionState === 'connected' ? 'green' : 'red'}
              >
                {connectionState}
              </Badge>
            </Group>
            
            <Group gap="xs">
              {connectionState !== 'connected' && (
                <Tooltip label="Reconnect">
                  <ActionIcon size="sm" variant="light" onClick={reconnect}>
                    <IconRefresh size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              
              <Tooltip label="Settings">
                <ActionIcon size="sm" variant="light" onClick={toggleSettings}>
                  <IconSettings size={14} />
                </ActionIcon>
              </Tooltip>
              
              {stats.total > 0 && (
                <Menu shadow="md" width={200} position="bottom-end">
                  <Menu.Target>
                    <ActionIcon size="sm" variant="light">
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={markAllAsRead}>
                      <Group gap="xs">
                        <IconCheck size={14} />
                        <Text size="sm">Mark all as read</Text>
                      </Group>
                    </Menu.Item>
                    <Menu.Item color="red" onClick={clearAll}>
                      <Group gap="xs">
                        <IconTrash size={14} />
                        <Text size="sm">Clear all</Text>
                      </Group>
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              )}
            </Group>
          </Group>

          {/* Connection Status & Metrics */}
          {metrics && (
            <Box p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
              <Group gap="md" justify="space-between">
                <Group gap="xs">
                  <Text size="xs" c="dimmed">CPU</Text>
                  <Progress
                    value={metrics.cpuUsage}
                    size="xs"
                    style={{ width: 60 }}
                    color={metrics.cpuUsage > 80 ? 'red' : metrics.cpuUsage > 60 ? 'yellow' : 'green'}
                  />
                  <Text size="xs">{metrics.cpuUsage}%</Text>
                </Group>
                
                <Group gap="xs">
                  <Text size="xs" c="dimmed">Memory</Text>
                  <Progress
                    value={metrics.memoryUsage}
                    size="xs"
                    style={{ width: 60 }}
                    color={metrics.memoryUsage > 80 ? 'red' : metrics.memoryUsage > 60 ? 'yellow' : 'green'}
                  />
                  <Text size="xs">{metrics.memoryUsage}%</Text>
                </Group>
                
                <Group gap="xs">
                  <Text size="xs" c="dimmed">Active Users</Text>
                  <Badge size="xs" variant="light">
                    {metrics.activeUsers}
                  </Badge>
                </Group>
              </Group>
            </Box>
          )}

          {/* Settings Panel */}
          {settingsOpened && (
            <Paper p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>Notification Settings</Text>
                  <Group gap="xs">
                    <Switch
                      size="sm"
                      checked={preferences.enableSound}
                      onChange={(event) => updatePreferences({ enableSound: event.currentTarget.checked })}
                      thumbIcon={preferences.enableSound ? <IconVolume size={12} /> : <IconVolumeOff size={12} />}
                    />
                    <Switch
                      size="sm"
                      checked={preferences.enableDesktop}
                      onChange={(event) => updatePreferences({ enableDesktop: event.currentTarget.checked })}
                      thumbIcon={preferences.enableDesktop ? <IconEye size={12} /> : <IconEyeOff size={12} />}
                    />
                  </Group>
                </Group>
                
                <Group grow>
                  <Select
                    size="xs"
                    placeholder="Filter by category"
                    data={[
                      { value: 'all', label: 'All Categories' },
                      ...Object.keys(CATEGORY_ICONS).map(cat => ({
                        value: cat,
                        label: cat.charAt(0).toUpperCase() + cat.slice(1)
                      }))
                    ]}
                    value={filterCategory}
                    onChange={(value) => setFilterCategory(value || 'all')}
                    leftSection={<IconFilter size={12} />}
                  />
                  
                  <Select
                    size="xs"
                    placeholder="Filter by priority"
                    data={[
                      { value: 'all', label: 'All Priorities' },
                      { value: 'critical', label: 'Critical' },
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' }
                    ]}
                    value={filterPriority}
                    onChange={(value) => setFilterPriority(value || 'all')}
                    leftSection={<IconFilter size={12} />}
                  />
                </Group>
              </Stack>
            </Paper>
          )}

          {/* Statistics */}
          <Group p="sm" justify="center" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
            <Group gap="lg">
              <Group gap="xs">
                <Text size="xs" c="dimmed">Total</Text>
                <Badge size="sm" variant="light">{stats.total}</Badge>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="dimmed">Unread</Text>
                <Badge size="sm" color="red" variant="light">{stats.unread}</Badge>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="dimmed">Recent</Text>
                <Badge size="sm" color="blue" variant="light">{stats.recentActivity}</Badge>
              </Group>
            </Group>
          </Group>

          {/* Notifications List */}
          <ScrollArea style={{ maxHeight: 400 }}>
            {filteredNotifications.length > 0 ? (
              <Stack gap="xs" p="sm">
                {filteredNotifications.slice(0, 10).map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDismiss={dismissNotification}
                  />
                ))}
                
                {filteredNotifications.length > 10 && (
                  <Text size="xs" c="dimmed" ta="center" p="sm">
                    {filteredNotifications.length - 10} more notifications...
                  </Text>
                )}
              </Stack>
            ) : (
              <Box p="xl" ta="center">
                <Stack gap="sm" align="center">
                  <IconBell size={48} style={{ opacity: 0.3 }} />
                  <Text size="sm" c="dimmed">
                    {notifications.length === 0 
                      ? 'No notifications yet' 
                      : 'No notifications match your filters'
                    }
                  </Text>
                </Stack>
              </Box>
            )}
          </ScrollArea>

          {/* Footer */}
          {stats.total > 0 && (
            <Group p="sm" justify="center" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
              <Button variant="subtle" size="xs" fullWidth>
                View All Notifications
              </Button>
            </Group>
          )}
        </Paper>
      </Menu.Dropdown>
    </Menu>
  )
}