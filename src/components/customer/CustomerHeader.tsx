'use client'

import { Group, Text, Badge } from '@mantine/core'

interface CustomerHeaderProps {
  title: string
  subtitle?: string
  badge?: {
    label: string
    color: string
  }
}

export default function CustomerHeader({ title, subtitle, badge }: CustomerHeaderProps) {
  return (
    <Group justify="space-between" mb="md">
      <div>
        <Group gap="sm">
          <Text size="xl" fw={600}>
            {title}
          </Text>
          {badge && (
            <Badge color={badge.color} size="sm">
              {badge.label}
            </Badge>
          )}
        </Group>
        {subtitle && (
          <Text size="sm" c="dimmed">
            {subtitle}
          </Text>
        )}
      </div>
    </Group>
  )
}