import CustomerHeader from '@/components/customer/CustomerHeader'
import SimpleDeviceManager from '@/components/customer/devices/SimpleDeviceManager'

export default function DevicesPage() {
  return (
    <div>
      <CustomerHeader 
        title="Device Management"
        subtitle="Simple WhatsApp device management - Add, view, and manage your connected devices"
        badge={{ label: 'Simple & Easy', color: 'blue' }}
      />
      <SimpleDeviceManager />
    </div>
  )
}