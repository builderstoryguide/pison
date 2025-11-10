"use client"

import { Dashboard01 } from "@/components/dashboard-01.custom"
import { AuthProvider } from "@/lib/auth-context"
import { SidebarLayout } from "@/components/sidebar-layout"
import { StudentManagementProvider } from "@/lib/student-management-context"
import { TeacherManagementProvider } from "@/lib/teacher-management-context"
import { ClassManagementProvider } from "@/lib/class-management-context"
import { FinancialProvider } from "@/lib/financial-context"

export default function DashboardPage() {
  return (
    <AuthProvider>
      <SidebarLayout>
        <StudentManagementProvider>
          <TeacherManagementProvider>
            <ClassManagementProvider>
              <FinancialProvider>
                <Dashboard01 />
              </FinancialProvider>
            </ClassManagementProvider>
          </TeacherManagementProvider>
        </StudentManagementProvider>
      </SidebarLayout>
    </AuthProvider>
  )
}
