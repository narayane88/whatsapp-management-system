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
  Box
} from '@mantine/core'
import { useState, useEffect, useRef } from 'react'
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

interface PaymentIframeProps {
  opened: boolean
  onClose: () => void
  package: Package | null
  customerId: string
  customerEmail: string
  customerPhone: string
  onPaymentSuccess: (paymentData: any) => void
  onPaymentFailure?: (errorData: any) => void
}

export default function PaymentIframe({
  opened,
  onClose,
  package: pkg,
  customerId,
  customerEmail,
  customerPhone,
  onPaymentSuccess,
  onPaymentFailure
}: PaymentIframeProps) {
  const [loading, setLoading] = useState(false)
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Generate unique session ID for tracking
  useEffect(() => {
    if (opened && !sessionId) {
      setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [opened, sessionId])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!opened) {
      setIframeUrl(null)
      setPaymentStatus('pending')
      setLoading(false)
      setSessionId(null)
    }
  }, [opened])

  // Listen for payment status updates via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Only accept messages from our payment iframe
      if (event.origin !== window.location.origin) return

      const { type, data } = event.data

      switch (type) {
        case 'PAYMENT_SUCCESS':
          setPaymentStatus('success')
          setLoading(false)
          notifications.show({
            title: 'Payment Successful!',
            message: 'Your subscription has been activated',
            color: 'green',
            icon: <Icons.FiCheck />
          })
          onPaymentSuccess(data)
          setTimeout(() => onClose(), 2000)
          break

        case 'PAYMENT_FAILURE':
          setPaymentStatus('failed')
          setLoading(false)
          notifications.show({
            title: 'Payment Failed',
            message: data.message || 'Payment could not be processed',
            color: 'red',
            icon: <Icons.FiX />
          })
          if (onPaymentFailure) onPaymentFailure(data)
          break

        case 'PAYMENT_PROCESSING':
          setPaymentStatus('processing')
          break

        case 'IFRAME_READY':
          setLoading(false)
          break

        default:
          console.log('Unknown message type:', type)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onPaymentSuccess, onPaymentFailure, onClose])

  const initializePayment = async () => {
    if (!pkg || !sessionId) {
      console.error('Missing required data for payment initialization:', { pkg, sessionId })
      return
    }

    console.log('Initializing iframe payment for:', { 
      packageId: pkg.id, 
      customerId, 
      customerEmail,
      customerPhone,
      sessionId 
    })

    try {
      setLoading(true)
      
      const response = await fetch('/api/payments/create-iframe-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageId: pkg.id,
          customerId: customerId,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          paymentMethodId: 'razorpay',
          sessionId: sessionId,
          returnUrl: `${window.location.origin}/payment/callback`,
          cancelUrl: `${window.location.origin}/payment/cancel`
        })
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError)
        throw new Error('Invalid response from payment service')
      }
      
      console.log('Iframe session API response:', { status: response.status, data })

      if (response.ok) {
        if (data.mockMode) {
          // Handle mock mode with simulated iframe
          setIframeUrl(`/payment/mock-iframe?session=${sessionId}&package=${pkg.id}`)
        } else {
          // Use real Razorpay iframe URL
          setIframeUrl(data.iframeUrl)
        }
        setPaymentStatus('pending')
      } else {
        console.error('Iframe session creation failed:', data)
        const errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}` || 'Failed to create payment session'
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error creating iframe payment session:', error)
      setLoading(false)
      notifications.show({
        title: 'Payment Error',
        message: error instanceof Error ? error.message : 'Failed to initialize payment',
        color: 'red',
        icon: <Icons.FiX />
      })
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
      title="Secure Payment"
      size="lg"
      centered
      closeOnClickOutside={paymentStatus === 'pending'}
      closeOnEscape={paymentStatus === 'pending'}
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

        {/* Payment Status */}
        {paymentStatus !== 'pending' && (
          <Alert 
            icon={
              paymentStatus === 'success' ? <Icons.FiCheck /> :
              paymentStatus === 'failed' ? <Icons.FiX /> :
              <Loader size="sm" />
            } 
            color={
              paymentStatus === 'success' ? 'green' :
              paymentStatus === 'failed' ? 'red' : 'blue'
            }
          >
            <Text size="sm">
              {paymentStatus === 'success' && 'Payment completed successfully!'}
              {paymentStatus === 'failed' && 'Payment failed. Please try again.'}
              {paymentStatus === 'processing' && 'Processing your payment...'}
            </Text>
          </Alert>
        )}

        {/* Payment Iframe */}
        {!iframeUrl ? (
          <Card withBorder p="lg" style={{ minHeight: '400px' }}>
            <Stack align="center" justify="center" h="100%">
              <Text size="lg" fw={500}>Ready to Pay</Text>
              <Text size="sm" c="dimmed" ta="center">
                Click the button below to open the secure payment window
              </Text>
              
              <Group justify="center" mt="md">
                <Button
                  onClick={initializePayment}
                  loading={loading}
                  disabled={!sessionId}
                  leftSection={loading ? <Loader size="xs" /> : <Icons.FiCreditCard />}
                  size="lg"
                  color="blue"
                >
                  {loading ? 'Opening Payment Gateway...' : `Pay ₹${finalAmount.toLocaleString()}`}
                </Button>
              </Group>
            </Stack>
          </Card>
        ) : (
          <Box style={{ position: 'relative', minHeight: '500px' }}>
            {loading && (
              <Box 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  background: 'rgba(255,255,255,0.8)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                <Stack align="center">
                  <Loader size="lg" />
                  <Text size="sm">Loading secure payment form...</Text>
                </Stack>
              </Box>
            )}
            
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              width="100%"
              height="500px"
              style={{ 
                border: '1px solid #e9ecef', 
                borderRadius: '8px',
                background: '#fff'
              }}
              title="Secure Payment Form"
              sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation"
              loading="lazy"
              onLoad={() => {
                setLoading(false)
                console.log('Payment iframe loaded successfully')
              }}
              onError={(e) => {
                console.error('Iframe loading error:', e)
                setLoading(false)
                notifications.show({
                  title: 'Loading Error',
                  message: 'Failed to load payment form. Please try again.',
                  color: 'red'
                })
              }}
            />
          </Box>
        )}

        {/* Security Notice */}
        <Alert icon={<Icons.FiShield />} color="blue" variant="light">
          <Text size="sm">
            🔒 This is a secure payment window. Your card details are encrypted and never stored on our servers.
          </Text>
        </Alert>

        {/* Cancel Button */}
        {paymentStatus === 'pending' && (
          <Group justify="center">
            <Button variant="light" onClick={onClose} disabled={loading}>
              Cancel Payment
            </Button>
          </Group>
        )}

        {/* Debug Info */}
        {sessionId && (
          <Text size="xs" c="dimmed" ta="center">
            Session: {sessionId}
          </Text>
        )}
      </Stack>
    </Modal>
  )
}