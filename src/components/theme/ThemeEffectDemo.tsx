'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  Alert,
  Code,
  List,
  Divider,
  Box
} from '@mantine/core'
import * as Fi from 'react-icons/fi'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeEffectDemo() {
  const { currentTheme } = useTheme()
  const [affectedComponents, setAffectedComponents] = useState<string[]>([])

  useEffect(() => {
    // Simulate detecting theme changes across components
    const components = [
      'Admin Dashboard Stats Cards',
      'User Management Table',
      'Voucher Management Interface',
      'Server Monitoring Cards',
      'Transaction History Table',
      'Package Management Grid',
      'Permission Matrix',
      'Navigation Sidebar',
      'Header Components',
      'Modal Dialogs',
      'Form Components',
      'Progress Bars',
      'Badge Components',
      'Button Elements',
      'Alert Notifications'
    ]
    
    setAffectedComponents(components)
  }, [currentTheme])

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group gap="sm">
          <Box component={Fi.FiLayers} c={`${currentTheme.primaryColor}.6`} />
          <Title order={4}>Theme Impact Analysis</Title>
        </Group>
        
        <Alert variant="light" color={currentTheme.primaryColor} title="Active Theme Effects">
          <Text size="sm">
            The <strong>{currentTheme.name}</strong> theme is currently applied across your entire WhatsApp management system.
          </Text>
        </Alert>

        <Stack gap="sm">
          <Group gap="sm">
            <Box component={Fi.FiCheckCircle} c="green.6" />
            <Text fw={500} size="sm">Components Updated ({affectedComponents.length})</Text>
          </Group>
          
          <List size="sm" spacing="xs">
            {affectedComponents.map((component, index) => (
              <List.Item key={index}>
                <Group gap="xs">
                  <Text size="sm">{component}</Text>
                  <Badge color={currentTheme.primaryColor} size="xs" variant="light">
                    Updated
                  </Badge>
                </Group>
              </List.Item>
            ))}
          </List>
        </Stack>

        <Divider />

        <Stack gap="xs">
          <Group gap="sm">
            <Box component={Fi.FiCode} c="gray.6" />
            <Text fw={500} size="sm">Current Theme Configuration</Text>
          </Group>
          
          <Code block>
{`Theme: ${currentTheme.name}
Primary Color: ${currentTheme.primaryColor}
Description: ${currentTheme.description}
Color Scheme: ${currentTheme.other?.colorScheme || 'auto'}
Applied Components: ${affectedComponents.length} components`}
          </Code>
        </Stack>

        <Group justify="space-between" pt="md">
          <Text size="xs" c="dimmed">
            Theme persisted in localStorage for future sessions
          </Text>
          <Badge color="green" variant="light">
            <Box component={Fi.FiCheckCircle} size={12} style={{ marginRight: '4px' }} />
            Applied Successfully
          </Badge>
        </Group>
      </Stack>
    </Card>
  )
}