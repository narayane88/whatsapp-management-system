'use client'

import { useState, useEffect, useCallback } from 'react'

interface NotificationSettings {
  enableNotifications: boolean
  enableSounds: boolean
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enableNotifications: true,
    enableSounds: true
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('whatsapp-notifications')
    const savedSounds = localStorage.getItem('whatsapp-sounds')
    
    setSettings({
      enableNotifications: savedNotifications !== null ? JSON.parse(savedNotifications) : true,
      enableSounds: savedSounds !== null ? JSON.parse(savedSounds) : true
    })
  }, [])

  const updateNotifications = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, enableNotifications: enabled }))
    localStorage.setItem('whatsapp-notifications', JSON.stringify(enabled))
  }, [])

  const updateSounds = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, enableSounds: enabled }))
    localStorage.setItem('whatsapp-sounds', JSON.stringify(enabled))
  }, [])

  const toggleNotifications = useCallback(() => {
    const newValue = !settings.enableNotifications
    updateNotifications(newValue)
  }, [settings.enableNotifications, updateNotifications])

  const toggleSounds = useCallback(() => {
    const newValue = !settings.enableSounds
    updateSounds(newValue)
  }, [settings.enableSounds, updateSounds])

  return {
    settings,
    updateNotifications,
    updateSounds,
    toggleNotifications,
    toggleSounds
  }
}

export default useNotificationSettings