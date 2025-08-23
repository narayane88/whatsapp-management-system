'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Card,
  Stack,
  Group,
  Button,
  Text,
  Title,
  Grid,
  NumberInput,
  Textarea,
  Alert,
  Badge,
  LoadingOverlay,
  Modal,
  Select,
  ActionIcon,
  Tooltip
} from '@mantine/core'
import {
  IconCoins,
  IconCreditCard,
  IconCheck,
  IconInfoCircle,
  IconArrowLeft,
  IconShoppingCart,
  IconGift,
  IconStar
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/navigation'
import { useDisclosure } from '@mantine/hooks'
import CustomerHeader from '@/components/customer/CustomerHeader'

interface PurchasePackage {
  id: string
  name: string
  coins: number
  price: number
  bonus: number
  popular?: boolean
  savings?: string
}

export default function PurchaseBizCoinsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentBalance, setCurrentBalance] = useState(0)
  const [selectedPackage, setSelectedPackage] = useState<PurchasePackage | null>(null)
  const [customAmount, setCustomAmount] = useState<number | string>('')
  const [purchaseMode, setPurchaseMode] = useState<'package' | 'custom'>('package')
  const [paymentMethod, setPaymentMethod] = useState<string>('razorpay')
  const [notes, setNotes] = useState('')
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false)

  // Predefined purchase packages
  const packages: PurchasePackage[] = [
    {
      id: 'starter',
      name: 'Starter Pack',
      coins: 1000,
      price: 100,
      bonus: 50,
      savings: 'Best for beginners'
    },
    {
      id: 'popular',
      name: 'Popular Pack',
      coins: 5000,
      price: 450,
      bonus: 500,
      popular: true,
      savings: 'Save ₹50 + 500 bonus coins'
    },
    {
      id: 'business',
      name: 'Business Pack',
      coins: 10000,
      price: 850,
      bonus: 1500,
      savings: 'Save ₹150 + 1500 bonus coins'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Pack',
      coins: 25000,
      price: 2000,
      bonus: 5000,
      savings: 'Save ₹500 + 5000 bonus coins'
    }
  ]

  useEffect(() => {
    fetchCurrentBalance()
  }, [])

  const fetchCurrentBalance = async () => {
    try {
      const response = await fetch('/api/customer/bizcoins', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setCurrentBalance(data.balance.current)
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const handlePackageSelect = (pkg: PurchasePackage) => {
    setSelectedPackage(pkg)
    setPurchaseMode('package')
    openConfirm()
  }

  const handleCustomPurchase = () => {
    if (!customAmount || typeof customAmount !== 'number' || customAmount < 100) {
      notifications.show({
        title: 'Invalid Amount',
        message: 'Minimum purchase is ₹100 (1000 BizCoins)',
        color: 'red'
      })
      return
    }

    const coins = customAmount * 10 // 1 INR = 10 BizCoins
    setSelectedPackage({
      id: 'custom',
      name: 'Custom Purchase',
      coins,
      price: customAmount,
      bonus: 0
    })
    setPurchaseMode('custom')
    openConfirm()
  }

  const processPurchase = async () => {
    if (!selectedPackage) return

    try {
      setLoading(true)

      // In a real application, you would integrate with a payment gateway like Razorpay
      // For now, we'll simulate a successful purchase
      
      const purchaseData = {
        amount: selectedPackage.coins + selectedPackage.bonus,
        type: 'PURCHASE',
        description: `Purchase: ${selectedPackage.name} - ${selectedPackage.coins} coins${selectedPackage.bonus > 0 ? ` + ${selectedPackage.bonus} bonus` : ''}`,
        reference: `purchase_${Date.now()}`,
        metadata: {
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          baseCoins: selectedPackage.coins,
          bonusCoins: selectedPackage.bonus,
          paidAmount: selectedPackage.price,
          paymentMethod: paymentMethod,
          notes: notes
        }
      }

      const response = await fetch('/api/customer/bizcoins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(purchaseData)
      })

      if (!response.ok) {
        throw new Error('Purchase failed')
      }

      const result = await response.json()

      notifications.show({
        title: '🎉 Purchase Successful!',
        message: `You've received ${selectedPackage.coins + selectedPackage.bonus} BizCoins. New balance: ${result.newBalance}`,
        color: 'green'
      })

      closeConfirm()
      router.push('/customer/bizcoins')

    } catch (error) {
      console.error('Purchase error:', error)
      notifications.show({
        title: 'Purchase Failed',
        message: 'There was an error processing your purchase. Please try again.',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <CustomerHeader 
        title="Purchase BizCoins"
        subtitle="Buy BizCoins to use our premium features and services"
        badge={{ label: 'Secure Payment', color: 'green' }}
      />
      
      <Container size="xl" py="md">
        <Stack gap="lg">
          {/* Back Button & Current Balance */}
          <Group justify="space-between">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size="1rem" />}
              onClick={() => router.push('/customer/bizcoins')}
            >
              Back to BizCoins
            </Button>
            <Card withBorder padding="sm">
              <Group gap="xs">
                <IconCoins size="1rem" />
                <Text size="sm" c="dimmed">Current Balance:</Text>
                <Text size="sm" fw={600}>{currentBalance.toLocaleString()} BizCoins</Text>
              </Group>
            </Card>
          </Group>

          {/* Purchase Packages */}
          <Card withBorder padding="lg">
            <Title order={3} mb="md">💎 Choose a Package</Title>
            <Grid>
              {packages.map((pkg) => (
                <Grid.Col key={pkg.id} span={{ base: 12, sm: 6, md: 3 }}>
                  <Card 
                    withBorder 
                    padding="md" 
                    style={{ 
                      position: 'relative',
                      border: pkg.popular ? '2px solid #4c6ef5' : undefined,
                      backgroundColor: pkg.popular ? '#f8f9ff' : undefined
                    }}
                  >
                    {pkg.popular && (
                      <Badge
                        color="blue"
                        variant="filled"
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: 10,
                        }}
                        leftSection={<IconStar size="0.8rem" />}
                      >
                        Popular
                      </Badge>
                    )}
                    
                    <Stack gap="sm" align="center" ta="center">
                      <Title order={5}>{pkg.name}</Title>
                      <Group gap="xs">
                        <Text size="xl" fw={700} c="blue">
                          {pkg.coins.toLocaleString()}
                        </Text>
                        <Text size="sm" c="dimmed">coins</Text>
                      </Group>
                      
                      {pkg.bonus > 0 && (
                        <Badge color="green" variant="light" leftSection={<IconGift size="0.8rem" />}>
                          +{pkg.bonus} Bonus
                        </Badge>
                      )}
                      
                      <Text size="lg" fw={600}>
                        ₹{pkg.price}
                      </Text>
                      
                      {pkg.savings && (
                        <Text size="xs" c="green" fw={500}>
                          {pkg.savings}
                        </Text>
                      )}
                      
                      <Button
                        fullWidth
                        color={pkg.popular ? 'blue' : 'gray'}
                        variant={pkg.popular ? 'filled' : 'light'}
                        onClick={() => handlePackageSelect(pkg)}
                      >
                        Purchase
                      </Button>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Card>

          {/* Custom Purchase */}
          <Card withBorder padding="lg">
            <Title order={3} mb="md">🛒 Custom Purchase</Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <NumberInput
                  label="Purchase Amount (₹)"
                  placeholder="Minimum ₹100"
                  value={customAmount}
                  onChange={setCustomAmount}
                  min={100}
                  max={100000}
                  leftSection="₹"
                  rightSection={
                    <Tooltip label="1 INR = 10 BizCoins">
                      <ActionIcon variant="transparent" size="sm">
                        <IconInfoCircle />
                      </ActionIcon>
                    </Tooltip>
                  }
                />
                {typeof customAmount === 'number' && customAmount >= 100 && (
                  <Text size="sm" c="dimmed" mt="xs">
                    You will receive: {(customAmount * 10).toLocaleString()} BizCoins
                  </Text>
                )}
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Textarea
                  label="Notes (Optional)"
                  placeholder="Add any notes about this purchase..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid.Col>
            </Grid>
            <Group justify="flex-end" mt="md">
              <Button
                leftSection={<IconShoppingCart size="1rem" />}
                onClick={handleCustomPurchase}
                disabled={!customAmount || typeof customAmount !== 'number' || customAmount < 100}
              >
                Purchase Custom Amount
              </Button>
            </Group>
          </Card>

          {/* Payment Info */}
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            <Text size="sm">
              <strong>Secure Payment:</strong> All payments are processed securely through our encrypted payment gateway. 
              BizCoins are credited instantly upon successful payment.
            </Text>
          </Alert>
        </Stack>
      </Container>

      {/* Purchase Confirmation Modal */}
      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title="Confirm Purchase"
        size="md"
      >
        {selectedPackage && (
          <Stack gap="md">
            <Card withBorder padding="md" style={{ backgroundColor: '#f8f9fa' }}>
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{selectedPackage.name}</Text>
                  <Text size="sm" c="dimmed">
                    {selectedPackage.coins.toLocaleString()} BizCoins
                    {selectedPackage.bonus > 0 && ` + ${selectedPackage.bonus.toLocaleString()} Bonus`}
                  </Text>
                </div>
                <Text size="lg" fw={700}>₹{selectedPackage.price}</Text>
              </Group>
            </Card>

            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(value) => setPaymentMethod(value || 'razorpay')}
              data={[
                { value: 'razorpay', label: 'Razorpay (Cards, UPI, NetBanking)' },
                { value: 'paypal', label: 'PayPal' },
                { value: 'bank_transfer', label: 'Bank Transfer' }
              ]}
            />

            <Text size="sm" c="dimmed">
              <strong>Total BizCoins:</strong> {(selectedPackage.coins + selectedPackage.bonus).toLocaleString()} 
              <br />
              <strong>New Balance:</strong> {(currentBalance + selectedPackage.coins + selectedPackage.bonus).toLocaleString()} BizCoins
            </Text>

            <Group justify="flex-end">
              <Button variant="light" onClick={closeConfirm}>Cancel</Button>
              <Button
                leftSection={<IconCreditCard size="1rem" />}
                onClick={processPurchase}
                loading={loading}
              >
                Proceed to Payment
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  )
}