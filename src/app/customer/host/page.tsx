import CustomerHeader from '@/components/customer/CustomerHeader'
import WhatsAppHostManager from '@/components/customer/host/WhatsAppHostManager'

export default function CustomerHostPage() {
  return (
    <div>
      <CustomerHeader 
        title="WhatsApp Host Management"
        subtitle="Connect and manage multiple WhatsApp accounts across different servers"
        badge={{ label: 'Multi-Server', color: 'blue' }}
      />
      <WhatsAppHostManager />
    </div>
  )
}