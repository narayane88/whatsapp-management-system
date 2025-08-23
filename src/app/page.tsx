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
  Anchor,
  Image,
  BackgroundImage,
  Overlay,
  Divider,
  Timeline,
  Paper,
  Grid,
  List,
  ActionIcon,
  Modal,
  NumberInput,
  Select
} from '@mantine/core'
import { Carousel } from '@mantine/carousel'
import {
  IconWhatsapp,
  IconRocket,
  IconUsers,
  IconMessageCircle,
  IconDashboard,
  IconCoins,
  IconCreditCard,
  IconCheck,
  IconStar,
  IconTrendingUp,
  IconShield,
  IconBolt,
  IconCloud,
  IconDeviceMobile,
  IconApi,
  IconWebhook,
  IconChartLine,
  IconGift,
  IconTarget,
  IconArrowRight,
  IconPlaylist,
  IconBrandWhatsapp,
  IconPhone,
  IconMail,
  IconMapPin,
  IconArrowUp,
  IconShoppingCart,
  IconUser,
  IconBrandWindows,
  IconDatabase,
  IconPlugConnected,
  IconGlobe,
  IconChevronLeft,
  IconChevronRight,
  IconPlayerPlayFilled,
  IconPlayerPauseFilled
} from '@tabler/icons-react'
import { useState, useEffect, useCallback } from 'react'
import { useDisclosure } from '@mantine/hooks'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import BizCoinIcon from '@/components/icons/BizCoinIcon'

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
  features?: string[] | any
}

interface BizCoinPackage {
  id: string
  name: string
  coins: number
  price: number
  bonus: number
  popular?: boolean
  savings: string
}

