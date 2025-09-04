"use client"

import { SchoolDashboard } from "@/components/school-dashboard-simple"
import { AuthProvider } from "@/lib/auth-context"

export default function DashboardPage() {
  return (
    <AuthProvider>
      <SchoolDashboard />
    </AuthProvider>
  )
}
