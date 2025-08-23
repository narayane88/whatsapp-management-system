'use client'

import {
  Stack,
  Group,
  Button,
  TextInput,
  Textarea,
  Select,
  Text,
  Card,
  Alert,
  SimpleGrid,
  Divider,
  Badge,
  Box,
  MultiSelect,
  NumberInput
} from '@mantine/core'
import { useState, useEffect } from 'react'
import { FiSave, FiX, FiUser, FiUsers, FiInfo, FiPercent } from 'react-icons/fi'
import { generateDealerCode } from '@/utils/dealerCode'
import { 
  getFilteredRolesForCreation, 
  canCreateUsers, 
  getUserCreationMessage,
  canAssignRoles 
} from '@/utils/userCreationPermissions'
import { useSession } from 'next-auth/react'

interface User {
  id?: number
  name: string
  email: string
  phone?: string
  address?: string
  dealer_code?: string
  notes?: string
  language?: string
  roles?: Role[]
  isActive?: boolean
  commissionRate?: number
}

interface Role {
  id: number
  name: string
  description: string
  level: number
  is_system: boolean
}

interface UserRole {
  role: Role
  is_primary: boolean
}

interface UserFormModalProps {
  user: User | null
  roles: Role[]
  currentUserRoles: UserRole[]
  onSave: (userData: any) => Promise<void>
  onClose: () => void
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' }
]

