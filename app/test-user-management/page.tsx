"use client"

import { UserManagementProvider } from '@/lib/user-management-context'
import { StudentManagementProvider } from '@/lib/student-management-context'
import { TeacherManagementProvider } from '@/lib/teacher-management-context'
import { UserManagement } from '@/components/admin/user-management'


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

export default function TestUserManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <UserManagementProvider>
        <StudentManagementProvider>
          <TeacherManagementProvider>
            <UserManagement />
          </TeacherManagementProvider>
        </StudentManagementProvider>
      </UserManagementProvider>
    </div>
  )
}
