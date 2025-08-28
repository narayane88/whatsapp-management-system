'use client'

import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Badge,
  SimpleGrid,
  Box,
  ThemeIcon,
  Center,
  Divider,
  Paper,
  Grid,
  List,
  ActionIcon,
  Transition,
  BackgroundImage,
  Avatar,
  Spotlight,
  Timeline
} from '@mantine/core'
import {
  IconRocket,
  IconUsers,
  IconMessageCircle,
  IconDashboard,
  IconCoins,
  IconCheck,
  IconStar,
  IconTrendingUp,
  IconShield,
  IconBolt,
  IconCloud,
  IconDeviceMobile,
  IconApi,
  IconChartLine,
  IconTarget,
  IconArrowRight,
  IconPhone,
  IconMail,
  IconMapPin,
  IconGlobe,
  IconBuildingSkyscraper,
  IconTrophy,
  IconAward,
  IconCertificate,
  IconHeadset,
  IconClockHour24,
  IconDatabase,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconPlayerPlayFilled,
  IconZoomCheck,
  IconCrown,
  IconDiamond,
  IconMessage2
} from '@tabler/icons-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { usePublicCompanyProfile } from '@/hooks/usePublicCompanyProfile'

interface Package {
  id: string
  name: string
  description?: string
  price: number
  offer_price?: number | null
  offer_enabled?: boolean
  duration: number
  messageLimit: number
  instanceLimit: number
  mobile_accounts_limit?: number
  contact_limit?: number
  api_key_limit?: number
  receive_msg_limit?: number
  webhook_limit?: number
  package_color?: string
  popular?: boolean
  features?: string[]
}

