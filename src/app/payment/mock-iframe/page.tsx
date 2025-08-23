'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Stack, Text, Button, Group, Badge, Loader, Alert } from '@mantine/core'
import { useSearchParams } from 'next/navigation'
import * as Icons from 'react-icons/fi'
import { FaRupeeSign } from 'react-icons/fa'

export default function MockIframePage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const packageId = searchParams.get('package')
  const amount = searchParams.get('amount')
  
  const [status, setStatus] = useState<'loading' | 'ready' | 'processing' | 'success' | 'failed'>('loading')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setStatus('ready')
      // Notify parent that iframe is ready
      window.parent.postMessage({
        type: 'IFRAME_READY',
        data: { sessionId }
      }, '*')
    }, 1000)

    return () => clearTimeout(timer)
  }, [sessionId])

  const simulatePayment = () => {
    setStatus('processing')
    
    // Notify parent that payment is processing
    window.parent.postMessage({
      type: 'PAYMENT_PROCESSING',
      data: { sessionId }
    }, '*')

    // Simulate payment processing with countdown
    let count = 3
    const countdownTimer = setInterval(() => {
      setCountdown(count)
      count--
      
      if (count < 0) {
        clearInterval(countdownTimer)
        completePayment()
      }
    }, 1000)
  }

  const completePayment = () => {
    setStatus('success')
    
    // Simulate successful payment
    const mockPaymentData = {
      success: true,
      message: 'Demo payment completed successfully',
      payment: {
        id: `pay_demo_${Date.now()}`,
        orderId: `order_demo_${sessionId}`,
        amount: parseFloat(amount || '0'),
        currency: 'INR',
        status: 'captured',
        method: 'demo_card',
        createdAt: new Date().toISOString(),
        sessionId
      },
      subscription: {
        subscriptionId: `sub_demo_${Date.now()}`,
        packageId,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
    }

    // Notify parent window of successful payment
    window.parent.postMessage({
      type: 'PAYMENT_SUCCESS',
      data: mockPaymentData
    }, '*')
  }

  const simulateFailure = () => {
    setStatus('failed')
    
    // Notify parent of payment failure
    window.parent.postMessage({
      type: 'PAYMENT_FAILURE',
      data: {
        error: 'DEMO_FAILURE',
        message: 'Demo payment failure simulation',
        sessionId
      }
    }, '*')
  }

  if (status === 'loading') {
    return (
      <Container size="sm" py="xl">
        <Card withBorder p="xl">
          <Stack align="center" gap="lg">
            <Loader size="xl" />
            <Text size="lg">Loading secure payment form...</Text>
            <Text size="sm" c="dimmed">Please wait while we prepare your payment</Text>
          </Stack>
        </Card>
      </Container>
    )
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Card withBorder p="lg">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Text size="lg" fw={600}>Demo Payment Gateway</Text>
              <Badge color="orange" variant="filled">DEMO MODE</Badge>
            </Group>
            
            <Alert icon={<Icons.FiInfo />} color="blue" variant="light">
              This is a demo payment interface for testing purposes only. No real money will be charged.
            </Alert>
            
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm">Package:</Text>
                <Text size="sm" fw={500}>{packageId || 'Unknown Package'}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text size="sm">Amount:</Text>
                <Group gap={4} align="center">
                  <FaRupeeSign size={14} />
                  <Text size="sm" fw={600}>{amount ? parseFloat(amount).toLocaleString() : '0'}</Text>
                </Group>
              </Group>
              
              <Group justify="space-between">
                <Text size="sm">Session:</Text>
                <Text size="xs" ff="monospace" c="dimmed">{sessionId?.substring(0, 20)}...</Text>
              </Group>
            </Stack>
          </Stack>
        </Card>

        {status === 'ready' && (
          <Card withBorder p="lg">
            <Stack gap="md">
              <Text size="lg" fw={500} ta="center">Select Payment Method</Text>
              
              <Stack gap="sm">
                <Button 
                  size="lg" 
                  color="green"
                  leftSection={<Icons.FiCreditCard />}
                  onClick={simulatePayment}
                  fullWidth
                >
                  Demo Credit Card Payment
                </Button>
                
                <Button 
                  size="lg" 
                  color="blue" 
                  variant="light"
                  leftSection={<Icons.FiSmartphone />}
                  onClick={simulatePayment}
                  fullWidth
                >
                  Demo UPI Payment
                </Button>
                
                <Button 
                  size="md" 
                  color="red" 
                  variant="outline"
                  leftSection={<Icons.FiX />}
                  onClick={simulateFailure}
                  fullWidth
                >
                  Simulate Payment Failure
                </Button>
              </Stack>
            </Stack>
          </Card>
        )}

        {status === 'processing' && (
          <Card withBorder p="lg">
            <Stack align="center" gap="md">
              <Loader size="xl" color="green" />
              <Text size="lg" fw={500}>Processing Payment...</Text>
              <Text size="xl" fw={700} c="green">{countdown}</Text>
              <Text size="sm" c="dimmed">Demo payment completing in {countdown} seconds</Text>
            </Stack>
          </Card>
        )}

        {status === 'success' && (
          <Card withBorder p="lg" bg="green.0">
            <Stack align="center" gap="md">
              <Icons.FiCheckCircle size={64} color="green" />
              <Text size="xl" fw={600} c="green">Payment Successful!</Text>
              <Text size="sm" c="dimmed" ta="center">
                This was a demo payment. Your subscription has been activated in test mode.
              </Text>
            </Stack>
          </Card>
        )}

        {status === 'failed' && (
          <Card withBorder p="lg" bg="red.0">
            <Stack align="center" gap="md">
              <Icons.FiXCircle size={64} color="red" />
              <Text size="xl" fw={600} c="red">Payment Failed</Text>
              <Text size="sm" c="dimmed" ta="center">
                This was a demo payment failure simulation.
              </Text>
              <Button variant="light" onClick={() => setStatus('ready')}>
                Try Again
              </Button>
            </Stack>
          </Card>
        )}

        <Text size="xs" c="dimmed" ta="center">
          🔒 This is a secure demo environment. All transactions are simulated for testing purposes.
        </Text>
      </Stack>
    </Container>
  )
}