'use client'

import {
  Stack,
  Card,
  Group,
  Text,
  Button,
  Switch,
  NumberInput,
  Select,
  Tabs,
  SimpleGrid,
  Alert,
  Badge,
  Table,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  ScrollArea,
  Box,
  Title,
  Divider,
  Progress,
  ThemeIcon
} from '@mantine/core'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernAlert,
  ModernContainer
} from '@/components/ui/modern-components'
import {
  FiShield,
  FiLock,
  FiEye,
  FiSettings,
  FiAlertTriangle,
  FiClock,
  FiUsers,
  FiActivity,
  FiGlobe,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiSave,
  FiRefreshCw
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { usePermissions } from '@/hooks/usePermissions'

interface SecuritySettings {
  sessionTimeout: number
  maxConcurrentSessions: number
  maxLoginAttempts: number
  lockoutDuration: number
  passwordMinLength: number
  passwordRequireSpecial: boolean
  passwordRequireNumbers: boolean
  passwordRequireUppercase: boolean
  passwordExpireDays: number
  twoFactorRequired: boolean
  ipRestrictionEnabled: boolean
  geoRestrictionEnabled: boolean
}

interface Role {
  id: number
  name: string
  level: number
  description: string
  user_count: number
  is_system: boolean
}

interface SecurityEvent {
  id: number
  event_type: string
  user_email: string
  ip_address: string
  timestamp: string
  details: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface IPRestriction {
  id: number
  role_id?: number
  user_id?: number
  ip_address: string
  description: string
  is_whitelist: boolean
}

export default function SecurityTab() {
  const { hasPermission, isOwner } = usePermissions()
  const [settings, setSettings] = useState<SecuritySettings>({
    sessionTimeout: 24,
    maxConcurrentSessions: 3,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    passwordExpireDays: 90,
    twoFactorRequired: false,
    ipRestrictionEnabled: false,
    geoRestrictionEnabled: false
  })

  const [roles, setRoles] = useState<Role[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [ipRestrictions, setIpRestrictions] = useState<IPRestriction[]>([])
  const [loading, setLoading] = useState(false)
  const [showRolePriorityModal, setShowRolePriorityModal] = useState(false)
  const [showIPModal, setShowIPModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [ipFormData, setIpFormData] = useState({
    role_id: '',
    ip_address: '',
    description: '',
    is_whitelist: true
  })

  useEffect(() => {
    loadSecuritySettings()
    loadRoles()
    loadSecurityEvents()
    loadIPRestrictions()
  }, [])

  const loadSecuritySettings = async () => {
    try {
      const response = await fetch('/api/admin/security/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to load security settings:', error)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const loadSecurityEvents = async () => {
    try {
      const response = await fetch('/api/admin/security/events?limit=50')
      if (response.ok) {
        const data = await response.json()
        setSecurityEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to load security events:', error)
    }
  }

  const loadIPRestrictions = async () => {
    try {
      const response = await fetch('/api/admin/security/ip-restrictions')
      if (response.ok) {
        const data = await response.json()
        setIpRestrictions(data.restrictions || [])
      }
    } catch (error) {
      console.error('Failed to load IP restrictions:', error)
    }
  }

  const saveSecuritySettings = async () => {
    if (!hasPermission('system.settings.update')) {
      notifications.show({
        title: 'Access Denied',
        message: 'You do not have permission to update security settings',
        color: 'red'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/security/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Security settings updated successfully',
          color: 'green'
        })
      } else {
        const data = await response.json()
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to update settings',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateRoleLevel = async (roleId: number, newLevel: number) => {
    if (!hasPermission('roles.update')) {
      notifications.show({
        title: 'Access Denied',
        message: 'You do not have permission to update roles',
        color: 'red'
      })
      return
    }

    try {
      const response = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roleId, level: newLevel })
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Role priority updated successfully',
          color: 'green'
        })
        loadRoles()
      } else {
        const data = await response.json()
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to update role',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  const addIPRestriction = async () => {
    if (!ipFormData.ip_address) {
      notifications.show({
        title: 'Validation Error',
        message: 'IP address is required',
        color: 'red'
      })
      return
    }

    try {
      const response = await fetch('/api/admin/security/ip-restrictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ipFormData)
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'IP restriction added successfully',
          color: 'green'
        })
        setShowIPModal(false)
        setIpFormData({ role_id: '', ip_address: '', description: '', is_whitelist: true })
        loadIPRestrictions()
      } else {
        const data = await response.json()
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to add IP restriction',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to server',
        color: 'red'
      })
    }
  }

  const removeIPRestriction = async (id: number) => {
    if (!confirm('Are you sure you want to remove this IP restriction?')) return

    try {
      const response = await fetch(`/api/admin/security/ip-restrictions?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'IP restriction removed successfully',
          color: 'green'
        })
        loadIPRestrictions()
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to remove IP restriction',
        color: 'red'
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red'
      case 'high': return 'orange'
      case 'medium': return 'yellow'
      case 'low': return 'blue'
      default: return 'gray'
    }
  }

  const getRoleLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'red'
      case 2: return 'orange'
      case 3: return 'blue'
      case 4: return 'green'
      case 5: return 'gray'
      default: return 'gray'
    }
  }

  if (!hasPermission('system.settings.read')) {
    return (
      <ModernAlert color="red" title="Access Denied">
        <Text size="xs">You don't have permission to view security settings.</Text>
      </ModernAlert>
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Box>
          <Title order={4} size="xs" fw={600}>Security Management</Title>
          <Text c="dimmed" size="xs">Manage authentication, authorization, and security policies</Text>
        </Box>
        <ModernBadge color="red" size="xs" leftSection={<FiShield size={10} />}>
          Security Center
        </ModernBadge>
      </Group>

      <Tabs defaultValue="login" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="login">
            <Group gap="xs">
              <FiLock size={10} />
              <Text size="xs">Login Security</Text>
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="roles">
            <Group gap="xs">
              <FiUsers size={10} />
              <Text size="xs">Role Priorities</Text>
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="monitoring">
            <Group gap="xs">
              <FiActivity size={10} />
              <Text size="xs">Security Monitoring</Text>
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="access">
            <Group gap="xs">
              <FiGlobe size={10} />
              <Text size="xs">Access Control</Text>
            </Group>
          </Tabs.Tab>
        </Tabs.List>

        {/* Login Security Tab */}
        <Tabs.Panel value="login" pt="md">
          <Stack gap="md">
            <ModernCard withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Group gap="sm">
                  <ThemeIcon size="sm" variant="light" color="blue">
                    <FiClock size={10} />
                  </ThemeIcon>
                  <Title order={4} size="xs" fw={600}>Session Management</Title>
                </Group>
              </Card.Section>
              
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="md">
                <NumberInput
                  label="Session Timeout (hours)"
                  description="How long users stay logged in"
                  value={settings.sessionTimeout}
                  onChange={(value) => setSettings(prev => ({ ...prev, sessionTimeout: value || 24 }))}
                  min={1}
                  max={168}
                />
                <NumberInput
                  label="Max Concurrent Sessions"
                  description="Maximum active sessions per user"
                  value={settings.maxConcurrentSessions}
                  onChange={(value) => setSettings(prev => ({ ...prev, maxConcurrentSessions: value || 3 }))}
                  min={1}
                  max={10}
                />
              </SimpleGrid>
            </ModernCard>

            <ModernCard withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Group gap="sm">
                  <ThemeIcon size="sm" variant="light" color="orange">
                    <FiAlertTriangle size={10} />
                  </ThemeIcon>
                  <Title order={4} size="xs" fw={600}>Failed Login Protection</Title>
                </Group>
              </Card.Section>
              
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mt="md">
                <NumberInput
                  label="Max Login Attempts"
                  description="Failed attempts before account lockout"
                  value={settings.maxLoginAttempts}
                  onChange={(value) => setSettings(prev => ({ ...prev, maxLoginAttempts: value || 5 }))}
                  min={3}
                  max={20}
                />
                <NumberInput
                  label="Lockout Duration (minutes)"
                  description="How long account stays locked"
                  value={settings.lockoutDuration}
                  onChange={(value) => setSettings(prev => ({ ...prev, lockoutDuration: value || 15 }))}
                  min={5}
                  max={1440}
                />
              </SimpleGrid>
            </ModernCard>

            <ModernCard withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Group gap="sm">
                  <ThemeIcon size="sm" variant="light" color="red">
                    <FiLock size={10} />
                  </ThemeIcon>
                  <Title order={4} size="xs" fw={600}>Password Policies</Title>
                </Group>
              </Card.Section>
              
              <Stack gap="md" mt="md">
                <NumberInput
                  label="Minimum Password Length"
                  value={settings.passwordMinLength}
                  onChange={(value) => setSettings(prev => ({ ...prev, passwordMinLength: value || 8 }))}
                  min={6}
                  max={50}
                />
                
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <Switch
                    label="Require Special Characters"
                    description="Password must contain !@#$%^&*"
                    checked={settings.passwordRequireSpecial}
                    onChange={(event) => setSettings(prev => ({ 
                      ...prev, 
                      passwordRequireSpecial: event.currentTarget.checked 
                    }))}
                  />
                  <Switch
                    label="Require Numbers"
                    description="Password must contain digits"
                    checked={settings.passwordRequireNumbers}
                    onChange={(event) => setSettings(prev => ({ 
                      ...prev, 
                      passwordRequireNumbers: event.currentTarget.checked 
                    }))}
                  />
                </SimpleGrid>
                
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <Switch
                    label="Require Uppercase Letters"
                    description="Password must contain A-Z"
                    checked={settings.passwordRequireUppercase}
                    onChange={(event) => setSettings(prev => ({ 
                      ...prev, 
                      passwordRequireUppercase: event.currentTarget.checked 
                    }))}
                  />
                  <NumberInput
                    label="Password Expires (days)"
                    description="0 = never expires"
                    value={settings.passwordExpireDays}
                    onChange={(value) => setSettings(prev => ({ ...prev, passwordExpireDays: value || 0 }))}
                    min={0}
                    max={365}
                  />
                </SimpleGrid>
              </Stack>
            </ModernCard>

            <ModernCard withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Group gap="sm">
                  <ThemeIcon size="sm" variant="light" color="green">
                    <FiShield size={10} />
                  </ThemeIcon>
                  <Title order={4} size="xs" fw={600}>Advanced Security</Title>
                </Group>
              </Card.Section>
              
              <Stack gap="md" mt="md">
                <Switch
                  label="Two-Factor Authentication Required"
                  description="Force all users to enable 2FA"
                  checked={settings.twoFactorRequired}
                  onChange={(event) => setSettings(prev => ({ 
                    ...prev, 
                    twoFactorRequired: event.currentTarget.checked 
                  }))}
                />
                <Switch
                  label="IP Address Restrictions"
                  description="Enable IP-based access control"
                  checked={settings.ipRestrictionEnabled}
                  onChange={(event) => setSettings(prev => ({ 
                    ...prev, 
                    ipRestrictionEnabled: event.currentTarget.checked 
                  }))}
                />
                <Switch
                  label="Geographic Restrictions"
                  description="Block access from certain countries"
                  checked={settings.geoRestrictionEnabled}
                  onChange={(event) => setSettings(prev => ({ 
                    ...prev, 
                    geoRestrictionEnabled: event.currentTarget.checked 
                  }))}
                />
              </Stack>
            </ModernCard>

            {hasPermission('system.settings.update') && (
              <Group justify="flex-end">
                <ModernButton
                  leftSection={<FiSave size={10} />}
                  onClick={saveSecuritySettings}
                  loading={loading}
                  size="xs"
                >
                  Save Security Settings
                </ModernButton>
              </Group>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Role Priorities Tab */}
        <Tabs.Panel value="roles" pt="md">
          <Stack gap="md">
            <ModernCard withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Group justify="space-between">
                  <Group gap="sm">
                    <ThemeIcon size="sm" variant="light" color="violet">
                      <FiUsers size={10} />
                    </ThemeIcon>
                    <Title order={4} size="xs" fw={600}>Role Priority Management</Title>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Lower numbers = Higher priority
                  </Text>
                </Group>
              </Card.Section>
              
              <Table striped highlightOnHover mt="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Role Name</Table.Th>
                    <Table.Th>Current Priority</Table.Th>
                    <Table.Th>Users Count</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {roles
                    .sort((a, b) => a.level - b.level)
                    .map((role) => (
                      <Table.Tr key={role.id}>
                        <Table.Td>
                          <Group gap="sm">
                            <Text fw={500}>{role.name}</Text>
                            {role.is_system && (
                              <Badge size="xs" color="blue">System</Badge>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getRoleLevelColor(role.level)} variant="filled">
                            Level {role.level}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{role.user_count} users</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed" lineClamp={1}>
                            {role.description}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {hasPermission('roles.update') && (
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => setEditingRole(role)}
                              title="Edit Priority"
                            >
                              <Box component={FiEdit3} />
                            </ActionIcon>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                </Table.Tbody>
              </Table>
            </ModernCard>

            <ModernAlert color="blue" title="Role Priority System">
              <Text size="sm">
                Priority levels determine access hierarchy. Users with higher priority roles 
                can manage users with lower priority roles. The OWNER role (Level 1) has the 
                highest priority and can manage all other roles.
              </Text>
            </ModernAlert>
          </Stack>
        </Tabs.Panel>

        {/* Security Monitoring Tab */}
        <Tabs.Panel value="monitoring" pt="md">
          <Stack gap="md">
            <ModernCard withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Group justify="space-between">
                  <Group gap="sm">
                    <Box component={FiActivity} />
                    <Title order={4}>Recent Security Events</Title>
                  </Group>
                  <Button
                    size="sm"
                    variant="outline"
                    leftSection={<Box component={FiRefreshCw} />}
                    onClick={loadSecurityEvents}
                  >
                    Refresh
                  </Button>
                </Group>
              </Card.Section>
              
              <ScrollArea h={400}>
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Event Type</Table.Th>
                      <Table.Th>User</Table.Th>
                      <Table.Th>IP Address</Table.Th>
                      <Table.Th>Severity</Table.Th>
                      <Table.Th>Time</Table.Th>
                      <Table.Th>Details</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {securityEvents.map((event) => (
                      <Table.Tr key={event.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>{event.event_type}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{event.user_email}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" ff="monospace">{event.ip_address}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getSeverityColor(event.severity)} size="sm">
                            {event.severity}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {new Date(event.timestamp).toLocaleString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={1}>{event.details}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>

              {securityEvents.length === 0 && (
                <Text ta="center" c="dimmed" py="xl">
                  No security events found
                </Text>
              )}
            </ModernCard>
          </Stack>
        </Tabs.Panel>

        {/* Access Control Tab */}
        <Tabs.Panel value="access" pt="md">
          <Stack gap="md">
            <ModernCard withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Group justify="space-between">
                  <Group gap="sm">
                    <Box component={FiGlobe} />
                    <Title order={4}>IP Address Restrictions</Title>
                  </Group>
                  <Button
                    size="sm"
                    leftSection={<Box component={FiPlus} />}
                    onClick={() => setShowIPModal(true)}
                  >
                    Add Restriction
                  </Button>
                </Group>
              </Card.Section>
              
              <Table striped highlightOnHover mt="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>IP Address/Range</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {ipRestrictions.map((restriction) => (
                    <Table.Tr key={restriction.id}>
                      <Table.Td>
                        <Text ff="monospace" size="sm">
                          {restriction.ip_address}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={restriction.is_whitelist ? 'green' : 'red'}
                          variant="light"
                        >
                          {restriction.is_whitelist ? 'Allow' : 'Block'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {restriction.role_id 
                            ? roles.find(r => r.id === restriction.role_id)?.name || 'Unknown'
                            : 'All Users'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {restriction.description || 'No description'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => removeIPRestriction(restriction.id)}
                          title="Remove Restriction"
                        >
                          <Box component={FiTrash2} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {ipRestrictions.length === 0 && (
                <Text ta="center" c="dimmed" py="xl">
                  No IP restrictions configured
                </Text>
              )}
            </ModernCard>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Role Priority Edit Modal */}
      <Modal
        opened={!!editingRole}
        onClose={() => setEditingRole(null)}
        title="Edit Role Priority"
        size="sm"
      >
        {editingRole && (
          <Stack gap="md">
            <Text size="sm">
              Editing priority for role: <strong>{editingRole.name}</strong>
            </Text>
            <NumberInput
              label="Priority Level"
              description="1 = Highest priority, 5 = Lowest priority"
              defaultValue={editingRole.level}
              min={1}
              max={5}
              onChange={(value) => {
                if (value && editingRole) {
                  updateRoleLevel(editingRole.id, value)
                  setEditingRole(null)
                }
              }}
            />
          </Stack>
        )}
      </Modal>

      {/* IP Restriction Modal */}
      <Modal
        opened={showIPModal}
        onClose={() => setShowIPModal(false)}
        title="Add IP Restriction"
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="IP Address or Range"
            placeholder="192.168.1.100 or 192.168.1.0/24"
            value={ipFormData.ip_address}
            onChange={(e) => setIpFormData(prev => ({ 
              ...prev, 
              ip_address: e.target.value 
            }))}
            required
          />
          
          <Select
            label="Apply to Role"
            placeholder="Select role (leave empty for all users)"
            value={ipFormData.role_id}
            onChange={(value) => setIpFormData(prev => ({ 
              ...prev, 
              role_id: value || '' 
            }))}
            data={roles.map(role => ({ 
              value: role.id.toString(), 
              label: role.name 
            }))}
            clearable
          />
          
          <Select
            label="Restriction Type"
            value={ipFormData.is_whitelist ? 'allow' : 'block'}
            onChange={(value) => setIpFormData(prev => ({ 
              ...prev, 
              is_whitelist: value === 'allow' 
            }))}
            data={[
              { value: 'allow', label: 'Allow (Whitelist)' },
              { value: 'block', label: 'Block (Blacklist)' }
            ]}
          />
          
          <Textarea
            label="Description"
            placeholder="Optional description for this restriction"
            value={ipFormData.description}
            onChange={(e) => setIpFormData(prev => ({ 
              ...prev, 
              description: e.target.value 
            }))}
            minRows={2}
          />
          
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setShowIPModal(false)}>
              Cancel
            </Button>
            <Button onClick={addIPRestriction}>
              Add Restriction
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}