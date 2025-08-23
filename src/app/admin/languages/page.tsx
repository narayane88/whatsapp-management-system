'use client'

import {
  Box,
  Title,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  Badge,
  Card,
  SimpleGrid,
  ActionIcon,
  Modal,
  Switch,
  Code,
  Container,
  Progress,
  Select,
  ThemeIcon,
} from '@mantine/core'
import { FiPlus, FiEdit3, FiTrash2, FiGlobe, FiCheck, FiUpload } from 'react-icons/fi'
import { useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import PagePermissionGuard from '@/components/auth/PagePermissionGuard'
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

export default function LanguagesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const languages = [
    {
      id: 1,
      name: 'English',
      code: 'en',
      nativeName: 'English',
      flag: '🇺🇸',
      status: 'Active',
      isDefault: true,
      completeness: 100,
      totalKeys: 450,
      translatedKeys: 450,
      lastUpdated: '2024-08-01',
      contributors: ['admin']
    },
    {
      id: 2,
      name: 'Spanish',
      code: 'es',
      nativeName: 'Español',
      flag: '🇪🇸',
      status: 'Active',
      isDefault: false,
      completeness: 95,
      totalKeys: 450,
      translatedKeys: 427,
      lastUpdated: '2024-07-28',
      contributors: ['maria.rodriguez']
    },
    {
      id: 3,
      name: 'French',
      code: 'fr',
      nativeName: 'Français',
      flag: '🇫🇷',
      status: 'Active',
      isDefault: false,
      completeness: 88,
      totalKeys: 450,
      translatedKeys: 396,
      lastUpdated: '2024-07-25',
      contributors: ['jean.dupont']
    },
    {
      id: 4,
      name: 'German',
      code: 'de',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      status: 'Draft',
      isDefault: false,
      completeness: 45,
      totalKeys: 450,
      translatedKeys: 203,
      lastUpdated: '2024-07-20',
      contributors: ['hans.mueller', 'admin']
    },
    {
      id: 5,
      name: 'Chinese',
      code: 'zh',
      nativeName: '中文',
      flag: '🇨🇳',
      status: 'Active',
      isDefault: false,
      completeness: 92,
      totalKeys: 450,
      translatedKeys: 414,
      lastUpdated: '2024-07-30',
      contributors: ['li.wei']
    },
    {
      id: 6,
      name: 'Arabic',
      code: 'ar',
      nativeName: 'العربية',
      flag: '🇸🇦',
      status: 'Draft',
      isDefault: false,
      completeness: 30,
      totalKeys: 450,
      translatedKeys: 135,
      lastUpdated: '2024-07-15',
      contributors: ['ahmed.hassan']
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'green'
      case 'Draft': return 'orange'
      case 'Inactive': return 'gray'
      default: return 'gray'
    }
  }

  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 90) return 'green'
    if (completeness >= 70) return 'orange'
    return 'red'
  }

  const totalLanguages = languages.length
  const activeLanguages = languages.filter(l => l.status === 'Active').length
  const averageCompleteness = Math.round(
    languages.reduce((sum, l) => sum + l.completeness, 0) / languages.length
  )
  const totalKeys = languages[0]?.totalKeys || 0

  return (
    <PagePermissionGuard requiredPermissions={['languages.page.access']}>
      <AdminLayout>
        <ModernContainer fluid>
          <ResponsiveStack gap="xl">
            {/* Enhanced Header */}
            <ModernCard
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.03) 100%)',
                border: '2px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.08)',
                padding: '32px'
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Group gap="lg">
                  <ThemeIcon 
                    size="2xl" 
                    variant="gradient" 
                    gradient={{ from: 'green.6', to: 'emerald.5', deg: 135 }}
                    style={{
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <FiGlobe size={28} />
                  </ThemeIcon>
                  <Box>
                    <Title 
                      order={2} 
                      mb={8}
                      c="green.7"
                    >
                      Language Management
                    </Title>
                    <Text c="dimmed" size="xs" fw={500} mb="lg">
                      Manage multi-language support for your WhatsApp management system
                    </Text>
                    
                    {/* Quick Stats Bar */}
                    <Group gap="xl">
                      <Group gap="xs">
                        <FiGlobe size={10} color="var(--mantine-color-green-6)" />
                        <Text size="xs" c="dimmed">Total:</Text>
                        <Text size="xs" fw={700} c="green.7">
                          {totalLanguages}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <FiCheck size={10} color="var(--mantine-color-emerald-6)" />
                        <Text size="xs" c="dimmed">Active:</Text>
                        <Text size="xs" fw={700} c="emerald.7">
                          {activeLanguages}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <FiUpload size={10} color="var(--mantine-color-teal-6)" />
                        <Text size="xs" c="dimmed">Avg:</Text>
                        <Text size="xs" fw={700} c="teal.7">
                          {averageCompleteness}%
                        </Text>
                      </Group>
                    </Group>
                  </Box>
                </Group>
              </Group>
            </ModernCard>

            {/* Stats Cards */}
            <ResponsiveCardGrid cols={{ base: 2, md: 4 }} spacing="lg">
              <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
                <Stack align="center" gap="xs">
                  <Group gap="xs">
                    <Box component={FiGlobe} size={16} c="green.5" />
                    <Text size="xs" style={{ fontSize: '1.75rem' }} fw="bold" c="green.5">
                      {totalLanguages}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">Total Languages</Text>
                </Stack>
              </ModernCard>
              <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
                <Stack align="center" gap="xs">
                  <Group gap="xs">
                    <Box component={FiCheck} size={16} c="emerald.5" />
                    <Text size="xs" style={{ fontSize: '1.75rem' }} fw="bold" c="emerald.5">
                      {activeLanguages}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">Active Languages</Text>
                </Stack>
              </ModernCard>
              <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
                <Stack align="center" gap="xs">
                  <Text size="xs" style={{ fontSize: '1.75rem' }} fw="bold" c="teal.5">
                    {averageCompleteness}%
                  </Text>
                  <Text size="xs" c="dimmed">Avg. Completeness</Text>
                </Stack>
              </ModernCard>
              <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
                <Stack align="center" gap="xs">
                  <Text size="xs" style={{ fontSize: '1.75rem' }} fw="bold" c="green.6">
                    {totalKeys}
                  </Text>
                  <Text size="xs" c="dimmed">Translation Keys</Text>
                </Stack>
              </ModernCard>
            </ResponsiveCardGrid>

            {/* Actions */}
            <Group justify="space-between">
              <Group gap="md">
                <ModernButton
                  color="green"
                  leftSection={<Box component={FiPlus} size={10} />}
                  onClick={() => setIsCreateModalOpen(true)}
                  size="xs"
                >
                  Add Language
                </ModernButton>
                <ModernButton
                  variant="outline"
                  color="green"
                  leftSection={<Box component={FiUpload} size={10} />}
                  size="xs"
                >
                  Import Translation
                </ModernButton>
              </Group>
            </Group>

            {/* Languages Grid */}
            <ResponsiveCardGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
              {languages.map((language) => (
                <ModernCard key={language.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Box style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }} pb="xs" mb="md">
                  <Group justify="space-between">
                    <Group>
                      <Text size="xs">{language.flag}</Text>
                      <Stack gap={2}>
                        <Group gap="xs">
                          <Text fw="bold" size="xs">{language.name}</Text>
                          {language.isDefault && (
                            <ModernBadge color="green" variant="filled" size="xs">
                              Default
                            </ModernBadge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed">
                          {language.nativeName}
                        </Text>
                        <Code fz="xs" c="dimmed">
                          {language.code}
                        </Code>
                      </Stack>
                    </Group>
                    <ModernBadge color={getStatusColor(language.status)} variant="light" size="xs">
                      {language.status}
                    </ModernBadge>
                  </Group>
                </Box>
                <Stack gap="md">
                  {/* Completeness */}
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text size="xs" fw={500}>Translation Progress</Text>
                      <Text size="xs" c={`${getCompletenessColor(language.completeness)}.5`}>
                        {language.completeness}%
                      </Text>
                    </Group>
                  <Progress
                    value={language.completeness}
                    color={getCompletenessColor(language.completeness)}
                    size="xs"
                    radius="md"
                  />
                    <Group justify="space-between" mt={4}>
                      <Text size="xs" c="dimmed">{language.translatedKeys} translated</Text>
                      <Text size="xs" c="dimmed">{language.totalKeys - language.translatedKeys} remaining</Text>
                    </Group>
                  </Box>

                  {/* Details */}
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">Last Updated:</Text>
                      <Text size="xs">{new Date(language.lastUpdated).toLocaleDateString()}</Text>
                    </Group>
                    <Stack gap={4}>
                      <Text size="xs" c="dimmed">Contributors:</Text>
                      <Group gap="xs">
                        {language.contributors.map((contributor, index) => (
                          <ModernBadge key={index} size="xs" variant="outline">
                            {contributor}
                          </ModernBadge>
                        ))}
                      </Group>
                    </Stack>
                  </Stack>

                  {/* Actions */}
                  <Group justify="space-between" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Group gap="xs">
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        aria-label="Edit language"
                      >
                        <Box component={FiEdit3} size={10} />
                      </ActionIcon>
                      {!language.isDefault && (
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          aria-label="Delete language"
                        >
                          <Box component={FiTrash2} size={10} />
                        </ActionIcon>
                      )}
                    </Group>
                    <ModernButton size="xs" variant="outline" color="green">
                      Edit Translations
                    </ModernButton>
                  </Group>
                </Stack>
              </ModernCard>
                ))}
            </ResponsiveCardGrid>

        {/* Add Language Modal */}
        <Modal 
          opened={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)}
          title="Add New Language"
          size="xs"
        >
          <Stack gap="md">
            <SimpleGrid cols={2} spacing="md">
              <TextInput
                label="Language Name"
                placeholder="e.g., Portuguese"
              />
              <TextInput
                label="Language Code"
                placeholder="e.g., pt"
                maxLength={5}
              />
            </SimpleGrid>

            <TextInput
              label="Native Name"
              placeholder="e.g., Português"
            />

            <TextInput
              label="Flag Emoji"
              placeholder="🇵🇹"
              maxLength={2}
              description="Enter the flag emoji for this language"
            />

            <Select
              label="Copy translations from:"
              placeholder="Start with empty translations"
              data={[
                { value: '', label: 'Start with empty translations' },
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' }
              ]}
              description="Optionally copy existing translations as a starting point"
            />

            <Switch
              label="Set as active language"
            />
            
            <Group justify="flex-end" mt="lg">
              <ModernButton variant="outline" onClick={() => setIsCreateModalOpen(false)} size="xs">
                Cancel
              </ModernButton>
              <ModernButton color="green" size="xs">
                Add Language
              </ModernButton>
            </Group>
          </Stack>
        </Modal>
          </ResponsiveStack>
        </ModernContainer>
      </AdminLayout>
    </PagePermissionGuard>
  )
}