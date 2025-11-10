"use client"

export const dynamic = 'force-dynamic'


import { UserManagementProvider } from '@/lib/user-management-context'
import { StudentManagementProvider } from '@/lib/student-management-context'
import { TeacherManagementProvider } from '@/lib/teacher-management-context'
import { UserManagement } from '@/components/admin/user-management'

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
