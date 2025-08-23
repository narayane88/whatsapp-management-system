'use client'

import {
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Switch,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Text,
  Paper,
  Divider,
  Box,
  Alert,
  Select,
  ColorSwatch
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useEffect } from 'react'
import { FaRupeeSign } from 'react-icons/fa'
import {
  FiMail,
  FiSmartphone,
  FiUsers,
  FiKey,
  FiLink,
  FiMessageCircle,
  FiInfo,
  FiCalendar,
  FiTag,
  FiPercent
} from 'react-icons/fi'

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
  features: Record<string, any>
  isActive: boolean
  mobile_accounts_limit: number
  contact_limit: number
  api_key_limit: number
  receive_msg_limit: number
  webhook_limit: number
  footmark_enabled: boolean
  footmark_text: string
  package_color: string
}

interface PackageFormModalProps {
  opened: boolean
  onClose: () => void
  onSave: (data: Partial<Package>) => Promise<void>
  package?: Package | null
  isViewMode?: boolean
}

export default function PackageFormModal({
  opened,
  onClose,
  onSave,
  package: editPackage,
  isViewMode = false
}: PackageFormModalProps) {
  const isEdit = editPackage !== null && editPackage !== undefined

  // Define the 6 professional color options
  const colorOptions = [
    { value: 'blue', label: 'Ocean Blue', color: '#3b82f6' },
    { value: 'purple', label: 'Royal Purple', color: '#8b5cf6' },
    { value: 'emerald', label: 'Emerald Green', color: '#10b981' },
    { value: 'orange', label: 'Sunset Orange', color: '#f59e0b' },
    { value: 'rose', label: 'Rose Pink', color: '#f43f5e' },
    { value: 'slate', label: 'Professional Slate', color: '#64748b' }
  ]


  const form = useForm({
    initialValues: {
      name: editPackage?.name || '',
      description: editPackage?.description || '',
      price: editPackage?.price || 0,
      offer_price: editPackage?.offer_price || 0,
      offer_enabled: editPackage?.offer_enabled || false,
      duration: editPackage?.duration || 30,
      messageLimit: editPackage?.messageLimit || 1000,
      instanceLimit: editPackage?.instanceLimit || 1,
      isActive: editPackage?.isActive ?? true,
      mobile_accounts_limit: editPackage?.mobile_accounts_limit || 1,
      contact_limit: editPackage?.contact_limit || 1000,
      api_key_limit: editPackage?.api_key_limit || 1,
      receive_msg_limit: editPackage?.receive_msg_limit || 1000,
      webhook_limit: editPackage?.webhook_limit || 1,
      footmark_enabled: editPackage?.footmark_enabled || false,
      footmark_text: editPackage?.footmark_text || 'Sent by bizflash.in',
      package_color: editPackage?.package_color || 'blue'
    },
    validate: {
      name: (value) => (!value ? 'Package name is required' : null),
      price: (value) => (value < 0 ? 'Price must be positive' : null),
      offer_price: (value, values) => {
        if (values.offer_enabled && value && value >= values.price) {
          return 'Offer price must be less than regular price'
        }
        if (values.offer_enabled && (!value || value <= 0)) {
          return 'Offer price is required when offer is enabled'
        }
        return null
      },
      duration: (value) => (value <= 0 ? 'Duration must be greater than 0' : null),
      messageLimit: (value) => (value < 0 ? 'Message limit cannot be negative (0 = unlimited)' : null),
      instanceLimit: (value) => (value < 0 ? 'Instance limit cannot be negative (0 = unlimited)' : null),
      mobile_accounts_limit: (value) => (value < 0 ? 'Mobile accounts limit cannot be negative (0 = unlimited)' : null),
      contact_limit: (value) => (value < 0 ? 'Contact limit cannot be negative (0 = unlimited)' : null),
      api_key_limit: (value) => (value < 0 ? 'API key limit cannot be negative (0 = unlimited)' : null),
      receive_msg_limit: (value) => (value < 0 ? 'Receive message limit cannot be negative (0 = unlimited)' : null),
      webhook_limit: (value) => (value < 0 ? 'Webhook limit cannot be negative (0 = unlimited)' : null),
      footmark_text: (value, values) => 
        values.footmark_enabled && !value ? 'Footmark text is required when footmark is enabled' : null
    }
  })

  // Reset form when package changes
  useEffect(() => {
    if (opened) {
      form.setValues({
        name: editPackage?.name || '',
        description: editPackage?.description || '',
        price: editPackage?.price || 0,
        offer_price: editPackage?.offer_price || 0,
        offer_enabled: editPackage?.offer_enabled || false,
        duration: editPackage?.duration || 30,
        messageLimit: editPackage?.messageLimit || 1000,
        instanceLimit: editPackage?.instanceLimit || 1,
        isActive: editPackage?.isActive ?? true,
        mobile_accounts_limit: editPackage?.mobile_accounts_limit || 1,
        contact_limit: editPackage?.contact_limit || 1000,
        api_key_limit: editPackage?.api_key_limit || 1,
        receive_msg_limit: editPackage?.receive_msg_limit || 1000,
        webhook_limit: editPackage?.webhook_limit || 1,
        footmark_enabled: editPackage?.footmark_enabled || false,
        footmark_text: editPackage?.footmark_text || 'Sent by bizflash.in',
        package_color: editPackage?.package_color || 'blue'
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editPackage])

  const handleSubmit = async (values: typeof form.values) => {
    if (isViewMode) return // Prevent submission in view mode
    
    try {
      await onSave({
        ...values,
        features: {} // Add any additional features as needed
      })
      form.reset()
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  const handleClose = () => {
    // Reset form to initial state when closing
    form.reset()
    onClose()
  }

  const getModalTitle = () => {
    if (isViewMode) return 'Package Details'
    return isEdit ? 'Edit Package' : 'Create New Package'
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={getModalTitle()}
      size="lg"
    >
      <form onSubmit={isViewMode ? (e) => e.preventDefault() : form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <Paper p="md" withBorder>
            <Text fw={600} mb="md">Basic Information</Text>
            <Stack gap="md">
              <TextInput
                label="Package Name"
                placeholder="e.g., Basic Plan, Professional Plan"
                required={!isViewMode}
                readOnly={isViewMode}
                {...form.getInputProps('name')}
              />
              
              <Textarea
                label="Description"
                placeholder="Brief description of the package features..."
                rows={3}
                readOnly={isViewMode}
                {...form.getInputProps('description')}
              />
              
              <SimpleGrid cols={2} spacing="md">
                <NumberInput
                  label="Price"
                  placeholder="0"
                  required={!isViewMode}
                  readOnly={isViewMode}
                  min={0}
                  decimalScale={2}
                  fixedDecimalScale
                  leftSection={<FaRupeeSign size={14} />}
                  {...form.getInputProps('price')}
                />
                
                <NumberInput
                  label="Duration (Days)"
                  placeholder="30"
                  required={!isViewMode}
                  readOnly={isViewMode}
                  min={0}
                  leftSection={<FiCalendar size={14} />}
                  {...form.getInputProps('duration')}
                />
              </SimpleGrid>
            </Stack>
          </Paper>

          {/* Offer Pricing */}
          <Paper p="md" withBorder>
            <Text fw={600} mb="md">Special Offer Pricing</Text>
            <Stack gap="md">
              <Switch
                label="Enable Special Offer"
                description="Provide a discounted price for this package"
                readOnly={isViewMode}
                {...form.getInputProps('offer_enabled', { type: 'checkbox' })}
              />
              
              {form.values.offer_enabled && (
                <>
                  <SimpleGrid cols={2} spacing="md">
                    <NumberInput
                      label="Offer Price"
                      placeholder="0"
                      required={form.values.offer_enabled && !isViewMode}
                      readOnly={isViewMode}
                      min={0}
                      decimalScale={2}
                      fixedDecimalScale
                      leftSection={<FiTag size={14} />}
                      description="Discounted price for customers"
                      {...form.getInputProps('offer_price')}
                    />
                    
                    <Box>
                      <Text size="sm" fw={500} mb="xs">Discount Information</Text>
                      {form.values.price > 0 && form.values.offer_price > 0 && (
                        <Paper p="sm" bg="green.0" style={{ borderRadius: '8px' }}>
                          <Group gap="xs" mb="xs">
                            <FiPercent size={14} color="#10b981" />
                            <Text size="sm" fw={600} c="green.7">
                              {(((form.values.price - form.values.offer_price) / form.values.price) * 100).toFixed(1)}% OFF
                            </Text>
                          </Group>
                          <Text size="xs" c="green.6">
                            Customers save ₹{(form.values.price - form.values.offer_price).toFixed(2)}
                          </Text>
                        </Paper>
                      )}
                      {form.values.offer_enabled && form.values.offer_price >= form.values.price && (
                        <Alert color="red" variant="light" size="sm">
                          Offer price must be less than regular price
                        </Alert>
                      )}
                    </Box>
                  </SimpleGrid>
                  
                  <Alert icon={<FiInfo size={16} />} color="blue" variant="light">
                    When offer is enabled, customers will see both prices with the discount highlighted. 
                    The offer price will be used for billing.
                  </Alert>
                </>
              )}
            </Stack>
          </Paper>

          {/* Core Limits */}
          <Paper p="md" withBorder>
            <Text fw={600} mb="md">Core Limits</Text>
            <SimpleGrid cols={2} spacing="md">
              <NumberInput
                label="Message Limit"
                placeholder="1000"
                required={!isViewMode}
                readOnly={isViewMode}
                min={0}
                leftSection={<FiMail size={14} />}
                description="Messages that can be sent (0 = unlimited)"
                {...form.getInputProps('messageLimit')}
              />
              
              <NumberInput
                label="Instance Limit"
                placeholder="1"
                required={!isViewMode}
                readOnly={isViewMode}
                min={0}
                leftSection={<FiSmartphone size={14} />}
                description="WhatsApp instances (0 = unlimited)"
                {...form.getInputProps('instanceLimit')}
              />
            </SimpleGrid>
          </Paper>

          {/* Extended Limits */}
          <Paper p="md" withBorder>
            <Text fw={600} mb="md">Extended Limits</Text>
            <SimpleGrid cols={2} spacing="md">
              <NumberInput
                label="Mobile Accounts"
                placeholder="1"
                required={!isViewMode}
                readOnly={isViewMode}
                min={0}
                leftSection={<FiSmartphone size={14} />}
                description="Connected WhatsApp accounts (0 = unlimited)"
                {...form.getInputProps('mobile_accounts_limit')}
              />
              
              <NumberInput
                label="Contact Limit"
                placeholder="1000"
                required={!isViewMode}
                readOnly={isViewMode}
                min={0}
                leftSection={<FiUsers size={14} />}
                description="Contacts that can be stored (0 = unlimited)"
                {...form.getInputProps('contact_limit')}
              />
              
              <NumberInput
                label="API Keys"
                placeholder="1"
                required={!isViewMode}
                readOnly={isViewMode}
                min={0}
                leftSection={<FiKey size={14} />}
                description="API keys that can be generated (0 = unlimited)"
                {...form.getInputProps('api_key_limit')}
              />
              
              <NumberInput
                label="Receive Messages"
                placeholder="1000"
                required={!isViewMode}
                readOnly={isViewMode}
                min={0}
                leftSection={<FiMessageCircle size={14} />}
                description="Messages that can be received/month (0 = unlimited)"
                {...form.getInputProps('receive_msg_limit')}
              />
              
              <NumberInput
                label="Webhooks"
                placeholder="1"
                required={!isViewMode}
                readOnly={isViewMode}
                min={0}
                leftSection={<FiLink size={14} />}
                description="Webhooks that can be configured (0 = unlimited)"
                {...form.getInputProps('webhook_limit')}
              />
            </SimpleGrid>
          </Paper>

          {/* Message Footmark Settings */}
          <Paper p="md" withBorder>
            <Text fw={600} mb="md">Message Footmark Settings</Text>
            <Stack gap="md">
              <Switch
                label="Enable Message Footmark"
                description="Add footer text to sent messages"
                readOnly={isViewMode}
                {...form.getInputProps('footmark_enabled', { type: 'checkbox' })}
              />
              
              {form.values.footmark_enabled && (
                <TextInput
                  label="Footmark Text"
                  placeholder="Sent by bizflash.in"
                  required={form.values.footmark_enabled && !isViewMode}
                  readOnly={isViewMode}
                  description="This text will be added to the end of sent messages"
                  {...form.getInputProps('footmark_text')}
                />
              )}
              
              {form.values.footmark_enabled && (
                <Alert icon={<FiInfo size={16} />} color="blue" variant="light">
                  The footmark will appear as: "Your message content... {form.values.footmark_text}"
                </Alert>
              )}
            </Stack>
          </Paper>

          {/* Package Status */}
          <Paper p="md" withBorder>
            <Text fw={600} mb="md">Package Status</Text>
            <Switch
              label="Active Package"
              description="Only active packages are available for purchase"
              readOnly={isViewMode}
              {...form.getInputProps('isActive', { type: 'checkbox' })}
            />
          </Paper>

          {/* Package Color Theme */}
          <Paper p="md" withBorder>
            <Text fw={600} mb="md">Package Color Theme</Text>
            <Select
              label="Color Theme"
              description="Choose a professional color for your package design"
              data={colorOptions.map(color => ({
                value: color.value,
                label: color.label
              }))}
              readOnly={isViewMode}
              {...form.getInputProps('package_color')}
              renderOption={({ option }) => {
                const colorOption = colorOptions.find(c => c.value === option.value)
                return (
                  <Group gap="sm">
                    <ColorSwatch color={colorOption?.color || '#3b82f6'} size={16} />
                    <Text size="sm">{option.label}</Text>
                  </Group>
                )
              }}
            />
            
            {/* Color Preview */}
            <Box mt="md">
              <Text size="sm" fw={500} mb="xs">Preview:</Text>
              <Group gap="md">
                {colorOptions.map((color) => (
                  <Box
                    key={color.value}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: `linear-gradient(135deg, ${color.color}20 0%, ${color.color}10 100%)`,
                      border: form.values.package_color === color.value ? `2px solid ${color.color}` : `1px solid ${color.color}40`,
                      cursor: isViewMode ? 'default' : 'pointer',
                      opacity: form.values.package_color === color.value ? 1 : 0.7,
                      transform: form.values.package_color === color.value ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => !isViewMode && form.setFieldValue('package_color', color.value)}
                  >
                    <Group gap="xs">
                      <ColorSwatch color={color.color} size={12} />
                      <Text size="xs" c={color.color} fw={500}>{color.label}</Text>
                    </Group>
                  </Box>
                ))}
              </Group>
            </Box>
          </Paper>

          <Divider />

          {/* Action Buttons */}
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose}>
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button type="submit">
                {isEdit ? 'Update Package' : 'Create Package'}
              </Button>
            )}
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}