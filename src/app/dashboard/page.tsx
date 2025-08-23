'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import { Loader, Container, Text, Box } from '@mantine/core'

/**
 * Legacy Dashboard Redirect Handler
 * 
 * This page handles any residual requests to /dashboard and redirects
 * users to their appropriate dashboard based on their role and impersonation status.
 * 
 * This ensures backward compatibility and prevents 404 errors
 * during the transition period after removing dashboard endpoints.
 */
export default function DashboardRedirectPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { isImpersonating } = useImpersonation()

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      // Redirect to login if not authenticated
      router.push('/auth/signin')
      return
    }

    // If impersonating, always redirect to customer dashboard
    if (isImpersonating) {
      router.push('/customer')
      return
    }

    if (session?.user?.role) {
      // Redirect based on user role
      const userRole = session.user.role.toUpperCase()
      
      if (userRole === 'CUSTOMER') {
        router.push('/customer')
      } else {
        // OWNER, ADMIN, SUBDEALER, EMPLOYEE go to admin
        router.push('/admin')
      }
    } else {
      // Fallback to customer if role is unclear
      router.push('/customer')
    }
  }, [status, session, router, isImpersonating])

  // Show loading while redirecting
  return (
    <Container size="sm" mt="xl">
      <Box ta="center">
        <Loader size="lg" mb="md" />
        <Text size="lg" fw={500} mb="xs">
          Redirecting to Dashboard...
        </Text>
        <Text size="sm" c="dimmed">
          Taking you to your personalized dashboard
        </Text>
      </Box>
    </Container>
  )
}