'use client'

import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  Textarea,
  Card,
  SimpleGrid,
  Image,
  Badge,
  Divider,
  Tabs,
  Paper,
  NumberInput,
  Box,
  rem,
  Alert,
  ThemeIcon
} from '@mantine/core'
import * as Icons from 'react-icons/fi'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernAlert,
  ModernContainer
} from '@/components/ui/modern-components'
import { FaRupeeSign } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { notifications } from '@mantine/notifications'

interface CompanyProfile {
  id?: number
  company_name: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  mobile_number: string
  phone_number: string
  email: string
  website: string
  gstin_number: string
  pan_number: string
  favicon_url: string
  light_logo_url: string
  dark_logo_url: string
  established_year: number
  business_type: string
  description: string
  social_media?: {
    website?: string
    linkedin?: string
    twitter?: string
    facebook?: string
  }
  bank_details?: {
    bank_name?: string
    account_number?: string
    ifsc_code?: string
    branch?: string
  }
}

export default function CompanyProfileTab() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [profile, setProfile] = useState<CompanyProfile>({
    company_name: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    mobile_number: '',
    phone_number: '',
    email: '',
    website: '',
    gstin_number: '',
    pan_number: '',
    favicon_url: '/images/company/favicon.svg',
    light_logo_url: '/images/company/logo-light.svg',
    dark_logo_url: '/images/company/logo-dark.svg',
    established_year: new Date().getFullYear(),
    business_type: '',
    description: '',
    social_media: {},
    bank_details: {}
  })

  // Fetch company profile
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/company/profile')
      const data = await response.json()
      
      if (data.success) {
        const profileData = data.data
        setProfile({
          ...profileData,
          social_media: typeof profileData.social_media === 'string' 
            ? JSON.parse(profileData.social_media || '{}') 
            : profileData.social_media || {},
          bank_details: typeof profileData.bank_details === 'string' 
            ? JSON.parse(profileData.bank_details || '{}') 
            : profileData.bank_details || {}
        })
      } else {
        // Handle authentication errors gracefully
        let errorMessage = data.error || 'Failed to fetch company profile'
        if (response.status === 401) {
          errorMessage = 'Please sign in to view the company profile'
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to view the company profile'
        }
        setError(errorMessage)
      }
    } catch (error) {

      setError('Network error - please check your connection')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile.company_name.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Company name is required',
        color: 'red',
        icon: <Box component={Icons.FiAlertCircle} />
      })
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')
      
      const response = await fetch('/api/company/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      const data = await response.json()

      if (data.success) {
        notifications.show({
          title: 'Success',
          message: data.message || 'Company profile updated successfully!',
          color: 'green',
          icon: <Box component={Icons.FiSave} />
        })
        // Refresh the profile data
        fetchProfile()
      } else {
        // Handle different types of errors
        let errorMessage = data.error || 'Failed to update profile'
        
        if (response.status === 401) {
          errorMessage = 'Please sign in to update the company profile'
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to update the company profile'
        } else if (response.status === 500) {
          errorMessage = 'Server error - please try again later'
        }
        
        notifications.show({
          title: 'Error',
          message: errorMessage,
          color: 'red',
          icon: <Box component={Icons.FiAlertCircle} />
        })
        setError(errorMessage)
      }
    } catch (error) {

      const errorMessage = 'Network error - please check your connection and try again'
      notifications.show({
        title: 'Connection Error',
        message: errorMessage,
        color: 'red',
        icon: <Box component={Icons.FiAlertCircle} />
      })
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof CompanyProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const updateSocialMedia = (platform: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    }))
  }

  const updateBankDetails = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      bank_details: {
        ...prev.bank_details,
        [field]: value
      }
    }))
  }

  if (loading) {
    return (
      <Container>
        <Text ta="center">Loading company profile...</Text>
      </Container>
    )
  }

  return (
    <Container size="xl">
      <Stack gap="xl">
        {/* Header */}
        <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs">
              <Group gap="md">
                <ThemeIcon size="md" variant="light" color="blue">
                  <Icons.FiHome size={16} />
                </ThemeIcon>
                <Title order={4} size="xs" fw={600}>Company Profile</Title>
              </Group>
              <Text c="dimmed" size="xs">
                Manage your company information, logos, and business details
              </Text>
            </Stack>
            <ModernBadge color="green" size="xs">
              Profile Settings
            </ModernBadge>
          </Group>
        </ModernCard>

        {/* Status Messages */}
        {error && (
          <ModernAlert variant="light" color="red" title="Error" icon={<Icons.FiAlertCircle size={10} />}>
            <Text size="xs">{error}</Text>
          </ModernAlert>
        )}

        {success && (
          <ModernAlert variant="light" color="green" title="Success" icon={<Icons.FiSave size={10} />}>
            <Text size="xs">{success}</Text>
          </ModernAlert>
        )}

        <Tabs defaultValue="basic" variant="outline">
          <Tabs.List>
            <Tabs.Tab value="basic">
              <Group gap="xs">
                <Icons.FiInfo size={10} />
                <Text size="xs">Basic Information</Text>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="branding">
              <Group gap="xs">
                <Icons.FiEdit3 size={10} />
                <Text size="xs">Branding & Logos</Text>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="business">
              <Group gap="xs">
                <Icons.FiFileText size={10} />
                <Text size="xs">Business Details</Text>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="financial">
              <Group gap="xs">
                <FaRupeeSign size={10} />
                <Text size="xs">Financial & Banking</Text>
              </Group>
            </Tabs.Tab>
          </Tabs.List>

          {/* Basic Information Tab */}
          <Tabs.Panel value="basic" pt="md">
            <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Title order={4} size="xs" fw={600}>Basic Information</Title>
                <Text size="xs" c="dimmed">
                  Essential company details and contact information
                </Text>
              </Card.Section>

              <Stack gap="md" mt="md">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <TextInput
                    label="Company Name"
                    placeholder="Enter company name"
                    value={profile.company_name}
                    onChange={(e) => updateField('company_name', e.target.value)}
                    required
                    withAsterisk
                  />
                  <TextInput
                    label="Business Type"
                    placeholder="e.g., Software Development"
                    value={profile.business_type}
                    onChange={(e) => updateField('business_type', e.target.value)}
                  />
                </SimpleGrid>

                <Textarea
                  label="Address"
                  placeholder="Enter complete address"
                  value={profile.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  minRows={3}
                />

                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                  <TextInput
                    label="City"
                    placeholder="Enter city"
                    value={profile.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                  <TextInput
                    label="State"
                    placeholder="Enter state"
                    value={profile.state}
                    onChange={(e) => updateField('state', e.target.value)}
                  />
                  <TextInput
                    label="Postal Code"
                    placeholder="Enter postal code"
                    value={profile.postal_code}
                    onChange={(e) => updateField('postal_code', e.target.value)}
                  />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <TextInput
                    label="Mobile Number"
                    placeholder="+91-XXXXX-XXXXX"
                    value={profile.mobile_number}
                    onChange={(e) => updateField('mobile_number', e.target.value)}
                  />
                  <TextInput
                    label="Phone Number"
                    placeholder="Landline number"
                    value={profile.phone_number}
                    onChange={(e) => updateField('phone_number', e.target.value)}
                  />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <TextInput
                    label="Email Address"
                    placeholder="contact@company.com"
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                  <TextInput
                    label="Website"
                    placeholder="https://company.com"
                    value={profile.website}
                    onChange={(e) => updateField('website', e.target.value)}
                  />
                </SimpleGrid>

                <Textarea
                  label="Company Description"
                  placeholder="Brief description of your company and services"
                  value={profile.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  minRows={4}
                />
              </Stack>
            </ModernCard>
          </Tabs.Panel>

          {/* Branding & Logos Tab */}
          <Tabs.Panel value="branding" pt="md">
            <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Title order={4} size="xs" fw={600}>Branding & Logos</Title>
                <Text size="xs" c="dimmed">
                  Upload your company logos and favicon for branding
                </Text>
              </Card.Section>

              <Stack gap="md" mt="md">
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                  {/* Favicon */}
                  <Card shadow="xs" padding="md" radius="md" withBorder>
                    <Stack align="center" gap="md">
                      <Image
                        src={profile.favicon_url || '/images/company/favicon.svg'}
                        alt="Favicon"
                        w={32}
                        h={32}
                        fallbackSrc="/images/company/favicon.svg"
                      />
                      <Stack gap="xs" align="center">
                        <Text fw={500} size="xs">Favicon</Text>
                        <Text size="xs" c="dimmed">32x32 pixels, ICO format</Text>
                      </Stack>
                      <TextInput
                        size="sm"
                        placeholder="Favicon URL"
                        value={profile.favicon_url}
                        onChange={(e) => updateField('favicon_url', e.target.value)}
                      />
                      <ModernButton size="xs" leftSection={<Icons.FiUpload size={10} />}>
                        Upload
                      </ModernButton>
                    </Stack>
                  </Card>

                  {/* Light Logo */}
                  <Card shadow="xs" padding="md" radius="md" withBorder>
                    <Stack align="center" gap="md">
                      <Image
                        src={profile.light_logo_url || '/images/company/logo-light.svg'}
                        alt="Light Logo"
                        h={60}
                        w="fit-content"
                        maw={120}
                        fallbackSrc="/images/company/logo-light.svg"
                      />
                      <Stack gap="xs" align="center">
                        <Text fw={500} size="xs">Light Logo</Text>
                        <Text size="xs" c="dimmed">For light backgrounds</Text>
                      </Stack>
                      <TextInput
                        size="sm"
                        placeholder="Light logo URL"
                        value={profile.light_logo_url}
                        onChange={(e) => updateField('light_logo_url', e.target.value)}
                      />
                      <ModernButton size="xs" leftSection={<Icons.FiUpload size={10} />}>
                        Upload
                      </ModernButton>
                    </Stack>
                  </Card>

                  {/* Dark Logo */}
                  <Card shadow="xs" padding="md" radius="md" withBorder>
                    <Stack align="center" gap="md">
                      <Paper bg="dark.8" p="md" radius="md">
                        <Image
                          src={profile.dark_logo_url || '/images/company/logo-dark.svg'}
                          alt="Dark Logo"
                          h={60}
                          w="fit-content"
                          maw={120}
                          fallbackSrc="/images/company/logo-dark.svg"
                        />
                      </Paper>
                      <Stack gap="xs" align="center">
                        <Text fw={500} size="xs">Dark Logo</Text>
                        <Text size="xs" c="dimmed">For dark backgrounds</Text>
                      </Stack>
                      <TextInput
                        size="sm"
                        placeholder="Dark logo URL"
                        value={profile.dark_logo_url}
                        onChange={(e) => updateField('dark_logo_url', e.target.value)}
                      />
                      <ModernButton size="xs" leftSection={<Icons.FiUpload size={10} />}>
                        Upload
                      </ModernButton>
                    </Stack>
                  </Card>
                </SimpleGrid>

                <ModernAlert variant="light" color="blue" title="Logo Guidelines:" icon={<Icons.FiInfo size={10} />}>
                  <Stack gap="xs">
                    <Text size="xs">
                      • Light logo: Use on light backgrounds (PNG with transparent background recommended)
                    </Text>
                    <Text size="xs">
                      • Dark logo: Use on dark backgrounds (White/light colored logo)
                    </Text>
                    <Text size="xs">
                      • Favicon: Small icon for browser tabs (32x32 pixels, ICO format)
                    </Text>
                    <Text size="xs">
                      • Recommended size: 200x60 pixels for logos, maintain aspect ratio
                    </Text>
                  </Stack>
                </ModernAlert>
              </Stack>
            </ModernCard>
          </Tabs.Panel>

          {/* Business Details Tab */}
          <Tabs.Panel value="business" pt="md">
            <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Title order={4} size="xs" fw={600}>Business Details</Title>
                <Text size="xs" c="dimmed">
                  Legal and regulatory business information
                </Text>
              </Card.Section>

              <Stack gap="md" mt="md">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <TextInput
                    label="GSTIN Number"
                    placeholder="27ABCDE1234F1Z5"
                    value={profile.gstin_number}
                    onChange={(e) => updateField('gstin_number', e.target.value)}
                    maxLength={15}
                  />
                  <TextInput
                    label="PAN Number"
                    placeholder="ABCDE1234F"
                    value={profile.pan_number}
                    onChange={(e) => updateField('pan_number', e.target.value)}
                    maxLength={10}
                  />
                </SimpleGrid>

                <NumberInput
                  label="Established Year"
                  placeholder="2020"
                  value={profile.established_year}
                  onChange={(value) => updateField('established_year', Number(value))}
                  min={1900}
                  max={new Date().getFullYear()}
                />

                <Divider />

                <Stack gap="md">
                  <Title order={5} size="xs" fw={600}>Social Media & Online Presence</Title>
                  
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    <TextInput
                      label="LinkedIn"
                      placeholder="https://linkedin.com/company/yourcompany"
                      value={profile.social_media?.linkedin || ''}
                      onChange={(e) => updateSocialMedia('linkedin', e.target.value)}
                    />
                    <TextInput
                      label="Twitter"
                      placeholder="https://twitter.com/yourcompany"
                      value={profile.social_media?.twitter || ''}
                      onChange={(e) => updateSocialMedia('twitter', e.target.value)}
                    />
                    <TextInput
                      label="Facebook"
                      placeholder="https://facebook.com/yourcompany"
                      value={profile.social_media?.facebook || ''}
                      onChange={(e) => updateSocialMedia('facebook', e.target.value)}
                    />
                  </SimpleGrid>
                </Stack>
              </Stack>
            </ModernCard>
          </Tabs.Panel>

          {/* Financial & Banking Tab */}
          <Tabs.Panel value="financial" pt="md">
            <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Title order={4} size="xs" fw={600}>Financial & Banking Information</Title>
                <Text size="xs" c="dimmed">
                  Banking details for payments and transactions
                </Text>
              </Card.Section>

              <Stack gap="md" mt="md">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <TextInput
                    label="Bank Name"
                    placeholder="State Bank of India"
                    value={profile.bank_details?.bank_name || ''}
                    onChange={(e) => updateBankDetails('bank_name', e.target.value)}
                  />
                  <TextInput
                    label="IFSC Code"
                    placeholder="SBIN0012345"
                    value={profile.bank_details?.ifsc_code || ''}
                    onChange={(e) => updateBankDetails('ifsc_code', e.target.value)}
                  />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <TextInput
                    label="Account Number"
                    placeholder="XXXXXXXXXXXX1234"
                    type="password"
                    value={profile.bank_details?.account_number || ''}
                    onChange={(e) => updateBankDetails('account_number', e.target.value)}
                  />
                  <TextInput
                    label="Branch Name"
                    placeholder="Main Branch"
                    value={profile.bank_details?.branch || ''}
                    onChange={(e) => updateBankDetails('branch', e.target.value)}
                  />
                </SimpleGrid>

                <ModernAlert variant="light" color="orange" title="Security Note:" icon={<Icons.FiInfo size={10} />}>
                  <Text size="xs">
                    Banking information is encrypted and stored securely. Only authorized personnel can access this information.
                  </Text>
                </ModernAlert>
              </Stack>
            </ModernCard>
          </Tabs.Panel>
        </Tabs>

        {/* Save Button */}
        <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Stack gap="xs">
              <Text fw={500} size="xs">Save Changes</Text>
              <Text size="xs" c="dimmed">
                All changes will be applied across the application
              </Text>
            </Stack>
            <ModernButton
              color="green"
              size="xs"
              leftSection={<Icons.FiSave size={10} />}
              onClick={handleSave}
              loading={saving}
            >
              {saving ? 'Saving...' : 'Save Company Profile'}
            </ModernButton>
          </Group>
        </ModernCard>
      </Stack>
    </Container>
  )
}