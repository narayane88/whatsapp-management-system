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
  SimpleGrid,
  Alert,
  LoadingOverlay,
  Modal,
  Progress,
  NumberFormatter,
  ActionIcon,
  Tooltip,
  Box,
  Paper,
  Loader
} from '@mantine/core'
import {
  IconPackage,
  IconCheck,
  IconX,
  IconCrown,
  IconRefresh,
  IconCalendar,
  IconMessage,
  IconDeviceMobile,
  IconUsers,
  IconKey,
  IconWebhook,
  IconBrandWhatsapp,
  IconInfoCircle,
  IconStar,
  IconGift,
  IconMail,
  IconLink,
  IconMessageCircle
} from '@tabler/icons-react'
import { FaRupeeSign } from 'react-icons/fa'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import CustomerHeader from '@/components/customer/CustomerHeader'
import PaymentModal from '@/components/payments/PaymentModal'
import PaymentIframe from '@/components/payments/PaymentIframe'
import * as Icons from 'react-icons/fi'

interface Package {
  id: string
  name: string
  description: string
  price: number
  offerPrice?: number
  offerEnabled: boolean
  duration: number
  messageLimit: number
  instanceLimit: number
  mobileAccountsLimit: number
  contactLimit: number
  apiKeyLimit: number
  receiveMessageLimit: number
  webhookLimit: number
  footmarkEnabled: boolean
  footmarkText?: string
  packageColor: string
  features: Record<string, any>
}

interface CurrentSubscription {
  id: string
  packageId: string
  packageName: string
  startDate: string
  endDate: string
  isActive: boolean
  messagesUsed: number
  messageLimit: number
  paymentMethod: string
  status: string
  price: number
  daysRemaining: number
}

interface SubscriptionData {
  packages: Package[]
  currentSubscription: CurrentSubscription | null
  subscriptionHistory: any[]
}

