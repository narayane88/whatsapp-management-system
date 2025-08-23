'use client'

import {
  Button,
  Stack,
  Text,
  Loader,
  Center
} from '@mantine/core'
import { 
  FiHome, 
  FiUsers, 
  FiUserCheck,
  FiPackage, 
  FiCreditCard,
  FiRepeat,
  FiGlobe, 
  FiServer, 
  FiBook,
  FiSettings
} from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import BizCoinIcon from '@/components/icons/BizCoinIcon'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions'
import { useMemo } from 'react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ size?: number }>
  requiredPermissions: string[] // Both page access and menu visibility
  description?: string
}

const navigationItems: NavigationItem[] = [
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

interface PermissionAwareNavigationProps {
  onItemClick?: () => void
}

export default function PermissionAwareNavigation({ onItemClick }: PermissionAwareNavigationProps) {
  const { hasPermission, isLoading } = useDynamicPermissions()
  const pathname = usePathname()

  // Ultra-fast permission filtering using compiled O(1) BitMask operations
  const visibleItems = useMemo(() => {
    if (isLoading) return []
    
    // Filter items using dynamic permission checks
    return navigationItems.filter(item => 
      item.requiredPermissions.every(permission => hasPermission(permission))
    )
  }, [hasPermission, isLoading])

  // Show loading state while checking permissions
  if (isLoading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="sm">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Loading menu...</Text>
        </Stack>
      </Center>
    )
  }

  // Show message if no items are visible
  if (visibleItems.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="sm">
          <Text size="sm" c="dimmed" ta="center">
            No accessible menu items found.
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            Please contact your administrator if you need access.
          </Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Stack gap="sm">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        
        return (
          <Button
            key={item.href}
            component={Link}
            href={item.href}
            variant={isActive ? 'filled' : 'subtle'}
            color={isActive ? 'blue' : 'gray'}
            justify="flex-start"
            leftSection={<Icon size={16} />}
            fullWidth
            onClick={onItemClick}
            p="sm"
            h={44}
            style={{
              borderRadius: 12,
              transition: 'all 0.2s ease',
              border: isActive ? '1px solid var(--mantine-color-blue-2)' : '1px solid transparent',
              backgroundColor: isActive 
                ? 'var(--mantine-color-blue-0)' 
                : 'transparent'
            }}
            styles={{
              root: {
                '&:hover': {
                  backgroundColor: isActive 
                    ? 'var(--mantine-color-blue-1)' 
                    : 'var(--mantine-color-gray-0)',
                  transform: 'translateX(4px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }
              },
              inner: { 
                justifyContent: 'flex-start',
                gap: '12px',
                flexWrap: 'nowrap'
              },
              section: { 
                marginRight: 0,
                color: isActive ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-6)'
              }
            }}
          >
            <Text 
              size="sm" 
              fw={isActive ? 600 : 500}
              c={isActive ? 'blue.7' : 'gray.8'}
              lineClamp={1}
              ta="left"
              style={{ flex: 1 }}
            >
              {item.name}
            </Text>
          </Button>
        )
      })}
      
    </Stack>
  )
}