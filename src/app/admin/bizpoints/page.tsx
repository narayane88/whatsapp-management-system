'use client'

import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Badge,
  SimpleGrid,
  Button,
  ScrollArea,
  Tabs,
  Alert,
  Table,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
  Modal,
  Textarea,
  Select,
  NumberInput,
  Menu,
  ThemeIcon,
  Box,
  RingProgress
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import {
  FiUsers,
  FiCreditCard,
  FiPlus,
  FiMinus,
  FiRefreshCw,
  FiDownload,
  FiShoppingCart,
} from 'react-icons/fi'
import BizCoinIcon from '@/components/icons/BizCoinIcon'
import { useState, useEffect } from 'react'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import BizCoinsPaymentIframe from '@/components/payments/BizCoinsPaymentIframe'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernAlert,
  ModernContainer
} from '@/components/ui/modern-components'
import {
  ResponsiveGrid,
  ResponsiveCardGrid,
  ResponsiveStack
} from '@/components/ui/responsive-layout'

// Razorpay types
declare global {
  interface Window {
    Razorpay: any
  }
}

interface BizCoinsUser {
  id: string
  name: string
  email: string
  mobile: string
  dealerCode: string
  bizCoins: number
  role: string
  roleLevel: number
  transactionCount: number
  lastTransaction: string | null
}

interface BizCoinsTransaction {
  id: string
  userId: string
  type: string
  amount: number
  balance: number
  description: string
  reference: string | null
  createdAt: string
  user: {
    name: string
    email: string
    dealerCode: string
  }
  creator: string | null
}

interface BizCoinsStats {
  totalBizCoins: number
  totalUsersWithCoins: number
  totalTransactions: number
  totalCommissionsEarned: number
  totalSettlements: number
}

interface ApiResponse {
  users: BizCoinsUser[]
  transactions: BizCoinsTransaction[]
  summary: BizCoinsStats
  pagination: {
    page: number
    limit: number
    totalUsers: number
    totalTransactions: number
    totalPages: number
  }
}

