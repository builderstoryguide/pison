"use client"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { AppConfigurationProvider } from '@/lib/app-configuration-context-v2'
import { UserManagementProvider } from "@/lib/user-management-context"
import { StudentEnrollmentProvider } from "@/lib/student-enrollment-context"
import { StudentManagementProvider } from "@/lib/student-management-context"
import { TeacherManagementProvider } from "@/lib/teacher-management-context"
import { ClassManagementProvider } from "@/lib/class-management-context"
import { FinancialProvider } from "@/lib/financial-context"
import { ProfileProvider } from "@/lib/profile-context"
import { TeacherGradesProvider } from "@/lib/teacher-grades-context"
import { TeacherExamMarksProvider } from "@/lib/teacher-exam-marks-context"
import { NotificationProvider } from "@/lib/notification-context"
import { ReactQueryProvider } from "@/lib/react-query-setup"
import { Dashboard } from "@/components/dashboard"
import { Loader2 } from "lucide-react"
function AppContent() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <ReactQueryProvider>
      <AppConfigurationProvider>
        <NotificationProvider>
          <UserManagementProvider>
          <StudentEnrollmentProvider>
            <StudentManagementProvider>
              <TeacherManagementProvider>
                <ClassManagementProvider>
                  <FinancialProvider>
                    <TeacherGradesProvider>
                      <TeacherExamMarksProvider>
                        <ProfileProvider>
                          <Dashboard />
                        </ProfileProvider>
                      </TeacherExamMarksProvider>
                    </TeacherGradesProvider>
                  </FinancialProvider>
                </ClassManagementProvider>
              </TeacherManagementProvider>
            </StudentManagementProvider>
          </StudentEnrollmentProvider>
        </UserManagementProvider>
      </NotificationProvider>
      </AppConfigurationProvider>
    </ReactQueryProvider>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
