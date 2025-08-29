"use client"

import { ActivityLogsView } from '@/components/admin/activity-logs-view'

export default function TestActivityLogsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Activity Logs Test Page</h1>
        <p className="text-muted-foreground">
          This page tests the activity logs functionality with real database data.
        </p>
      </div>
      
      <ActivityLogsView />
    </div>
  )
}
