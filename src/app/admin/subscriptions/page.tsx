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
  Notification,
  ThemeIcon,
  RingProgress,
  Skeleton
} from '@mantine/core'
import { FiDownload, FiEye, FiTrendingUp, FiUsers, FiClock, FiAlertCircle, FiPlus, FiEdit, FiTrash2, FiPackage, FiRefreshCw, FiFilter } from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import BizCoinIcon from '@/components/icons/BizCoinIcon'
import { useState, useEffect } from 'react'
import { DateInput } from '@mantine/dates'
import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernAlert,
  ModernContainer,
  ModernLoader
} from '@/components/ui/modern-components'
import {
  ResponsiveCardGrid,
  ResponsiveTableContainer
} from '@/components/ui/responsive-layout'
import PaymentIframe from '@/components/payments/PaymentIframe'

interface Subscription {
  id: string;
  userId: string;
  packageId: string;
  createdBy: number | null;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  messagesUsed: number;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'PENDING' | 'SCHEDULED' | 'CANCELLED';
  scheduledStartDate?: string;
  purchaseType?: string;
  previousSubscriptionId?: string;
  user: {
    name: string;
    email: string;
    mobile?: string;
    dealerCode?: string;
  };
  creator: {
    name: string;
    email: string;
  };
  package: {
    name: string;
    description: string;
    price: number;
    duration: number;
    messageLimit: number;
    instanceLimit: number;
  };
}

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  messageLimit: number;
  instanceLimit: number;
  offer_price?: number;
  offer_enabled?: boolean;
}

interface PaymentPackage {
  id: string;
  name: string;
  price: number;
  offer_price?: number;
  offer_enabled: boolean;
  duration: number;
  currency: string;
}

