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
import BizCoinIcon from '@/components/icons/BizCoinIcon'

interface BizCoinsPaymentIframeProps {
  opened: boolean
  onClose: () => void
  amount: number
  commissionRate: number
  description?: string
  onPaymentSuccess: (paymentData: any) => void
  onPaymentFailure?: (errorData: any) => void
}

export default function BizCoinsPaymentIframe({
  opened,
  onClose,
  amount,
  commissionRate,
  description,
  onPaymentSuccess,
  onPaymentFailure
}: BizCoinsPaymentIframeProps) {
  const [loading, setLoading] = useState(false)
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Calculate totals
  const commissionBonus = amount * (commissionRate / 100)
  const totalCoins = amount + commissionBonus

  // Generate session ID
  useEffect(() => {
    if (opened && !sessionId) {
      const newSessionId = `bizcoins_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      setSessionId(newSessionId)
    }
  }, [opened, sessionId])

  // Create iframe session when modal opens
  useEffect(() => {
    if (opened && sessionId && amount > 0 && !iframeUrl && !loading) {
      createIframeSession()
    }
  }, [opened, sessionId, amount, iframeUrl, loading])

  // Listen for iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return // Only accept messages from same origin
      }

      const { type, data } = event.data

      switch (type) {
        case 'BIZCOINS_IFRAME_READY':
          console.log('🪙 BizCoins iframe ready:', data)
          break

        case 'BIZCOINS_PAYMENT_SUCCESS':
          console.log('🎉 BizCoins payment successful:', data)
          setPaymentData(data)
          
          notifications.show({
            title: 'BizCoins Purchase Successful!',
            message: `Successfully purchased ${data.purchase?.totalCoins || totalCoins} BizCoins`,
            color: 'green',
            icon: <BizCoinIcon size={20} />
          })
          
          onPaymentSuccess(data)
          onClose()
          break

        case 'BIZCOINS_PAYMENT_FAILURE':
          console.error('❌ BizCoins payment failed:', data)
          setError(data.message || 'Payment failed')
          
          if (data.error !== 'PAYMENT_CANCELLED') {
            notifications.show({
              title: 'BizCoins Payment Failed',
              message: data.message || 'Payment could not be completed',
              color: 'red'
            })
          }
          
          if (onPaymentFailure) {
            onPaymentFailure(data)
          }
          break

        default:
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [totalCoins, onPaymentSuccess, onPaymentFailure, onClose])

  const createIframeSession = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🪙 Creating BizCoins iframe session:', {
        amount,
        commissionRate,
        commissionBonus,
        totalCoins,
        sessionId
      })

      const response = await fetch('/api/admin/bizpoints/purchase/create-iframe-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          description: description || `Purchase ${totalCoins} BizCoins`,
          sessionId,
          returnUrl: `${window.location.origin}/admin/bizpoints?purchase=success`,
          cancelUrl: `${window.location.origin}/admin/bizpoints?purchase=cancelled`
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment session')
      }

      const sessionData = await response.json()
      
      console.log('✅ BizCoins iframe session created:', sessionData)
      setIframeUrl(sessionData.iframeUrl)

    } catch (err) {
      console.error('Error creating BizCoins iframe session:', err)
      setError(err instanceof Error ? err.message : 'Failed to create payment session')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setIframeUrl(null)
    setSessionId(null)
    setError(null)
    setPaymentData(null)
    setLoading(false)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="md">
          <BizCoinIcon size={24} color="#059669" />
          <Title order={4}>Purchase BizCoins</Title>
        </Group>
      }
      size="lg"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Stack gap="md">
        {/* Purchase Summary */}
        <Paper withBorder p="md" bg="gray.0">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Base Amount:</Text>
              <Text size="sm" fw={500}>₹{amount.toLocaleString()}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Commission Rate:</Text>
              <Text size="sm" fw={500}>{commissionRate}%</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Commission Bonus:</Text>
              <Text size="sm" fw={500} c="green.6">+{commissionBonus.toFixed(2)} BizCoins</Text>
            </Group>
            <Divider />
            <Group justify="space-between">
              <Text fw={600} c="green.7">Total BizCoins:</Text>
              <Badge size="lg" color="green" variant="light">
                <Group gap={4}>
                  <BizCoinIcon size={16} />
                  <Text>{totalCoins.toFixed(2)}</Text>
                </Group>
              </Badge>
            </Group>
          </Stack>
        </Paper>

        {/* Loading State */}
        {loading && (
          <Card withBorder p="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" color="green" />
              <Text>Creating secure payment session...</Text>
              <Text size="sm" c="dimmed">Please wait while we prepare your BizCoins purchase</Text>
            </Stack>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert icon={<Icons.FiAlertTriangle />} color="red" title="Payment Error">
            <Stack gap="sm">
              <Text size="sm">{error}</Text>
              <Button 
                variant="light" 
                size="sm"
                onClick={createIframeSession}
                loading={loading}
              >
                Retry Payment
              </Button>
            </Stack>
          </Alert>
        )}

        {/* Payment Iframe */}
        {iframeUrl && !loading && !error && (
          <Box>
            <Text size="sm" c="dimmed" mb="sm">
              🔒 Secure payment powered by Razorpay
            </Text>
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              style={{
                width: '100%',
                height: '500px',
                border: '1px solid #e9ecef',
                borderRadius: '8px'
              }}
              title="BizCoins Payment"
            />
          </Box>
        )}

        {/* Action Buttons */}
        <Group justify="flex-end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}