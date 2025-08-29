"use client"

import { UserManagementProvider } from '@/lib/user-management-context'
import { UserManagement } from '@/components/admin/user-management'

export default function TestUserManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <UserManagementProvider>
        <UserManagement />
      </UserManagementProvider>
    </div>
  )
}
