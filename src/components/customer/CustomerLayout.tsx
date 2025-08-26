'use client'

import { ReactNode, useState } from 'react'
import { AppShell, Burger, Group, Text, Avatar, Menu, ActionIcon, useMantineColorScheme, TextInput, Modal, Stack, Button, Card, Badge, Paper, ScrollArea, Image } from '@mantine/core'
import { useDisclosure, useHotkeys } from '@mantine/hooks'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CustomerSidebar from './CustomerSidebar'
import CustomerHeader from './CustomerHeader'
import CustomerNotificationProvider from './CustomerNotificationProvider'
import { useCompanyProfile, useCompanyLogo } from '@/hooks/useCompanyProfile'
import { IconSun, IconMoon, IconSearch, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconDeviceMobile, IconMail, IconList, IconCreditCard, IconKey, IconFileText, IconSettings, IconUser, IconBell } from '@tabler/icons-react'

interface CustomerLayoutProps {
  children: ReactNode
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function CustomerLayout({ children, user }: CustomerLayoutProps) {
  const [opened, { toggle }] = useDisclosure()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchOpened, { open: openSearch, close: closeSearch }] = useDisclosure(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const router = useRouter()
  const { profile } = useCompanyProfile()
  const logoUrl = useCompanyLogo(colorScheme === 'dark' ? 'dark' : 'light')

  // Mega search data
  const searchActions = [
    {
      id: 'whatsapp-devices',
      label: 'WhatsApp Devices',
      description: 'Manage your WhatsApp instances and devices',
      onClick: () => router.push('/customer/whatsapp/devices'),
      icon: <IconDeviceMobile size={18} />,
      keywords: ['devices', 'whatsapp', 'instances', 'qr', 'code']
    },
    {
      id: 'bulk-messaging',
      label: 'Bulk Messaging',
      description: 'Send messages to multiple contacts',
      onClick: () => router.push('/customer/whatsapp/bulk'),
      icon: <IconMail size={18} />,
      keywords: ['bulk', 'messages', 'send', 'multiple', 'broadcast']
    },
    {
      id: 'message-queue',
      label: 'Message Queue',
      description: 'View and manage queued messages',
      onClick: () => router.push('/customer/whatsapp/queue'),
      icon: <IconList size={18} />,
      keywords: ['queue', 'pending', 'messages', 'scheduled']
    },
    {
      id: 'sent-messages',
      label: 'Sent Messages',
      description: 'View message history and delivery status',
      onClick: () => router.push('/customer/whatsapp/sent'),
      icon: <IconMail size={18} />,
      keywords: ['sent', 'history', 'delivery', 'status', 'messages']
    },
    {
      id: 'subscription',
      label: 'Subscription',
      description: 'Manage your subscription plan',
      onClick: () => router.push('/customer/subscription'),
      icon: <IconCreditCard size={18} />,
      keywords: ['subscription', 'plan', 'billing', 'upgrade', 'package']
    },
    {
      id: 'bizcoins',
      label: 'BizCoins',
      description: 'Check your BizCoins balance and usage',
      onClick: () => router.push('/customer/bizcoins'),
      icon: <IconCreditCard size={18} />,
      keywords: ['bizcoins', 'credits', 'balance', 'purchase', 'usage']
    },
    {
      id: 'api-keys',
      label: 'API Keys',
      description: 'Manage your API keys and access tokens',
      onClick: () => router.push('/customer/api-keys'),
      icon: <IconKey size={18} />,
      keywords: ['api', 'keys', 'tokens', 'authentication', 'access']
    },
    {
      id: 'api-docs',
      label: 'API Documentation',
      description: 'View API documentation and examples',
      onClick: () => router.push('/customer/api-keys/documentation'),
      icon: <IconFileText size={18} />,
      keywords: ['api', 'documentation', 'docs', 'examples', 'reference']
    },
    {
      id: 'profile',
      label: 'Profile Settings',
      description: 'Update your profile information',
      onClick: () => router.push('/customer/profile'),
      icon: <IconUser size={18} />,
      keywords: ['profile', 'settings', 'personal', 'information', 'account']
    },
    {
      id: 'notifications',
      label: 'Notification Settings',
      description: 'Configure notification preferences',
      onClick: () => router.push('/customer/settings/notifications'),
      icon: <IconBell size={18} />,
      keywords: ['notifications', 'settings', 'alerts', 'preferences', 'sounds']
    }
  ]

  // Filter search results based on query
  const filteredActions = searchActions.filter(action =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    action.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleSearchNavigate = (action: any) => {
    action.onClick()
    setSearchQuery('')
    setSearchFocused(false)
  }

  useHotkeys([
    ['mod+K', () => openSearch()],
  ])

  return (
    <>
      {/* Custom Mega Search Modal */}
      <Modal 
        opened={searchOpened} 
        onClose={closeSearch}
        title="Search Customer Features"
        size="lg"
        centered
        overlayProps={{ blur: 3 }}
      >
        <Stack gap="md">
          <TextInput
            placeholder="Search customer features... (Ctrl+K)"
            leftSection={<IconSearch size={18} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            size="md"
          />
          
          <ScrollArea style={{ maxHeight: 400 }}>
            <Stack gap="xs">
              {filteredActions.length > 0 ? (
                filteredActions.map((action) => (
                  <Paper 
                    key={action.id}
                    p="md"
                    withBorder
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      action.onClick()
                      closeSearch()
                      setSearchQuery('')
                    }}
                  >
                    <Group gap="sm">
                      {action.icon}
                      <div style={{ flex: 1 }}>
                        <Text fw={500}>{action.label}</Text>
                        <Text size="sm" c="dimmed">{action.description}</Text>
                      </div>
                    </Group>
                  </Paper>
                ))
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  No results found for "{searchQuery}"
                </Text>
              )}
            </Stack>
          </ScrollArea>
        </Stack>
      </Modal>
      
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: sidebarCollapsed ? 60 : 280,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          {/* Left Section */}
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            
            {/* Desktop sidebar toggle */}
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              visibleFrom="sm"
            >
              {sidebarCollapsed ? 
                <IconLayoutSidebarLeftExpand size={16} /> : 
                <IconLayoutSidebarLeftCollapse size={16} />
              }
            </ActionIcon>
            
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

          {/* Center Search Bar - Only visible on larger screens */}
          <Group style={{ flex: 1, position: 'relative' }} justify="center" visibleFrom="lg">
            <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
              <TextInput
                placeholder="Search customer features... (Ctrl+K)"
                leftSection={<IconSearch size={18} />}
                style={{ width: '100%' }}
                variant="filled"
                radius="md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  // Delay blur to allow clicking on results
                  setTimeout(() => setSearchFocused(false), 200)
                }}
                styles={{
                  input: {
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    '&:hover': {
                      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                    },
                    '&:focus': {
                      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }
                  }
                }}
              />
              