// Package Card Component matching admin design
function PackageCard({ pkg, currentSubscription, onSubscribe }: {
  pkg: Package
  currentSubscription: CurrentSubscription | null
  onSubscribe: (pkg: Package) => void
}) {
  // Get plan category and colors (same as admin)
  const getPlanCategory = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('basic') || lowerName.includes('starter')) return 'basic'
    if (lowerName.includes('professional') || lowerName.includes('pro') || lowerName.includes('business')) return 'professional'
    if (lowerName.includes('enterprise') || lowerName.includes('premium')) return 'enterprise'
    return 'basic'
  }

  const getColorScheme = (packageColor: string) => {
    switch (packageColor) {
      case 'blue':
        return {
          primary: '#3b82f6',
          light: 'blue.0',
          accent: 'blue.7',
          gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
          badgeColor: 'blue',
          name: 'Ocean Blue'
        }
      case 'purple':
        return {
          primary: '#8b5cf6',
          light: 'violet.0',
          accent: 'violet.7',
          gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
          badgeColor: 'violet',
          name: 'Royal Purple'
        }
      case 'emerald':
      case 'green':
        return {
          primary: '#10b981',
          light: 'emerald.0',
          accent: 'emerald.7',
          gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
          badgeColor: 'emerald',
          name: 'Emerald Green'
        }
      case 'orange':
        return {
          primary: '#f59e0b',
          light: 'orange.0',
          accent: 'orange.8',
          gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          badgeColor: 'orange',
          name: 'Sunset Orange'
        }
      case 'rose':
      case 'red':
        return {
          primary: '#f43f5e',
          light: 'rose.0',
          accent: 'rose.7',
          gradient: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
          badgeColor: 'rose',
          name: 'Rose Pink'
        }
      case 'slate':
        return {
          primary: '#64748b',
          light: 'slate.0',
          accent: 'slate.7',
          gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
          badgeColor: 'slate',
          name: 'Professional Slate'
        }
      default:
        return {
          primary: '#3b82f6',
          light: 'blue.0',
          accent: 'blue.7',
          gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
          badgeColor: 'blue',
          name: 'Ocean Blue'
        }
    }
  }

  const category = getPlanCategory(pkg.name)
  const colors = getColorScheme(pkg.packageColor || 'blue')
  const isCurrentPlan = currentSubscription?.packageId === pkg.id
  const hasActiveSubscription = currentSubscription?.status === 'ACTIVE'

  return (
    <Card shadow="lg" padding={0} radius="xl" withBorder style={{ overflow: 'hidden', position: 'relative' }}>
      {/* Gradient Header */}
      <Box
        style={{
          background: colors.gradient,
          padding: '1rem',
          color: 'white',
          position: 'relative'
        }}
      >
        {/* Popular badge for professional plans */}
        {category === 'professional' && (
          <Badge
            color="white"
            c={colors.primary}
            variant="filled"
            size="sm"
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem'
            }}
          >
            Most Popular
          </Badge>
        )}

        {/* Current Plan badge */}
        {isCurrentPlan && (
          <Badge
            color="green"
            variant="filled"
            size="sm"
            style={{
              position: 'absolute',
              top: '0.5rem',
              left: '0.5rem'
            }}
            leftSection={<IconCrown size="0.8rem" />}
          >
            Current Plan
          </Badge>
        )}
        
        <Group justify="center" mb="xs">
          <div style={{ textAlign: 'center' }}>
            <Text fw={700} size="xl" c="white">{pkg.name}</Text>
            <Badge color={colors.badgeColor} variant="light" mt="xs">
              {category.charAt(0).toUpperCase() + category.slice(1)} Plan
            </Badge>
          </div>
        </Group>

        {/* Price Display */}
        <Group justify="center" mt="md">
          {pkg.offerEnabled && pkg.offerPrice ? (
            <Stack gap="xs" align="center">
              <Group gap={4} align="baseline">
                <Text size="lg" c="white" td="line-through" opacity={0.6}>
                  ₹{pkg.price.toLocaleString()}
                </Text>
                <Badge color="red" variant="filled" size="sm">
                  {(((pkg.price - pkg.offerPrice) / pkg.price) * 100).toFixed(0)}% OFF
                </Badge>
              </Group>
              <Group gap={4} align="baseline">
                <FaRupeeSign size={24} color="white" />
                <Text size="3rem" fw={900} c="white">{pkg.offerPrice.toLocaleString()}</Text>
                <Text size="lg" c="white" opacity={0.8}>/{pkg.duration} days</Text>
              </Group>
            </Stack>
          ) : (
            <Group gap={4} align="baseline">
              <FaRupeeSign size={24} color="white" />
              <Text size="3rem" fw={900} c="white">{pkg.price.toLocaleString()}</Text>
              <Text size="lg" c="white" opacity={0.8}>/{pkg.duration} days</Text>
            </Group>
          )}
        </Group>
      </Box>

      {/* Card Content */}
      <Box p="lg">
        {pkg.description && (
          <Text size="sm" c="dimmed" mb="lg" ta="center" fs="italic">
            {pkg.description}
          </Text>
        )}

        {/* Feature Grid */}
        <SimpleGrid cols={2} spacing="md" mb="lg">
          <Paper p="md" bg={colors.light} radius="md" style={{ border: `1px solid ${colors.primary}20` }}>
            <Group gap="xs" justify="center">
              <IconMail size={16} color={colors.primary} />
              <div>
                <Text size="sm" fw={600} c={colors.accent}>
                  {pkg.messageLimit === 0 ? 'Unlimited' : pkg.messageLimit.toLocaleString()}
                </Text>
                <Text size="xs" c="dimmed">Messages</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" bg={colors.light} radius="md" style={{ border: `1px solid ${colors.primary}20` }}>
            <Group gap="xs" justify="center">
              <IconDeviceMobile size={16} color={colors.primary} />
              <div>
                <Text size="sm" fw={600} c={colors.accent}>
                  {pkg.mobileAccountsLimit === 0 ? 'Unlimited' : pkg.mobileAccountsLimit}
                </Text>
                <Text size="xs" c="dimmed">Mobile Accounts</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" bg={colors.light} radius="md" style={{ border: `1px solid ${colors.primary}20` }}>
            <Group gap="xs" justify="center">
              <IconUsers size={16} color={colors.primary} />
              <div>
                <Text size="sm" fw={600} c={colors.accent}>
                  {pkg.contactLimit === 0 ? 'Unlimited' : pkg.contactLimit.toLocaleString()}
                </Text>
                <Text size="xs" c="dimmed">Contacts</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" bg={colors.light} radius="md" style={{ border: `1px solid ${colors.primary}20` }}>
            <Group gap="xs" justify="center">
              <IconKey size={16} color={colors.primary} />
              <div>
                <Text size="sm" fw={600} c={colors.accent}>
                  {pkg.apiKeyLimit === 0 ? 'Unlimited' : pkg.apiKeyLimit}
                </Text>
                <Text size="xs" c="dimmed">API Keys</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Additional Features */}
        <Stack gap="sm" mb="lg">
          <Group justify="space-between" p="xs" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
            <Group gap="xs">
              <IconMessageCircle size={14} color={colors.primary} />
              <Text size="sm" c={colors.accent}>Receive Messages</Text>
            </Group>
            <Text size="sm" fw={600}>
              {pkg.receiveMessageLimit === 0 ? 'Unlimited' : `${pkg.receiveMessageLimit.toLocaleString()}/month`}
            </Text>
          </Group>
          
          <Group justify="space-between" p="xs" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
            <Group gap="xs">
              <IconLink size={14} color={colors.primary} />
              <Text size="sm" c={colors.accent}>Webhooks</Text>
            </Group>
            <Text size="sm" fw={600}>
              {pkg.webhookLimit === 0 ? 'Unlimited' : pkg.webhookLimit}
            </Text>
          </Group>
          
          <Group justify="space-between" p="xs" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
            <Group gap="xs">
              <IconInfoCircle size={14} color={colors.primary} />
              <Text size="sm" c={colors.accent}>Message Footmark</Text>
            </Group>
            <Badge size="sm" variant="light" color={pkg.footmarkEnabled ? 'orange' : 'green'}>
              {pkg.footmarkEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </Group>
          
          {pkg.footmarkEnabled && pkg.footmarkText && (
            <Text size="xs" c="dimmed" fs="italic" ta="center" p="xs" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              "{pkg.footmarkText}"
            </Text>
          )}
        </Stack>

        {/* Subscribe Now Button */}
        <Group justify="center">
          <Button
            fullWidth
            size="lg"
            variant="filled"
            color={colors.badgeColor}
            style={{ backgroundColor: colors.primary }}
            onClick={() => onSubscribe(pkg)}
            disabled={hasActiveSubscription}
            leftSection={isCurrentPlan ? <IconCrown size={18} /> : <IconPackage size={18} />}
          >
            {isCurrentPlan 
              ? 'Current Plan' 
              : hasActiveSubscription 
                ? 'Already Subscribed'
                : 'Subscribe Now'}
          </Button>
        </Group>
      </Box>
    </Card>
  )
}

