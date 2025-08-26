'use client'

import React, { useEffect, useState } from 'react'
import {
  Paper,
  Title,
  Text,
  Group,
  Badge,
  Breadcrumbs,
  Anchor,
  ActionIcon,
  Tooltip,
  Alert,
  LoadingOverlay,
  Box,
  Stack,
  Button,
  Divider,
  Progress,
  ThemeIcon
} from '@mantine/core'
import {
  IconHome,
  IconRefresh,
  IconBell,
  IconBellOff,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconAlertTriangle,
  IconCircleCheck,
  IconSettings,
  IconArrowBack,
  IconChevronRight
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'

interface BreadcrumbItem {
  title: string
  href?: string
}

interface AdminPageWrapperProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  children: React.ReactNode
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  enableNotifications?: boolean
  showBackButton?: boolean
  headerActions?: React.ReactNode
  statusBadge?: {
    label: string
    color: 'green' | 'red' | 'yellow' | 'blue' | 'gray'
    variant?: 'light' | 'filled' | 'outline'
  }
  systemAlerts?: Array<{
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    dismissible?: boolean
  }>
}

export default function AdminPageWrapper({
  title,
  subtitle,
  breadcrumbs = [],
  children,
  loading = false,
  error = null,
  onRefresh,
  enableNotifications = false,
  showBackButton = false,
  headerActions,
  statusBadge,
  systemAlerts = []
}: AdminPageWrapperProps) {
  const router = useRouter()
  const [notificationsEnabled, setNotificationsEnabled] = useState(enableNotifications)
  const [isVisible, setIsVisible] = useState(true)
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Auto-refresh data every 30 seconds for admin pages
  useEffect(() => {
    if (onRefresh) {
      const interval = setInterval(() => {
        setLastRefresh(new Date())
        onRefresh()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [onRefresh])

  // Show success notification when page loads successfully
  useEffect(() => {
    if (!loading && !error) {
      notifications.show({
        id: 'page-loaded',
        title: 'Page Loaded',
        message: `${title} loaded successfully`,
        color: 'green',
        icon: <IconCircleCheck size={16} />,
        autoClose: 2000
      })
    }
  }, [loading, error, title])

  // Show error notification
  useEffect(() => {
    if (error) {
      notifications.show({
        id: 'page-error',
        title: 'Error',
        message: error,
        color: 'red',
        icon: <IconAlertTriangle size={16} />,
        autoClose: false
      })
    }
  }, [error])

  const handleRefresh = () => {
    if (onRefresh) {
      setLastRefresh(new Date())
      onRefresh()
      notifications.show({
        id: 'page-refresh',
        title: 'Refreshed',
        message: 'Page data has been refreshed',
        color: 'blue',
        autoClose: 2000
      })
    }
  }

  const dismissAlert = (index: number) => {
    setDismissedAlerts(prev => [...prev, `alert-${index}`])
  }

  const formatLastRefresh = () => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  return (
    <Box style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} />
      
      {/* Header Section */}
      <Paper withBorder p="md" mb="md" style={{ 
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)',
        borderColor: 'var(--mantine-color-blue-2)'
      }}>
        <Stack gap="md">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <Breadcrumbs separator={<IconChevronRight size={12} />} separatorMargin={4}>
              <Anchor href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconHome size={14} />
                Admin
              </Anchor>
              {breadcrumbs.map((item, index) => (
                <Anchor 
                  key={index} 
                  href={item.href} 
                  fw={index === breadcrumbs.length - 1 ? 600 : 400}
                  c={index === breadcrumbs.length - 1 ? 'blue' : 'dimmed'}
                >
                  {item.title}
                </Anchor>
              ))}
            </Breadcrumbs>
          )}

          {/* Main Header */}
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs" style={{ flex: 1 }}>
              <Group gap="md">
                {showBackButton && (
                  <ActionIcon 
                    variant="light" 
                    color="blue" 
                    onClick={() => router.back()}
                    size="lg"
                  >
                    <IconArrowBack size={16} />
                  </ActionIcon>
                )}
                
                <Group gap="sm">
                  <Title order={1} size="h2" c="blue.7">
                    {title}
                  </Title>
                  
                  {statusBadge && (
                    <Badge 
                      color={statusBadge.color} 
                      variant={statusBadge.variant || 'light'}
                      size="lg"
                    >
                      {statusBadge.label}
                    </Badge>
                  )}
                </Group>
              </Group>
              
              {subtitle && (
                <Text size="md" c="dimmed" maw={600}>
                  {subtitle}
                </Text>
              )}
            </Stack>

            {/* Header Actions */}
            <Group gap="xs">
              {onRefresh && (
                <Tooltip label={`Last refreshed: ${formatLastRefresh()}`}>
                  <ActionIcon 
                    variant="light" 
                    color="blue"
                    onClick={handleRefresh}
                    loading={loading}
                  >
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
              
              <Tooltip label={`Notifications ${notificationsEnabled ? 'enabled' : 'disabled'}`}>
                <ActionIcon 
                  variant={notificationsEnabled ? "filled" : "light"}
                  color="blue"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                >
                  {notificationsEnabled ? <IconBell size={16} /> : <IconBellOff size={16} />}
                </ActionIcon>
              </Tooltip>
              
              <Tooltip label={`${isVisible ? 'Hide' : 'Show'} page content`}>
                <ActionIcon 
                  variant="light" 
                  color="gray"
                  onClick={() => setIsVisible(!isVisible)}
                >
                  {isVisible ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                </ActionIcon>
              </Tooltip>
              
              {headerActions}
            </Group>
          </Group>

          {/* System Alerts */}
          {systemAlerts.length > 0 && (
            <Stack gap="xs">
              {systemAlerts.map((alert, index) => {
                const alertId = `alert-${index}`
                if (dismissedAlerts.includes(alertId)) return null
                
                return (
                  <Alert
                    key={index}
                    icon={
                      alert.type === 'error' ? <IconAlertTriangle size={16} /> :
                      alert.type === 'success' ? <IconCircleCheck size={16} /> :
                      <IconInfoCircle size={16} />
                    }
                    title={alert.title}
                    color={
                      alert.type === 'error' ? 'red' :
                      alert.type === 'warning' ? 'yellow' :
                      alert.type === 'success' ? 'green' : 'blue'
                    }
                    withCloseButton={alert.dismissible}
                    onClose={alert.dismissible ? () => dismissAlert(index) : undefined}
                  >
                    {alert.message}
                  </Alert>
                )
              })}
            </Stack>
          )}

          {/* Page Info */}
          <Group justify="space-between" c="dimmed" fz="xs">
            <Group gap="md">
              <Text>Last updated: {lastRefresh.toLocaleTimeString()}</Text>
              {onRefresh && <Text>Auto-refresh: 30s</Text>}
            </Group>
            <Group gap="xs">
              <ThemeIcon size="xs" variant="light" color="green">
                <IconCircleCheck size={10} />
              </ThemeIcon>
              <Text>Page Active</Text>
            </Group>
          </Group>
        </Stack>
      </Paper>

      {/* Error State */}
      {error && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Error Loading Page"
          color="red"
          mb="md"
        >
          <Stack gap="sm">
            <Text>{error}</Text>
            {onRefresh && (
              <Button 
                variant="light" 
                color="red" 
                size="xs" 
                onClick={handleRefresh}
                leftSection={<IconRefresh size={14} />}
              >
                Retry
              </Button>
            )}
          </Stack>
        </Alert>
      )}

      {/* Main Content */}
      {isVisible && !error && (
        <Box style={{ 
          transition: 'opacity 0.2s ease',
          opacity: loading ? 0.6 : 1 
        }}>
          {children}
        </Box>
      )}

      {/* Loading State */}
      {loading && (
        <Paper withBorder p="xl" ta="center">
          <Stack gap="md" align="center">
            <Progress size="sm" style={{ width: 200 }} />
            <Text c="dimmed">Loading {title.toLowerCase()}...</Text>
          </Stack>
        </Paper>
      )}
    </Box>
  )
}