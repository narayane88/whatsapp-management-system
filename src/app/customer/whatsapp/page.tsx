import CustomerHeader from '@/components/customer/CustomerHeader'
import WhatsAppHostManager from '@/components/customer/host/WhatsAppHostManager'

export default function CustomerWhatsAppPage() {
  return (
    <div>
      <CustomerHeader 
        title="WhatsApp Management"
        subtitle="Manage devices, send messages, and test functionality"
        badge={{ label: 'Unified Interface', color: 'blue' }}
      />
      <WhatsAppHostManager />
    </div>
  )
}