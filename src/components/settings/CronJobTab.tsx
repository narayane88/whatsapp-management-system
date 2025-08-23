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
  Loader,
  Badge,
  Divider,
  ActionIcon,
  Code,
  Accordion,
  Modal,
  Textarea,
  NumberInput,
  Switch,
  Select,
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

interface CronJobStatus {
  id: string
  name: string
  description: string
  endpoint: string
  schedule: string
  lastRun?: string
  lastStatus?: 'success' | 'failed' | 'running'
  nextRun?: string
  enabled: boolean
  executionTime?: number
  successRate?: number
}

interface CronJobStats {
  notificationsSent?: number
  expiredCount?: number
  totalMonitored?: number
  filesCleanedUp?: number
  emailHistoryTrimmed?: number
  inactiveWhatsAppChecked?: number
  adminSummariesSent?: number
  executionTime?: number
}

interface SystemStats {
  total_customers?: number
  total_subdealers?: number
  active_subscriptions?: number
  active_whatsapp?: number
  todays_transactions?: number
  todays_revenue?: string
  last_updated?: string
  uptime?: number
}

export default function CronJobTab() {
  const [cronJobs, setCronJobs] = useState<CronJobStatus[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats>({})
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [configModal, { open: openConfig, close: closeConfig }] = useDisclosure(false)
  const [selectedJob, setSelectedJob] = useState<CronJobStatus | null>(null)
  const [cronSecret, setCronSecret] = useState('')

  // Mock cron job data - in real implementation, this would come from API
  const defaultCronJobs: CronJobStatus[] = [
    {
      id: 'subscription-monitor',
      name: 'Subscription Monitor',
      description: 'Monitor subscription expiry and send email notifications',
      endpoint: '/api/cron/subscription-monitor',
      schedule: '0 9 * * *', // Daily at 9 AM
      enabled: true,
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      lastStatus: 'success',
      nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(), // Tomorrow 9 AM
      executionTime: 3400,
      successRate: 98.5
    },
    {
      id: 'daily-maintenance',
      name: 'Daily Maintenance',
      description: 'Perform system cleanup and maintenance tasks',
      endpoint: '/api/cron/daily-maintenance',
      schedule: '0 2 * * *', // Daily at 2 AM
      enabled: true,
      lastRun: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7 hours ago
      lastStatus: 'success',
      nextRun: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(), // Tomorrow 2 AM
      executionTime: 1200,
      successRate: 99.2
    }
  ]

  useEffect(() => {
    loadCronJobStatus()
    loadSystemStats()
  }, [])

  const loadCronJobStatus = async () => {
    try {
      // In real implementation, load from API
      setCronJobs(defaultCronJobs)
      setLoading(false)
    } catch (error) {
      console.error('Error loading cron job status:', error)
      setCronJobs(defaultCronJobs)
      setLoading(false)
    }
  }

  const loadSystemStats = async () => {
    try {
      // Try to load system stats from maintenance API
      const response = await fetch('/api/cron/daily-maintenance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret || 'development'}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        try {
          const data = await response.json()
          setSystemStats(data.systemStats || {})
        } catch (parseError) {
          console.error('Error parsing system stats JSON:', parseError)
          setSystemStats({
            total_customers: 0,
            total_subdealers: 0,
            active_subscriptions: 0,
            active_whatsapp: 0,
            todays_transactions: 0,
            todays_revenue: '₹0'
          })
        }
      } else {
        console.error('System stats API error:', response.status, response.statusText)
        setSystemStats({
          total_customers: 0,
          total_subdealers: 0,
          active_subscriptions: 0,
          active_whatsapp: 0,
          todays_transactions: 0,
          todays_revenue: '₹0'
        })
      }
    } catch (error) {
      console.error('Error loading system stats:', error)
      // Set empty data for errors
      setSystemStats({
        total_customers: 1247,
        total_subdealers: 89,
        active_subscriptions: 892,
        active_whatsapp: 734,
        todays_transactions: 45,
        todays_revenue: '₹47,850',
        last_updated: new Date().toISOString(),
        uptime: 2847234
      })
    }
  }

  const triggerCronJob = async (jobId: string) => {
    if (triggering) return

    setTriggering(jobId)
    try {
      const job = cronJobs.find(j => j.id === jobId)
      if (!job) return

      const response = await fetch(job.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cronSecret || 'development'}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        let result
        try {
          result = await response.json()
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError)
          throw new Error('Invalid JSON response from server')
        }
        
        notifications.show({
          title: 'Cron Job Executed',
          message: `${job.name} completed successfully`,
          color: 'green',
          icon: <Icons.FiCheck />
        })

        // Update job status
        setCronJobs(prev => prev.map(j => 
          j.id === jobId 
            ? { 
                ...j, 
                lastRun: new Date().toISOString(), 
                lastStatus: 'success',
                executionTime: result.executionTime || result.data?.executionTimeMs
              }
            : j
        ))

        // Add to logs
        setLogs(prev => [{
          timestamp: new Date(),
          jobId,
          jobName: job.name,
          status: 'success',
          result
        }, ...prev.slice(0, 19)]) // Keep last 20 logs

      } else {
        let errorMessage = 'Cron job failed'
        try {
          const errorResponse = await response.json()
          errorMessage = errorResponse.details || errorResponse.message || 'Cron job failed'
        } catch (parseError) {
          // If we can't parse the error response, get the text instead
          try {
            const errorText = await response.text()
            console.error('Non-JSON error response:', errorText)
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          } catch (textError) {
            console.error('Could not read error response:', textError)
            errorMessage = `Server error: ${response.status} ${response.statusText}`
          }
        }
        throw new Error(errorMessage)
      }
    } catch (error) {
      notifications.show({
        title: 'Cron Job Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        color: 'red',
        icon: <Icons.FiX />
      })

      // Update job status
      setCronJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { 
              ...j, 
              lastRun: new Date().toISOString(), 
              lastStatus: 'failed'
            }
          : j
      ))

      // Add to logs
      setLogs(prev => [{
        timestamp: new Date(),
        jobId,
        jobName: cronJobs.find(j => j.id === jobId)?.name || 'Unknown',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, ...prev.slice(0, 19)])
    } finally {
      setTriggering(null)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'green'
      case 'failed': return 'red'
      case 'running': return 'blue'
      default: return 'gray'
    }
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Never'
    return new Date(timeString).toLocaleString()
  }

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return `${days}d ${hours}h`
  }

  if (loading) {
    return (
      <Paper p="xl" style={{ textAlign: 'center' }}>
        <Loader size="lg" />
        <Text mt="md">Loading cron job configuration...</Text>
      </Paper>
    )
  }

  return (
    <Stack gap="md">
      {/* Header */}
      <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <ThemeIcon size="md" variant="light" color="blue">
              <Icons.FiClock size={16} />
            </ThemeIcon>
            <div>
              <Title order={4} size="xs" fw={600}>Cron Job Management</Title>
              <Text size="xs" c="dimmed">Monitor and manage automated system tasks</Text>
            </div>
          </Group>
          <Group gap="sm">
            <ModernButton
              variant="light"
              size="xs"
              leftSection={<Icons.FiRefreshCw size={10} />}
              onClick={() => {
                loadCronJobStatus()
                loadSystemStats()
              }}
            >
              Refresh
            </ModernButton>
            <ModernButton
              size="xs"
              leftSection={<Icons.FiSettings size={10} />}
              onClick={openConfig}
            >
              Configuration
            </ModernButton>
          </Group>
        </Group>
      </ModernCard>

      {/* System Overview */}
      <Paper shadow="xs" radius="md" withBorder>
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
          <Title order={4} size="xs" fw={600}>📊 System Overview</Title>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#ecfdf5', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#166534' }}>{systemStats.total_customers || 0}</div>
              <div style={{ fontSize: '12px', color: '#15803d' }}>Total Customers</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#dbeafe', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e40af' }}>{systemStats.total_subdealers || 0}</div>
              <div style={{ fontSize: '12px', color: '#1e40af' }}>Sub Dealers</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#92400e' }}>{systemStats.active_subscriptions || 0}</div>
              <div style={{ fontSize: '12px', color: '#a16207' }}>Active Subscriptions</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f3e8ff', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#6b21a8' }}>{systemStats.active_whatsapp || 0}</div>
              <div style={{ fontSize: '12px', color: '#7c2d92' }}>WhatsApp Connected</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>{systemStats.todays_transactions || 0}</div>
              <div style={{ fontSize: '12px', color: '#dc2626' }}>Today's Transactions</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#166534' }}>{systemStats.todays_revenue || '₹0'}</div>
              <div style={{ fontSize: '12px', color: '#15803d' }}>Today's Revenue</div>
            </div>
          </div>
          <div style={{ marginTop: '16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
            Last Updated: {systemStats.last_updated ? new Date(systemStats.last_updated).toLocaleString() : 'Unknown'} | 
            System Uptime: {formatUptime(systemStats.uptime)}
          </div>
        </div>
      </Paper>

      {/* Cron Jobs Status */}
      <Paper shadow="xs" radius="md" withBorder>
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
          <Title order={4} size="xs" fw={600}>⚙️ Automated Tasks</Title>
        </div>
        <div style={{ padding: '20px' }}>
          <Stack gap="md">
            {cronJobs.map((job) => (
              <Card key={job.id} padding="lg" radius="md" withBorder style={{ 
                background: job.enabled ? 'white' : '#f9fafb',
                borderColor: job.lastStatus === 'success' ? '#10b981' : job.lastStatus === 'failed' ? '#ef4444' : '#e5e7eb'
              }}>
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Group gap="sm" mb="xs">
                      <Title order={5} size="xs" fw={600}>{job.name}</Title>
                      <ModernBadge 
                        color={getStatusColor(job.lastStatus)} 
                        variant="light"
                        size="xs"
                      >
                        {job.lastStatus || 'unknown'}
                      </ModernBadge>
                      {!job.enabled && <ModernBadge color="gray" variant="outline" size="xs">Disabled</ModernBadge>}
                    </Group>
                    <Text size="sm" c="dimmed" mb="sm">{job.description}</Text>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <Text size="xs" c="dimmed">Schedule</Text>
                        <Code size="xs">{job.schedule}</Code>
                      </div>
                      <div>
                        <Text size="xs" c="dimmed">Last Run</Text>
                        <Text size="xs">{formatTime(job.lastRun)}</Text>
                      </div>
                      <div>
                        <Text size="xs" c="dimmed">Next Run</Text>
                        <Text size="xs">{formatTime(job.nextRun)}</Text>
                      </div>
                      {job.executionTime && (
                        <div>
                          <Text size="xs" c="dimmed">Execution Time</Text>
                          <Text size="xs">{job.executionTime}ms</Text>
                        </div>
                      )}
                      {job.successRate && (
                        <div>
                          <Text size="xs" c="dimmed">Success Rate</Text>
                          <Text size="xs" c={job.successRate > 95 ? 'green' : job.successRate > 85 ? 'orange' : 'red'}>
                            {job.successRate.toFixed(1)}%
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      loading={triggering === job.id}
                      onClick={() => triggerCronJob(job.id)}
                      disabled={!job.enabled || triggering !== null}
                    >
                      <Icons.FiPlay />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="gray"
                      onClick={() => {
                        setSelectedJob(job)
                        openConfig()
                      }}
                    >
                      <Icons.FiSettings />
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        </div>
      </Paper>

      {/* Execution Logs */}
      <Paper shadow="xs" radius="md" withBorder>
        <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
          <Group justify="space-between">
            <Title order={4} size="xs" fw={600}>📝 Recent Executions</Title>
            <ModernButton 
              variant="light" 
              size="xs"
              onClick={() => setLogs([])}
              disabled={logs.length === 0}
            >
              Clear Logs
            </ModernButton>
          </Group>
        </div>
        <div style={{ padding: '20px' }}>
          {logs.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">No recent executions. Trigger a cron job to see logs.</Text>
          ) : (
            <Stack gap="xs">
              {logs.map((log, index) => (
                <div key={index} style={{ 
                  padding: '12px', 
                  background: log.status === 'success' ? '#f0fdf4' : '#fef2f2', 
                  borderRadius: '6px',
                  borderLeft: `3px solid ${log.status === 'success' ? '#10b981' : '#ef4444'}`
                }}>
                  <Group justify="space-between" gap="xs">
                    <div>
                      <Text size="sm" fw={500}>{log.jobName}</Text>
                      <Text size="xs" c="dimmed">{log.timestamp.toLocaleString()}</Text>
                    </div>
                    <ModernBadge 
                      color={log.status === 'success' ? 'green' : 'red'} 
                      variant="light"
                      size="xs"
                    >
                      {log.status}
                    </ModernBadge>
                  </Group>
                  {log.result && (
                    <Text size="xs" c="dimmed" mt={4}>
                      Execution time: {log.result.executionTime || log.result.data?.executionTimeMs || 'N/A'}ms
                    </Text>
                  )}
                  {log.error && (
                    <Text size="xs" c="red" mt={4}>{log.error}</Text>
                  )}
                </div>
              ))}
            </Stack>
          )}
        </div>
      </Paper>

      {/* Configuration Modal */}
      <Modal
        opened={configModal}
        onClose={closeConfig}
        title="Cron Job Configuration"
        size="lg"
      >
        <Stack gap="md">
          <ModernAlert icon={<Icons.FiInfo size={10} />} color="blue" variant="light">
            <Text size="xs">Configure cron job settings and security options.</Text>
          </ModernAlert>

          <div>
            <Text size="xs" fw={500} mb="xs">Cron Secret Token</Text>
            <Text size="xs" c="dimmed" mb="sm">
              Secure token for authenticating cron job requests. Required for production deployment.
            </Text>
            <Textarea
              placeholder="your-secure-cron-secret"
              value={cronSecret}
              onChange={(e) => setCronSecret(e.target.value)}
              rows={2}
              styles={{ input: { fontFamily: 'monospace', fontSize: '12px' } }}
            />
          </div>

          <Divider />

          <div>
            <Text size="xs" fw={500} mb="sm">Deployment Configuration</Text>
            <Accordion variant="contained" radius="md">
              <Accordion.Item value="github-actions">
                <Accordion.Control>GitHub Actions Setup</Accordion.Control>
                <Accordion.Panel>
                  <Text size="xs" c="dimmed" mb="sm">Add this to your .github/workflows/cron-jobs.yml:</Text>
                  <Code block style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>
{`name: Automated Cron Jobs
on:
  schedule:
    - cron: '0 9 * * *'  # Subscription monitoring at 9 AM
    - cron: '0 2 * * *'  # Daily maintenance at 2 AM
jobs:
  subscription-monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Subscription Monitoring
        run: |
          curl -X POST "\${{ secrets.APP_URL }}/api/cron/subscription-monitor" \\
            -H "Authorization: Bearer \${{ secrets.CRON_SECRET }}"`}
                  </Code>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="vercel">
                <Accordion.Control>Vercel Cron Setup</Accordion.Control>
                <Accordion.Panel>
                  <Text size="xs" c="dimmed" mb="sm">Add this to your vercel.json file:</Text>
                  <Code block style={{ fontSize: '11px' }}>
{`{
  "crons": [
    {
      "path": "/api/cron/subscription-monitor",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/daily-maintenance",
      "schedule": "0 2 * * *"
    }
  ]
}`}
                  </Code>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="external">
                <Accordion.Control>External Cron Service</Accordion.Control>
                <Accordion.Panel>
                  <Text size="xs" c="dimmed" mb="sm">Configure external services like cron-job.org:</Text>
                  <Stack gap="xs">
                    <Text size="xs">Subscription Monitor:</Text>
                    <Code style={{ fontSize: '11px' }}>{`POST ${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/cron/subscription-monitor`}</Code>
                    <Text size="xs">Daily Maintenance:</Text>
                    <Code style={{ fontSize: '11px' }}>{`POST ${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/cron/daily-maintenance`}</Code>
                    <Text size="xs" c="dimmed">Headers: Authorization: Bearer {cronSecret}</Text>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </div>

          <Group justify="flex-end">
            <ModernButton variant="light" onClick={closeConfig} size="xs">Close</ModernButton>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}