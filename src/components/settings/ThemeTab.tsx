'use client'

import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  SimpleGrid,
  Box,
  Paper,
  ActionIcon,
  Tooltip,
  Switch,
  Alert,
  Progress,
  Avatar,
  Table,
  Modal,
  ColorSwatch,
  ThemeIcon
} from '@mantine/core'
import { 
  ModernCard, 
  ModernButton, 
  ModernBadge, 
  ModernAlert,
  ModernContainer
} from '@/components/ui/modern-components'
import * as Icons from 'react-icons/fi'
import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { CustomTheme } from '@/types/theme'
import ThemePreviewDemo from './ThemePreviewDemo'
import ThemeEffectDemo from '../theme/ThemeEffectDemo'

export default function ThemeTab() {
  const { currentTheme, setTheme, themes } = useTheme()
  const [previewTheme, setPreviewTheme] = useState<CustomTheme | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)

  const handleThemeSelect = (theme: CustomTheme) => {
    setTheme(theme)
  }

  const handlePreview = (theme: CustomTheme) => {
    setPreviewTheme(theme)
    setIsPreviewModalOpen(true)
  }

  const getThemePreviewColors = (theme: CustomTheme) => {
    const colors = theme.colors?.[theme.primaryColor] || [
      '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5',
      '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1'
    ]
    return colors.slice(2, 8) // Get middle colors for preview
  }

  return (
    <ModernCard shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group gap="sm">
          <ThemeIcon size="sm" variant="light" color="purple">
            <Icons.FiEdit3 size={10} />
          </ThemeIcon>
          <Title order={4} size="xs" fw={600}>Theme Settings</Title>
        </Group>
        <Text size="xs" c="dimmed">
          Customize the appearance and colors of your WhatsApp management system
        </Text>
      </Card.Section>

      <Stack gap="xl" mt="md">
        {/* Current Theme Info */}
        <ModernAlert variant="light" color="blue" title="Current Active Theme">
          <Group justify="space-between">
            <Stack gap="xs">
              <Text size="xs" fw={500}>{currentTheme.name}</Text>
              <Text size="xs" c="dimmed">{currentTheme.description}</Text>
            </Stack>
            <Group gap="xs">
              {getThemePreviewColors(currentTheme).map((color, index) => (
                <ColorSwatch key={index} color={color} size={20} />
              ))}
            </Group>
          </Group>
        </ModernAlert>

        {/* Theme Grid */}
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={5} size="xs" fw={600}>Available Themes</Title>
            <ModernBadge color="gray" variant="light" size="xs">
              {themes.length} themes available
            </ModernBadge>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
            {themes.map((theme) => {
              const isActive = currentTheme.id === theme.id
              const previewColors = getThemePreviewColors(theme)

              return (
                <Card
                  key={theme.id}
                  shadow={isActive ? "md" : "xs"}
                  padding="md"
                  radius="md"
                  withBorder
                  style={{
                    borderColor: isActive ? 'var(--mantine-color-blue-4)' : undefined,
                    borderWidth: isActive ? 2 : 1
                  }}
                >
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Stack gap={2}>
                        <Group gap="xs">
                          <Text fw={500} size="xs">{theme.name}</Text>
                          {isActive && (
                            <ModernBadge color="blue" size="xs" variant="filled">
                              Active
                            </ModernBadge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {theme.description}
                        </Text>
                      </Stack>
                    </Group>

                    {/* Theme Preview Colors */}
                    <Group gap="xs" justify="center" py="sm">
                      {previewColors.map((color, index) => (
                        <ColorSwatch key={index} color={color} size={24} />
                      ))}
                    </Group>

                    {/* Color Scheme Badge */}
                    <Group justify="center">
                      <ModernBadge 
                        color={theme.other?.colorScheme === 'dark' ? 'dark' : 'gray'} 
                        variant="light"
                        size="xs"
                        leftSection={
                          theme.other?.colorScheme === 'dark' ? <Icons.FiMoon size={10} /> : <Icons.FiSun size={10} />
                        }
                      >
                        {theme.other?.colorScheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </ModernBadge>
                    </Group>

                    {/* Action Buttons */}
                    <Group gap="xs">
                      <ModernButton
                        size="xs"
                        variant={isActive ? "filled" : "light"}
                        fullWidth
                        onClick={() => handleThemeSelect(theme)}
                        leftSection={isActive ? <Icons.FiCheck size={10} /> : <Icons.FiEdit3 size={10} />}
                        disabled={isActive}
                      >
                        {isActive ? 'Applied' : 'Apply Theme'}
                      </ModernButton>
                      <Tooltip label="Preview Theme">
                        <ActionIcon
                          size="sm"
                          variant="light"
                          onClick={() => handlePreview(theme)}
                        >
                          <Icons.FiEye size={10} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Stack>
                </Card>
              )
            })}
          </SimpleGrid>
        </Stack>

        {/* Theme Effect Analysis */}
        <ThemeEffectDemo />

        {/* Theme Customization Options */}
        <ModernCard shadow="xs" padding="md" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={5} size="xs" fw={600}>Advanced Theme Options</Title>
              <ModernBadge color="orange" variant="light" size="xs">Coming Soon</ModernBadge>
            </Group>
            
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Paper bg="gray.1" p="md" radius="md">
                <Group gap="sm">
                  <Box component={Icons.FiSettings} c="gray.6" />
                  <Stack gap={2}>
                    <Text size="xs" fw={500} c="gray.7">Custom Color Builder</Text>
                    <Text size="xs" c="dimmed">Create your own color palette with color picker</Text>
                  </Stack>
                </Group>
              </Paper>
              
              <Paper bg="gray.1" p="md" radius="md">
                <Group gap="sm">
                  <Box component={Icons.FiUpload} c="gray.6" />
                  <Stack gap={2}>
                    <Text size="xs" fw={500} c="gray.7">Import/Export Themes</Text>
                    <Text size="xs" c="dimmed">Share themes with other installations</Text>
                  </Stack>
                </Group>
              </Paper>
            </SimpleGrid>
          </Stack>
        </ModernCard>
      </Stack>

      {/* Live Theme Demo */}
      <ModernCard shadow="xs" padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={5} size="xs" fw={600}>Live Theme Preview</Title>
            <ModernBadge color={currentTheme.primaryColor} variant="light" size="xs">
              Current: {currentTheme.name}
            </ModernBadge>
          </Group>
          <Text size="xs" c="dimmed">
            See how your current theme affects all dashboard components in real-time
          </Text>
          <ThemePreviewDemo theme={currentTheme} />
        </Stack>
      </ModernCard>

      {/* Preview Modal */}
      <Modal
        opened={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Theme Preview: ${previewTheme?.name}`}
        size="95%"
      >
        {previewTheme && (
          <Stack gap="md">
            <ModernAlert variant="light" color="blue" title="Theme Preview Mode">
              <Text size="xs">
                This is how your dashboard would look with the <strong>{previewTheme.name}</strong> theme.
                All components, colors, and styling will be updated to match this theme.
              </Text>
            </ModernAlert>

            <ThemePreviewDemo theme={previewTheme} />

            {/* Apply Button */}
            <Group justify="flex-end" mt="lg">
              <ModernButton
                variant="outline"
                onClick={() => setIsPreviewModalOpen(false)}
                size="xs"
              >
                Close Preview
              </ModernButton>
              <ModernButton
                color={previewTheme.primaryColor}
                onClick={() => {
                  handleThemeSelect(previewTheme)
                  setIsPreviewModalOpen(false)
                }}
                leftSection={<Icons.FiCheck size={10} />}
                size="xs"
              >
                Apply This Theme
              </ModernButton>
            </Group>
          </Stack>
        )}
      </Modal>
    </ModernCard>
  )
}