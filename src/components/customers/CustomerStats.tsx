'use client'

import { SimpleGrid, Card, Text, Group, Badge, Stack, Box } from '@mantine/core'
import { FiUsers, FiUserCheck, FiGift } from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  customersWithDealers: number
  customersWithPackages: number
  customersWithExpiredPackages: number
  totalCustomerBalance: number
}

interface CustomerStatsProps {
  stats: CustomerStats
  loading?: boolean
}

export default function CustomerStatsCards({ stats, loading = false }: CustomerStatsProps) {
  if (loading) {
    return (
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
        {[...Array(6)].map((_, i) => (
          <Card key={i} shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="xs">
              <div style={{ height: 20, backgroundColor: '#f1f3f4', borderRadius: 4 }} />
              <div style={{ height: 24, backgroundColor: '#f1f3f4', borderRadius: 4 }} />
              <div style={{ height: 16, backgroundColor: '#f1f3f4', borderRadius: 4 }} />
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    )
  }

  const statsConfig = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toLocaleString(),
      icon: FiUsers,
      color: 'blue'
    },
    {
      title: 'Active Customers',
      value: stats.activeCustomers.toLocaleString(),
      icon: FiUserCheck,
      color: 'green'
    },
    {
      title: 'With Dealers',
      value: stats.customersWithDealers.toLocaleString(),
      icon: FiUsers,
      color: 'purple'
    },
    {
      title: 'With Packages',
      value: stats.customersWithPackages.toLocaleString(),
      icon: FiGift,
      color: 'orange'
    },
    {
      title: 'Expired Packages',
      value: stats.customersWithExpiredPackages.toLocaleString(),
      icon: FiGift,
      color: 'red'
    },
    {
      title: 'Total Balance',
      value: `₹${stats.totalCustomerBalance.toFixed(2)}`,
      icon: FaRupeeSign,
      color: 'teal'
    }
  ]

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
      {statsConfig.map((stat, index) => (
        <Card 
          key={index} 
          shadow="md" 
          padding="md" 
          radius="lg" 
          withBorder
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            border: `2px solid var(--mantine-color-${stat.color}-2)`,
            transition: 'all 0.3s ease',
            height: 'auto',
            minHeight: '140px'
          }}
          onMouseEnter={(e: any) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)'
          }}
          onMouseLeave={(e: any) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Stack gap="sm">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
              <Group gap="xs">
                <Badge
                  color={stat.color}
                  variant="light"
                  size="xs"
                  radius="md"
                  p="xs"
                >
                  <stat.icon size={10} />
                </Badge>
                <Box>
                  <Text 
                    c={`${stat.color}.7`} 
                    size="xs" 
                    fw={600} 
                    tt="uppercase"
                    lh={1.2}
                  >
                    {stat.title}
                  </Text>
                </Box>
              </Group>
            </Group>
            
            {/* Main Value */}
            <Group justify="space-between" align="center">
              <Box>
                <Text 
                  size="xl" 
                  fw={700} 
                  c={`${stat.color}.8`}
                  lh={1}
                  style={{ fontSize: '1.75rem' }}
                >
                  {stat.value}
                </Text>
              </Box>
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  )
}