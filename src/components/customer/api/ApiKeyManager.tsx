'use client'

import { useEffect, useState } from 'react'
import { 
  Stack,
  Grid,
  Card,
  Text,
  Button,
  Group,
  Badge,
  Table,
  ActionIcon,
  Modal,
  TextInput,
  MultiSelect,
  Switch,
  Alert,
  Code,
  CopyButton,
  Tooltip,
  LoadingOverlay,
  Tabs,
  Accordion,
  Divider
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  IconKey,
  IconPlus,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconCopy,
  IconCheck,
  IconInfoCircle,
  IconBook,
  IconCode,
  IconServer,
  IconRefresh
} from '@tabler/icons-react'
import { useImpersonation } from '@/contexts/ImpersonationContext'

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  defaultPermissions?: boolean
  neverExpires?: boolean
  isActive: boolean
  lastUsedAt?: string
  expiresAt?: string
  createdAt: string
  usageCount: number
}

interface ApiKeyForm {
  name: string
  permissions: string[]
  expiresAt: string
  neverExpires: boolean
}

interface ApiStats {
  totalKeys: number
  activeKeys: number
  totalRequests: number
  requestsToday: number
}

const API_PERMISSIONS = [
  { value: 'messages.send', label: 'Send Messages' },
  { value: 'messages.read', label: 'Read Messages' },
  { value: 'contacts.read', label: 'Read Contacts' },
  { value: 'contacts.write', label: 'Manage Contacts' },
  { value: 'groups.read', label: 'Read Groups' },
  { value: 'groups.write', label: 'Manage Groups' },
  { value: 'instances.read', label: 'Read Instances' },
  { value: 'instances.write', label: 'Manage Instances' },
  { value: 'webhooks.read', label: 'Read Webhooks' },
  { value: 'webhooks.write', label: 'Manage Webhooks' },
]

