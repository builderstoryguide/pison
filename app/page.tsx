"use client"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { UserManagementProvider } from "@/lib/user-management-context"
import { StudentEnrollmentProvider } from "@/lib/student-enrollment-context"
import { StudentManagementProvider } from "@/lib/student-management-context"
import { TeacherManagementProvider } from "@/lib/teacher-management-context"
import { ClassManagementProvider } from "@/lib/class-management-context"
import { ExaminationProvider } from "@/lib/examination-context"
import { FinancialProvider } from "@/lib/financial-context"
import { AttendanceProvider } from "@/lib/attendance-context"
import { ReportsAnalyticsProvider } from "@/lib/reports-analytics-context"
import { ProfileProvider } from "@/lib/profile-context"
import { TeacherAttendanceProvider } from "@/lib/teacher-attendance-context"
import { TeacherGradesProvider } from "@/lib/teacher-grades-context"
import { NotificationProvider } from "@/lib/notification-context"
import { Dashboard } from "@/components/dashboard"
import { Loader2 } from "lucide-react"
function AppContent() {
  const { user, isLoading } = useAuth()

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

  if (!user) {
    return <Dashboard />
  }

  return (
    <NotificationProvider>
      <UserManagementProvider>
        <StudentEnrollmentProvider>
          <StudentManagementProvider>
            <TeacherManagementProvider>
              <ClassManagementProvider>
                <ExaminationProvider>
                  <FinancialProvider>
                    <AttendanceProvider>
                      <TeacherAttendanceProvider>
                        <TeacherGradesProvider>
                          <ReportsAnalyticsProvider>
                            <ProfileProvider>
                              <Dashboard />
                            </ProfileProvider>
                          </ReportsAnalyticsProvider>
                        </TeacherGradesProvider>
                      </TeacherAttendanceProvider>
                    </AttendanceProvider>
                  </FinancialProvider>
                </ExaminationProvider>
              </ClassManagementProvider>
            </TeacherManagementProvider>
          </StudentManagementProvider>
        </StudentEnrollmentProvider>
      </UserManagementProvider>
    </NotificationProvider>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
