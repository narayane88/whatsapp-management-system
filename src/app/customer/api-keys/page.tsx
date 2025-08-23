import CustomerHeader from '@/components/customer/CustomerHeader'
import ApiKeyManager from '@/components/customer/api/ApiKeyManager'

export default function CustomerApiKeysPage() {
  return (
    <div>
      <CustomerHeader 
        title="API Key Management"
        subtitle="Generate and manage API keys for programmatic access"
        badge={{ label: 'Developer Tools', color: 'purple' }}
      />
      <ApiKeyManager />
    </div>
  )
}