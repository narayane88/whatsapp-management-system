'use client'

import { Alert, Group, Text, Button, ThemeIcon, Box } from '@mantine/core'
import { FiUser, FiLogOut, FiShield } from 'react-icons/fi'
import { useImpersonation } from '@/contexts/ImpersonationContext'

export default function ImpersonationBanner() {
  const { isImpersonating, impersonationData, endImpersonation, loading } = useImpersonation()

  if (!isImpersonating || !impersonationData) {
    return null
  }

  return (
    <Alert
      color="orange"
      variant="filled"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        borderRadius: 0,
        border: 'none',
        background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
        boxShadow: '0 4px 12px rgba(255, 140, 0, 0.3)'
      }}
    >
      <Group justify="space-between" align="center">
        <Group gap="md">
          <ThemeIcon size="sm" color="white" variant="light" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
            <FiShield size={16} />
          </ThemeIcon>
          
          <Box>
            <Group gap="xs" align="center">
              <Text size="sm" fw={600} c="white">
                🎭 IMPERSONATING USER
              </Text>
              <Text size="xs" c="white" opacity={0.9}>
                |
              </Text>
              <Group gap="xs">
                <FiUser size={12} color="white" />
                <Text size="sm" fw={500} c="white">
                  {impersonationData.targetUser.name}
                </Text>
                <Text size="xs" c="white" opacity={0.8}>
                  ({impersonationData.targetUser.email})
                </Text>
              </Group>
            </Group>
            
            <Text size="xs" c="white" opacity={0.8} mt={2}>
              Admin: {impersonationData.adminUser.name} • Started: {new Date(impersonationData.startedAt).toLocaleTimeString()}
            </Text>
          </Box>
        </Group>

        <Button
          size="xs"
          variant="white"
          color="orange"
          leftSection={<FiLogOut size={12} />}
          onClick={endImpersonation}
          loading={loading}
          style={{
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          {loading ? 'Exiting...' : 'Exit Impersonation'}
        </Button>
      </Group>
    </Alert>
  )
}