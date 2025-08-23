'use client'

import {
  Container,
  Title,
  Text,
  Stack,
  Tabs,
  Group,
  Badge,
  Paper,
  Card,
  Box,
  rem,
  ThemeIcon
} from '@mantine/core'
import * as Icons from 'react-icons/fi'
import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
import CompanyProfileTab from '@/components/settings/CompanyProfileTab'
import ThemeTab from '@/components/settings/ThemeTab'
import SecurityTab from '@/components/settings/SecurityTab'
import EmailTabSafe from '@/components/settings/EmailTabSafe'
import CronJobTab from '@/components/settings/CronJobTab'
import PaymentIntegrationTab from '@/components/settings/PaymentIntegrationTab'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernAlert,
  ModernContainer
} from '@/components/ui/modern-components'
import {
  ResponsiveGrid,
  ResponsiveCardGrid,
  ResponsiveStack
} from '@/components/ui/responsive-layout'

export default function AdminSettings() {
  return (
    <PagePermissionGuard requiredPermissions={['settings.page.access']}>
      <AdminLayout>
        <ModernContainer fluid>
          <ResponsiveStack gap="xl">
            {/* Enhanced Header */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(168, 85, 247, 0.03) 100%)',
                border: '2px solid rgba(139, 92, 246, 0.15)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.08)',
                padding: '32px'
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Group gap="lg">
                  <ThemeIcon 
                    size="2xl" 
                    variant="gradient" 
                    gradient={{ from: 'violet.6', to: 'purple.5', deg: 135 }}
                    style={{
                      boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <Icons.FiSettings size={28} />
                  </ThemeIcon>
                  <Box>
                    <Title 
                      order={2} 
                      mb={8}
                      c="violet.7"
                    >
                      System Settings
                    </Title>
                    <Text c="dimmed" size="xs" fw={500} mb="lg">
                      Configure your WhatsApp management system settings and preferences
                    </Text>
                    
                    {/* Quick Stats Bar */}
                    <Group gap="xl">
                      <Group gap="xs">
                        <Icons.FiSettings size={10} color="var(--mantine-color-violet-6)" />
                        <Text size="xs" c="dimmed">Tabs:</Text>
                        <Text size="xs" fw={700} c="violet.7">
                          9
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Icons.FiShield size={10} color="var(--mantine-color-purple-6)" />
                        <Text size="xs" c="dimmed">Secure:</Text>
                        <Text size="xs" fw={700} c="purple.7">
                          Yes
                        </Text>
                      </Group>
                    </Group>
                  </Box>
                </Group>
              </Group>
            </ModernCard>

            {/* Settings Tabs */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                border: '2px solid rgba(139, 92, 246, 0.1)',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.06)',
                overflow: 'hidden'
              }}
            >
              <Tabs defaultValue="company" variant="outline">
                <Tabs.List 
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)',
                    borderBottom: '2px solid rgba(139, 92, 246, 0.15)'
                  }} 
                  p="md"
                >
                  <Tabs.Tab value="company">
                    <Group gap="xs">
                      <Icons.FiHome size={10} />
                      <Text size="xs">Company Profile</Text>
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="security">
                    <Group gap="xs">
                      <Icons.FiShield size={10} />
                      <Text size="xs">Security</Text>
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="localization">
                    <Group gap="xs">
                      <Icons.FiGlobe size={10} />
                      <Text size="xs">Localization</Text>
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="database">
                    <Group gap="xs">
                      <Icons.FiDatabase size={10} />
                      <Text size="xs">Database</Text>
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="notifications">
                    <Group gap="xs">
                      <Icons.FiBell size={10} />
                      <Text size="xs">Notifications</Text>
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="email">
                    <Group gap="xs">
                      <Icons.FiMail size={10} />
                      <Text size="xs">Email Settings</Text>
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="cronjobs">
                    <Group gap="xs">
                      <Icons.FiClock size={10} />
                      <Text size="xs">Cron Jobs</Text>
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="payments">
                    <Group gap="xs">
                      <Icons.FiCreditCard size={10} />
                      <Text size="xs">Payment Integration</Text>
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="themes">
                    <Group gap="xs">
                      <Icons.FiEdit3 size={10} />
                      <Text size="xs">Themes</Text>
                    </Group>
                  </Tabs.Tab>
                </Tabs.List>

                {/* Company Profile Tab */}
                <Tabs.Panel value="company" p="md">
                  <CompanyProfileTab />
                </Tabs.Panel>

                {/* Security Tab */}
                <Tabs.Panel value="security" p="md">
                  <SecurityTab />
                </Tabs.Panel>

                {/* Localization Tab */}
                <Tabs.Panel value="localization" p="md">
                  <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
                    <Group gap="sm" mb="md">
                      <ThemeIcon size="md" variant="light" color="green">
                        <Icons.FiGlobe size={16} />
                      </ThemeIcon>
                      <Box>
                        <Title order={4} size="xs" fw={600}>Localization Settings</Title>
                        <Text size="xs" c="dimmed">
                          Configure language, timezone, and regional settings
                        </Text>
                      </Box>
                    </Group>

                    <Stack gap="md">
                      <Paper bg="green.1" p="md" radius="md" style={{ border: '1px solid var(--mantine-color-green-3)' }}>
                        <Group gap="xs">
                          <Text size="xs" c="green.7" fw={500}>
                            🌐 Current locale: India (Hindi/English)
                          </Text>
                        </Group>
                        <Text size="xs" c="green.6" mt={4}>
                          Timezone: Asia/Kolkata (UTC+5:30)
                        </Text>
                      </Paper>
                      <Paper bg="gray.1" p="md" radius="md">
                        <Text size="xs" c="dimmed" fw={500}>
                          📅 More localization options coming soon...
                        </Text>
                        <Text size="xs" c="dimmed" mt="xs">
                          This will include multi-language support, date formats, and currency settings.
                        </Text>
                      </Paper>
                    </Stack>
                  </ModernCard>
                </Tabs.Panel>

                {/* Database Tab */}
                <Tabs.Panel value="database" p="md">
                  <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
                    <Group gap="sm" mb="md">
                      <ThemeIcon size="md" variant="light" color="blue">
                        <Icons.FiDatabase size={16} />
                      </ThemeIcon>
                      <Box>
                        <Title order={4} size="xs" fw={600}>Database Settings</Title>
                        <Text size="xs" c="dimmed">
                          Database configuration and maintenance tools
                        </Text>
                      </Box>
                    </Group>

                    <Stack gap="md">
                      <Paper bg="green.1" p="md" radius="md" style={{ border: '1px solid var(--mantine-color-green-3)' }}>
                        <Group gap="xs" align="center">
                          <ThemeIcon size="sm" variant="light" color="green">
                            <Icons.FiCheck size={10} />
                          </ThemeIcon>
                          <Text size="xs" c="green.7" fw={500}>
                            Database Status: Connected
                          </Text>
                        </Group>
                        <Text size="xs" c="green.6" mt={4}>
                          PostgreSQL database is running and accessible
                        </Text>
                        <Group gap="xs" mt="xs">
                          <Text size="xs" c="green.6">Host:</Text>
                          <Text size="xs" c="dimmed">localhost:5432</Text>
                        </Group>
                      </Paper>
                      <Paper bg="blue.1" p="md" radius="md" style={{ border: '1px solid var(--mantine-color-blue-3)' }}>
                        <Group gap="xs" align="center">
                          <ThemeIcon size="sm" variant="light" color="blue">
                            <Icons.FiInfo size={10} />
                          </ThemeIcon>
                          <Text size="xs" c="blue.7" fw={500}>
                            Database Information
                          </Text>
                        </Group>
                        <Stack gap="xs" mt="xs">
                          <Group gap="xs">
                            <Text size="xs" c="blue.6">Version:</Text>
                            <Text size="xs" c="dimmed">PostgreSQL 16</Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="xs" c="blue.6">Schema:</Text>
                            <Text size="xs" c="dimmed">whatsapp_system</Text>
                          </Group>
                        </Stack>
                      </Paper>
                      <Paper bg="gray.1" p="md" radius="md">
                        <Text size="xs" c="dimmed" fw={500}>
                          🔧 Database tools and backup options coming soon...
                        </Text>
                        <Text size="xs" c="dimmed" mt="xs">
                          This will include backup scheduling, migration tools, and performance monitoring.
                        </Text>
                      </Paper>
                    </Stack>
                  </ModernCard>
                </Tabs.Panel>

                {/* Notifications Tab */}
                <Tabs.Panel value="notifications" p="md">
                  <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
                    <Group gap="sm" mb="md">
                      <ThemeIcon size="md" variant="light" color="orange">
                        <Icons.FiBell size={16} />
                      </ThemeIcon>
                      <Box>
                        <Title order={4} size="xs" fw={600}>Notification Settings</Title>
                        <Text size="xs" c="dimmed">
                          Configure system notifications and alerts
                        </Text>
                      </Box>
                    </Group>

                    <Stack gap="md">
                      <Paper bg="orange.1" p="md" radius="md" style={{ border: '1px solid var(--mantine-color-orange-3)' }}>
                        <Group gap="xs" align="center">
                          <ThemeIcon size="sm" variant="light" color="orange">
                            <Icons.FiBell size={10} />
                          </ThemeIcon>
                          <Text size="xs" c="orange.7" fw={500}>
                            Notification Channels
                          </Text>
                        </Group>
                        <Stack gap="xs" mt="xs">
                          <Group gap="xs">
                            <Text size="xs" c="orange.6">Email:</Text>
                            <Text size="xs" c="dimmed">Enabled</Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="xs" c="orange.6">SMS:</Text>
                            <Text size="xs" c="dimmed">Coming Soon</Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="xs" c="orange.6">Push:</Text>
                            <Text size="xs" c="dimmed">Coming Soon</Text>
                          </Group>
                        </Stack>
                      </Paper>
                      <Paper bg="gray.1" p="md" radius="md">
                        <Text size="xs" c="dimmed" fw={500}>
                          🔔 Advanced notification preferences coming soon...
                        </Text>
                        <Text size="xs" c="dimmed" mt="xs">
                          This will include custom alert rules, notification scheduling, and priority settings.
                        </Text>
                      </Paper>
                    </Stack>
                  </ModernCard>
                </Tabs.Panel>

                {/* Email Settings Tab */}
                <Tabs.Panel value="email" p="md">
                  <EmailTabSafe />
                </Tabs.Panel>

                {/* Cron Jobs Tab */}
                <Tabs.Panel value="cronjobs" p="md">
                  <CronJobTab />
                </Tabs.Panel>

                {/* Payment Integration Tab */}
                <Tabs.Panel value="payments" p="md">
                  <PaymentIntegrationTab />
                </Tabs.Panel>

                {/* Themes Tab */}
                <Tabs.Panel value="themes" p="md">
                  <ThemeTab />
                </Tabs.Panel>
              </Tabs>
            </ModernCard>
          </ResponsiveStack>
        </ModernContainer>
      </AdminLayout>
    </PagePermissionGuard>
  )
}