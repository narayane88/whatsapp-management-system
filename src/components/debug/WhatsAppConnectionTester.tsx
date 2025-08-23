'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Stack,
  Group,
  Button,
  Text,
  Badge,
  Alert,
  Progress,
  ActionIcon,
  Collapse,
  Code
} from '@mantine/core'
import {
  IconServer,
  IconBrandWhatsapp,
  IconCheck,
  IconX,
  IconRefresh,
  IconChevronDown,
  IconChevronRight,
  IconQrcode
} from '@tabler/icons-react'

interface ConnectionTestResult {
  step: string
  success: boolean
  data?: any
  error?: string
  duration: number
}

interface WhatsAppConnectionTesterProps {
  serverUrl?: string
  showInProduction?: boolean
  compact?: boolean
}

export default function WhatsAppConnectionTester({ 
  serverUrl = 'http://localhost:3005', 
  showInProduction = false,
  compact = false 
}: WhatsAppConnectionTesterProps) {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<ConnectionTestResult[]>([])
  const [expanded, setExpanded] = useState(!compact)
  const [serverHealth, setServerHealth] = useState<'unknown' | 'healthy' | 'unhealthy'>('unknown')

  // Don't show in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null
  }

  useEffect(() => {
    // Quick health check on mount
    quickHealthCheck()
  }, [serverUrl])

  const quickHealthCheck = async () => {
    try {
      const response = await fetch(`/api/debug/whatsapp?action=health`)
      const result = await response.json()
      setServerHealth(result.success ? 'healthy' : 'unhealthy')
    } catch {
      setServerHealth('unhealthy')
    }
  }

  const runConnectionTest = async () => {
    setTesting(true)
    setResults([])
    const testResults: ConnectionTestResult[] = []

    // Test 1: Health Check
    const healthStart = Date.now()
    try {
      const response = await fetch(`/api/debug/whatsapp?action=health`)
      const result = await response.json()
      testResults.push({
        step: 'Health Check',
        success: result.success,
        data: result.data,
        error: result.error,
        duration: Date.now() - healthStart
      })
    } catch (error) {
      testResults.push({
        step: 'Health Check',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - healthStart
      })
    }

    setResults([...testResults])

    // Test 2: Server Stats
    const statsStart = Date.now()
    try {
      const response = await fetch(`/api/debug/whatsapp?action=stats`)
      const result = await response.json()
      testResults.push({
        step: 'Server Statistics',
        success: result.success,
        data: result.data,
        error: result.error,
        duration: Date.now() - statsStart
      })
    } catch (error) {
      testResults.push({
        step: 'Server Statistics',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - statsStart
      })
    }

    setResults([...testResults])

    // Test 3: Account Creation
    const testAccountId = `connection_test_${Date.now()}`
    const createStart = Date.now()
    try {
      const response = await fetch(`/api/debug/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          accountId: testAccountId
        })
      })
      const result = await response.json()
      testResults.push({
        step: 'Account Creation',
        success: result.success,
        data: result.data,
        error: result.error,
        duration: Date.now() - createStart
      })

      setResults([...testResults])

      // Test 4: QR Code Generation (if account created successfully)
      if (result.success) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for QR generation

        const qrStart = Date.now()
        try {
          const qrResponse = await fetch(`/api/debug/whatsapp?action=qr&accountId=${testAccountId}`)
          const qrResult = await qrResponse.json()
          
          // Check for QR code in different formats
          const hasQR = qrResult.success && (qrResult.qrCode || qrResult.hasQR || qrResult.data?.data?.qr || qrResult.data?.data?.qrCode)
          
          testResults.push({
            step: 'QR Code Generation',
            success: qrResult.success && hasQR,
            data: hasQR ? { hasQR: true, qrLength: qrResult.qrCode?.length } : qrResult.data,
            error: !hasQR && qrResult.success ? 'QR code not generated yet' : qrResult.error,
            duration: Date.now() - qrStart
          })
        } catch (error) {
          testResults.push({
            step: 'QR Code Generation',
            success: false,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - qrStart
          })
        }

        setResults([...testResults])

        // Test 5: Account Status
        const statusStart = Date.now()
        try {
          const statusResponse = await fetch(`/api/debug/whatsapp?action=status&accountId=${testAccountId}`)
          const statusResult = await statusResponse.json()
          testResults.push({
            step: 'Account Status',
            success: statusResult.success,
            data: statusResult.data,
            error: statusResult.error,
            duration: Date.now() - statusStart
          })
        } catch (error) {
          testResults.push({
            step: 'Account Status',
            success: false,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - statusStart
          })
        }

        setResults([...testResults])

        // Test 6: Cleanup
        const disconnectStart = Date.now()
        try {
          const disconnectResponse = await fetch(`/api/debug/whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'disconnect',
              accountId: testAccountId
            })
          })
          const disconnectResult = await disconnectResponse.json()
          testResults.push({
            step: 'Account Cleanup',
            success: disconnectResult.success || disconnectResult.status === 404, // 404 is acceptable
            data: disconnectResult.data,
            error: disconnectResult.error,
            duration: Date.now() - disconnectStart
          })
        } catch (error) {
          testResults.push({
            step: 'Account Cleanup',
            success: false,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - disconnectStart
          })
        }
      }
    } catch (error) {
      testResults.push({
        step: 'Account Creation',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - createStart
      })
    }

    setResults(testResults)
    setTesting(false)
    
    // Update server health based on test results
    const healthTestPassed = testResults.find(r => r.step === 'Health Check')?.success
    setServerHealth(healthTestPassed ? 'healthy' : 'unhealthy')
  }

  const getOverallStatus = () => {
    if (results.length === 0) return 'unknown'
    const passedTests = results.filter(r => r.success).length
    const totalTests = results.length
    
    if (passedTests === totalTests) return 'all-passed'
    if (passedTests === 0) return 'all-failed'
    return 'partial'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'all-passed': return 'green'
      case 'unhealthy':
      case 'all-failed': return 'red'
      case 'partial': return 'yellow'
      default: return 'gray'
    }
  }

  const overallStatus = getOverallStatus()
  const passedTests = results.filter(r => r.success).length
  const totalTests = results.length

  return (
    <Card withBorder padding={compact ? 'sm' : 'md'} style={{ opacity: compact ? 0.9 : 1 }}>
      <Group justify="space-between" mb={compact ? 'xs' : 'sm'}>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <IconChevronDown size="1rem" /> : <IconChevronRight size="1rem" />}
          </ActionIcon>
          <Text size={compact ? 'sm' : 'md'} fw={500}>
            WhatsApp Connection Test
          </Text>
          <Badge 
            color={getStatusColor(serverHealth)} 
            size="sm"
            variant="dot"
          >
            {serverHealth.toUpperCase()}
          </Badge>
        </Group>
        
        <Group gap="xs">
          {results.length > 0 && (
            <Text size="xs" c="dimmed">
              {passedTests}/{totalTests} passed
            </Text>
          )}
          <Button
            size={compact ? 'xs' : 'sm'}
            variant="light"
            leftSection={<IconRefresh size="1rem" />}
            onClick={runConnectionTest}
            loading={testing}
          >
            Test
          </Button>
        </Group>
      </Group>

      <Collapse in={expanded}>
        <Stack gap="sm">
          {serverHealth !== 'unknown' && (
            <Alert
              icon={serverHealth === 'healthy' ? <IconCheck size="1rem" /> : <IconX size="1rem" />}
              color={getStatusColor(serverHealth)}
              size="sm"
            >
              WhatsApp Server ({serverUrl}) is {serverHealth === 'healthy' ? 'responding' : 'not responding'}
            </Alert>
          )}

          {testing && (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Running connection tests...</Text>
              <Progress animated value={100} size="sm" />
            </Stack>
          )}

          {results.length > 0 && (
            <Stack gap="xs">
              {results.map((result, index) => (
                <Group key={index} gap="xs" wrap="nowrap">
                  {result.success ? (
                    <IconCheck size="1rem" color="green" />
                  ) : (
                    <IconX size="1rem" color="red" />
                  )}
                  <Text size="sm" style={{ flex: 1 }}>
                    {result.step}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {result.duration}ms
                  </Text>
                </Group>
              ))}
              
              {overallStatus !== 'unknown' && (
                <Alert
                  color={getStatusColor(overallStatus)}
                  size="sm"
                  mt="xs"
                >
                  <Text size="sm">
                    {overallStatus === 'all-passed' 
                      ? '✅ All tests passed - WhatsApp integration is working!'
                      : overallStatus === 'all-failed'
                      ? '❌ All tests failed - WhatsApp server may be down'
                      : `⚠️ ${passedTests}/${totalTests} tests passed - Some issues detected`
                    }
                  </Text>
                </Alert>
              )}
            </Stack>
          )}
        </Stack>
      </Collapse>
    </Card>
  )
}