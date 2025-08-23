'use client'

import { useEffect, useState } from 'react'
import { 
  Card, 
  Text, 
  Button, 
  Group, 
  Stack, 
  Badge,
  Alert,
  LoadingOverlay,
  Table
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { 
  IconServer, 
  IconRefresh,
  IconCheck,
  IconInfoCircle,
  IconBrandWhatsapp
} from '@tabler/icons-react'

interface ServerAccount {
  id: string
  status: string
  phoneNumber?: string
  lastSeen?: string
  deviceInfo?: {
    phoneNumber: string
    userName: string
    connectedAt: string
    deviceId: string
    platform: string
  }
  userName?: string
}

interface ServerResponse {
  success: boolean
  data: {
    accounts: ServerAccount[]
    total: number
  }
  message: string
}

export default function ServerStatusChecker() {
  const [accounts, setAccounts] = useState<ServerAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [serverHealth, setServerHealth] = useState<any>(null)

  useEffect(() => {
    checkServerStatus()
  }, [])

  const checkServerStatus = async () => {
    try {
      if (loading) setLoading(true)

      // Check server health
      const healthResponse = await fetch('http://localhost:3005/api/health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setServerHealth(healthData.data)
      }

      // Check connected accounts
      const accountsResponse = await fetch('http://localhost:3005/api/accounts')
      if (accountsResponse.ok) {
        const accountsData: ServerResponse = await accountsResponse.json()
        setAccounts(accountsData.data.accounts)
      }
    } catch (error: any) {
      console.error('Server check error:', error)
      notifications.show({
        title: '❌ Server Check Failed',
        message: 'Could not connect to WhatsApp server (localhost:3005)',
        color: 'red'
      })
    } finally {
      if (loading) setLoading(false)
    }
  }

  if (loading) {
    return <LoadingOverlay visible />
  }

  return (
    <Stack gap="lg">
      {/* Server Health */}
      <Card withBorder padding="lg">
        <Group justify="space-between" mb="md">
          <Group gap="sm">
            <IconServer size={24} color="#25D366" />
            <Text size="lg" fw={600}>Direct Server Status Check</Text>
          </Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size="1rem" />}
            onClick={checkServerStatus}
            size="sm"
          >
            Check Now
          </Button>
        </Group>

        {serverHealth && (
          <Group gap="md" mb="md">
            <Badge color="green" size="lg">
              ✅ Server: {serverHealth.status}
            </Badge>
            <Badge color="blue" size="lg">
              📊 Accounts: {serverHealth.accounts?.total || 0}
            </Badge>
            <Badge color="gray" size="lg">
              ⏱️ Uptime: {Math.floor(serverHealth.uptime / 60)}m
            </Badge>
          </Group>
        )}

        <Alert icon={<IconInfoCircle size="1rem" />} color="blue" variant="light">
          <Text size="sm">
            This checks directly with the WhatsApp server (localhost:3005) to verify actual connection status.
          </Text>
        </Alert>
      </Card>

      {/* Connected Accounts */}
      <Card withBorder padding="lg">
        <Text size="md" fw={500} mb="md">
          Connected Accounts (Direct from Server)
        </Text>
        
        {accounts.length > 0 ? (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Account ID</Table.Th>
                <Table.Th>Phone Number</Table.Th>
                <Table.Th>User Name</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Last Seen</Table.Th>
                <Table.Th>Platform</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {accounts.map((account) => (
                <Table.Tr key={account.id} style={{ backgroundColor: '#e8f5e8' }}>
                  <Table.Td>
                    <Text size="xs" family="monospace">{account.id}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <IconBrandWhatsapp size={16} color="#25D366" />
                      <Text size="sm" fw={500}>
                        {account.phoneNumber || account.deviceInfo?.phoneNumber || 'N/A'}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {account.userName || account.deviceInfo?.userName || 'N/A'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="green" variant="filled">
                      🟢 {account.status.toUpperCase()}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {account.lastSeen 
                        ? new Date(account.lastSeen).toLocaleString()
                        : 'N/A'
                      }
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {account.deviceInfo?.platform || 'WhatsApp Web'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Alert icon={<IconInfoCircle size="1rem" />} color="yellow">
            <Text size="sm" fw={500}>No accounts currently connected to the server</Text>
            <Text size="xs" c="dimmed">
              Server is running but no WhatsApp devices are logged in
            </Text>
          </Alert>
        )}
      </Card>

      {/* Success Message */}
      {accounts.length > 0 && (
        <Alert icon={<IconCheck size="1rem" />} color="green">
          <Text size="sm" fw={500}>
            ✅ Device Connection Verified!
          </Text>
          <Text size="xs">
            {accounts.length} WhatsApp device(s) are successfully connected and logged in to the server.
          </Text>
        </Alert>
      )}
    </Stack>
  )
}