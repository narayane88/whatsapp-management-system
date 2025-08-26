'use client'

import {
  AppShell,
  Group,
  Text,
  Button,
  ActionIcon,
  Stack,
  Avatar,
  Badge,
  Collapse,
  Container,
  Title,
  Tooltip,
  rem,
  Burger,
  Image,
  Paper,
  Menu,
  Box,
  TextInput,
  Spotlight,
  ThemeIcon
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { 
  FiMenu, 
  FiX, 
  FiHome, 
  FiUsers, 
  FiUserCheck,
  FiPackage, 
  FiCreditCard,
  FiRepeat,
  FiGlobe, 
  FiServer, 
  FiBook,
  FiLogOut,
  FiSettings,
  FiChevronDown,
  FiSun,
  FiMoon,
  FiDollarSign,
  FiSearch,
  FiCommand
} from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import BizCoinIcon from '@/components/icons/BizCoinIcon'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useCompanyProfile, useCompanyLogo } from '@/hooks/useCompanyProfile'
import { useTheme } from '@/hooks/useTheme'
import { predefinedThemes } from '@/types/theme'
import PermissionAwareNavigation from '@/components/layout/PermissionAwareNavigation'
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions'
import AdminStatusIndicator from '@/components/admin/AdminStatusIndicator'
import { useMemo, useState, useEffect, useRef } from 'react'

interface AdminLayoutProps {
  children: React.ReactNode
}

// Navigation items for search and shortcuts
const navigationItems = [
  { 
    name: 'Dashboard', 
    href: '/admin', 
    icon: FiHome,
    requiredPermissions: ['dashboard.admin.access'],
    description: 'System overview and analytics'
  },
  { 
    name: 'Customers', 
    href: '/admin/customers', 
    icon: FiUserCheck,
    requiredPermissions: ['customers.page.access'],
    description: 'Manage customer accounts'
  },
  { 
    name: 'Packages', 
    href: '/admin/packages', 
    icon: FiPackage,
    requiredPermissions: ['packages.page.access'],
    description: 'Subscription packages and pricing'
  },
  { 
    name: 'Vouchers', 
    href: '/admin/vouchers', 
    icon: FiCreditCard,
    requiredPermissions: ['vouchers.page.access'],
    description: 'Discount vouchers and promotions'
  },
  { 
    name: 'Transactions', 
    href: '/admin/transactions', 
    icon: FaRupeeSign,
    requiredPermissions: ['transactions.page.access'],
    description: 'Payment transactions and history'
  },
  { 
    name: 'Subscriptions', 
    href: '/admin/subscriptions', 
    icon: FiRepeat,
    requiredPermissions: ['subscriptions.page.access'],
    description: 'User subscriptions management'
  },
  { 
    name: 'BizCoins', 
    href: '/admin/bizpoints', 
    icon: BizCoinIcon,
    requiredPermissions: ['bizpoints.page.access'],
    description: 'BizCoins wallet and transfers'
  },
  { 
    name: 'Users', 
    href: '/admin/users', 
    icon: FiUsers,
    requiredPermissions: ['users.page.access'],
    description: 'User accounts and roles'
  },
  { 
    name: 'Servers', 
    href: '/admin/servers', 
    icon: FiServer,
    requiredPermissions: ['servers.page.access'],
    description: 'WhatsApp server management'
  },
  { 
    name: 'Languages', 
    href: '/admin/languages', 
    icon: FiGlobe,
    requiredPermissions: ['languages.page.access'],
    description: 'System language settings'
  },
]

