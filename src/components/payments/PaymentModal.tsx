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
  Card
} from '@mantine/core'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import * as Icons from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'

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

interface PaymentModalProps {
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

export default function PaymentModal({
  opened,
  onClose,
  package: pkg,
  customerId,
  customerEmail,
  customerPhone,
  onPaymentSuccess
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<PaymentOrder | null>(null)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

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

  const createPaymentOrder = async () => {
    if (!pkg) return

    console.log('Creating payment order for:', { 
      packageId: pkg.id, 
      customerId, 
      customerEmail, 
      razorpayLoaded 
    })

    if (!razorpayLoaded) {
      notifications.show({
        title: 'Payment Gateway Loading',
        message: 'Please wait for Razorpay to load completely',
        color: 'orange',
        icon: <Icons.FiClock />
      })
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageId: pkg.id,
          customerId: customerId,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          paymentMethodId: 'razorpay'
        })
      })

      const data = await response.json()
      console.log('Payment order API response:', { status: response.status, data })

      if (response.ok) {
        setOrder(data.order)
        
        // Initialize Razorpay payment
        const options = {
          key: data.razorpayKeyId,
          amount: data.order.amount,
          currency: data.order.currency,
          name: 'WhatsApp Business Manager',
          description: `${data.package.name} - ${data.package.duration} days`,
          order_id: data.order.id,
          handler: async (response: any) => {
            await verifyPayment(response)
          },
          prefill: {
            name: customerEmail.split('@')[0],
            email: customerEmail,
            contact: customerPhone
          },
          theme: {
            color: '#3b82f6'
          },
          modal: {
            ondismiss: () => {
              notifications.show({
                title: 'Payment Cancelled',
                message: 'Payment was cancelled by user',
                color: 'orange',
                icon: <Icons.FiX />
              })
            }
          }
        }

        // Check if we're in mock mode
        if (data.mockMode) {
          console.log('Mock mode: Simulating Razorpay payment')
          
          // Simulate payment success after 2 seconds
          setTimeout(async () => {
            const mockPaymentResponse = {
              razorpay_order_id: data.order.id,
              razorpay_payment_id: `pay_mock_${Date.now()}`,
              razorpay_signature: `mock_signature_${Date.now()}`
            }
            
            notifications.show({
              title: 'Demo Payment Success!',
              message: 'This is a simulated payment for demo purposes',
              color: 'green',
              icon: <Icons.FiCheck />
            })
            
            // Call success callback with mock data
            onPaymentSuccess({
              success: true,
              message: 'Demo payment completed',
              payment: {
                id: mockPaymentResponse.razorpay_payment_id,
                orderId: mockPaymentResponse.razorpay_order_id,
                amount: data.order.amount / 100,
                currency: data.order.currency,
                status: 'captured',
                method: 'demo',
                createdAt: new Date().toISOString()
              },
              subscription: {
                subscriptionId: `sub_demo_${Date.now()}`,
                activatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active'
              }
            })
            
            onClose()
          }, 2000)
          
        } else if (window.Razorpay) {
          console.log('Opening Razorpay checkout with options:', options)
          const razorpay = new window.Razorpay(options)
          razorpay.open()
        } else {
          console.error('Razorpay SDK not available on window object')
          throw new Error('Razorpay SDK not loaded')
        }
      } else {
        console.error('Payment order creation failed:', data)
        throw new Error(data.error || 'Failed to create payment order')
      }
    } catch (error) {
      console.error('Error creating payment order:', error)
      notifications.show({
        title: 'Payment Error',
        message: error instanceof Error ? error.message : 'Failed to initialize payment',
        color: 'red',
        icon: <Icons.FiX />
      })
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (paymentResponse: any) => {
    try {
      setLoading(true)

      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          customer_id: customerId,
          package_id: pkg?.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        notifications.show({
          title: 'Payment Successful!',
          message: 'Your subscription has been activated successfully',
          color: 'green',
          icon: <Icons.FiCheck />
        })

        onPaymentSuccess(data)
        onClose()
      } else {
        throw new Error(data.error || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      notifications.show({
        title: 'Payment Verification Failed',
        message: error instanceof Error ? error.message : 'Please contact support',
        color: 'red',
        icon: <Icons.FiX />
      })
    } finally {
      setLoading(false)
    }
  }

  if (!pkg) return null

  const finalAmount = pkg.offer_enabled && pkg.offer_price ? pkg.offer_price : pkg.price
  const discount = pkg.offer_enabled && pkg.offer_price ? pkg.price - pkg.offer_price : 0
  const discountPercentage = discount > 0 ? Math.round((discount / pkg.price) * 100) : 0

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Complete Your Purchase"
      size="md"
      centered
    >
      <Stack gap="md">
        {/* Package Summary */}
        <Card withBorder>
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={4}>{pkg.name}</Title>
                <Text size="sm" c="dimmed">{pkg.duration} days subscription</Text>
              </div>
              <Badge color="blue" variant="light">
                Premium Plan
              </Badge>
            </Group>

            <Divider />

            {/* Pricing Details */}
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Original Price</Text>
                <Group gap={4} align="center">
                  <FaRupeeSign size={12} />
                  <Text size="sm" td={discount > 0 ? "line-through" : undefined} 
                        c={discount > 0 ? "dimmed" : undefined}>
                    {pkg.price.toLocaleString()}
                  </Text>
                </Group>
              </Group>

              {discount > 0 && (
                <>
                  <Group justify="space-between">
                    <Text size="sm" c="green">Discount ({discountPercentage}% OFF)</Text>
                    <Group gap={4} align="center">
                      <Text size="sm" c="green">-</Text>
                      <FaRupeeSign size={12} color="green" />
                      <Text size="sm" c="green">{discount.toLocaleString()}</Text>
                    </Group>
                  </Group>

                  <Divider />

                  <Group justify="space-between">
                    <Text fw={600}>Final Amount</Text>
                    <Group gap={4} align="center">
                      <FaRupeeSign size={16} />
                      <Text fw={600} size="lg">{finalAmount.toLocaleString()}</Text>
                    </Group>
                  </Group>
                </>
              )}
            </Stack>
          </Stack>
        </Card>

        {/* Payment Method Info */}
        <Alert icon={<Icons.FiShield />} color="blue" variant="light">
          <Text size="sm">
            Secure payment powered by Razorpay. All transactions are encrypted and secure.
          </Text>
        </Alert>

        {/* Customer Info */}
        <Paper p="md" withBorder>
          <Text size="sm" fw={500} mb="xs">Billing Information</Text>
          <Stack gap={4}>
            <Text size="xs" c="dimmed">Email: {customerEmail}</Text>
            <Text size="xs" c="dimmed">Phone: {customerPhone}</Text>
            <Text size="xs" c="dimmed">Customer ID: {customerId}</Text>
          </Stack>
        </Paper>

        {/* Demo Mode Indicator */}
        <Alert icon={<Icons.FiInfo />} color="blue" variant="light">
          <Text size="sm">
            <strong>Demo Mode:</strong> This is a test payment that will simulate Razorpay payment flow without charging any money.
          </Text>
        </Alert>

        {/* Action Buttons */}
        <Group justify="space-between">
          <Button variant="light" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={createPaymentOrder}
            loading={loading}
            disabled={!razorpayLoaded}
            leftSection={loading ? <Loader size="xs" /> : <Icons.FiCreditCard />}
            size="md"
            color="blue"
          >
            {loading ? 'Processing Demo Payment...' : `Demo Pay ₹${finalAmount.toLocaleString()}`}
          </Button>
        </Group>

        {!razorpayLoaded && (
          <Alert icon={<Icons.FiAlertTriangle />} color="orange" variant="light">
            <Text size="sm">Loading payment gateway...</Text>
          </Alert>
        )}

        {/* Terms */}
        <Text size="xs" c="dimmed" ta="center">
          By proceeding with the payment, you agree to our Terms of Service and Privacy Policy.
          This subscription will auto-renew after {pkg.duration} days unless cancelled.
        </Text>
      </Stack>
    </Modal>
  )
}