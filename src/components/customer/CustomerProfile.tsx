'use client'

import { useEffect, useState } from 'react'
import { 
  Card, 
  TextInput, 
  Button, 
  Grid, 
  Stack, 
  Group, 
  Alert,
  Select,
  Textarea,
  Badge,
  Text,
  Divider,
  LoadingOverlay
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconUser, IconMail, IconPhone, IconInfoCircle } from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import { useImpersonation } from '@/contexts/ImpersonationContext'

interface ProfileData {
  id: string
  name: string
  email: string
  mobile?: string
  phone?: string
  language: string
  address?: string
  notes?: string
  dealerInfo?: {
    name: string
    dealerCode: string
  }
  packageInfo?: {
    name: string
    expiryDate: string
    status: string
  }
}

export default function CustomerProfile() {
  const { data: session, update } = useSession()
  const { isImpersonating, impersonationData } = useImpersonation()
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)

  const form = useForm<ProfileData>({
    initialValues: {
      id: '',
      name: '',
      email: '',
      mobile: '',
      phone: '',
      language: 'en',
      address: '',
      notes: '',
    },
  })

  useEffect(() => {
    fetchProfile()
  }, [isImpersonating, impersonationData])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      // Build URL with impersonation parameter if needed
      let url = '/api/customer/profile'
      if (isImpersonating && impersonationData) {
        url += `?impersonatedCustomerId=${impersonationData.targetUser.id}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
        form.setValues(data)
      } else {
        // Mock data - use impersonated customer info if available
        const displayUser = isImpersonating && impersonationData 
          ? impersonationData.targetUser 
          : session?.user
          
        const mockData = {
          id: displayUser?.id?.toString() || '1',
          name: displayUser?.name || 'Customer Name',
          email: displayUser?.email || 'customer@example.com',
          mobile: '+1234567890',
          phone: '+1234567890',
          language: 'en',
          address: '123 Main Street, City, Country',
          notes: 'Premium customer',
          dealerInfo: {
            name: 'ABC Dealer',
            dealerCode: 'ABC001'
          },
          packageInfo: {
            name: 'Professional',
            expiryDate: '2024-12-31',
            status: 'Active'
          }
        }
        setProfileData(mockData)
        form.setValues(mockData)
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to load profile data',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: ProfileData) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfileData(updatedProfile)
        
        // Update session if name changed
        if (values.name !== session?.user?.name) {
          await update({
            ...session,
            user: {
              ...session?.user,
              name: values.name,
            },
          })
        }
        
        notifications.show({
          title: 'Success',
          message: 'Profile updated successfully',
          color: 'green',
        })
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      notifications.show({
        title: 'Error',
        message: 'Failed to update profile',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} />
      
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder padding="lg">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <Text size="lg" fw={600} mb="sm">Personal Information</Text>
                

                <Grid>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Full Name"
                      placeholder="Enter your full name"
                      leftSection={<IconUser size="1rem" />}
                      {...form.getInputProps('name')}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Email"
                      placeholder="Enter your email"
                      leftSection={<IconMail size="1rem" />}
                      {...form.getInputProps('email')}
                      required
                      disabled
                    />
                  </Grid.Col>
                </Grid>

                <Grid>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Mobile Number"
                      placeholder="Enter mobile number"
                      leftSection={<IconPhone size="1rem" />}
                      {...form.getInputProps('mobile')}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Phone Number"
                      placeholder="Enter phone number"
                      leftSection={<IconPhone size="1rem" />}
                      {...form.getInputProps('phone')}
                    />
                  </Grid.Col>
                </Grid>

                <Select
                  label="Language"
                  placeholder="Select language"
                  data={[
                    { value: 'en', label: 'English' },
                    { value: 'hi', label: 'Hindi' },
                    { value: 'es', label: 'Spanish' },
                    { value: 'fr', label: 'French' },
                    { value: 'de', label: 'German' },
                  ]}
                  {...form.getInputProps('language')}
                />

                <Textarea
                  label="Address"
                  placeholder="Enter your address"
                  rows={3}
                  {...form.getInputProps('address')}
                />

                <Textarea
                  label="Notes"
                  placeholder="Additional notes"
                  rows={3}
                  {...form.getInputProps('notes')}
                />

                <Group justify="flex-end">
                  <Button 
                    type="submit" 
                    loading={loading}
                    leftSection={<IconUser size="1rem" />}
                  >
                    Update Profile
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Account Info */}
            <Card withBorder padding="lg">
              <Text size="lg" fw={600} mb="md">Account Information</Text>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Customer ID</Text>
                  <Text size="sm" fw={500}>{profileData?.id}</Text>
                </Group>
                
                {profileData?.dealerInfo && (
                  <>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Dealer</Text>
                      <Text size="sm" fw={500}>{profileData.dealerInfo.name}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Dealer Code</Text>
                      <Badge size="sm" variant="light">
                        {profileData.dealerInfo.dealerCode}
                      </Badge>
                    </Group>
                  </>
                )}
              </Stack>
            </Card>

            {/* Package Info */}
            {profileData?.packageInfo && (
              <Card withBorder padding="lg">
                <Text size="lg" fw={600} mb="md">Current Package</Text>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Package</Text>
                    <Text size="sm" fw={500}>{profileData.packageInfo.name}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Status</Text>
                    <Badge 
                      color={profileData.packageInfo.status === 'Active' ? 'green' : 'orange'}
                      size="sm"
                    >
                      {profileData.packageInfo.status}
                    </Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Expires</Text>
                    <Text size="sm" fw={500}>
                      {new Date(profileData.packageInfo.expiryDate).toLocaleDateString()}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            )}

            {/* Security */}
            <Card withBorder padding="lg">
              <Text size="lg" fw={600} mb="md">Security</Text>
              <Stack gap="sm">
                <Button variant="light" fullWidth>
                  Change Password
                </Button>
                <Button variant="light" fullWidth>
                  Two-Factor Authentication
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </div>
  )
}