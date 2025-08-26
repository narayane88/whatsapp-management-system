'use client'

import CustomerHeader from '@/components/customer/CustomerHeader'
import SimpleDeviceManager from '@/components/customer/devices/SimpleDeviceManager'

export default function DevicesPage() {
  return (
    <div>
      <CustomerHeader 
        title="Device Management"
        subtitle="Simple WhatsApp device management - Add, view, and manage your connected devices"
        badge={{ 
          label: 'Live • Device Management', 
          color: 'green'
        }}
      />
      <SimpleDeviceManager />
    </div>
  )
}