export default function HomePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [packageModalOpened, { open: openPackageModal, close: closePackageModal }] = useDisclosure(false)
  const [bizCoinModalOpened, { open: openBizCoinModal, close: closeBizCoinModal }] = useDisclosure(false)
  const [autoPlay, setAutoPlay] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [emblaApi, setEmblaApi] = useState<any>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Keyboard navigation
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (emblaApi) {
      switch (event.key) {
        case 'ArrowLeft':
          emblaApi.scrollPrev()
          break
        case 'ArrowRight':
          emblaApi.scrollNext()
          break
        case ' ':
          event.preventDefault()
          setAutoPlay(prev => !prev)
          break
      }
    }
  }, [emblaApi])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && emblaApi && !isHovered) {
      const autoplayInterval = setInterval(() => {
        emblaApi.scrollNext()
      }, 4000)

      return () => clearInterval(autoplayInterval)
    }
  }, [autoPlay, emblaApi, isHovered])

  // Navigation functions
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index)
  }, [emblaApi])

  const handleLogin = () => {
    router.push('/auth/signin')
  }

  const handleDashboard = () => {
    const userRole = session?.user?.role
    
    // Route users to their appropriate portal
    if (userRole === 'CUSTOMER') {
      router.push('/customer')
    } else if (['OWNER', 'ADMIN', 'SUBDEALER', 'EMPLOYEE'].includes(userRole)) {
      router.push('/admin')
    } else {
      // For users without proper roles, stay on home page
      router.push('/')
    }
  }

  // Fetch real packages from API
  const fetchPackages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/public/packages')
      const data = await response.json()
      
      if (data.success && data.packages) {
        setPackages(data.packages)
      } else {
        console.error('Failed to fetch packages:', data.error)
        // Fallback to sample data
        setPackages(getSamplePackages())
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      // Fallback to sample data
      setPackages(getSamplePackages())
    } finally {
      setLoading(false)
    }
  }

  // Fallback sample packages
  const getSamplePackages = (): Package[] => [
    {
      id: 'basic',
      name: 'Starter Plan',
      description: 'Perfect for small businesses getting started',
      price: 999,
      offer_price: 799,
      offer_enabled: true,
      duration: 30,
      messageLimit: 5000,
      instanceLimit: 2,
      mobile_accounts_limit: 2,
      contact_limit: 1000,
      api_key_limit: 1,
      receive_msg_limit: 1000,
      webhook_limit: 1,
      package_color: 'blue',
      features: [
        '5,000 messages per month',
        '2 WhatsApp instances',
        '1,000 contacts storage',
        'Basic automation',
        'Email support'
      ]
    },
    {
      id: 'professional',
      name: 'Business Pro',
      description: 'Most popular for growing businesses',
      price: 2999,
      offer_price: 2399,
      offer_enabled: true,
      duration: 30,
      messageLimit: 25000,
      instanceLimit: 10,
      mobile_accounts_limit: 10,
      contact_limit: 10000,
      api_key_limit: 5,
      receive_msg_limit: 10000,
      webhook_limit: 3,
      package_color: 'emerald',
      popular: true,
      features: [
        '25,000 messages per month',
        '10 WhatsApp instances',
        '10,000 contacts storage',
        'Advanced automation',
        'Bulk messaging',
        'Analytics dashboard',
        'Priority support',
        'API access'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Unlimited power for large organizations',
      price: 9999,
      offer_price: 7999,
      offer_enabled: true,
      duration: 30,
      messageLimit: 100000,
      instanceLimit: 50,
      mobile_accounts_limit: 50,
      contact_limit: 100000,
      api_key_limit: 20,
      receive_msg_limit: 50000,
      webhook_limit: 10,
      package_color: 'purple',
      features: [
        '100,000 messages per month',
        '50 WhatsApp instances',
        '100,000 contacts storage',
        'AI-powered automation',
        'Multi-user dashboard',
        'Custom integrations',
        'Dedicated support',
        'White-label solution'
      ]
    }
  ]

  const bizCoinPackages: BizCoinPackage[] = [
    {
      id: 'starter',
      name: 'Starter Pack',
      coins: 1000,
      price: 100,
      bonus: 50,
      savings: 'Best for beginners'
    },
    {
      id: 'popular',
      name: 'Popular Pack',
      coins: 5000,
      price: 450,
      bonus: 500,
      popular: true,
      savings: 'Save ₹50 + 500 bonus coins'
    },
    {
      id: 'business',
      name: 'Business Pack',
      coins: 10000,
      price: 850,
      bonus: 1500,
      savings: 'Save ₹150 + 1500 bonus coins'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Pack',
      coins: 25000,
      price: 2000,
      bonus: 5000,
      savings: 'Save ₹500 + 5000 bonus coins'
    }
  ]

  useEffect(() => {
    fetchPackages()
  }, [])

  const getPackageColor = (color?: string) => {
    const colorMap: Record<string, any> = {
      blue: {
        gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
        bg: 'blue.0',
        color: 'blue.7'
      },
      emerald: {
        gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        bg: 'emerald.0',
        color: 'emerald.7'
      },
      green: {
        gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        bg: 'emerald.0',
        color: 'emerald.7'
      },
      purple: {
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
        bg: 'violet.0',
        color: 'violet.7'
      },
      violet: {
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
        bg: 'violet.0',
        color: 'violet.7'
      },
      orange: {
        gradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
        bg: 'orange.0',
        color: 'orange.7'
      },
      red: {
        gradient: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
        bg: 'red.0',
        color: 'red.7'
      }
    }
    return colorMap[color || 'blue'] || colorMap.blue
  }

  // Show existing dashboard for logged-in users
  if (session) {
    return (
      <Box py={50}>
        <Container size="xl">
          <Stack gap="xl" align="center">
            <Group gap="lg">
              <Image
                src="/bizflash-logo-light.png"
                alt="Bizflash Logo"
                height={60}
                width="auto"
              />
              <Stack gap="xs">
                <Group gap="xs">
                  <Title size="2rem">Welcome back, {session.user?.name}!</Title>
                  <Badge color="orange" variant="light">Bizflash.in</Badge>
                </Group>
                <Text c="gray.6">Access your Bizflash WhatsApp Management Dashboard</Text>
              </Stack>
            </Group>

            <Button
              size="xl"
              radius="xl"
              variant="gradient"
              gradient={{ from: 'violet', to: 'purple' }}
              leftSection={<IconDashboard size={20} />}
              onClick={handleDashboard}
            >
              {session.user?.role === 'CUSTOMER' ? 'Go to Customer Portal' : 'Go to Admin Dashboard'}
            </Button>
          </Stack>
        </Container>
      </Box>
    )
  }

  return (
    <Box>
      {/* Hero Section */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Floating Elements */}
        <Box
          style={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        <Box
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '5%',
            width: '150px',
            height: '150px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            filter: 'blur(30px)',
            animation: 'float 4s ease-in-out infinite reverse'
          }}
        />

        <Container size="xl" style={{ position: 'relative', zIndex: 2 }}>
          <Stack align="center" justify="center" style={{ minHeight: '100vh' }} gap="xl">
            {/* Logo & Brand */}
            <Group gap="lg" className="logo-isolated">
              <Image
                src="/bizflash-logo-light.png"
                alt="Bizflash Logo"
                height={80}
                width="auto"
                className="landing-header-logo"
              />
              <Stack gap={0}>
                <Group gap="xs" align="center">
                  <Title size="2.5rem" c="dark" fw={800} className="logo-text-enhance">Bizflash</Title>
                  <Badge size="lg" color="orange" variant="filled" style={{ fontSize: '0.7rem' }}>
                    .in
                  </Badge>
                </Group>
                <Text size="xl" c="gray.8" opacity={0.8}>WhatsApp Business Automation Platform</Text>
              </Stack>
            </Group>

            {/* Hero Title */}
            <Stack align="center" gap="md">
              <Badge
                size="xl"
                variant="gradient"
                gradient={{ from: 'orange', to: 'red' }}
                style={{ fontSize: '1rem', padding: '8px 16px' }}
              >
                🚀 Trusted by 10,000+ Businesses | Bizflash.in
              </Badge>
              <Title
                size="3.5rem"
                c="white"
                ta="center"
                fw={900}
                style={{ maxWidth: '800px', lineHeight: 1.1 }}
              >
                The Future of WhatsApp Business Automation
              </Title>
              <Text size="xl" c="white" ta="center" opacity={0.9} style={{ maxWidth: '600px' }}>
                <strong>Bizflash.in</strong> empowers businesses with intelligent WhatsApp automation, seamless CRM integrations, and powerful analytics to boost sales and customer engagement.
              </Text>
            </Stack>

            {/* Key Features */}
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg" w="100%">
              {[
                { icon: IconUsers, label: 'Multi-Account', desc: 'Manage 50+ instances' },
                { icon: IconMessageCircle, label: 'Bulk Messaging', desc: '100K+ messages/month' },
                { icon: IconCoins, label: 'BizCoins System', desc: 'Earn & spend rewards' },
                { icon: IconChartLine, label: 'Analytics', desc: 'Real-time insights' }
              ].map((feature, index) => (
                <Card key={index} padding="lg" radius="xl" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
                  <Stack align="center" gap="sm">
                    <ThemeIcon size={50} radius="xl" variant="gradient" gradient={{ from: 'white', to: 'gray.1' }}>
                      <feature.icon size={25} style={{ color: '#667eea' }} />
                    </ThemeIcon>
                    <Text fw={600} c="white" ta="center">{feature.label}</Text>
                    <Text size="sm" c="white" opacity={0.8} ta="center">{feature.desc}</Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>

            {/* CTA Buttons */}
            <Group gap="lg">
              <Button
                size="xl"
                radius="xl"
                variant="white"
                color="violet"
                leftSection={<IconRocket size={20} />}
                onClick={handleLogin}
                style={{ fontSize: '1.1rem', padding: '12px 32px' }}
              >
                Start Free Trial
              </Button>
              <Button
                size="xl"
                radius="xl"
                variant="outline"
                c="white"
                style={{ borderColor: 'white', fontSize: '1.1rem', padding: '12px 32px' }}
                onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Packages
              </Button>
              <Button
                size="xl"
                radius="xl"
                variant="light"
                color="gray"
                leftSection={<IconUser size={20} />}
                onClick={handleLogin}
                style={{ fontSize: '1.1rem', padding: '12px 32px', background: 'rgba(255, 255, 255, 0.9)', color: '#1a1b23' }}
              >
                Login
              </Button>
            </Group>

            {/* Trust Indicators */}
            <Group gap="xl" mt="xl">
              <Stack align="center" gap="xs">
                <Text size="2rem" fw={900} c="white">10K+</Text>
                <Text c="white" opacity={0.9}>Active Users</Text>
              </Stack>
              <Stack align="center" gap="xs">
                <Text size="2rem" fw={900} c="white">1M+</Text>
                <Text c="white" opacity={0.9}>Messages Sent</Text>
              </Stack>
              <Stack align="center" gap="xs">
                <Text size="2rem" fw={900} c="white">99.9%</Text>
                <Text c="white" opacity={0.9}>Uptime</Text>
              </Stack>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* BizCoins Section */}
      <Box py={100} style={{ background: 'linear-gradient(135deg, #f8f9fe 0%, #f0f4f8 100%)' }}>
        <Container size="xl">
          <Stack align="center" gap="xl">
            <Stack align="center" gap="md">
              <Group gap="lg">
                <BizCoinIcon size={60} />
                <Title size="2.5rem" c="violet.8">Introducing BizCoins</Title>
              </Group>
              <Text size="xl" c="gray.7" ta="center" maw={600}>
                Our revolutionary reward system that lets you earn commissions, purchase packages, and unlock premium features.
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" w="100%">
              <Card shadow="lg" padding="xl" radius="xl" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <Stack align="center" gap="lg">
                  <ThemeIcon size={60} radius="xl" c="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <IconCoins size={30} />
                  </ThemeIcon>
                  <Title order={3} ta="center">Earn BizCoins</Title>
                  <Text ta="center" opacity={0.9}>
                    Get rewarded for every referral, subscription purchase, and business milestone. Build your coin balance effortlessly.
                  </Text>
                  <Badge size="lg" color="white" c="pink.6">Up to 30% Commission</Badge>
                </Stack>
              </Card>

              <Card shadow="lg" padding="xl" radius="xl" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <Stack align="center" gap="lg">
                  <ThemeIcon size={60} radius="xl" c="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <IconShoppingCart size={30} />
                  </ThemeIcon>
                  <Title order={3} ta="center">Spend Coins</Title>
                  <Text ta="center" opacity={0.9}>
                    Use BizCoins to purchase subscription packages, unlock premium features, and access exclusive tools.
                  </Text>
                  <Badge size="lg" color="white" c="blue.6">1 Coin = ₹1</Badge>
                </Stack>
              </Card>

              <Card shadow="lg" padding="xl" radius="xl" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                <Stack align="center" gap="lg">
                  <ThemeIcon size={60} radius="xl" c="white" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    <IconGift size={30} />
                  </ThemeIcon>
                  <Title order={3} ta="center">Bonus Rewards</Title>
                  <Text ta="center" opacity={0.9}>
                    Enjoy bonus coins on bulk purchases, loyalty rewards, and special promotional offers throughout the year.
                  </Text>
                  <Badge size="lg" color="white" c="green.6">Up to 25% Bonus</Badge>
                </Stack>
              </Card>
            </SimpleGrid>

            <Button
              size="xl"
              radius="xl"
              variant="gradient"
              gradient={{ from: 'violet', to: 'purple' }}
              leftSection={<BizCoinIcon size={20} />}
              onClick={openBizCoinModal}
            >
              Buy BizCoins Now
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Bizflash.in Brand Promotion */}
      <Box py={80} style={{ background: 'linear-gradient(135deg, #1a1b23 0%, #2a2b33 100%)', position: 'relative', overflow: 'hidden' }}>
        {/* Background Pattern */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.3
          }}
        />
        
        <Container size="xl" style={{ position: 'relative', zIndex: 2 }}>
          <Stack align="center" gap="xl">
            <Group gap="lg" align="center">
              <Image
                src="/bizflash-logo-light.png"
                alt="Bizflash Logo"
                height={60}
                width="auto"
              />
              <Stack gap="xs" align="center">
                <Group gap="xs" align="baseline">
                  <Title size="3rem" c="white" fw={900}>Bizflash</Title>
                  <Title size="2rem" c="orange.4" fw={900}>.in</Title>
                </Group>
                <Text size="lg" c="gray.4" ta="center">Your Trusted WhatsApp Business Partner</Text>
              </Stack>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" w="100%">
              <Card shadow="lg" padding="xl" radius="xl" style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                <Stack align="center" gap="lg">
                  <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
                    <IconTrendingUp size={30} />
                  </ThemeIcon>
                  <Title order={3} c="white" ta="center">Bizflash.in Success</Title>
                  <Text c="gray.3" ta="center">
                    Over <strong style={{ color: '#f97316' }}>500% ROI increase</strong> for businesses using Bizflash.in WhatsApp automation platform.
                  </Text>
                  <Badge size="lg" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
                    Proven Results
                  </Badge>
                </Stack>
              </Card>

              <Card shadow="lg" padding="xl" radius="xl" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <Stack align="center" gap="lg">
                  <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'green', to: 'lime' }}>
                    <IconUsers size={30} />
                  </ThemeIcon>
                  <Title order={3} c="white" ta="center">Bizflash.in Community</Title>
                  <Text c="gray.3" ta="center">
                    Join our thriving community of <strong style={{ color: '#22c55e' }}>10,000+ businesses</strong> growing with Bizflash.in.
                  </Text>
                  <Badge size="lg" variant="gradient" gradient={{ from: 'green', to: 'lime' }}>
                    Growing Fast
                  </Badge>
                </Stack>
              </Card>

              <Card shadow="lg" padding="xl" radius="xl" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <Stack align="center" gap="lg">
                  <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                    <IconRocket size={30} />
                  </ThemeIcon>
                  <Title order={3} c="white" ta="center">Bizflash.in Innovation</Title>
                  <Text c="gray.3" ta="center">
                    Cutting-edge AI and automation technology powering the <strong style={{ color: '#3b82f6' }}>next generation</strong> of business communication.
                  </Text>
                  <Badge size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                    AI-Powered
                  </Badge>
                </Stack>
              </Card>
            </SimpleGrid>

            <Group gap="lg">
              <Button
                size="xl"
                radius="xl"
                variant="gradient"
                gradient={{ from: 'orange', to: 'red' }}
                leftSection={<IconGlobe size={20} />}
                component="a"
                href="https://bizflash.in"
                target="_blank"
              >
                Visit Bizflash.in
              </Button>
              <Button
                size="xl"
                radius="xl"
                variant="outline"
                c="orange"
                style={{ borderColor: '#f97316' }}
                leftSection={<IconPhone size={20} />}
              >
                Contact Bizflash Team
              </Button>
            </Group>

            <Text size="sm" c="gray.5" ta="center">
              🌟 Bizflash.in - Where Business Meets Innovation | Est. 2024
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Packages Section */}
      <Box id="packages" py={100} style={{ background: '#ffffff' }}>
        <Container size="xl">
          <Stack gap="xl">
            <Stack align="center" gap="md">
              <Title size="2.5rem" ta="center" c="dark.8">Choose Your Perfect Plan</Title>
              <Text size="xl" c="gray.6" ta="center" maw={700}>
                Flexible pricing plans designed to scale with your business needs. All plans include our comprehensive WhatsApp management suite.
              </Text>
            </Stack>

            {/* Carousel Controls */}
            <div className="carousel-controls">
              <button
                className="carousel-nav-btn"
                onClick={scrollPrev}
                title="Previous (←)"
              >
                <IconChevronLeft size={20} />
              </button>
              
              <button
                className={`carousel-nav-btn carousel-play-btn ${!autoPlay ? 'paused' : ''}`}
                onClick={() => setAutoPlay(!autoPlay)}
                title={autoPlay ? 'Pause (Space)' : 'Play (Space)'}
              >
                {autoPlay ? <IconPlayerPauseFilled size={20} /> : <IconPlayerPlayFilled size={20} />}
              </button>
              
              <button
                className="carousel-nav-btn"
                onClick={scrollNext}
                title="Next (→)"
              >
                <IconChevronRight size={20} />
              </button>
            </div>

            {loading ? (
              <div 
                className="pricing-carousel"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <Carousel
                  slideSize={{ base: '100%', md: '33.333333%' }}
                  slideGap="xl"
                  align="start"
                  withIndicators
                  height={600}
                >
                {[1, 2, 3].map((i) => (
                  <Carousel.Slide key={i}>
                    <Card shadow="xl" padding="xl" radius="xl" withBorder h="100%">
                      <Stack gap="lg">
                        <div style={{ height: '100px', background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)', borderRadius: '12px' }} />
                        <div style={{ height: '20px', background: '#e2e8f0', borderRadius: '4px', width: '70%' }} />
                        <div style={{ height: '40px', background: '#e2e8f0', borderRadius: '4px', width: '50%' }} />
                        <div style={{ height: '80px', background: '#e2e8f0', borderRadius: '4px' }} />
                        <div style={{ height: '45px', background: '#e2e8f0', borderRadius: '20px' }} />
                      </Stack>
                    </Card>
                  </Carousel.Slide>
                ))}
                </Carousel>
              </div>
            ) : (
              <div 
                className="pricing-carousel"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <Carousel
                  slideSize={{ base: '100%', md: '33.333333%' }}
                  slideGap="xl"
                  align="start"
                  withIndicators
                  height={600}
                  loop
                  getEmblaApi={(embla) => {
                    setEmblaApi(embla)
                    if (embla) {
                      embla.on('select', () => {
                        setCurrentSlide(embla.selectedScrollSnap())
                      })
                    }
                  }}
                >
                {packages.map((pkg) => (
                  <Carousel.Slide key={pkg.id}>
                    <Card 
                      shadow="xl" 
                      padding={0} 
                      radius="xl" 
                      withBorder 
                      h="100%"
                      className={`pricing-card ${pkg.popular ? 'popular' : ''}`}
                      style={{ 
                        overflow: 'hidden',
                        border: pkg.popular ? '3px solid #10b981' : undefined
                      }}
                    >
                      {/* Header */}
                      <Box style={{ background: getPackageColor(pkg.package_color).gradient, padding: '2rem', color: 'white', position: 'relative' }}>
                        {pkg.popular && (
                          <Badge
                            size="lg"
                            color="yellow"
                            variant="filled"
                            style={{
                              position: 'absolute',
                              top: '1rem',
                              right: '1rem',
                              fontWeight: 700
                            }}
                          >
                            Most Popular
                          </Badge>
                        )}
                        
                        <Stack gap="sm">
                          <Title order={2} c="white">{pkg.name}</Title>
                          <Text opacity={0.9} size="sm">{pkg.description || 'Perfect for your business needs'}</Text>
                          
                          <Group gap="xs" mt="md">
                            {pkg.offer_enabled && pkg.offer_price ? (
                              <>
                                <Text size="2.5rem" fw={900} c="white">₹{pkg.offer_price}</Text>
                                <Stack gap={0}>
                                  <Text size="lg" td="line-through" opacity={0.7}>₹{pkg.price}</Text>
                                  <Badge color="yellow" size="sm">
                                    Save ₹{pkg.price - pkg.offer_price}
                                  </Badge>
                                </Stack>
                              </>
                            ) : (
                              <Text size="2.5rem" fw={900} c="white">₹{pkg.price}</Text>
                            )}
                            <Text c="white" opacity={0.8}>/ month</Text>
                          </Group>
                        </Stack>
                      </Box>

                      {/* Features */}
                      <Box p="xl">
                        <Stack gap="lg">
                          <Grid>
                            <Grid.Col span={6}>
                              <Stack align="center" gap="xs">
                                <ThemeIcon size={40} color={pkg.package_color || 'blue'} variant="light">
                                  <IconMessageCircle size={20} />
                                </ThemeIcon>
                                <Text fw={600} size="sm">{pkg.messageLimit.toLocaleString()}</Text>
                                <Text size="xs" c="gray.6" ta="center">Messages</Text>
                              </Stack>
                            </Grid.Col>
                            <Grid.Col span={6}>
                              <Stack align="center" gap="xs">
                                <ThemeIcon size={40} color={pkg.package_color || 'blue'} variant="light">
                                  <IconDeviceMobile size={20} />
                                </ThemeIcon>
                                <Text fw={600} size="sm">{pkg.instanceLimit}</Text>
                                <Text size="xs" c="gray.6" ta="center">Instances</Text>
                              </Stack>
                            </Grid.Col>
                            <Grid.Col span={6}>
                              <Stack align="center" gap="xs">
                                <ThemeIcon size={40} color={pkg.package_color || 'blue'} variant="light">
                                  <IconUsers size={20} />
                                </ThemeIcon>
                                <Text fw={600} size="sm">{pkg.contact_limit.toLocaleString()}</Text>
                                <Text size="xs" c="gray.6" ta="center">Contacts</Text>
                              </Stack>
                            </Grid.Col>
                            <Grid.Col span={6}>
                              <Stack align="center" gap="xs">
                                <ThemeIcon size={40} color={pkg.package_color || 'blue'} variant="light">
                                  <IconApi size={20} />
                                </ThemeIcon>
                                <Text fw={600} size="sm">{pkg.api_key_limit}</Text>
                                <Text size="xs" c="gray.6" ta="center">API Keys</Text>
                              </Stack>
                            </Grid.Col>
                          </Grid>

                          <Divider />

                          <List
                            spacing="sm"
                            size="sm"
                            center
                            icon={<IconCheck size={16} style={{ color: '#10b981' }} />}
                          >
                            {(Array.isArray(pkg.features) ? pkg.features : []).map((feature, index) => (
                              <List.Item key={index}>{feature}</List.Item>
                            ))}
                          </List>

                          <Button
                            size="lg"
                            radius="xl"
                            variant={pkg.popular ? 'gradient' : 'outline'}
                            gradient={pkg.popular ? { from: getPackageColor(pkg.package_color).color, to: 'green' } : undefined}
                            color={pkg.package_color || 'blue'}
                            fullWidth
                            onClick={() => {
                              setSelectedPackage(pkg)
                              openPackageModal()
                            }}
                            rightSection={<IconArrowRight size={16} />}
                          >
                            {pkg.popular ? 'Get Started Now' : 'Choose Plan'}
                          </Button>

                          <Text size="xs" c="gray.5" ta="center">
                            * All prices are in INR and billed monthly
                          </Text>
                        </Stack>
                      </Box>
                    </Card>
                  </Carousel.Slide>
                ))}
                </Carousel>
              </div>
            )}

            {/* Navigation Dots */}
            <div className="nav-dots">
              {packages.map((_, index) => (
                <div
                  key={index}
                  className={`nav-dot ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => scrollTo(index)}
                  title={`Go to plan ${index + 1}`}
                />
              ))}
            </div>

            {/* Keyboard Navigation Hint */}
            <Text size="sm" c="gray.6" ta="center" mt="md">
              💡 Use arrow keys ← → to navigate and spacebar to play/pause
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Integrations Section */}
      <Box py={100} style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <Container size="xl">
          <Stack gap="xl">
            <Stack align="center" gap="md">
              <Title size="2.5rem" ta="center" c="dark.8">Easy Integration with Your Business Tools</Title>
              <Text size="xl" c="gray.6" ta="center" maw={700}>
                Connect seamlessly with popular accounting software, CRM systems, and business applications for a unified workflow.
              </Text>
            </Stack>

            {/* Integration Categories */}
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
              {/* Accounting Software */}
              <Card shadow="lg" padding="xl" radius="xl" withBorder style={{ height: '100%' }}>
                <Stack gap="lg" h="100%">
                  <Group gap="md">
                    <ThemeIcon size={50} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                      <IconDatabase size={25} />
                    </ThemeIcon>
                    <Title order={3} c="blue.8">Accounting Software</Title>
                  </Group>
                  
                  <Stack gap="md" style={{ flex: 1 }}>
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Box
                          style={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        >
                          T
                        </Box>
                        <Stack gap={0}>
                          <Text fw={600} size="sm">Tally Prime</Text>
                          <Text size="xs" c="dimmed">Complete ERP Solution</Text>
                        </Stack>
                      </Group>
                      <Badge color="green" variant="light" size="sm">✓ Supported</Badge>
                    </Group>
                    
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Box
                          style={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        >
                          QB
                        </Box>
                        <Stack gap={0}>
                          <Text fw={600} size="sm">QuickBooks</Text>
                          <Text size="xs" c="dimmed">Small Business Accounting</Text>
                        </Stack>
                      </Group>
                      <Badge color="green" variant="light" size="sm">✓ Supported</Badge>
                    </Group>
                    
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Box
                          style={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        >
                          Z
                        </Box>
                        <Stack gap={0}>
                          <Text fw={600} size="sm">Zoho Books</Text>
                          <Text size="xs" c="dimmed">Online Accounting</Text>
                        </Stack>
                      </Group>
                      <Badge color="green" variant="light" size="sm">✓ Supported</Badge>
                    </Group>
                  </Stack>
                </Stack>
              </Card>

              {/* CRM Systems */}
              <Card shadow="lg" padding="xl" radius="xl" withBorder style={{ height: '100%' }}>
                <Stack gap="lg" h="100%">
                  <Group gap="md">
                    <ThemeIcon size={50} radius="xl" variant="gradient" gradient={{ from: 'violet', to: 'purple' }}>
                      <IconUsers size={25} />
                    </ThemeIcon>
                    <Title order={3} c="violet.8">CRM Systems</Title>
                  </Group>
                  
                  <Stack gap="md" style={{ flex: 1 }}>
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Box
                          style={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        >
                          PX
                        </Box>
                        <Stack gap={0}>
                          <Text fw={600} size="sm">Perfex CRM</Text>
                          <Text size="xs" c="dimmed">Complete CRM Solution</Text>
                        </Stack>
                      </Group>
                      <Badge color="green" variant="light" size="sm">✓ Supported</Badge>
                    </Group>
                    
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Box
                          style={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        >
                          HS
                        </Box>
                        <Stack gap={0}>
                          <Text fw={600} size="sm">HubSpot</Text>
                          <Text size="xs" c="dimmed">Inbound Marketing CRM</Text>
                        </Stack>
                      </Group>
                      <Badge color="green" variant="light" size="sm">✓ Supported</Badge>
                    </Group>
                    
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Box
                          style={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        >
                          SF
                        </Box>
                        <Stack gap={0}>
                          <Text fw={600} size="sm">Salesforce</Text>
                          <Text size="xs" c="dimmed">Enterprise CRM</Text>
                        </Stack>
                      </Group>
                      <Badge color="green" variant="light" size="sm">✓ Supported</Badge>
                    </Group>
                  </Stack>
                </Stack>
              </Card>

              {/* E-commerce & Others */}
              <Card shadow="lg" padding="xl" radius="xl" withBorder style={{ height: '100%' }}>
                <Stack gap="lg" h="100%">
                  <Group gap="md">
                    <ThemeIcon size={50} radius="xl" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
                      <IconPlugConnected size={25} />
                    </ThemeIcon>
                    <Title order={3} c="orange.8">E-commerce & More</Title>
                  </Group>
                  
                  <Stack gap="md" style={{ flex: 1 }}>
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Box
                          style={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        >
                          SH
                        </Box>
                        <Stack gap={0}>
                          <Text fw={600} size="sm">Shopify</Text>
                          <Text size="xs" c="dimmed">E-commerce Platform</Text>
                        </Stack>
                      </Group>
                      <Badge color="green" variant="light" size="sm">✓ Supported</Badge>
                    </Group>
                    
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Box
                          style={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        >
                          WC
                        </Box>
                        <Stack gap={0}>
                          <Text fw={600} size="sm">WooCommerce</Text>
                          <Text size="xs" c="dimmed">WordPress E-commerce</Text>
                        </Stack>
                      </Group>
                      <Badge color="green" variant="light" size="sm">✓ Supported</Badge>
                    </Group>
                    
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Box
                          style={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}
                        >
                          +
                        </Box>
                        <Stack gap={0}>
                          <Text fw={600} size="sm">Custom API</Text>
                          <Text size="xs" c="dimmed">Any REST API Integration</Text>
                        </Stack>
                      </Group>
                      <Badge color="blue" variant="light" size="sm">✓ Available</Badge>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            </SimpleGrid>

            {/* Integration Benefits */}
            <Card shadow="lg" padding="xl" radius="xl" withBorder style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
              <Stack gap="lg">
                <Title order={3} ta="center" c="blue.8">Why Our Integrations Matter</Title>
                
                <SimpleGrid cols={{ base: 1, md: 4 }} spacing="lg">
                  <Stack align="center" gap="md">
                    <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                      <IconBolt size={30} />
                    </ThemeIcon>
                    <Title order={4} ta="center">Real-time Sync</Title>
                    <Text size="sm" ta="center" c="gray.7">
                      Customer data, orders, and invoices sync instantly between platforms
                    </Text>
                  </Stack>
                  
                  <Stack align="center" gap="md">
                    <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'green', to: 'lime' }}>
                      <IconShield size={30} />
                    </ThemeIcon>
                    <Title order={4} ta="center">Secure Connection</Title>
                    <Text size="sm" ta="center" c="gray.7">
                      Bank-level encryption ensures your business data stays protected
                    </Text>
                  </Stack>
                  
                  <Stack align="center" gap="md">
                    <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'violet', to: 'purple' }}>
                      <IconTarget size={30} />
                    </ThemeIcon>
                    <Title order={4} ta="center">Smart Automation</Title>
                    <Text size="sm" ta="center" c="gray.7">
                      Trigger WhatsApp messages based on CRM events and transactions
                    </Text>
                  </Stack>
                  
                  <Stack align="center" gap="md">
                    <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
                      <IconRocket size={30} />
                    </ThemeIcon>
                    <Title order={4} ta="center">Easy Setup</Title>
                    <Text size="sm" ta="center" c="gray.7">
                      One-click integration with guided setup and full documentation
                    </Text>
                  </Stack>
                </SimpleGrid>
              </Stack>
            </Card>

            <Center>
              <Button
                size="xl"
                radius="xl"
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
                leftSection={<IconPlugConnected size={20} />}
                onClick={handleLogin}
              >
                Explore All Integrations
              </Button>
            </Center>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={100} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container size="xl">
          <Stack gap="xl">
            <Stack align="center" gap="md">
              <Title size="2.5rem" ta="center" c="white">Powerful Features for Business Growth</Title>
              <Text size="xl" c="white" ta="center" opacity={0.9} maw={700}>
                Everything you need to manage, automate, and scale your WhatsApp business communication.
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing="xl">
              {[
                {
                  icon: IconBrandWhatsapp,
                  title: 'Multi-Instance Management',
                  description: 'Manage multiple WhatsApp accounts from a single dashboard with seamless switching and unified messaging.',
                  color: 'green'
                },
                {
                  icon: IconBolt,
                  title: 'Automation & Scheduling',
                  description: 'Automate responses, schedule messages, and create smart workflows to engage customers 24/7.',
                  color: 'yellow'
                },
                {
                  icon: IconChartLine,
                  title: 'Advanced Analytics',
                  description: 'Track message delivery rates, customer engagement, response times, and business performance metrics.',
                  color: 'blue'
                },
                {
                  icon: IconUsers,
                  title: 'Team Collaboration',
                  description: 'Add team members, assign roles, manage permissions, and collaborate effectively on customer communications.',
                  color: 'violet'
                },
                {
                  icon: IconApi,
                  title: 'Powerful APIs',
                  description: 'Integrate with your existing systems using our comprehensive REST API and webhook support.',
                  color: 'orange'
                },
                {
                  icon: IconShield,
                  title: 'Enterprise Security',
                  description: 'Bank-level encryption, secure authentication, and compliance with data protection regulations.',
                  color: 'red'
                },
                {
                  icon: IconCloud,
                  title: 'Cloud Infrastructure',
                  description: 'Reliable cloud hosting with 99.9% uptime, automatic backups, and global CDN delivery.',
                  color: 'cyan'
                },
                {
                  icon: IconTarget,
                  title: 'Smart Targeting',
                  description: 'Segment contacts, create targeted campaigns, and personalize messages for better engagement.',
                  color: 'pink'
                }
              ].map((feature, index) => (
                <Card key={index} shadow="lg" padding="xl" radius="xl" style={{ background: 'rgba(255, 255, 255, 0.95)', height: '100%' }}>
                  <Stack gap="md" h="100%">
                    <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: feature.color, to: `${feature.color}.7` }}>
                      <feature.icon size={30} />
                    </ThemeIcon>
                    <Title order={4}>{feature.title}</Title>
                    <Text size="sm" c="gray.7" style={{ flex: 1 }}>
                      {feature.description}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={100} style={{ background: '#1a1b23' }}>
        <Container size="xl">
          <Stack align="center" gap="xl">
            <Stack align="center" gap="md">
              <Title size="2.5rem" ta="center" c="white">Ready to Transform Your Business?</Title>
              <Text size="xl" c="gray.4" ta="center" maw={600}>
                Join thousands of businesses already using Bizflash.in to streamline their customer communication and boost sales through intelligent WhatsApp automation.
              </Text>
            </Stack>

            <Group gap="lg">
              <Button
                size="xl"
                radius="xl"
                variant="gradient"
                gradient={{ from: 'violet', to: 'purple' }}
                leftSection={<IconRocket size={20} />}
                onClick={handleLogin}
              >
                Start Your Free Trial
              </Button>
              <Button
                size="xl"
                radius="xl"
                variant="outline"
                c="white"
                style={{ borderColor: 'white' }}
                leftSection={<IconPhone size={20} />}
              >
                Schedule Demo
              </Button>
            </Group>

            <Text size="sm" c="gray.5" ta="center">
              No credit card required • 14-day free trial • Cancel anytime
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box py={50} style={{ background: '#0f1017' }}>
        <Container size="xl">
          <Stack gap="xl">
            <Group justify="space-between" align="flex-start">
              <Stack gap="md">
                <Group gap="md">
                  <Image
                    src="/bizflash-logo-light.png"
                    alt="Bizflash Logo"
                    height={50}
                    width="auto"
                  />
                  <Stack gap={0}>
                    <Group gap="xs">
                      <Title order={3} c="white">Bizflash</Title>
                      <Text c="orange.4" fw={600}>.in</Text>
                    </Group>
                    <Text c="gray.5">WhatsApp Business Automation Platform</Text>
                  </Stack>
                </Group>
                <Text c="gray.5" maw={300}>
                  Empowering businesses with intelligent WhatsApp automation, seamless integrations, and powerful analytics since 2024.
                </Text>
              </Stack>

              <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xl">
                <Stack gap="md">
                  <Title order={5} c="white">Product</Title>
                  <Stack gap="xs">
                    <Anchor c="gray.5" size="sm">Features</Anchor>
                    <Anchor c="gray.5" size="sm">Pricing</Anchor>
                    <Anchor c="gray.5" size="sm">API Docs</Anchor>
                    <Anchor c="gray.5" size="sm">Integrations</Anchor>
                  </Stack>
                </Stack>

                <Stack gap="md">
                  <Title order={5} c="white">Company</Title>
                  <Stack gap="xs">
                    <Anchor c="gray.5" size="sm">About Us</Anchor>
                    <Anchor c="gray.5" size="sm">Blog</Anchor>
                    <Anchor c="gray.5" size="sm">Careers</Anchor>
                    <Anchor c="gray.5" size="sm">Press</Anchor>
                  </Stack>
                </Stack>

                <Stack gap="md">
                  <Title order={5} c="white">Support</Title>
                  <Stack gap="xs">
                    <Anchor c="gray.5" size="sm">Help Center</Anchor>
                    <Anchor c="gray.5" size="sm">Contact Us</Anchor>
                    <Anchor c="gray.5" size="sm">Status</Anchor>
                    <Anchor c="gray.5" size="sm">Community</Anchor>
                  </Stack>
                </Stack>

                <Stack gap="md">
                  <Title order={5} c="white">Legal</Title>
                  <Stack gap="xs">
                    <Anchor c="gray.5" size="sm">Privacy</Anchor>
                    <Anchor c="gray.5" size="sm">Terms</Anchor>
                    <Anchor c="gray.5" size="sm">Security</Anchor>
                    <Anchor c="gray.5" size="sm">Compliance</Anchor>
                  </Stack>
                </Stack>
              </SimpleGrid>
            </Group>

            <Divider color="gray.8" />

            <Group justify="space-between">
              <Text c="gray.5" size="sm">
                © 2024 Bizflash.in. All rights reserved. | Powered by Bizflash Technologies
              </Text>
              <Group gap="lg">
                <ActionIcon size="lg" variant="subtle" c="gray.5">
                  <IconBrandWhatsapp size={20} />
                </ActionIcon>
                <ActionIcon size="lg" variant="subtle" c="gray.5">
                  <IconMail size={20} />
                </ActionIcon>
                <ActionIcon size="lg" variant="subtle" c="gray.5">
                  <IconPhone size={20} />
                </ActionIcon>
              </Group>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Package Purchase Modal */}
      <Modal 
        opened={packageModalOpened} 
        onClose={closePackageModal}
        title="Purchase Package" 
        size="lg"
        centered
      >
        {selectedPackage && (
          <Stack gap="lg">
            <Card withBorder radius="lg" p="lg">
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={3}>{selectedPackage.name}</Title>
                  <Badge size="lg" color={selectedPackage.package_color || 'blue'}>
                    {selectedPackage.duration} Days
                  </Badge>
                </Group>
                
                <Text c="gray.6">{selectedPackage.description || 'Perfect for your business needs'}</Text>
                
                <Group>
                  {selectedPackage.offer_enabled && selectedPackage.offer_price ? (
                    <>
                      <Text size="2rem" fw={900}>₹{selectedPackage.offer_price}</Text>
                      <Text size="lg" td="line-through" c="gray.5">₹{selectedPackage.price}</Text>
                    </>
                  ) : (
                    <Text size="2rem" fw={900}>₹{selectedPackage.price}</Text>
                  )}
                  <Text c="gray.6">/ month</Text>
                </Group>
              </Stack>
            </Card>

            <Stack gap="md">
              <Title order={4}>Choose Payment Method</Title>
              <SimpleGrid cols={2} spacing="md">
                <Button
                  variant="outline"
                  size="lg"
                  leftSection={<IconCreditCard size={20} />}
                  onClick={handleLogin}
                >
                  Pay with Card
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  leftSection={<BizCoinIcon size={20} />}
                  onClick={handleLogin}
                >
                  Pay with BizCoins
                </Button>
              </SimpleGrid>
            </Stack>
          </Stack>
        )}
      </Modal>

      {/* BizCoin Purchase Modal */}
      <Modal 
        opened={bizCoinModalOpened} 
        onClose={closeBizCoinModal}
        title={
          <Group gap="md">
            <BizCoinIcon size={30} />
            <Title order={3}>Purchase BizCoins</Title>
          </Group>
        } 
        size="xl"
        centered
      >
        <Stack gap="lg">
          <Text c="gray.6">
            Choose from our BizCoin packages to unlock premium features and earn rewards.
          </Text>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {bizCoinPackages.map((pkg) => (
              <Card 
                key={pkg.id} 
                withBorder 
                radius="lg" 
                p="lg"
                style={{ 
                  border: pkg.popular ? '2px solid #10b981' : undefined,
                  position: 'relative'
                }}
              >
                {pkg.popular && (
                  <Badge
                    color="green"
                    variant="filled"
                    style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)' }}
                  >
                    Most Popular
                  </Badge>
                )}
                
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs">
                      <Title order={4}>{pkg.name}</Title>
                      <Group gap="xs">
                        <BizCoinIcon size={20} />
                        <Text fw={600}>{pkg.coins.toLocaleString()} Coins</Text>
                        {pkg.bonus > 0 && (
                          <Badge size="sm" color="yellow">
                            +{pkg.bonus} Bonus
                          </Badge>
                        )}
                      </Group>
                    </Stack>
                    <Stack gap={0} align="flex-end">
                      <Text size="xl" fw={900}>₹{pkg.price}</Text>
                      <Text size="xs" c="green.6">{pkg.savings}</Text>
                    </Stack>
                  </Group>

                  <Button
                    variant={pkg.popular ? 'gradient' : 'outline'}
                    gradient={pkg.popular ? { from: 'green', to: 'lime' } : undefined}
                    color="green"
                    fullWidth
                    onClick={handleLogin}
                  >
                    Buy Now
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Modal>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </Box>
  )
}