export default function SubscriptionPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { isImpersonating, impersonationData } = useImpersonation()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false)
  const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false)
  const [paymentIframeOpened, { open: openPaymentIframe, close: closePaymentIframe }] = useDisclosure(false)
  const [paymentMethodModalOpened, { open: openPaymentMethodModal, close: closePaymentMethodModal }] = useDisclosure(false)

  useEffect(() => {
    fetchSubscriptionData()
  }, [isImpersonating, impersonationData])

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true)
      
      // Build URL with impersonation parameter if needed
      let url = '/api/customer/subscription'
      if (isImpersonating && impersonationData) {
        url += `?impersonatedCustomerId=${impersonationData.targetUser.id}`
      }
      
      const response = await fetch(url, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription data')
      }
      
      const result = await response.json()
      setData(result)
      
    } catch (error) {
      console.error('Error fetching subscription data:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch subscription data',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = (pkg: Package) => {
    if (data?.currentSubscription?.status === 'ACTIVE') {
      notifications.show({
        title: 'Active Subscription',
        message: 'You already have an active subscription. Please wait for it to expire.',
        color: 'orange'
      })
      return
    }
    
    setSelectedPackage(pkg)
    openPaymentMethodModal()
  }

  const handlePaymentMethodSelect = (method: 'modal' | 'iframe') => {
    closePaymentMethodModal()
    if (method === 'modal') {
      openPaymentModal()
    } else {
      openPaymentIframe()
    }
  }

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Payment successful:', paymentData)
    
    notifications.show({
      title: '🎉 Payment Successful!',
      message: `Welcome to ${selectedPackage?.name}! Your subscription is now active and will be processed shortly.`,
      color: 'green',
      icon: <Icons.FiCheck />
    })
    
    closePaymentModal()
    closePaymentIframe()
    setSelectedPackage(null)
    
    // Refresh subscription data after a short delay to allow webhook processing
    setTimeout(() => {
      fetchSubscriptionData()
    }, 3000)
  }

  const purchasePackage = async () => {
    if (!selectedPackage) return

    try {
      setPurchasing(true)

      const response = await fetch('/api/customer/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          packageId: selectedPackage.id,
          paymentMethod: 'razorpay'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Purchase failed')
      }

      const result = await response.json()

      notifications.show({
        title: '🎉 Subscription Activated!',
        message: `Your ${selectedPackage.name} subscription is now active!`,
        color: 'green'
      })

      closeConfirm()
      await fetchSubscriptionData()

    } catch (error) {
      console.error('Purchase error:', error)
      notifications.show({
        title: 'Purchase Failed',
        message: error instanceof Error ? error.message : 'There was an error processing your purchase',
        color: 'red'
      })
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div>
        <CustomerHeader 
          title="Subscription Plans"
          subtitle="Choose the perfect plan for your business needs"
          badge={{ label: 'Plans & Pricing', color: 'blue' }}
        />
        <Container size="xl" py="md">
          <Group justify="center" p="xl">
            <Loader size="lg" />
          </Group>
        </Container>
      </div>
    )
  }

  if (!data) {
    return (
      <div>
        <CustomerHeader 
          title="Subscription Plans"
          subtitle="Choose the perfect plan for your business needs"
          badge={{ label: 'Plans & Pricing', color: 'blue' }}
        />
        <Container size="xl" py="md">
          <Alert color="red">Failed to load subscription data</Alert>
        </Container>
      </div>
    )
  }

  return (
    <div>
      <CustomerHeader 
        title="Subscription Plans"
        subtitle="Choose the perfect plan for your business needs"
        badge={{ label: 'Plans & Pricing', color: 'blue' }}
      />
      
      <Container size="xl" py="md">
        <Stack gap="lg">
          {/* Current Subscription Summary */}
          {data.currentSubscription && (
            <Alert 
              icon={<IconCrown size="1.2rem" />} 
              title="Current Active Subscription" 
              color="blue"
              variant="light"
            >
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{data.currentSubscription.packageName}</Text>
                  <Text size="sm" c="dimmed">
                    {data.currentSubscription.daysRemaining} days remaining • 
                    {data.currentSubscription.messagesUsed}/{data.currentSubscription.messageLimit} messages used
                  </Text>
                </div>
                <Button 
                  variant="light" 
                  size="sm"
                  onClick={() => router.push('/customer/subscription/my-plans')}
                >
                  View Details
                </Button>
              </Group>
            </Alert>
          )}

          {/* Header */}
          <Group justify="space-between">
            <div>
              <Title order={2}>Available Plans</Title>
              <Text size="sm" c="dimmed">
                Choose from our selection of premium subscription plans
              </Text>
            </div>
            <Button
              variant="light"
              size="sm"
              onClick={fetchSubscriptionData}
              leftSection={<IconRefresh size="1rem" />}
            >
              Refresh
            </Button>
          </Group>

          {/* Package Cards Grid */}
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
            {data.packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                currentSubscription={data.currentSubscription}
                onSubscribe={handleSubscribe}
              />
            ))}
          </SimpleGrid>

          {data.packages.length === 0 && (
            <Alert
              icon={<IconInfoCircle size="1rem" />}
              title="No packages available"
              color="blue"
              variant="light"
            >
              No subscription packages are currently available. Please check back later.
            </Alert>
          )}

          {/* Info */}
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            <Text size="sm">
              <strong>Need help choosing?</strong> All plans include WhatsApp Business API access, 
              message scheduling, and 24/7 support. Contact us if you need a custom solution.
            </Text>
          </Alert>
        </Stack>
      </Container>

      {/* Purchase Confirmation Modal */}
      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title="Confirm Subscription"
        size="md"
      >
        {selectedPackage && (
          <Stack gap="md">
            <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa' }}>
              <Group justify="space-between" mb="md">
                <div>
                  <Text fw={600} size="lg">{selectedPackage.name}</Text>
                  <Text size="sm" c="dimmed">{selectedPackage.description}</Text>
                </div>
                <Text size="xl" fw={700}>
                  ₹{selectedPackage.offerEnabled && selectedPackage.offerPrice 
                    ? selectedPackage.offerPrice 
                    : selectedPackage.price}
                </Text>
              </Group>

              <SimpleGrid cols={2} spacing="sm">
                <div>
                  <Text size="xs" c="dimmed">Messages</Text>
                  <Text size="sm" fw={600}>
                    <NumberFormatter value={selectedPackage.messageLimit} thousandSeparator />
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">WhatsApp Accounts</Text>
                  <Text size="sm" fw={600}>{selectedPackage.mobileAccountsLimit}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Contacts</Text>
                  <Text size="sm" fw={600}>
                    <NumberFormatter value={selectedPackage.contactLimit} thousandSeparator />
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Duration</Text>
                  <Text size="sm" fw={600}>{selectedPackage.duration} days</Text>
                </div>
              </SimpleGrid>
            </Card>

            <Text size="sm" c="dimmed">
              Your subscription will be activated immediately and will expire after {selectedPackage.duration} days.
              You can upgrade or downgrade anytime.
            </Text>

            <Group justify="flex-end">
              <Button variant="light" onClick={closeConfirm} disabled={purchasing}>
                Cancel
              </Button>
              <Button
                onClick={purchasePackage}
                loading={purchasing}
                leftSection={<IconPackage size="1rem" />}
              >
                Subscribe Now
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Payment Method Selection Modal */}
      <Modal
        opened={paymentMethodModalOpened}
        onClose={closePaymentMethodModal}
        title="Select Payment Method"
        size="md"
        centered
      >
        <Stack gap="lg">
          <Text size="sm" c="dimmed" ta="center">
            Choose your preferred payment experience for {selectedPackage?.name}
          </Text>

          <Stack gap="md">
            <Card withBorder p="md" style={{ cursor: 'pointer' }} onClick={() => handlePaymentMethodSelect('iframe')}>
              <Group justify="space-between">
                <Stack gap="xs">
                  <Group gap="xs">
                    <Icons.FiMonitor size={20} color="#10b981" />
                    <Text size="md" fw={600}>Iframe Payment (Recommended)</Text>
                    <Badge size="sm" color="green">New</Badge>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Secure embedded payment form with modern experience
                  </Text>
                </Stack>
                <Icons.FiChevronRight size={20} />
              </Group>
            </Card>

            <Card withBorder p="md" style={{ cursor: 'pointer' }} onClick={() => handlePaymentMethodSelect('modal')}>
              <Group justify="space-between">
                <Stack gap="xs">
                  <Group gap="xs">
                    <Icons.FiCreditCard size={20} color="#3b82f6" />
                    <Text size="md" fw={600}>Traditional Modal</Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Classic popup-based payment experience
                  </Text>
                </Stack>
                <Icons.FiChevronRight size={20} />
              </Group>
            </Card>
          </Stack>

          <Alert icon={<Icons.FiInfo />} color="blue" variant="light">
            <Text size="sm">
              Both payment methods use the same secure Razorpay gateway. The iframe method provides a more seamless experience.
            </Text>
          </Alert>
        </Stack>
      </Modal>

      {/* Traditional Payment Modal */}
      <PaymentModal
        opened={paymentModalOpened}
        onClose={closePaymentModal}
        package={selectedPackage ? {
          id: selectedPackage.id,
          name: selectedPackage.name,
          price: selectedPackage.price,
          offer_price: selectedPackage.offerPrice,
          offer_enabled: selectedPackage.offerEnabled,
          duration: selectedPackage.duration,
          currency: 'INR'
        } : null}
        customerId={isImpersonating && impersonationData ? impersonationData.targetUser.id.toString() : session?.user?.id || 'unknown'}
        customerEmail={isImpersonating && impersonationData ? impersonationData.targetUser.email : session?.user?.email || 'unknown'}
        customerPhone="+1234567890"
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Iframe Payment Modal */}
      <PaymentIframe
        opened={paymentIframeOpened}
        onClose={closePaymentIframe}
        package={selectedPackage ? {
          id: selectedPackage.id,
          name: selectedPackage.name,
          price: selectedPackage.price,
          offer_price: selectedPackage.offerPrice,
          offer_enabled: selectedPackage.offerEnabled,
          duration: selectedPackage.duration,
          currency: 'INR'
        } : null}
        customerId={isImpersonating && impersonationData ? impersonationData.targetUser.id.toString() : session?.user?.id || 'unknown'}
        customerEmail={isImpersonating && impersonationData ? impersonationData.targetUser.email : session?.user?.email || 'unknown'}
        customerPhone="+1234567890"
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}