export default function UserFormModal({
  user,
  roles,
  currentUserRoles,
  onSave,
  onClose
}: UserFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    notes: '',
    language: 'en', // Default to English
    selectedRoles: [] as number[],
    dealer_code: '',
    commissionRate: 0
  })
  const [loading, setLoading] = useState(false)
  const [generatedDealerCode, setGeneratedDealerCode] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Don't prefill password for editing
        phone: user.phone || '',
        address: user.address || '',
        notes: user.notes || '',
        language: user.language || 'en',
        selectedRoles: user.roles?.map(r => r.id) || [],
        dealer_code: user.dealer_code || '',
        commissionRate: user.commissionRate || 0
      })
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        notes: '',
        language: 'en',
        selectedRoles: [],
        dealer_code: '',
        commissionRate: 0
      })
      setGeneratedDealerCode('')
    }
  }, [user])

  // Auto-generate dealer code when name changes (for new users)
  useEffect(() => {
    if (!user && formData.name && formData.selectedRoles.length > 0) {
      const selectedRole = roles.find(r => r.id === formData.selectedRoles[0])
      if (selectedRole && (selectedRole.name.toLowerCase().includes('dealer') || selectedRole.name.toLowerCase().includes('subdeal'))) {
        const code = generateDealerCode(formData.name, 0) // 0 as temp ID
        setGeneratedDealerCode(code)
        setFormData(prev => ({ ...prev, dealer_code: code }))
      }
    }
  }, [formData.name, formData.selectedRoles, roles, user])

  // Permission-based role filtering
  const canUserCreateUsers = canCreateUsers(currentUserRoles)
  const availableRoles = getFilteredRolesForCreation(currentUserRoles, roles)
  const creationMessage = getUserCreationMessage(currentUserRoles)

  // Validate role assignment permissions
  const validateRoleAssignment = (selectedRoleIds: number[]) => {
    return canAssignRoles(currentUserRoles, selectedRoleIds, roles)
  }


  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      alert('Please enter a name')
      return
    }
    if (!formData.email.trim()) {
      alert('Please enter an email')
      return
    }
    if (!user && !formData.password.trim()) {
      alert('Please enter a password for new users')
      return
    }
    if (formData.selectedRoles.length === 0) {
      alert('Please select at least one role')
      return
    }

    // Commission validation for Level 3 users
    if (isLevel3Role) {
      if (formData.commissionRate < 0) {
        alert('Commission percentage cannot be negative')
        return
      }
      if (formData.commissionRate > 100) {
        alert('Commission percentage cannot exceed 100%')
        return
      }
    }

    // Role assignment permission validation
    const roleValidation = validateRoleAssignment(formData.selectedRoles)
    if (!roleValidation.canAssign) {
      alert(roleValidation.message || 'You do not have permission to assign these roles')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const userData = {
        id: user?.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        notes: formData.notes,
        language: formData.language,
        dealer_code: formData.dealer_code,
        roles: formData.selectedRoles,
        commissionRate: isLevel3Role ? formData.commissionRate : 0,
        ...((!user || formData.password) && { password: formData.password }),
      }


      await onSave(userData)
      onClose()
    } catch (error) {
      console.error('Error saving user:', error)
    } finally {
      setLoading(false)
    }
  }

  const isDealerRole = formData.selectedRoles.some(roleId => {
    const role = roles.find(r => r.id === roleId)
    return role && (role.name.toLowerCase().includes('dealer') || role.name.toLowerCase().includes('subdeal'))
  })

  const isLevel3Role = formData.selectedRoles.some(roleId => {
    const role = roles.find(r => r.id === roleId)
    return role && role.level === 3
  })

  // If user can't create users at all, show access denied message
  if (!canUserCreateUsers) {
    return (
      <Alert color="red" title="Access Denied">
        <Text size="sm">{creationMessage}</Text>
      </Alert>
    )
  }

  return (
    <Stack gap="md">
      <Alert color="blue" title="User Information">
        <Text size="sm">
          {user 
            ? 'Update user information. Leave password empty to keep current password.'
            : 'Create a new user account. All fields marked with * are required.'
          }
        </Text>
      </Alert>

      {/* Permission-based creation message */}
      <Alert color="orange" title="Creation Permissions" icon={<FiInfo size={16} />}>
        <Text size="sm">{creationMessage}</Text>
        {availableRoles.length > 0 && (
          <Text size="xs" c="dimmed" mt="xs">
            Available roles: {availableRoles.map(r => r.name).join(', ')}
          </Text>
        )}
      </Alert>


      {/* Basic Information */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <TextInput
          label="Full Name"
          placeholder="Enter full name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          leftSection={<FiUser size={16} />}
        />
        
        <TextInput
          label="Email Address"
          placeholder="user@example.com"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
          type="email"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <TextInput
          label={user ? "New Password (optional)" : "Password"}
          placeholder={user ? "Leave empty to keep current" : "Enter password"}
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          type="password"
          required={!user}
        />
        
        <TextInput
          label="Mobile Number"
          placeholder="+1 (555) 123-4567"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
        />
      </SimpleGrid>

      {/* Language and Roles */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Select
          label="Language"
          placeholder="Select language"
          value={formData.language}
          onChange={(value) => setFormData(prev => ({ ...prev, language: value || 'en' }))}
          data={LANGUAGES}
          required
          searchable
        />
        
        <MultiSelect
          label="User Roles"
          placeholder="Select roles"
          value={formData.selectedRoles.map(id => id.toString())}
          onChange={(values) => setFormData(prev => ({ 
            ...prev, 
            selectedRoles: values.map(v => parseInt(v)) 
          }))}
          data={availableRoles.map(role => ({
            value: role.id.toString(),
            label: `${role.name}${role.is_system ? ' (System)' : ''} - Level ${role.level}`,
            disabled: false // All available roles are already filtered by permission
          }))}
          required
          leftSection={<FiUsers size={16} />}
          description={`You can assign ${availableRoles.length} role(s) based on your permissions`}
        />
      </SimpleGrid>

      <Textarea
        label="Address"
        placeholder="Enter address"
        value={formData.address}
        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
        minRows={2}
      />

      {/* Dealer Code Section */}
      {isDealerRole && (
        <Card withBorder p="md">
          <Stack gap="sm">
            <Group>
              <Text fw={500} size="sm">Dealer/Subdealer Information</Text>
              <Badge color="blue" variant="light">Auto-Generated</Badge>
            </Group>
            <TextInput
              label="Dealer Reference Code"
              value={formData.dealer_code}
              onChange={(e) => setFormData(prev => ({ ...prev, dealer_code: e.target.value }))}
              description="Used for customer registration and relationship tracking"
              placeholder="WA-XXXX-YYYY"
            />
            {generatedDealerCode && (
              <Alert color="green" size="sm">
                Auto-generated code: <strong>{generatedDealerCode}</strong>
              </Alert>
            )}
          </Stack>
        </Card>
      )}

      {/* Commission Rate Section - Only for Level 3 users */}
      {isLevel3Role && (
        <Card withBorder p="md">
          <Stack gap="sm">
            <Group>
              <Text fw={500} size="sm">Commission Settings</Text>
              <Badge color="green" variant="light">Level 3 Only</Badge>
            </Group>
            <NumberInput
              label="Commission Percentage (%)"
              placeholder="Enter commission percentage"
              value={formData.commissionRate}
              onChange={(value) => setFormData(prev => ({ ...prev, commissionRate: value || 0 }))}
              leftSection={<FiPercent size={16} />}
              min={0}
              max={100}
              step={0.1}
              decimalScale={2}
              description="Percentage of commission earned on customer transactions"
              suffix="%"
            />
            <Alert color="blue" size="sm" title="Commission Information">
              <Text size="xs">
                Level 3 users (SUBDEALER) will earn this percentage as commission when their customers make payments. 
                This will be calculated automatically and added to their account balance.
              </Text>
            </Alert>
          </Stack>
        </Card>
      )}

      <Textarea
        label="Notes"
        placeholder="Additional notes about the user"
        value={formData.notes}
        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        minRows={3}
      />

      <Divider />

      {/* Action Buttons */}
      <Group justify="flex-end">
        <Button
          variant="outline"
          leftSection={<FiX size={16} />}
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          leftSection={<FiSave size={16} />}
          onClick={handleSubmit}
          loading={loading}
          disabled={!formData.name || !formData.email || (!user && !formData.password) || formData.selectedRoles.length === 0}
        >
          {user ? 'Update User' : 'Create User'}
        </Button>
      </Group>
    </Stack>
  )
}