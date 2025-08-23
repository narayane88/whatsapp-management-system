'use client'

import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Stack,
  Group,
  Button,
  Badge,
  Paper,
  Box,
  Alert,
  Loader,
  Modal
} from '@mantine/core'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import * as Icons from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import PaymentModal from '@/components/payments/PaymentModal'
import PaymentIframe from '@/components/payments/PaymentIframe'

interface Package {
  id: string
  name: string
  description?: string
  price: number
  offer_price?: number
  offer_enabled: boolean
  duration: number
  messageLimit: number
  instanceLimit: number
  mobile_accounts_limit: number
  contact_limit: number
  api_key_limit: number
  receive_msg_limit: number
  webhook_limit: number
  footmark_enabled: boolean
  footmark_text: string
  package_color: string
  isActive: boolean
}

function PackageCard({ pkg, onPurchase }: { pkg: Package; onPurchase: (pkg: Package) => void }) {
  const getColorScheme = (packageColor: string) => {
    switch (packageColor) {
      case 'blue':
        return {
          primary: '#3b82f6',
          light: 'blue.0',
          gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
          badgeColor: 'blue'
        }
      case 'purple':
        return {
          primary: '#8b5cf6',
          light: 'violet.0',
          gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
          badgeColor: 'violet'
        }
      case 'emerald':
        return {
          primary: '#10b981',
          light: 'emerald.0',
          gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
          badgeColor: 'emerald'
        }
      case 'orange':
        return {
          primary: '#f59e0b',
          light: 'orange.0',
          gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          badgeColor: 'orange'
        }
      default:
        return {
          primary: '#3b82f6',
          light: 'blue.0',
          gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
          badgeColor: 'blue'
        }
    }
  }

  const colors = getColorScheme(pkg.package_color || 'blue')
  const finalAmount = pkg.offer_enabled && pkg.offer_price ? pkg.offer_price : pkg.price
  const discount = pkg.offer_enabled && pkg.offer_price ? pkg.price - pkg.offer_price : 0
  const discountPercentage = discount > 0 ? Math.round((discount / pkg.price) * 100) : 0

  return (
    <Card shadow="xl" padding={0} radius="xl" withBorder style={{ overflow: 'hidden', height: '100%' }}>
      {/* Header */}
      <Box
        style={{
          background: colors.gradient,
          padding: '1.5rem',
          color: 'white',
          position: 'relative'
        }}
      >
        {discount > 0 && (
          <Badge
            color="red"
            variant="filled"
            size="lg"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem'
            }}
          >
            {discountPercentage}% OFF
          </Badge>
        )}
        
        <Stack gap="md" align="center">
          <Title order={2} c="white" ta="center">{pkg.name}</Title>
          
          {pkg.description && (
            <Text size="sm" c="white" opacity={0.9} ta="center">
              {pkg.description}
            </Text>
          )}

          {/* Price Display */}
          <Stack gap="xs" align="center">
            {discount > 0 && (
              <Group gap={4} align="baseline">
                <Text size="lg" c="white" td="line-through" opacity={0.6}>
                  ₹{pkg.price.toLocaleString()}
                </Text>
              </Group>
            )}
            <Group gap={4} align="baseline">
              <FaRupeeSign size={28} color="white" />
              <Text size="3.5rem" fw={900} c="white">{finalAmount.toLocaleString()}</Text>
              <Text size="lg" c="white" opacity={0.8}>/{pkg.duration} days</Text>
            </Group>
          </Stack>
        </Stack>
      </Box>

      {/* Features */}
      <Box p="xl">
        <Stack gap="md">
          <Title order={4} ta="center" c="gray.7">What's Included</Title>
          
          <SimpleGrid cols={2} spacing="sm">
            <Paper p="sm" bg={colors.light} radius="md" ta="center">
              <Group gap="xs" justify="center">
                <Icons.FiMail size={16} color={colors.primary} />
                <div>
                  <Text size="sm" fw={600} c={colors.primary}>
                    {pkg.messageLimit === 0 ? 'Unlimited' : pkg.messageLimit.toLocaleString()}
                  </Text>
                  <Text size="xs" c="dimmed">Messages</Text>
                </div>
              </Group>
            </Paper>
            
            <Paper p="sm" bg={colors.light} radius="md" ta="center">
              <Group gap="xs" justify="center">
                <Icons.FiSmartphone size={16} color={colors.primary} />
                <div>
                  <Text size="sm" fw={600} c={colors.primary}>
                    {pkg.mobile_accounts_limit === 0 ? 'Unlimited' : pkg.mobile_accounts_limit}
                  </Text>
                  <Text size="xs" c="dimmed">Mobile Accounts</Text>
                </div>
              </Group>
            </Paper>
            
            <Paper p="sm" bg={colors.light} radius="md" ta="center">
              <Group gap="xs" justify="center">
                <Icons.FiUsers size={16} color={colors.primary} />
                <div>
                  <Text size="sm" fw={600} c={colors.primary}>
                    {pkg.contact_limit === 0 ? 'Unlimited' : pkg.contact_limit.toLocaleString()}
                  </Text>
                  <Text size="xs" c="dimmed">Contacts</Text>
                </div>
              </Group>
            </Paper>
            
            <Paper p="sm" bg={colors.light} radius="md" ta="center">
              <Group gap="xs" justify="center">
                <Icons.FiKey size={16} color={colors.primary} />
                <div>
                  <Text size="sm" fw={600} c={colors.primary}>
                    {pkg.api_key_limit === 0 ? 'Unlimited' : pkg.api_key_limit}
                  </Text>
                  <Text size="xs" c="dimmed">API Keys</Text>
                </div>
              </Group>
            </Paper>
          </SimpleGrid>

          {/* Additional Features */}
          <Stack gap="xs">
            <Group justify="space-between" p="xs" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
              <Group gap="xs">
                <Icons.FiMessageCircle size={14} color={colors.primary} />
                <Text size="sm" c={colors.primary}>Receive Messages</Text>
              </Group>
              <Text size="sm" fw={600}>
                {pkg.receive_msg_limit === 0 ? 'Unlimited' : `${pkg.receive_msg_limit.toLocaleString()}/month`}
              </Text>
            </Group>
            
            <Group justify="space-between" p="xs" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
              <Group gap="xs">
                <Icons.FiLink size={14} color={colors.primary} />
                <Text size="sm" c={colors.primary}>Webhooks</Text>
              </Group>
              <Text size="sm" fw={600}>
                {pkg.webhook_limit === 0 ? 'Unlimited' : pkg.webhook_limit}
              </Text>
            </Group>
            
            <Group justify="space-between" p="xs" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
              <Group gap="xs">
                <Icons.FiInfo size={14} color={colors.primary} />
                <Text size="sm" c={colors.primary}>Message Footmark</Text>
              </Group>
              <Badge size="sm" variant="light" color={pkg.footmark_enabled ? 'orange' : 'green'}>
                {pkg.footmark_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </Group>
          </Stack>

          {/* Purchase Button */}
          <Button
            size="lg"
            fullWidth
            variant="filled"
            color={colors.badgeColor}
            leftSection={<Icons.FiCreditCard size={18} />}
            onClick={() => onPurchase(pkg)}
            style={{ 
              backgroundColor: colors.primary,
              marginTop: '1rem'
            }}
          >
            Choose {pkg.name}
          </Button>
        </Stack>
      </Box>
    </Card>
  )
}

