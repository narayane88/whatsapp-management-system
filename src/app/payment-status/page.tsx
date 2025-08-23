'use client'

import { useState, useEffect } from 'react'
import { Container, Title, Card, Text, Badge, Stack, Button, Group, Alert } from '@mantine/core'
import * as Icons from 'react-icons/fi'

interface ApiKeyStatus {
  service: string
  hasCredentials: boolean
  isPlaceholder: boolean
  keyId: string
  mockMode: boolean
}

export default function PaymentStatusPage() {
  const [status, setStatus] = useState<ApiKeyStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkApiKeyStatus()
  }, [])

  const checkApiKeyStatus = async () => {
    try {
      // Read the CSV file content to check status
      const response = await fetch('/api-key.csv')
      const csvText = await response.text()
      
      const lines = csvText.trim().split('\n')
      if (lines.length > 1) {
        const values = lines[1].split(',')
        const keyId = values[1]?.trim()
        const keySecret = values[2]?.trim()
        
        const isPlaceholder = keyId?.includes('your_key_id_here') || 
                             keyId?.includes('rzp_test_your_key_id_here') ||
                             !keyId ||
                             keyId === 'demo_key_id'
        
        setStatus({
          service: 'Razorpay',
          hasCredentials: !!keyId,
          isPlaceholder,
          keyId: keyId || 'Not found',
          mockMode: isPlaceholder
        })
      }
    } catch (error) {
      console.error('Error checking API key status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Text>Loading payment status...</Text>
      </Container>
    )
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>Payment Integration Status</Title>
        
        <Card withBorder p="lg">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Text size="lg" fw={500}>Razorpay Configuration</Text>
              <Badge 
                color={status?.mockMode ? 'orange' : 'green'} 
                variant="filled"
              >
                {status?.mockMode ? 'Mock Mode' : 'Live Mode'}
              </Badge>
            </Group>
            
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Key ID:</Text>
                <Text size="sm" ff="monospace" c={status?.isPlaceholder ? 'orange' : 'blue'}>
                  {status?.keyId?.substring(0, 20)}{status?.keyId && status.keyId.length > 20 ? '...' : ''}
                </Text>
              </Group>
              
              <Group justify="space-between">
                <Text size="sm">Status:</Text>
                <Text size="sm" c={status?.isPlaceholder ? 'orange' : 'green'}>
                  {status?.isPlaceholder ? 'Placeholder Credentials' : 'Real Credentials'}
                </Text>
              </Group>
              
              <Group justify="space-between">
                <Text size="sm">Mode:</Text>
                <Text size="sm">
                  {status?.mockMode ? 'Demo/Mock payments' : 'Real Razorpay API'}
                </Text>
              </Group>
            </Stack>
          </Stack>
        </Card>

        {status?.mockMode && (
          <Alert icon={<Icons.FiInfo />} color="orange" variant="light">
            <Stack gap="sm">
              <Text size="sm" fw={500}>Mock Mode Active</Text>
              <Text size="sm">
                The system detected placeholder credentials in api-key.csv. 
                Payment functionality will work in demo mode without charging real money.
              </Text>
              <Text size="sm">
                To enable real Razorpay integration, update the api-key.csv file with your actual test credentials.
              </Text>
            </Stack>
          </Alert>
        )}

        {!status?.mockMode && (
          <Alert icon={<Icons.FiCheck />} color="green" variant="light">
            <Stack gap="sm">
              <Text size="sm" fw={500}>Real Credentials Detected</Text>
              <Text size="sm">
                The system is using real Razorpay API credentials from api-key.csv.
                Payment integration is active and will process real test payments.
              </Text>
            </Stack>
          </Alert>
        )}

        <Card withBorder p="lg" bg="gray.0">
          <Stack gap="sm">
            <Text size="lg" fw={500}>Quick Setup Guide</Text>
            <Text size="sm">
              1. Get your Razorpay test credentials from https://razorpay.com
            </Text>
            <Text size="sm">
              2. Update the api-key.csv file with your actual Key ID and Secret
            </Text>
            <Text size="sm">
              3. Restart the development server
            </Text>
            <Text size="sm">
              4. The system will automatically switch to live mode
            </Text>
          </Stack>
        </Card>

        <Group justify="center">
          <Button 
            variant="outline" 
            onClick={checkApiKeyStatus}
            leftSection={<Icons.FiRefreshCw />}
          >
            Refresh Status
          </Button>
          
          <Button 
            component="a" 
            href="/test-payment"
            leftSection={<Icons.FiCreditCard />}
          >
            Test Payment Flow
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}