export default function BizCoinsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserLevel, setCurrentUserLevel] = useState<number | null>(null)
  const [currentUserCommissionRate, setCurrentUserCommissionRate] = useState<number>(0)
  const [transactionOpened, { open: openTransaction, close: closeTransaction }] = useDisclosure()
  const [purchaseOpened, { open: openPurchase, close: closePurchase }] = useDisclosure()
  const [paymentIframeOpened, { open: openPaymentIframe, close: closePaymentIframe }] = useDisclosure()
  
  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    userId: '',
    type: 'ADMIN_CREDIT',
    amount: 0,
    description: ''
  })

  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState({
    amount: 0,
    paymentMethod: 'RAZORPAY',
    description: 'Self purchase of BizCoins'
  })

  // Filter state
  const [filters, setFilters] = useState({
    userId: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    transactionType: ''
  })

  // Filtered transactions
  const filteredTransactions = data?.transactions?.filter(txn => {
    const matchesUser = !filters.userId || txn.userId === filters.userId
    const matchesType = !filters.transactionType || txn.type === filters.transactionType
    
    const txnDate = new Date(txn.createdAt)
    const matchesStartDate = !filters.startDate || txnDate >= filters.startDate
    const matchesEndDate = !filters.endDate || txnDate <= filters.endDate
    
    return matchesUser && matchesType && matchesStartDate && matchesEndDate
  }) || []

  const fetchData = async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/bizpoints')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch BizCoins data: ${response.status}`)
      }
      
      const result: ApiResponse = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching BizCoins data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Fetch current user's level and commission rate
  const fetchCurrentUserInfo = async () => {
    try {
      const response = await fetch('/api/users/current')
      if (response.ok) {
        const userData = await response.json()
        setCurrentUserLevel(userData.user.roleLevel || null)
        
        // Get commission rate from user account
        const userResponse = await fetch('/api/admin/users/commission-rate')
        if (userResponse.ok) {
          const commissionData = await userResponse.json()
          setCurrentUserCommissionRate(commissionData.commissionRate || 0)
        }
      }
    } catch (error) {
      console.error('Failed to fetch current user info:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchData(), fetchCurrentUserInfo()])
      setLoading(false)
    }
    
    loadData()
  }, [])

  const handleCreateTransaction = async () => {
    if (!transactionForm.userId || !transactionForm.amount) {
      return
    }

    try {
      const response = await fetch('/api/admin/bizpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionForm),
      })

      if (response.ok) {
        closeTransaction()
        fetchData() // Refresh data
        setTransactionForm({
          userId: '',
          type: 'ADMIN_CREDIT',
          amount: 0,
          description: ''
        })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create transaction')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handlePurchaseCoins = () => {
    if (!purchaseForm.amount) {
      return
    }
    
    // Close the amount input modal and open payment iframe
    closePurchase()
    openPaymentIframe()
  }

  const handlePurchaseSuccess = (paymentData: any) => {
    console.log('🎉 BizCoins purchase successful:', paymentData)
    
    // Close payment iframe
    closePaymentIframe()
    
    // Refresh the data to show updated balance
    fetchData()
    
    // Reset form
    setPurchaseForm({
      amount: 0,
      paymentMethod: 'RAZORPAY',
      description: 'Self purchase of BizCoins'
    })
  }

  const handlePurchaseFailure = (errorData: any) => {
    console.error('❌ BizCoins purchase failed:', errorData)
    
    // Close payment iframe
    closePaymentIframe()
    
    if (errorData.error !== 'PAYMENT_CANCELLED') {
      setError(errorData.message || 'Purchase failed')
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'COMMISSION_EARNED': return 'green'
      case 'ADMIN_CREDIT': return 'blue'
      case 'ADMIN_DEBIT': return 'red'
      case 'SETTLEMENT_WITHDRAW': return 'orange'
      case 'BONUS': return 'violet'
      default: return 'gray'
    }
  }

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  }

  // Export functions
  const exportToExcel = () => {
    const csvContent = [
      ['Transaction ID', 'User Name', 'Dealer Code', 'Type', 'Amount', 'Balance', 'Description', 'Reference', 'Date'],
      ...filteredTransactions.map(txn => [
        txn.id,
        txn.user.name,
        txn.user.dealerCode || 'N/A',
        txn.type.replace('_', ' '),
        txn.amount,
        txn.balance,
        txn.description || 'N/A',
        txn.reference || 'N/A',
        new Date(txn.createdAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bizcoins-transactions-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    const printWindow = window.open('', '', 'height=600,width=800')
    if (printWindow) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>BizPoints Transactions Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .filters { margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .amount-positive { color: #28a745; font-weight: bold; }
            .amount-negative { color: #dc3545; font-weight: bold; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>BizCoins Transactions Report</h2>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="filters">
            <strong>Filter Applied:</strong>
            ${filters.userId ? `User: ${data?.users?.find(u => u.id === filters.userId)?.name || 'Unknown'} | ` : ''}
            ${filters.transactionType ? `Type: ${filters.transactionType.replace('_', ' ')} | ` : ''}
            ${filters.startDate ? `From: ${filters.startDate.toLocaleDateString()} | ` : ''}
            ${filters.endDate ? `To: ${filters.endDate.toLocaleDateString()} | ` : ''}
            Total Records: ${filteredTransactions.length}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(txn => `
                <tr>
                  <td>${txn.id}</td>
                  <td>${txn.user.name}<br><small>${txn.user.dealerCode || 'No Code'}</small></td>
                  <td>${txn.type.replace('_', ' ')}</td>
                  <td class="${txn.amount > 0 ? 'amount-positive' : 'amount-negative'}">
                    ${txn.amount > 0 ? '+' : ''}₹${Math.abs(txn.amount).toLocaleString('en-IN')}
                  </td>
                  <td>₹${txn.balance.toLocaleString('en-IN')}</td>
                  <td>${txn.description || 'N/A'}</td>
                  <td>${new Date(txn.createdAt).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This report contains ${filteredTransactions.length} transaction records.</p>
            <p>Report generated from BizCoins Management System</p>
          </div>
        </body>
        </html>
      `
      
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const clearFilters = () => {
    setFilters({
      userId: '',
      startDate: null,
      endDate: null,
      transactionType: ''
    })
  }

  if (loading) {
    return (
      <PagePermissionGuard requiredPermissions={['bizpoints.page.access']}>
        <AdminLayout>
          <ModernContainer fluid>
            <Center h={400}>
              <ModernCard
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(168, 85, 247, 0.03) 100%)',
                  border: '2px solid rgba(139, 92, 246, 0.15)',
                  borderRadius: '16px',
                  padding: '32px',
                  textAlign: 'center'
                }}
              >
                <Stack align="center" gap="lg">
                  <ThemeIcon 
                    size="4xl" 
                    variant="gradient" 
                    gradient={{ from: 'violet.5', to: 'purple.4', deg: 135 }}
                    style={{
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    <BizCoinIcon size={48} color="#FFFFFF" />
                  </ThemeIcon>
                  <Box>
                    <Text size="lg" fw={600} c="violet.7" mb={3}>
                      Loading BizCoins Data
                    </Text>
                    <Text size="xs" c="dimmed" fw={400}>
                      Fetching wallet transactions and user statistics
                    </Text>
                  </Box>
                  <Loader variant="dots" size="lg" color="violet" />
                </Stack>
              </ModernCard>
            </Center>
          </ModernContainer>
        </AdminLayout>
      </PagePermissionGuard>
    )
  }

  return (
    <PagePermissionGuard requiredPermissions={['bizpoints.page.access']}>
      <AdminLayout>
        <ModernContainer fluid>
          <ResponsiveStack gap="xl">
            {/* Enhanced Header */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(168, 85, 247, 0.03) 100%)',
                border: '2px solid rgba(139, 92, 246, 0.15)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.08)',
                padding: '32px'
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Group gap="lg">
                  <ThemeIcon 
                    size="2xl" 
                    variant="gradient" 
                    gradient={{ from: 'violet.6', to: 'purple.5', deg: 135 }}
                    style={{
                      boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <BizCoinIcon size={28} color="#FFFFFF" />
                  </ThemeIcon>
                  <Box>
                    <Title 
                      order={2} 
                      mb={8}
                      c="violet.7"
                    >
                      BizCoins Management
                    </Title>
                    <Text c="dimmed" size="xs" fw={500} mb="lg">
                      Commission Settlement Wallet System (1 BizCoin = 1 Rupee)
                    </Text>
                    
                    {/* Quick Stats Bar */}
                    <Group gap="xl">
                      <Group gap="xs">
                        <FiCreditCard size={10} color="var(--mantine-color-violet-6)" />
                        <Text size="xs" c="dimmed">Total Coins:</Text>
                        <Text size="xs" fw={700} c="violet.7">
                          {formatAmount(data?.summary?.totalBizCoins || 0)}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <FiUsers size={10} color="var(--mantine-color-purple-6)" />
                        <Text size="xs" c="dimmed">Active Users:</Text>
                        <Text size="xs" fw={700} c="purple.7">
                          {data?.summary?.totalUsersWithCoins || 0}
                        </Text>
                      </Group>
                    </Group>
                  </Box>
                </Group>
                
                <Group gap="sm">
                  <Tooltip label="Refresh all data">
                    <ActionIcon 
                      size="lg" 
                      variant="light" 
                      color="violet"
                      onClick={fetchData}
                      loading={loading}
                    >
                      <FiRefreshCw size={10} />
                    </ActionIcon>
                  </Tooltip>
                
                  {/* Show Purchase Coins button for Level 3+ users */}
                  {currentUserLevel !== null && currentUserLevel >= 3 ? (
                    <ModernButton
                      leftSection={<FiShoppingCart size={10} />}
                      onClick={() => {
                        setPurchaseForm({
                          amount: 0,
                          paymentMethod: 'RAZORPAY',
                          description: 'Self purchase of BizCoins'
                        })
                        openPurchase()
                      }}
                      color="blue"
                      variant="filled"
                    >
                      Purchase Coins
                    </ModernButton>
                  ) : (
                    /* Show Add Transaction button for Level 1-2 users */
                    <ModernButton
                      leftSection={<FiPlus size={10} />}
                      onClick={() => {
                        setTransactionForm({
                          userId: '',
                          type: 'ADMIN_CREDIT',
                          amount: 0,
                          description: ''
                        })
                        openTransaction()
                      }}
                      color="violet"
                      variant="filled"
                    >
                      Add Transaction
                    </ModernButton>
                  )}
                </Group>
              </Group>
            </ModernCard>

            {/* Enhanced Error Alert */}
            {error && (
              <ModernAlert variant="danger" title="Error">
                <Text size="xs">{error}</Text>
                <Group mt="md">
                  <ModernButton variant="secondary" onClick={fetchData}>
                    Retry
                  </ModernButton>
                </Group>
              </ModernAlert>
            )}

            {/* Enhanced Statistics */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
              {[
                {
                  label: 'Total BizCoins',
                  value: formatAmount(data?.summary?.totalBizCoins || 0),
                  icon: FiCreditCard,
                  color: 'violet',
                  description: 'Total system value',
                  progress: Math.min((data?.summary?.totalBizCoins || 0) / 100000 * 100, 100)
                },
                {
                  label: 'Users with Coins',
                  value: data?.summary?.totalUsersWithCoins || 0,
                  icon: FiUsers,
                  color: 'purple',
                  description: 'Active participants',
                  progress: Math.min((data?.summary?.totalUsersWithCoins || 0) / 1000 * 100, 100)
                },
                {
                  label: 'Total Transactions',
                  value: data?.summary?.totalTransactions || 0,
                  icon: FiRefreshCw,
                  color: 'violet',
                  description: 'System activity',
                  progress: Math.min((data?.summary?.totalTransactions || 0) / 10000 * 100, 100)
                },
                {
                  label: 'Commissions Earned',
                  value: formatAmount(data?.summary?.totalCommissionsEarned || 0),
                  icon: FiPlus,
                  color: 'green',
                  description: 'Total earned rewards',
                  progress: Math.min((data?.summary?.totalCommissionsEarned || 0) / 50000 * 100, 100)
                },
                {
                  label: 'Total Settlements',
                  value: formatAmount(data?.summary?.totalSettlements || 0),
                  icon: FiMinus,
                  color: 'orange',
                  description: 'Withdrawn amounts',
                  progress: Math.min((data?.summary?.totalSettlements || 0) / 25000 * 100, 100)
                }
              ].map((stat, index) => (
                <Card 
                  key={index} 
                  shadow="md" 
                  padding="md" 
                  radius="lg" 
                  withBorder
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                    border: `2px solid var(--mantine-color-${stat.color}-2)`,
                    transition: 'all 0.3s ease',
                    height: 'auto',
                    minHeight: '140px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e: any) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={(e: any) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)'
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
                    <Group justify="space-between" align="flex-start">
                      <Group gap="xs">
                        <ThemeIcon 
                          size="xs" 
                          variant="gradient" 
                          gradient={{ from: stat.color, to: `${stat.color}.7`, deg: 135 }}
                        >
                          <stat.icon size={16} />
                        </ThemeIcon>
                        <Box>
                          <Text 
                            c={`${stat.color}.7`} 
                            size="xs" 
                            fw={600} 
                            tt="uppercase"
                            lh={1.2}
                          >
                            {stat.label}
                          </Text>
                          <Text size="xs" c="dimmed" lh={1.1}>
                            {stat.description}
                          </Text>
                        </Box>
                      </Group>
                    </Group>
                    
                    
                    {/* Main Value and Progress */}
                    <Group justify="space-between" align="center" mt="sm">
                      <Box>
                        <Text 
                          size="xl" 
                          fw={700} 
                          c={`${stat.color}.8`}
                          lh={1}
                          style={{ fontSize: '1.75rem' }}
                        >
                          {stat.value}
                        </Text>
                      </Box>
                      
                      {/* Progress Ring */}
                      <RingProgress
                        size={50}
                        thickness={5}
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
                    </Group>
                  </Box>
                </Card>
              ))}
            </SimpleGrid>

            {/* Enhanced Data Tables */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,243,255,0.95) 100%)',
                border: '2px solid rgba(139, 92, 246, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.06)',
                overflow: 'hidden'
              }}
            >
            <Tabs defaultValue="users">
              <Tabs.List bg="gray.1" p="md">
                <Tabs.Tab value="users">
                  <Group gap="xs">
                    <FiUsers size={10} />
                    <Text size="xs">Users ({data?.users?.length || 0})</Text>
                  </Group>
                </Tabs.Tab>
                <Tabs.Tab value="transactions">
                  <Group gap="xs">
                    <FiCreditCard size={10} />
                    <Text size="xs">Transactions ({filteredTransactions.length})</Text>
                  </Group>
                </Tabs.Tab>
              </Tabs.List>

              {/* Users Tab */}
              <Tabs.Panel value="users" p="md">
                <ScrollArea>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>User</Table.Th>
                        <Table.Th>Role</Table.Th>
                        <Table.Th>BizCoins Balance</Table.Th>
                        <Table.Th>Transactions</Table.Th>
                        <Table.Th>Last Activity</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {data?.users?.map((user) => (
                        <Table.Tr key={user.id}>
                          <Table.Td>
                            <Stack gap={2}>
                              <Text fw={500} size="xs">{user.name}</Text>
                              <Text size="xs" c="dimmed">{user.email}</Text>
                              <Text size="xs" c="dimmed">Code: {user.dealerCode}</Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Badge color="blue" variant="light" size="xs">
                              {user.role}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={700} c="green.6" size="xs">
                              {formatAmount(user.bizCoins)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="outline" size="xs">
                              {user.transactionCount}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {user.lastTransaction 
                                ? new Date(user.lastTransaction).toLocaleDateString()
                                : 'Never'
                              }
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            {/* Hide Add/Deduct buttons for Level 3+ users */}
                            {currentUserLevel !== null && currentUserLevel >= 3 ? (
                              <Text size="xs" c="dimmed" ta="center">
                                No actions available
                              </Text>
                            ) : (
                              <Group gap="xs">
                                <Tooltip label="Add Credit">
                                  <ActionIcon 
                                    variant="light" 
                                    color="green"
                                    size="xs"
                                    onClick={() => {
                                      setTransactionForm({
                                        userId: user.id,
                                        type: 'ADMIN_CREDIT',
                                        amount: 0,
                                        description: `Credit for ${user.name}`
                                      })
                                      openTransaction()
                                    }}
                                  >
                                    <FiPlus size={10} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Debit Points">
                                  <ActionIcon 
                                    variant="light" 
                                    color="red"
                                    size="xs"
                                    onClick={() => {
                                      setTransactionForm({
                                        userId: user.id,
                                        type: 'ADMIN_DEBIT',
                                        amount: 0,
                                        description: `Debit for ${user.name}`
                                      })
                                      openTransaction()
                                    }}
                                  >
                                    <FiMinus size={10} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Tabs.Panel>

              {/* Transactions Tab */}
              <Tabs.Panel value="transactions" p="md">
                {/* Filter Controls */}
                <Stack gap="md" mb="xl">
                  <Group justify="space-between">
                    <Text fw={500} size="xs">Transaction Filters</Text>
                    <Group gap="xs">
                      <Button 
                        variant="light" 
                        leftSection={<FiRefreshCw size={10} />}
                        onClick={clearFilters}
                        size="xs"
                      >
                        Clear Filters
                      </Button>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <Button 
                            variant="outline" 
                            leftSection={<FiDownload size={10} />}
                            size="xs"
                          >
                            Export
                          </Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<FiDownload size={10} />} onClick={exportToExcel}>
                            <Text size="xs">Export to Excel (CSV)</Text>
                          </Menu.Item>
                          <Menu.Item leftSection={<FiDownload size={10} />} onClick={exportToPDF}>
                            <Text size="xs">Export to PDF</Text>
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Group>
                  
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                    <Select
                      label="Filter by User"
                      placeholder="All users"
                      value={filters.userId}
                      onChange={(value) => setFilters(prev => ({ ...prev, userId: value || '' }))}
                      data={[
                        { value: '', label: 'All Users' },
                        ...(data?.users?.map(user => ({
                          value: user.id,
                          label: `${user.name} (${user.dealerCode || 'No Code'})`
                        })) || [])
                      ]}
                      searchable
                      clearable
                    />
                    
                    <Select
                      label="Filter by Type"
                      placeholder="All types"
                      value={filters.transactionType}
                      onChange={(value) => setFilters(prev => ({ ...prev, transactionType: value || '' }))}
                      data={[
                        { value: '', label: 'All Types' },
                        { value: 'ADMIN_CREDIT', label: 'Admin Credit' },
                        { value: 'ADMIN_DEBIT', label: 'Admin Debit' },
                        { value: 'COMMISSION_EARNED', label: 'Commission Earned' },
                        { value: 'BONUS', label: 'Bonus' },
                        { value: 'SETTLEMENT_WITHDRAW', label: 'Settlement Withdraw' },
                        { value: 'PURCHASED', label: 'Purchased' },
                        { value: 'SPENT', label: 'Spent' }
                      ]}
                      clearable
                    />
                    
                    <DateInput
                      label="From Date"
                      placeholder="Select start date"
                      value={filters.startDate}
                      onChange={(value) => setFilters(prev => ({ ...prev, startDate: value }))}
                      clearable
                    />
                    
                    <DateInput
                      label="To Date"
                      placeholder="Select end date"
                      value={filters.endDate}
                      onChange={(value) => setFilters(prev => ({ ...prev, endDate: value }))}
                      clearable
                    />
                  </SimpleGrid>
                  
                  <Alert variant="light" color="blue">
                    <Group justify="space-between">
                      <Text size="xs">
                        Showing {filteredTransactions.length} of {data?.transactions?.length || 0} transactions
                      </Text>
                      {(filters.userId || filters.transactionType || filters.startDate || filters.endDate) && (
                        <Text size="xs" c="dimmed">
                          Filters applied: {[
                            filters.userId && `User: ${data?.users?.find(u => u.id === filters.userId)?.name}`,
                            filters.transactionType && `Type: ${filters.transactionType.replace('_', ' ')}`,
                            filters.startDate && `From: ${filters.startDate.toLocaleDateString()}`,
                            filters.endDate && `To: ${filters.endDate.toLocaleDateString()}`
                          ].filter(Boolean).join(', ')}
                        </Text>
                      )}
                    </Group>
                  </Alert>
                </Stack>
                
                <ScrollArea>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>User</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Amount</Table.Th>
                        <Table.Th>Balance After</Table.Th>
                        <Table.Th>Description</Table.Th>
                        <Table.Th>Date</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredTransactions.map((txn) => (
                        <Table.Tr key={txn.id}>
                          <Table.Td>
                            <Stack gap={2}>
                              <Text fw={500} size="xs">{txn.user.name}</Text>
                              <Text size="xs" c="dimmed">{txn.user.dealerCode}</Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={getTransactionColor(txn.type)} variant="light" size="xs">
                              {txn.type.replace('_', ' ')}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text 
                              fw={700} 
                              c={txn.amount > 0 ? 'green.6' : 'red.6'}
                              size="xs"
                            >
                              {txn.amount > 0 ? '+' : ''}{formatAmount(Math.abs(txn.amount))}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={500} size="xs">
                              {formatAmount(txn.balance)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" lineClamp={1}>
                              {txn.description || 'No description'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {new Date(txn.createdAt).toLocaleString()}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Tabs.Panel>
            </Tabs>
            </ModernCard>
          </ResponsiveStack>
        </ModernContainer>

      {/* Purchase Amount Input Modal */}
      <Modal 
        opened={purchaseOpened} 
        onClose={closePurchase}
        title="Purchase BizCoins"
        size="xs"
      >
        <Stack gap="md">
          <Alert color="blue" variant="light">
            <Text size="xs" fw="500">Level {currentUserLevel} User Benefits</Text>
            <Text size="xs">
              • Only Razorpay payment allowed
              • Commission Rate: {currentUserCommissionRate}%
              • Additional bonus coins: {(purchaseForm.amount * currentUserCommissionRate / 100).toFixed(2)}
            </Text>
          </Alert>
          
          <NumberInput
            label="Purchase Amount (₹)"
            placeholder="Enter amount to purchase"
            value={purchaseForm.amount}
            onChange={(value) => setPurchaseForm(prev => ({ ...prev, amount: Number(value) || 0 }))}
            min={1}
            step={1}
            required
            leftSection="₹"
          />
          
          <Select
            label="Payment Method"
            value={purchaseForm.paymentMethod}
            onChange={(value) => setPurchaseForm(prev => ({ ...prev, paymentMethod: value || 'RAZORPAY' }))}
            data={[{ value: 'RAZORPAY', label: 'Razorpay' }]}
            disabled
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Purchase description"
            value={purchaseForm.description}
            onChange={(event) => setPurchaseForm(prev => ({ ...prev, description: event.target.value }))}
          />
          
          {purchaseForm.amount > 0 && (
            <Alert color="green" variant="light">
              <Text size="xs" fw="500">Purchase Summary</Text>
              <Text size="xs">
                Base Coins: {purchaseForm.amount} BizCoins<br/>
                Commission Bonus: {(purchaseForm.amount * currentUserCommissionRate / 100).toFixed(2)} BizCoins<br/>
                <strong>Total Coins: {(purchaseForm.amount + purchaseForm.amount * currentUserCommissionRate / 100).toFixed(2)} BizCoins</strong>
              </Text>
            </Alert>
          )}
          
          <Group justify="flex-end">
            <Button variant="outline" onClick={closePurchase}>
              Cancel
            </Button>
            <Button 
              color="blue" 
              onClick={handlePurchaseCoins}
              disabled={!purchaseForm.amount || purchaseForm.amount <= 0}
              leftSection={<FiShoppingCart size={16} />}
            >
              Continue to Payment
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* BizCoins Payment Iframe */}
      <BizCoinsPaymentIframe
        opened={paymentIframeOpened}
        onClose={closePaymentIframe}
        amount={purchaseForm.amount}
        commissionRate={currentUserCommissionRate}
        description={purchaseForm.description}
        onPaymentSuccess={handlePurchaseSuccess}
        onPaymentFailure={handlePurchaseFailure}
      />

      {/* Transaction Modal */}
      <Modal 
        opened={transactionOpened} 
        onClose={closeTransaction}
        title="Create BizCoins Transaction"
      >
        <Stack gap="md">
          <Select
            label="User"
            placeholder="Select user"
            value={transactionForm.userId}
            onChange={(value) => setTransactionForm(prev => ({ ...prev, userId: value || '' }))}
            data={data?.users?.map(user => ({ 
              value: String(user.id), 
              label: `${user.name} (${user.dealerCode || 'No Code'})` 
            })) || []}
            searchable
            required
          />
          
          <Select
            label="Transaction Type"
            value={transactionForm.type}
            onChange={(value) => setTransactionForm(prev => ({ ...prev, type: value || 'ADMIN_CREDIT' }))}
            data={[
              { value: 'ADMIN_CREDIT', label: 'Admin Credit' },
              { value: 'ADMIN_DEBIT', label: 'Admin Debit' },
              { value: 'BONUS', label: 'Bonus' },
              { value: 'SETTLEMENT_WITHDRAW', label: 'Settlement Withdraw' }
            ]}
            required
          />
          
          <NumberInput
            label="Amount (BizCoins)"
            placeholder="Enter amount"
            value={transactionForm.amount}
            onChange={(value) => setTransactionForm(prev => ({ ...prev, amount: Number(value) || 0 }))}
            min={0.01}
            step={0.01}
            decimalScale={2}
            fixedDecimalScale
            required
          />
          
          <Textarea
            label="Description"
            placeholder="Transaction description (optional)"
            value={transactionForm.description}
            onChange={(event) => setTransactionForm(prev => ({ ...prev, description: event.target.value }))}
          />
          
          <Group justify="flex-end">
            <Button variant="outline" onClick={closeTransaction}>
              Cancel
            </Button>
            <Button 
              color="green" 
              onClick={handleCreateTransaction}
              disabled={!transactionForm.userId || !transactionForm.amount}
            >
              Create Transaction
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AdminLayout>
    </PagePermissionGuard>
  )
}