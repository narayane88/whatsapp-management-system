'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Card,
  Stack,
  Group,
  Button,
  Text,
  Title,
  Badge,
  Table,
  Alert,
  LoadingOverlay,
  Grid,
  ActionIcon,
  Tooltip,
  Pagination,
  NumberFormatter,
  Progress,
  Timeline,
  ScrollArea
} from '@mantine/core'
import {
  IconCoins,
  IconTrendingUp,
  IconTrendingDown,
  IconCreditCard,
  IconRefresh,
  IconReceipt,
  IconDownload,
  IconPlus,
  IconMinus,
  IconClock
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/navigation'
import { useCustomerNotifications } from '@/hooks/useCustomerNotifications'
import CustomerHeader from '@/components/customer/CustomerHeader'

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  reference?: string
  balance: number
  createdAt: string
  metadata?: any
}

interface BizCoinsData {
  balance: {
    current: number
    formatted: string
  }
  stats: {
    totalEarned: number
    totalSpent: number
    earningsCount: number
    spendingCount: number
    netBalance: number
  }
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function BizCoinsPage() {
  const router = useRouter()
  const { showPaymentNotification } = useCustomerNotifications()
  const [data, setData] = useState<BizCoinsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    fetchBizCoinsData()
  }, [currentPage])

  useEffect(() => {
    const interval = setInterval(fetchBizCoinsData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchBizCoinsData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/customer/bizcoins?page=${currentPage}&limit=${pageSize}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch BizCoins data')
      }
      
      const result = await response.json()
      setData(result)
      
    } catch (error) {
      console.error('Error fetching BizCoins data:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch BizCoins data',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'PURCHASE':
      case 'ADMIN_CREDIT':
      case 'COMMISSION_EARNED':
      case 'BONUS':
        return 'green'
      case 'DEBIT':
      case 'SPENT':
      case 'WITHDRAWAL':
        return 'red'
      default:
        return 'blue'
    }
  }

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) {
      return <IconPlus size="1rem" />
    } else {
      return <IconMinus size="1rem" />
    }
  }

  const exportTransactions = () => {
    if (!data?.transactions) return
    
    const csvContent = [
      ['Date', 'Time', 'Type', 'Amount', 'Description', 'Reference', 'Balance'].join(','),
      ...data.transactions.map(tx => [
        new Date(tx.createdAt).toLocaleDateString(),
        new Date(tx.createdAt).toLocaleTimeString(),
        tx.type,
        tx.amount.toString(),
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.reference || '',
        tx.balance.toString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bizcoins-history-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    notifications.show({
      title: '📄 Export Complete',
      message: 'BizCoins history exported to CSV file',
      color: 'green'
    })
  }

  if (loading) {
    return <LoadingOverlay visible />
  }

  if (!data) {
    return (
      <div>
        <CustomerHeader 
          title="BizCoins"
          subtitle="Manage your BizCoins balance and view transaction history"
          badge={{ label: 'Digital Wallet', color: 'gold' }}
        />
        <Container size="xl" py="md">
          <Alert color="red">Failed to load BizCoins data</Alert>
        </Container>
      </div>
    )
  }

  return (
    <div>
      <CustomerHeader 
        title="BizCoins"
        subtitle="Manage your BizCoins balance and view transaction history"
        badge={{ label: 'Digital Wallet', color: 'gold' }}
      />
      
      <Container size="xl" py="md">
        <Stack gap="lg">
          {/* Balance & Stats Cards */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card withBorder padding="xl" style={{ backgroundColor: '#f8f9ff', border: '2px solid #4c6ef5' }}>
                <Group gap="sm" mb="md">
                  <IconCoins size="2rem" color="#4c6ef5" />
                  <div>
                    <Text size="sm" c="dimmed">Current Balance</Text>
                    <Title order={2} c="#4c6ef5">
                      <NumberFormatter value={data.balance.current} thousandSeparator />
                    </Title>
                    <Text size="xs" c="dimmed">BizCoins</Text>
                  </div>
                </Group>
                <Button
                  fullWidth
                  color="blue"
                  leftSection={<IconCreditCard size="1rem" />}
                  onClick={() => router.push('/customer/bizcoins/purchase')}
                >
                  Purchase BizCoins
                </Button>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card withBorder padding="md" style={{ backgroundColor: '#e8f5e8' }}>
                <Group gap="sm">
                  <IconTrendingUp size="1.5rem" color="#2e7d32" />
                  <div>
                    <Text size="xs" c="dimmed">Total Earned</Text>
                    <Text size="xl" fw={700}>
                      <NumberFormatter value={data.stats.totalEarned} thousandSeparator />
                    </Text>
                    <Text size="xs" c="dimmed">{data.stats.earningsCount} transactions</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card withBorder padding="md" style={{ backgroundColor: '#ffebee' }}>
                <Group gap="sm">
                  <IconTrendingDown size="1.5rem" color="#c62828" />
                  <div>
                    <Text size="xs" c="dimmed">Total Spent</Text>
                    <Text size="xl" fw={700}>
                      <NumberFormatter value={data.stats.totalSpent} thousandSeparator />
                    </Text>
                    <Text size="xs" c="dimmed">{data.stats.spendingCount} transactions</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Transaction History */}
          <Card withBorder padding="lg">
            <Group justify="space-between" mb="md">
              <Title order={4}>💰 Transaction History</Title>
              <Group gap="sm">
                <Button
                  variant="light"
                  size="sm"
                  onClick={fetchBizCoinsData}
                  leftSection={<IconRefresh size="1rem" />}
                >
                  Refresh
                </Button>
                <Button
                  variant="light"
                  color="green"
                  size="sm"
                  onClick={exportTransactions}
                  leftSection={<IconDownload size="1rem" />}
                  disabled={data.transactions.length === 0}
                >
                  Export CSV
                </Button>
              </Group>
            </Group>

            {data.transactions.length > 0 ? (
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date & Time</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Description</Table.Th>
                      <Table.Th>Balance</Table.Th>
                      <Table.Th>Reference</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data.transactions.map((transaction) => (
                      <Table.Tr key={transaction.id}>
                        <Table.Td>
                          <div>
                            <Text size="sm" fw={500}>
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={getTransactionColor(transaction.type)}
                            variant="light"
                            leftSection={getTransactionIcon(transaction.type, transaction.amount)}
                          >
                            {transaction.type.replace('_', ' ')}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text 
                            size="sm" 
                            fw={600}
                            c={transaction.amount >= 0 ? 'green' : 'red'}
                          >
                            {transaction.amount >= 0 ? '+' : ''}
                            <NumberFormatter value={transaction.amount} thousandSeparator />
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" style={{ maxWidth: 250 }} truncate="end">
                            {transaction.description}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            <NumberFormatter value={transaction.balance} thousandSeparator />
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed" ff="monospace">
                            {transaction.reference || '-'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            ) : (
              <Alert icon={<IconReceipt size="1rem" />}>
                <Text size="sm">No transactions found. Purchase BizCoins to get started!</Text>
              </Alert>
            )}

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={data.pagination.totalPages}
                  size="sm"
                />
              </Group>
            )}
          </Card>
        </Stack>
      </Container>
    </div>
  )
}