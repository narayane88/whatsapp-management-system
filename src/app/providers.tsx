'use client'

import { Notifications } from '@mantine/notifications'
import { AuthProvider } from './session-provider'
import { CustomThemeProvider } from '@/components/theme/ThemeProvider'
import { ImpersonationProvider } from '@/contexts/ImpersonationContext'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/carousel/styles.css'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ImpersonationProvider>
        <CustomThemeProvider>
          <Notifications />
          {children}
        </CustomThemeProvider>
      </ImpersonationProvider>
    </AuthProvider>
  )
}