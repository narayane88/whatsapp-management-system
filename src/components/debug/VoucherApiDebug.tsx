'use client'

import { Button, Card, Text, Stack, Code, Group, Badge } from '@mantine/core'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { notifications } from '@mantine/notifications'

export default function VoucherApiDebug() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [apiResult, setApiResult] = useState<any>(null)

  const testApiConnection = async () => {
    try {
      setLoading(true)
      console.log('Testing API connection...')
      
      const response = await fetch('/api/vouchers')
      const data = await response.json()
      
      console.log('API Response:', { status: response.status, data })
      
      setApiResult({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data: data,
        dataType: typeof data,
        vouchersLength: data.vouchers?.length || 0,
        hasStats: !!data.stats
      })

      if (response.ok) {
        notifications.show({
          title: 'API Test Success',
          message: `Loaded ${data.vouchers?.length || 0} vouchers`,
          color: 'green'
        })
      } else {
        notifications.show({
          title: 'API Test Failed',
          message: data.error || 'Unknown error',
          color: 'red'
        })
      }
    } catch (error) {
      console.error('API Test Error:', error)
      setApiResult({
        error: error.message,
        stack: error.stack
      })
      notifications.show({
        title: 'API Test Error',
        message: error.message,
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const testDebugApiConnection = async () => {
    try {
      setLoading(true)
      console.log('Testing DEBUG API connection (no auth)...')
      
      const response = await fetch('/api/vouchers-debug')
      const data = await response.json()
      
      console.log('Debug API Response:', { status: response.status, data })
      
      setApiResult({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data: data,
        dataType: typeof data,
        vouchersLength: data.vouchers?.length || 0,
        hasStats: !!data.stats,
        isDebugEndpoint: true
      })

      if (response.ok) {
        notifications.show({
          title: 'Debug API Test Success',
          message: `Loaded ${data.vouchers?.length || 0} vouchers from debug endpoint`,
          color: 'green'
        })
      } else {
        notifications.show({
          title: 'Debug API Test Failed',
          message: data.error || 'Unknown error',
          color: 'red'
        })
      }
    } catch (error) {
      console.error('Debug API Test Error:', error)
      setApiResult({
        error: error.message,
        stack: error.stack,
        isDebugEndpoint: true
      })
      notifications.show({
        title: 'Debug API Test Error',
        message: error.message,
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const testCreateVoucher = async () => {
    try {
      setLoading(true)
      
      const testVoucher = {
        code: `DEBUG_${Date.now()}`,
        description: 'Debug test voucher',
        type: 'credit',
        value: 10,
        usage_limit: 5,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
      
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testVoucher)
      })
      
      const data = await response.json()
      
      console.log('Create API Response:', { status: response.status, data })
      
      if (response.ok) {
        notifications.show({
          title: 'Create Test Success',
          message: `Created voucher: ${data.voucher?.code}`,
          color: 'green'
        })
      } else {
        notifications.show({
          title: 'Create Test Failed',
          message: data.error || 'Unknown error',
          color: 'red'
        })
      }
    } catch (error) {
      console.error('Create Test Error:', error)
      notifications.show({
        title: 'Create Test Error',
        message: error.message,
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ marginBottom: '1rem' }}>
      <Stack gap="md">
        <Text fw={600} c="orange">🐛 API Debug Tools (Remove in production)</Text>
        
        <Group>
          <Button
            variant="outline"
            onClick={testApiConnection}
            loading={loading}
          >
            Test GET /api/vouchers (Auth Required)
          </Button>
          
          <Button
            variant="outline"
            color="blue"
            onClick={testDebugApiConnection}
            loading={loading}
          >
            Test DEBUG /api/vouchers-debug (No Auth)
          </Button>
          
          <Button
            variant="outline"
            color="green"
            onClick={testCreateVoucher}
            loading={loading}
          >
            Test Create Voucher
          </Button>
        </Group>

        {session && (
          <Stack gap="xs">
            <Text size="sm" fw={500}>Session Info:</Text>
            <Code block>
              User: {session.user?.email}
              Name: {session.user?.name}
              ID: {session.user?.id}
            </Code>
          </Stack>
        )}

        {apiResult && (
          <Stack gap="xs">
            <Text size="sm" fw={500}>Last API Result:</Text>
            <Code block style={{ maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(apiResult, null, 2)}
            </Code>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}