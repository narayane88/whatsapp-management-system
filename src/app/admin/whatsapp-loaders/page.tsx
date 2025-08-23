'use client'

import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Button,
  Grid,
  Paper,
  Divider,
  Box,
  ThemeIcon,
} from '@mantine/core'
import { useState } from 'react'
import { FiLoader, FiMessageSquare, FiWifi } from 'react-icons/fi'
import WhatsAppLoader, { WhatsAppMessageLoader } from '@/components/ui/WhatsAppLoader'
import { WhatsAppSectionLoader } from '@/components/ui/WhatsAppPageLoader'
import WhatsAppPageLoader from '@/components/ui/WhatsAppPageLoader'
import { LoadingProvider, useLoading } from '@/components/providers/LoadingProvider'
import AdminLayout from '@/components/layout/AdminLayout'
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

function LoaderDemoContent() {
  const [showPageLoader, setShowPageLoader] = useState('')
  const { showLoading, hideLoading } = useLoading()

  const handleShowPageLoader = (variant: 'connecting' | 'loading' | 'sending' | 'custom') => {
    setShowPageLoader(variant)
    setTimeout(() => setShowPageLoader(''), 4000) // Auto hide after 4 seconds
  }

  const handleUseLoadingHook = (variant: 'connecting' | 'loading' | 'sending' | 'custom') => {
    showLoading(variant, undefined, true)
    setTimeout(() => hideLoading(), 3000) // Auto hide after 3 seconds
  }

  return (
    <ModernContainer size="xl" py="xl">
      <ResponsiveStack gap="xl">
        {/* Enhanced Header */}
        <ModernCard
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.03) 100%)',
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
                <FiLoader size={28} />
              </ThemeIcon>
              <Box>
                <Title 
                  order={2} 
                  mb={8}
                  c="violet.7"
                >
                  WhatsApp Loading Animations
                </Title>
                <Text c="dimmed" size="xs" fw={500} mb="lg">
                  Comprehensive collection of WhatsApp-themed loading animations for the application
                </Text>
                
                {/* Quick Stats Bar */}
                <Group gap="xl">
                  <Group gap="xs">
                    <FiLoader size={10} color="var(--mantine-color-violet-6)" />
                    <Text size="xs" c="dimmed">Components:</Text>
                    <Text size="xs" fw={700} c="violet.7">
                      6
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <FiMessageSquare size={10} color="var(--mantine-color-purple-6)" />
                    <Text size="xs" c="dimmed">Variants:</Text>
                    <Text size="xs" fw={700} c="purple.7">
                      5
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <FiWifi size={10} color="var(--mantine-color-indigo-6)" />
                    <Text size="xs" c="dimmed">Sizes:</Text>
                    <Text size="xs" fw={700} c="indigo.7">
                      3
                    </Text>
                  </Group>
                </Group>
              </Box>
            </Group>
          </Group>
        </ModernCard>

        {/* Component Loaders */}
        <ModernCard withBorder padding="xl">
          <Title order={3} mb="lg" size="xs" c="violet.7">Component Loaders</Title>
          
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder p="lg" style={{ textAlign: 'center', minHeight: 200 }}>
                <Text size="xs" fw={500} mb="md">Default Loader</Text>
                <WhatsAppLoader 
                  variant="default" 
                  message="Loading messages..." 
                  size="md" 
                />
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder p="lg" style={{ textAlign: 'center', minHeight: 200 }}>
                <Text size="xs" fw={500} mb="md">Typing Indicator</Text>
                <WhatsAppLoader 
                  variant="typing" 
                  message="Someone is typing..." 
                  size="md" 
                />
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder p="lg" style={{ textAlign: 'center', minHeight: 200 }}>
                <Text size="xs" fw={500} mb="md">Connecting</Text>
                <WhatsAppLoader 
                  variant="connecting" 
                  message="Establishing connection..." 
                  size="md" 
                />
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder p="lg" style={{ textAlign: 'center', minHeight: 200 }}>
                <Text size="xs" fw={500} mb="md">Sending Message</Text>
                <WhatsAppLoader 
                  variant="sending" 
                  message="Sending message..." 
                  size="md" 
                />
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder p="lg" style={{ textAlign: 'center', minHeight: 200 }}>
                <Text size="xs" fw={500} mb="md">Compact Loader</Text>
                <WhatsAppLoader 
                  variant="compact" 
                  message="Loading..." 
                />
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder p="lg" style={{ textAlign: 'center', minHeight: 200 }}>
                <Text size="xs" fw={500} mb="md">Message Bubble Loader</Text>
                <WhatsAppMessageLoader 
                  messages={[
                    'Initializing WhatsApp...',
                    'Connecting to servers...',
                    'Loading conversations...',
                    'Ready!'
                  ]}
                  currentIndex={1}
                />
              </Paper>
            </Grid.Col>
          </Grid>
        </ModernCard>

        {/* Size Variations */}
        <ModernCard withBorder padding="xl">
          <Title order={3} mb="lg" size="xs" c="violet.7">Size Variations</Title>
          
          <Group justify="space-around" align="center">
            <Box style={{ textAlign: 'center' }}>
              <Text size="xs" mb="md">Small</Text>
              <WhatsAppLoader variant="default" size="sm" message="Small loader" />
            </Box>
            
            <Box style={{ textAlign: 'center' }}>
              <Text size="xs" mb="md">Medium</Text>
              <WhatsAppLoader variant="default" size="md" message="Medium loader" />
            </Box>
            
            <Box style={{ textAlign: 'center' }}>
              <Text size="xs" mb="md">Large</Text>
              <WhatsAppLoader variant="default" size="lg" message="Large loader" />
            </Box>
          </Group>
        </ModernCard>

        {/* Section Loaders */}
        <ModernCard withBorder padding="xl">
          <Title order={3} mb="lg" size="xs" c="violet.7">Section Loaders</Title>
          
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder>
                <WhatsAppSectionLoader 
                  title="Loading devices..." 
                  subtitle="Connecting to WhatsApp servers" 
                />
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder>
                <WhatsAppSectionLoader 
                  title="Processing..." 
                  variant="compact"
                />
              </Paper>
            </Grid.Col>
          </Grid>
        </ModernCard>

        {/* Full Page Loaders */}
        <ModernCard withBorder padding="xl">
          <Title order={3} mb="lg" size="xs" c="violet.7">Full Page Loaders</Title>
          <Text size="xs" c="dimmed" mb="lg">
            Click buttons to preview full-screen loading animations (auto-hides after 4 seconds)
          </Text>
          
          <Group>
            <ModernButton 
              onClick={() => handleShowPageLoader('connecting')}
              variant="outline"
              color="green"
              size="xs"
            >
              Show Connecting Loader
            </ModernButton>
            
            <ModernButton 
              onClick={() => handleShowPageLoader('loading')}
              variant="outline"
              color="blue"
              size="xs"
            >
              Show Loading Loader
            </ModernButton>
            
            <ModernButton 
              onClick={() => handleShowPageLoader('sending')}
              variant="outline"
              color="teal"
              size="xs"
            >
              Show Sending Loader
            </ModernButton>
            
            <ModernButton 
              onClick={() => handleShowPageLoader('custom')}
              variant="outline"
              color="violet"
              size="xs"
            >
              Show Custom Loader
            </ModernButton>
          </Group>
        </ModernCard>

        {/* Loading Provider Hook */}
        <ModernCard withBorder padding="xl">
          <Title order={3} mb="lg" size="xs" c="violet.7">Loading Provider Hook</Title>
          <Text size="xs" c="dimmed" mb="lg">
            Use the useLoading hook for programmatic loading control (auto-hides after 3 seconds)
          </Text>
          
          <Group>
            <ModernButton 
              onClick={() => handleUseLoadingHook('connecting')}
              variant="filled"
              color="green"
              size="xs"
            >
              Hook: Connecting
            </ModernButton>
            
            <ModernButton 
              onClick={() => handleUseLoadingHook('loading')}
              variant="filled"
              color="blue"
              size="xs"
            >
              Hook: Loading
            </ModernButton>
            
            <ModernButton 
              onClick={() => handleUseLoadingHook('sending')}
              variant="filled"
              color="teal"
              size="xs"
            >
              Hook: Sending
            </ModernButton>
          </Group>
        </ModernCard>

        {/* Code Examples */}
        <ModernCard withBorder padding="xl">
          <Title order={3} mb="lg" size="xs" c="violet.7">Usage Examples</Title>
          
          <Stack gap="md">
            <Box>
              <Text size="xs" fw={500} mb="xs">Basic Component Usage:</Text>
              <Text size="xs" ff="monospace" c="dimmed">
                {`<WhatsAppLoader variant="connecting" message="Connecting..." size="md" />`}
              </Text>
            </Box>
            
            <Divider />
            
            <Box>
              <Text size="xs" fw={500} mb="xs">Section Loader:</Text>
              <Text size="xs" ff="monospace" c="dimmed">
                {`<WhatsAppSectionLoader title="Loading devices..." subtitle="Please wait" />`}
              </Text>
            </Box>
            
            <Divider />
            
            <Box>
              <Text size="xs" fw={500} mb="xs">Loading Hook:</Text>
              <Text size="xs" ff="monospace" c="dimmed">
                {`const { showLoading, hideLoading } = useLoading()
showLoading('connecting', 'Custom message', true)`}
              </Text>
            </Box>
          </Stack>
        </ModernCard>
      </ResponsiveStack>

      {/* Render page loaders */}
      {showPageLoader && (
        <WhatsAppPageLoader
          variant={showPageLoader as any}
          customMessage={showPageLoader === 'custom' ? 'Custom loading message...' : undefined}
          showProgress={showPageLoader === 'loading'}
          fullScreen={true}
        />
      )}
    </ModernContainer>
  )
}

export default function WhatsAppLoadersPage() {
  return (
    <LoadingProvider>
      <AdminLayout>
        <LoaderDemoContent />
      </AdminLayout>
    </LoadingProvider>
  )
}