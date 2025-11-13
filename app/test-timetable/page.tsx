"use client"

import { TimetableProvider } from '@/lib/timetable-context'
import { TimetableManagement } from '@/components/admin/timetable-management'


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

export default function TestTimetablePage() {
  return (
    <div className="container mx-auto py-6">
      <TimetableProvider>
        <TimetableManagement />
      </TimetableProvider>
    </div>
  )
}
