"use client"

import { SchoolDashboard } from "@/components/school-dashboard-simple"
import { AuthProvider } from "@/lib/auth-context"
import { AppConfigurationProvider } from '@/lib/app-configuration-context-v2'

export default function DashboardPage() {
  return (
    <AuthProvider>
      <AppConfigurationProvider>
        <SchoolDashboard />
      </AppConfigurationProvider>
    </AuthProvider>
  )
}
