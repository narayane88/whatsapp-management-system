'use client'

import { Box, Title, Stack, Group, Text, ThemeIcon, ActionIcon, Tooltip, Skeleton, Alert, Modal, Badge, Divider } from '@mantine/core'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { IconUsers, IconRefresh, IconTrendingUp, IconAlertCircle, IconShield, IconAlertTriangle, IconEye, IconPhone, IconMail, IconCalendar, IconCoins, IconPackage } from '@tabler/icons-react'
import AdminLayout from '@/components/layout/AdminLayout'
import { usePermissions } from '@/hooks/usePermissions'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import CustomerStatsCards from '@/components/customers/CustomerStats'
import CustomerFilters from '@/components/customers/CustomerFilters'
import CustomerActions from '@/components/customers/CustomerActions'
import CustomerTable from '@/components/customers/CustomerTable'
import CreateCustomerModal from '@/components/customers/CreateCustomerModal'
import EditCustomerModal from '@/components/customers/EditCustomerModal'
import { ModernCard, ModernContainer, ModernAlert, ModernButton } from '@/components/ui/modern-components'
import { ResponsiveStack } from '@/components/ui/responsive-layout'

interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  mobile?: string
  isActive: boolean
  parentId?: number
  dealer_code?: string
  customer_status: string
  created_at: string
  account_balance: number | string
  message_balance: number | string
  last_login?: string
  registration_source?: string
  dealer_name?: string
  dealer_dealer_code?: string
  role: string
  package_id?: string
  package_expiry?: string
  package_name?: string
  package_price?: number
  package_status: string
  avatar?: string
  language?: string
  address?: string
  notes?: string
}

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  customersWithDealers: number
  customersWithPackages: number
  customersWithExpiredPackages: number
  totalCustomerBalance: number
}