export default function CustomerPackagesPage() {
  const { data: session } = useSession()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false)
  const [paymentIframeOpened, { open: openPaymentIframe, close: closePaymentIframe }] = useDisclosure(false)
  const [paymentMethodModalOpened, { open: openPaymentMethodModal, close: closePaymentMethodModal }] = useDisclosure(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/packages')
      const data = await response.json()
      
      if (response.ok) {
        // Only show active packages to customers
        setPackages(data.packages?.filter((pkg: Package) => pkg.isActive) || [])
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to load packages',
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

  const handlePurchasePackage = (pkg: Package) => {
    if (!session) {
      notifications.show({
        title: 'Authentication Required',
        message: 'Please log in to purchase a package',
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
    notifications.show({
      title: 'Purchase Successful!',
      message: `Welcome to ${selectedPackage?.name}! Your subscription is now active.`,
      color: 'green',
      icon: <Icons.FiCheck />
    })
    
    closePaymentModal()
    closePaymentIframe()
    setSelectedPackage(null)
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Stack gap="md" align="center" ta="center">
          <Title order={1} size="3rem" gradient={{ from: 'blue', to: 'purple', deg: 45 }}>
            Choose Your Plan
          </Title>
          <Text size="xl" c="dimmed" maw={600}>
            Select the perfect WhatsApp Business plan for your needs. 
            All plans include our core features with flexible scalability.
          </Text>
        </Stack>

        {/* Packages Grid */}
        {loading ? (
          <Group justify="center" py="xl">
            <Loader size="lg" />
          </Group>
        ) : packages.length > 0 ? (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xl">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onPurchase={handlePurchasePackage}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Alert
            icon={<Icons.FiInfo size={16} />}
            title="No packages available"
            color="blue"
            variant="light"
          >
            No subscription packages are currently available. Please contact support for assistance.
          </Alert>
        )}

        {/* Features Comparison */}
        <Paper shadow="sm" p="xl" radius="lg" withBorder>
          <Stack gap="md" align="center">
            <Title order={3}>All Plans Include</Title>
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
              <Group gap="xs">
                <Icons.FiShield size={20} color="#10b981" />
                <Text size="sm" fw={500}>Secure & Reliable</Text>
              </Group>
              <Group gap="xs">
                <Icons.FiZap size={20} color="#10b981" />
                <Text size="sm" fw={500}>Real-time Messaging</Text>
              </Group>
              <Group gap="xs">
                <Icons.FiUsers size={20} color="#10b981" />
                <Text size="sm" fw={500}>Contact Management</Text>
              </Group>
              <Group gap="xs">
                <Icons.FiBarChart2 size={20} color="#10b981" />
                <Text size="sm" fw={500}>Analytics & Reports</Text>
              </Group>
            </SimpleGrid>
          </Stack>
        </Paper>
      </Stack>

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
        package={selectedPackage}
        customerId={session?.user?.id || ''}
        customerEmail={session?.user?.email || ''}
        customerPhone={session?.user?.phone || ''}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Iframe Payment Modal */}
      <PaymentIframe
        opened={paymentIframeOpened}
        onClose={closePaymentIframe}
        package={selectedPackage}
        customerId={session?.user?.id || ''}
        customerEmail={session?.user?.email || ''}
        customerPhone={session?.user?.phone || ''}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </Container>
  )
}