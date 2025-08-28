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
  Modal,
  Code,
  Select,
  Progress,
  NumberInput,
  Textarea,
  Loader,
  Alert,
  ThemeIcon,
  Tooltip,
  RingProgress,
  Center
} from '@mantine/core'
import { FiPlus, FiCopy, FiEye, FiTrash2, FiGift, FiClock, FiUsers, FiEdit3, FiInfo, FiCheck } from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import { IconRefresh } from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import AdminLayout from '@/components/layout/AdminLayout'
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
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

interface Voucher {
  id: number
  code: string
  description?: string
  type: string
  value: number
  usage_limit?: number
  usage_count: number
  is_active: boolean
  expires_at?: string
  created_by: string
  created_at: string
  status: string
}

interface VoucherStats {
  totalVouchers: number
  activeVouchers: number
  totalUsage: number
  creditValueUsed: number
}

interface Package {
  id: number
  name: string
  description: string
  price: number
  duration: number
  messageLimit: number
  isActive: boolean
}

export default function VouchersPage() {
  const { data: session } = useSession()
  const { hasPermission } = useDynamicPermissions()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [stats, setStats] = useState<VoucherStats>({
    totalVouchers: 0,
    activeVouchers: 0,
    totalUsage: 0,
    creditValueUsed: 0
  })
  const [loading, setLoading] = useState(false)
  const [packagesLoading, setPackagesLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [isCreateModalOpen, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false)
  const [isViewModalOpen, { open: openViewModal, close: closeViewModal }] = useDisclosure(false)

  const form = useForm({
    initialValues: {
      code: '',
      description: '',
      type: '',
      value: 0,
      packageId: '',
      usage_limit: '',
      expires_at: '',
    },
    validate: {
      code: (value) => (!value ? 'Voucher code is required' : null),
      type: (value) => (!value ? 'Voucher type is required' : null),
      value: (value, values) => {
        if (values.type === 'package') return null // Skip validation for package type
        return value <= 0 ? 'Value must be greater than 0' : null
      },
      packageId: (value, values) => {
        if (values.type === 'package' && !value) return 'Package selection is required'
        return null
      },
    },
  })

  // Load vouchers from database
  useEffect(() => {
    if (session?.user) {
      loadVouchers()
      loadPackages()
    }
  }, [session, searchTerm, filterStatus, filterType])

  // Load packages when create modal opens
  useEffect(() => {
    if (isCreateModalOpen && packages.length === 0) {
      loadPackages()
    }
  }, [isCreateModalOpen])

  const loadVouchers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterStatus) params.append('status', filterStatus)
      if (filterType) params.append('type', filterType)

      const apiUrl = `/api/vouchers?${params.toString()}`
      const response = await fetch(apiUrl)
      const data = await response.json()

      if (response.ok) {
        setVouchers(data.vouchers || [])
        setStats(data.stats || {
          totalVouchers: 0,
          activeVouchers: 0,
          totalUsage: 0,
          creditValueUsed: 0
        })
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to load vouchers',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to connect to API',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPackages = async () => {
    try {
      setPackagesLoading(true)
      const response = await fetch('/api/packages?is_active=true')
      const data = await response.json()

      if (response.ok) {
        setPackages(data.packages || [])
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to load packages',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load packages',
        color: 'red'
      })
    } finally {
      setPackagesLoading(false)
    }
  }

  const handleCreateVoucher = async (values: typeof form.values) => {
    try {
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          packageId: values.packageId || null,
          usage_limit: values.usage_limit ? parseInt(values.usage_limit) : null,
          expires_at: values.expires_at || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: data.message,
          color: 'green'
        })
        form.reset()
        closeCreateModal()
        loadVouchers()
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to create voucher',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create voucher',
        color: 'red'
      })
    }
  }

  const handleDeleteVoucher = async (id: number) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return

    try {
      const response = await fetch(`/api/vouchers?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: data.message,
          color: 'green'
        })
        loadVouchers()
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to delete voucher',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete voucher',
        color: 'red'
      })
    }
  }

  const handleViewVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher)
    openViewModal()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'green'
      case 'Expired': return 'red'
      case 'Paused': return 'orange'
      default: return 'gray'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'messages': return 'blue'
      case 'credit': return 'purple'
      case 'percentage': return 'orange'
      case 'package': return 'green'
      default: return 'gray'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'messages': return 'Messages'
      case 'credit': return 'Credit'
      case 'percentage': return 'Percentage'
      case 'package': return 'Package'
      default: return type
    }
  }

  const formatValue = (type: string, value: number) => {
    switch (type) {
      case 'credit': return `₹${value}`
      case 'messages': return `${value} msg`
      case 'percentage': return `${value}%`
      case 'package': return `Package`
      default: return value
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    notifications.show({
      title: 'Copied',
      message: `Voucher code "${code}" copied to clipboard`,
      color: 'blue'
    })
  }

  return (
    <PagePermissionGuard requiredPermissions={['vouchers.read']}>
      <AdminLayout>
        <ModernContainer fluid>
          <ResponsiveStack gap="xl">
            {/* Enhanced Header */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(245, 158, 11, 0.03) 100%)',
                border: '2px solid rgba(251, 146, 60, 0.15)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(251, 146, 60, 0.08)',
                padding: '32px'
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Group gap="lg">
                  <ThemeIcon 
                    size="2xl" 
                    variant="gradient" 
                    gradient={{ from: 'orange.6', to: 'amber.5', deg: 135 }}
                    style={{
                      boxShadow: '0 8px 24px rgba(251, 146, 60, 0.3)'
                    }}
                  >
                    <FiGift size={28} />
                  </ThemeIcon>
                  <Box>
                    <Title 
                      order={2} 
                      mb={8}
                      c="orange.7"
                    >
                      Voucher Management
                    </Title>
                    <Text c="dimmed" size="xs" fw={500} mb="lg">
                      Create and manage vouchers for WhatsApp account recharge and promotions
                    </Text>
                    
                    {/* Quick Stats Bar */}
                    <Group gap="xl">
                      <Group gap="xs">
                        <FiGift size={10} color="var(--mantine-color-orange-6)" />
                        <Text size="xs" c="dimmed">Total:</Text>
                        <Text size="xs" fw={700} c="orange.7">
                          {stats.totalVouchers}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <FiClock size={10} color="var(--mantine-color-green-6)" />
                        <Text size="xs" c="dimmed">Active:</Text>
                        <Text size="xs" fw={700} c="green.7">
                          {stats.activeVouchers}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <FiUsers size={10} color="var(--mantine-color-amber-6)" />
                        <Text size="xs" c="dimmed">Used:</Text>
                        <Text size="xs" fw={700} c="amber.7">
                          {stats.totalUsage}
                        </Text>
                      </Group>
                    </Group>
                  </Box>
                </Group>
                
                <Group gap="sm">
                  <Tooltip label="Refresh vouchers">
                    <ActionIcon 
                      size="lg" 
                      variant="light" 
                      color="orange"
                      onClick={loadVouchers}
                      loading={loading}
                    >
                      <IconRefresh size={10} />
                    </ActionIcon>
                  </Tooltip>
                  
                  {hasPermission('vouchers.create') && (
                    <ModernButton
                      leftSection={<FiPlus size={10} />}
                      onClick={openCreateModal}
                      color="orange"
                      variant="filled"
                    >
                      Create Voucher
                    </ModernButton>
                  )}
                </Group>
              </Group>
            </ModernCard>


            {/* Enhanced Statistics */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
              {[
                {
                  label: 'Total Vouchers',
                  value: stats.totalVouchers,
                  icon: FiGift,
                  color: 'orange',
                  description: 'All vouchers created',
                  progress: Math.min((stats.totalVouchers / 100) * 100, 100)
                },
                {
                  label: 'Active Vouchers',
                  value: stats.activeVouchers,
                  icon: FiClock,
                  color: 'green',
                  description: 'Currently available',
                  progress: stats.totalVouchers > 0 ? (stats.activeVouchers / stats.totalVouchers) * 100 : 0
                },
                {
                  label: 'Total Redemptions',
                  value: stats.totalUsage,
                  icon: FiCheck,
                  color: 'amber',
                  description: 'Vouchers redeemed',
                  progress: Math.min((stats.totalUsage / 1000) * 100, 100)
                },
                {
                  label: 'Credit Value Used',
                  value: `₹${stats.creditValueUsed.toFixed(2)}`,
                  icon: FaRupeeSign,
                  color: 'orange',
                  description: 'Total value redeemed',
                  progress: Math.min((stats.creditValueUsed / 10000) * 100, 100)
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
                          size="md" 
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

            {/* Enhanced Filters and Actions */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,251,235,0.95) 100%)',
                border: '2px solid rgba(251, 146, 60, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(251, 146, 60, 0.06)',
                padding: '24px'
              }}
            >
              <Group justify="space-between" wrap="wrap" gap="md">
                <Group gap="md" style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Search vouchers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: '300px' }}
                  />
                  <Select
                    placeholder="All Status"
                    value={filterStatus}
                    onChange={(value) => setFilterStatus(value || '')}
                    data={[
                      { value: '', label: 'All Status' },
                      { value: 'Active', label: 'Active' },
                      { value: 'Expired', label: 'Expired' },
                      { value: 'Paused', label: 'Paused' }
                    ]}
                    style={{ minWidth: '120px' }}
                  />
                  <Select
                    placeholder="All Types"
                    value={filterType}
                    onChange={(value) => setFilterType(value || '')}
                    data={[
                      { value: '', label: 'All Types' },
                      { value: 'credit', label: 'Credit' },
                      { value: 'messages', label: 'Messages' },
                      { value: 'percentage', label: 'Percentage' },
                      { value: 'package', label: 'Package' }
                    ]}
                    style={{ minWidth: '120px' }}
                  />
                </Group>
              </Group>
            </ModernCard>

            {/* Enhanced Vouchers Table */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,251,235,0.95) 100%)',
                border: '2px solid rgba(251, 146, 60, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(251, 146, 60, 0.06)',
                overflow: 'hidden'
              }}
            >
              {loading ? (
                <Center>
                  <ModernCard
                    style={{
                      background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(245, 158, 11, 0.03) 100%)',
                      border: '2px solid rgba(251, 146, 60, 0.15)',
                      borderRadius: '16px',
                      padding: '32px',
                      textAlign: 'center'
                    }}
                  >
                    <Stack align="center" gap="lg">
                      <ThemeIcon 
                        size="4xl" 
                        variant="gradient" 
                        gradient={{ from: 'orange.5', to: 'amber.4', deg: 135 }}
                        style={{
                          animation: 'pulse 2s infinite'
                        }}
                      >
                        <FiGift size={48} />
                      </ThemeIcon>
                      <Box>
                        <Text size="xs" fw={600} c="orange.7" mb={3}>
                          Loading Vouchers
                        </Text>
                        <Text size="xs" c="dimmed" fw={400}>
                          Fetching promotional codes and discount data
                        </Text>
                      </Box>
                      <Loader variant="dots" size="xs" color="orange" />
                    </Stack>
                  </ModernCard>
                </Center>
              ) : (
            <Table.ScrollContainer minWidth={1000}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Voucher Code</Table.Th>
                    <Table.Th>Value</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Usage</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Expiry</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {vouchers.map((voucher) => (
                    <Table.Tr key={voucher.id}>
                      <Table.Td>
                        <Stack gap="xs">
                          <Group gap="xs">
                            <Code fw="bold">
                              {voucher.code}
                            </Code>
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              onClick={() => copyToClipboard(voucher.code)}
                              aria-label="Copy code"
                            >
                              <FiCopy size={10} />
                            </ActionIcon>
                          </Group>
                          {voucher.description && (
                            <Text size="xs" c="dimmed" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {voucher.description}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text fw="500" size="xs">
                          {formatValue(voucher.type, voucher.value)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getTypeColor(voucher.type)} variant="light" size="xs">
                          {getTypeLabel(voucher.type)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap="xs">
                          <Text size="xs">
                            {voucher.usage_count} / {voucher.usage_limit || '∞'}
                          </Text>
                          {voucher.usage_limit && (
                            <Progress
                              value={Math.min((voucher.usage_count / voucher.usage_limit) * 100, 100)}
                              color={voucher.usage_count / voucher.usage_limit > 0.8 ? "red" : "green"}
                              size="xs"
                              radius="md"
                              style={{ width: '60px' }}
                            />
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(voucher.status)} variant="light" size="xs">
                          {voucher.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {voucher.expires_at ? new Date(voucher.expires_at).toLocaleDateString() : 'No expiry'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            onClick={() => handleViewVoucher(voucher)}
                            aria-label="View voucher"
                          >
                            <FiEye size={10} />
                          </ActionIcon>
                          {hasPermission('vouchers.delete') && (
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color="red"
                              onClick={() => handleDeleteVoucher(voucher.id)}
                              aria-label="Delete voucher"
                            >
                              <FiTrash2 size={10} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              </Table.ScrollContainer>
              )}

              {vouchers.length === 0 && !loading && (
                <ModernAlert variant="info" title="No vouchers found">
                  <Group gap="sm">
                    <FiInfo size={10} />
                    <Text size="xs">
                      {searchTerm || filterStatus || filterType
                        ? 'No vouchers match your current filters.'
                        : 'Create your first voucher to get started.'}
                    </Text>
                  </Group>
                </ModernAlert>
              )}
            </ModernCard>

        {/* Create Voucher Modal */}
        <Modal
          opened={isCreateModalOpen}
          onClose={closeCreateModal}
          title="Create New Voucher"
          size="lg"
        >
          <form onSubmit={form.onSubmit(handleCreateVoucher)}>
            <Stack gap="md">
              <TextInput
                label="Voucher Code"
                placeholder="Enter voucher code (e.g., SAVE20)"
                description="Use uppercase letters and numbers only"
                required
                {...form.getInputProps('code')}
              />

              <Textarea
                label="Description"
                placeholder="Enter voucher description"
                rows={3}
                {...form.getInputProps('description')}
              />

              <SimpleGrid cols={2} spacing="md">
                <Select
                  label="Type"
                  placeholder="Select type"
                  required
                  data={[
                    { value: 'credit', label: 'Credit (₹)' },
                    { value: 'messages', label: 'Messages' },
                    { value: 'percentage', label: 'Percentage (%)' },
                    { value: 'package', label: 'Package' }
                  ]}
                  {...form.getInputProps('type')}
                />
                {form.values.type === 'package' ? (
                  <Select
                    label="Package"
                    placeholder="Select package"
                    required
                    disabled={packagesLoading}
                    data={packages.map(pkg => ({
                      value: pkg.id.toString(),
                      label: `${pkg.name} - ₹${pkg.price} (${pkg.duration} days, ${pkg.messageLimit.toLocaleString()} messages)`
                    }))}
                    {...form.getInputProps('packageId')}
                    rightSection={packagesLoading ? <Loader size="xs" /> : null}
                  />
                ) : (
                  <NumberInput
                    label="Value"
                    placeholder="Enter value"
                    required
                    min={0}
                    decimalScale={2}
                    {...form.getInputProps('value')}
                  />
                )}
              </SimpleGrid>

              <SimpleGrid cols={2} spacing="md">
                <NumberInput
                  label="Usage Limit"
                  placeholder="Leave empty for unlimited"
                  min={1}
                  {...form.getInputProps('usage_limit')}
                />
                <TextInput
                  type="date"
                  label="Expiry Date"
                  placeholder="Select expiry date"
                  {...form.getInputProps('expires_at')}
                />
              </SimpleGrid>

              <Group justify="flex-end" mt="lg">
                <Button variant="outline" onClick={closeCreateModal}>
                  Cancel
                </Button>
                <Button color="green" type="submit">
                  Create Voucher
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* View Voucher Modal */}
        <Modal
          opened={isViewModalOpen}
          onClose={closeViewModal}
          title="Voucher Details"
          size="md"
        >
          {selectedVoucher && (
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600}>Code:</Text>
                <Code fw="bold">{selectedVoucher.code}</Code>
              </Group>

              <Group justify="space-between">
                <Text fw={600}>Type:</Text>
                <Badge color={getTypeColor(selectedVoucher.type)} variant="light">
                  {getTypeLabel(selectedVoucher.type)}
                </Badge>
              </Group>

              <Group justify="space-between">
                <Text fw={600}>Value:</Text>
                <Text>{formatValue(selectedVoucher.type, selectedVoucher.value)}</Text>
              </Group>

              <Group justify="space-between">
                <Text fw={600}>Status:</Text>
                <Badge color={getStatusColor(selectedVoucher.status)} variant="light">
                  {selectedVoucher.status}
                </Badge>
              </Group>

              <Group justify="space-between">
                <Text fw={600}>Usage:</Text>
                <Text>{selectedVoucher.usage_count} / {selectedVoucher.usage_limit || '∞'}</Text>
              </Group>

              {selectedVoucher.expires_at && (
                <Group justify="space-between">
                  <Text fw={600}>Expires:</Text>
                  <Text>{new Date(selectedVoucher.expires_at).toLocaleDateString()}</Text>
                </Group>
              )}

              <Group justify="space-between">
                <Text fw={600}>Created by:</Text>
                <Text>{selectedVoucher.created_by}</Text>
              </Group>

              <Group justify="space-between">
                <Text fw={600}>Created:</Text>
                <Text>{new Date(selectedVoucher.created_at).toLocaleDateString()}</Text>
              </Group>

              {selectedVoucher.description && (
                <>
                  <Text fw={600}>Description:</Text>
                  <Text c="dimmed">{selectedVoucher.description}</Text>
                </>
              )}
            </Stack>
          )}
        </Modal>
          </ResponsiveStack>
        </ModernContainer>
      </AdminLayout>
    </PagePermissionGuard>
  )
}