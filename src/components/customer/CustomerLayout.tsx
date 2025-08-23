'use client'

import { ReactNode } from 'react'
import { AppShell, Burger, Group, Text, Avatar, Menu, ActionIcon, useMantineColorScheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { signOut } from 'next-auth/react'
import CustomerSidebar from './CustomerSidebar'
import CustomerHeader from './CustomerHeader'
import { IconSun, IconMoon } from '@tabler/icons-react'

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
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Text size="lg" fw={600} c="blue">
              WhatsApp Customer Portal
            </Text>
          </Group>

          <Group>
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
        <CustomerSidebar />
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  )
}