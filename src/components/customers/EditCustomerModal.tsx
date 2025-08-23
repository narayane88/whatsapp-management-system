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
  Badge,
  NumberInput,
  Switch
} from '@mantine/core'
import { FiInfo, FiUser, FiEdit } from 'react-icons/fi'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useState, useEffect } from 'react'

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

interface EditCustomerModalProps {
  opened: boolean
  onClose: () => void
  onSuccess: () => void
  customer: Customer | null
}

interface EditCustomerData {
  name: string
  email: string
  phone?: string
  mobile?: string
  address?: string
  notes?: string
  customer_status: string
  isActive: boolean
  account_balance: number
  message_balance: number
  language: string
  registration_source: string
  password?: string
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

export default function EditCustomerModal({
  opened,
  onClose,
  onSuccess,
  customer
}: EditCustomerModalProps) {
  const [loading, setLoading] = useState(false)
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const form = useForm<EditCustomerData>({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      mobile: '',
      address: '',
      notes: '',
      customer_status: 'active',
      isActive: true,
      account_balance: 0,
      message_balance: 0,
      language: 'en',
      registration_source: 'admin_created',
      password: ''
    },
    validate: {
      name: (value) => !value.trim() ? 'Name is required' : null,
      email: (value) => {
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format'
        return null
      },
      mobile: (value) => {
        if (value && value.length > 0 && !/^\+?[\d\s\-\(\)]{10,}$/.test(value)) {
          return 'Invalid mobile number format'
        }
        return null
      },
      password: (value) => {
        if (value && value.length > 0 && value.length < 6) {
          return 'Password must be at least 6 characters'
        }
        return null
      }
    }
  })

  // Load form data when modal opens or customer changes
  useEffect(() => {
    if (opened && customer) {
      loadFormData()
      populateForm()
    }
  }, [opened, customer])

  const populateForm = () => {
    if (customer) {
      form.setValues({
        name: customer.name,
        email: customer.email,
        phone: customer.phone || '',
        mobile: customer.mobile || '',
        address: customer.address || '',
        notes: customer.notes || '',
        customer_status: customer.customer_status,
        isActive: customer.isActive,
        account_balance: parseFloat(customer.account_balance.toString()) || 0,
        message_balance: parseFloat(customer.message_balance.toString()) || 0,
        language: customer.language || 'en',
        registration_source: customer.registration_source || 'admin_created',
        password: ''
      })
    }
  }

  const loadFormData = async () => {
    setLoadingData(true)
    try {
      // Load dealers (users with SUBDEALER role)
      const dealersResponse = await fetch('/api/users?level=3&is_active=true')
      if (dealersResponse.ok) {
        const dealersData = await dealersResponse.json()
        setDealers(dealersData.users || [])
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

  const handleSubmit = async (values: EditCustomerData) => {
    if (!customer) return

    setLoading(true)
    try {
      // Prepare data - only include password if it's provided
      const updateData = { ...values }
      if (!updateData.password || updateData.password.trim() === '') {
        delete updateData.password
      }

      // TODO: Replace with actual API call
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update customer')
      }

      notifications.show({
        title: 'Success',
        message: `Customer "${values.name}" updated successfully`,
        color: 'green'
      })

      onSuccess()
      onClose()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update customer',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const customerStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' }
  ]

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

  if (!customer) return null

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit Customer"
      size="lg"
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Customer Info Alert */}
          <Alert color="blue" title="Editing Customer" icon={<FiEdit size={16} />}>
            <Group gap="md">
              <Group gap="xs">
                <FiUser size={14} />
                <Text size="sm" fw={500}>Customer:</Text>
                <Badge color="blue" variant="light">{customer.name}</Badge>
              </Group>
              <Group gap="xs">
                <Text size="sm" fw={500}>ID:</Text>
                <Badge color="orange" variant="light">{customer.id}</Badge>
              </Group>
              {customer.dealer_name && (
                <Group gap="xs">
                  <Text size="sm" fw={500}>Dealer:</Text>
                  <Badge color="green" variant="light">{customer.dealer_name}</Badge>
                </Group>
              )}
            </Group>
          </Alert>

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
                <Select
                  label="Customer Status"
                  placeholder="Select status"
                  data={customerStatusOptions}
                  {...form.getInputProps('customer_status')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput
                  label="Reset Password"
                  placeholder="Leave empty to keep current password"
                  type="password"
                  description="Enter new password to reset, or leave empty to keep current password"
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

          {/* Account Status & Balances */}
          <div>
            <Text size="sm" fw={600} mb="xs" c="dimmed">
              Account Status & Balances
            </Text>
            <Grid>
              <Grid.Col span={12}>
                <Switch
                  label="Account Active"
                  description="Enable or disable customer account access"
                  {...form.getInputProps('isActive', { type: 'checkbox' })}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Account Balance (BizCoins)"
                  placeholder="Enter account balance"
                  min={0}
                  step={0.01}
                  decimalScale={2}
                  fixedDecimalScale
                  leftSection="₹"
                  {...form.getInputProps('account_balance')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Message Balance"
                  placeholder="Enter message balance"
                  min={0}
                  {...form.getInputProps('message_balance')}
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
                  {...form.getInputProps('registration_source')}
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
              color="blue"
            >
              Update Customer
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}