export default function SubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterUserId, setFilterUserId] = useState('')
  const [filterPackageId, setFilterPackageId] = useState('')
  const [filterCreatedBy, setFilterCreatedBy] = useState('')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  // Add Subscription Modal state
  const [addModalOpened, setAddModalOpened] = useState(false)
  const [addSubscriptionData, setAddSubscriptionData] = useState({
    userId: '',
    packageId: '',
    duration: 0,
    startDate: new Date(),
    paymentMethod: 'RAZORPAY',
    startType: 'now' as 'now' | 'after_expiry'
  })
  const [userActiveSubscription, setUserActiveSubscription] = useState<any>(null)

  // Payment iframe state
  const [paymentIframeOpened, setPaymentIframeOpened] = useState(false)
  const [selectedPackageForPayment, setSelectedPackageForPayment] = useState<PaymentPackage | null>(null)
  const [userCreditInfo, setUserCreditInfo] = useState<{
    creditBalance: number,
    canUseCredit: boolean,
    roleName: string,
    eligibilityMessage: string
  } | null>(null)
  const [userBizCoinsInfo, setUserBizCoinsInfo] = useState<{
    bizCoinsBalance: number,
    commissionRate: number,
    canUseBizCoins: boolean,
    userName?: string
  } | null>(null)
  const [allUsers, setAllUsers] = useState<Array<{id: number | string, name: string, email: string}>>([])
  const [allPackages, setAllPackages] = useState<Package[]>([])
  const [addLoading, setAddLoading] = useState(false)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [currentUserLevel, setCurrentUserLevel] = useState<number | null>(null)

  // View/Edit/Delete Modal states
  const [viewModalOpened, setViewModalOpened] = useState(false)
  const [editModalOpened, setEditModalOpened] = useState(false)
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editSubscriptionData, setEditSubscriptionData] = useState({
    userId: '',
    packageId: '',
    startDate: new Date(),
    endDate: new Date(),
    isActive: true,
    messagesUsed: 0,
    paymentMethod: 'RAZORPAY'
  })

  // Fetch subscriptions from API
  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (filterStatus) params.append('status', filterStatus)
      if (filterUserId) params.append('userId', filterUserId)
      if (filterPackageId) params.append('packageId', filterPackageId)
      if (filterCreatedBy) params.append('createdBy', filterCreatedBy)
      if (filterPaymentMethod) params.append('paymentMethod', filterPaymentMethod)
      
      const response = await fetch(`/api/admin/subscriptions?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setSubscriptions(data.subscriptions || [])
      setPagination(data.pagination || pagination)
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
      setError(error instanceof Error ? error.message : 'Failed to load subscriptions')
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch all users for subscription creation
  const fetchAllUsers = async () => {
    try {
      console.log('🔍 Fetching users for subscription creation...')
      const response = await fetch('/api/admin/users')
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Users fetched successfully:', data.users?.length || 0, 'users')
        setAllUsers(data.users || [])
      } else {
        console.error('❌ Failed to fetch users:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error details:', errorData)
        setAllUsers([]) // Clear users on error
      }
    } catch (error) {
      console.error('💥 Network error fetching users:', error)
      setAllUsers([]) // Clear users on error
    }
  }

  // Fetch all packages for subscription creation
  const fetchAllPackages = async () => {
    try {
      const response = await fetch('/api/admin/packages')
      if (response.ok) {
        const data = await response.json()
        setAllPackages(data.packages || [])
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error)
    }
  }

  // Fetch user credit information
  const fetchUserCreditInfo = async (userId: string) => {
    if (!userId) {
      setUserCreditInfo(null)
      return
    }
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/credit`)
      if (response.ok) {
        const data = await response.json()
        setUserCreditInfo({
          creditBalance: data.creditBalance,
          canUseCredit: data.canUseCredit,
          roleName: data.roleName,
          eligibilityMessage: data.eligibilityMessage
        })
      } else {
        setUserCreditInfo(null)
      }
    } catch (error) {
      console.error('Failed to fetch user credit info:', error)
      setUserCreditInfo(null)
    }
  }

  const fetchUserActiveSubscription = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/subscriptions?userId=${userId}&status=ACTIVE&limit=1`)
      if (response.ok) {
        const data = await response.json()
        const activeSubscription = data.subscriptions.find((s: any) => s.status === 'ACTIVE')
        setUserActiveSubscription(activeSubscription || null)
      } else {
        setUserActiveSubscription(null)
      }
    } catch (error) {
      console.error('Error fetching user active subscription:', error)
      setUserActiveSubscription(null)
    }
  }

  // Fetch current user's level for payment method restrictions
  const fetchCurrentUserLevel = async () => {
    try {
      const response = await fetch('/api/users/current')
      if (response.ok) {
        const userData = await response.json()
        console.log('🔍 Full API response:', userData)
        console.log('🔍 User data:', userData.user)
        console.log('🔍 Role level from API:', userData.user.roleLevel)
        setCurrentUserLevel(userData.user.roleLevel || null)
        console.log('🔍 Set current user level to:', userData.user.roleLevel || null)
      } else {
        console.error('❌ Failed to fetch user level, response not ok:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch current user level:', error)
    }
  }

  // Fetch logged-in user's BizCoins information (not end user's)
  const fetchLoggedInUserBizCoinsInfo = async () => {
    try {
      const response = await fetch('/api/users/current')
      if (response.ok) {
        const userData = await response.json()
        const bizCoinsResponse = await fetch(`/api/admin/users/${userData.user.id}/bizpoints`)
        if (bizCoinsResponse.ok) {
          const data = await bizCoinsResponse.json()
          setUserBizCoinsInfo({
            bizCoinsBalance: data.bizPointsBalance,
            commissionRate: data.commissionRate,
            canUseBizCoins: data.canUseBizPoints,
            userName: userData.user.name
          })
        } else {
          setUserBizCoinsInfo(null)
        }
      } else {
        setUserBizCoinsInfo(null)
      }
    } catch (error) {
      console.error('Failed to fetch logged-in user BizCoins info:', error)
      setUserBizCoinsInfo(null)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
    fetchAllUsers()
    fetchAllPackages()
    fetchCurrentUserLevel()
  }, [pagination.page, filterStatus, filterUserId, filterPackageId, filterCreatedBy, filterPaymentMethod])

  useEffect(() => {
    // Reset to first page when filters change
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    } else {
      fetchSubscriptions()
    }
  }, [filterStatus, filterUserId, filterPackageId, filterCreatedBy, filterPaymentMethod])

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'green'
      case 'PENDING': return 'yellow'
      case 'INACTIVE': return 'gray'
      case 'EXPIRED': return 'red'
      case 'SCHEDULED': return 'orange'
      case 'CANCELLED': return 'pink'
      default: return 'gray'
    }
  }

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.package.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const totalSubscriptions = pagination.total
  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE').length
  const expiredSubscriptions = subscriptions.filter(s => s.status === 'EXPIRED').length
  const scheduledSubscriptions = subscriptions.filter(s => s.status === 'SCHEDULED').length
  const totalRevenue = subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + s.package.price, 0)

  const exportToExcel = () => {
    console.log('Exporting subscriptions to Excel...')
  }

  // Get available payment methods based on user level
  const getAvailablePaymentMethods = () => {
    console.log('🏪 getAvailablePaymentMethods called, currentUserLevel:', currentUserLevel)
    
    const basePaymentMethods = [
      { value: 'CASH', label: 'Cash' },
      { value: 'BANK', label: 'Bank Transfer' },
      { value: 'UPI', label: 'UPI' },
      { value: 'RAZORPAY', label: 'Razorpay' },
      { value: 'GATEWAY', label: 'Payment Gateway' },
      { value: 'WALLET', label: 'Wallet' },
    ];

    // For Level 3+ users, only allow Razorpay and BizCoins
    if (currentUserLevel !== null && currentUserLevel >= 3) {
      console.log('🔒 Level 3+ user detected - Restricting payment methods to Razorpay and BizCoins only');
      const restrictedMethods = [
        { value: 'RAZORPAY', label: 'Razorpay' },
        { value: 'BIZPOINTS', label: '🪙 Use BizCoins' }
      ];
      console.log('🔒 Returning restricted methods:', restrictedMethods);
      return restrictedMethods;
    }

    // For Level 1-2 users, show all payment methods
    const allMethods = [
      ...basePaymentMethods,
      ...(userCreditInfo?.canUseCredit ? [{ value: 'CREDIT', label: '💳 Use Credit Balance' }] : []),
      { value: 'BIZPOINTS', label: '🪙 Use BizCoins' }
    ];
    console.log('🔓 Level 1-2 user - Returning all methods:', allMethods);
    return allMethods;
  }

  const handleAddSubscription = () => {
    // Reset payment method to an allowed option for Level 3+ users
    if (currentUserLevel !== null && currentUserLevel >= 3) {
      setAddSubscriptionData(prev => ({ ...prev, paymentMethod: 'RAZORPAY' }))
    }
    setAddModalOpened(true)
  }

  const handleCreateSubscription = async () => {
    if (!addSubscriptionData.userId || !addSubscriptionData.packageId) {
      setNotification({ message: 'Please select both user and package', type: 'error' })
      return
    }

    // Handle RAZORPAY payment method with iframe
    if (addSubscriptionData.paymentMethod === 'RAZORPAY') {
      const selectedPackage = allPackages.find(p => p.id === addSubscriptionData.packageId)
      if (!selectedPackage) {
        setNotification({ message: 'Selected package not found', type: 'error' })
        return
      }

      // Convert package data to format expected by PaymentIframe
      const packageForPayment: PaymentPackage = {
        id: selectedPackage.id,
        name: selectedPackage.name,
        price: selectedPackage.price,
        offer_price: selectedPackage.offer_price,
        offer_enabled: selectedPackage.offer_enabled || false,
        duration: selectedPackage.duration,
        currency: 'INR'
      }

      setSelectedPackageForPayment(packageForPayment)
      setAddModalOpened(false) // Close add modal
      setPaymentIframeOpened(true) // Open payment iframe
      return
    }

    // Handle other payment methods (CREDIT, BIZPOINTS) - existing logic
    try {
      setAddLoading(true)
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addSubscriptionData),
      })

      const data = await response.json()

      if (response.ok) {
        setNotification({ message: 'Subscription created successfully', type: 'success' })
        setAddModalOpened(false)
        setAddSubscriptionData({
          userId: '',
          packageId: '',
          duration: 0,
          startDate: new Date(),
          paymentMethod: 'RAZORPAY',
          startType: 'now'
        })
        setUserActiveSubscription(null)
        fetchSubscriptions() // Refresh the list
      } else {
        setNotification({ message: data.error || 'Failed to create subscription', type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error occurred', type: 'error' })
    } finally {
      setAddLoading(false)
    }
  }

  // Payment handlers
  const handlePaymentSuccess = (paymentData: any) => {
    console.log('💰 Admin subscription payment successful:', paymentData)
    setNotification({ 
      message: 'Payment successful! Subscription has been activated.', 
      type: 'success' 
    })
    setPaymentIframeOpened(false)
    setSelectedPackageForPayment(null)
    setAddSubscriptionData({
      userId: '',
      packageId: '',
      duration: 0,
      startDate: new Date(),
      paymentMethod: 'RAZORPAY',
      startType: 'now'
    })
    setUserActiveSubscription(null)
    fetchSubscriptions() // Refresh the list
  }

  const handlePaymentFailure = (errorData: any) => {
    console.log('❌ Admin subscription payment failed:', errorData)
    setNotification({ 
      message: errorData.message || 'Payment failed. Please try again.', 
      type: 'error' 
    })
    setPaymentIframeOpened(false)
    setAddModalOpened(true) // Reopen add modal so user can try again
  }

  const handleViewSubscription = (subscriptionId: string) => {
    const subscription = subscriptions.find(s => s.id === subscriptionId)
    if (subscription) {
      setSelectedSubscription(subscription)
      setViewModalOpened(true)
    }
  }

  const handleEditSubscription = (subscriptionId: string) => {
    const subscription = subscriptions.find(s => s.id === subscriptionId)
    if (subscription) {
      setSelectedSubscription(subscription)
      setEditSubscriptionData({
        userId: subscription.userId,
        packageId: subscription.packageId,
        startDate: new Date(subscription.startDate),
        endDate: new Date(subscription.endDate),
        isActive: subscription.isActive,
        messagesUsed: subscription.messagesUsed,
        paymentMethod: subscription.paymentMethod || 'CASH'
      })
      setEditModalOpened(true)
    }
  }

  const handleUpdateSubscription = async () => {
    if (!selectedSubscription) return
    
    if (!editSubscriptionData.userId || !editSubscriptionData.packageId) {
      setNotification({ message: 'Please fill in all required fields', type: 'error' })
      return
    }

    try {
      setEditLoading(true)
      const response = await fetch(`/api/admin/subscriptions?id=${selectedSubscription.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editSubscriptionData),
      })

      const data = await response.json()

      if (response.ok) {
        setNotification({ message: 'Subscription updated successfully', type: 'success' })
        setEditModalOpened(false)
        setSelectedSubscription(null)
        fetchSubscriptions() // Refresh the list
      } else {
        setNotification({ message: data.error || 'Failed to update subscription', type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error occurred', type: 'error' })
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteSubscription = (subscriptionId: string) => {
    const subscription = subscriptions.find(s => s.id === subscriptionId)
    if (subscription) {
      setSelectedSubscription(subscription)
      setDeleteModalOpened(true)
    }
  }

  const confirmDeleteSubscription = async () => {
    if (!selectedSubscription) return

    try {
      setDeleteLoading(true)
      const response = await fetch(`/api/admin/subscriptions?id=${selectedSubscription.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotification({ message: 'Subscription deleted successfully', type: 'success' })
        setDeleteModalOpened(false)
        setSelectedSubscription(null)
        fetchSubscriptions() // Refresh the list
      } else {
        const data = await response.json()
        setNotification({ message: data.error || 'Failed to delete subscription', type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error occurred', type: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }


  const handleCancelScheduled = async (subscriptionId: string, userId: string) => {
    try {
      const response = await fetch('/api/admin/subscriptions/scheduled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          subscriptionId,
          userId
        })
      })

      if (response.ok) {
        setNotification({ 
          message: 'Scheduled subscription cancelled successfully', 
          type: 'success' 
        })
        fetchSubscriptions() // Refresh the list
      } else {
        const data = await response.json()
        setNotification({ message: data.error || 'Failed to cancel scheduled subscription', type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Network error occurred', type: 'error' })
    }
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <PagePermissionGuard requiredPermissions={['subscriptions.page.access']}>
      <AdminLayout>
      <ModernContainer fluid>
        <Stack gap="xl">
          {/* Enhanced Page Header */}
          <ModernCard
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(251, 146, 60, 0.03) 100%)',
              border: '2px solid rgba(249, 115, 22, 0.15)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(249, 115, 22, 0.08)',
              padding: '32px'
            }}
          >
            <Group justify="space-between" align="flex-start">
              <Group gap="lg">
                <ThemeIcon 
                  size="2xl" 
                  variant="gradient" 
                  gradient={{ from: 'orange.6', to: 'yellow.5', deg: 135 }}
                  style={{
                    boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)'
                  }}
                >
                  <FiPackage size={28} />
                </ThemeIcon>
                <Box>
                  <Title 
                    order={2} 
                    mb={8}
                    c="orange.7"
                  >
                    Subscription Management
                  </Title>
                  <Text c="dimmed" size="xs" fw={500} mb="sm">
                    Comprehensive subscription administration with package management and payment tracking
                  </Text>
                  
                  {/* Quick Status Indicators */}
                  <Group gap="xl">
                    <Group gap="xs">
                      <FiTrendingUp size={10} color="var(--mantine-color-green-6)" />
                      <Text size="xs" c="green.6" fw={600}>Active Plans</Text>
                    </Group>
                    <Group gap="xs">
                      <FaRupeeSign size={10} color="var(--mantine-color-violet-6)" />
                      <Text size="xs" c="violet.6" fw={600}>Revenue Tracking</Text>
                    </Group>
                    <Group gap="xs">
                      <FiClock size={10} color="var(--mantine-color-orange-6)" />
                      <Text size="xs" c="orange.6" fw={600}>Renewal Management</Text>
                    </Group>
                  </Group>
                </Box>
              </Group>
              
              <Group gap="sm">
                <ModernButton 
                  variant="ghost" 
                  leftSection={<FiRefreshCw size={10} />}
                  onClick={fetchSubscriptions}
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '12px'
                  }}
                >
                  Refresh
                </ModernButton>
              </Group>
            </Group>
          </ModernCard>

          {/* Enhanced Statistics Grid */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            {[
              {
                label: 'Total Subscriptions',
                value: totalSubscriptions,
                icon: FiPackage,
                color: 'blue',
                progress: 100,
                description: 'All subscription records'
              },
              {
                label: 'Active Plans',
                value: activeSubscriptions,
                icon: FiTrendingUp,
                color: 'green',
                progress: totalSubscriptions > 0 ? (activeSubscriptions / totalSubscriptions) * 100 : 0,
                description: 'Currently active subscriptions'
              },
              {
                label: 'Active Revenue',
                value: `₹${totalRevenue.toFixed(2)}`,
                icon: FaRupeeSign,
                color: 'violet',
                progress: 85,
                description: 'Monthly recurring revenue'
              },
              {
                label: 'Scheduled Plans',
                value: scheduledSubscriptions,
                icon: FiClock,
                color: 'orange',
                progress: totalSubscriptions > 0 ? (scheduledSubscriptions / totalSubscriptions) * 100 : 0,
                description: 'Plans scheduled to activate'
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
                    <Skeleton height={24} />
                    <Skeleton height={48} />
                    <Skeleton height={20} />
                  </Stack>
                ) : (
                  <>
                    {/* Decorative background element */}
                    <Box
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '100px',
                        height: '100px',
                        background: `linear-gradient(135deg, var(--mantine-color-${stat.color}-1) 0%, var(--mantine-color-${stat.color}-2) 100%)`,
                        borderRadius: '0 20px 0 60px',
                        opacity: 0.7,
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
                            {(() => {
                              const value = typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value;
                              // Format large currency values for better display
                              if (typeof value === 'string' && value.includes('₹')) {
                                const numericPart = value.replace('₹', '').replace(/,/g, '');
                                const num = parseFloat(numericPart);
                                if (num >= 100000) {
                                  return `₹${(num / 100000).toFixed(1)}L`;
                                } else if (num >= 10000) {
                                  return `₹${(num / 1000).toFixed(1)}K`;
                                } else if (num >= 1000) {
                                  return `₹${(num / 1000).toFixed(2)}K`;
                                }
                              }
                              return value;
                            })()}
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

        {/* Filters and Actions */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" wrap="wrap" gap="md">
              <Group gap="md" style={{ flex: 1 }}>
                <TextInput
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
              </Group>
              <Group gap="md">
                <Button
                  color="green"
                  leftSection={<FiPlus size={10} />}
                  onClick={handleAddSubscription}
                >
                  Add Subscription
                </Button>
                <Button
                  color="blue"
                  onClick={exportToExcel}
                  leftSection={<FiDownload size={10} />}
                >
                  Export Excel
                </Button>
                <Alert color="green" variant="light" style={{ padding: '8px 12px', margin: 0 }}>
                  <Group gap="xs" justify="center">
                    <FiClock size={14} />
                    <Text size="xs" fw={500}>Auto-Activation Enabled</Text>
                  </Group>
                  <Text size="xs" c="dimmed" mt={2}>
                    Scheduled subscriptions activate automatically
                  </Text>
                </Alert>
              </Group>
            </Group>
            
            <Group gap="md" wrap="wrap">
              <Select
                placeholder="All Status"
                value={filterStatus}
                onChange={(value) => setFilterStatus(value || '')}
                data={[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
                style={{ maxWidth: '200px' }}
              />

              <Select
                placeholder="All Users"
                value={filterUserId}
                onChange={(value) => setFilterUserId(value || '')}
                data={[
                  { value: '', label: 'All Users' },
                  ...allUsers.map(user => ({
                    value: user.id.toString(),
                    label: user.name
                  }))
                ]}
                style={{ maxWidth: '200px' }}
              />

              <Select
                placeholder="All Packages"
                value={filterPackageId}
                onChange={(value) => setFilterPackageId(value || '')}
                data={[
                  { value: '', label: 'All Packages' },
                  ...allPackages.map(pkg => ({
                    value: pkg.id,
                    label: pkg.name
                  }))
                ]}
                style={{ maxWidth: '200px' }}
              />

              <Select
                placeholder="All Creators"
                value={filterCreatedBy}
                onChange={(value) => setFilterCreatedBy(value || '')}
                data={[
                  { value: '', label: 'All Creators' },
                  ...allUsers.map(user => ({
                    value: user.id.toString(),
                    label: user.name
                  }))
                ]}
                style={{ maxWidth: '200px' }}
              />

              <Select
                placeholder="All Payment Methods"
                value={filterPaymentMethod}
                onChange={(value) => setFilterPaymentMethod(value || '')}
                data={[
                  { value: '', label: 'All Payment Methods' },
                  { value: 'CASH', label: 'Cash' },
                  { value: 'BANK', label: 'Bank Transfer' },
                  { value: 'UPI', label: 'UPI' },
                  { value: 'RAZORPAY', label: 'Razorpay' },
                  { value: 'GATEWAY', label: 'Payment Gateway' },
                  { value: 'WALLET', label: 'Wallet' },
                  { value: 'CREDIT', label: 'Credit Balance' },
                  { value: 'BIZPOINTS', label: 'BizCoins' }
                ]}
                style={{ maxWidth: '200px' }}
              />
            </Group>
          </Stack>
        </Card>

        {/* Subscriptions Table */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          {loading ? (
            <Center p="xl">
              <Stack align="center" gap="md">
                <Loader size="xs" />
                <Text size="xs">Loading subscriptions...</Text>
              </Stack>
            </Center>
          ) : error ? (
            <Alert 
              icon={<FiAlertCircle size="1rem" />} 
              title="Error loading subscriptions" 
              color="red"
              variant="light"
            >
              <Stack gap="sm">
                <Text>{error}</Text>
                <Button size="xs" variant="outline" onClick={fetchSubscriptions}>
                  Retry
                </Button>
              </Stack>
            </Alert>
          ) : filteredSubscriptions.length === 0 ? (
            <Center p="xl">
              <Stack align="center" gap="md">
                <Text size="xs" c="dimmed">No subscriptions found</Text>
                <Text size="xs" c="dimmed">Try adjusting your search criteria or create a new subscription</Text>
              </Stack>
            </Center>
          ) : (
            <Table.ScrollContainer minWidth={1200}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Subscription ID</Table.Th>
                    <Table.Th>User</Table.Th>
                    <Table.Th>Package</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Payment Method</Table.Th>
                    <Table.Th>Created By</Table.Th>
                    <Table.Th>Duration</Table.Th>
                    <Table.Th>Usage</Table.Th>
                    <Table.Th>Price</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredSubscriptions.map((subscription) => (
                    <Table.Tr key={subscription.id}>
                      <Table.Td>
                        <Text ff="monospace" size="xs" fw="500">
                          {subscription.id.slice(0, 8)}...
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap="xs">
                          <Text fw="500" size="xs">{subscription.user.name}</Text>
                          <Text size="xs" c="dimmed">{subscription.user.email}</Text>
                          {subscription.user.dealerCode && (
                            <Badge size="xs" color="teal" variant="light">
                              Dealer: {subscription.user.dealerCode}
                            </Badge>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap="xs">
                          <Text fw="500" size="xs">{subscription.package.name}</Text>
                          <Text size="xs" c="dimmed">{subscription.package.description}</Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap="xs">
                          <Badge color={getStatusColor(subscription.status)} variant="light" size="xs">
                            {subscription.status}
                          </Badge>
                          {subscription.status === 'SCHEDULED' && subscription.scheduledStartDate && (
                            <Text size="xs" c="orange.6">
                              Starts: {new Date(subscription.scheduledStartDate).toLocaleDateString()}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <span style={{ fontSize: '14px' }}>
                            {(() => {
                              switch (subscription.paymentMethod) {
                                case 'BIZPOINTS':
                                  return '🪙'
                                case 'CREDIT':
                                  return '💳'
                                case 'RAZORPAY':
                                  return '💰'
                                case 'UPI':
                                  return '📱'
                                case 'CASH':
                                  return '💵'
                                case 'BANK':
                                  return '🏦'
                                case 'WALLET':
                                  return '👛'
                                case 'GATEWAY':
                                  return '🌐'
                                default:
                                  return '💳'
                              }
                            })()}
                          </span>
                          <Badge 
                            color={(() => {
                              switch (subscription.paymentMethod) {
                                case 'BIZPOINTS':
                                  return 'green'
                                case 'CREDIT':
                                  return 'blue'
                                case 'RAZORPAY':
                                  return 'yellow'
                                case 'UPI':
                                  return 'violet'
                                case 'CASH':
                                  return 'red'
                                case 'BANK':
                                  return 'cyan'
                                case 'WALLET':
                                  return 'grape'
                                case 'GATEWAY':
                                  return 'indigo'
                                default:
                                  return 'gray'
                              }
                            })()} 
                            variant="light"
                            size="xs"
                          >
                            {subscription.paymentMethod || 'N/A'}
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap="xs">
                          <Text fw="500" size="xs">{subscription.creator.name}</Text>
                          <Text size="xs" c="dimmed">{subscription.creator.email}</Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap="xs">
                          <Text size="xs">{subscription.package.duration} days</Text>
                          {subscription.status === 'ACTIVE' && (
                            <Text size="xs" c="dimmed">
                              {getDaysRemaining(subscription.endDate)} days left
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs">
                          {subscription.messagesUsed} / {subscription.package.messageLimit}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw="bold" size="xs" c="green.6">
                          <FaRupeeSign style={{ display: 'inline', marginRight: '2px', fontSize: '14px' }} />
                          {subscription.package.price.toFixed(2)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="blue"
                            aria-label="View subscription"
                            onClick={() => handleViewSubscription(subscription.id)}
                          >
                            <FiEye size={10} />
                          </ActionIcon>
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="orange"
                            aria-label="Edit subscription"
                            onClick={() => handleEditSubscription(subscription.id)}
                          >
                            <FiEdit size={10} />
                          </ActionIcon>
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="red"
                            aria-label="Delete subscription"
                            onClick={() => handleDeleteSubscription(subscription.id)}
                          >
                            <FiTrash2 size={10} />
                          </ActionIcon>
                          {subscription.status === 'SCHEDULED' && (
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color="pink"
                              aria-label="Cancel scheduled subscription"
                              onClick={() => handleCancelScheduled(subscription.id, subscription.userId)}
                            >
                              <FiAlertCircle size={10} />
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
        </Card>

        {/* Add Subscription Modal */}
        <Modal
          opened={addModalOpened}
          onClose={() => setAddModalOpened(false)}
          title="Add New Subscription"
          size="60%"
        >
          <Stack gap="md">
            <Select
              label="User"
              placeholder="Select a user"
              required
              value={addSubscriptionData.userId}
              onChange={(value) => {
                setAddSubscriptionData(prev => ({ ...prev, userId: value || '' }))
                if (value) {
                  fetchUserCreditInfo(value)
                  fetchUserActiveSubscription(value)
                  // No need to fetch BizCoins info per user since it's for logged-in user
                }
              }}
              data={allUsers.map(user => ({
                value: user.id.toString(),
                label: `${user.name} (${user.email})`
              }))}
            />

            {/* Innovative Payment Options Hub */}
            {(userCreditInfo || userBizCoinsInfo) && addSubscriptionData.userId && (
              <Card withBorder radius="lg" p="lg" style={{
                background: (() => {
                  switch (addSubscriptionData.paymentMethod) {
                    case 'BIZPOINTS':
                      return 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                    case 'CREDIT':
                      return 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                    case 'RAZORPAY':
                      return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                    case 'UPI':
                      return 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)'
                    case 'CASH':
                      return 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)'
                    case 'BANK':
                      return 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)'
                    case 'WALLET':
                      return 'linear-gradient(135deg, #fdf4ff 0%, #f5d0fe 100%)'
                    default:
                      return 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%)'
                  }
                })(),
                border: (() => {
                  switch (addSubscriptionData.paymentMethod) {
                    case 'BIZPOINTS':
                      return '1px solid #a7f3d0'
                    case 'CREDIT':
                      return '1px solid #93c5fd'
                    case 'RAZORPAY':
                      return '1px solid #fcd34d'
                    case 'UPI':
                      return '1px solid #c4b5fd'
                    case 'CASH':
                      return '1px solid #fca5a5'
                    case 'BANK':
                      return '1px solid #67e8f9'
                    case 'WALLET':
                      return '1px solid #d8b4fe'
                    default:
                      return '1px solid #e0e7ff'
                  }
                })(),
                transition: 'all 0.3s ease'
              }}>
                <Group gap="sm" mb="md">
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: (() => {
                      switch (addSubscriptionData.paymentMethod) {
                        case 'BIZPOINTS':
                          return 'linear-gradient(135deg, #10b981, #059669)'
                        case 'CREDIT':
                          return 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                        case 'RAZORPAY':
                          return 'linear-gradient(135deg, #f59e0b, #d97706)'
                        case 'UPI':
                          return 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                        case 'CASH':
                          return 'linear-gradient(135deg, #ef4444, #dc2626)'
                        case 'BANK':
                          return 'linear-gradient(135deg, #06b6d4, #0891b2)'
                        case 'WALLET':
                          return 'linear-gradient(135deg, #a855f7, #9333ea)'
                        default:
                          return 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                      }
                    })(),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    <span style={{ color: 'white', fontSize: '16px' }}>
                      {(() => {
                        switch (addSubscriptionData.paymentMethod) {
                          case 'BIZPOINTS':
                            return '🪙'
                          case 'CREDIT':
                            return '💳'
                          case 'RAZORPAY':
                            return '💰'
                          case 'UPI':
                            return '📱'
                          case 'CASH':
                            return '💵'
                          case 'BANK':
                            return '🏦'
                          case 'WALLET':
                            return '👛'
                          default:
                            return '💳'
                        }
                      })()}
                    </span>
                  </div>
                  <div>
                    <Text size="xs" fw="600" c="gray.8">
                      {addSubscriptionData.paymentMethod ? 
                        `${addSubscriptionData.paymentMethod.charAt(0) + addSubscriptionData.paymentMethod.slice(1).toLowerCase()} Payment` : 
                        'Payment Options Available'
                      }
                    </Text>
                    {addSubscriptionData.paymentMethod && (
                      <Text size="xs" c="gray.6">
                        {(() => {
                          switch (addSubscriptionData.paymentMethod) {
                            case 'BIZPOINTS':
                              return 'Instant activation with BizCoins'
                            case 'CREDIT':
                              return 'Using available credit balance'
                            case 'RAZORPAY':
                              return 'Secure online payment gateway'
                            case 'UPI':
                              return 'Unified Payment Interface'
                            case 'CASH':
                              return 'Manual cash transaction'
                            case 'BANK':
                              return 'Direct bank transfer'
                            case 'WALLET':
                              return 'Digital wallet payment'
                            default:
                              return 'Select your preferred payment method'
                          }
                        })()}
                      </Text>
                    )}
                  </div>
                </Group>
                
                <SimpleGrid cols={userCreditInfo && userBizCoinsInfo ? 2 : 1} spacing="md">
                  {/* BizCoins Section */}
                  {userBizCoinsInfo && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)',
                      border: '1px solid #a7f3d0'
                    }}>
                      <Group gap="xs" mb="xs">
                        <BizCoinIcon size={20} color="#059669" />
                        <Text size="xs" fw="600" c="green.8">BizCoins Wallet</Text>
                      </Group>
                      <Group justify="space-between" mb="xs">
                        <Text size="xs" c="green.7">Available Balance:</Text>
                        <Text size="xs" fw="700" c="green.8">₹{userBizCoinsInfo.bizCoinsBalance}</Text>
                      </Group>
                      <Text size="xs" c="green.6">
                        🚀 Instant activation • 1:1 conversion rate
                      </Text>
                    </div>
                  )}
                  
                  {/* Credit Section - Only show if user can use credit */}
                  {userCreditInfo && userCreditInfo.canUseCredit && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
                      border: '1px solid #93c5fd'
                    }}>
                      <Group gap="xs" mb="xs">
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: '4px',
                          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{ color: 'white', fontSize: '10px' }}>💳</span>
                        </div>
                        <Text size="xs" fw="600" c="blue.8">Credit Balance</Text>
                      </Group>
                      <Group justify="space-between" mb="xs">
                        <Text size="xs" c="blue.7">Available Credit:</Text>
                        <Text size="xs" fw="700" c="blue.8">₹{userCreditInfo.creditBalance}</Text>
                      </Group>
                      <Text size="xs" c="blue.6">
                        ⚡ {userCreditInfo.roleName} privilege enabled
                      </Text>
                    </div>
                  )}
                </SimpleGrid>
                
                {/* Smart Payment Status & Recommendation */}
                {addSubscriptionData.packageId && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    background: (() => {
                      const packagePrice = allPackages.find(p => p.id === addSubscriptionData.packageId)?.price || 0
                      if (addSubscriptionData.paymentMethod === 'BIZPOINTS' && userBizCoinsInfo) {
                        return userBizCoinsInfo.bizCoinsBalance >= packagePrice 
                          ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                      } else if (addSubscriptionData.paymentMethod === 'CREDIT' && userCreditInfo) {
                        return userCreditInfo.creditBalance >= packagePrice 
                          ? 'rgba(20, 184, 166, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                      }
                      return 'rgba(139, 92, 246, 0.1)'
                    })(),
                    border: (() => {
                      const packagePrice = allPackages.find(p => p.id === addSubscriptionData.packageId)?.price || 0
                      if (addSubscriptionData.paymentMethod === 'BIZPOINTS' && userBizCoinsInfo) {
                        return userBizCoinsInfo.bizCoinsBalance >= packagePrice 
                          ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                      } else if (addSubscriptionData.paymentMethod === 'CREDIT' && userCreditInfo) {
                        return userCreditInfo.creditBalance >= packagePrice 
                          ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                      }
                      return '1px solid rgba(139, 92, 246, 0.2)'
                    })()
                  }}>
                    {(() => {
                      const packagePrice = allPackages.find(p => p.id === addSubscriptionData.packageId)?.price || 0
                      const canUseBizCoins = userBizCoinsInfo && userBizCoinsInfo.bizCoinsBalance >= packagePrice
                      const canUseCredit = userCreditInfo && userCreditInfo.canUseCredit && userCreditInfo.creditBalance >= packagePrice
                      
                      // Show payment status if specific method is selected
                      if (addSubscriptionData.paymentMethod === 'BIZPOINTS' && userBizCoinsInfo) {
                        const sufficient = userBizCoinsInfo.bizCoinsBalance >= packagePrice
                        return (
                          <>
                            <Text size="xs" fw="500" c={sufficient ? "green.8" : "red.8"} mb="xs">
                              {sufficient ? "✅ BizCoins Payment Ready" : "❌ Insufficient BizCoins"}
                            </Text>
                            <Group justify="space-between" mb="xs">
                              <Text size="xs" c="gray.6">Package Price:</Text>
                              <Text size="xs" fw="600">₹{packagePrice}</Text>
                            </Group>
                            <Group justify="space-between">
                              <Text size="xs" c="gray.6">Available Balance:</Text>
                              <Text size="xs" fw="600" c={sufficient ? "green.7" : "red.7"}>₹{userBizCoinsInfo.bizCoinsBalance}</Text>
                            </Group>
                          </>
                        )
                      } else if (addSubscriptionData.paymentMethod === 'CREDIT' && userCreditInfo) {
                        const sufficient = userCreditInfo.creditBalance >= packagePrice
                        return (
                          <>
                            <Text size="xs" fw="500" c={sufficient ? "teal.8" : "red.8"} mb="xs">
                              {sufficient ? "✅ Credit Payment Ready" : "❌ Insufficient Credit"}
                            </Text>
                            <Group justify="space-between" mb="xs">
                              <Text size="xs" c="gray.6">Package Price:</Text>
                              <Text size="xs" fw="600">₹{packagePrice}</Text>
                            </Group>
                            <Group justify="space-between">
                              <Text size="xs" c="gray.6">Available Credit:</Text>
                              <Text size="xs" fw="600" c={sufficient ? "teal.7" : "red.7"}>₹{userCreditInfo.creditBalance}</Text>
                            </Group>
                          </>
                        )
                      } else {
                        // Show recommendations for other payment methods
                        return (
                          <>
                            <Text size="xs" fw="500" c="violet.8" mb="xs">💡 Smart Recommendation</Text>
                            {(() => {
                              if (canUseBizCoins && canUseCredit) {
                                return <Text size="xs" c="violet.7">Use BizCoins for instant activation or Credit for seamless payment</Text>
                              } else if (canUseBizCoins) {
                                return <Text size="xs" c="violet.7">Use BizCoins for instant subscription activation</Text>
                              } else if (canUseCredit) {
                                return <Text size="xs" c="violet.7">Use Credit Balance for seamless payment processing</Text>
                              } else {
                                return <Text size="xs" c="violet.7">Razorpay selected for secure online payment</Text>
                              }
                            })()}
                          </>
                        )
                      }
                    })()}
                  </div>
                )}
              </Card>
            )}

            <Select
              label="Package"
              placeholder="Select a package"
              required
              value={addSubscriptionData.packageId}
              onChange={(value) => {
                const selectedPackage = allPackages.find(p => p.id === value)
                setAddSubscriptionData(prev => ({ 
                  ...prev, 
                  packageId: value || '',
                  duration: selectedPackage?.duration || 0
                }))
              }}
              data={allPackages.map(pkg => ({
                value: pkg.id,
                label: `${pkg.name} - ₹${pkg.price} (${pkg.duration} days, ${pkg.messageLimit} msgs)`
              }))}
            />

            {/* Package Details Preview */}
            {addSubscriptionData.packageId && (
              <Card withBorder radius="md" p="sm" bg="blue.0">
                <Text size="xs" fw="500" c="blue.7" mb="xs">Package Details</Text>
                {(() => {
                  const selectedPkg = allPackages.find(p => p.id === addSubscriptionData.packageId)
                  if (!selectedPkg) return null
                  return (
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text size="xs">Price:</Text>
                        <Text size="xs" fw="bold" c="green.6">₹{selectedPkg.price}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="xs">Duration:</Text>
                        <Text size="xs" fw="bold">{selectedPkg.duration} days</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="xs">Message Limit:</Text>
                        <Text size="xs" fw="bold">{selectedPkg.messageLimit} messages</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="xs">Instance Limit:</Text>
                        <Text size="xs" fw="bold">{selectedPkg.instanceLimit} instances</Text>
                      </Group>
                    </Stack>
                  )
                })()}
              </Card>
            )}

            <Select
              label="Payment Method"
              placeholder="Select payment method"
              required
              value={addSubscriptionData.paymentMethod}
              onChange={(value) => {
                setAddSubscriptionData(prev => ({ ...prev, paymentMethod: value || 'RAZORPAY' }))
                // Fetch logged-in user's BizCoins info when BizCoins payment is selected
                if (value === 'BIZPOINTS') {
                  fetchLoggedInUserBizCoinsInfo()
                }
              }}
              data={getAvailablePaymentMethods()}
            />

            {/* Start Type Selection for Pre-Expiry Subscriptions */}
            <Select
              label="Subscription Start Type"
              placeholder="When should the subscription start?"
              required
              value={addSubscriptionData.startType}
              onChange={(value) => {
                const newStartType = (value as 'now' | 'after_expiry') || 'now'
                setAddSubscriptionData(prev => ({ 
                  ...prev, 
                  startType: newStartType,
                  startDate: newStartType === 'now' 
                    ? new Date() 
                    : (userActiveSubscription ? new Date(userActiveSubscription.endDate) : new Date())
                }))
              }}
              data={[
                { value: 'now', label: 'Start Immediately (Cancel current subscription if exists)' },
                { value: 'after_expiry', label: 'Start After Current Plan Expires (Schedule for later)' }
              ]}
              description="Choose whether to start the subscription immediately or schedule it for when the current plan expires"
            />

            {/* Payment Method Restriction Notice for Level 3+ */}
            {currentUserLevel !== null && currentUserLevel >= 3 && (
              <Alert color="blue" variant="light">
                <Text size="xs" fw="500">Payment Method Restriction</Text>
                <Text size="xs">
                  As a Level {currentUserLevel} user, you can only use <strong>Razorpay</strong> or <strong>BizCoins</strong> for subscription payments.
                </Text>
              </Alert>
            )}

            {/* Credit Payment Warning */}
            {addSubscriptionData.paymentMethod === 'CREDIT' && userCreditInfo && (
              <Alert color={userCreditInfo.creditBalance >= (allPackages.find(p => p.id === addSubscriptionData.packageId)?.price || 0) ? 'teal' : 'red'}>
                <Text size="xs" fw="500">Credit Payment Selected</Text>
                <Text size="xs">
                  Package Price: ₹{allPackages.find(p => p.id === addSubscriptionData.packageId)?.price || 0}
                </Text>
                <Text size="xs">
                  Your Balance: ₹{userCreditInfo.creditBalance}
                </Text>
                <Text size="xs" fw="500" 
                  c={userCreditInfo.creditBalance >= (allPackages.find(p => p.id === addSubscriptionData.packageId)?.price || 0) ? 'teal' : 'red'}>
                  {userCreditInfo.creditBalance >= (allPackages.find(p => p.id === addSubscriptionData.packageId)?.price || 0)
                    ? '✅ Subscription will be activated immediately after purchase'
                    : '❌ Insufficient credit balance'
                  }
                </Text>
              </Alert>
            )}


            <Group grow>
              <NumberInput
                label="Duration (Days)"
                placeholder="Enter duration"
                min={1}
                value={addSubscriptionData.duration}
                onChange={(value) => setAddSubscriptionData(prev => ({ ...prev, duration: Number(value) || 0 }))}
                readOnly
                disabled
                description="Duration is automatically set by selected package"
              />

              <DateInput
                label="Start Date"
                placeholder="Select start date"
                value={addSubscriptionData.startDate}
                onChange={(value) => setAddSubscriptionData(prev => ({ ...prev, startDate: value || new Date() }))}
                readOnly
                disabled
                description={
                  addSubscriptionData.startType === 'now' 
                    ? 'Start date is automatically set to today (immediate start)'
                    : userActiveSubscription
                      ? `Start date is automatically set to current plan expiry (${new Date(userActiveSubscription.endDate).toLocaleDateString()})`
                      : 'No active subscription found - will start immediately'
                }
              />
            </Group>

            <Group justify="flex-end" gap="md">
              <Button variant="subtle" onClick={() => setAddModalOpened(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSubscription} 
                loading={addLoading}
                color="green"
              >
                Create Subscription
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* View Subscription Modal */}
        <Modal
          opened={viewModalOpened}
          onClose={() => setViewModalOpened(false)}
          title="Subscription Details"
          size="xs"
        >
          {selectedSubscription && (
            <Stack gap="md">
              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">Subscription ID</Text>
                  <Text fw="bold" ff="monospace">{selectedSubscription.id}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Status</Text>
                  <Badge color={getStatusColor(selectedSubscription.status)} variant="light">
                    {selectedSubscription.status}
                  </Badge>
                </Box>
              </Group>

              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">User</Text>
                  <Text fw="bold">{selectedSubscription.user.name}</Text>
                  <Text size="xs" c="dimmed">{selectedSubscription.user.email}</Text>
                  {selectedSubscription.user.dealerCode && (
                    <Badge size="xs" color="teal" variant="light" mt="xs">
                      Dealer: {selectedSubscription.user.dealerCode}
                    </Badge>
                  )}
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Package</Text>
                  <Text fw="bold">{selectedSubscription.package.name}</Text>
                  <Text size="xs" c="dimmed">{selectedSubscription.package.description}</Text>
                </Box>
              </Group>

              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">Payment Method</Text>
                  <Badge color="blue" variant="light">
                    {selectedSubscription.paymentMethod}
                  </Badge>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Created By</Text>
                  <Text fw="bold">{selectedSubscription.creator.name}</Text>
                  <Text size="xs" c="dimmed">{selectedSubscription.creator.email}</Text>
                </Box>
              </Group>

              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">Price</Text>
                  <Text fw="bold" size="xs" c="green.6">
                    <FaRupeeSign style={{ display: 'inline', marginRight: '4px' }} />
                    {selectedSubscription.package.price.toFixed(2)}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Duration</Text>
                  <Text fw="bold">{selectedSubscription.package.duration} days</Text>
                </Box>
              </Group>

              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">Message Usage</Text>
                  <Text fw="bold">
                    {selectedSubscription.messagesUsed} / {selectedSubscription.package.messageLimit}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Instance Limit</Text>
                  <Text fw="bold">{selectedSubscription.package.instanceLimit}</Text>
                </Box>
              </Group>

              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">Start Date</Text>
                  <Text>{new Date(selectedSubscription.startDate).toLocaleString()}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">End Date</Text>
                  <Text>{new Date(selectedSubscription.endDate).toLocaleString()}</Text>
                </Box>
              </Group>

              <Group grow>
                <Box>
                  <Text size="xs" c="dimmed">Created At</Text>
                  <Text>{new Date(selectedSubscription.createdAt).toLocaleString()}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Updated At</Text>
                  <Text>{new Date(selectedSubscription.updatedAt).toLocaleString()}</Text>
                </Box>
              </Group>
            </Stack>
          )}
        </Modal>

        {/* Edit Subscription Modal */}
        <Modal
          opened={editModalOpened}
          onClose={() => setEditModalOpened(false)}
          title="Edit Subscription"
          size="xs"
        >
          {selectedSubscription && (
            <Stack gap="md">
              <Select
                label="User"
                placeholder="Select a user"
                required
                value={editSubscriptionData.userId}
                onChange={(value) => setEditSubscriptionData(prev => ({ ...prev, userId: value || '' }))}
                data={allUsers.map(user => ({
                  value: user.id.toString(),
                  label: `${user.name} (${user.email})`
                }))}
              />

              <Select
                label="Package"
                placeholder="Select a package"
                required
                value={editSubscriptionData.packageId}
                onChange={(value) => setEditSubscriptionData(prev => ({ ...prev, packageId: value || '' }))}
                data={allPackages.map(pkg => ({
                  value: pkg.id,
                  label: `${pkg.name} - ₹${pkg.price} (${pkg.duration} days)`
                }))}
              />

              <Select
                label="Payment Method"
                placeholder="Select payment method"
                required
                value={editSubscriptionData.paymentMethod}
                onChange={(value) => setEditSubscriptionData(prev => ({ ...prev, paymentMethod: value || 'RAZORPAY' }))}
                data={getAvailablePaymentMethods()}
              />

              {/* Payment Method Restriction Notice for Level 3+ in Edit Modal */}
              {currentUserLevel !== null && currentUserLevel >= 3 && (
                <Alert color="blue" variant="light">
                  <Text size="xs" fw="500">Payment Method Restriction</Text>
                  <Text size="xs">
                    As a Level {currentUserLevel} user, you can only use <strong>Razorpay</strong> or <strong>BizCoins</strong> for subscription payments.
                  </Text>
                </Alert>
              )}

              <Group grow>
                <DateInput
                  label="Start Date"
                  placeholder="Select start date"
                  value={editSubscriptionData.startDate}
                  onChange={(value) => setEditSubscriptionData(prev => ({ ...prev, startDate: value || new Date() }))}
                />

                <DateInput
                  label="End Date"
                  placeholder="Select end date"
                  value={editSubscriptionData.endDate}
                  onChange={(value) => setEditSubscriptionData(prev => ({ ...prev, endDate: value || new Date() }))}
                />
              </Group>

              <NumberInput
                label="Messages Used"
                min={0}
                value={editSubscriptionData.messagesUsed}
                onChange={(value) => setEditSubscriptionData(prev => ({ ...prev, messagesUsed: Number(value) || 0 }))}
              />

              <Group justify="flex-end" gap="md">
                <Button variant="subtle" onClick={() => setEditModalOpened(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateSubscription} 
                  loading={editLoading}
                  color="orange"
                >
                  Update Subscription
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          opened={deleteModalOpened}
          onClose={() => setDeleteModalOpened(false)}
          title="Delete Subscription"
          size="xs"
        >
          {selectedSubscription && (
            <Stack gap="md">
              <Text>
                Are you sure you want to delete this subscription? This action cannot be undone.
              </Text>
              
              <Box p="md" style={{ backgroundColor: 'var(--mantine-color-red-0)', borderRadius: '8px' }}>
                <Text size="xs" c="dimmed">Subscription ID</Text>
                <Text fw="bold" ff="monospace">{selectedSubscription.id}</Text>
                <Text size="xs" c="dimmed" mt="xs">User</Text>
                <Text fw="bold">{selectedSubscription.user.name}</Text>
                <Text size="xs" c="dimmed" mt="xs">Package</Text>
                <Text fw="bold" c="red">{selectedSubscription.package.name}</Text>
              </Box>

              <Group justify="flex-end" gap="md">
                <Button variant="subtle" onClick={() => setDeleteModalOpened(false)}>
                  Cancel
                </Button>
                <Button 
                  color="red" 
                  onClick={confirmDeleteSubscription}
                  loading={deleteLoading}
                >
                  Delete Subscription
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>

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

        {/* Payment Iframe Modal for RAZORPAY subscriptions */}
        {selectedPackageForPayment && (
          <PaymentIframe
            opened={paymentIframeOpened}
            onClose={() => {
              setPaymentIframeOpened(false)
              setSelectedPackageForPayment(null)
              setAddModalOpened(true) // Reopen add modal if user cancels payment
            }}
            package={selectedPackageForPayment}
            customerId={addSubscriptionData.userId}
            customerEmail={allUsers.find(u => u.id.toString() === addSubscriptionData.userId)?.email || ''}
            customerPhone={allUsers.find(u => u.id.toString() === addSubscriptionData.userId)?.mobile || ''}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
          />
        )}
        </Stack>
      </ModernContainer>
    </AdminLayout>
    </PagePermissionGuard>
  )
}