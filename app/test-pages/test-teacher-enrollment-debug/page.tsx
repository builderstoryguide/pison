"use client"

export const dynamic = 'force-dynamic'

import React from 'react'
import { TeacherEnrollmentForm } from '@/components/admin/teacher-enrollment-form'
import { AuthProvider } from '@/lib/auth-context'
import { ClassManagementProvider } from '@/lib/class-management-context'
import { TeacherManagementProvider } from '@/lib/teacher-management-context'
import { SubjectManagementProvider } from '@/lib/subject-management-context'

function TestTeacherEnrollmentDebugContent() {
  const handleSuccess = (result: any) => {
    console.log('✅ Teacher enrollment successful:', result)
    alert(`Teacher ${result.teacherData.firstName} ${result.teacherData.lastName} created successfully!`)
  }

  const handleCancel = () => {
    console.log('❌ Teacher enrollment cancelled')
    alert('Teacher enrollment cancelled')
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test Teacher Enrollment - Debug Mode</h1>
      <p className="text-muted-foreground mb-6">
        This page tests the teacher enrollment form with debugging enabled. 
        Check the browser console for detailed logs about subjects loading.
      </p>
      
      <TeacherEnrollmentForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}

export default function TestTeacherEnrollmentDebug() {
  return (
    <AuthProvider>
      <SubjectManagementProvider>
        <ClassManagementProvider>
          <TeacherManagementProvider>
            <TestTeacherEnrollmentDebugContent />
          </TeacherManagementProvider>
        </ClassManagementProvider>
      </SubjectManagementProvider>
    </AuthProvider>
  )
}
