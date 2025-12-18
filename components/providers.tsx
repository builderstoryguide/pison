'use client'

import React from 'react'

import { ReactQueryProvider } from '@/lib/react-query-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toast'
import { NotificationProvider } from '@/lib/notification-context'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReactQueryProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <NotificationProvider>
          {children}
          <Toaster />
        </NotificationProvider>
      </ThemeProvider>
    </ReactQueryProvider>
  )
}
