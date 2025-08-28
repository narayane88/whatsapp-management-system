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
  Container,
  Group,
  Center,
  Divider,
  Paper,
  Transition,
  rem,
} from '@mantine/core'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { notifications } from '@mantine/notifications'
import { useTheme } from '@/hooks/useTheme'
import { IconBrandWhatsapp, IconLock, IconMail, IconArrowRight } from '@tabler/icons-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { currentTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 50%, #075E54 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(255,255,255,0.06) 0%, transparent 50%)
          `,
          animation: 'float 6s ease-in-out infinite',
        }}
      />
      
      <Container size="sm" style={{ position: 'relative', zIndex: 1 }}>
        <Flex align="center" justify="center" style={{ minHeight: '100vh' }} p="xl">
          <Transition
            mounted={mounted}
            transition="fade"
            duration={800}
            timingFunction="ease"
          >
            {(styles) => (
              <Paper
                style={{
                  ...styles,
                  width: '100%',
                  maxWidth: rem(450),
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                }}
                radius="xl"
                p="xl"
              >
                <Stack gap="xl">
                  {/* Header Section */}
                  <Center>
                    <Stack align="center" gap="md">
                      <Box
                        style={{
                          background: 'linear-gradient(135deg, #25D366, #128C7E)',
                          borderRadius: '50%',
                          padding: rem(16),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 20px rgba(37, 211, 102, 0.3)',
                        }}
                      >
                        <IconBrandWhatsapp size={32} color="white" />
                      </Box>
                      <Stack align="center" gap={4}>
                        <Title
                          order={1}
                          size="h2"
                          style={{
                            background: 'linear-gradient(135deg, #25D366, #128C7E)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 700,
                          }}
                        >
                          WhatsApp Business
                        </Title>
                        <Text c="dimmed" size="sm" ta="center">
                          Professional messaging solution for your business
                        </Text>
                      </Stack>
                    </Stack>
                  </Center>

                  <Divider 
                    style={{ 
                      background: 'linear-gradient(90deg, transparent, #e9ecef, transparent)' 
                    }} 
                  />

                  {/* Form Section */}
                  <Stack gap="lg">
                    <TextInput
                      leftSection={<IconMail size={18} />}
                      label="Email Address"
                      placeholder="Enter your business email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      size="md"
                      styles={{
                        input: {
                          borderRadius: rem(12),
                          border: '2px solid #e9ecef',
                          transition: 'all 0.2s ease',
                          '&:focus': {
                            borderColor: '#25D366',
                            boxShadow: '0 0 0 3px rgba(37, 211, 102, 0.1)',
                          },
                        },
                        label: { fontWeight: 600, color: '#495057' },
                      }}
                    />

                    <TextInput
                      leftSection={<IconLock size={18} />}
                      label="Password"
                      placeholder="Enter your secure password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      size="md"
                      styles={{
                        input: {
                          borderRadius: rem(12),
                          border: '2px solid #e9ecef',
                          transition: 'all 0.2s ease',
                          '&:focus': {
                            borderColor: '#25D366',
                            boxShadow: '0 0 0 3px rgba(37, 211, 102, 0.1)',
                          },
                        },
                        label: { fontWeight: 600, color: '#495057' },
                      }}
                    />

                    <Button
                      size="lg"
                      fullWidth
                      onClick={handleSignIn}
                      loading={isLoading}
                      rightSection={<IconArrowRight size={18} />}
                      style={{
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        border: 'none',
                        borderRadius: rem(12),
                        height: rem(50),
                        fontWeight: 600,
                        fontSize: rem(16),
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
                      }}
                      styles={{
                        root: {
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)',
                          },
                        },
                      }}
                    >
                      Access Dashboard
                    </Button>
                  </Stack>

                  {/* Security Note */}
                  <Box
                    style={{
                      background: 'rgba(37, 211, 102, 0.1)',
                      borderRadius: rem(12),
                      padding: rem(16),
                      border: '1px solid rgba(37, 211, 102, 0.2)',
                    }}
                  >
                    <Group gap="sm">
                      <IconLock size={16} color="#25D366" />
                      <Text size="sm" c="#25D366" fw={500}>
                        Your connection is secured with enterprise-grade encryption
                      </Text>
                    </Group>
                  </Box>
                </Stack>
              </Paper>
            )}
          </Transition>
        </Flex>
      </Container>
      
      {/* Footer */}
      <Box 
        style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 0',
          textAlign: 'center',
          zIndex: 1
        }}
      >
        <Text size="xs" c="rgba(255, 255, 255, 0.8)">
          Powered by bizflash.in
        </Text>
      </Box>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
      `}</style>
    </Box>
  )
}