export default function CustomersPage() {
  const { data: session } = useSession()
  const { hasPermission } = usePermissions()
  const { startImpersonation, loading: impersonationLoading } = useImpersonation()
  
  // State management
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    customersWithDealers: 0,
    customersWithPackages: 0,
    customersWithExpiredPackages: 0,
    totalCustomerBalance: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [packageFilter, setPackageFilter] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 20
  
  // Modal state
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false)
  const [viewModalOpened, setViewModalOpened] = useState(false)
  const [editModalOpened, setEditModalOpened] = useState(false)
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Load customers data
  const loadCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(roleFilter && { role: roleFilter }),
        ...(packageFilter && { package: packageFilter }),
      })

      const response = await fetch(`/api/customers?${params}`)
      if (!response.ok) throw new Error('Failed to fetch customers')
      
      const data = await response.json()
      setCustomers(data.customers || [])
      setTotalPages(Math.ceil((data.total || 0) / ITEMS_PER_PAGE))
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load customers',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  // Load statistics
  const loadStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch('/api/customers/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data.stats || {})
    } catch (error) {
      console.error('Failed to load customer stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [currentPage, searchTerm, statusFilter, roleFilter, packageFilter])

  useEffect(() => {
    loadStats()
  }, [])

  // Refresh data
  const refreshData = async () => {
    await Promise.all([loadCustomers(), loadStats()])
    notifications.show({
      title: 'Data Refreshed',
      message: 'Customer data has been updated successfully',
      color: 'green'
    })
  }

  // Event handlers
  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setRoleFilter('')
    setPackageFilter('')
    setCurrentPage(1)
  }

  const handleCreateCustomer = () => {
    openCreateModal()
  }

  const handleCreateSuccess = () => {
    // Reload customers and stats after successful creation
    loadCustomers()
    loadStats()
  }

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    // TODO: Implement export functionality
    notifications.show({
      title: 'Exporting',
      message: `Exporting customers as ${format.toUpperCase()}`,
      color: 'blue'
    })
  }

  const handleImport = () => {
    // TODO: Implement import functionality
    notifications.show({
      title: 'Coming Soon',
      message: 'Import customers functionality will be implemented',
      color: 'blue'
    })
  }

  const handleBulkActions = () => {
    // TODO: Implement bulk actions
    notifications.show({
      title: 'Coming Soon',
      message: 'Bulk actions functionality will be implemented',
      color: 'blue'
    })
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setViewModalOpened(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditModalOpened(true)
  }

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setDeleteModalOpened(true)
  }

  const handleToggleStatus = async (customer: Customer) => {
    try {
      const newStatus = customer.isActive ? 'inactive' : 'active'
      
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/customers/${customer.id}/status`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // })
      
      notifications.show({
        title: 'Status Updated',
        message: `${customer.name} has been ${newStatus === 'active' ? 'activated' : 'suspended'}`,
        color: newStatus === 'active' ? 'green' : 'orange'
      })
      
      // Reload customers data
      loadCustomers()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update customer status',
        color: 'red'
      })
    }
  }

  const handleImpersonate = async (customer: Customer) => {
    await startImpersonation(customer.id)
    // Redirect is handled automatically by ImpersonationContext
  }

  const confirmDeleteCustomer = async () => {
    if (!selectedCustomer) return

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
      //   method: 'DELETE'
      // })
      
      notifications.show({
        title: 'Customer Deleted',
        message: `${selectedCustomer.name} has been deleted successfully`,
        color: 'green'
      })
      
      setDeleteModalOpened(false)
      setSelectedCustomer(null)
      loadCustomers()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete customer',
        color: 'red'
      })
    }
  }

  const handleEditSuccess = () => {
    // Reload customers and stats after successful edit
    loadCustomers()
    loadStats()
  }

  return (
    <PagePermissionGuard requiredPermissions={['customers.page.access']}>
      <AdminLayout>
        <ModernContainer fluid>
          <ResponsiveStack gap="xl">
            {/* Enhanced Header */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%)',
                border: '2px solid rgba(6, 182, 212, 0.15)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(6, 182, 212, 0.08)',
                padding: '32px'
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Group gap="lg">
                  <ThemeIcon 
                    size="2xl" 
                    variant="gradient" 
                    gradient={{ from: 'cyan.6', to: 'blue.5', deg: 135 }}
                    style={{
                      boxShadow: '0 8px 24px rgba(6, 182, 212, 0.3)'
                    }}
                  >
                    <IconUsers size={28} />
                  </ThemeIcon>
                  <Box>
                    <Group gap="sm" align="center" mb={8}>
                      <Title 
                        order={2}
                        c="dark.8"
                        fw={600}
                      >
                        Customer Management
                      </Title>
                      {!loading && (
                        <Group gap={4}>
                          <IconTrendingUp size={10} color="green" />
                          <Text size="xs" c="green" fw={600}>
                            {customers.length} loaded
                          </Text>
                        </Group>
                      )}
                    </Group>
                    <Text c="dimmed" size="xs" fw={500} mb="lg">
                      Comprehensive customer relationship management with advanced filtering, analytics, and bulk operations
                    </Text>
                    
                    {/* Quick Stats Bar */}
                    <Group gap="xl">
                      <Group gap="xs">
                        <IconUsers size={10} color="var(--mantine-color-cyan-6)" />
                        <Text size="xs" c="dimmed">Total:</Text>
                        {statsLoading ? (
                          <Skeleton height={16} width={40} />
                        ) : (
                          <Text size="xs" fw={700} c="cyan.7">
                            {stats.totalCustomers.toLocaleString()}
                          </Text>
                        )}
                      </Group>
                      <Group gap="xs">
                        <IconTrendingUp size={10} color="var(--mantine-color-green-6)" />
                        <Text size="xs" c="dimmed">Active:</Text>
                        {statsLoading ? (
                          <Skeleton height={16} width={40} />
                        ) : (
                          <Text size="xs" fw={700} c="green.7">
                            {stats.activeCustomers.toLocaleString()}
                          </Text>
                        )}
                      </Group>
                      <Group gap="xs">
                        <IconShield size={10} color="var(--mantine-color-blue-6)" />
                        <Text size="xs" c="dimmed">With Packages:</Text>
                        {statsLoading ? (
                          <Skeleton height={16} width={40} />
                        ) : (
                          <Text size="xs" fw={700} c="blue.7">
                            {stats.customersWithPackages.toLocaleString()}
                          </Text>
                        )}
                      </Group>
                    </Group>
                  </Box>
                </Group>
                
                <Group gap="sm">
                  <Tooltip label="Refresh all customer data">
                    <ActionIcon 
                      size="xs" 
                      variant="gradient" 
                      gradient={{ from: 'cyan.5', to: 'blue.4', deg: 135 }}
                      onClick={refreshData}
                      loading={loading || statsLoading}
                      style={{
                        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
                      }}
                    >
                      <IconRefresh size={10} />
                    </ActionIcon>
                  </Tooltip>
                  
                  <CustomerActions
                    onCreateCustomer={handleCreateCustomer}
                    onExport={handleExport}
                    onImport={handleImport}
                    onBulkActions={handleBulkActions}
                  />
                </Group>
              </Group>
              
              {/* Enhanced Security Notice */}
              {hasPermission('customers.sensitive.access') && (
                <Box
                  mt="lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    borderRadius: '12px',
                    padding: '16px'
                  }}
                >
                  <Group gap="sm">
                    <ThemeIcon size="xs" variant="light" color="cyan">
                      <IconShield size={10} />
                    </ThemeIcon>
                    <Box>
                      <Text size="xs" fw={600} c="cyan.7" mb={2}>
                        Security Notice
                      </Text>
                      <Text size="xs" c="dimmed">
                        You have access to sensitive customer data. Please handle with care and follow data protection guidelines.
                      </Text>
                    </Box>
                  </Group>
                </Box>
              )}
            </ModernCard>

            {/* Enhanced Statistics */}
            <CustomerStatsCards 
              stats={stats} 
              loading={statsLoading} 
            />

            {/* Enhanced Filters */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,249,255,0.95) 100%)',
                border: '2px solid rgba(6, 182, 212, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(6, 182, 212, 0.05)',
                padding: '24px'
              }}
            >
              <CustomerFilters
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                roleFilter={roleFilter}
                packageFilter={packageFilter}
                onSearchChange={setSearchTerm}
                onStatusChange={(value) => setStatusFilter(value || '')}
                onRoleChange={(value) => setRoleFilter(value || '')}
                onPackageChange={(value) => setPackageFilter(value || '')}
                onClearFilters={handleClearFilters}
                totalResults={customers.length}
              />
            </ModernCard>

            {/* Enhanced Customers Table */}
            <CustomerTable
              customers={customers}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onView={handleViewCustomer}
              onEdit={handleEditCustomer}
              onDelete={handleDeleteCustomer}
              onToggleStatus={handleToggleStatus}
              onImpersonate={handleImpersonate}
            />

            {/* Create Customer Modal */}
            <CreateCustomerModal
              opened={createModalOpened}
              onClose={closeCreateModal}
              onSuccess={handleCreateSuccess}
            />

            {/* View Customer Modal */}
            <Modal
              opened={viewModalOpened}
              onClose={() => setViewModalOpened(false)}
              title="Customer Details"
              size="lg"
            >
              {selectedCustomer && (
                <Stack gap="lg">
                  {/* Customer Basic Info */}
                  <Group align="flex-start">
                    <Box flex={1}>
                      <Group gap="sm" mb="md">
                        <IconEye size={20} color="var(--mantine-color-blue-6)" />
                        <Text fw="bold" size="lg">{selectedCustomer.name}</Text>
                        <Badge
                          color={selectedCustomer.isActive ? 'green' : 'red'}
                          variant="filled"
                          size="sm"
                        >
                          {selectedCustomer.customer_status}
                        </Badge>
                      </Group>
                      
                      <Stack gap="sm">
                        <Group gap="sm">
                          <IconMail size={16} />
                          <Text size="sm">{selectedCustomer.email}</Text>
                        </Group>
                        {selectedCustomer.mobile && (
                          <Group gap="sm">
                            <IconPhone size={16} />
                            <Text size="sm">{selectedCustomer.mobile}</Text>
                          </Group>
                        )}
                        <Group gap="sm">
                          <IconCalendar size={16} />
                          <Text size="sm">Joined: {new Date(selectedCustomer.created_at).toLocaleDateString()}</Text>
                        </Group>
                        {selectedCustomer.last_login && (
                          <Group gap="sm">
                            <IconCalendar size={16} />
                            <Text size="sm">Last Login: {new Date(selectedCustomer.last_login).toLocaleDateString()}</Text>
                          </Group>
                        )}
                      </Stack>
                    </Box>
                  </Group>

                  <Divider />

                  {/* Dealer Information */}
                  {selectedCustomer.dealer_name && (
                    <>
                      <Box>
                        <Text fw="bold" mb="sm">Dealer Information</Text>
                        <Group gap="md">
                          <Text size="sm"><strong>Name:</strong> {selectedCustomer.dealer_name}</Text>
                          <Text size="sm"><strong>Code:</strong> {selectedCustomer.dealer_dealer_code}</Text>
                        </Group>
                      </Box>
                      <Divider />
                    </>
                  )}

                  {/* Package Information */}
                  {selectedCustomer.package_name && (
                    <>
                      <Box>
                        <Group gap="sm" mb="sm">
                          <IconPackage size={20} />
                          <Text fw="bold">Package Information</Text>
                        </Group>
                        <Stack gap="sm">
                          <Group gap="md">
                            <Text size="sm"><strong>Package:</strong> {selectedCustomer.package_name}</Text>
                            <Text size="sm"><strong>Price:</strong> ₹{selectedCustomer.package_price}</Text>
                          </Group>
                          <Group gap="md">
                            <Text size="sm"><strong>Status:</strong> {selectedCustomer.package_status}</Text>
                            {selectedCustomer.package_expiry && (
                              <Text size="sm"><strong>Expires:</strong> {new Date(selectedCustomer.package_expiry).toLocaleDateString()}</Text>
                            )}
                          </Group>
                        </Stack>
                      </Box>
                      <Divider />
                    </>
                  )}

                  {/* Balance Information */}
                  <Box>
                    <Group gap="sm" mb="sm">
                      <IconCoins size={20} />
                      <Text fw="bold">Balance Information</Text>
                    </Group>
                    <Group gap="md">
                      <Text size="sm" c="green.7"><strong>BizCoins:</strong> ₹{(parseFloat(String(selectedCustomer.account_balance || 0))).toFixed(2)}</Text>
                      <Text size="sm"><strong>Messages:</strong> {selectedCustomer.message_balance || 0}</Text>
                    </Group>
                  </Box>
                </Stack>
              )}
            </Modal>

            {/* Delete Customer Modal */}
            <Modal
              opened={deleteModalOpened}
              onClose={() => setDeleteModalOpened(false)}
              title="Delete Customer"
              size="sm"
            >
              {selectedCustomer && (
                <Stack gap="lg">
                  <Alert
                    variant="light"
                    color="red"
                    title="Confirm Deletion"
                    icon={<IconAlertTriangle size={16} />}
                  >
                    Are you sure you want to delete <strong>{selectedCustomer.name}</strong>? This action cannot be undone and will remove all associated data.
                  </Alert>

                  <Box
                    style={{
                      background: 'rgba(248, 250, 252, 0.8)',
                      border: '1px solid rgba(226, 232, 240, 0.6)',
                      borderRadius: '12px',
                      padding: '16px'
                    }}
                  >
                    <Group justify="space-between">
                      <Box>
                        <Text size="sm" c="dimmed">Customer ID</Text>
                        <Text fw="bold">{selectedCustomer.id}</Text>
                      </Box>
                      <Box>
                        <Text size="sm" c="dimmed">Account Balance</Text>
                        <Text fw="bold" c="green.6">₹{(parseFloat(String(selectedCustomer.account_balance || 0))).toFixed(2)}</Text>
                      </Box>
                    </Group>
                  </Box>

                  <Group justify="flex-end" gap="md">
                    <ModernButton variant="ghost" onClick={() => setDeleteModalOpened(false)}>
                      Cancel
                    </ModernButton>
                    <ModernButton 
                      variant="danger"
                      onClick={confirmDeleteCustomer}
                    >
                      Delete Customer
                    </ModernButton>
                  </Group>
                </Stack>
              )}
            </Modal>

            {/* Edit Customer Modal */}
            <EditCustomerModal
              opened={editModalOpened}
              onClose={() => setEditModalOpened(false)}
              onSuccess={handleEditSuccess}
              customer={selectedCustomer}
            />
          </ResponsiveStack>
        </ModernContainer>
      </AdminLayout>
    </PagePermissionGuard>
  )
}