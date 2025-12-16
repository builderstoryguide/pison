"use client"

import { TeacherGradesProvider } from "@/lib/teacher-grades-context"
import { AuthProvider } from "@/lib/auth-context"
import { AppConfigurationProvider } from "@/lib/app-configuration-context-v2"
import { GradesManagement } from "@/components/teacher/grades-management"
import { useEffect } from "react"


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

function TestTeacherGradesContent() {
  useEffect(() => {
    console.log("🔍 Teacher Grades Test Page loaded")
    return () => {
      console.log("🔍 Teacher Grades Test Page unmounted")
    }
  }, [])

  return (
    <TeacherGradesProvider>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Teacher Grades Test Page</h1>
          <p className="text-muted-foreground">
            Test the teacher grades functionality including creating assessments and entering grades.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Debug Info:</strong> This page tests the teacher grades functionality. 
              If you encounter any errors, check the browser console for debugging information.
            </p>
          </div>
        </div>
        <GradesManagement />
      </div>
    </TeacherGradesProvider>
  )
}

export default function TestTeacherGradesPage() {
  return (
    <AuthProvider>
      <AppConfigurationProvider>
        <TestTeacherGradesContent />
      </AppConfigurationProvider>
    </AuthProvider>
  )
}
