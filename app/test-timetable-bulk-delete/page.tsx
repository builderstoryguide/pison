"use client"

import { TimetableManagement } from '@/components/admin/timetable-management'
import { TimetableProvider } from '@/lib/timetable-context'


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

function TestTimetableBulkDeleteContent() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Timetable Bulk Delete Test</h1>
        <p className="text-muted-foreground">
          Test the enhanced timetable management component with bulk selection and deletion capabilities
        </p>
      </div>

      <TimetableManagement />
    </div>
  )
}

export default function TestTimetableBulkDeletePage() {
  return (
    <TimetableProvider>
      <TestTimetableBulkDeleteContent />
    </TimetableProvider>
  )
}
