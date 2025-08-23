'use client'

import {
  Box,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  Card,
  Table,
  SimpleGrid,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Switch,
  Loader,
  Alert,
  Menu,
  Tooltip,
  Paper,
  ThemeIcon,
  Center
} from '@mantine/core'
import { 
  FiPackage, 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiEye,
  FiCheck,
  FiX,
  FiInfo,
  FiSettings,
  FiDollarSign,
  FiUsers,
  FiSmartphone,
  FiDatabase,
  FiKey,
  FiMail,
  FiLink,
  FiMessageCircle
} from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { notifications } from '@mantine/notifications'
import { usePermissions } from '@/hooks/usePermissions'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { useDisclosure } from '@mantine/hooks'
import PackageFormModal from './PackageFormModal'
import PaymentModal from '@/components/payments/PaymentModal'
import { 
  ModernCard, 
  ModernButton, 
  ModernAlert,
  ModernContainer
} from '@/components/ui/modern-components'
import {
  ResponsiveGrid,
  ResponsiveStack
} from '@/components/ui/responsive-layout'

interface Package {
  id: string
  name: string
  description?: string
  price: number
  offer_price?: number
  offer_enabled: boolean
  duration: number // in days
  messageLimit: number
  instanceLimit: number
  features: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
  mobile_accounts_limit: number
  contact_limit: number
  api_key_limit: number
  receive_msg_limit: number
  webhook_limit: number
  footmark_enabled: boolean
  footmark_text: string
  package_color: string
}

