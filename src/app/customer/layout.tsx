import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'
import CustomerLayout from '@/components/customer/CustomerLayout'

export default async function CustomerLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/customer')
  }

  // Check if this is an impersonation session
  const cookieStore = await cookies()
  const isImpersonating = cookieStore.get('impersonation_active')?.value === 'true'

  // Allow access if user is CUSTOMER or if admin is impersonating
  if (session.user.role !== 'CUSTOMER' && !isImpersonating) {
    redirect('/admin')
  }

  return (
    <CustomerLayout user={session.user}>
      {children}
    </CustomerLayout>
  )
}