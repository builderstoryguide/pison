'use client'

import { useState } from 'react'
import { TeacherManagementProvider, useTeacherManagement } from '@/lib/teacher-management-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

function TeacherTest() {
  const { teachers, addTeacher, isLoading, error } = useTeacherManagement()
  const [testResult, setTestResult] = useState<string>('')

  const testAddTeacher = async () => {
    try {
      setTestResult('Testing...')
      
      const testTeacherData = {
        title: "Mr.",
        firstName: "Test",
        lastName: "Teacher",
        email: "test.teacher@school.edu",
        phone: "+237123456789",
        dateOfBirth: "1985-01-01",
        gender: "male",
        nationality: "Cameroonian",
        idNumber: "123456789",
        address: "123 Test Street",
        city: "Yaoundé",
        region: "Centre",
        subsystem: "english" as const,
        subjects: ["Mathematics", "Physics"],
        classes: ["Form 1", "Form 2"],
        qualifications: ["BSc Mathematics", "PGCE"],
        experience: "5 years teaching experience",
        employmentType: "full-time" as const,
        salary: 150000,
        startDate: "2024-01-01",
        emergencyContact: {
          name: "Jane Doe",
          relationship: "Spouse",
          phone: "+237987654321",
        },
        status: "active" as const,
      }

      const teacherId = await addTeacher(testTeacherData)
      setTestResult(`✅ Success! Teacher added with ID: ${teacherId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 
        typeof err === 'string' ? err : 
        err && typeof err === 'object' && 'message' in err ? String(err.message) :
        "Unknown error"
      setTestResult(`❌ Error: ${errorMessage}`)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Teacher Management Test</h1>
        <p className="text-muted-foreground">
          Test the teacher management functionality
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Database Connection:</span>
                <Badge variant="default">
                  Supabase
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Loading State:</span>
                <Badge variant={isLoading ? 'default' : 'secondary'}>
                  {isLoading ? 'Loading...' : 'Ready'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Teachers:</span>
                <Badge variant="outline">{teachers.length}</Badge>
              </div>
              {error && (
                <div className="flex items-center justify-between">
                  <span>Last Error:</span>
                  <Badge variant="destructive">{error}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Functions</CardTitle>
            <CardDescription>Test the teacher management functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={testAddTeacher} disabled={isLoading}>
                Test Add Teacher
              </Button>
              
              {testResult && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm">{testResult}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Teachers</CardTitle>
            <CardDescription>List of all teachers in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <p className="text-muted-foreground">No teachers found</p>
            ) : (
              <div className="space-y-2">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">
                        {teacher.title} {teacher.firstName} {teacher.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{teacher.email}</p>
                    </div>
                    <Badge variant="outline">{teacher.teacherId}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function TestTeacherPage() {
  return (
    <TeacherManagementProvider>
      <TeacherTest />
    </TeacherManagementProvider>
  )
}