export default function ProfessionalLandingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { profile } = usePublicCompanyProfile()
  const [mounted, setMounted] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [currentPackageIndex, setCurrentPackageIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Fetch packages on component mount
  useEffect(() => {
    setMounted(true)
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      setPackagesLoading(true)
      const response = await fetch('/api/public/packages')
      const data = await response.json()
      
      if (data.success && data.packages) {
        setPackages(data.packages)
        // Set the middle package as current if available
        if (data.packages.length > 1) {
          setCurrentPackageIndex(Math.floor(data.packages.length / 2))
        }
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setPackagesLoading(false)
    }
  }

  // Scroll functions
  const scrollToPrevious = () => {
    const newIndex = currentPackageIndex > 0 ? currentPackageIndex - 1 : packages.length - 1
    setCurrentPackageIndex(newIndex)
    scrollToPackage(newIndex)
  }

  const scrollToNext = () => {
    const newIndex = currentPackageIndex < packages.length - 1 ? currentPackageIndex + 1 : 0
    setCurrentPackageIndex(newIndex)
    scrollToPackage(newIndex)
  }

  const scrollToPackage = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardWidth = 350 // approximate card width + gap
      const scrollPosition = index * cardWidth - (container.offsetWidth / 2) + (cardWidth / 2)
      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      })
    }
  }

  const getPackageColor = (color?: string) => {
    const colorMap: Record<string, any> = {
      blue: { gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', color: 'blue' },
      emerald: { gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', color: 'emerald' },
      green: { gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', color: 'green' },
      purple: { gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', color: 'violet' },
      violet: { gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', color: 'violet' },
      orange: { gradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)', color: 'orange' },
      red: { gradient: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)', color: 'red' }
    }
    return colorMap[color || 'blue'] || colorMap.blue
  }

  const handleLogin = () => {
    router.push('/auth/signin')
  }

  const handleDashboard = () => {
    const userRole = session?.user?.role
    if (userRole === 'CUSTOMER') {
      router.push('/customer')
    } else if (['OWNER', 'ADMIN', 'SUBDEALER', 'EMPLOYEE'].includes(userRole)) {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }

  // Show dashboard redirect for logged-in users
  if (session) {
    return (
      <Box 
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Container size="sm">
          <Card shadow="xl" padding="xl" radius="xl" withBorder>
            <Stack align="center" gap="xl">
              <ThemeIcon size={80} radius="xl" variant="gradient" gradient={{ from: 'violet', to: 'purple' }}>
                <IconDashboard size={40} />
              </ThemeIcon>
              
              <Stack align="center" gap="md">
                <Title order={2} ta="center">Welcome back, {session.user?.name}!</Title>
                <Text c="dimmed" ta="center" size="lg">
                  Access your {profile.company_name} BizsApp Management System
                </Text>
              </Stack>
              
              <Button
                size="xl"
                radius="xl"
                variant="gradient"
                gradient={{ from: 'violet', to: 'purple' }}
                leftSection={<IconDashboard size={20} />}
                onClick={handleDashboard}
                fullWidth
              >
                {session.user?.role === 'CUSTOMER' ? 'Go to Customer Portal' : 'Go to Admin Dashboard'}
              </Button>
            </Stack>
          </Card>
        </Container>
      </Box>
    )
  }

  return (
    <Box>
      {/* Hero Section - Premium Design */}
      <Box
        style={{
          background: `
            linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
          `,
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Floating elements */}
        <Box
          style={{
            position: 'absolute',
            top: '15%',
            right: '10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'float 8s ease-in-out infinite'
          }}
        />
        
        {/* Login Button in Corner */}
        <Box
          style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            zIndex: 10
          }}
        >
          <Button
            variant="light"
            color="white"
            radius="xl"
            leftSection={<IconDashboard size={16} />}
            onClick={handleLogin}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white'
            }}
          >
            Login / Sign In
          </Button>
        </Box>
        
        <Container size="xl" style={{ position: 'relative', zIndex: 2 }}>
          <Stack justify="center" style={{ minHeight: '100vh' }} gap={50}>
            
            {/* Company Branding */}
            <Stack align="center" gap="lg">
              <Badge
                size="xl"
                variant="gradient"
                gradient={{ from: 'indigo', to: 'cyan' }}
                style={{ fontSize: '0.9rem', padding: '12px 24px' }}
              >
                🏢 Enterprise BizsApp Solutions
              </Badge>
              
              <Stack align="center" gap="md">
                <Title
                  size="4rem"
                  fw={900}
                  ta="center"
                  c="white"
                  style={{ 
                    lineHeight: 1.1,
                    textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {profile.company_name}
                </Title>
                <Text size="xl" c="gray.3" ta="center" fw={500}>
                  {profile.description}
                </Text>
              </Stack>
            </Stack>

            {/* Value Proposition */}
            <Stack align="center" gap="xl">
              <Stack align="center" gap="md" style={{ maxWidth: 800 }}>
                <Title
                  size="3rem"
                  ta="center"
                  c="white"
                  fw={700}
                  style={{ lineHeight: 1.2 }}
                >
                  Enterprise-Grade BizsApp Business Automation
                </Title>
                <Text size="xl" c="gray.3" ta="center" style={{ lineHeight: 1.6 }}>
                  Transform your business communication with our advanced BizsApp management platform. 
                  Built for enterprises, trusted by industry leaders, proven at scale.
                </Text>
              </Stack>

              {/* Key Metrics */}
              <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xl" w="100%">
                {[
                  { number: '99.9%', label: 'Uptime SLA', icon: IconShield },
                  { number: '10M+', label: 'Messages/Month', icon: IconMessageCircle },
                  { number: '500+', label: 'Enterprise Clients', icon: IconBuildingSkyscraper },
                  { number: '24/7', label: 'Expert Support', icon: IconHeadset }
                ].map((metric, index) => (
                  <Paper key={index} p="lg" radius="xl" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
                    <Stack align="center" gap="sm">
                      <ThemeIcon size={50} radius="xl" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                        <metric.icon size={25} />
                      </ThemeIcon>
                      <Title order={2} c="white" fw={900}>{metric.number}</Title>
                      <Text c="gray.3" size="sm" ta="center">{metric.label}</Text>
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>

              {/* CTA Buttons */}
              <Group gap="lg" mt="xl">
                <Button
                  size="xl"
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: 'indigo', to: 'cyan' }}
                  leftSection={<IconRocket size={24} />}
                  onClick={handleLogin}
                  style={{ 
                    fontSize: '1.1rem', 
                    padding: '16px 40px',
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  Start Enterprise Trial
                </Button>
                <Button
                  size="xl"
                  radius="xl"
                  variant="outline"
                  c="white"
                  style={{ 
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    fontSize: '1.1rem', 
                    padding: '16px 40px',
                    backdropFilter: 'blur(10px)'
                  }}
                  leftSection={<IconPhone size={20} />}
                >
                  Schedule Demo
                </Button>
              </Group>

              {/* Trust Indicators */}
              <Stack align="center" gap="md" mt="xl">
                <Text c="gray.4" size="sm">Trusted by industry leaders</Text>
                <Group gap="xl">
                  {['Fortune 500', 'ISO 27001', 'SOC 2 Certified', 'GDPR Compliant'].map((cert, index) => (
                    <Badge key={index} variant="outline" color="gray" size="lg" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
                      {cert}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Enterprise Features Section */}
      <Box py={120} style={{ background: '#ffffff' }}>
        <Container size="xl">
          <Stack gap={80}>
            
            {/* Section Header */}
            <Stack align="center" gap="xl">
              <Badge size="xl" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                Enterprise Platform
              </Badge>
              <Stack align="center" gap="md">
                <Title size="2.5rem" ta="center" c="dark.8" fw={700}>
                  Built for Enterprise Scale & Security
                </Title>
                <Text size="xl" c="gray.6" ta="center" maw={700}>
                  Comprehensive BizsApp business automation with enterprise-grade security, 
                  scalability, and compliance features designed for large organizations.
                </Text>
              </Stack>
            </Stack>

            {/* Feature Grid */}
            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="xl">
              {[
                {
                  icon: IconShield,
                  title: 'Enterprise Security',
                  description: 'Bank-level encryption, SSO integration, role-based access control, and comprehensive audit trails.',
                  color: 'red',
                  features: ['256-bit AES encryption', 'SSO/SAML integration', 'Multi-factor authentication', 'Compliance reporting']
                },
                {
                  icon: IconCloud,
                  title: 'Scalable Infrastructure',
                  description: 'Auto-scaling cloud infrastructure handling millions of messages with guaranteed 99.9% uptime.',
                  color: 'blue',
                  features: ['Auto-scaling capability', '99.9% uptime SLA', 'Global CDN', 'Load balancing']
                },
                {
                  icon: IconApi,
                  title: 'Advanced API Suite',
                  description: 'Comprehensive REST APIs with GraphQL support, webhooks, and real-time WebSocket connections.',
                  color: 'violet',
                  features: ['REST & GraphQL APIs', 'Real-time webhooks', 'SDK libraries', 'API rate limiting']
                },
                {
                  icon: IconChartLine,
                  title: 'Business Intelligence',
                  description: 'Advanced analytics, custom dashboards, real-time reporting, and data export capabilities.',
                  color: 'green',
                  features: ['Custom dashboards', 'Real-time analytics', 'Data export (CSV/Excel)', 'Custom reports']
                },
                {
                  icon: IconUsers,
                  title: 'Team Management',
                  description: 'Multi-tenant architecture with granular permissions, team hierarchies, and collaboration tools.',
                  color: 'orange',
                  features: ['Role-based access', 'Team hierarchies', 'Permission management', 'Activity tracking']
                },
                {
                  icon: IconBolt,
                  title: 'Automation Engine',
                  description: 'Sophisticated workflow automation, AI-powered responses, and intelligent message routing.',
                  color: 'yellow',
                  features: ['Workflow automation', 'AI-powered responses', 'Smart routing', 'Event triggers']
                }
              ].map((feature, index) => (
                <Card key={index} shadow="lg" padding="xl" radius="xl" withBorder h="100%" style={{ transition: 'transform 0.2s' }}>
                  <Stack gap="lg" h="100%">
                    <Group gap="md">
                      <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: feature.color, to: `${feature.color}.7` }}>
                        <feature.icon size={30} />
                      </ThemeIcon>
                      <Title order={3} fw={600}>{feature.title}</Title>
                    </Group>
                    
                    <Text c="gray.7" style={{ flex: 1 }}>
                      {feature.description}
                    </Text>
                    
                    <List size="sm" spacing="xs" icon={<IconCheck size={14} style={{ color: '#10b981' }} />}>
                      {feature.features.map((item, i) => (
                        <List.Item key={i}>{item}</List.Item>
                      ))}
                    </List>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* Pricing Section - Enterprise Focus */}
      <Box py={120} style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <Container size="xl">
          <Stack gap={60}>
            <Stack align="center" gap="md">
              <Title size="2.5rem" ta="center" c="dark.8" fw={700}>Enterprise Pricing Plans</Title>
              <Text size="xl" c="gray.6" ta="center" maw={600}>
                Flexible pricing designed to scale with your organization. All plans include our full feature suite.
              </Text>
            </Stack>

            {packagesLoading ? (
              <Center>
                <Stack align="center" gap="xl">
                  <Title order={3} c="gray.6">Loading Enterprise Plans...</Title>
                  <SimpleGrid cols={{ base: 1, md: 3 }} spacing={30}>
                    {[1, 2, 3].map((i) => (
                      <Paper key={i} p="xl" radius="xl" withBorder style={{ minWidth: 380, height: 700 }}>
                        <Stack gap="lg">
                          <div style={{ height: 40, background: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)', borderRadius: 8, animation: 'shimmer 2s infinite' }} />
                          <div style={{ height: 20, background: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)', borderRadius: 4, width: '70%', animation: 'shimmer 2s infinite' }} />
                          <div style={{ height: 60, background: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)', borderRadius: 8, animation: 'shimmer 2s infinite' }} />
                          <div style={{ height: 200, background: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)', borderRadius: 12, animation: 'shimmer 2s infinite' }} />
                          <div style={{ height: 50, background: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)', borderRadius: 25, animation: 'shimmer 2s infinite' }} />
                        </Stack>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Stack>
              </Center>
            ) : packages.length > 0 ? (
              <Stack gap={50}>
                {/* Professional Grid Layout - No Scroll for Better UX */}
                <SimpleGrid 
                  cols={{ base: 1, md: 2, lg: packages.length >= 3 ? 3 : packages.length }} 
                  spacing={30}
                >
                  {packages.map((pkg, index) => {
                    const isPopular = pkg.popular || index === Math.floor(packages.length / 2)
                    const packageColor = getPackageColor(pkg.package_color)
                    
                    return (
                      <Paper
                        key={pkg.id}
                        shadow="xl"
                        radius="xl"
                        style={{
                          background: isPopular 
                            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, rgba(139, 92, 246, 0.01) 100%)'
                            : '#ffffff',
                          border: isPopular ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                          position: 'relative',
                          height: '100%',
                          minHeight: 700,
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-8px)'
                          e.currentTarget.style.boxShadow = '0 24px 48px rgba(0,0,0,0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = ''
                        }}
                      >
                        {/* Popular Badge */}
                        {isPopular && (
                          <Box
                            style={{
                              position: 'absolute',
                              top: -15,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              zIndex: 2
                            }}
                          >
                            <Badge
                              size="xl"
                              variant="gradient"
                              gradient={{ from: 'violet', to: 'grape' }}
                              style={{ 
                                padding: '8px 24px',
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                              }}
                            >
                              ⭐ MOST POPULAR
                            </Badge>
                          </Box>
                        )}

                        {/* Card Header with Gradient */}
                        <Box
                          style={{
                            background: packageColor.gradient,
                            padding: '2rem',
                            borderRadius: '16px 16px 0 0',
                            marginBottom: '1.5rem'
                          }}
                        >
                          <Stack gap="md">
                            <Title order={2} c="white" fw={800} ta="center">
                              {pkg.name}
                            </Title>
                            {pkg.description && (
                              <Text c="white" opacity={0.9} ta="center" size="sm">
                                {pkg.description}
                              </Text>
                            )}
                          </Stack>
                        </Box>

                        <Box px="xl" pb="xl">
                          <Stack gap="xl">
                            {/* Pricing Section */}
                            <Box ta="center">
                              {pkg.offer_enabled && pkg.offer_price ? (
                                <Stack gap="xs" align="center">
                                  <Group gap="xs" justify="center" align="baseline">
                                    <Text c="gray.5" td="line-through" size="xl">
                                      ₹{pkg.price.toLocaleString('en-IN')}
                                    </Text>
                                    <Badge color="green" size="lg" variant="light">
                                      {Math.round(((pkg.price - pkg.offer_price) / pkg.price) * 100)}% OFF
                                    </Badge>
                                  </Group>
                                  <Group gap="xs" justify="center" align="baseline">
                                    <Title order={1} fw={900} c={packageColor.color} size="3rem">
                                      ₹{pkg.offer_price.toLocaleString('en-IN')}
                                    </Title>
                                    <Text c="gray.6" size="lg">/{pkg.duration} days</Text>
                                  </Group>
                                  <Text c="green.6" fw={600} size="sm">
                                    You save ₹{(pkg.price - pkg.offer_price).toLocaleString('en-IN')}
                                  </Text>
                                </Stack>
                              ) : (
                                <Group gap="xs" justify="center" align="baseline">
                                  <Title order={1} fw={900} c={packageColor.color} size="3rem">
                                    ₹{pkg.price.toLocaleString('en-IN')}
                                  </Title>
                                  <Text c="gray.6" size="lg">/{pkg.duration} days</Text>
                                </Group>
                              )}
                            </Box>

                            <Divider />

                            {/* Key Features Grid */}
                            <SimpleGrid cols={2} spacing="md">
                              <Paper p="md" radius="lg" style={{ background: '#f8f9fa' }}>
                                <Stack align="center" gap="xs">
                                  <ThemeIcon size={40} color={packageColor.color} variant="light">
                                    <IconMessage2 size={20} />
                                  </ThemeIcon>
                                  <Text fw={700} size="lg">{pkg.messageLimit.toLocaleString('en-IN')}</Text>
                                  <Text size="xs" c="gray.6">Messages/Month</Text>
                                </Stack>
                              </Paper>
                              
                              <Paper p="md" radius="lg" style={{ background: '#f8f9fa' }}>
                                <Stack align="center" gap="xs">
                                  <ThemeIcon size={40} color={packageColor.color} variant="light">
                                    <IconDeviceMobile size={20} />
                                  </ThemeIcon>
                                  <Text fw={700} size="lg">{pkg.instanceLimit}</Text>
                                  <Text size="xs" c="gray.6">BizsApp Instances</Text>
                                </Stack>
                              </Paper>
                              
                              <Paper p="md" radius="lg" style={{ background: '#f8f9fa' }}>
                                <Stack align="center" gap="xs">
                                  <ThemeIcon size={40} color={packageColor.color} variant="light">
                                    <IconUsers size={20} />
                                  </ThemeIcon>
                                  <Text fw={700} size="lg">
                                    {pkg.contact_limit ? pkg.contact_limit.toLocaleString('en-IN') : 'Unlimited'}
                                  </Text>
                                  <Text size="xs" c="gray.6">Contacts</Text>
                                </Stack>
                              </Paper>
                              
                              <Paper p="md" radius="lg" style={{ background: '#f8f9fa' }}>
                                <Stack align="center" gap="xs">
                                  <ThemeIcon size={40} color={packageColor.color} variant="light">
                                    <IconApi size={20} />
                                  </ThemeIcon>
                                  <Text fw={700} size="lg">{pkg.api_key_limit || 'Unlimited'}</Text>
                                  <Text size="xs" c="gray.6">API Keys</Text>
                                </Stack>
                              </Paper>
                            </SimpleGrid>

                            {/* Feature List */}
                            <Stack gap="sm">
                              <Text fw={600} c="gray.7" size="sm">INCLUDED FEATURES:</Text>
                              <Stack gap="xs">
                                {(pkg.features || []).slice(0, 8).map((feature, i) => (
                                  <Group key={i} gap="sm" align="flex-start">
                                    <ThemeIcon size={18} color="green" variant="light" radius="xl" style={{ marginTop: '2px', minWidth: '18px' }}>
                                      <IconCheck size={10} />
                                    </ThemeIcon>
                                    <Text size="sm" c="gray.7" style={{ lineHeight: 1.4 }}>
                                      {feature}
                                    </Text>
                                  </Group>
                                ))}
                                
                                {/* Show more indicator if there are additional features */}
                                {pkg.features && pkg.features.length > 8 && (
                                  <Group gap="sm">
                                    <ThemeIcon size={18} color="violet" variant="light" radius="xl">
                                      <Text size="xs" fw={600}>+</Text>
                                    </ThemeIcon>
                                    <Text size="xs" c="violet.6" fw={600}>
                                      +{pkg.features.length - 8} more premium features included
                                    </Text>
                                  </Group>
                                )}
                              </Stack>
                            </Stack>

                            {/* CTA Button */}
                            <Button
                              size="xl"
                              radius="xl"
                              fullWidth
                              variant={isPopular ? 'gradient' : 'outline'}
                              gradient={isPopular ? { from: 'violet', to: 'grape' } : undefined}
                              color={isPopular ? undefined : packageColor.color}
                              onClick={handleLogin}
                              style={{
                                height: 56,
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                letterSpacing: '0.5px',
                                marginTop: 'auto'
                              }}
                            >
                              {isPopular ? '🚀 Get Started Now' : 'Choose This Plan'}
                            </Button>
                          </Stack>
                        </Box>
                      </Paper>
                    )
                  })}
                </SimpleGrid>

                {/* Enterprise Custom Plan */}
                <Card
                  shadow="md"
                  radius="xl"
                  padding="xl"
                  style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    border: '2px solid #475569'
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Stack gap="sm">
                      <Group gap="md">
                        <ThemeIcon size={50} radius="xl" variant="gradient" gradient={{ from: 'gold', to: 'orange' }}>
                          <IconCrown size={26} />
                        </ThemeIcon>
                        <div>
                          <Title order={2} c="white">Need a Custom Enterprise Solution?</Title>
                          <Text c="gray.3" size="lg" mt="xs">
                            Get unlimited everything with dedicated support, custom integrations, and SLA guarantees
                          </Text>
                        </div>
                      </Group>
                    </Stack>
                    <Button
                      size="lg"
                      radius="xl"
                      variant="white"
                      color="dark"
                      leftSection={<IconPhone size={20} />}
                      onClick={handleLogin}
                      style={{ minWidth: 200 }}
                    >
                      Contact Sales Team
                    </Button>
                  </Group>
                </Card>
              </Stack>
            ) : (
              <Center>
                <Stack align="center" gap="xl" py={60}>
                  <ThemeIcon size={80} radius="xl" variant="light" color="gray">
                    <IconMessage2 size={40} />
                  </ThemeIcon>
                  <Title order={3} c="gray.6">No Pricing Plans Available</Title>
                  <Text c="gray.5" ta="center" maw={400}>
                    We're currently updating our pricing structure. Please contact us for custom enterprise solutions.
                  </Text>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    leftSection={<IconPhone size={20} />}
                    onClick={handleLogin}
                  >
                    Get Custom Quote
                  </Button>
                </Stack>
              </Center>
            )}

            <Center>
              <Stack align="center" gap="md">
                <Text c="gray.6" size="sm">All plans include 14-day free trial • No setup fees • Cancel anytime</Text>
                <Button variant="subtle" size="sm" leftSection={<IconPhone size={16} />}>
                  Need custom pricing? Contact our sales team
                </Button>
              </Stack>
            </Center>
          </Stack>
        </Container>
      </Box>

      {/* Why Choose Us Section */}
      <Box py={120} style={{ background: '#ffffff' }}>
        <Container size="xl">
          <Stack gap={80}>
            <Stack align="center" gap="md">
              <Title size="2.5rem" ta="center" c="dark.8" fw={700}>
                Why Fortune 500 Companies Choose {profile.company_name}
              </Title>
              <Text size="xl" c="gray.6" ta="center" maw={700}>
                Industry-leading platform trusted by enterprises worldwide for mission-critical communication.
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="xl">
              {[
                { icon: IconAward, title: 'Industry Leader', desc: 'Recognized as a leader in business communication platforms' },
                { icon: IconCertificate, title: 'Certified Secure', desc: 'ISO 27001, SOC 2, and GDPR compliant infrastructure' },
                { icon: IconTrophy, title: '99.9% Uptime', desc: 'Enterprise SLA with guaranteed uptime and performance' },
                { icon: IconHeadset, title: '24/7 Support', desc: 'Dedicated support team with enterprise-level response times' }
              ].map((item, index) => (
                <Stack key={index} align="center" gap="lg">
                  <ThemeIcon size={70} radius="xl" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
                    <item.icon size={35} />
                  </ThemeIcon>
                  <Stack align="center" gap="sm">
                    <Title order={4} ta="center">{item.title}</Title>
                    <Text c="gray.6" ta="center" size="sm">{item.desc}</Text>
                  </Stack>
                </Stack>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={120} style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
        <Container size="xl">
          <Stack align="center" gap="xl">
            <Stack align="center" gap="md">
              <Title size="2.5rem" ta="center" c="white" fw={700}>
                Ready to Transform Your Business Communication?
              </Title>
              <Text size="xl" c="gray.3" ta="center" maw={600}>
                Join thousands of enterprises already using {profile.company_name} to streamline 
                their BizsApp business communication at scale.
              </Text>
            </Stack>

            <Group gap="lg">
              <Button
                size="xl"
                radius="xl"
                variant="gradient"
                gradient={{ from: 'indigo', to: 'cyan' }}
                leftSection={<IconRocket size={24} />}
                onClick={handleLogin}
                style={{ fontSize: '1.1rem', padding: '16px 40px' }}
              >
                Start Free Enterprise Trial
              </Button>
              <Button
                size="xl"
                radius="xl"
                variant="outline"
                c="white"
                style={{ borderColor: 'rgba(255, 255, 255, 0.3)', fontSize: '1.1rem', padding: '16px 40px' }}
                leftSection={<IconPhone size={20} />}
              >
                Schedule Demo Call
              </Button>
            </Group>

            <Text c="gray.4" size="sm" ta="center">
              ✓ No credit card required ✓ 14-day free trial ✓ Enterprise support included
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={60} style={{ background: '#0f172a' }}>
        <Container size="xl">
          <Stack gap="xl">
            <Group justify="space-between" align="flex-start">
              <Stack gap="md" style={{ maxWidth: 300 }}>
                <Title order={3} c="white">{profile.company_name}</Title>
                <Text c="gray.4" size="sm">
                  {profile.description}
                </Text>
                <Group gap="md">
                  <ActionIcon size="lg" variant="subtle" c="gray.5">
                    <IconPhone size={18} />
                  </ActionIcon>
                  <Text c="gray.5" size="sm">{profile.mobile_number}</Text>
                </Group>
                <Group gap="md">
                  <ActionIcon size="lg" variant="subtle" c="gray.5">
                    <IconMail size={18} />
                  </ActionIcon>
                  <Text c="gray.5" size="sm">{profile.email}</Text>
                </Group>
                <Group gap="md">
                  <ActionIcon size="lg" variant="subtle" c="gray.5">
                    <IconMapPin size={18} />
                  </ActionIcon>
                  <Text c="gray.5" size="sm">{profile.city}, {profile.state}, {profile.country}</Text>
                </Group>
              </Stack>

              <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xl">
                <Stack gap="md">
                  <Title order={5} c="white">Platform</Title>
                  <Stack gap="xs">
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Features</Text>
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Integrations</Text>
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>API Documentation</Text>
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Security</Text>
                  </Stack>
                </Stack>

                <Stack gap="md">
                  <Title order={5} c="white">Solutions</Title>
                  <Stack gap="xs">
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Enterprise</Text>
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Small Business</Text>
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Developers</Text>
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Partners</Text>
                  </Stack>
                </Stack>

                <Stack gap="md">
                  <Title order={5} c="white">Resources</Title>
                  <Stack gap="xs">
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Documentation</Text>
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Help Center</Text>
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Status Page</Text>
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Blog</Text>
                  </Stack>
                </Stack>

                <Stack gap="md">
                  <Title order={5} c="white">Company</Title>
                  <Stack gap="xs">
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>About Us</Text>
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Careers</Text>
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Privacy Policy</Text>
                    <Text c="gray.5" size="sm" style={{ cursor: 'pointer' }}>Terms of Service</Text>
                  </Stack>
                </Stack>
              </SimpleGrid>
            </Group>

            <Divider color="gray.8" />

            <Group justify="space-between">
              <Text c="gray.5" size="sm">
                © {new Date().getFullYear()} {profile.company_name}. All rights reserved.
              </Text>
              <Text c="gray.5" size="xs">
                Powered by bizflash.in
              </Text>
            </Group>
          </Stack>
        </Container>
      </Box>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        .mantine-Card-root:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        .pricing-scroll-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .pricing-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </Box>
  )
}