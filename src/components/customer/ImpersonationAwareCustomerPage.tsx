'use client'

import { useImpersonation } from '@/contexts/ImpersonationContext'
import CustomerHeader from '@/components/customer/CustomerHeader'
import CustomerDashboard from '@/components/customer/CustomerDashboard'
import { Loader, Container, Text, Box } from '@mantine/core'

export default function ImpersonationAwareCustomerPage() {
  const { isImpersonating, impersonationData } = useImpersonation()

  // Show loading while impersonation data is being loaded
  if (isImpersonating && !impersonationData) {
    return (
      <Container size="sm" mt="xl">
        <Box ta="center">
          <Loader size="lg" mb="md" />
          <Text size="lg" fw={500} mb="xs">
            Loading Customer Dashboard...
          </Text>
          <Text size="sm" c="dimmed">
            Setting up impersonation context
          </Text>
        </Box>
      </Container>
    )
  }

  // Get the customer name to display
  const customerName = impersonationData?.targetUser?.name || 'Customer'
  const customerEmail = impersonationData?.targetUser?.email || ''

  return (
    <div>
      <CustomerHeader 
        title={`Welcome, ${customerName}`}
        subtitle={`Managing WhatsApp communications for ${customerEmail}`}
      />
      <CustomerDashboard />
    </div>
  )
}