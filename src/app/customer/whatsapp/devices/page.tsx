'use client'

import CustomerHeader from '@/components/customer/CustomerHeader'
import SimpleDeviceManager from '@/components/customer/devices/SimpleDeviceManager'
import { useWhatsAppRealTime } from '@/hooks/useWhatsAppRealTime'
import { useEffect, useState } from 'react'

export default function DevicesPage() {
  const [realTimeConnected, setRealTimeConnected] = useState(false)
  
  // Initialize real-time connection for devices
  const { isConnected } = useWhatsAppRealTime({
    enableNotifications: false, // Device manager handles notifications
    autoReconnect: true
  })

  useEffect(() => {
    setRealTimeConnected(isConnected)
  }, [isConnected])

  return (
    <div>
      <CustomerHeader 
        title="Device Management"
        subtitle="Simple WhatsApp device management - Add, view, and manage your connected devices"
        badge={{ 
          label: realTimeConnected ? 'Live • Device Management' : 'Device Management', 
          color: realTimeConnected ? 'green' : 'blue' 
        }}
      />
      <SimpleDeviceManager />
    </div>
  )
}