function ThemeToggle() {
  const { currentTheme, setTheme } = useTheme()
  
  const toggleTheme = () => {
    // Toggle between light and dark themes
    const lightTheme = predefinedThemes.find(t => t.id === 'light')
    const darkTheme = predefinedThemes.find(t => t.id === 'dark')
    
    if (currentTheme.other?.colorScheme === 'light') {
      if (darkTheme) setTheme(darkTheme)
    } else {
      if (lightTheme) setTheme(lightTheme)
    }
  }
  
  return (
    <Tooltip label={`Switch to ${currentTheme.other?.colorScheme === 'light' ? 'dark' : 'light'} theme`}>
      <ActionIcon
        variant="default"
        onClick={toggleTheme}
        size={30}
      >
        {currentTheme.other?.colorScheme === 'light' ? <FiMoon size={16} /> : <FiSun size={16} />}
      </ActionIcon>
    </Tooltip>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession()
  const { profile } = useCompanyProfile()
  const logoUrl = useCompanyLogo('light')
  const pathname = usePathname()
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure()
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true)
  const [userMenuOpened, { toggle: toggleUserMenu }] = useDisclosure()
  const { hasPermission, isLoading } = useDynamicPermissions()
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  // Filter accessible navigation items based on permissions
  const accessibleItems = useMemo(() => {
    if (isLoading) return []
    return navigationItems.filter(item => 
      item.requiredPermissions.length === 0 || 
      item.requiredPermissions.every(permission => hasPermission(permission))
    )
  }, [hasPermission, isLoading])

  // Get quick access shortcuts (first 6 accessible items)
  const quickAccessItems = useMemo(() => {
    return accessibleItems.slice(0, 6)
  }, [accessibleItems])

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchValue.trim()) return []
    return accessibleItems.filter(item =>
      item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.description.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [accessibleItems, searchValue])

  const handleSearchSelect = (href: string) => {
    setSearchValue('')
    window.location.href = href
  }

  // Keyboard shortcut for search (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setSearchValue('')
        searchInputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header h={64}>
        <Group h="100%" px="md" justify="space-between" gap="md">
          {/* Left Section */}
          <Group gap="md">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <Burger
              opened={desktopOpened}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="sm"
            />
            
            {/* Company Info in Header */}
            <Group gap="md" visibleFrom="sm">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={profile.company_name}
                  w={32}
                  h={32}
                  radius="md"
                />
              ) : (
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  backgroundColor: 'var(--mantine-color-blue-6)', 
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px'
                }}>
                  {profile.company_name?.charAt(0) || 'B'}
                </div>
              )}
              <Stack gap={0}>
                <Text fw={600} size="md" lineClamp={1}>
                  {profile.company_name}
                </Text>
                <Group gap={6}>
                  <Text size="xs" c="dimmed">
                    {profile.city}, {profile.state}
                  </Text>
                  <Text size="xs" c="dimmed">•</Text>
                  <Text size="xs" c="dimmed">
                    {profile.mobile_number}
                  </Text>
                </Group>
              </Stack>
            </Group>
          </Group>

          {/* Center Section - Mega Search */}
          <Box style={{ flex: 1, maxWidth: 500 }} visibleFrom="md">
            <Box pos="relative">
              <TextInput
                ref={searchInputRef}
                placeholder="Search pages, features, users... (Ctrl+K)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.currentTarget.value)}
                leftSection={<FiSearch size={16} />}
                rightSection={
                  <Group gap={4}>
                    <Badge size="xs" variant="light" color="gray">
                      <FiCommand size={10} />
                      K
                    </Badge>
                  </Group>
                }
                radius="xl"
                size="md"
                styles={{
                  input: {
                    backgroundColor: 'var(--mantine-color-gray-0)',
                    border: '1px solid var(--mantine-color-gray-3)',
                    '&:focus': {
                      backgroundColor: 'white',
                      borderColor: 'var(--mantine-color-blue-5)',
                      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)'
                    }
                  }
                }}
              />
              
              {/* Search Results Dropdown */}
              {searchValue.trim() && filteredItems.length > 0 && (
                <Paper
                  shadow="lg"
                  radius="md"
                  p="xs"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    marginTop: 4,
                    border: '1px solid var(--mantine-color-gray-3)'
                  }}
                >
                  <Stack gap={2}>
                    {filteredItems.slice(0, 5).map((item) => {
                      const Icon = item.icon
                      return (
                        <Button
                          key={item.href}
                          variant="subtle"
                          color="gray"
                          justify="flex-start"
                          leftSection={<Icon size={16} />}
                          onClick={() => handleSearchSelect(item.href)}
                          fullWidth
                          size="sm"
                          style={{ height: 'auto', padding: '8px 12px' }}
                        >
                          <Stack gap={2} align="flex-start">
                            <Text size="sm" fw={500}>{item.name}</Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {item.description}
                            </Text>
                          </Stack>
                        </Button>
                      )
                    })}
                  </Stack>
                </Paper>
              )}
            </Box>
          </Box>

          {/* Right Section */}
          <Group gap="sm">
            {/* Real-time Status Indicators */}
            <AdminStatusIndicator />
            
            {/* Innovative Quick Actions Dropdown */}
            <Menu shadow="xl" width={320} position="bottom-end" offset={8} withArrow>
              <Menu.Target>
                <Tooltip label="Quick Actions" position="bottom">
                  <ActionIcon
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
                    size="xl"
                    radius="xl"
                    style={{
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1) rotate(5deg)',
                        boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
                      }
                    }}
                  >
                    <Box
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 1,
                        width: 16,
                        height: 16
                      }}
                    >
                      <div style={{ 
                        width: 7, 
                        height: 7, 
                        backgroundColor: 'white', 
                        borderRadius: 2,
                        opacity: 0.9
                      }} />
                      <div style={{ 
                        width: 7, 
                        height: 7, 
                        backgroundColor: 'white', 
                        borderRadius: 2,
                        opacity: 0.7
                      }} />
                      <div style={{ 
                        width: 7, 
                        height: 7, 
                        backgroundColor: 'white', 
                        borderRadius: 2,
                        opacity: 0.8
                      }} />
                      <div style={{ 
                        width: 7, 
                        height: 7, 
                        backgroundColor: 'white', 
                        borderRadius: 2,
                        opacity: 0.6
                      }} />
                    </Box>
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>

              <Menu.Dropdown p="md" style={{ border: '1px solid var(--mantine-color-gray-2)' }}>
                <Stack gap="lg">
                  {/* Header */}
                  <Group justify="space-between">
                    <Text fw={600} size="sm" c="blue">Quick Actions</Text>
                    <Badge size="xs" variant="light" color="blue">
                      {accessibleItems.length} available
                    </Badge>
                  </Group>

                  {/* Management Section */}
                  <Box>
                    <Text size="xs" fw={500} c="dimmed" mb="sm" tt="uppercase" ls={0.5}>
                      Management
                    </Text>
                    <Group gap="sm">
                      {accessibleItems
                        .filter(item => ['Customers', 'Users', 'Servers'].includes(item.name))
                        .map((item) => {
                          const Icon = item.icon
                          const isActive = pathname === item.href
                          return (
                            <Tooltip key={item.href} label={item.description} position="bottom">
                              <ActionIcon
                                component={Link}
                                href={item.href}
                                variant={isActive ? 'filled' : 'light'}
                                color={isActive ? 'blue' : 'gray'}
                                size="lg"
                                radius="md"
                                style={{
                                  transition: 'all 0.2s ease',
                                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                  border: isActive ? '2px solid var(--mantine-color-blue-3)' : '2px solid transparent'
                                }}
                              >
                                <Icon size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )
                        })}
                    </Group>
                  </Box>

                  {/* Business Section */}
                  <Box>
                    <Text size="xs" fw={500} c="dimmed" mb="sm" tt="uppercase" ls={0.5}>
                      Business
                    </Text>
                    <Group gap="sm">
                      {accessibleItems
                        .filter(item => ['Packages', 'Vouchers', 'Transactions', 'BizCoins'].includes(item.name))
                        .map((item) => {
                          const Icon = item.icon
                          const isActive = pathname === item.href
                          return (
                            <Tooltip key={item.href} label={item.description} position="bottom">
                              <ActionIcon
                                component={Link}
                                href={item.href}
                                variant={isActive ? 'filled' : 'light'}
                                color={isActive ? 'green' : 'gray'}
                                size="lg"
                                radius="md"
                                style={{
                                  transition: 'all 0.2s ease',
                                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                  border: isActive ? '2px solid var(--mantine-color-green-3)' : '2px solid transparent'
                                }}
                              >
                                <Icon size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )
                        })}
                    </Group>
                  </Box>

                  {/* System Section */}
                  <Box>
                    <Text size="xs" fw={500} c="dimmed" mb="sm" tt="uppercase" ls={0.5}>
                      System
                    </Text>
                    <Group gap="sm">
                      {accessibleItems
                        .filter(item => ['Dashboard', 'Languages'].includes(item.name))
                        .map((item) => {
                          const Icon = item.icon
                          const isActive = pathname === item.href
                          return (
                            <Tooltip key={item.href} label={item.description} position="bottom">
                              <ActionIcon
                                component={Link}
                                href={item.href}
                                variant={isActive ? 'filled' : 'light'}
                                color={isActive ? 'violet' : 'gray'}
                                size="lg"
                                radius="md"
                                style={{
                                  transition: 'all 0.2s ease',
                                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                  border: isActive ? '2px solid var(--mantine-color-violet-3)' : '2px solid transparent'
                                }}
                              >
                                <Icon size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )
                        })}
                    </Group>
                  </Box>

                  {/* Footer */}
                  <Group justify="center" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                    <Text size="xs" c="dimmed">
                      Use Ctrl+K to search quickly
                    </Text>
                  </Group>
                </Stack>
              </Menu.Dropdown>
            </Menu>
            
            <Badge color="green" variant="dot" size="sm">
              Online
            </Badge>
            <ThemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p={0} style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

        {/* Scrollable Navigation Section */}
        <Box style={{ 
          flex: 1, 
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px 20px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--mantine-color-gray-4) transparent'
        }}>
          <PermissionAwareNavigation onItemClick={toggleMobile} />
        </Box>

        {/* Compact Footer Section */}
        <Box p="sm" style={{ 
          borderTop: '1px solid var(--mantine-color-gray-2)',
          backgroundColor: 'var(--mantine-color-gray-0)'
        }}>
          <Menu shadow="md" width={220} opened={userMenuOpened} onChange={toggleUserMenu}>
            <Menu.Target>
              <Button
                variant="subtle"
                color="gray"
                fullWidth
                justify="space-between"
                rightSection={<FiChevronDown size={12} />}
                onClick={toggleUserMenu}
                p="xs"
                h={48}
                style={{ 
                  borderRadius: 8,
                  border: '1px solid var(--mantine-color-gray-3)'
                }}
              >
                <Group gap="sm">
                  <Avatar size={28} radius="xl" style={{ 
                    background: 'linear-gradient(45deg, var(--mantine-color-blue-6), var(--mantine-color-violet-6))'
                  }}>
                    <Text c="white" fw={600} size="xs">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </Text>
                  </Avatar>
                  <Stack gap={0}>
                    <Text size="xs" fw={600} lineClamp={1} ta="left">
                      {session?.user?.name || 'Admin User'}
                    </Text>
                    <Badge size="xs" color="green" variant="light">
                      Owner
                    </Badge>
                  </Stack>
                </Group>
              </Button>
            </Menu.Target>

            <Menu.Dropdown p="xs">
              <Menu.Item
                component={Link}
                href="/admin/settings"
                leftSection={<FiSettings size={14} />}
                p="sm"
                style={{ borderRadius: 6 }}
              >
                <Text size="sm">Settings</Text>
              </Menu.Item>
              
              <Menu.Divider my="xs" />
              
              <Menu.Item
                color="red"
                leftSection={<FiLogOut size={14} />}
                onClick={handleSignOut}
                p="sm"
                style={{ borderRadius: 6 }}
              >
                <Text size="sm">Sign Out</Text>
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          
          {/* Compact System Status */}
          <Group justify="center" mt="xs" p="xs" style={{ 
            backgroundColor: 'var(--mantine-color-green-0)',
            borderRadius: 6,
            border: '1px solid var(--mantine-color-green-2)'
          }}>
            <Group gap={4}>
              <div style={{ 
                width: 6, 
                height: 6, 
                backgroundColor: 'var(--mantine-color-green-6)', 
                borderRadius: '50%' 
              }} />
              <Text size="xs" fw={500} c="green.7">
                Online
              </Text>
            </Group>
          </Group>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  )
}