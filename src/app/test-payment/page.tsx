'use client'

import { useState } from 'react'
import { Container, Title, Button, Stack, Text, Card } from '@mantine/core'
import { useSession } from 'next-auth/react'
import { useDisclosure } from '@mantine/hooks'
import PaymentModal from '@/components/payments/PaymentModal'
import PaymentIframe from '@/components/payments/PaymentIframe'

// Test package data
const testPackage = {
  id: 'starter',
  name: 'Starter Plan',
  price: 999,
  offer_price: 799,
  offer_enabled: true,
  duration: 30,
  currency: 'INR'
}

export default function TestPaymentPage() {
  const { data: session } = useSession()
  const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false)
  const [paymentIframeOpened, { open: openPaymentIframe, close: closePaymentIframe }] = useDisclosure(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Payment successful:', paymentData)
    setPaymentResult(paymentData)
    closePaymentModal()
    closePaymentIframe()
  }

  const testPaymentOrder = async () => {
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: 'starter',
          customerId: session?.user?.id || 'test-user',
          customerEmail: session?.user?.email || 'test@example.com',
          customerPhone: '+1234567890',
          paymentMethodId: 'razorpay'
        })
      })
      
      const data = await response.json()
      console.log('Test API Response:', { status: response.status, data })
    } catch (error) {
      console.error('Test API Error:', error)
    }
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>Payment Integration Test</Title>
        
        <Card withBorder p="lg">
          <Stack gap="md">
            <Text size="lg" fw={500}>Debug Information</Text>
            <Text size="sm">Session: {session ? '✅ Logged in' : '❌ Not logged in'}</Text>
            <Text size="sm">User ID: {session?.user?.id || 'Not available'}</Text>
            <Text size="sm">User Email: {session?.user?.email || 'Not available'}</Text>
          </Stack>
        </Card>

        <Card withBorder p="lg">
          <Stack gap="md">
            <Text size="lg" fw={500}>Test Package: {testPackage.name}</Text>
            <Text size="sm">Price: ₹{testPackage.price} → ₹{testPackage.offer_price} (Offer)</Text>
            <Text size="sm">Duration: {testPackage.duration} days</Text>
          </Stack>
        </Card>

        <Stack gap="sm">
          <Button onClick={testPaymentOrder} variant="outline">
            1. Test Payment Order API
          </Button>
          
          <Button 
            onClick={openPaymentModal}
            disabled={!session}
            color="blue"
            variant="filled"
          >
            2. Open Payment Modal (Traditional)
          </Button>
          
          <Button 
            onClick={openPaymentIframe}
            disabled={!session}
            color="green"
            variant="filled"
          >
            3. Open Payment Iframe (New Method)
          </Button>
          
          {!session && (
            <Text size="sm" c="orange">
              Please log in first to test payment methods
            </Text>
          )}
        </Stack>

        {paymentResult && (
          <Card withBorder p="lg" bg="green.0">
            <Text size="lg" fw={500} c="green.7">Payment Result:</Text>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(paymentResult, null, 2)}
            </pre>
          </Card>
        )}

        <PaymentModal
          opened={paymentModalOpened}
          onClose={closePaymentModal}
          package={testPackage}
          customerId={session?.user?.id || 'test-user'}
          customerEmail={session?.user?.email || 'test@example.com'}
          customerPhone="+1234567890"
          onPaymentSuccess={handlePaymentSuccess}
        />
        
        <PaymentIframe
          opened={paymentIframeOpened}
          onClose={closePaymentIframe}
          package={testPackage}
          customerId={session?.user?.id || 'test-user'}
          customerEmail={session?.user?.email || 'test@example.com'}
          customerPhone="+1234567890"
          onPaymentSuccess={handlePaymentSuccess}
        />
      </Stack>
    </Container>
  )
}