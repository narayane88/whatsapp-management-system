import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import CustomerHeader from '@/components/customer/CustomerHeader'
import CustomerProfile from '@/components/customer/CustomerProfile'

export default async function CustomerProfilePage() {
  const session = await getServerSession(authOptions)
  
  return (
    <div>
      <CustomerHeader 
        title="Profile"
        subtitle="Manage your account information and settings"
      />
      <CustomerProfile />
    </div>
  )
}