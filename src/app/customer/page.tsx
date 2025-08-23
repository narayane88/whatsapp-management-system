import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'
import CustomerHeader from '@/components/customer/CustomerHeader'
import CustomerDashboard from '@/components/customer/CustomerDashboard'
import ImpersonationAwareCustomerPage from '@/components/customer/ImpersonationAwareCustomerPage'

export default async function CustomerPage() {
  const session = await getServerSession(authOptions)
  const cookieStore = await cookies()
  const isImpersonating = cookieStore.get('impersonation_active')?.value === 'true'
  
  // If impersonating, use the client-side component to handle impersonation context
  if (isImpersonating && ['OWNER', 'ADMIN'].includes(session?.user?.role || '')) {
    return <ImpersonationAwareCustomerPage />
  }
  
  return (
    <div>
      <CustomerHeader 
        title={`Welcome, ${session?.user?.name || 'Customer'}`}
        subtitle="Manage your WhatsApp business communications"
      />
      <CustomerDashboard />
    </div>
  )
}