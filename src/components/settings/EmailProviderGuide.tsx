'use client'

import {
  Modal,
  Stack,
  Title,
  Text,
  Tabs,
  Paper,
  Code,
  List,
  ThemeIcon,
  Group,
  Badge,
  Anchor
} from '@mantine/core'
import * as Icons from 'react-icons/fi'

interface EmailProviderGuideProps {
  opened: boolean
  onClose: () => void
}

export default function EmailProviderGuide({ opened, onClose }: EmailProviderGuideProps) {
  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Email Provider Setup Guide" 
      size="lg"
      styles={{ body: { padding: 0 } }}
    >
      <Tabs defaultValue="gmail" variant="outline">
        <Tabs.List p="md" bg="gray.1">
          <Tabs.Tab value="gmail">📧 Gmail</Tabs.Tab>
          <Tabs.Tab value="yahoo">📧 Yahoo</Tabs.Tab>
          <Tabs.Tab value="outlook">📧 Outlook</Tabs.Tab>
          <Tabs.Tab value="business">💼 Business</Tabs.Tab>
          <Tabs.Tab value="enterprise">☁️ Enterprise</Tabs.Tab>
        </Tabs.List>

        {/* Gmail Setup */}
        <Tabs.Panel value="gmail" p="md">
          <Stack gap="md">
            <Group gap="sm">
              <ThemeIcon color="red" size="lg">
                <Icons.FiMail />
              </ThemeIcon>
              <div>
                <Title order={4}>Gmail Setup</Title>
                <Text size="sm" c="dimmed">Configure Gmail with App Password</Text>
              </div>
            </Group>

            <Paper bg="red.1" p="md" radius="md">
              <Text size="sm" fw={500} c="red.7" mb="xs">⚠️ Important Security Note</Text>
              <Text size="xs" c="red.6">
                Never use your regular Gmail password. Always use App Passwords for better security.
              </Text>
            </Paper>

            <div>
              <Text size="sm" fw={500} mb="xs">Step-by-Step Instructions:</Text>
              <List
                spacing="xs"
                size="sm"
                icon={
                  <ThemeIcon color="blue" size={18} radius="xl">
                    <Icons.FiCheck size="0.8rem" />
                  </ThemeIcon>
                }
              >
                <List.Item>
                  Go to your <Anchor href="https://myaccount.google.com" target="_blank">Google Account</Anchor>
                </List.Item>
                <List.Item>
                  Click on "Security" in the left navigation
                </List.Item>
                <List.Item>
                  Enable "2-Step Verification" if not already enabled
                </List.Item>
                <List.Item>
                  Under "2-Step Verification", click "App passwords"
                </List.Item>
                <List.Item>
                  Select "Mail" from the app dropdown
                </List.Item>
                <List.Item>
                  Copy the generated 16-character password
                </List.Item>
                <List.Item>
                  Use this password in the email settings
                </List.Item>
              </List>
            </div>

            <Paper bg="gray.1" p="md" radius="md">
              <Text size="xs" fw={500} mb="xs">Configuration Details:</Text>
              <Code block>
SMTP Host: smtp.gmail.com
Port: 587
Security: STARTTLS
Username: your-email@gmail.com
Password: [16-character app password]
              </Code>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Yahoo Setup */}
        <Tabs.Panel value="yahoo" p="md">
          <Stack gap="md">
            <Group gap="sm">
              <ThemeIcon color="purple" size="lg">
                <Icons.FiMail />
              </ThemeIcon>
              <div>
                <Title order={4}>Yahoo Mail Setup</Title>
                <Text size="sm" c="dimmed">Configure Yahoo with App Password</Text>
              </div>
            </Group>

            <div>
              <Text size="sm" fw={500} mb="xs">Step-by-Step Instructions:</Text>
              <List
                spacing="xs"
                size="sm"
                icon={
                  <ThemeIcon color="purple" size={18} radius="xl">
                    <Icons.FiCheck size="0.8rem" />
                  </ThemeIcon>
                }
              >
                <List.Item>
                  Go to <Anchor href="https://login.yahoo.com" target="_blank">Yahoo Account Security</Anchor>
                </List.Item>
                <List.Item>
                  Enable "Two-step verification" if not already enabled
                </List.Item>
                <List.Item>
                  Click on "Generate app password"
                </List.Item>
                <List.Item>
                  Select "Other app" and enter "WhatsApp Business"
                </List.Item>
                <List.Item>
                  Copy the generated password
                </List.Item>
                <List.Item>
                  Use this password in the email settings
                </List.Item>
              </List>
            </div>

            <Paper bg="gray.1" p="md" radius="md">
              <Text size="xs" fw={500} mb="xs">Configuration Details:</Text>
              <Code block>
