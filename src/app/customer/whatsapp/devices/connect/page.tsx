import CustomerHeader from '@/components/customer/CustomerHeader'
import DeviceConnector from '@/components/customer/devices/DeviceConnector'

export default function DeviceConnectPage() {
  return (
    <div>
      <CustomerHeader 
        title="Connect WhatsApp Device"
        subtitle="Add a new WhatsApp device by scanning QR code"
        badge={{ label: 'New Device', color: 'blue' }}
      />
      <DeviceConnector />
    </div>
  )
}