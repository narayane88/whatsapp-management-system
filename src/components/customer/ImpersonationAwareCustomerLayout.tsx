'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import CustomerLayout from '@/components/customer/CustomerLayout'

interface User {
  id?: string
  name?: string | null
  email?: string | null
  role?: string
}

interface ImpersonationAwareCustomerLayoutProps {
  children: React.ReactNode
  user: User
}

export default function ImpersonationAwareCustomerLayout({ 
  children, 
  user 
}: ImpersonationAwareCustomerLayoutProps) {
  const router = useRouter()
  const { isImpersonating, impersonationData } = useImpersonation()

  useEffect(() => {
    // If we're not impersonating and the user is not a customer, redirect to customer page
    if (!isImpersonating && user.role !== 'CUSTOMER') {
      router.push('/customer')
      return
    }
  }, [isImpersonating, user.role, router])

  // During impersonation, show the customer layout regardless of the actual user role
  const displayUser = isImpersonating && impersonationData ? {
    ...user,
    name: impersonationData.targetUser.name,
    email: impersonationData.targetUser.email,
    id: impersonationData.targetUser.id.toString(),
    role: 'CUSTOMER'
  } : user

  return (
    <CustomerLayout user={displayUser}>
      {children}
    </CustomerLayout>
  )
}