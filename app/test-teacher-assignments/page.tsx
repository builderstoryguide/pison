"use client"

import { TeacherAssignmentManagement } from "@/components/teacher/teacher-assignment-management"
import { AuthProvider } from "@/lib/auth-context"
import { TeacherGradesProvider } from "@/lib/teacher-grades-context"

function TestTeacherAssignmentsContent() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Teacher Assignment Management Test</h1>
        <p className="text-muted-foreground">
          Test the assignment creation and management functionality for teachers
        </p>
      </div>
      
      <TeacherAssignmentManagement />
    </div>
  )
}

export default function TestTeacherAssignmentsPage() {
  return (
    <AuthProvider>
      <TeacherGradesProvider>
        <TestTeacherAssignmentsContent />
      </TeacherGradesProvider>
    </AuthProvider>
  )
}