function PackageCard({ pkg, onEdit, onView, onDelete, onToggleStatus, onPurchase }: {
  pkg: Package
  onEdit: (pkg: Package) => void
  onView: (pkg: Package) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, isActive: boolean) => void
  onPurchase: (pkg: Package) => void
}) {
  const { hasPermission } = usePermissions()

  // Get plan category and colors for marketplace-ready design
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
  const colors = getColorScheme(pkg.package_color || 'blue')

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
        
        <Group justify="space-between" mb="xs">
          <div>
            <Text fw={700} size="xl" c="white">{pkg.name}</Text>
            <Badge color={colors.badgeColor} variant="light" mt="xs">
              {category.charAt(0).toUpperCase() + category.slice(1)} Plan
            </Badge>
          </div>
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="light" color="white" size="lg">
                <FiSettings size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<FiEye size={14} />} onClick={() => onView(pkg)}>
                View Details
              </Menu.Item>
              <PermissionGuard permission="packages.update">
                <Menu.Item leftSection={<FiEdit3 size={14} />} onClick={() => onEdit(pkg)}>
                  Edit Package
                </Menu.Item>
                <Menu.Item
                  leftSection={pkg.isActive ? <FiX size={14} /> : <FiCheck size={14} />}
                  onClick={() => onToggleStatus(pkg.id, !pkg.isActive)}
                  color={pkg.isActive ? 'red' : 'green'}
                >
                  {pkg.isActive ? 'Deactivate' : 'Activate'}
                </Menu.Item>
              </PermissionGuard>
              <PermissionGuard permission="packages.delete">
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<FiTrash2 size={14} />}
                  onClick={() => onDelete(pkg.id)}
                >
                  Delete Package
                </Menu.Item>
              </PermissionGuard>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Price Display */}
        <Group justify="center" mt="md">
          {pkg.offer_enabled && pkg.offer_price ? (
            <Stack gap="xs" align="center">
              <Group gap={4} align="baseline">
                <Text size="lg" c="white" td="line-through" opacity={0.6}>
                  ₹{pkg.price.toLocaleString()}
                </Text>
                <Badge color="red" variant="filled" size="sm">
                  {(((pkg.price - pkg.offer_price) / pkg.price) * 100).toFixed(0)}% OFF
                </Badge>
              </Group>
              <Group gap={4} align="baseline">
                <FaRupeeSign size={24} color="white" />
                <Text size="3rem" fw={900} c="white">{pkg.offer_price.toLocaleString()}</Text>
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

        {/* Status Badge */}
        <Group justify="center" mt="sm">
          <Badge 
            color={pkg.isActive ? 'green' : 'red'} 
            variant="filled"
            size="md"
            style={{ backgroundColor: pkg.isActive ? '#10b981' : '#ef4444' }}
          >
            {pkg.isActive ? 'Active' : 'Inactive'}
          </Badge>
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
              <FiMail size={16} color={colors.primary} />
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
              <FiSmartphone size={16} color={colors.primary} />
              <div>
                <Text size="sm" fw={600} c={colors.accent}>
                  {pkg.mobile_accounts_limit === 0 ? 'Unlimited' : pkg.mobile_accounts_limit}
                </Text>
                <Text size="xs" c="dimmed">Mobile Accounts</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" bg={colors.light} radius="md" style={{ border: `1px solid ${colors.primary}20` }}>
            <Group gap="xs" justify="center">
              <FiUsers size={16} color={colors.primary} />
              <div>
                <Text size="sm" fw={600} c={colors.accent}>
                  {pkg.contact_limit === 0 ? 'Unlimited' : pkg.contact_limit.toLocaleString()}
                </Text>
                <Text size="xs" c="dimmed">Contacts</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" bg={colors.light} radius="md" style={{ border: `1px solid ${colors.primary}20` }}>
            <Group gap="xs" justify="center">
              <FiKey size={16} color={colors.primary} />
              <div>
                <Text size="sm" fw={600} c={colors.accent}>
                  {pkg.api_key_limit === 0 ? 'Unlimited' : pkg.api_key_limit}
                </Text>
                <Text size="xs" c="dimmed">API Keys</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Additional Features */}
        <Stack gap="sm">
          <Group justify="space-between" p="xs" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
            <Group gap="xs">
              <FiMessageCircle size={14} color={colors.primary} />
              <Text size="sm" c={colors.accent}>Receive Messages</Text>
            </Group>
            <Text size="sm" fw={600}>
              {pkg.receive_msg_limit === 0 ? 'Unlimited' : `${pkg.receive_msg_limit.toLocaleString()}/month`}
            </Text>
          </Group>
          
          <Group justify="space-between" p="xs" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
            <Group gap="xs">
              <FiLink size={14} color={colors.primary} />
              <Text size="sm" c={colors.accent}>Webhooks</Text>
            </Group>
            <Text size="sm" fw={600}>
              {pkg.webhook_limit === 0 ? 'Unlimited' : pkg.webhook_limit}
            </Text>
          </Group>
          
          <Group justify="space-between" p="xs" style={{ backgroundColor: colors.light, borderRadius: '8px' }}>
            <Group gap="xs">
              <FiInfo size={14} color={colors.primary} />
              <Text size="sm" c={colors.accent}>Message Footmark</Text>
            </Group>
            <Badge size="sm" variant="light" color={pkg.footmark_enabled ? 'orange' : 'green'}>
              {pkg.footmark_enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </Group>
          
          {pkg.footmark_enabled && (
            <Text size="xs" c="dimmed" fs="italic" ta="center" p="xs" style={{ backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              "{pkg.footmark_text}"
            </Text>
          )}
        </Stack>

        {/* Action Buttons for Marketplace */}
        <Group justify="center" mt="lg" gap="md">
          <Button
            variant="outline"
            color={colors.badgeColor}
            leftSection={<FiEye size={14} />}
            onClick={() => onView(pkg)}
            style={{ borderColor: colors.primary, color: colors.primary }}
          >
            View Details
          </Button>
          {pkg.isActive && (
            <Button
              variant="filled"
              color="green"
              leftSection={<FiDollarSign size={14} />}
              onClick={() => onPurchase(pkg)}
              style={{ backgroundColor: '#10b981' }}
            >
              Purchase Now
            </Button>
          )}
          <PermissionGuard permission="packages.update">
            <Button
              variant="light"
              color={colors.badgeColor}
              leftSection={<FiEdit3 size={14} />}
              onClick={() => onEdit(pkg)}
              size="sm"
            >
              Edit
            </Button>
          </PermissionGuard>
        </Group>
      </Box>
    </Card>
  )
}

function PackageManagementContent() {
  const { data: session } = useSession()
  const { hasPermission } = usePermissions()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [isModalOpen, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [isViewMode, setIsViewMode] = useState(false)
  const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false)
  const [selectedPackageForPurchase, setSelectedPackageForPurchase] = useState<Package | null>(null)

  // Custom close handler to properly reset state
  const handleCloseModal = () => {
    setSelectedPackage(null)
    setIsViewMode(false)
    closeModal()
  }

  // Load packages
  useEffect(() => {
    if (session?.user) {
      loadPackages()
    }
  }, [session])

  const loadPackages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/packages')
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
        message: 'Failed to connect to API',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePackage = () => {
    setSelectedPackage(null)
    setIsViewMode(false)
    openModal()
  }

  const handleEditPackage = (pkg: Package) => {
    setSelectedPackage(pkg)
    setIsViewMode(false)
    openModal()
  }

  const handleViewPackage = (pkg: Package) => {
    setSelectedPackage(pkg)
    setIsViewMode(true)
    openModal()
  }

  const handlePurchasePackage = (pkg: Package) => {
    setSelectedPackageForPurchase(pkg)
    openPaymentModal()
  }

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return

    try {
      const response = await fetch(`/api/packages?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: data.message,
          color: 'green'
        })
        loadPackages()
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to delete package',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete package',
        color: 'red'
      })
    }
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/packages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, isActive })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: data.message,
          color: 'green'
        })
        loadPackages()
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to update package',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update package',
        color: 'red'
      })
    }
  }

  const handlePackageSave = async (packageData: Partial<Package>) => {
    try {
      const isEdit = selectedPackage !== null
      const response = await fetch('/api/packages', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(isEdit ? { ...packageData, id: selectedPackage.id } : packageData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: data.message,
          color: 'green'
        })
        handleCloseModal()
        loadPackages()
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || `Failed to ${isEdit ? 'update' : 'create'} package`,
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to ${selectedPackage ? 'update' : 'create'} package`,
        color: 'red'
      })
    }
  }

  const handlePaymentSuccess = (paymentData: any) => {
    notifications.show({
      title: 'Purchase Successful!',
      message: `Successfully purchased ${selectedPackageForPurchase?.name}`,
      color: 'green',
      icon: <FiCheck />
    })
    
    // Close payment modal and reset state
    closePaymentModal()
    setSelectedPackageForPurchase(null)
    
    // Optionally refresh packages or show subscription details
    loadPackages()
  }

  return (
    <ModernContainer fluid>
      <ResponsiveStack gap="xl">
        {/* Enhanced Header */}
        <ModernCard
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.03) 100%)',
            border: '2px solid rgba(99, 102, 241, 0.15)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.08)',
            padding: '32px'
          }}
        >
          <Group justify="space-between" align="flex-start">
            <Group gap="lg">
              <ThemeIcon 
                size="2xl" 
                variant="gradient" 
                gradient={{ from: 'indigo.6', to: 'blue.5', deg: 135 }}
                style={{
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
                }}
              >
                <FiPackage size={28} />
              </ThemeIcon>
              <Box>
                <Title 
                  order={2} 
                  mb={8}
                  style={{
                    background: 'linear-gradient(135deg, var(--mantine-color-indigo-7) 0%, var(--mantine-color-blue-6) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Package Management
                </Title>
                <Text c="dimmed" size="md" fw={500} mb="lg">
                  Manage subscription packages and pricing plans with comprehensive analytics
                </Text>
                
                {/* Quick Stats Bar */}
                <Group gap="xl">
                  <Group gap="xs">
                    <FiPackage size={16} color="var(--mantine-color-indigo-6)" />
                    <Text size="sm" c="dimmed">Total Packages:</Text>
                    <Text size="sm" fw={700} c="indigo.7">
                      {packages.length}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <FiCheck size={16} color="var(--mantine-color-green-6)" />
                    <Text size="sm" c="dimmed">Active:</Text>
                    <Text size="sm" fw={700} c="green.7">
                      {packages.filter(p => p.isActive).length}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <FiDollarSign size={16} color="var(--mantine-color-blue-6)" />
                    <Text size="sm" c="dimmed">Price Range:</Text>
                    <Text size="sm" fw={700} c="blue.7">
                      ₹{Math.min(...packages.map(p => p.offer_enabled && p.offer_price ? p.offer_price : p.price), 0)} - ₹{Math.max(...packages.map(p => p.price), 0)}
                    </Text>
                  </Group>
                </Group>
              </Box>
            </Group>
            
            <PermissionGuard permission="packages.create">
              <ModernButton
                leftSection={<FiPlus size={16} />}
                onClick={handleCreatePackage}
                style={{
                  background: 'linear-gradient(135deg, var(--mantine-color-indigo-6) 0%, var(--mantine-color-blue-5) 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                Create Package
              </ModernButton>
            </PermissionGuard>
          </Group>
        </ModernCard>

        {loading ? (
          <Center>
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.03) 100%)',
                border: '2px solid rgba(99, 102, 241, 0.15)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center'
              }}
            >
              <Stack align="center" gap="lg">
                <ThemeIcon 
                  size="4xl" 
                  variant="gradient" 
                  gradient={{ from: 'indigo.5', to: 'blue.4', deg: 135 }}
                  style={{
                    animation: 'pulse 2s infinite'
                  }}
                >
                  <FiPackage size={48} />
                </ThemeIcon>
                <Box>
                  <Text size="lg" fw={600} c="indigo.7" mb={3}>
                    Loading Packages
                  </Text>
                  <Text size="sm" c="dimmed" fw={400}>
                    Fetching subscription plans and pricing information
                  </Text>
                </Box>
                <Loader variant="dots" size="lg" color="indigo" />
              </Stack>
            </ModernCard>
          </Center>
        ) : (
          <ResponsiveGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xl">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onEdit={handleEditPackage}
                onView={handleViewPackage}
                onDelete={handleDeletePackage}
                onToggleStatus={handleToggleStatus}
                onPurchase={handlePurchasePackage}
              />
            ))}
          </ResponsiveGrid>
        )}

        {packages.length === 0 && !loading && (
          <ModernAlert variant="info" title="No packages found">
            <Group gap="sm">
              <FiInfo size={16} />
              <Text size="sm">
                Create your first package to get started with subscription management.
              </Text>
            </Group>
          </ModernAlert>
        )}

      {/* Package Form Modal */}
      <PackageFormModal
        key={`${selectedPackage?.id || 'new'}-${isViewMode ? 'view' : 'edit'}`}
        opened={isModalOpen}
        onClose={handleCloseModal}
        onSave={handlePackageSave}
        package={selectedPackage}
        isViewMode={isViewMode}
      />

      {/* Payment Modal */}
      <PaymentModal
        opened={paymentModalOpened}
        onClose={closePaymentModal}
        package={selectedPackageForPurchase}
        customerId={session?.user?.id || 'demo-customer'}
        customerEmail={session?.user?.email || 'demo@example.com'}
        customerPhone={session?.user?.phone || '+1234567890'}
        onPaymentSuccess={handlePaymentSuccess}
      />
      </ResponsiveStack>
    </ModernContainer>
  )
}

export default function PackageManagement() {
  return (
    <PermissionGuard permission="packages.read">
      <PackageManagementContent />
    </PermissionGuard>
  )
}