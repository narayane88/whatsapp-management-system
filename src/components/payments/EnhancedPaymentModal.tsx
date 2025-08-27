'use client'

import {
  Modal,
  Stack,
  Group,
  Title,
  Text,
  Button,
  Paper,
  Badge,
  Divider,
  Alert,
  Loader,
  Card,
  Checkbox,
  NumberInput,
  Progress,
  Box,
  ThemeIcon
} from '@mantine/core'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import * as Icons from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'
import { IconCoins, IconCreditCard, IconCheck } from '@tabler/icons-react'

interface Package {
  id: string
  name: string
  price: number
  offer_price?: number
  offer_enabled: boolean
  duration: number
  currency: string
}

interface PaymentOrder {
  id: string
  amount: number
  currency: string
  receipt: string
}

interface BizcoinPaymentData {
  useBizcoins: boolean
  bizcoinAmount: number
  finalPayableAmount: number
  savings: number
}

interface EnhancedPaymentModalProps {
  opened: boolean
  onClose: () => void
  package: Package | null
  customerId: string
  customerEmail: string
  customerPhone: string
  onPaymentSuccess: (paymentData: any) => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function EnhancedPaymentModal({
  opened,
  onClose,
  package: pkg,
  customerId,
  customerEmail,
  customerPhone,
  onPaymentSuccess
}: EnhancedPaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<PaymentOrder | null>(null)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [bizcoinBalance, setBizcoinBalance] = useState(0)
  const [balanceLoading, setBalanceLoading] = useState(true)
  
  // Bizcoin payment state
  const [useBizcoins, setUseBizcoins] = useState(false)
  const [bizcoinAmount, setBizcoinAmount] = useState(0)
  const [paymentStep, setPaymentStep] = useState<'select' | 'confirm' | 'processing'>('select')

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true)
          return
        }

        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
      })
    }

    loadRazorpayScript().then((loaded) => {
      setRazorpayLoaded(!!loaded)
    })
  }, [])

  // Load bizcoin balance when modal opens
  useEffect(() => {
    if (opened && customerId) {
      loadBizcoinBalance()
    }
  }, [opened, customerId])

  // Reset state when modal closes
  useEffect(() => {
    if (!opened) {
      setUseBizcoins(false)
      setBizcoinAmount(0)
      setPaymentStep('select')
      setOrder(null)
    }
  }, [opened])

  const loadBizcoinBalance = async () => {
    try {
      setBalanceLoading(true)
      const response = await fetch('/api/customer/bizcoins/balance')
      const data = await response.json()
      
      if (response.ok) {
        setBizcoinBalance(data.balance || 0)
        // Auto-select maximum available bizcoins if user has some
        if (data.balance > 0 && pkg) {
          const maxUsable = Math.min(data.balance, getPackagePrice())
          setBizcoinAmount(maxUsable)
          setUseBizcoins(true)
        }
      }
    } catch (error) {
      console.error('Failed to load bizcoin balance:', error)
    } finally {
      setBalanceLoading(false)
    }
  }

  const getPackagePrice = () => {
    if (!pkg) return 0
    return pkg.offer_enabled && pkg.offer_price ? pkg.offer_price : pkg.price
  }

  const calculatePaymentData = (): BizcoinPaymentData => {
    const packagePrice = getPackagePrice()
    const actualBizcoinAmount = useBizcoins ? Math.min(bizcoinAmount, bizcoinBalance, packagePrice) : 0
    const finalAmount = Math.max(0, packagePrice - actualBizcoinAmount)
    
    return {
      useBizcoins,
      bizcoinAmount: actualBizcoinAmount,
      finalPayableAmount: finalAmount,
      savings: actualBizcoinAmount
    }
  }

  const handleBizcoinAmountChange = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
    const maxUsable = Math.min(bizcoinBalance, getPackagePrice())
    setBizcoinAmount(Math.min(Math.max(0, numValue), maxUsable))
  }

  const createPaymentOrder = async () => {
    if (!pkg) return

    console.log('Creating payment order for:', { 
      packageId: pkg.id, 
      customerId, 
      customerEmail, 
      razorpayLoaded,
      paymentData: calculatePaymentData()
    })

    if (!razorpayLoaded) {
      notifications.show({
        title: 'Payment System Loading',
        message: 'Please wait for payment system to load',
        color: 'orange'
      })
      return
    }

    const paymentData = calculatePaymentData()

    // If fully paid with bizcoins, process directly
    if (paymentData.finalPayableAmount === 0) {
      await processDirectBizcoinPayment(paymentData)
      return
    }

    try {
      setLoading(true)
      setPaymentStep('processing')
      
      const orderResponse = await fetch('/api/admin/bizpoints/purchase/create-iframe-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageId: pkg.id,
          customerId,
          customerEmail,
          customerPhone,
          bizcoinPayment: {
            useBizcoins: paymentData.useBizcoins,
            bizcoinAmount: paymentData.bizcoinAmount,
            finalAmount: paymentData.finalPayableAmount
          }
        })
      })

      const orderData = await orderResponse.json()
      
      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create payment order')
      }

      setOrder(orderData.order)
      await initiateRazorpayPayment(orderData.order, paymentData)
      
    } catch (error) {
      console.error('Payment order creation failed:', error)
      notifications.show({
        title: 'Payment Failed',
        message: error instanceof Error ? error.message : 'Failed to create payment order',
        color: 'red'
      })
      setPaymentStep('select')
    } finally {
      setLoading(false)
    }
  }

  const processDirectBizcoinPayment = async (paymentData: BizcoinPaymentData) => {
    try {
      setLoading(true)
      setPaymentStep('processing')

      const response = await fetch('/api/customer/packages/purchase-with-bizcoins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageId: pkg?.id,
          bizcoinAmount: paymentData.bizcoinAmount,
          customerId,
          customerEmail
        })
      })

      const result = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Payment Successful! 🎉',
          message: `Package purchased successfully using ${paymentData.bizcoinAmount} bizcoins!`,
          color: 'green',
          icon: <IconCheck />
        })
        
        onPaymentSuccess({
          type: 'bizcoin',
          bizcoinUsed: paymentData.bizcoinAmount,
          packageId: pkg?.id,
          subscriptionId: result.subscriptionId
        })
      } else {
        throw new Error(result.error || 'Payment processing failed')
      }
      
    } catch (error) {
      console.error('Bizcoin payment failed:', error)
      notifications.show({
        title: 'Payment Failed',
        message: error instanceof Error ? error.message : 'Payment processing failed',
        color: 'red'
      })
      setPaymentStep('select')
    } finally {
      setLoading(false)
    }
  }

  const initiateRazorpayPayment = async (orderData: PaymentOrder, paymentData: BizcoinPaymentData) => {
    if (!window.Razorpay) {
      throw new Error('Razorpay not loaded')
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'WhatsApp Management System',
      description: `${pkg?.name} Package${paymentData.useBizcoins ? ` (${paymentData.bizcoinAmount} bizcoins applied)` : ''}`,
      order_id: orderData.id,
      prefill: {
        email: customerEmail,
        contact: customerPhone
      },
      theme: {
        color: '#3b82f6'
      },
      handler: (response: any) => {
        handlePaymentSuccess(response, paymentData)
      },
      modal: {
        ondismiss: () => {
          setPaymentStep('select')
          setLoading(false)
        }
      }
    }

    const razorpayInstance = new window.Razorpay(options)
    razorpayInstance.open()
  }

  const handlePaymentSuccess = async (razorpayResponse: any, paymentData: BizcoinPaymentData) => {
    try {
      // Verify payment and process bizcoin deduction if applicable
      const verificationResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...razorpayResponse,
          packageId: pkg?.id,
          customerId,
          bizcoinPayment: paymentData
        })
      })

      const verificationData = await verificationResponse.json()

      if (verificationResponse.ok) {
        notifications.show({
          title: 'Payment Successful! 🎉',
          message: paymentData.useBizcoins 
            ? `Payment completed! Used ${paymentData.bizcoinAmount} bizcoins + ₹${paymentData.finalPayableAmount}`
            : 'Payment completed successfully!',
          color: 'green',
          icon: <IconCheck />
        })
        
        onPaymentSuccess({
          ...verificationData,
          bizcoinUsed: paymentData.bizcoinAmount
        })
      } else {
        throw new Error(verificationData.error || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Payment verification failed:', error)
      notifications.show({
        title: 'Payment Verification Failed',
        message: 'Please contact support if amount was deducted',
        color: 'red'
      })
    }
  }

  if (!pkg) return null

  const paymentData = calculatePaymentData()
  const packagePrice = getPackagePrice()
  const discount = pkg.offer_enabled && pkg.offer_price ? pkg.price - pkg.offer_price : 0
  const bizcoinSavingsPercentage = packagePrice > 0 ? (paymentData.savings / packagePrice) * 100 : 0

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" variant="gradient" gradient={{ from: 'blue', to: 'purple' }}>
            <IconCreditCard size={20} />
          </ThemeIcon>
          <Title order={3}>Complete Purchase</Title>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="lg">
        {/* Package Summary */}
        <Card withBorder p="md" radius="md">
          <Group justify="space-between" mb="md">
            <Box>
              <Text fw={700} size="lg">{pkg.name}</Text>
              <Text size="sm" c="dimmed">{pkg.duration} days subscription</Text>
            </Box>
            <Box ta="right">
              {discount > 0 && (
                <Text size="sm" td="line-through" c="dimmed">₹{pkg.price}</Text>
              )}
              <Text fw={700} size="xl" c="blue">₹{packagePrice}</Text>
              {discount > 0 && (
                <Badge color="green" size="sm" variant="light">
                  Save ₹{discount}
                </Badge>
              )}
            </Box>
          </Group>
        </Card>

        {/* Bizcoin Payment Section */}
        <Card withBorder p="md" radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="sm">
                <IconCoins size={20} color="#f59e0b" />
                <Text fw={600}>Use Bizcoins</Text>
              </Group>
              <Group gap="sm">
                <Text size="sm" c="dimmed">Available:</Text>
                <Badge variant="light" color="orange" size="lg">
                  {balanceLoading ? <Loader size="xs" /> : bizcoinBalance.toLocaleString()}
                </Badge>
              </Group>
            </Group>

            <Checkbox
              checked={useBizcoins}
              onChange={(event) => setUseBizcoins(event.currentTarget.checked)}
              label="Apply bizcoins to reduce payment amount"
              disabled={balanceLoading || bizcoinBalance === 0}
            />

            {useBizcoins && (
              <Box>
                <NumberInput
                  label="Bizcoins to use"
                  placeholder="Enter amount"
                  value={bizcoinAmount}
                  onChange={handleBizcoinAmountChange}
                  min={0}
                  max={Math.min(bizcoinBalance, packagePrice)}
                  leftSection={<IconCoins size={16} />}
                  rightSection={
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => setBizcoinAmount(Math.min(bizcoinBalance, packagePrice))}
                    >
                      Max
                    </Button>
                  }
                />
                
                {bizcoinAmount > 0 && (
                  <Box mt="sm">
                    <Text size="sm" c="dimmed" mb={4}>Bizcoin Usage</Text>
                    <Progress
                      value={bizcoinSavingsPercentage}
                      color="orange"
                      size="lg"
                      radius="md"
                      label={`${bizcoinSavingsPercentage.toFixed(1)}%`}
                    />
                    <Group justify="space-between" mt={4}>
                      <Text size="xs" c="dimmed">₹{paymentData.bizcoinAmount} discount</Text>
                      <Text size="xs" c="dimmed">₹{paymentData.finalPayableAmount} remaining</Text>
                    </Group>
                  </Box>
                )}
              </Box>
            )}
          </Stack>
        </Card>

        {/* Payment Summary */}
        <Paper p="md" withBorder radius="md" bg="gray.0">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text>Package Price</Text>
              <Text>₹{packagePrice}</Text>
            </Group>
            
            {paymentData.useBizcoins && paymentData.bizcoinAmount > 0 && (
              <Group justify="space-between" c="orange.7">
                <Text>Bizcoin Discount</Text>
                <Text>-₹{paymentData.bizcoinAmount}</Text>
              </Group>
            )}
            
            <Divider />
            
            <Group justify="space-between">
              <Text fw={700} size="lg">Final Amount</Text>
              <Text fw={700} size="lg" c={paymentData.finalPayableAmount === 0 ? "green" : "blue"}>
                ₹{paymentData.finalPayableAmount}
                {paymentData.finalPayableAmount === 0 && " (Fully paid!)"}
              </Text>
            </Group>

            {paymentData.savings > 0 && (
              <Alert
                icon={<IconCheck size={16} />}
                color="green"
                variant="light"
                title={`You're saving ₹${paymentData.savings} with bizcoins!`}
              >
                <Text size="sm">
                  {paymentData.finalPayableAmount === 0 
                    ? "This package is fully covered by your bizcoins!"
                    : `Pay only ₹${paymentData.finalPayableAmount} instead of ₹${packagePrice}`
                  }
                </Text>
              </Alert>
            )}
          </Stack>
        </Paper>

        {/* Action Buttons */}
        <Group justify="space-between" mt="lg">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          
          <Button
            onClick={createPaymentOrder}
            loading={loading}
            size="lg"
            leftSection={paymentData.finalPayableAmount === 0 ? <IconCoins size={18} /> : <IconCreditCard size={18} />}
            color={paymentData.finalPayableAmount === 0 ? "orange" : "blue"}
          >
            {paymentStep === 'processing' ? 'Processing...' : 
             paymentData.finalPayableAmount === 0 ? 'Complete with Bizcoins' : 
             `Pay ₹${paymentData.finalPayableAmount}`}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}