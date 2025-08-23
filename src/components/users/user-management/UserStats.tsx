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
  FiUsers,
  FiUserCheck,
  FiShield,
  FiActivity,
} from 'react-icons/fi'

interface User {
  id: number
  name: string
  email: string
  mobile: string
  role: string
  status: string
  lastLogin: string
  isActive: boolean
}

interface UserStatsProps {
  users: User[]
}

export default function UserStats({ users }: UserStatsProps) {
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'Active').length
  const ownerUsers = users.filter(u => u.role === 'OWNER').length
  const subDealerUsers = users.filter(u => u.role === 'SUBDEALER').length
  
  const stats = [
    {
      label: 'Total Users',
      value: totalUsers,
      icon: FiUsers,
      color: 'blue'
    },
    {
      label: 'Active Users',
      value: activeUsers,
      icon: FiUserCheck,
      color: 'green'
    },
    {
      label: 'Owners',
      value: ownerUsers,
      icon: FiShield,
      color: 'red'
    },
    {
      label: 'SubDealers',
      value: subDealerUsers,
      icon: FiActivity,
      color: 'orange'
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