'use client'

import { AuthProvider } from '@/lib/auth-context'
import { AppConfigurationProvider } from '@/lib/app-configuration-context-v2'
import { EnhancedTimetableProvider } from '@/lib/enhanced-timetable-context'
import { TimetableManagementEnhanced } from '@/components/admin/timetable-management-enhanced'

export default function TestEnhancedTimetablePage() {
  return (
    <AuthProvider>
      <AppConfigurationProvider>
        <EnhancedTimetableProvider>
          <div className="container mx-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Enhanced Timetable Management</h1>
              <p className="text-muted-foreground">
                Test page for the enhanced timetable system with status tracking and CRUD operations
              </p>
            </div>
            <TimetableManagementEnhanced />
          </div>
        </EnhancedTimetableProvider>
      </AppConfigurationProvider>
    </AuthProvider>
  )
}
