"use client"

import { TeacherAssignmentManagement } from "@/components/teacher/teacher-assignment-management"

export default function TestTeacherAssignmentsPage() {
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
