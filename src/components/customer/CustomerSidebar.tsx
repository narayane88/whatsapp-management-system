'use client'

import { useState } from 'react'
import { Stack, NavLink, Tooltip, ActionIcon } from '@mantine/core'
import { usePathname, useRouter } from 'next/navigation'
import { 
  IconUser, 
  IconBrandWhatsapp, 
  IconUsers, 
  IconKey,
  IconDashboard,
  IconMessageCircle,
  IconDeviceMobile,
  IconMessage,
  IconSettings,
  IconClock,
  IconMessages,
  IconSend,
  IconCoins,
  IconCreditCard,
  IconPackage,
  IconCrown,
  IconGift
} from '@tabler/icons-react'

interface CustomerSidebarProps {
  collapsed?: boolean
}

export default function CustomerSidebar({ collapsed = false }: CustomerSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navigationItems = [
    {
      icon: IconDashboard,
      label: 'Dashboard',
      href: '/customer',
    },
    {
      icon: IconUser,
      label: 'Profile',
      href: '/customer/profile',
    },
    {
      icon: IconBrandWhatsapp,
      label: 'WhatsApp',
      children: [
        {
          icon: IconDeviceMobile,
          label: 'My Devices',
          href: '/customer/whatsapp/devices',
        },
        {
          icon: IconMessage,
          label: 'Send Messages',
          href: '/customer/whatsapp/send',
        },
        {
          icon: IconMessages,
          label: 'Bulk Message',
          href: '/customer/whatsapp/bulk',
        },
        {
          icon: IconClock,
          label: 'Message Queue',
          href: '/customer/whatsapp/queue',
        },
        {
          icon: IconSend,
          label: 'Message Sent',
          href: '/customer/whatsapp/sent',
        },
      ],
    },
    {
      icon: IconUsers,
      label: 'Contacts',
      href: '/customer/contacts',
    },
    {
      icon: IconKey,
      label: 'API Keys',
      href: '/customer/api-keys',
      children: [
        {
          icon: IconKey,
          label: 'Manage API Keys',
          href: '/customer/api-keys',
        },
        {
          icon: IconSettings,
          label: 'API Documentation',
          href: '/customer/api-keys/docs',
        },
      ],
    },
    {
      icon: IconPackage,
      label: 'Subscription',
      href: '/customer/subscription',
      children: [
        {
          icon: IconPackage,
          label: 'Available Packages',
          href: '/customer/subscription',
        },
        {
          icon: IconCrown,
          label: 'My Subscriptions',
          href: '/customer/subscription/my-plans',
        },
      ],
    },
    {
      icon: IconCoins,
      label: 'BizCoins',
      href: '/customer/bizcoins',
      children: [
        {
          icon: IconCoins,
          label: 'Balance & History',
          href: '/customer/bizcoins',
        },
        {
          icon: IconCreditCard,
          label: 'Purchase Coins',
          href: '/customer/bizcoins/purchase',
        },
      ],
    },
    {
      icon: IconGift,
      label: 'Vouchers',
      href: '/customer/vouchers',
    },
  ]

  const renderNavItems = (items: typeof navigationItems, isChild = false) => {
    return items.map((item, index) => {
      const isActive = item.href ? pathname === item.href : false
      
      if (collapsed && !isChild) {
        // Show only icon in collapsed mode for top-level items
        return (
          <Tooltip
            key={item.href || `menu-${index}`}
            label={item.label}
            position="right"
            offset={10}
          >
            <ActionIcon
              variant={isActive ? "filled" : "subtle"}
              size="lg"
              onClick={() => {
                if (item.href) {
                  router.push(item.href)
                }
              }}
              style={{ width: '100%', height: 40 }}
            >
              <item.icon size="1.2rem" />
            </ActionIcon>
          </Tooltip>
        )
      }
      
      return (
        <NavLink
          key={item.href || `menu-${index}`}
          href={item.href}
          label={item.label}
          leftSection={<item.icon size="1rem" />}
          active={isActive}
          onClick={(e) => {
            e.preventDefault()
            if (item.href) {
              router.push(item.href)
            }
          }}
          childrenOffset={28}
        >
          {item.children && !collapsed && renderNavItems(item.children, true)}
        </NavLink>
      )
    })
  }

  return (
    <Stack gap="xs">
      {renderNavItems(navigationItems)}
    </Stack>
  )
}