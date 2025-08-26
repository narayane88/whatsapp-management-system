'use client'

import { Group, Text, Badge, ActionIcon, Tooltip, Menu } from '@mantine/core'
import { IconBell, IconBellOff, IconVolume, IconVolumeOff, IconSettings } from '@tabler/icons-react'
import { useNotificationSettings } from '@/hooks/useNotificationSettings'

interface CustomerHeaderProps {
  title: string
  subtitle?: string
  badge?: {
    label: string
    color: string
  }
}

export default function CustomerHeader({ title, subtitle, badge }: CustomerHeaderProps) {
  const { settings, toggleNotifications, toggleSounds } = useNotificationSettings()

  const testSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 523.25
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.log('Could not play test sound:', error)
    }
  }

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

      <Group gap="xs">
        {/* Quick notification toggle */}
        <Tooltip label={settings.enableNotifications ? "Disable notifications" : "Enable notifications"}>
          <ActionIcon
            variant={settings.enableNotifications ? "filled" : "light"}
            color={settings.enableNotifications ? "blue" : "gray"}
            onClick={toggleNotifications}
            size="lg"
          >
            {settings.enableNotifications ? <IconBell size={18} /> : <IconBellOff size={18} />}
          </ActionIcon>
        </Tooltip>

        {/* Quick sound toggle */}
        <Tooltip label={settings.enableSounds ? "Disable sounds" : "Enable sounds"}>
          <ActionIcon
            variant={settings.enableSounds ? "filled" : "light"}
            color={settings.enableSounds ? "green" : "gray"}
            onClick={toggleSounds}
            size="lg"
          >
            {settings.enableSounds ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
          </ActionIcon>
        </Tooltip>

        {/* Test sound button */}
        {settings.enableSounds && (
          <Tooltip label="Test notification sound">
            <ActionIcon
              variant="light"
              color="orange"
              onClick={testSound}
              size="lg"
            >
              <IconSettings size={18} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Group>
  )
}