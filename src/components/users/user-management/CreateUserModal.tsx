'use client'

import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Switch,
  Alert,
  Box,
  SimpleGrid,
  Text,
} from '@mantine/core'
import { FiInfo, FiUser, FiMail, FiPhone, FiKey } from 'react-icons/fi'
import { useState } from 'react'

interface CreateUserModalProps {
  opened: boolean
  onClose: () => void
  allowedRoles: string[]
  onSubmit: (userData: {
    name: string
    email: string
    mobile: string
    role: string
    password: string
    dealerCode?: string
    language: string
    package: string
    isActive: boolean
  }) => void
}

export default function CreateUserModal({
  opened,
  onClose,
  allowedRoles,
  onSubmit
}: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: '',
    password: '',
    dealerCode: '',
    language: 'Hindi',
    package: 'Basic',
    isActive: true
  })

  const roleOptions = allowedRoles.map(role => ({
    value: role,
    label: role.charAt(0) + role.slice(1).toLowerCase()
  }))

  const languageOptions = [
    { value: 'Hindi', label: 'Hindi' },
    { value: 'English', label: 'English' },
    { value: 'Bengali', label: 'Bengali' },
    { value: 'Telugu', label: 'Telugu' },
    { value: 'Marathi', label: 'Marathi' },
  ]

  const packageOptions = [
    { value: 'Basic', label: 'Basic - 1,000 messages' },
    { value: 'Professional', label: 'Professional - 10,000 messages' },
    { value: 'Enterprise', label: 'Enterprise - 50,000 messages' },
  ]

  const handleSubmit = () => {
    onSubmit(formData)
    // Reset form
    setFormData({
      name: '',
      email: '',
      mobile: '',
      role: '',
      password: '',
      dealerCode: '',
      language: 'Hindi',
      package: 'Basic',
      isActive: true
    })
    onClose()
  }

  const isValid = formData.name && formData.email && formData.mobile && formData.role && formData.password

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create New User"
      size="lg"
    >
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <TextInput
            label="Full Name *"
            placeholder="e.g., Rajesh Kumar"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            leftSection={<Box component={FiUser} />}
            required
          />

          <TextInput
            label="Email Address *"
            placeholder="user@example.com"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            leftSection={<Box component={FiMail} />}
            required
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <TextInput
            label="Mobile Number *"
            placeholder="+91-98765-43210"
            value={formData.mobile}
            onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
            leftSection={<Box component={FiPhone} />}
            required
          />

          <Select
            label="Role *"
            placeholder="Select user role"
            data={roleOptions}
            value={formData.role}
            onChange={(value) => setFormData(prev => ({ ...prev, role: value || '' }))}
            required
          />
        </SimpleGrid>

        <TextInput
          label="Password *"
          placeholder="Enter secure password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          leftSection={<Box component={FiKey} />}
          required
        />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Select
            label="Language"
            data={languageOptions}
            value={formData.language}
            onChange={(value) => setFormData(prev => ({ ...prev, language: value || 'Hindi' }))}
          />

          <Select
            label="Package"
            data={packageOptions}
            value={formData.package}
            onChange={(value) => setFormData(prev => ({ ...prev, package: value || 'Basic' }))}
          />
        </SimpleGrid>

        {(formData.role === 'SUBDEALER' || formData.role === 'CUSTOMER') && (
          <TextInput
            label="Dealer Code (Optional)"
            placeholder="e.g., WA-RAKU-0001"
            value={formData.dealerCode}
            onChange={(e) => setFormData(prev => ({ ...prev, dealerCode: e.target.value }))}
            description="Leave empty to auto-generate for SubDealers"
          />
        )}

        <Switch
          label="Active User"
          description="User can login and access the system"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.currentTarget.checked }))}
        />

        <Alert variant="light" color="blue" title="User Creation Guidelines" icon={<Box component={FiInfo} />}>
          <Stack gap="xs">
            <Text size="sm">
              • All users will receive login credentials via email
            </Text>
            <Text size="sm">
              • SubDealers can manage customers and resell packages
            </Text>
            <Text size="sm">
              • Customers have limited access to their own data
            </Text>
          </Stack>
        </Alert>

        <Group justify="flex-end" mt="lg">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button color="green" onClick={handleSubmit} disabled={!isValid}>
            Create User
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}