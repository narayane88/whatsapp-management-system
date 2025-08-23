'use client'

import {
  Modal,
  TextInput,
  Button,
  Stack,
  Group,
  Select,
  Textarea,
  Grid,
  Text,
  Divider,
  Alert,
  Badge
} from '@mantine/core'
import { FiInfo, FiUser } from 'react-icons/fi'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface CreateCustomerModalProps {
  opened: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CreateCustomerData {
  name: string
  email: string
  password: string
  phone?: string
  mobile?: string
  address?: string
  notes?: string
  dealerId?: string
  packageId?: string
  registrationSource: string
  language: string
}

interface Dealer {
  id: number
  name: string
  dealer_code: string
}

interface Package {
  id: number
  name: string
  price: number
  description: string
}

export default function CreateCustomerModal({
  opened,
  onClose,
  onSuccess
}: CreateCustomerModalProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null)
  const [isAutoAssignMode, setIsAutoAssignMode] = useState(false)

  const form = useForm<CreateCustomerData>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      mobile: '',
      address: '',
      notes: '',
      dealerId: '',
      packageId: '',
      registrationSource: 'admin_created',
      language: 'en'
    },
    validate: {
      name: (value) => !value.trim() ? 'Name is required' : null,
      email: (value) => {
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format'
        return null
      },
      password: (value) => {
        if (!value) return 'Password is required'
        if (value.length < 6) return 'Password must be at least 6 characters'
        return null
      },
      mobile: (value) => {
        if (value && value.length > 0 && !/^\+?[\d\s\-\(\)]{10,}$/.test(value)) {
          return 'Invalid mobile number format'
        }
        return null
      }
    }
  })

  // Load dealers and packages when modal opens
  useEffect(() => {
    if (opened) {
      loadFormData()
    }
  }, [opened])

  const loadFormData = async () => {
    setLoadingData(true)
    try {
      // Check if current user is a dealer
      if (session?.user?.email) {
        const currentUserResponse = await fetch('/api/users/current-debug')
        if (currentUserResponse.ok) {
          const currentUserData = await currentUserResponse.json()
          setCurrentUserInfo(currentUserData.user)
          
          // Check if current user is a dealer (auto-assign mode)
          const normalizedRole = currentUserData.user?.role?.toUpperCase().replace(/\s+/g, '')
          const isDealerRole = ['SUBDEALER', 'DEALER', 'SHREEDELALER', 'DELALER'].includes(normalizedRole)
          setIsAutoAssignMode(isDealerRole)
          
          if (isDealerRole) {
            console.log(`🎯 AUTO-ASSIGN MODE: Current user "${currentUserData.user?.name}" is a dealer (${currentUserData.user?.role})`)
          }
        }
      }

      // Load dealers (users with SUBDEALER role) - only if not in auto-assign mode
      if (!isAutoAssignMode) {
        const dealersResponse = await fetch('/api/users?level=3&is_active=true')
        if (dealersResponse.ok) {
          const dealersData = await dealersResponse.json()
          setDealers(dealersData.users || [])
        }
      }

      // Load packages
      const packagesResponse = await fetch('/api/packages?is_active=true')
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json()
        setPackages(packagesData.packages || [])
      }
    } catch (error) {
      console.error('Failed to load form data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (values: CreateCustomerData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          dealerId: values.dealerId || null,
          packageId: values.packageId || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create customer')
      }

      const data = await response.json()
      
      // Show success notification with auto-assignment info
      const baseMessage = `Customer "${values.name}" created successfully`
      let successMessage = baseMessage
      
      if (data.customer?.autoAssigned && data.dealerInfo) {
        successMessage = `${baseMessage}\n✅ Auto-assigned to dealer: ${data.dealerInfo.name}\n🏷️ Generated code: ${data.customer.dealerCode}`
      }
      
      notifications.show({
        title: 'Success',
        message: successMessage,
        color: 'green'
      })

      // Log for debugging
      if (data.customer?.autoAssigned) {
        console.log('✅ AUTO-ASSIGNMENT SUCCESS:', {
          customer: data.customer.name,
          dealerCode: data.customer.dealerCode,
          dealer: data.dealerInfo?.name
        })
      }

      form.reset()
      onSuccess()
      onClose()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create customer',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      form.reset()
      onClose()
    }
  }

  const dealerOptions = dealers.map(dealer => ({
    value: dealer.id.toString(),
    label: `${dealer.name} (${dealer.dealer_code})`
  }))

  const packageOptions = packages.map(pkg => ({
    value: pkg.id.toString(),
    label: `${pkg.name} - ₹${pkg.price}`
  }))

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'mr', label: 'Marathi' },
    { value: 'gu', label: 'Gujarati' },
    { value: 'bn', label: 'Bengali' },
    { value: 'ta', label: 'Tamil' },
    { value: 'te', label: 'Telugu' },
    { value: 'kn', label: 'Kannada' }
  ]

  const registrationSourceOptions = [
    { value: 'admin_created', label: 'Admin Created' },
    { value: 'web_registration', label: 'Web Registration' },
    { value: 'mobile_app', label: 'Mobile App' },
    { value: 'dealer_referral', label: 'Dealer Referral' },
    { value: 'bulk_import', label: 'Bulk Import' }
  ]

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Create New Customer"
      size="lg"
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <div>
            <Text size="sm" fw={600} mb="xs" c="dimmed">
              Basic Information
            </Text>
            <Grid>
              <Grid.Col span={12}>
                <TextInput
                  label="Full Name"
                  placeholder="Enter customer's full name"
                  required
                  {...form.getInputProps('name')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Email Address"
                  placeholder="customer@example.com"
                  required
                  type="email"
                  {...form.getInputProps('email')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Password"
                  placeholder="Minimum 6 characters"
                  required
                  type="password"
                  {...form.getInputProps('password')}
                />
              </Grid.Col>
            </Grid>
          </div>

          <Divider />

          {/* Contact Information */}
          <div>
            <Text size="sm" fw={600} mb="xs" c="dimmed">
              Contact Information
            </Text>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  {...form.getInputProps('phone')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Mobile Number"
                  placeholder="+91 98765 43210"
                  {...form.getInputProps('mobile')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Address"
                  placeholder="Enter customer's address"
                  autosize
                  minRows={2}
                  maxRows={4}
                  {...form.getInputProps('address')}
                />
              </Grid.Col>
            </Grid>
          </div>

          <Divider />

          {/* Auto-Assignment Information */}
          {isAutoAssignMode && currentUserInfo && (
            <Alert color="blue" title="Auto-Assignment Active" icon={<FiInfo size={16} />}>
              <Stack gap="xs">
                <Text size="sm">
                  As a dealer, customers you create will be automatically assigned to your account.
                </Text>
                <Group gap="md">
                  <Group gap="xs">
                    <FiUser size={14} />
                    <Text size="sm" fw={500}>Dealer:</Text>
                    <Badge color="blue" variant="light">{currentUserInfo.name}</Badge>
                  </Group>
                  <Group gap="xs">
                    <Text size="sm" fw={500}>Code:</Text>
                    <Badge color="orange" variant="light">{currentUserInfo.dealer_code}</Badge>
                  </Group>
                </Group>
                <Text size="xs" c="dimmed">
                  Customer will receive a unique dealer code like: {currentUserInfo.dealer_code}-CUST-XXXX
                </Text>
              </Stack>
            </Alert>
          )}

          {/* Assignment Information */}
          <div>
            <Text size="sm" fw={600} mb="xs" c="dimmed">
              {isAutoAssignMode ? 'Package Assignment' : 'Assignment & Package'}
            </Text>
            <Grid>
              {!isAutoAssignMode && (
                <Grid.Col span={6}>
                  <Select
                    label="Assign to Dealer"
                    placeholder="Select dealer (optional)"
                    data={dealerOptions}
                    searchable
                    clearable
                    disabled={loadingData}
                    {...form.getInputProps('dealerId')}
                  />
                </Grid.Col>
              )}
              <Grid.Col span={isAutoAssignMode ? 12 : 6}>
                <Select
                  label="Assign Package"
                  placeholder="Select package (optional)"
                  data={packageOptions}
                  searchable
                  clearable
                  disabled={loadingData}
                  {...form.getInputProps('packageId')}
                />
              </Grid.Col>
            </Grid>
          </div>

          <Divider />

          {/* Additional Settings */}
          <div>
            <Text size="sm" fw={600} mb="xs" c="dimmed">
              Additional Settings
            </Text>
            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Language Preference"
                  placeholder="Select language"
                  data={languageOptions}
                  {...form.getInputProps('language')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Registration Source"
                  placeholder="How was this customer registered?"
                  data={registrationSourceOptions}
                  {...form.getInputProps('registrationSource')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Notes"
                  placeholder="Additional notes about the customer"
                  autosize
                  minRows={2}
                  maxRows={4}
                  {...form.getInputProps('notes')}
                />
              </Grid.Col>
            </Grid>
          </div>

          {/* Action Buttons */}
          <Group justify="flex-end" mt="xl">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={loading}
              color="green"
            >
              Create Customer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}