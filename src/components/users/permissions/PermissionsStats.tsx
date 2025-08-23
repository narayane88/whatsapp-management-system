'use client'

import {
  SimpleGrid,
  Card,
  Text,
  Stack,
  Group,
  Box,
} from '@mantine/core'
import {
  FiShield,
  FiUsers,
  FiLock,
  FiSettings,
} from 'react-icons/fi'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  isSystemPermission: boolean
  createdAt: string
}

interface PermissionsStatsProps {
  permissions: Permission[]
  categories: string[]
}

export default function PermissionsStats({ permissions, categories }: PermissionsStatsProps) {
  const systemPermissions = permissions.filter(p => p.isSystemPermission).length
  const customPermissions = permissions.filter(p => !p.isSystemPermission).length
  
  const stats = [
    {
      label: 'Total Permissions',
      value: permissions.length,
      icon: FiShield,
      color: 'blue'
    },
    {
      label: 'Categories',
      value: categories.length,
      icon: FiSettings,
      color: 'green'
    },
    {
      label: 'System Permissions',
      value: systemPermissions,
      icon: FiLock,
      color: 'orange'
    },
    {
      label: 'Custom Permissions',
      value: customPermissions,
      icon: FiUsers,
      color: 'violet'
    }
  ]

  return (
    <SimpleGrid cols={{ base: 2, md: 4 }} spacing="lg">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
            <Stack align="center" gap="xs">
              <Group gap="xs">
                <Box component={Icon} size={20} c={`${stat.color}.5`} />
                <Text size="xl" fw="bold" c={`${stat.color}.5`}>
                  {stat.value}
                </Text>
              </Group>
              <Text size="sm" c="dimmed">{stat.label}</Text>
            </Stack>
          </Card>
        )
      })}
    </SimpleGrid>
  )
}