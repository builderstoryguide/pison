"use client"

import { UserManagement } from '@/components/admin/user-management'

export default function TestBulkUserActionsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Bulk User Actions Test</h1>
        <p className="text-muted-foreground">
          Test the enhanced user management component with bulk selection and deletion capabilities
        </p>
      </div>
      
      <UserManagement />
    </div>
  )
}
