'use client'

import {
  Card,
  Stack,
  Group,
  Title,
  Text,
  Button,
  Paper,
  Alert,
  TextInput,
  Switch,
  Badge,
  Divider,
  ActionIcon,
  Code,
  Accordion,
  Modal,
  Tabs,
  Select,
  NumberInput,
  Textarea,
  ThemeIcon
} from '@mantine/core'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernAlert,
  ModernContainer
} from '@/components/ui/modern-components'
import { useDisclosure } from '@mantine/hooks'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import * as Icons from 'react-icons/fi'

interface PaymentMethod {
  id: string
  name: string
  provider: string
  isActive: boolean
  config: Record<string, any>
  fees?: {
    percentage: number
    fixed: number
    currency: string
  }
}

interface PaymentSettings {
  defaultCurrency: string
  allowedMethods: string[]
  webhookUrl: string
  returnUrl: string
  cancelUrl: string
}

export default function PaymentIntegrationTab() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [settings, setSettings] = useState<PaymentSettings>({
    defaultCurrency: 'INR',
    allowedMethods: ['razorpay'],
    webhookUrl: '',
    returnUrl: '',
    cancelUrl: ''
  })
  const [loading, setLoading] = useState(true)
  const [configModal, { open: openConfig, close: closeConfig }] = useDisclosure(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [testModal, { open: openTest, close: closeTest }] = useDisclosure(false)

  // Razorpay configuration state
  const [razorpayConfig, setRazorpayConfig] = useState({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    isTestMode: true
  })

  useEffect(() => {
    loadPaymentMethods()
    loadSettings()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data.methods || [])
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
      // Set default methods for demo
      setPaymentMethods([
        {
          id: 'razorpay',
          name: 'Razorpay',
          provider: 'razorpay',
          isActive: false,
          config: {},
          fees: {
            percentage: 2.0,
            fixed: 0,
            currency: 'INR'
          }
        }
      ])
    }
    setLoading(false)
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/payment-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || settings)
      }
    } catch (error) {
      console.error('Error loading payment settings:', error)
    }
  }

  const savePaymentMethod = async (method: PaymentMethod) => {
    try {
      const response = await fetch('/api/admin/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(method)
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: `${method.name} configuration saved successfully`,
          color: 'green',
          icon: <Icons.FiCheck />
        })
        await loadPaymentMethods()
      } else {
        throw new Error('Failed to save payment method')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save payment method configuration',
        color: 'red',
        icon: <Icons.FiX />
      })
    }
  }

  const testPaymentMethod = async (methodId: string) => {
    try {
      const response = await fetch(`/api/admin/payment-methods/${methodId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        notifications.show({
          title: 'Test Successful',
          message: `${methodId} connection test passed`,
          color: 'green',
          icon: <Icons.FiCheck />
        })
      } else {
        throw new Error('Test failed')
      }
    } catch (error) {
      notifications.show({
        title: 'Test Failed',
        message: `${methodId} connection test failed`,
        color: 'red',
        icon: <Icons.FiX />
      })
    }
  }

  const handleRazorpaySetup = () => {
    const updatedMethod: PaymentMethod = {
      id: 'razorpay',
      name: 'Razorpay',
      provider: 'razorpay',
      isActive: true,
      config: {
        keyId: razorpayConfig.keyId,
        keySecret: razorpayConfig.keySecret,
        webhookSecret: razorpayConfig.webhookSecret,
        isTestMode: razorpayConfig.isTestMode
      },
      fees: {
        percentage: 2.0,
        fixed: 0,
        currency: 'INR'
      }
    }
    
    savePaymentMethod(updatedMethod)
    closeConfig()
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'green' : 'gray'
  }

  return (
    <Stack gap="md">
      {/* Header */}
      <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <ThemeIcon size="md" variant="light" color="purple">
              <Icons.FiCreditCard size={16} />
            </ThemeIcon>
            <div>
              <Title order={4} size="xs" fw={600}>Payment Integration</Title>
              <Text size="xs" c="dimmed">Configure payment gateways and methods</Text>
            </div>
          </Group>
          <Group gap="sm">
            <ModernButton
              variant="light"
              size="xs"
              leftSection={<Icons.FiRefreshCw size={10} />}
              onClick={loadPaymentMethods}
              loading={loading}
            >
              Refresh
            </ModernButton>
            <ModernButton
              size="xs"
              leftSection={<Icons.FiPlus size={10} />}
              onClick={() => {
                setSelectedMethod(paymentMethods.find(m => m.id === 'razorpay') || null)
                openConfig()
              }}
            >
              Configure Razorpay
            </ModernButton>
          </Group>
        </Group>
      </ModernCard>

      {/* Payment Methods Overview */}
      <Paper shadow="xs" radius="md" withBorder>
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
          <Title order={4} size="xs" fw={600}>💳 Payment Methods</Title>
        </div>
        <div style={{ padding: '20px' }}>
          <Stack gap="md">
            {paymentMethods.map((method) => (
              <Card key={method.id} padding="lg" radius="md" withBorder style={{
                borderColor: method.isActive ? '#10b981' : '#e5e7eb',
                background: method.isActive ? '#f0fdf4' : 'white'
              }}>
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Group gap="sm" mb="xs">
                      <Title order={5} size="xs" fw={600}>{method.name}</Title>
                      <ModernBadge 
                        color={getStatusColor(method.isActive)} 
                        variant="light"
                        size="xs"
                      >
                        {method.isActive ? 'Active' : 'Inactive'}
                      </ModernBadge>
                    </Group>
                    <Text size="xs" c="dimmed" mb="sm">
                      Provider: {method.provider.toUpperCase()}
                    </Text>
                    
                    {method.fees && (
                      <Group gap="md" mb="sm">
                        <Text size="xs" c="dimmed">
                          Fee: {method.fees.percentage}% + {method.fees.currency} {method.fees.fixed}
                        </Text>
                      </Group>
                    )}

                    {method.isActive && method.config && (
                      <Group gap="xs">
                        <Text size="xs" c="green.7" fw={500}>
                          ✅ Configured
                        </Text>
                        {method.config.isTestMode && (
                          <ModernBadge size="xs" color="orange" variant="outline">
                            Test Mode
                          </ModernBadge>
                        )}
                      </Group>
                    )}
                  </div>
                  
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => {
                        setSelectedMethod(method)
                        if (method.id === 'razorpay') {
                          setRazorpayConfig({
                            keyId: method.config.keyId || '',
                            keySecret: method.config.keySecret || '',
                            webhookSecret: method.config.webhookSecret || '',
                            isTestMode: method.config.isTestMode || true
                          })
                        }
                        openConfig()
                      }}
                    >
                      <Icons.FiSettings />
                    </ActionIcon>
                    {method.isActive && (
                      <ActionIcon
                        variant="light"
                        color="green"
                        onClick={() => testPaymentMethod(method.id)}
                      >
                        <Icons.FiZap />
                      </ActionIcon>
                    )}
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        </div>
      </Paper>

      {/* Payment Settings */}
      <Paper shadow="xs" radius="md" withBorder>
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
          <Title order={4} size="xs" fw={600}>⚙️ Payment Settings</Title>
        </div>
        <div style={{ padding: '20px' }}>
          <Stack gap="md">
            <Group grow>
              <Select
                label="Default Currency"
                value={settings.defaultCurrency}
                data={[
                  { value: 'INR', label: '🇮🇳 Indian Rupee (INR)' },
                  { value: 'USD', label: '🇺🇸 US Dollar (USD)' },
                  { value: 'EUR', label: '🇪🇺 Euro (EUR)' },
                  { value: 'GBP', label: '🇬🇧 British Pound (GBP)' }
                ]}
                onChange={(value) => setSettings(prev => ({ ...prev, defaultCurrency: value || 'INR' }))}
              />
            </Group>

            <TextInput
              label="Webhook URL"
              placeholder="https://your-domain.com/api/webhooks/payment"
              value={settings.webhookUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
              leftSection={<Icons.FiLink />}
            />

            <Group grow>
              <TextInput
                label="Success Return URL"
                placeholder="https://your-domain.com/payment/success"
                value={settings.returnUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, returnUrl: e.target.value }))}
                leftSection={<Icons.FiCheck />}
              />
              <TextInput
                label="Cancel Return URL"
                placeholder="https://your-domain.com/payment/cancel"
                value={settings.cancelUrl}
                onChange={(e) => setSettings(prev => ({ ...prev, cancelUrl: e.target.value }))}
                leftSection={<Icons.FiX />}
              />
            </Group>
          </Stack>
        </div>
      </Paper>

      {/* Configuration Modal */}
      <Modal
        opened={configModal}
        onClose={closeConfig}
        title={`Configure ${selectedMethod?.name || 'Payment Method'}`}
        size="lg"
      >
        <Stack gap="md">
          {selectedMethod?.id === 'razorpay' && (
            <>
              <ModernAlert icon={<Icons.FiInfo size={10} />} color="blue" variant="light">
                <Text size="xs">Configure your Razorpay credentials to enable payments.</Text>
              </ModernAlert>

              <Switch
                label="Test Mode"
                description="Use test credentials for development"
                checked={razorpayConfig.isTestMode}
                onChange={(e) => setRazorpayConfig(prev => ({ ...prev, isTestMode: e.currentTarget.checked }))}
              />

              <TextInput
                label="Key ID"
                placeholder="rzp_test_xxxxxxxxxxxxxxxx"
                value={razorpayConfig.keyId}
                onChange={(e) => setRazorpayConfig(prev => ({ ...prev, keyId: e.target.value }))}
                required
              />

              <TextInput
                label="Key Secret"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                value={razorpayConfig.keySecret}
                onChange={(e) => setRazorpayConfig(prev => ({ ...prev, keySecret: e.target.value }))}
                type="password"
                required
              />

              <TextInput
                label="Webhook Secret"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                value={razorpayConfig.webhookSecret}
                onChange={(e) => setRazorpayConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                type="password"
              />

              <Divider />

              <div>
                <Text size="xs" fw={500} mb="sm">Integration Guide</Text>
                <Accordion variant="contained" radius="md">
                  <Accordion.Item value="setup">
                    <Accordion.Control>Setup Instructions</Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="xs">
                        <Text size="xs">1. Create a Razorpay account at razorpay.com</Text>
                        <Text size="xs">2. Go to Settings → API Keys</Text>
                        <Text size="xs">3. Generate API keys for your account</Text>
                        <Text size="xs">4. Copy Key ID and Key Secret</Text>
                        <Text size="xs">5. Configure webhook URL in Razorpay dashboard</Text>
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                  
                  <Accordion.Item value="webhook">
                    <Accordion.Control>Webhook Configuration</Accordion.Control>
                    <Accordion.Panel>
                      <Text size="xs" c="dimmed" mb="sm">Add this URL to your Razorpay webhook settings:</Text>
                      <Code block style={{ fontSize: '11px' }}>
                        {`${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/webhooks/razorpay`}
                      </Code>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              </div>
            </>
          )}

          <Group justify="flex-end">
            <ModernButton variant="light" onClick={closeConfig} size="xs">Cancel</ModernButton>
            <ModernButton 
              onClick={handleRazorpaySetup}
              disabled={!razorpayConfig.keyId || !razorpayConfig.keySecret}
              size="xs"
            >
              Save Configuration
            </ModernButton>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}