SMTP Host: smtp.mail.yahoo.com
Port: 587
Security: STARTTLS
Username: your-email@yahoo.com
Password: [generated app password]
              </Code>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Outlook Setup */}
        <Tabs.Panel value="outlook" p="md">
          <Stack gap="md">
            <Group gap="sm">
              <ThemeIcon color="blue" size="lg">
                <Icons.FiMail />
              </ThemeIcon>
              <div>
                <Title order={4}>Outlook/Live/Hotmail Setup</Title>
                <Text size="sm" c="dimmed">Microsoft email services</Text>
              </div>
            </Group>

            <div>
              <Text size="sm" fw={500} mb="xs">Step-by-Step Instructions:</Text>
              <List
                spacing="xs"
                size="sm"
                icon={
                  <ThemeIcon color="blue" size={18} radius="xl">
                    <Icons.FiCheck size="0.8rem" />
                  </ThemeIcon>
                }
              >
                <List.Item>
                  Go to <Anchor href="https://account.microsoft.com/security" target="_blank">Microsoft Account Security</Anchor>
                </List.Item>
                <List.Item>
                  Enable "Two-step verification"
                </List.Item>
                <List.Item>
                  Go to "App passwords" section
                </List.Item>
                <List.Item>
                  Create a new app password for "Mail"
                </List.Item>
                <List.Item>
                  Copy the generated password
                </List.Item>
                <List.Item>
                  Use your full email address as username
                </List.Item>
              </List>
            </div>

            <Paper bg="gray.1" p="md" radius="md">
              <Text size="xs" fw={500} mb="xs">Configuration Details:</Text>
              <Code block>
SMTP Host: smtp-mail.outlook.com
Port: 587
Security: STARTTLS
Username: your-email@outlook.com
Password: [generated app password]
              </Code>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Business Email */}
        <Tabs.Panel value="business" p="md">
          <Stack gap="md">
            <Group gap="sm">
              <ThemeIcon color="teal" size="lg">
                <Icons.FiBriefcase />
              </ThemeIcon>
              <div>
                <Title order={4}>Business Email Providers</Title>
                <Text size="sm" c="dimmed">Professional email services</Text>
              </div>
            </Group>

            <div>
              <Title order={5} mb="sm">Zoho Mail</Title>
              <Paper bg="gray.1" p="md" radius="md" mb="md">
                <Code block>
SMTP Host: smtp.zoho.com
Port: 587
Security: STARTTLS
Username: your-email@yourdomain.com
Password: [your zoho password]
                </Code>
              </Paper>

              <Title order={5} mb="sm">Google Workspace (G Suite)</Title>
              <Paper bg="gray.1" p="md" radius="md" mb="md">
                <Code block>
SMTP Host: smtp.gmail.com
Port: 587
Security: STARTTLS
Username: your-email@yourdomain.com
Password: [app password - same as Gmail setup]
                </Code>
              </Paper>

              <Title order={5} mb="sm">Microsoft 365</Title>
              <Paper bg="gray.1" p="md" radius="md">
                <Code block>
SMTP Host: smtp.office365.com
Port: 587
Security: STARTTLS
Username: your-email@yourdomain.com
Password: [app password - same as Outlook setup]
                </Code>
              </Paper>
            </div>
          </Stack>
        </Tabs.Panel>

        {/* Enterprise Services */}
        <Tabs.Panel value="enterprise" p="md">
          <Stack gap="md">
            <Group gap="sm">
              <ThemeIcon color="orange" size="lg">
                <Icons.FiCloud />
              </ThemeIcon>
              <div>
                <Title order={4}>Enterprise Email Services</Title>
                <Text size="sm" c="dimmed">High-volume email delivery</Text>
              </div>
            </Group>

            <div>
              <Title order={5} mb="sm">Amazon SES</Title>
              <Paper bg="gray.1" p="md" radius="md" mb="md">
                <Code block>
SMTP Host: email-smtp.us-east-1.amazonaws.com
Port: 587
Security: STARTTLS
Username: [SMTP Username from AWS Console]
Password: [SMTP Password from AWS Console]
                </Code>
                <Text size="xs" c="dimmed" mt="xs">
                  Requires AWS SES setup and SMTP credentials generation
                </Text>
              </Paper>

              <Title order={5} mb="sm">SendGrid</Title>
              <Paper bg="gray.1" p="md" radius="md" mb="md">
                <Code block>
SMTP Host: smtp.sendgrid.net
Port: 587
Security: STARTTLS
Username: apikey
Password: [SendGrid API Key]
                </Code>
                <Text size="xs" c="dimmed" mt="xs">
                  Username is literally "apikey", password is your SendGrid API key
                </Text>
              </Paper>

              <Title order={5} mb="sm">Mailgun</Title>
              <Paper bg="gray.1" p="md" radius="md">
                <Code block>
SMTP Host: smtp.mailgun.org
Port: 587
Security: STARTTLS
Username: [Mailgun SMTP Username]
Password: [Mailgun SMTP Password]
                </Code>
                <Text size="xs" c="dimmed" mt="xs">
                  Get SMTP credentials from your Mailgun domain settings
                </Text>
              </Paper>
            </div>

            <Paper bg="blue.1" p="md" radius="md">
              <Text size="sm" fw={500} c="blue.7" mb="xs">💡 Enterprise Benefits</Text>
              <List size="xs" c="blue.6">
                <List.Item>Higher sending limits</List.Item>
                <List.Item>Better deliverability rates</List.Item>
                <List.Item>Advanced analytics</List.Item>
                <List.Item>Dedicated IP addresses</List.Item>
                <List.Item>24/7 support</List.Item>
              </List>
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}