              {/* Dropdown Results */}
              {searchFocused && searchQuery && (
                <Paper
                  shadow="md"
                  radius="md"
                  withBorder
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    marginTop: 4,
                    maxHeight: 300,
                    overflow: 'hidden'
                  }}
                >
                  <ScrollArea style={{ maxHeight: 300 }}>
                    <Stack gap={0}>
                      {filteredActions.length > 0 ? (
                        filteredActions.slice(0, 6).map((action) => (
                          <div
                            key={action.id}
                            style={{
                              padding: '12px 16px',
                              cursor: 'pointer',
                              borderBottom: `1px solid ${colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                            }}
                            onClick={() => handleSearchNavigate(action)}
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                          >
                            <Group gap="sm">
                              {action.icon}
                              <div style={{ flex: 1 }}>
                                <Text size="sm" fw={500}>{action.label}</Text>
                                <Text size="xs" c="dimmed">{action.description}</Text>
                              </div>
                            </Group>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                          <Text size="sm" c="dimmed">
                            No results found for "{searchQuery}"
                          </Text>
                        </div>
                      )}
                    </Stack>
                  </ScrollArea>
                </Paper>
              )}
            </div>
          </Group>

          <Group>
            {/* Mobile Search Button */}
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => openSearch()}
              hiddenFrom="lg"
            >
              <IconSearch size={18} />
            </ActionIcon>
            
            <ActionIcon
              onClick={() => toggleColorScheme()}
              variant="subtle"
              size="lg"
            >
              {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
            </ActionIcon>
            
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Avatar
                  src={user.image}
                  alt={user.name || 'User'}
                  radius="xl"
                  style={{ cursor: 'pointer' }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>{user.name || 'Customer'}</Menu.Label>
                <Menu.Item>Profile Settings</Menu.Item>
                <Menu.Item>Account Details</Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  color="red" 
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                >
                  Sign Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <CustomerSidebar collapsed={sidebarCollapsed} />
      </AppShell.Navbar>

      <AppShell.Main>
        <CustomerNotificationProvider>
          {children}
        </CustomerNotificationProvider>
      </AppShell.Main>
    </AppShell>
    </>
  )
}