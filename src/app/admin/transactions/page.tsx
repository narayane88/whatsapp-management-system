'use client'

import {
  Box,
  Title,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  Badge,
  Card,
  Table,
  SimpleGrid,
  ActionIcon,
  Select,
  Loader,
  Center,
  Alert,
  Modal,
  NumberInput,
  Textarea,
  Notification,
  ThemeIcon,
  Tooltip,
  Divider,
  Timeline,
  RingProgress,
  Skeleton
} from '@mantine/core'
import { 
  IconDownload, 
  IconEye, 
  IconTrendingUp, 
  IconUsers, 
  IconClock, 
  IconAlertTriangle, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconRefresh,
  IconCurrencyDollar,
  IconCreditCard,
  IconChartBar,
  IconFilter,
  IconSearch,
  IconFileExport,
  IconCalendar,
  IconDatabase,
  IconCheck,
  IconX
} from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernAlert,
  ModernContainer,
  ModernLoader,
  ModernModal
} from '@/components/ui/modern-components'
import {
  ResponsiveGrid,
  ResponsiveTwoColumn,
  ResponsiveCardGrid,
  ResponsiveTableContainer
} from '@/components/ui/responsive-layout'

interface Transaction {
  id: string;
  userId: string;
  createdBy: number | null;
  type: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  reference: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
  creator: {
    name: string;
    email: string;
  };
}

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCreatedBy, setFilterCreatedBy] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [creators, setCreators] = useState<Array<{id: number | string, name: string, email: string}>>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  // Modal states
  const [addModalOpened, setAddModalOpened] = useState(false)
  const [viewModalOpened, setViewModalOpened] = useState(false)
  const [editModalOpened, setEditModalOpened] = useState(false)
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  
  // Form states
  const [addTransactionData, setAddTransactionData] = useState({
    userId: '',
    type: '',
    method: '',
    amount: 0,
    description: '',
    reference: ''
  })
  const [editTransactionData, setEditTransactionData] = useState({
    userId: '',
    type: '',
    method: '',
    amount: 0,
    description: '',
    reference: '',
    status: ''
  })
  
  const [allUsers, setAllUsers] = useState<Array<{id: number | string, name: string, email: string}>>([])
  const [addLoading, setAddLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (filterStatus) params.append('status', filterStatus)
      if (filterType) params.append('type', filterType)
      if (filterCreatedBy) params.append('createdBy', filterCreatedBy)
      
      const response = await fetch(`/api/admin/transactions?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setTransactions(data.transactions || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      setError(error instanceof Error ? error.message : 'Failed to load transactions')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true)
    await Promise.all([fetchTransactions(), fetchCreators(), fetchAllUsers()])
    setRefreshing(false)
  }

  // Fetch available creators for the filter
  const fetchCreators = async () => {
    try {
      const response = await fetch('/api/admin/users/creators')
      if (response.ok) {
        const data = await response.json()
        setCreators(data.creators || [])
      }
    } catch (error) {
      console.error('Failed to fetch creators:', error)
    }
  }

  // Fetch all users for transaction creation
  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setAllUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  useEffect(() => {
    fetchTransactions()
    fetchCreators()
    fetchAllUsers()
  }, [pagination.page, filterStatus, filterType, filterCreatedBy])

  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    } else {
      fetchTransactions()
    }
  }, [filterStatus, filterType, filterCreatedBy])

  const getStatusColor = (status: string) => {
    if (!status) return 'gray';
    
    // Convert to lowercase and trim any whitespace
    const normalizedStatus = status.toString().toLowerCase().trim();
    
    // Check for SUCCESS variations explicitly first
    if (normalizedStatus === 'success' || status.toUpperCase() === 'SUCCESS') {
      return 'green';
    }
    
    switch (normalizedStatus) {
      // Database status values (from API)
      case 'pending':
        return 'orange'
      case 'failed':
        return 'red'
      case 'cancelled':
        return 'gray'
      // Legacy status values (for compatibility)
      case 'completed':
      case 'complete':
        return 'green'
      case 'processing':
      case 'in_progress':
        return 'orange'
      case 'error':
      case 'declined':
        return 'red'
      case 'canceled':
        return 'gray'
      case 'refunded':
      case 'refund':
        return 'violet'
      default:
        return 'blue'
    }
  }

  const getStatusGradient = (status: string) => {
    if (!status) return { from: 'gray.4', to: 'gray.3', deg: 135 };
    
    const normalizedStatus = status.toString().toLowerCase().trim();
    
    // Check for SUCCESS variations explicitly first
    if (normalizedStatus === 'success' || status.toUpperCase() === 'SUCCESS') {
      return { from: 'green.5', to: 'emerald.4', deg: 135 };
    }
    
    switch (normalizedStatus) {
      // Database status values (from API)
      case 'pending':
        return { from: 'orange.5', to: 'yellow.4', deg: 135 };
      case 'failed':
        return { from: 'red.5', to: 'pink.4', deg: 135 };
      case 'cancelled':
        return { from: 'gray.5', to: 'gray.4', deg: 135 };
      // Legacy status values (for compatibility)
      case 'completed':
      case 'complete':
        return { from: 'green.5', to: 'emerald.4', deg: 135 };
      case 'processing':
      case 'in_progress':
        return { from: 'orange.5', to: 'yellow.4', deg: 135 };
      case 'error':
      case 'declined':
        return { from: 'red.5', to: 'pink.4', deg: 135 };
      case 'canceled':
        return { from: 'gray.5', to: 'gray.4', deg: 135 };
      case 'refunded':
      case 'refund':
        return { from: 'violet.5', to: 'purple.4', deg: 135 };
      default:
        return { from: 'blue.5', to: 'cyan.4', deg: 135 };
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PURCHASE': return 'blue'
      case 'RECHARGE': return 'purple'
      case 'RECHARGE_BIZCOIN': return 'teal'
      case 'REFUND': return 'orange'
      case 'COMMISSION': return 'green'
      default: return 'gray'
    }
  }

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'CASH': return 'green'
      case 'BANK': return 'blue'
      case 'UPI': return 'orange'
      case 'RAZORPAY': return 'indigo'
      case 'GATEWAY': return 'purple'
      case 'WALLET': return 'teal'
      default: return 'gray'
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  // Calculate stats
  const totalTransactions = pagination.total
  const completedTransactions = transactions.filter(t => t.status.toUpperCase() === 'SUCCESS').length
  const totalRevenue = transactions
    .filter(t => t.status.toUpperCase() === 'SUCCESS')
    .reduce((sum, t) => sum + t.amount, 0)
  const pendingTransactions = transactions.filter(t => t.status.toUpperCase() === 'PENDING').length

  // Event handlers
  const exportToExcel = () => {
    console.log('Exporting to Excel...')
  }

  const handleAddTransaction = () => {
    setAddModalOpened(true)
  }

  const handleCreateTransaction = async () => {
    if (!addTransactionData.userId || !addTransactionData.type || !addTransactionData.method || !addTransactionData.amount) {
      setNotification({ message: 'Please fill in all required fields', type: 'error' })
      return
    }

    try {
      setAddLoading(true)
      const response = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addTransactionData),
      })

      const data = await response.json()

      if (response.ok) {
        setNotification({ message: 'Transaction created successfully', type: 'success' })
        setAddModalOpened(false)
        setAddTransactionData({
          userId: '',
          type: '',
          method: '',
          amount: 0,
          description: '',
          reference: ''
        })
        fetchTransactions()
      } else {
        setNotification({ message: data.error || 'Failed to create transaction', type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error occurred', type: 'error' })
    } finally {
      setAddLoading(false)
    }
  }

  const handleViewTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId)
    if (transaction) {
      setSelectedTransaction(transaction)
      setViewModalOpened(true)
    }
  }

  const handleEditTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId)
    if (transaction) {
      setSelectedTransaction(transaction)
      setEditTransactionData({
        userId: transaction.userId,
        type: transaction.type,
        method: transaction.method,
        amount: transaction.amount,
        description: transaction.description || '',
        reference: transaction.reference || '',
        status: transaction.status
      })
      setEditModalOpened(true)
    }
  }

  const handleDeleteTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId)
    if (transaction) {
      setSelectedTransaction(transaction)
      setDeleteModalOpened(true)
    }
  }

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return
    
    if (!editTransactionData.userId || !editTransactionData.type || !editTransactionData.method || !editTransactionData.amount) {
      setNotification({ message: 'Please fill in all required fields', type: 'error' })
      return
    }

    try {
      setEditLoading(true)
      const response = await fetch(`/api/admin/transactions?id=${selectedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editTransactionData),
      })

      const data = await response.json()

      if (response.ok) {
        setNotification({ message: 'Transaction updated successfully', type: 'success' })
        setEditModalOpened(false)
        setSelectedTransaction(null)
        setEditTransactionData({
          userId: '',
          type: '',
          method: '',
          amount: 0,
          description: '',
          reference: '',
          status: ''
        })
        fetchTransactions()
      } else {
        setNotification({ message: data.error || 'Failed to update transaction', type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error occurred', type: 'error' })
    } finally {
      setEditLoading(false)
    }
  }

  const confirmDeleteTransaction = async () => {
    if (!selectedTransaction) return

    try {
      setDeleteLoading(true)
      const response = await fetch(`/api/admin/transactions?id=${selectedTransaction.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotification({ message: 'Transaction deleted successfully', type: 'success' })
        setDeleteModalOpened(false)
        setSelectedTransaction(null)
        fetchTransactions()
      } else {
        const data = await response.json()
        setNotification({ message: data.error || 'Failed to delete transaction', type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error occurred', type: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <PagePermissionGuard requiredPermissions={['transactions.page.access']}>
      <AdminLayout>
        <ModernContainer fluid>
          <Stack gap="xl">
            {/* Enhanced Header */}
            <ModernCard>
              <Group justify="space-between" align="flex-start">
                <Group gap="sm">
                  <ThemeIcon size="xs" variant="light" color="green">
                    <IconCurrencyDollar size={24} />
                  </ThemeIcon>
                  <Box>
                    <Group gap="sm" align="center" mb={4}>
                      <Title order={3}>Transaction Management</Title>
                      {!loading && (
                        <Group gap={4}>
                          <IconChartBar size={10} color="blue" />
                          <Text size="xs" c="blue" fw={500}>
                            {filteredTransactions.length} displayed
                          </Text>
                        </Group>
                      )}
                    </Group>
                    <Text c="dimmed" size="xs">
                      Comprehensive financial transaction monitoring with advanced analytics and role-based filtering
                    </Text>
                  </Box>
                </Group>
                
                <Group gap="sm">
                  <Tooltip label="Refresh all data">
                    <ActionIcon 
                      size="xs" 
                      variant="light" 
                      color="blue"
                      onClick={refreshData}
                      loading={refreshing}
                    >
                      <IconRefresh size={10} />
                    </ActionIcon>
                  </Tooltip>
                  
                  <ModernButton 
                    variant="primary" 
                    leftSection={<IconPlus size={10} />}
                    onClick={handleAddTransaction}
                  >
                    Add Transaction
                  </ModernButton>
                  
                  <ModernButton 
                    variant="secondary"
                    leftSection={<IconFileExport size={10} />}
                    onClick={exportToExcel}
                  >
                    Export
                  </ModernButton>
                </Group>
              </Group>
            </ModernCard>

            {/* Enhanced Statistics Grid */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
              {[
                {
                  label: 'Total Transactions',
                  value: totalTransactions,
                  icon: IconDatabase,
                  color: 'blue',
                  progress: 100,
                  description: 'All transaction records'
                },
                {
                  label: 'Completed',
                  value: completedTransactions,
                  icon: IconCheck,
                  color: 'green',
                  progress: totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0,
                  description: 'Successfully processed'
                },
                {
                  label: 'Total Revenue',
                  value: `₹${totalRevenue.toFixed(2)}`,
                  icon: IconCurrencyDollar,
                  color: 'violet',
                  progress: 85,
                  description: 'Total earnings generated'
                },
                {
                  label: 'Pending',
                  value: pendingTransactions,
                  icon: IconClock,
                  color: 'orange',
                  progress: totalTransactions > 0 ? (pendingTransactions / totalTransactions) * 100 : 0,
                  description: 'Awaiting processing'
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
                  {loading ? (
                    <Stack gap="md">
                      <Skeleton height={20} />
                      <Skeleton height={40} />
                      <Skeleton height={16} />
                    </Stack>
                  ) : (
                    <>
                      {/* Decorative background element */}
                      <Box
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '80px',
                          height: '80px',
                          background: `linear-gradient(135deg, var(--mantine-color-${stat.color}-1) 0%, var(--mantine-color-${stat.color}-2) 100%)`,
                          borderRadius: '0 16px 0 50px',
                          opacity: 0.6,
                          zIndex: 0
                        }}
                      />
                      
                      <Stack gap="sm">
                        {/* Header */}
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
                              size="xs" 
                              fw={700} 
                              c={`${stat.color}.8`}
                              lh={1}
                              style={{ fontSize: '1.75rem' }}
                            >
                              {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
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
                      </Stack>
                    </>
                  )}
                </Card>
              ))}
            </SimpleGrid>

            {/* Quick Stats Summary */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.03) 100%)',
                border: '2px solid rgba(34, 197, 94, 0.15)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.08)',
                padding: '20px 24px'
              }}
            >
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  <ThemeIcon 
                    variant="gradient" 
                    gradient={{ from: 'green.6', to: 'emerald.5', deg: 135 }}
                    size="xs"
                    style={{
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    <IconChartBar size={10} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="green.7" fw={600}>Transaction Summary</Text>
                    <Text size="xs" c="dimmed" fw={400}>
                      Quick overview of current transaction data
                    </Text>
                  </Box>
                </Group>

                <Group gap="xl">
                  <Box
                    style={{
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
                      borderRadius: '12px',
                      border: '2px solid rgba(59, 130, 246, 0.2)',
                      textAlign: 'center'
                    }}
                  >
                    <Text size="xs" c="blue.6" fw={600} tt="uppercase" mb={3}>
                      Total Records
                    </Text>
                    <Text size="xs" fw={600} c="blue.7">
                      {loading ? <Skeleton height={20} width={40} /> : (totalTransactions || 0).toLocaleString()}
                    </Text>
                  </Box>

                  <Box
                    style={{
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.08) 100%)',
                      borderRadius: '12px',
                      border: '2px solid rgba(34, 197, 94, 0.2)',
                      textAlign: 'center'
                    }}
                  >
                    <Text size="xs" c="green.6" fw={600} tt="uppercase" mb={3}>
                      Total Revenue
                    </Text>
                    <Text size="xs" fw={600} c="green.7">
                      {loading ? <Skeleton height={20} width={80} /> : `₹${totalRevenue.toLocaleString()}`}
                    </Text>
                  </Box>

                  <Box
                    style={{
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(251, 146, 60, 0.08) 100%)',
                      borderRadius: '12px',
                      border: '2px solid rgba(249, 115, 22, 0.2)',
                      textAlign: 'center'
                    }}
                  >
                    <Text size="xs" c="orange.6" fw={600} tt="uppercase" mb={3}>
                      Pending
                    </Text>
                    <Text size="xs" fw={600} c="orange.7">
                      {loading ? <Skeleton height={20} width={30} /> : pendingTransactions.toLocaleString()}
                    </Text>
                  </Box>

                  <Box
                    style={{
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.08) 100%)',
                      borderRadius: '12px',
                      border: '2px solid rgba(139, 92, 246, 0.2)',
                      textAlign: 'center'
                    }}
                  >
                    <Text size="xs" c="violet.6" fw={600} tt="uppercase" mb={3}>
                      Success Rate
                    </Text>
                    <Text size="xs" fw={600} c="violet.7">
                      {loading ? <Skeleton height={20} width={40} /> : 
                        totalTransactions > 0 ? 
                          `${Math.round((completedTransactions / totalTransactions) * 100)}%` : 
                          '0%'
                      }
                    </Text>
                  </Box>
                </Group>
              </Group>
            </ModernCard>

            {/* Enhanced Filters */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.03) 100%)',
                border: '2px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.08)',
                overflow: 'hidden'
              }}
            >
              <Box
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
                  padding: '16px 20px',
                  margin: '-24px -24px 20px -24px',
                  borderBottom: '1px solid rgba(59, 130, 246, 0.2)'
                }}
              >
                <Group gap="sm">
                  <ThemeIcon 
                    variant="gradient" 
                    gradient={{ from: 'blue.6', to: 'indigo.5', deg: 135 }}
                    size="xs"
                    style={{
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <IconFilter size={20} />
                  </ThemeIcon>
                  <Box>
                    <Title order={4} c="blue.7" fw={700}>Filters & Search</Title>
                    <Text size="xs" c="dimmed" fw={500}>
                      Refine your transaction search with advanced filters
                    </Text>
                  </Box>
                </Group>
              </Box>
              
              <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                  <Group gap="md" style={{ flex: 1 }}>
                    <TextInput
                      placeholder="Search transactions, users, descriptions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      leftSection={<IconSearch size={16} />}
                      style={{ 
                        minWidth: '350px',
                        flex: 1
                      }}
                      styles={{
                        input: {
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                          border: '2px solid rgba(59, 130, 246, 0.2)',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: 500,
                          padding: '12px 16px 12px 40px',
                          transition: 'all 0.3s ease',
                          '&:focus': {
                            borderColor: 'var(--mantine-color-blue-5)',
                            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                          }
                        }
                      }}
                    />
                  </Group>
                </Group>
                
                <Group gap="md" wrap="wrap">
                  {[
                    {
                      placeholder: "All Status",
                      value: filterStatus,
                      onChange: setFilterStatus,
                      data: [
                        { value: '', label: 'All Status' },
                        { value: 'SUCCESS', label: '✅ Success' },
                        { value: 'PENDING', label: '⏳ Pending' },
                        { value: 'FAILED', label: '❌ Failed' },
                        { value: 'CANCELLED', label: '🚫 Cancelled' }
                      ],
                      color: 'green'
                    },
                    {
                      placeholder: "All Types",
                      value: filterType,
                      onChange: setFilterType,
                      data: [
                        { value: '', label: 'All Types' },
                        { value: 'PURCHASE', label: '🛒 Purchase' },
                        { value: 'RECHARGE', label: '🔋 Recharge' },
                        { value: 'REFUND', label: '💰 Refund' },
                        { value: 'COMMISSION', label: '💎 Commission' }
                      ],
                      color: 'violet'
                    },
                    {
                      placeholder: "All Creators",
                      value: filterCreatedBy,
                      onChange: setFilterCreatedBy,
                      data: [
                        { value: '', label: 'All Creators' },
                        ...creators.map(creator => ({
                          value: creator.id.toString(),
                          label: `👤 ${creator.name}`
                        }))
                      ],
                      color: 'orange'
                    },
                    {
                      placeholder: "All Time",
                      value: dateRange,
                      onChange: setDateRange,
                      data: [
                        { value: '', label: 'All Time' },
                        { value: 'today', label: '📅 Today' },
                        { value: 'week', label: '📊 This Week' },
                        { value: 'month', label: '🗓️ This Month' },
                        { value: 'quarter', label: '📈 This Quarter' }
                      ],
                      color: 'cyan',
                      leftSection: <IconCalendar size={16} />
                    }
                  ].map((filter, index) => (
                    <Select
                      key={index}
                      placeholder={filter.placeholder}
                      value={filter.value}
                      onChange={(value) => filter.onChange(value || '')}
                      data={filter.data}
                      leftSection={filter.leftSection}
                      style={{ minWidth: '180px' }}
                      styles={{
                        input: {
                          background: `linear-gradient(135deg, rgba(var(--mantine-color-${filter.color}-1-rgb), 0.3) 0%, rgba(var(--mantine-color-${filter.color}-0-rgb), 0.5) 100%)`,
                          border: `2px solid rgba(var(--mantine-color-${filter.color}-4-rgb), 0.3)`,
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                          '&:focus': {
                            borderColor: `var(--mantine-color-${filter.color}-5)`,
                            boxShadow: `0 0 0 3px rgba(var(--mantine-color-${filter.color}-4-rgb), 0.2)`
                          }
                        },
                        dropdown: {
                          border: `1px solid rgba(var(--mantine-color-${filter.color}-4-rgb), 0.3)`,
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                        }
                      }}
                    />
                  ))}
                </Group>
              </Stack>
            </ModernCard>

            {/* Enhanced Transactions Table */}
            <ModernCard
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                border: '1px solid rgba(226, 232, 240, 0.6)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.02)',
                overflow: 'hidden'
              }}
            >
              <Box
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)',
                  padding: '20px 24px',
                  borderBottom: '1px solid rgba(226, 232, 240, 0.4)',
                  marginBottom: '24px'
                }}
              >
                <Group gap="sm">
                  <ThemeIcon 
                    variant="gradient" 
                    gradient={{ from: 'green.6', to: 'emerald.5', deg: 135 }}
                    size="xs"
                    style={{
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    <IconDatabase size={20} />
                  </ThemeIcon>
                  <Box>
                    <Title order={4} c="green.7" fw={700}>Transaction Records</Title>
                    <Text size="xs" c="dimmed" fw={500}>
                      ({filteredTransactions.length} records displayed)
                    </Text>
                  </Box>
                </Group>
              </Box>

              {loading ? (
                <Center p="xl">
                  <Stack align="center" gap="md">
                    <ModernLoader variant="primary" size="xs" />
                    <Text>Loading transactions...</Text>
                  </Stack>
                </Center>
              ) : error ? (
                <ModernAlert variant="danger" title="Error loading transactions">
                  <Stack gap="sm">
                    <Text>{error}</Text>
                    <ModernButton size="xs" variant="secondary" onClick={fetchTransactions}>
                      Retry
                    </ModernButton>
                  </Stack>
                </ModernAlert>
              ) : filteredTransactions.length === 0 ? (
                <Center p="xl">
                  <Stack align="center" gap="md">
                    <Text size="xs" c="dimmed">No transactions found</Text>
                    <Text size="xs" c="dimmed">Try adjusting your search criteria or create some transactions</Text>
                  </Stack>
                </Center>
              ) : (
                <ResponsiveTableContainer>
                  <Table 
                    striped 
                    highlightOnHover
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      borderSpacing: '0 2px',
                      borderCollapse: 'separate'
                    }}
                  >
                    <Table.Thead
                      style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
                        borderBottom: '2px solid rgba(59, 130, 246, 0.1)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                      }}
                    >
                      <Table.Tr>
                        <Table.Th style={{ 
                          fontWeight: 700, 
                          color: 'var(--mantine-color-blue-7)', 
                          padding: '12px 10px',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          minWidth: '140px'
                        }}>Transaction</Table.Th>
                        <Table.Th style={{ 
                          fontWeight: 700, 
                          color: 'var(--mantine-color-blue-7)', 
                          padding: '12px 10px',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          minWidth: '180px'
                        }}>User</Table.Th>
                        <Table.Th style={{ 
                          fontWeight: 700, 
                          color: 'var(--mantine-color-blue-7)', 
                          padding: '12px 10px',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          minWidth: '120px',
                          textAlign: 'center'
                        }}>Amount</Table.Th>
                        <Table.Th style={{ 
                          fontWeight: 700, 
                          color: 'var(--mantine-color-blue-7)', 
                          padding: '12px 10px',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          minWidth: '100px',
                          textAlign: 'center'
                        }}>Type</Table.Th>
                        <Table.Th style={{ 
                          fontWeight: 700, 
                          color: 'var(--mantine-color-blue-7)', 
                          padding: '12px 10px',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          minWidth: '100px',
                          textAlign: 'center'
                        }}>Status</Table.Th>
                        <Table.Th style={{ 
                          fontWeight: 700, 
                          color: 'var(--mantine-color-blue-7)', 
                          padding: '12px 10px',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          minWidth: '120px',
                          textAlign: 'center'
                        }}>Method</Table.Th>
                        <Table.Th style={{ 
                          fontWeight: 700, 
                          color: 'var(--mantine-color-blue-7)', 
                          padding: '12px 10px',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          minWidth: '160px'
                        }}>Created By</Table.Th>
                        <Table.Th style={{ 
                          fontWeight: 700, 
                          color: 'var(--mantine-color-blue-7)', 
                          padding: '12px 10px',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          minWidth: '140px'
                        }}>Date</Table.Th>
                        <Table.Th style={{ 
                          fontWeight: 700, 
                          color: 'var(--mantine-color-blue-7)', 
                          padding: '12px 10px',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          minWidth: '120px',
                          textAlign: 'center'
                        }}>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredTransactions.map((transaction, index) => (
                        <Table.Tr 
                          key={transaction.id}
                          style={{
                            borderBottom: '1px solid rgba(226, 232, 240, 0.4)',
                            background: index % 2 === 0 ? 'rgba(248, 250, 252, 0.3)' : 'white',
                            transition: 'all 0.2s ease',
                            height: '60px'
                          }}
                          onMouseEnter={(e: any) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.04)'
                            e.currentTarget.style.transform = 'scale(1.002)'
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseLeave={(e: any) => {
                            e.currentTarget.style.background = index % 2 === 0 ? 'rgba(248, 250, 252, 0.3)' : 'white'
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.boxShadow = 'none'
                          }}
                        >
                          <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                            <Box
                              style={{
                                padding: '6px 10px',
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.06) 100%)',
                                borderRadius: '8px',
                                border: '1px solid rgba(59, 130, 246, 0.2)'
                              }}
                            >
                              <Text ff="monospace" size="xs" fw="700" c="blue.7">
                                {transaction.id.slice(0, 8)}...
                              </Text>
                              {transaction.reference && (
                                <Text size="xs" c="dimmed" fw={500} mt={1}>
                                  Ref: {transaction.reference}
                                </Text>
                              )}
                            </Box>
                          </Table.Td>
                          <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                            <Group gap="xs">
                              <ThemeIcon 
                                size="xs" 
                                variant="gradient" 
                                gradient={{ from: 'blue.5', to: 'cyan.4', deg: 135 }}
                                style={{
                                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                                }}
                              >
                                <IconUsers size={14} />
                              </ThemeIcon>
                              <Box>
                                <Text fw="600" size="xs" c="gray.8">{transaction.user.name}</Text>
                                <Text size="xs" c="dimmed" fw={500} mt={1}>{transaction.user.email}</Text>
                              </Box>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <Box
                              style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.08) 100%)',
                                borderRadius: '10px',
                                border: '2px solid rgba(34, 197, 94, 0.2)',
                                display: 'inline-block'
                              }}
                            >
                              <Text fw="700" size="xs" c="green.7">
                                ₹{transaction.amount.toFixed(2)}
                              </Text>
                            </Box>
                          </Table.Td>
                          <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <Badge
                              variant="gradient"
                              gradient={{ from: getTypeColor(transaction.type), to: `${getTypeColor(transaction.type)}.6`, deg: 135 }}
                              size="xs"
                              style={{
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                boxShadow: `0 2px 8px rgba(var(--mantine-color-${getTypeColor(transaction.type)}-6-rgb), 0.3)`
                              }}
                            >
                              {transaction.type}
                            </Badge>
                          </Table.Td>
                          <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <Badge
                              color={getStatusColor(transaction.status)}
                              variant="filled"
                              size="xs"
                              style={{
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                padding: '4px 8px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                              }}
                            >
                              {transaction.status || 'UNKNOWN'}
                            </Badge>
                          </Table.Td>
                          <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <Group gap="xs" justify="center">
                              <span style={{ fontSize: '14px' }}>
                                {transaction.method === 'BIZCOINS' ? '🪙' : 
                                 transaction.method === 'CREDIT' ? '💳' : 
                                 transaction.method === 'RAZORPAY' ? '💰' : 
                                 transaction.method === 'UPI' ? '📱' : 
                                 transaction.method === 'BANK' ? '🏦' : 
                                 transaction.method === 'CASH' ? '💵' : '💰'}
                              </span>
                              <Badge
                                color={getMethodColor(transaction.method)}
                                variant="light"
                                size="xs"
                                style={{
                                  fontWeight: 600,
                                  padding: '3px 6px',
                                  border: `1px solid var(--mantine-color-${getMethodColor(transaction.method)}-3)`
                                }}
                              >
                                {transaction.method}
                              </Badge>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                            <Box>
                              <Text fw="600" size="xs" c="gray.8">{transaction.creator.name}</Text>
                              <Text size="xs" c="dimmed" fw={500} mt={1}>{transaction.creator.email}</Text>
                            </Box>
                          </Table.Td>
                          <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                            <Group gap="xs">
                              <IconClock size={14} color="var(--mantine-color-blue-6)" />
                              <Box>
                                <Text size="xs" fw={600} c="gray.8">
                                  {new Date(transaction.createdAt).toLocaleDateString()}
                                </Text>
                                <Text size="xs" c="dimmed" fw={500} mt={1}>
                                  {new Date(transaction.createdAt).toLocaleTimeString()}
                                </Text>
                              </Box>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ padding: '12px 10px', verticalAlign: 'middle', textAlign: 'center' }}>
                            <Group gap="xs" justify="center">
                              <Tooltip label="View details" position="top">
                                <ActionIcon
                                  size="xs"
                                  variant="gradient"
                                  gradient={{ from: 'blue.5', to: 'cyan.4', deg: 135 }}
                                  onClick={() => handleViewTransaction(transaction.id)}
                                  style={{
                                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '6px'
                                  }}
                                  onMouseEnter={(e: any) => {
                                    e.currentTarget.style.transform = 'scale(1.1)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
                                  }}
                                  onMouseLeave={(e: any) => {
                                    e.currentTarget.style.transform = 'scale(1)'
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)'
                                  }}
                                >
                                  <IconEye size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Edit transaction" position="top">
                                <ActionIcon
                                  size="xs"
                                  variant="gradient"
                                  gradient={{ from: 'orange.5', to: 'yellow.4', deg: 135 }}
                                  onClick={() => handleEditTransaction(transaction.id)}
                                  style={{
                                    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '6px'
                                  }}
                                  onMouseEnter={(e: any) => {
                                    e.currentTarget.style.transform = 'scale(1.1)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.4)'
                                  }}
                                  onMouseLeave={(e: any) => {
                                    e.currentTarget.style.transform = 'scale(1)'
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(249, 115, 22, 0.3)'
                                  }}
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Delete transaction" position="top">
                                <ActionIcon
                                  size="xs"
                                  variant="gradient"
                                  gradient={{ from: 'red.5', to: 'pink.4', deg: 135 }}
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                  style={{
                                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '6px'
                                  }}
                                  onMouseEnter={(e: any) => {
                                    e.currentTarget.style.transform = 'scale(1.1)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)'
                                  }}
                                  onMouseLeave={(e: any) => {
                                    e.currentTarget.style.transform = 'scale(1)'
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)'
                                  }}
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ResponsiveTableContainer>
              )}
            </ModernCard>

            {/* Add Transaction Modal */}
            <ModernModal
              opened={addModalOpened}
              onClose={() => setAddModalOpened(false)}
              title="Add New Transaction"
              size="70%"
            >
              <Stack gap="md">
                <Select
                  label="User"
                  placeholder="Select a user"
                  required
                  value={addTransactionData.userId}
                  onChange={(value) => setAddTransactionData(prev => ({ ...prev, userId: value || '' }))}
                  data={allUsers.map(user => ({
                    value: user.id.toString(),
                    label: `${user.name} (${user.email})`
                  }))}
                />

                <Group grow>
                  <Select
                    label="Transaction Type"
                    placeholder="Select type"
                    required
                    value={addTransactionData.type}
                    onChange={(value) => setAddTransactionData(prev => ({ ...prev, type: value || '' }))}
                    data={[
                      { value: 'PURCHASE', label: 'Purchase' },
                      { value: 'RECHARGE', label: 'Recharge' },
                      { value: 'RECHARGE_BIZCOIN', label: 'Recharge BizCoin' },
                      { value: 'REFUND', label: 'Refund' },
                      { value: 'COMMISSION', label: 'Commission' }
                    ]}
                  />

                  <Select
                    label="Payment Method"
                    placeholder="Select method"
                    required
                    value={addTransactionData.method}
                    onChange={(value) => setAddTransactionData(prev => ({ ...prev, method: value || '' }))}
                    data={[
                      { value: 'CASH', label: 'Cash' },
                      { value: 'BANK', label: 'Bank Transfer' },
                      { value: 'UPI', label: 'UPI' },
                      { value: 'RAZORPAY', label: 'Razorpay' },
                      { value: 'GATEWAY', label: 'Payment Gateway' },
                      { value: 'WALLET', label: 'Wallet' }
                    ]}
                  />
                </Group>

                <NumberInput
                  label="Amount"
                  placeholder="Enter amount"
                  required
                  min={0}
                  step={0.01}
                  decimalScale={2}
                  fixedDecimalScale
                  value={addTransactionData.amount}
                  onChange={(value) => setAddTransactionData(prev => ({ ...prev, amount: Number(value) || 0 }))}
                  leftSection={<IconCurrencyDollar size={16} />}
                />

                <TextInput
                  label="Reference (Optional)"
                  placeholder="Transaction reference"
                  value={addTransactionData.reference}
                  onChange={(e) => setAddTransactionData(prev => ({ ...prev, reference: e.target.value }))}
                />

                <Textarea
                  label="Description (Optional)"
                  placeholder="Transaction description"
                  rows={3}
                  value={addTransactionData.description}
                  onChange={(e) => setAddTransactionData(prev => ({ ...prev, description: e.target.value }))}
                />

                <Group justify="flex-end" gap="md">
                  <ModernButton variant="ghost" onClick={() => setAddModalOpened(false)}>
                    Cancel
                  </ModernButton>
                  <ModernButton 
                    variant="primary"
                    onClick={handleCreateTransaction} 
                    loading={addLoading}
                  >
                    Create Transaction
                  </ModernButton>
                </Group>
              </Stack>
            </ModernModal>

            {/* View Transaction Modal */}
            <ModernModal
              opened={viewModalOpened}
              onClose={() => setViewModalOpened(false)}
              title="Transaction Details"
              size="xs"
            >
              {selectedTransaction && (
                <Stack gap="lg">
                  <Group grow>
                    <Box>
                      <Text size="xs" c="dimmed">Transaction ID</Text>
                      <Text fw="bold" ff="monospace">{selectedTransaction.id}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">Reference</Text>
                      <Text fw="bold">{selectedTransaction.reference || 'N/A'}</Text>
                    </Box>
                  </Group>

                  <Group grow>
                    <Box>
                      <Text size="xs" c="dimmed">User</Text>
                      <Text fw="bold">{selectedTransaction.user.name}</Text>
                      <Text size="xs" c="dimmed">{selectedTransaction.user.email}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">Created By</Text>
                      <Text fw="bold">{selectedTransaction.creator.name}</Text>
                      <Text size="xs" c="dimmed">{selectedTransaction.creator.email}</Text>
                    </Box>
                  </Group>

                  <Group grow>
                    <Box>
                      <Text size="xs" c="dimmed">Amount</Text>
                      <Text fw="bold" size="xs" c="green.6">
                        ₹{selectedTransaction.amount.toFixed(2)}
                      </Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">Status & Type</Text>
                      <Group gap="sm">
                        <ModernBadge variant={getStatusColor(selectedTransaction.status) as any}>
                          {selectedTransaction.status}
                        </ModernBadge>
                        <ModernBadge variant={getTypeColor(selectedTransaction.type) as any}>
                          {selectedTransaction.type}
                        </ModernBadge>
                      </Group>
                    </Box>
                  </Group>

                  <Box>
                    <Text size="xs" c="dimmed">Description</Text>
                    <Text>{selectedTransaction.description || 'No description provided'}</Text>
                  </Box>

                  <Group grow>
                    <Box>
                      <Text size="xs" c="dimmed">Created At</Text>
                      <Text>{new Date(selectedTransaction.createdAt).toLocaleString()}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">Updated At</Text>
                      <Text>{new Date(selectedTransaction.updatedAt).toLocaleString()}</Text>
                    </Box>
                  </Group>
                </Stack>
              )}
            </ModernModal>

            {/* Edit Transaction Modal */}
            <ModernModal
              opened={editModalOpened}
              onClose={() => setEditModalOpened(false)}
              title="Edit Transaction"
              size="70%"
            >
              {selectedTransaction && (
                <Stack gap="md">
                  <Select
                    label="User"
                    placeholder="Select a user"
                    required
                    value={editTransactionData.userId}
                    onChange={(value) => setEditTransactionData(prev => ({ ...prev, userId: value || '' }))}
                    data={allUsers.map(user => ({
                      value: user.id.toString(),
                      label: `${user.name} (${user.email})`
                    }))}
                  />

                  <Group grow>
                    <Select
                      label="Transaction Type"
                      placeholder="Select type"
                      required
                      value={editTransactionData.type}
                      onChange={(value) => setEditTransactionData(prev => ({ ...prev, type: value || '' }))}
                      data={[
                        { value: 'PURCHASE', label: 'Purchase' },
                        { value: 'RECHARGE', label: 'Recharge' },
                        { value: 'RECHARGE_BIZCOIN', label: 'Recharge BizCoin' },
                        { value: 'REFUND', label: 'Refund' },
                        { value: 'COMMISSION', label: 'Commission' }
                      ]}
                    />

                    <Select
                      label="Payment Method"
                      placeholder="Select method"
                      required
                      value={editTransactionData.method}
                      onChange={(value) => setEditTransactionData(prev => ({ ...prev, method: value || '' }))}
                      data={[
                        { value: 'CASH', label: 'Cash' },
                        { value: 'BANK', label: 'Bank Transfer' },
                        { value: 'UPI', label: 'UPI' },
                        { value: 'RAZORPAY', label: 'Razorpay' },
                        { value: 'GATEWAY', label: 'Payment Gateway' },
                        { value: 'WALLET', label: 'Wallet' }
                      ]}
                    />
                  </Group>

                  <Group grow>
                    <NumberInput
                      label="Amount"
                      placeholder="Enter amount"
                      required
                      min={0}
                      step={0.01}
                      decimalScale={2}
                      fixedDecimalScale
                      value={editTransactionData.amount}
                      onChange={(value) => setEditTransactionData(prev => ({ ...prev, amount: Number(value) || 0 }))}
                      leftSection={<IconCurrencyDollar size={16} />}
                    />

                    <Select
                      label="Status"
                      placeholder="Select status"
                      required
                      value={editTransactionData.status}
                      onChange={(value) => setEditTransactionData(prev => ({ ...prev, status: value || '' }))}
                      data={[
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'SUCCESS', label: 'Success' },
                        { value: 'FAILED', label: 'Failed' },
                        { value: 'CANCELLED', label: 'Cancelled' }
                      ]}
                    />
                  </Group>

                  <TextInput
                    label="Reference (Optional)"
                    placeholder="Transaction reference"
                    value={editTransactionData.reference}
                    onChange={(e) => setEditTransactionData(prev => ({ ...prev, reference: e.target.value }))}
                  />

                  <Textarea
                    label="Description (Optional)"
                    placeholder="Transaction description"
                    rows={3}
                    value={editTransactionData.description}
                    onChange={(e) => setEditTransactionData(prev => ({ ...prev, description: e.target.value }))}
                  />

                  <Group justify="flex-end" gap="md">
                    <ModernButton variant="ghost" onClick={() => setEditModalOpened(false)}>
                      Cancel
                    </ModernButton>
                    <ModernButton 
                      variant="primary"
                      onClick={handleUpdateTransaction} 
                      loading={editLoading}
                    >
                      Update Transaction
                    </ModernButton>
                  </Group>
                </Stack>
              )}
            </ModernModal>

            {/* Delete Transaction Modal */}
            <ModernModal
              opened={deleteModalOpened}
              onClose={() => setDeleteModalOpened(false)}
              title="Delete Transaction"
              size="xs"
            >
              {selectedTransaction && (
                <Stack gap="lg">
                  <Alert
                    variant="light"
                    color="red"
                    title="Confirm Deletion"
                    icon={<IconAlertTriangle size={16} />}
                  >
                    Are you sure you want to delete this transaction? This action cannot be undone.
                  </Alert>

                  <Box
                    style={{
                      background: 'rgba(248, 250, 252, 0.8)',
                      border: '1px solid rgba(226, 232, 240, 0.6)',
                      borderRadius: '12px',
                      padding: '16px'
                    }}
                  >
                    <Group grow>
                      <Box>
                        <Text size="xs" c="dimmed">Transaction ID</Text>
                        <Text fw="bold" ff="monospace">{selectedTransaction.id}</Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed">Amount</Text>
                        <Text fw="bold" c="red.6">₹{selectedTransaction.amount.toFixed(2)}</Text>
                      </Box>
                    </Group>
                    
                    <Group grow mt="sm">
                      <Box>
                        <Text size="xs" c="dimmed">User</Text>
                        <Text fw="bold">{selectedTransaction.user.name}</Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed">Status</Text>
                        <Badge color={getStatusColor(selectedTransaction.status)} variant="filled" size="xs">
                          {selectedTransaction.status}
                        </Badge>
                      </Box>
                    </Group>
                  </Box>

                  <Group justify="flex-end" gap="md">
                    <ModernButton variant="ghost" onClick={() => setDeleteModalOpened(false)}>
                      Cancel
                    </ModernButton>
                    <ModernButton 
                      variant="danger"
                      onClick={confirmDeleteTransaction} 
                      loading={deleteLoading}
                    >
                      Delete Transaction
                    </ModernButton>
                  </Group>
                </Stack>
              )}
            </ModernModal>
            
            {/* Notification */}
            {notification && (
              <Notification
                color={notification.type === 'success' ? 'green' : 'red'}
                onClose={() => setNotification(null)}
                style={{
                  position: 'fixed',
                  top: '20px',
                  right: '20px',
                  zIndex: 1000
                }}
              >
                {notification.message}
              </Notification>
            )}
          </Stack>
        </ModernContainer>
      </AdminLayout>
    </PagePermissionGuard>
  )
}