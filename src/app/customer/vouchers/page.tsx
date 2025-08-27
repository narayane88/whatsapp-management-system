'use client'

import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Card,
  Button,
  SimpleGrid,
  Badge,
  ThemeIcon,
  Box,
  Tabs,
  Alert,
  Paper
} from '@mantine/core'
import {
  IconGift,
  IconHistory,
  IconCoins,
  IconTicket,
  IconInfoCircle,
  IconTrendingUp
} from '@tabler/icons-react'
import { FiGift, FiClock, FiCheck, FiPercent, FiPackage } from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { notifications } from '@mantine/notifications'
import CustomerHeader from '@/components/customer/CustomerHeader'
import VoucherRedemption from '@/components/vouchers/VoucherRedemption'
import ImpersonationAwareCustomerLayout from '@/components/customer/ImpersonationAwareCustomerLayout'

interface VoucherStats {
  totalRedeemed: number
  totalSavings: number
  messagesEarned: number
  bizcoinsEarned: number
  lastRedemption?: string
}

export default function CustomerVouchersPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<VoucherStats>({
    totalRedeemed: 0,
    totalSavings: 0,
    messagesEarned: 0,
    bizcoinsEarned: 0
  })
  const [loading, setLoading] = useState(true)
  const [bizcoinBalance, setBizcoinBalance] = useState(0)

  useEffect(() => {
    if (session?.user) {
      loadVoucherStats()
      loadBizcoinBalance()
    }
  }, [session])

  const loadVoucherStats = async () => {
    try {
      setLoading(true)
      // Fetch user's voucher redemption stats
      const response = await fetch('/api/vouchers/redeem')
      const data = await response.json()

      if (response.ok) {
        // Calculate stats from redemption history
        const history = data.redemptionHistory || []
        const stats: VoucherStats = {
          totalRedeemed: history.length,
          totalSavings: 0,
          messagesEarned: 0,
          bizcoinsEarned: 0,
          lastRedemption: history[0]?.used_at
        }

        history.forEach((redemption: any) => {
          if (redemption.type === 'credit') {
            stats.bizcoinsEarned += redemption.value
            stats.totalSavings += redemption.value
          } else if (redemption.type === 'messages') {
            stats.messagesEarned += redemption.value
            // Assuming 0.1 rupee per message for savings calculation
            stats.totalSavings += redemption.value * 0.1
          } else if (redemption.type === 'percentage') {
            // Percentage discounts would need actual purchase amount
            stats.totalSavings += redemption.discount_amount || 0
          } else if (redemption.type === 'package') {
            stats.totalSavings += redemption.value || 0
          }
        })

        setStats(stats)
      }
    } catch (error) {
      console.error('Failed to load voucher stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBizcoinBalance = async () => {
    try {
      const response = await fetch('/api/customer/bizcoins/balance')
      const data = await response.json()
      
      if (response.ok) {
        setBizcoinBalance(data.balance || 0)
      }
    } catch (error) {
      console.error('Failed to load bizcoin balance:', error)
    }
  }

  const getStatIcon = (type: string) => {
    switch (type) {
      case 'redeemed':
        return <IconTicket size={20} />
      case 'savings':
        return <FaRupeeSign size={20} />
      case 'messages':
        return <FiPackage size={20} />
      case 'bizcoins':
        return <IconCoins size={20} />
      default:
        return <IconGift size={20} />
    }
  }

  const getStatColor = (type: string) => {
    switch (type) {
      case 'redeemed': return 'blue'
      case 'savings': return 'green'
      case 'messages': return 'violet'
      case 'bizcoins': return 'orange'
      default: return 'gray'
    }
  }

  return (
    <ImpersonationAwareCustomerLayout>
      <Container size="xl">
        <CustomerHeader />
        
        <Stack gap="xl" mt="lg">
          {/* Page Header */}
          <Box>
            <Group justify="space-between" align="flex-start">
              <Box>
                <Title order={2} mb="xs">
                  Vouchers & Rewards
                </Title>
                <Text c="dimmed" size="sm">
                  Redeem voucher codes for exciting benefits and rewards
                </Text>
              </Box>
              
              {/* Bizcoin Balance Display */}
              <Paper 
                p="md" 
                radius="lg" 
                withBorder
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(245, 158, 11, 0.03) 100%)',
                  border: '2px solid rgba(251, 146, 60, 0.15)'
                }}
              >
                <Group gap="sm">
                  <ThemeIcon 
                    size="lg" 
                    variant="gradient" 
                    gradient={{ from: 'orange.6', to: 'amber.5', deg: 135 }}
                  >
                    <IconCoins size={20} />
                  </ThemeIcon>
                  <Box>
                    <Text size="xs" c="dimmed" fw={500}>Available Bizcoins</Text>
                    <Text size="lg" fw={700} c="orange.7">
                      {bizcoinBalance.toLocaleString()}
                    </Text>
                  </Box>
                </Group>
              </Paper>
            </Group>
          </Box>

          {/* Stats Cards */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            {[
              {
                type: 'redeemed',
                label: 'Vouchers Redeemed',
                value: stats.totalRedeemed.toString(),
                description: 'Total vouchers used'
              },
              {
                type: 'savings',
                label: 'Total Savings',
                value: `₹${stats.totalSavings.toFixed(2)}`,
                description: 'Money saved'
              },
              {
                type: 'messages',
                label: 'Messages Earned',
                value: stats.messagesEarned.toLocaleString(),
                description: 'From vouchers'
              },
              {
                type: 'bizcoins',
                label: 'Bizcoins Earned',
                value: stats.bizcoinsEarned.toLocaleString(),
                description: 'From vouchers'
              }
            ].map((stat) => (
              <Card
                key={stat.type}
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'
                }}
              >
                <Group justify="space-between" mb="xs">
                  <Box>
                    <Text size="xs" c="dimmed" fw={500} tt="uppercase">
                      {stat.label}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {stat.description}
                    </Text>
                  </Box>
                  <ThemeIcon 
                    size="md" 
                    variant="light" 
                    color={getStatColor(stat.type)}
                  >
                    {getStatIcon(stat.type)}
                  </ThemeIcon>
                </Group>
                <Text size="xl" fw={700} c={`${getStatColor(stat.type)}.7`}>
                  {stat.value}
                </Text>
              </Card>
            ))}
          </SimpleGrid>

          {/* Main Content Tabs */}
          <Tabs defaultValue="redeem" variant="pills">
            <Tabs.List mb="xl">
              <Tabs.Tab 
                value="redeem" 
                leftSection={<IconGift size={16} />}
              >
                Redeem Voucher
              </Tabs.Tab>
              <Tabs.Tab 
                value="history" 
                leftSection={<IconHistory size={16} />}
              >
                Redemption History
              </Tabs.Tab>
              <Tabs.Tab 
                value="benefits" 
                leftSection={<IconTrendingUp size={16} />}
              >
                Benefits Guide
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="redeem">
              <VoucherRedemption />
            </Tabs.Panel>

            <Tabs.Panel value="history">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={4} mb="md">Your Redemption History</Title>
                <Text c="dimmed" size="sm">
                  View your voucher redemption history in the redemption section above.
                </Text>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="benefits">
              <Stack gap="md">
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Title order={4} mb="md">
                    <Group gap="xs">
                      <IconInfoCircle size={20} />
                      How Vouchers Work
                    </Group>
                  </Title>
                  
                  <Stack gap="md">
                    {/* Voucher Type Explanations */}
                    <Paper p="md" radius="md" withBorder>
                      <Group gap="md" align="flex-start">
                        <ThemeIcon size="lg" variant="light" color="purple">
                          <FaRupeeSign size={16} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text fw={600} mb={4}>Credit/Bizcoin Vouchers</Text>
                          <Text size="sm" c="dimmed">
                            Adds bizcoins directly to your account balance. Use these bizcoins to get discounts on package purchases.
                          </Text>
                        </Box>
                      </Group>
                    </Paper>

                    <Paper p="md" radius="md" withBorder>
                      <Group gap="md" align="flex-start">
                        <ThemeIcon size="lg" variant="light" color="blue">
                          <FiPackage size={16} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text fw={600} mb={4}>Message Vouchers</Text>
                          <Text size="sm" c="dimmed">
                            Adds free messages to your current subscription. Messages are added immediately after redemption.
                          </Text>
                        </Box>
                      </Group>
                    </Paper>

                    <Paper p="md" radius="md" withBorder>
                      <Group gap="md" align="flex-start">
                        <ThemeIcon size="lg" variant="light" color="green">
                          <FiPackage size={16} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text fw={600} mb={4}>Package Vouchers</Text>
                          <Text size="sm" c="dimmed">
                            Automatically activates a specific subscription package. Great for trying premium features.
                          </Text>
                        </Box>
                      </Group>
                    </Paper>

                    <Paper p="md" radius="md" withBorder>
                      <Group gap="md" align="flex-start">
                        <ThemeIcon size="lg" variant="light" color="orange">
                          <FiPercent size={16} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text fw={600} mb={4}>Percentage Discount Vouchers</Text>
                          <Text size="sm" c="dimmed">
                            Gives you a percentage discount on your next package purchase. Applied automatically at checkout.
                          </Text>
                        </Box>
                      </Group>
                    </Paper>
                  </Stack>
                </Card>

                <Alert 
                  icon={<IconInfoCircle size={16} />} 
                  color="blue" 
                  variant="light"
                  title="Using Bizcoins for Payments"
                >
                  <Text size="sm">
                    When purchasing a subscription package, you can use your available bizcoins to reduce the payment amount. 
                    1 Bizcoin = ₹1. Simply select the amount of bizcoins to use during checkout!
                  </Text>
                </Alert>

                <Alert 
                  icon={<FiGift size={16} />} 
                  color="green" 
                  variant="light"
                  title="Pro Tips"
                >
                  <Stack gap="xs">
                    <Text size="sm">• Check your email for exclusive voucher codes</Text>
                    <Text size="sm">• Follow our social media for special promotions</Text>
                    <Text size="sm">• Vouchers may have expiry dates, use them before they expire</Text>
                    <Text size="sm">• Each voucher can only be used once per account</Text>
                  </Stack>
                </Alert>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          {/* Last Redemption Info */}
          {stats.lastRedemption && (
            <Alert 
              icon={<FiClock size={16} />} 
              color="gray" 
              variant="light"
            >
              <Group justify="space-between">
                <Text size="sm">
                  Last voucher redeemed: {new Date(stats.lastRedemption).toLocaleDateString()}
                </Text>
                <Badge variant="light" color="green" size="sm">
                  <Group gap={4}>
                    <FiCheck size={12} />
                    Active User
                  </Group>
                </Badge>
              </Group>
            </Alert>
          )}
        </Stack>
      </Container>
    </ImpersonationAwareCustomerLayout>
  )
}