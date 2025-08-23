'use client'

import {
  Box,
  Title,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  Card,
  Badge,
  Alert,
  Modal,
  Table,
  Loader,
  Progress,
  Divider,
} from '@mantine/core'
import {
  FiGift,
  FiCheck,
  FiX,
  FiClock,
  FiInfo,
  FiDollarSign,
  FiMessageCircle,
  FiPercent,
  FiPackage,
  FiHistory
} from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'

interface RedemptionHistory {
  id: number
  code: string
  type: string
  value: number
  used_at: string
  benefit_description: string
  notes?: string
}

interface VoucherBenefit {
  description: string
  creditAmount: number
  messageAmount: number
  discountPercent: number
}

interface RedemptionResult {
  voucher: {
    code: string
    type: string
    value: number
  }
  benefit: VoucherBenefit
  redemption: {
    redeemedAt: string
    userId: string
    userEmail: string
  }
}

export default function VoucherRedemption() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionHistory[]>([])
  const [lastRedemption, setLastRedemption] = useState<RedemptionResult | null>(null)
  const [isHistoryOpen, { open: openHistory, close: closeHistory }] = useDisclosure(false)
  const [isSuccessOpen, { open: openSuccess, close: closeSuccess }] = useDisclosure(false)

  const form = useForm({
    initialValues: {
      code: ''
    },
    validate: {
      code: (value) => (!value.trim() ? 'Voucher code is required' : null)
    }
  })

  // Load redemption history when component mounts
  useEffect(() => {
    if (session?.user) {
      loadRedemptionHistory()
    }
  }, [session])

  const loadRedemptionHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await fetch('/api/vouchers/redeem')
      const data = await response.json()

      if (response.ok) {
        setRedemptionHistory(data.redemptionHistory || [])
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to load redemption history',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load redemption history',
        color: 'red'
      })
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleRedeemVoucher = async (values: typeof form.values) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: values.code.toUpperCase().trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setLastRedemption(data)
        form.reset()
        openSuccess()
        loadRedemptionHistory() // Refresh history
        
        notifications.show({
          title: 'Success!',
          message: `Voucher "${data.voucher.code}" redeemed successfully`,
          color: 'green'
        })
      } else {
        notifications.show({
          title: 'Redemption Failed',
          message: data.error || 'Failed to redeem voucher',
          color: 'red'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to redeem voucher. Please try again.',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit': return <FaRupeeSign size={16} />
      case 'messages': return <FiMessageCircle size={16} />
      case 'percentage': return <FiPercent size={16} />
      case 'package': return <FiPackage size={16} />
      default: return <FiGift size={16} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'credit': return 'purple'
      case 'messages': return 'blue'
      case 'percentage': return 'orange'
      case 'package': return 'green'
      default: return 'gray'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Box>
        <Title order={2} c="gray.8" mb="xs">
          Redeem Voucher
        </Title>
        <Text c="gray.6">
          Enter your voucher code to redeem rewards and benefits
        </Text>
      </Box>

      {/* Redemption Form */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <form onSubmit={form.onSubmit(handleRedeemVoucher)}>
          <Stack gap="md">
            <TextInput
              label="Voucher Code"
              placeholder="Enter your voucher code (e.g., WELCOME50)"
              size="lg"
              leftSection={<FiGift size={18} />}
              styles={{
                input: {
                  textTransform: 'uppercase'
                }
              }}
              {...form.getInputProps('code')}
            />

            <Group justify="space-between">
              <Button
                variant="outline"
                leftSection={<FiHistory size={16} />}
                onClick={openHistory}
              >
                View History
              </Button>
              
              <Button
                type="submit"
                size="lg"
                loading={loading}
                leftSection={<FiGift size={18} />}
              >
                Redeem Voucher
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>

      {/* Important Notes */}
      <Alert icon={<FiInfo size={16} />} color="blue" variant="light">
        <Stack gap="xs">
          <Text fw={600}>Important Notes:</Text>
          <Text size="sm">• Each voucher can only be used once per account</Text>
          <Text size="sm">• Dealers cannot redeem vouchers they created</Text>
          <Text size="sm">• Vouchers may have expiry dates</Text>
          <Text size="sm">• Credits and messages are added to your account immediately</Text>
        </Stack>
      </Alert>

      {/* Recent Redemptions Summary */}
      {redemptionHistory.length > 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={4}>Recent Redemptions</Title>
            <Badge color="blue" variant="light">
              {redemptionHistory.length} total
            </Badge>
          </Group>

          <Stack gap="sm">
            {redemptionHistory.slice(0, 3).map((redemption) => (
              <Group key={redemption.id} justify="space-between" p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <Group gap="sm">
                  <Box c={getTypeColor(redemption.type)}>
                    {getTypeIcon(redemption.type)}
                  </Box>
                  <div>
                    <Text fw={600} size="sm">{redemption.code}</Text>
                    <Text size="xs" c="dimmed">{redemption.benefit_description}</Text>
                  </div>
                </Group>
                <Text size="xs" c="dimmed">
                  {formatDateTime(redemption.used_at)}
                </Text>
              </Group>
            ))}
          </Stack>

          {redemptionHistory.length > 3 && (
            <Button variant="subtle" size="xs" mt="sm" onClick={openHistory}>
              View all {redemptionHistory.length} redemptions
            </Button>
          )}
        </Card>
      )}

      {/* Success Modal */}
      <Modal
        opened={isSuccessOpen}
        onClose={closeSuccess}
        title="Voucher Redeemed Successfully!"
        size="md"
        centered
      >
        {lastRedemption && (
          <Stack gap="md">
            <Box ta="center" p="md">
              <Box 
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}
              >
                <FiCheck size={40} color="white" />
              </Box>
              
              <Title order={3} c="green.6" mb="xs">
                Congratulations!
              </Title>
              <Text c="dimmed" mb="lg">
                Your voucher has been successfully redeemed
              </Text>
            </Box>

            <Card withBorder p="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600}>Voucher Code:</Text>
                  <Badge size="lg">{lastRedemption.voucher.code}</Badge>
                </Group>

                <Group justify="space-between">
                  <Text fw={600}>Benefit:</Text>
                  <Text>{lastRedemption.benefit.description}</Text>
                </Group>

                {lastRedemption.benefit.creditAmount > 0 && (
                  <Group justify="space-between">
                    <Text fw={600}>Account Credit:</Text>
                    <Text c="green.6" fw={600}>+₹{lastRedemption.benefit.creditAmount}</Text>
                  </Group>
                )}

                {lastRedemption.benefit.messageAmount > 0 && (
                  <Group justify="space-between">
                    <Text fw={600}>Message Credit:</Text>
                    <Text c="blue.6" fw={600}>+{lastRedemption.benefit.messageAmount} messages</Text>
                  </Group>
                )}

                <Group justify="space-between">
                  <Text fw={600}>Redeemed At:</Text>
                  <Text size="sm" c="dimmed">
                    {formatDateTime(lastRedemption.redemption.redeemedAt)}
                  </Text>
                </Group>
              </Stack>
            </Card>

            <Button fullWidth onClick={closeSuccess}>
              Continue
            </Button>
          </Stack>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        opened={isHistoryOpen}
        onClose={closeHistory}
        title="Voucher Redemption History"
        size="xl"
      >
        {historyLoading ? (
          <Group justify="center" p="xl">
            <Loader size="lg" />
          </Group>
        ) : redemptionHistory.length === 0 ? (
          <Alert icon={<FiInfo size={16} />} color="blue" variant="light">
            You haven&apos;t redeemed any vouchers yet.
          </Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Code</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Benefit</Table.Th>
                <Table.Th>Redeemed At</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {redemptionHistory.map((redemption) => (
                <Table.Tr key={redemption.id}>
                  <Table.Td>
                    <Badge variant="outline">
                      {redemption.code}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Box c={getTypeColor(redemption.type)}>
                        {getTypeIcon(redemption.type)}
                      </Box>
                      <Text size="sm" tt="capitalize">
                        {redemption.type}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {redemption.benefit_description}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {formatDateTime(redemption.used_at)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Modal>
    </Stack>
  )
}