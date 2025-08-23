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
  Badge,
  Paper,
  Tabs,
  ActionIcon,
  Modal,
  Textarea,
  Box,
  Alert,
  Loader,
  Code,
  Divider
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useState, useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import * as Icons from 'react-icons/fi'
import EmailProviderGuide from './EmailProviderGuide'

interface EmailSettings {
  provider: 'gmail' | 'yahoo' | 'outlook' | 'hotmail' | 'icloud' | 'zoho' | 'aws_ses' | 'sendgrid' | 'mailgun' | 'custom'
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

const PROVIDER_PRESETS = {
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
  hotmail: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    description: 'Legacy Hotmail accounts (use Outlook settings)'
  },
  icloud: {
    host: 'smtp.mail.me.com',
    port: 587,
    secure: false,
    description: 'Apple iCloud Mail with App-Specific Password'
  },
  zoho: {
    host: 'smtp.zoho.com',
    port: 587,
    secure: false,
    description: 'Zoho Mail business email service'
  },
  aws_ses: {
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    description: 'Amazon SES (Simple Email Service)'
  },
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    description: 'SendGrid email delivery service'
  },
  mailgun: {
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
    description: 'Mailgun email service'
  },
  custom: {
    host: '',
    port: 587,
    secure: false,
    description: 'Configure your own SMTP server'
  }
}

