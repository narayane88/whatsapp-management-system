'use client'

import { Switch, Paper, Stack, Title, Text, Group, Button } from '@mantine/core'
import { IconVolume, IconVolumeOff, IconBell, IconBellOff } from '@tabler/icons-react'
import { useState, useEffect } from 'react'

interface NotificationSettingsProps {
  enableNotifications?: boolean
  enableSounds?: boolean
  onNotificationsChange?: (enabled: boolean) => void
  onSoundsChange?: (enabled: boolean) => void
}

export function NotificationSettings({
  enableNotifications = true,
  enableSounds = true,
  onNotificationsChange,
  onSoundsChange
}: NotificationSettingsProps) {
  const [notifications, setNotifications] = useState(enableNotifications)
  const [sounds, setSounds] = useState(enableSounds)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('whatsapp-notifications')
    const savedSounds = localStorage.getItem('whatsapp-sounds')
    
    if (savedNotifications !== null) {
      setNotifications(JSON.parse(savedNotifications))
    }
    if (savedSounds !== null) {
      setSounds(JSON.parse(savedSounds))
    }
  }, [])

  const handleNotificationsChange = (value: boolean) => {
    setNotifications(value)
    localStorage.setItem('whatsapp-notifications', JSON.stringify(value))
    onNotificationsChange?.(value)
  }

  const handleSoundsChange = (value: boolean) => {
    setSounds(value)
    localStorage.setItem('whatsapp-sounds', JSON.stringify(value))
    onSoundsChange?.(value)
  }

  const testSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 440
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log('Could not play test sound:', error)
    }
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Title order={4}>Notification Settings</Title>
        
        <Group justify="space-between">
          <Group gap="sm">
            {notifications ? <IconBell size={20} /> : <IconBellOff size={20} />}
            <div>
              <Text size="sm" fw={500}>Push Notifications</Text>
              <Text size="xs" c="dimmed">
                Show notification messages for WhatsApp events
              </Text>
            </div>
          </Group>
          <Switch
            checked={notifications}
            onChange={(event) => handleNotificationsChange(event.currentTarget.checked)}
          />
        </Group>

        <Group justify="space-between">
          <Group gap="sm">
            {sounds ? <IconVolume size={20} /> : <IconVolumeOff size={20} />}
            <div>
              <Text size="sm" fw={500}>Notification Sounds</Text>
              <Text size="xs" c="dimmed">
                Play sound when notifications appear
              </Text>
            </div>
          </Group>
          <Group gap="xs">
            <Button 
              variant="light" 
              size="xs" 
              onClick={testSound}
              disabled={!sounds}
            >
              Test
            </Button>
            <Switch
              checked={sounds}
              onChange={(event) => handleSoundsChange(event.currentTarget.checked)}
            />
          </Group>
        </Group>

        <Text size="xs" c="dimmed">
          Settings are saved automatically and will persist across browser sessions.
        </Text>
      </Stack>
    </Paper>
  )
}

export default NotificationSettings