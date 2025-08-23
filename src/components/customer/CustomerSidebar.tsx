'use client'

import { useState } from 'react'
import { Stack, NavLink } from '@mantine/core'
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
  IconCrown
} from '@tabler/icons-react'

export default function CustomerSidebar() {
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
      children: [
        {
          icon: IconUsers,
          label: 'Save Contacts',
          href: '/customer/contacts/save',
        },
        {
          icon: IconUsers,
          label: 'Contact Groups',
          href: '/customer/contacts/groups',
        },
        {
          icon: IconMessageCircle,
          label: 'Subscribe',
          href: '/customer/contacts/subscribe',
        },
      ],
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
  ]

  const renderNavItems = (items: typeof navigationItems) => {
    return items.map((item, index) => {
      const isActive = item.href ? pathname === item.href : false
      
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
          {item.children && renderNavItems(item.children)}
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