export default function EmailTab() {
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testEmailModal, { open: openTestEmail, close: closeTestEmail }] = useDisclosure(false)
  const [templateModal, { open: openTemplate, close: closeTemplate }] = useDisclosure(false)
  const [providerGuideModal, { open: openProviderGuide, close: closeProviderGuide }] = useDisclosure(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [testSubject, setTestSubject] = useState('Test Email')
  const [testContent, setTestContent] = useState('This is a test email from your WhatsApp management system.')
  const [templateName, setTemplateName] = useState('')
  const [templateSubject, setTemplateSubject] = useState('')
  const [templateContent, setTemplateContent] = useState('')
  const [templateType, setTemplateType] = useState<'html' | 'text'>('html')
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    loadSettings()
    loadTemplates()
  }, [])

  const loadSettings = async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/email/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        throw new Error('Failed to load settings')
      }
    } catch (error) {
      console.error('Error loading email settings:', error)
      setError('Failed to load email settings')
    } finally {
      setLoading(false)
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

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Email settings saved successfully',
          color: 'green',
          icon: <Icons.FiCheck />
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save email settings',
        color: 'red',
        icon: <Icons.FiX />
      })
    } finally {
      setSaving(false)
    }
  }

  const sendTestEmail = async () => {
    try {
      const response = await fetch('/api/admin/email/test', {
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
          color: 'green',
          icon: <Icons.FiMail />
        })
        closeTestEmail()
      } else {
        const error = await response.json()
        throw new Error(error.details || 'Failed to send test email')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to send test email',
        color: 'red',
        icon: <Icons.FiX />
      })
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
          color: 'green',
          icon: <Icons.FiCheck />
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
        color: 'red',
        icon: <Icons.FiX />
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
          color: 'green',
          icon: <Icons.FiCheck />
        })
        loadTemplates()
      } else {
        throw new Error('Failed to delete template')
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete template',
        color: 'red',
        icon: <Icons.FiX />
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

  if (loading) {
    return (
      <Paper p="xl" style={{ textAlign: 'center' }}>
        <Loader size="lg" />
        <Text mt="md">Loading email settings...</Text>
      </Paper>
    )
  }

  if (error) {
    return (
      <Alert color="red" title="Error" icon={<Icons.FiAlertCircle />}>
        {error}
      </Alert>
    )
  }

  if (!settings) {
    return (
      <Paper p="xl" style={{ textAlign: 'center' }}>
        <Loader size="lg" />
        <Text mt="md">Initializing email settings...</Text>
      </Paper>
    )
  }

  return (
    <Stack gap="md">
      <Tabs defaultValue="settings" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="settings">
            <Group gap="xs">
              <Box component={Icons.FiSettings} size={16} />
              <Text>SMTP Settings</Text>
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="templates">
            <Group gap="xs">
              <Box component={Icons.FiFileText} size={16} />
              <Text>Email Templates</Text>
            </Group>
          </Tabs.Tab>
        </Tabs.List>

        {/* SMTP Settings Tab */}
        <Tabs.Panel value="settings" pt="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Group justify="space-between">
                <Group gap="sm">
                  <Box component={Icons.FiMail} />
                  <Title order={4}>Email Configuration</Title>
                </Group>
                <Group gap="xs">
                  <Button
                    variant="light"
                    size="sm"
                    leftSection={<Icons.FiSend />}
                    onClick={openTestEmail}
                  >
                    Test Email
                  </Button>
                  <Button
                    size="sm"
                    loading={saving}
                    leftSection={<Icons.FiSave />}
                    onClick={saveSettings}
                  >
                    Save Settings
                  </Button>
                </Group>
              </Group>
            </Card.Section>

            <Stack gap="md" mt="md">
              {/* Provider Selection */}
              <div>
                <Group justify="space-between" align="flex-end" mb="xs">
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Email Provider</Text>
                    <Text size="xs" c="dimmed">Choose your email provider for automatic SMTP configuration</Text>
                  </div>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<Icons.FiHelpCircle />}
                    onClick={openProviderGuide}
                  >
                    Setup Guide
                  </Button>
                </Group>
                <Select
                  placeholder="Select your email provider"
                  data={[
                    { value: 'gmail', label: '📧 Gmail', group: 'Personal Email' },
                    { value: 'yahoo', label: '📧 Yahoo Mail', group: 'Personal Email' },
                    { value: 'outlook', label: '📧 Outlook/Live', group: 'Personal Email' },
                    { value: 'hotmail', label: '📧 Hotmail', group: 'Personal Email' },
                    { value: 'icloud', label: '📧 iCloud Mail', group: 'Personal Email' },
                    { value: 'zoho', label: '💼 Zoho Mail', group: 'Business Email' },
                    { value: 'aws_ses', label: '☁️ Amazon SES', group: 'Enterprise Services' },
                    { value: 'sendgrid', label: '📨 SendGrid', group: 'Enterprise Services' },
                    { value: 'mailgun', label: '📮 Mailgun', group: 'Enterprise Services' },
                    { value: 'custom', label: '⚙️ Custom SMTP', group: 'Custom Configuration' }
                  ]}
                  value={settings?.provider || ''}
                  onChange={(value) => {
                    if (!settings) return
                    const provider = value as keyof typeof PROVIDER_PRESETS
                    const preset = PROVIDER_PRESETS[provider]
                    setSettings({
                      ...settings,
                      provider,
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
                {settings?.provider && PROVIDER_PRESETS[settings.provider]?.description && (
                  <Alert 
                    icon={<Icons.FiInfo />} 
                    title="Setup Instructions" 
                    color="blue" 
                    variant="light"
                    mt="sm"
                  >
                    <Text size="sm">{PROVIDER_PRESETS[settings.provider].description}</Text>
                    {settings?.provider === 'gmail' && (
                      <Text size="xs" c="dimmed" mt="xs">
                        📝 <strong>How to get Gmail App Password:</strong><br/>
                        1. Go to Google Account settings<br/>
                        2. Enable 2-Step Verification<br/>
                        3. Generate App Password for "Mail"<br/>
                        4. Use the generated password here
                      </Text>
                    )}
                    {settings?.provider === 'yahoo' && (
                      <Text size="xs" c="dimmed" mt="xs">
                        📝 <strong>How to get Yahoo App Password:</strong><br/>
                        1. Go to Yahoo Account Security<br/>
                        2. Generate App Password<br/>
                        3. Select "Other app" and name it<br/>
                        4. Use the generated password here
                      </Text>
                    )}
                    {settings?.provider === 'outlook' && (
                      <Text size="xs" c="dimmed" mt="xs">
                        📝 <strong>For Outlook/Live/Hotmail:</strong><br/>
                        1. Enable 2-factor authentication<br/>
                        2. Generate App Password in Security settings<br/>
                        3. Use your full email as username
                      </Text>
                    )}
                    {settings?.provider === 'icloud' && (
                      <Text size="xs" c="dimmed" mt="xs">
                        📝 <strong>For iCloud Mail:</strong><br/>
                        1. Go to Apple ID settings<br/>
                        2. Sign-In and Security → App-Specific Passwords<br/>
                        3. Generate password for "Mail"
                      </Text>
                    )}
                  </Alert>
                )}
              </div>

              {/* SMTP Configuration */}
              <Paper bg="gray.1" p="md" radius="md">
                <Text size="sm" fw={500} mb="md">SMTP Server Configuration</Text>
                <Stack gap="md">
                  <Group grow>
                    <TextInput
                      label="SMTP Host"
                      placeholder="smtp.example.com"
                      value={settings?.smtp?.host || ''}
                      onChange={(e) => {
                        if (!settings) return
                        setSettings({
                          ...settings,
                          smtp: { ...settings.smtp, host: e.target.value }
                        })
                      }}
                    />
                    <NumberInput
                      label="Port"
                      placeholder="587"
                      value={settings?.smtp?.port || 587}
                      onChange={(value) => {
                        if (!settings) return
                        setSettings({
                          ...settings,
                          smtp: { ...settings.smtp, port: Number(value) || 587 }
                        })
                      }}
                    />
                  </Group>

                  <Switch
                    label="Use SSL/TLS"
                    description="Enable secure connection"
                    checked={settings?.smtp?.secure || false}
                    onChange={(e) => {
                      if (!settings) return
                      setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, secure: e.currentTarget.checked }
                      })
                    }}
                  />

                  <Group grow>
                    <TextInput
                      label="Username/Email"
                      placeholder="your@email.com"
                      value={settings?.smtp?.auth?.user || ''}
                      onChange={(e) => {
                        if (!settings) return
                        setSettings({
                          ...settings,
                          smtp: {
                            ...settings.smtp,
                            auth: { ...settings.smtp.auth, user: e.target.value }
                          }
                        })
                      }}
                    />
                    <PasswordInput
                      label="Password/App Password"
                      placeholder="Your password"
                      value={settings?.smtp?.auth?.pass || ''}
                      onChange={(e) => {
                        if (!settings) return
                        setSettings({
                          ...settings,
                          smtp: {
                            ...settings.smtp,
                            auth: { ...settings.smtp.auth, pass: e.target.value }
                          }
                        })
                      }}
                    />
                  </Group>
                </Stack>
              </Paper>

              {/* From Settings */}
              <Paper bg="gray.1" p="md" radius="md">
                <Text size="sm" fw={500} mb="md">Sender Information</Text>
                <Group grow>
                  <TextInput
                    label="From Name"
                    placeholder="Your Company Name"
                    value={settings?.from?.name || ''}
                    onChange={(e) => {
                      if (!settings) return
                      setSettings({
                        ...settings,
                        from: { ...settings.from, name: e.target.value }
                      })
                    }}
                  />
                  <TextInput
                    label="From Email"
                    placeholder="noreply@yourcompany.com"
                    value={settings?.from?.email || ''}
                    onChange={(e) => {
                      if (!settings) return
                      setSettings({
                        ...settings,
                        from: { ...settings.from, email: e.target.value }
                      })
                    }}
                  />
                </Group>
              </Paper>
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* Templates Tab */}
        <Tabs.Panel value="templates" pt="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section withBorder inheritPadding py="xs">
              <Group justify="space-between">
                <Group gap="sm">
                  <Box component={Icons.FiFileText} />
                  <Title order={4}>Email Templates</Title>
                </Group>
                <Button
                  leftSection={<Icons.FiPlus />}
                  onClick={newTemplate}
                >
                  New Template
                </Button>
              </Group>
            </Card.Section>

            <Stack gap="md" mt="md">
              {(templates || []).length === 0 ? (
                <Paper bg="gray.1" p="xl" radius="md" style={{ textAlign: 'center' }}>
                  <Text c="dimmed">No email templates found</Text>
                  <Text size="xs" c="dimmed" mt="xs">
                    Create your first template to get started
                  </Text>
                </Paper>
              ) : (
                (templates || []).map((template) => (
                  <Paper key={template.id} p="md" withBorder radius="md">
                    <Group justify="space-between" align="flex-start">
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Group gap="sm">
                          <Text fw={500}>{template.name}</Text>
                          <Badge size="xs" color={template.type === 'html' ? 'blue' : 'gray'}>
                            {template.type.toUpperCase()}
                          </Badge>
                        </Group>
                        <Text size="sm" c="dimmed">{template.subject}</Text>
                        <Text size="xs" c="dimmed">
                          Updated: {new Date(template.updatedAt).toLocaleDateString()}
                        </Text>
                      </Stack>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          size="sm"
                          onClick={() => editTemplate(template)}
                        >
                          <Icons.FiEdit />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Icons.FiTrash />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Paper>
                ))
              )}
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* Test Email Modal */}
      <Modal opened={testEmailModal} onClose={closeTestEmail} title="Send Test Email" size="md">
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
            <Button variant="light" onClick={closeTestEmail}>Cancel</Button>
            <Button onClick={sendTestEmail} leftSection={<Icons.FiSend />}>
              Send Test Email
            </Button>
          </Group>
        </Stack>
      </Modal>

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
            <Text size="sm" fw={500}>Content</Text>
            <Group gap="xs">
              <Button
                variant={previewMode ? 'light' : 'filled'}
                size="xs"
                onClick={() => setPreviewMode(false)}
              >
                Edit
              </Button>
              <Button
                variant={previewMode ? 'filled' : 'light'}
                size="xs"
                onClick={() => setPreviewMode(true)}
                disabled={templateType === 'text'}
              >
                Preview
              </Button>
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
              <Button variant="light" onClick={closeTemplate}>Cancel</Button>
              <Button onClick={saveTemplate} leftSection={<Icons.FiSave />}>
                {selectedTemplate ? 'Update' : 'Create'} Template
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>

      {/* Provider Setup Guide Modal */}
      <EmailProviderGuide opened={providerGuideModal} onClose={closeProviderGuide} />
    </Stack>
  )
}