export default function ApiKeyManager() {
  const { isImpersonating, impersonationData } = useImpersonation()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [stats, setStats] = useState<ApiStats>({
    totalKeys: 0,
    activeKeys: 0,
    totalRequests: 0,
    requestsToday: 0
  })
  const [loading, setLoading] = useState(true)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  
  const [opened, { open, close }] = useDisclosure(false)
  const [docsModalOpened, { open: openDocsModal, close: closeDocsModal }] = useDisclosure(false)

  const form = useForm<ApiKeyForm>({
    initialValues: {
      name: '',
      permissions: [],
      expiresAt: '',
      neverExpires: false,
    },
    validate: {
      name: (value) => (!value ? 'API key name is required' : null),
      permissions: (value, values) => {
        // Only require permissions if it's not using defaults (empty array means default permissions)
        return false // Remove permission requirement - allow default permissions
      },
    },
  })

  useEffect(() => {
    fetchApiKeys()
    fetchApiStats()
  }, [isImpersonating, impersonationData])

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      
      // Build URL with impersonation parameter if needed
      let url = '/api/customer/api-keys'
      if (isImpersonating && impersonationData) {
        url += `?impersonatedCustomerId=${impersonationData.targetUser.id}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.keys)
      } else {
        // Mock data for now
        setApiKeys([
          {
            id: '1',
            name: 'Production API',
            key: 'sk_live_abc123...def456',
            permissions: ['messages.send', 'contacts.read', 'instances.read'],
            isActive: true,
            lastUsedAt: new Date(Date.now() - 86400000).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
            usageCount: 1250
          },
          {
            id: '2',
            name: 'Development Testing',
            key: 'sk_test_xyz789...uvw012',
            permissions: ['messages.send', 'messages.read', 'contacts.read'],
            isActive: true,
            lastUsedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            expiresAt: new Date(Date.now() + 86400000 * 90).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            usageCount: 45
          },
          {
            id: '3',
            name: 'Legacy Integration',
            key: 'sk_live_old123...def789',
            permissions: ['messages.send'],
            isActive: false,
            lastUsedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 180).toISOString(),
            usageCount: 850
          }
        ])
      }
    } catch (error) {
      console.error('API keys fetch error:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load API keys',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchApiStats = async () => {
    try {
      // Build URL with impersonation parameter if needed
      let url = '/api/customer/api-keys/stats'
      if (isImpersonating && impersonationData) {
        url += `?impersonatedCustomerId=${impersonationData.targetUser.id}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        // Mock data
        setStats({
          totalKeys: 3,
          activeKeys: 2,
          totalRequests: 2145,
          requestsToday: 87
        })
      }
    } catch (error) {
      console.error('API stats fetch error:', error)
    }
  }

  const handleSubmit = async (values: ApiKeyForm) => {
    try {
      // Build URL with impersonation parameter if needed
      let url = '/api/customer/api-keys'
      if (isImpersonating && impersonationData) {
        url += `?impersonatedCustomerId=${impersonationData.targetUser.id}`
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        const result = await response.json()
        setNewApiKey(result.key)
        notifications.show({
          title: 'Success',
          message: 'API key created successfully',
          color: 'green',
        })
        close()
        form.reset()
        fetchApiKeys()
        fetchApiStats()
      } else {
        throw new Error('Failed to create API key')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create API key',
        color: 'red',
      })
    }
  }

  const handleToggleActive = async (keyId: string, isActive: boolean) => {
    try {
      // Build URL with impersonation parameter if needed
      let url = `/api/customer/api-keys/${keyId}`
      if (isImpersonating && impersonationData) {
        url += `?impersonatedCustomerId=${impersonationData.targetUser.id}`
      }
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        fetchApiKeys()
        fetchApiStats()
        notifications.show({
          title: 'Success',
          message: `API key ${!isActive ? 'activated' : 'deactivated'}`,
          color: 'green',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update API key status',
        color: 'red',
      })
    }
  }

  const handleDelete = async (keyId: string) => {
    try {
      // Build URL with impersonation parameter if needed
      let url = `/api/customer/api-keys/${keyId}`
      if (isImpersonating && impersonationData) {
        url += `?impersonatedCustomerId=${impersonationData.targetUser.id}`
      }
      
      const response = await fetch(url, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchApiKeys()
        fetchApiStats()
        notifications.show({
          title: 'Success',
          message: 'API key deleted',
          color: 'green',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete API key',
        color: 'red',
      })
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  const maskApiKey = (key: string) => {
    if (key.length < 8) return key
    return key.substring(0, 8) + '...' + key.substring(key.length - 4)
  }

  const getPermissionColor = (permission: string) => {
    if (permission.includes('write')) return 'orange'
    if (permission.includes('read')) return 'blue'
    return 'gray'
  }

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} />
      
      <Stack gap="lg">
        {/* Stats Overview */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="md" bg="blue.0">
              <Group gap="sm">
                <IconKey size={20} color="blue" />
                <div>
                  <Text size="lg" fw={700} c="blue.8">{stats.totalKeys}</Text>
                  <Text size="xs" c="blue.7" fw={500}>Total Keys</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="md" bg="green.0">
              <Group gap="sm">
                <IconKey size={20} color="green" />
                <div>
                  <Text size="lg" fw={700} c="green.8">{stats.activeKeys}</Text>
                  <Text size="xs" c="green.7" fw={500}>Active Keys</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="md" bg="teal.0">
              <Group gap="sm">
                <IconServer size={20} color="teal" />
                <div>
                  <Text size="lg" fw={700} c="teal.8">{stats.totalRequests.toLocaleString()}</Text>
                  <Text size="xs" c="teal.7" fw={500}>Total Requests</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card withBorder padding="md" bg="orange.0">
              <Group gap="sm">
                <IconRefresh size={20} color="orange" />
                <div>
                  <Text size="lg" fw={700} c="orange.8">{stats.requestsToday}</Text>
                  <Text size="xs" c="orange.7" fw={500}>Today</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* New API Key Display */}
        {newApiKey && (
          <Alert color="green" title="New API Key Created">
            <Stack gap="sm">
              <Text size="sm">
                Save this API key securely. You won't be able to see it again.
              </Text>
              <Group gap="sm">
                <Code>{newApiKey}</Code>
                <CopyButton value={newApiKey}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                      <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                        {copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
              <Button variant="subtle" size="xs" onClick={() => setNewApiKey(null)}>
                Dismiss
              </Button>
            </Stack>
          </Alert>
        )}

        {/* API Keys Management */}
        <Card withBorder padding="lg">
          <Group justify="space-between" mb="md">
            <Group gap="sm">
              <Text size="lg" fw={600}>API Keys</Text>
              <Badge variant="light" size="sm">
                {apiKeys.filter(key => key.isActive).length} active
              </Badge>
            </Group>
            <Group gap="sm">
              <Button 
                variant="light"
                leftSection={<IconBook size="1rem" />}
                onClick={openDocsModal}
              >
                View Documentation
              </Button>
              <Button 
                leftSection={<IconPlus size="1rem" />}
                onClick={open}
              >
                Create API Key
              </Button>
            </Group>
          </Group>

          {apiKeys.length > 0 ? (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>API Key</Table.Th>
                  <Table.Th>Permissions</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Usage</Table.Th>
                  <Table.Th>Last Used</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {apiKeys.map((apiKey) => (
                  <Table.Tr key={apiKey.id}>
                    <Table.Td>
                      <div>
                        <Text fw={500} size="sm">{apiKey.name}</Text>
                        <Text size="xs" c="dimmed">
                          Created {new Date(apiKey.createdAt).toLocaleDateString()}
                        </Text>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Code size="sm">
                          {visibleKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}
                        </Code>
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {visibleKeys.has(apiKey.id) ? 
                            <IconEyeOff size="0.8rem" /> : 
                            <IconEye size="0.8rem" />
                          }
                        </ActionIcon>
                        <CopyButton value={apiKey.key}>
                          {({ copied, copy }) => (
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              color={copied ? 'teal' : 'gray'}
                              onClick={copy}
                            >
                              {copied ? <IconCheck size="0.8rem" /> : <IconCopy size="0.8rem" />}
                            </ActionIcon>
                          )}
                        </CopyButton>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {(() => {
                          const permissions = Array.isArray(apiKey.permissions) 
                            ? apiKey.permissions 
                            : typeof apiKey.permissions === 'string' 
                              ? JSON.parse(apiKey.permissions)
                              : []
                          
                          return (
                            <>
                              {permissions.slice(0, 2).map((permission) => (
                                <Badge 
                                  key={permission} 
                                  color={getPermissionColor(permission)}
                                  size="xs"
                                >
                                  {permission.split('.')[1]}
                                </Badge>
                              ))}
                              {permissions.length > 2 && (
                                <Badge variant="light" size="xs" c="dimmed">
                                  +{permissions.length - 2}
                                </Badge>
                              )}
                            </>
                          )
                        })()}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={4}>
                        <Switch
                          checked={apiKey.isActive}
                          onChange={() => handleToggleActive(apiKey.id, apiKey.isActive)}
                          size="sm"
                        />
                        {apiKey.neverExpires ? (
                          <Badge color="green" size="xs" variant="light">
                            Never Expires
                          </Badge>
                        ) : apiKey.expiresAt ? (
                          <Text size="xs" c="dimmed">
                            Expires {new Date(apiKey.expiresAt).toLocaleDateString()}
                          </Text>
                        ) : (
                          <Text size="xs" c="dimmed">No expiration</Text>
                        )}
                        {apiKey.defaultPermissions && (
                          <Badge color="blue" size="xs" variant="light">
                            Default Permissions
                          </Badge>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>{apiKey.usageCount.toLocaleString()}</Text>
                      <Text size="xs" c="dimmed">requests</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {apiKey.lastUsedAt ? 
                          new Date(apiKey.lastUsedAt).toLocaleDateString() : 
                          'Never'
                        }
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(apiKey.id)}
                      >
                        <IconTrash size="1rem" />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
              No API keys found. Create your first API key to start using the API.
            </Alert>
          )}
        </Card>
      </Stack>

      {/* Create API Key Modal */}
      <Modal 
        opened={opened} 
        onClose={close} 
        title="Create API Key"
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
              API keys provide programmatic access to your WhatsApp account. Keep them secure and never share them publicly.
            </Alert>

            <TextInput
              label="API Key Name"
              placeholder="e.g., Production API, Mobile App"
              leftSection={<IconKey size="1rem" />}
              {...form.getInputProps('name')}
              required
            />

            <div>
              <MultiSelect
                label="Permissions (Optional)"
                placeholder="Select permissions for this API key (leave empty for default permissions)"
                data={API_PERMISSIONS}
                {...form.getInputProps('permissions')}
                description="If no permissions are selected, default permissions will be applied: Send Messages, Read Messages, Read Contacts, Read Instances"
              />
              
              {form.values.permissions.length === 0 && (
                <Alert color="blue" variant="light" mt="xs" size="sm">
                  <Text size="sm">
                    <strong>Default Permissions:</strong> messages.send, messages.read, contacts.read, instances.read
                  </Text>
                </Alert>
              )}
            </div>

            <Stack gap="sm">
              <Switch
                label="Never Expires"
                description="API key will never expire (overrides expiration date)"
                {...form.getInputProps('neverExpires')}
              />
              
              {!form.values.neverExpires && (
                <TextInput
                  label="Expiration Date (Optional)"
                  type="date"
                  {...form.getInputProps('expiresAt')}
                />
              )}
            </Stack>

            <Group justify="flex-end">
              <Button variant="subtle" onClick={close}>
                Cancel
              </Button>
              <Button 
                type="submit"
                leftSection={<IconKey size="1rem" />}
              >
                Create API Key
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* API Documentation Modal */}
      <Modal 
        opened={docsModalOpened} 
        onClose={closeDocsModal} 
        title="API Documentation"
        size="xl"
        scrollAreaComponent="div"
      >
        <Tabs defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconBook size="1rem" />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="authentication" leftSection={<IconKey size="1rem" />}>
              Authentication
            </Tabs.Tab>
            <Tabs.Tab value="endpoints" leftSection={<IconCode size="1rem" />}>
              Endpoints
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Stack gap="md">
              <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                <Text fw={500} mb="xs">WhatsApp Business API</Text>
                <Text size="sm">
                  Use our RESTful API to send messages, manage contacts, and integrate WhatsApp 
                  functionality into your applications.
                </Text>
              </Alert>

              <Text size="lg" fw={600}>Base URL</Text>
              <Code block>https://api.example.com/v1</Code>

              <Text size="lg" fw={600}>Rate Limits</Text>
              <Text size="sm">
                • 100 requests per minute per API key<br />
                • 10,000 messages per day (varies by plan)<br />
                • Burst limit: 10 requests per second
              </Text>

              <Text size="lg" fw={600}>Response Format</Text>
              <Text size="sm" mb="xs">All responses are in JSON format:</Text>
              <Code block>{`{
  "success": true,
  "data": { ... },
  "message": "Request successful"
}`}</Code>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="authentication" pt="md">
            <Stack gap="md">
              <Text size="lg" fw={600}>API Key Authentication</Text>
              <Text size="sm">
                Include your API key in the Authorization header of all requests:
              </Text>
              <Code block>Authorization: Bearer YOUR_API_KEY</Code>

              <Text size="lg" fw={600}>Example Request</Text>
              <Code block>{`curl -X GET "https://api.example.com/v1/messages" \\
  -H "Authorization: Bearer sk_live_abc123...def456" \\
  -H "Content-Type: application/json"`}</Code>

              <Alert color="yellow" title="Security Best Practices">
                <Text size="sm">
                  • Never include API keys in client-side code<br />
                  • Use environment variables to store keys<br />
                  • Rotate keys regularly<br />
                  • Use minimal required permissions
                </Text>
              </Alert>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="endpoints" pt="md">
            <Accordion>
              <Accordion.Item value="messages">
                <Accordion.Control>
                  <Group>
                    <Badge color="green">POST</Badge>
                    <Text>/messages/send</Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    <Text size="sm">Send a WhatsApp message to a contact.</Text>
                    <Code block>{`{
  "to": "+1234567890",
  "message": "Hello from our API!",
  "instance_id": "instance_123"
}`}</Code>
                    <Text size="xs" c="dimmed">Required permissions: messages.send</Text>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="contacts">
                <Accordion.Control>
                  <Group>
                    <Badge color="blue">GET</Badge>
                    <Text>/contacts</Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    <Text size="sm">Retrieve your contact list.</Text>
                    <Code block>{`{
  "page": 1,
  "limit": 50,
  "search": "john"
}`}</Code>
                    <Text size="xs" c="dimmed">Required permissions: contacts.read</Text>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="instances">
                <Accordion.Control>
                  <Group>
                    <Badge color="blue">GET</Badge>
                    <Text>/instances</Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    <Text size="sm">Get your WhatsApp instances and their status.</Text>
                    <Text size="xs" c="dimmed">Required permissions: instances.read</Text>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            <Divider my="md" />
            
            <Alert icon={<IconInfoCircle size="1rem" />} color="purple">
              <Text fw={500} mb="xs">Full API Documentation</Text>
              <Text size="sm">
                Complete API documentation with interactive examples is available at{' '}
                <a href="/customer/api-keys/docs" target="_blank" rel="noopener noreferrer">
                  /customer/api-keys/docs
                </a>
              </Text>
            </Alert>
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </div>
  )
}