'use client'

import {
  Box,
  Button,
  Title,
  Text,
  Stack,
  TextInput,
  Flex,
  Card,
  Badge,
  SimpleGrid,
  Container,
} from '@mantine/core'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { notifications } from '@mantine/notifications'
import { useTheme } from '@/hooks/useTheme'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { currentTheme } = useTheme()

  // Demo credentials based on database seed file
  const demoCredentials = [
    {
      role: 'Owner',
      email: 'owner@demo.com',
      password: 'demo123',
      color: 'red',
      description: 'Full system access & control'
    },
    {
      role: 'Admin',
      email: 'admin@demo.com',
      password: 'demo123',
      color: 'violet',
      description: 'Administrative access & management'
    },
    {
      role: 'SubDealer', 
      email: 'subdealer@demo.com',
      password: 'demo123',
      color: 'orange',
      description: 'Manage customers & resell packages'
    },
    {
      role: 'Employee',
      email: 'employee@demo.com', 
      password: 'demo123',
      color: 'blue',
      description: 'Support & daily operations'
    },
    {
      role: 'Customer',
      email: 'customer@demo.com',
      password: 'demo123', 
      color: 'green',
      description: 'Basic WhatsApp management'
    }
  ]

  const fillCredentials = (credential: typeof demoCredentials[0]) => {
    setEmail(credential.email)
    setPassword(credential.password)
    notifications.show({
      title: `${credential.role} credentials filled`,
      message: `You can now sign in as ${credential.role}`,
      color: 'green'
    })
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter both email and password',
        color: 'red'
      })
      return
    }

    setIsLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        let redirectPath = '/admin' // Default for admin users
        let welcomeMessage = 'Welcome to WhatsApp Admin!'
        
        try {
          // Get user session to determine role-based redirect
          const response = await fetch('/api/auth/session')
          if (response.ok) {
            const sessionData = await response.json()
            const userRole = sessionData?.user?.role?.toUpperCase()
            
            // Role-based redirect logic
            if (userRole === 'CUSTOMER') {
              redirectPath = '/customer'
              welcomeMessage = 'Welcome to your WhatsApp Customer Portal!'
            }
          }
        } catch (error) {
          console.warn('Could not fetch session for redirect, using default:', error)
          // Fall back to default redirect path
        }
        
        notifications.show({
          title: 'Sign in successful',
          message: welcomeMessage,
          color: 'green'
        })
        
        router.push(redirectPath)
      } else {
        notifications.show({
          title: 'Sign in failed',
          message: result?.error || 'Invalid email or password',
          color: 'red'
        })
      }
    } catch (error) {
      console.error('Authentication error:', error)
      notifications.show({
        title: 'Connection Error',
        message: 'Please check your internet connection and try again',
        color: 'red'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container fluid style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-1)' }}>
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }} p="xl">
        <Box w="100%" maw={800}>
          <Stack gap="xl">
          {/* Main Login Card */}
          <Card shadow="sm" padding="lg" radius="md" withBorder style={{ maxWidth: '400px', margin: '0 auto' }}>
            <Stack gap="lg">
                <Box ta="center">
                  <Title order={2} c="green.6" mb="xs">
                    WhatsApp Admin
                  </Title>
                  <Text c="dimmed">
                    Sign in to access the admin panel
                  </Text>
                </Box>

                <Stack gap="md">
                  <TextInput
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />

                  <TextInput
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />

                  <Button
                    color="green"
                    size="lg"
                    fullWidth
                    onClick={handleSignIn}
                    loading={isLoading}
                  >
                    Sign In
                  </Button>
                </Stack>
            </Stack>
          </Card>

          {/* Demo Credentials Card */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Box ta="center">
                <Title order={3} c="dark.7" mb="xs">
                  Quick Login - Demo Credentials
                </Title>
                <Text size="sm" c="dimmed">
                  Click any role below to auto-fill login credentials
                </Text>
              </Box>
            </Card.Section>
              <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="md" mt="md">
                {demoCredentials.map((credential, index) => (
                  <Card 
                    key={index}
                    shadow="xs"
                    padding="md"
                    radius="md"
                    withBorder
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => fillCredentials(credential)}
                  >
                    <Stack align="center" gap="sm">
                        <Badge 
                          color={credential.color} 
                          variant="filled"
                          size="md"
                        >
                          {credential.role}
                        </Badge>
                        <Stack gap={2} align="center">
                          <Text size="sm" fw={500} c="dark.7">
                            {credential.email}
                          </Text>
                          <Text size="xs" c="dimmed" ta="center">
                            {credential.description}
                          </Text>
                        </Stack>
                        <Button
                          size="sm"
                          variant="outline"
                          color={credential.color}
                          fullWidth
                        >
                          Auto-fill
                        </Button>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
          </Card>
        </Stack>
      </Box>
    </Flex>
  </Container>
  )
}