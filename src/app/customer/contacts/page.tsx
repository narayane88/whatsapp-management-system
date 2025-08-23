import CustomerHeader from '@/components/customer/CustomerHeader'
import ContactsManager from '@/components/customer/contacts/ContactsManager'

export default function CustomerContactsPage() {
  return (
    <div>
      <CustomerHeader 
        title="Contact Management"
        subtitle="Organize your contacts, create groups, and manage subscriptions"
      />
      <ContactsManager />
    </div>
  )
}