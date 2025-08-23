'use client'

import {
  Card,
  Stack,
  Group,
  Title,
  Text,
  Button,
  Select,
  TextInput,
  PasswordInput,
  NumberInput,
  Switch,
  Paper,
  Alert,
  Loader,
  Badge,
  Divider,
  Tabs,
  Box,
  Modal,
  Textarea,
  ActionIcon,
  Code,
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

interface EmailSettings {
  provider: string
  smtp: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  from: {
    name: string
    email: string
  }
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'html' | 'text'
  createdAt: string
  updatedAt: string
}

const PROVIDER_PRESETS: Record<string, any> = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    description: 'Use Gmail App Password (not your regular password)'
  },
  yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    description: 'Use Yahoo App Password for better security'
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    description: 'Microsoft Outlook/Live/Hotmail accounts'
  },
  custom: {
    host: '',
    port: 587,
    secure: false,
    description: 'Configure your own SMTP server'
  }
}

export default function EmailTabSafe() {
  const [settings, setSettings] = useState<EmailSettings>({
    provider: 'custom',
    smtp: {
      host: '',
      port: 587,
      secure: false,
      auth: { user: '', pass: '' }
    },
    from: { name: '', email: '' }
  })
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templateModal, { open: openTemplate, close: closeTemplate }] = useDisclosure(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateSubject, setTemplateSubject] = useState('')
  const [templateContent, setTemplateContent] = useState('')
  const [templateType, setTemplateType] = useState<'html' | 'text'>('html')
  const [previewMode, setPreviewMode] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testSubject, setTestSubject] = useState('Test Email')
  const [testContent, setTestContent] = useState('This is a test email from your WhatsApp management system.')

  useEffect(() => {
    loadSettings()
    loadTemplates()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/email/settings-noauth')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        console.warn('Could not load email settings, using defaults')
      }
    } catch (error) {
      console.error('Error loading email settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/email/settings-noauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Email settings saved successfully',
          color: 'green'
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save email settings',
        color: 'red'
      })
    } finally {
      setSaving(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const saveTemplate = async () => {
    try {
      const method = selectedTemplate ? 'PUT' : 'POST'
      const body = selectedTemplate 
        ? { id: selectedTemplate.id, name: templateName, subject: templateSubject, content: templateContent, type: templateType }
        : { name: templateName, subject: templateSubject, content: templateContent, type: templateType }

      const response = await fetch('/api/admin/email/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: `Template ${selectedTemplate ? 'updated' : 'created'} successfully`,
          color: 'green'
        })
        closeTemplate()
        loadTemplates()
        resetTemplateForm()
      } else {
        throw new Error('Failed to save template')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save template',
        color: 'red'
      })
    }
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/email/templates?id=${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Template deleted successfully',
          color: 'green'
        })
        loadTemplates()
      } else {
        throw new Error('Failed to delete template')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete template',
        color: 'red'
      })
    }
  }

  const resetTemplateForm = () => {
    setSelectedTemplate(null)
    setTemplateName('')
    setTemplateSubject('')
    setTemplateContent('')
    setTemplateType('html')
    setPreviewMode(false)
  }

  const editTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setTemplateName(template.name)
    setTemplateSubject(template.subject)
    setTemplateContent(template.content)
    setTemplateType(template.type)
    setPreviewMode(false)
    openTemplate()
  }

  const newTemplate = () => {
    resetTemplateForm()
    openTemplate()
  }

  const sendTestEmail = async () => {
    try {
      const response = await fetch('/api/admin/email/test-noauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmail,
          subject: testSubject,
          content: testContent
        })
      })

      if (response.ok) {
        notifications.show({
          title: 'Test Email Sent',
          message: 'Test email sent successfully',
          color: 'green'
        })
      } else {
        const error = await response.json()
        throw new Error(error.details || 'Failed to send test email')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to send test email',
        color: 'red'
      })
    }
  }

  const generateRandomData = () => {
    const names = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson']
    const companies = ['TechCorp Inc.', 'Innovation Labs', 'Global Solutions Ltd.', 'Digital Dynamics']
    const emails = ['john.demo@example.com', 'sarah.test@demo.com', 'demo.user@testmail.com']
    
    return {
      name: names[Math.floor(Math.random() * names.length)],
      email: emails[Math.floor(Math.random() * emails.length)],
      company: companies[Math.floor(Math.random() * companies.length)],
      product_name: 'WhatsApp Business Pro',
      dashboard_url: 'https://your-domain.com/dashboard',
      cta_url: 'https://your-domain.com/get-started',
      messages_sent: Math.floor(Math.random() * 10000) + 1000,
      revenue_generated: '$' + (Math.floor(Math.random() * 100000) + 10000).toLocaleString(),
      customers_reached: Math.floor(Math.random() * 5000) + 500
    }
  }

  const replaceTemplateVariables = (content: string, data: any) => {
    let result = content
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, data[key])
    })
    return result
  }

  const sendTemplateTest = async (template: EmailTemplate) => {
    if (!testEmail.trim()) {
      notifications.show({
        title: 'Email Required',
        message: 'Please enter a test email address in the Test Email tab first',
        color: 'orange'
      })
      return
    }

    try {
      const randomData = generateRandomData()
      const processedSubject = replaceTemplateVariables(template.subject, randomData)
      const processedContent = replaceTemplateVariables(template.content, randomData)

      const response = await fetch('/api/admin/email/test-noauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmail: testEmail,
          subject: processedSubject,
          content: processedContent,
          templateName: template.name
        })
      })

      if (response.ok) {
        notifications.show({
          title: 'Template Test Sent! 📧',
          message: `"${template.name}" sent to ${testEmail} with sample data`,
          color: 'green',
          autoClose: 5000
        })
      } else {
        const error = await response.json()
        throw new Error(error.details || 'Failed to send template test')
      }
    } catch (error) {
      notifications.show({
        title: 'Template Test Failed',
        message: error instanceof Error ? error.message : 'Failed to send template test',
        color: 'red'
      })
    }
  }

  if (loading) {
    return (
      <ModernCard p="xl" style={{ textAlign: 'center' }}>
        <Loader size="lg" />
        <Text mt="md" size="xs">Loading email settings...</Text>
      </ModernCard>
    )
  }

  return (
    <Stack gap="md">
      {/* Header with Actions */}
      <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <ThemeIcon size="md" variant="light" color="blue">
              <Icons.FiMail size={16} />
            </ThemeIcon>
            <Box>
              <Title order={4} size="xs" fw={600}>Email Configuration</Title>
              <Text size="xs" c="dimmed">Configure SMTP settings and email providers</Text>
            </Box>
          </Group>
          <Group gap="sm">
            <ModernButton
              variant="light"
              size="xs"
              leftSection={<Icons.FiRefreshCw size={10} />}
              onClick={() => loadSettings()}
            >
              Reload
            </ModernButton>
            <ModernButton
              size="xs"
              loading={saving}
              leftSection={<Icons.FiSave size={10} />}
              onClick={saveSettings}
            >
              Save Settings
            </ModernButton>
          </Group>
        </Group>
      </ModernCard>

      {/* Email Settings Sub-Tabs */}
      <ModernCard
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          border: '2px solid rgba(59, 130, 246, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(59, 130, 246, 0.06)',
          overflow: 'hidden'
        }}
      >
        <Tabs defaultValue="smtp" variant="outline">
          <Tabs.List 
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
              borderBottom: '2px solid rgba(59, 130, 246, 0.15)'
            }} 
            p="md"
          >
            <Tabs.Tab value="smtp">
              <Group gap="xs">
                <Icons.FiServer size={10} />
                <Text size="xs">SMTP Settings</Text>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="providers">
              <Group gap="xs">
                <Icons.FiMail size={10} />
                <Text size="xs">Email Providers</Text>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="templates">
              <Group gap="xs">
                <Icons.FiFileText size={10} />
                <Text size="xs">Templates</Text>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="test">
              <Group gap="xs">
                <Icons.FiSend size={10} />
                <Text size="xs">Test Email</Text>
              </Group>
            </Tabs.Tab>
          </Tabs.List>

          {/* SMTP Settings Tab */}
          <Tabs.Panel value="smtp" p="md">
            <Stack gap="md">
              {/* Provider Selection */}
              <Select
                label="Email Provider"
                placeholder="Select your email provider"
                data={[
                  { value: 'gmail', label: '📧 Gmail' },
                  { value: 'yahoo', label: '📧 Yahoo Mail' },
                  { value: 'outlook', label: '📧 Outlook/Live' },
                  { value: 'custom', label: '⚙️ Custom SMTP' }
                ]}
                value={settings.provider}
                onChange={(value) => {
                  if (!value) return
                  const preset = PROVIDER_PRESETS[value] || PROVIDER_PRESETS.custom
                  setSettings({
                    ...settings,
                    provider: value,
                    smtp: {
                      ...settings.smtp,
                      host: preset.host,
                      port: preset.port,
                      secure: preset.secure
                    }
                  })
                }}
              />

              {/* Provider Description */}
              {settings.provider && PROVIDER_PRESETS[settings.provider]?.description && (
                <ModernAlert icon={<Icons.FiInfo size={10} />} title="Setup Instructions" color="blue" variant="light">
                  <Text size="xs">{PROVIDER_PRESETS[settings.provider].description}</Text>
                </ModernAlert>
              )}

              {/* SMTP Configuration */}
              <Paper bg="gray.1" p="md" radius="md">
                <Text size="xs" fw={500} mb="md">SMTP Server Configuration</Text>
                <Stack gap="md">
                  <Group grow>
                    <TextInput
                      label="SMTP Host"
                      placeholder="smtp.example.com"
                      value={settings.smtp.host}
                      onChange={(e) => setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, host: e.target.value }
                      })}
                    />
                    <NumberInput
                      label="Port"
                      placeholder="587"
                      value={settings.smtp.port}
                      onChange={(value) => setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, port: Number(value) || 587 }
                      })}
                    />
                  </Group>

                  <Switch
                    label="Use SSL/TLS"
                    description="Enable secure connection"
                    checked={settings.smtp.secure}
                    onChange={(e) => setSettings({
                      ...settings,
                      smtp: { ...settings.smtp, secure: e.currentTarget.checked }
                    })}
                  />

                  <Group grow>
                    <TextInput
                      label="Username/Email"
                      placeholder="your@email.com"
                      value={settings.smtp.auth.user}
                      onChange={(e) => setSettings({
                        ...settings,
                        smtp: {
                          ...settings.smtp,
                          auth: { ...settings.smtp.auth, user: e.target.value }
                        }
                      })}
                    />
                    <PasswordInput
                      label="Password/App Password"
                      placeholder="Your password"
                      value={settings.smtp.auth.pass}
                      onChange={(e) => setSettings({
                        ...settings,
                        smtp: {
                          ...settings.smtp,
                          auth: { ...settings.smtp.auth, pass: e.target.value }
                        }
                      })}
                    />
                  </Group>
                </Stack>
              </Paper>

              {/* From Settings */}
              <Paper bg="gray.1" p="md" radius="md">
                <Text size="xs" fw={500} mb="md">Sender Information</Text>
                <Group grow>
                  <TextInput
                    label="From Name"
                    placeholder="Your Company Name"
                    value={settings.from.name}
                    onChange={(e) => setSettings({
                      ...settings,
                      from: { ...settings.from, name: e.target.value }
                    })}
                  />
                  <TextInput
                    label="From Email"
                    placeholder="noreply@yourcompany.com"
                    value={settings.from.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      from: { ...settings.from, email: e.target.value }
                    })}
                  />
                </Group>
              </Paper>
            </Stack>
          </Tabs.Panel>

          {/* Email Providers Tab */}
          <Tabs.Panel value="providers" p="md">
            <Stack gap="md">
              <ModernAlert icon={<Icons.FiInfo size={10} />} title="Popular Email Providers" color="blue" variant="light">
                <Text size="xs">Quick setup guides for popular email providers</Text>
              </ModernAlert>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <Paper p="md" withBorder radius="md">
                  <Group gap="sm" mb="md">
                    <Icons.FiMail color="#ea4335" size={16} />
                    <Title order={5} size="xs" fw={600}>Gmail</Title>
                  </Group>
                  <Text size="xs" c="dimmed" mb="sm">Use Gmail with App Password for secure authentication</Text>
                  <ModernButton variant="light" size="xs" fullWidth onClick={() => setSettings({...settings, provider: 'gmail'})}>
                    Configure Gmail
                  </ModernButton>
                </Paper>

                <Paper p="md" withBorder radius="md">
                  <Group gap="sm" mb="md">
                    <Icons.FiMail color="#7B68EE" size={16} />
                    <Title order={5} size="xs" fw={600}>Yahoo Mail</Title>
                  </Group>
                  <Text size="xs" c="dimmed" mb="sm">Yahoo Mail with App Password authentication</Text>
                  <ModernButton variant="light" size="xs" fullWidth onClick={() => setSettings({...settings, provider: 'yahoo'})}>
                    Configure Yahoo
                  </ModernButton>
                </Paper>

                <Paper p="md" withBorder radius="md">
                  <Group gap="sm" mb="md">
                    <Icons.FiMail color="#0078d4" size={16} />
                    <Title order={5} size="xs" fw={600}>Outlook</Title>
                  </Group>
                  <Text size="xs" c="dimmed" mb="sm">Microsoft Outlook/Live/Hotmail accounts</Text>
                  <ModernButton variant="light" size="xs" fullWidth onClick={() => setSettings({...settings, provider: 'outlook'})}>
                    Configure Outlook
                  </ModernButton>
                </Paper>

                <Paper p="md" withBorder radius="md">
                  <Group gap="sm" mb="md">
                    <Icons.FiSettings color="#666" size={16} />
                    <Title order={5} size="xs" fw={600}>Custom SMTP</Title>
                  </Group>
                  <Text size="xs" c="dimmed" mb="sm">Configure your own SMTP server</Text>
                  <ModernButton variant="light" size="xs" fullWidth onClick={() => setSettings({...settings, provider: 'custom'})}>
                    Custom Setup
                  </ModernButton>
                </Paper>
              </div>
            </Stack>
          </Tabs.Panel>

          {/* Templates Tab */}
          <Tabs.Panel value="templates" p="md">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  <Icons.FiFileText size={16} />
                  <Title order={4} size="xs" fw={600}>Email Templates</Title>
                </Group>
                <ModernButton
                  leftSection={<Icons.FiPlus size={10} />}
                  onClick={newTemplate}
                  size="xs"
                >
                  New Template
                </ModernButton>
              </Group>

              {/* Template Test Info */}
              <ModernAlert icon={<Icons.FiInfo size={10} />} title="Template Testing" color="blue" variant="light">
                <Group justify="space-between" align="center">
                  <Text size="xs">
                    Each template has a "Send Test" button that sends the template with random sample data.
                    {!testEmail.trim() && " Configure a test email address in the Test Email tab first."}
                  </Text>
                  {!testEmail.trim() && (
                    <ModernBadge color="orange" variant="light" size="xs">Test Email Required</ModernBadge>
                  )}
                </Group>
              </ModernAlert>

              {(templates || []).length === 0 ? (
                <Paper bg="gray.1" p="xl" radius="md" style={{ textAlign: 'center' }}>
                  <Icons.FiFileText size={48} color="#666" style={{ marginBottom: '16px' }} />
                  <Text c="dimmed" fw={500} size="xs">No email templates found</Text>
                  <Text size="xs" c="dimmed" mt="xs">
                    Create your first template to get started
                  </Text>
                </Paper>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                  gap: '20px' 
                }}>
                  {(templates || []).map((template) => (
                    <Card 
                      key={template.id} 
                      shadow="md" 
                      padding={0} 
                      radius="lg" 
                      withBorder
                      style={{ 
                        height: '400px',
                        overflow: 'hidden',
                        position: 'relative',
                        background: 'white',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Template Preview */}
                      <div style={{ 
                        height: '240px', 
                        overflow: 'hidden',
                        background: template.type === 'html' ? 'white' : '#f8fafc',
                        position: 'relative'
                      }}>
                        {template.type === 'html' ? (
                          <div 
                            style={{ 
                              transform: 'scale(0.6)', 
                              transformOrigin: 'top left',
                              width: '166.67%',
                              height: '166.67%',
                              overflow: 'hidden',
                              pointerEvents: 'none'
                            }}
                            dangerouslySetInnerHTML={{ 
                              __html: template.content.length > 2000 
                                ? template.content.substring(0, 2000) + '...'
                                : template.content 
                            }} 
                          />
                        ) : (
                          <div style={{ 
                            padding: '20px', 
                            fontFamily: 'monospace', 
                            fontSize: '12px', 
                            lineHeight: '1.4',
                            color: '#666',
                            height: '100%',
                            overflow: 'hidden'
                          }}>
                            {template.content.length > 400 
                              ? template.content.substring(0, 400) + '...'
                              : template.content
                            }
                          </div>
                        )}
                        
                        {/* Overlay Gradient */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '60px',
                          background: 'linear-gradient(transparent, rgba(255,255,255,0.95))',
                          pointerEvents: 'none'
                        }} />
                      </div>

                      {/* Template Info */}
                      <div style={{ padding: '16px' }}>
                        <Group justify="space-between" align="flex-start" mb="xs">
                          <div style={{ flex: 1 }}>
                            <Group gap="xs" mb="xs">
                              <Text fw={600} size="xs" style={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '180px'
                              }}>
                                {template.name}
                              </Text>
                              <ModernBadge 
                                size="xs" 
                                color={template.type === 'html' ? 'blue' : 'gray'}
                                variant="light"
                              >
                                {template.type.toUpperCase()}
                              </ModernBadge>
                            </Group>
                            <Text 
                              size="xs" 
                              c="dimmed" 
                              style={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {template.subject}
                            </Text>
                            <Text size="xs" c="dimmed" mt={4}>
                              Updated: {new Date(template.updatedAt).toLocaleDateString()}
                            </Text>
                          </div>
                        </Group>

                        {/* Action Buttons */}
                        <Stack gap="xs" mt="md">
                          <Group justify="center" gap="xs">
                            <ModernButton
                              variant="light"
                              size="xs"
                              leftSection={<Icons.FiEdit size={10} />}
                              onClick={(e) => {
                                e.stopPropagation()
                                editTemplate(template)
                              }}
                              style={{ flex: 1 }}
                            >
                              Edit
                            </ModernButton>
                            <ModernButton
                              variant="light"
                              color="red"
                              size="xs"
                              leftSection={<Icons.FiTrash size={10} />}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Are you sure you want to delete this template?')) {
                                  deleteTemplate(template.id)
                                }
                              }}
                              style={{ flex: 1 }}
                            >
                              Delete
                            </ModernButton>
                          </Group>
                          <ModernButton
                            variant="filled"
                            color="blue"
                            size="xs"
                            leftSection={<Icons.FiSend size={10} />}
                            onClick={(e) => {
                              e.stopPropagation()
                              sendTemplateTest(template)
                            }}
                            fullWidth
                            disabled={!settings.smtp.host || !testEmail.trim()}
                            style={{
                              opacity: (!settings.smtp.host || !testEmail.trim()) ? 0.6 : 1
                            }}
                          >
                            {!settings.smtp.host ? 'Configure SMTP' : 
                             !testEmail.trim() ? 'Set Test Email' : 'Send Test'}
                          </ModernButton>
                        </Stack>
                      </div>

                      {/* Status Indicator */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(255,255,255,0.9)',
                        borderRadius: '12px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: template.type === 'html' ? '#3b82f6' : '#6b7280',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}>
                        {template.type === 'html' ? '🎨 HTML' : '📝 TEXT'}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Test Email Tab */}
          <Tabs.Panel value="test" p="md">
            <Stack gap="md">
              <ModernAlert icon={<Icons.FiSend size={10} />} title="Test Email" color="blue" variant="light">
                <Text size="xs">Send a test email to verify your SMTP configuration works correctly</Text>
              </ModernAlert>

              <Paper p="md" withBorder radius="md">
                <Group justify="space-between" align="center" mb="md">
                  <Group gap="sm">
                    <Icons.FiSend size={16} />
                    <Title order={4} size="xs" fw={600}>Send Test Email</Title>
                  </Group>
                  <ModernBadge color={settings.smtp.host ? 'green' : 'red'} variant="light" size="xs">
                    {settings.smtp.host ? 'SMTP Configured' : 'SMTP Not Configured'}
                  </ModernBadge>
                </Group>

                <Stack gap="md">
                  <TextInput
                    label="Test Email Address"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    required
                  />
                  <TextInput
                    label="Subject"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                  />
                  <Textarea
                    label="Content"
                    placeholder="Test email content..."
                    value={testContent}
                    onChange={(e) => setTestContent(e.target.value)}
                    rows={4}
                  />
                  <Group justify="flex-end">
                    <ModernButton
                      onClick={sendTestEmail}
                      leftSection={<Icons.FiSend size={10} />}
                      disabled={!settings.smtp.host || !testEmail}
                      size="xs"
                    >
                      Send Test Email
                    </ModernButton>
                  </Group>
                </Stack>

                {!settings.smtp.host && (
                  <ModernAlert color="orange" mt="md">
                    <Text size="xs">
                      Please configure your SMTP settings in the "SMTP Settings" tab before sending test emails.
                    </Text>
                  </ModernAlert>
                )}
              </Paper>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </ModernCard>

      {/* Status Footer */}
      <ModernCard shadow="sm" padding="md" radius="md" withBorder bg="gray.1">
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Group gap="xs">
              <ModernBadge 
                color={settings.smtp.host ? 'green' : 'gray'} 
                variant={settings.smtp.host ? 'filled' : 'outline'}
                size="xs"
              >
                {settings.smtp.host ? 'Configured' : 'Not Configured'}
              </ModernBadge>
              <Text size="xs" c="dimmed">
                {settings.smtp.host 
                  ? `Using ${settings.provider.toUpperCase()} (${settings.smtp.host}:${settings.smtp.port})`
                  : 'No SMTP server configured'
                }
              </Text>
            </Group>
          </Group>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              📧 Navigate between email settings using the tabs above
            </Text>
            <Divider orientation="vertical" />
            <ModernButton
              variant="subtle"
              size="xs"
              leftSection={<Icons.FiHelpCircle size={10} />}
              onClick={() => alert('Email Settings Help:\n\n• SMTP Settings: Configure your email server\n• Email Providers: Quick setup for popular providers\n• Templates: Manage email templates\n• Test Email: Send test emails\n\nUse the main tabs to navigate to other system settings.')}
            >
              Help
            </ModernButton>
          </Group>
        </Group>
      </ModernCard>

      {/* Template Modal */}
      <Modal 
        opened={templateModal} 
        onClose={closeTemplate} 
        title={selectedTemplate ? 'Edit Template' : 'New Template'} 
        size="xl"
        styles={{ body: { padding: 0 } }}
      >
        <Stack gap="md" p="md">
          <Group grow>
            <TextInput
              label="Template Name"
              placeholder="Welcome Email"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              required
            />
            <Select
              label="Template Type"
              data={[
                { value: 'html', label: 'HTML' },
                { value: 'text', label: 'Plain Text' }
              ]}
              value={templateType}
              onChange={(value) => setTemplateType(value as 'html' | 'text')}
            />
          </Group>

          <TextInput
            label="Subject"
            placeholder="Welcome to our service!"
            value={templateSubject}
            onChange={(e) => setTemplateSubject(e.target.value)}
            required
          />

          <Group justify="space-between" align="center">
            <Text size="xs" fw={500}>Content</Text>
            <Group gap="xs">
              <ModernButton
                variant={previewMode ? 'light' : 'filled'}
                size="xs"
                onClick={() => setPreviewMode(false)}
              >
                Edit
              </ModernButton>
              <ModernButton
                variant={previewMode ? 'filled' : 'light'}
                size="xs"
                onClick={() => setPreviewMode(true)}
                disabled={templateType === 'text'}
              >
                Preview
              </ModernButton>
            </Group>
          </Group>

          {previewMode && templateType === 'html' ? (
            <Paper p="md" withBorder radius="md" mih={300}>
              <div dangerouslySetInnerHTML={{ __html: templateContent }} />
            </Paper>
          ) : (
            <Textarea
              placeholder={templateType === 'html' 
                ? '<h1>Welcome {{name}}!</h1><p>Thank you for joining us.</p>' 
                : 'Welcome {{name}}!\n\nThank you for joining us.'
              }
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              rows={12}
              styles={{ input: { fontFamily: 'monospace' } }}
              required
            />
          )}

          <Divider />

          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Available variables: {'{name}'}, {'{email}'}, {'{company}'}
            </Text>
            <Group>
              <ModernButton variant="light" onClick={closeTemplate} size="xs">Cancel</ModernButton>
              <ModernButton onClick={saveTemplate} leftSection={<Icons.FiSave size={10} />} size="xs">
                {selectedTemplate ? 'Update' : 'Create'} Template
              </ModernButton>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}