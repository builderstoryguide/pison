"use client"

import { useState, useEffect } from "react"
import { useTeacherManagement, TeacherManagementProvider } from "@/lib/teacher-management-context"
import { useUserManagement, UserManagementProvider } from "@/lib/user-management-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

function TestTeacherDeletionContent() {
  const { teachers, deleteTeacher, loadTeachers } = useTeacherManagement()
  const { users, loadUsers } = useUserManagement()
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunningTest, setIsRunningTest] = useState(false)

  useEffect(() => {
    loadTeachers()
    loadUsers()
  }, [loadTeachers, loadUsers])

  const runDeletionTest = async () => {
    setIsRunningTest(true)
    setTestResults([])

    try {
      // Find teachers with user accounts
      const teachersWithUsers = teachers.filter(teacher => {
        return users.some(user => 
          user.email === teacher.email && user.role === 'teacher'
        )
      })

      if (teachersWithUsers.length === 0) {
        setTestResults([{
          type: 'warning',
          message: 'No teachers with user accounts found to test deletion'
        }])
        return
      }

      const testTeacher = teachersWithUsers[0]
      
      setTestResults(prev => [...prev, {
        type: 'info',
        message: `Testing deletion for: ${testTeacher.firstName} ${testTeacher.lastName}`
      }])

      // Delete the teacher
      await deleteTeacher(testTeacher.id)
      
      // Wait and reload
      await new Promise(resolve => setTimeout(resolve, 1000))
      await loadTeachers()
      await loadUsers()

      // Check results
      const teacherStillExists = teachers.some(t => t.id === testTeacher.id)
      const userStillExists = users.some(u => u.email === testTeacher.email && u.role === 'teacher')

      if (!teacherStillExists && !userStillExists) {
        setTestResults(prev => [...prev, {
          type: 'success',
          message: '✅ Test PASSED: Both teacher and user records deleted'
        }])
      } else {
        setTestResults(prev => [...prev, {
          type: 'error',
          message: '❌ Test FAILED: Records still exist after deletion'
        }])
      }

    } catch (error) {
      setTestResults(prev => [...prev, {
        type: 'error',
        message: `❌ Test ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
      }])
    } finally {
      setIsRunningTest(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teacher Deletion Test</h1>
        <p className="text-muted-foreground">
          Testing that teacher deletion removes both teacher and user records
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Teachers ({teachers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {teachers.slice(0, 3).map((teacher) => (
              <div key={teacher.id} className="p-2 border rounded mb-2">
                <p className="font-medium">{teacher.firstName} {teacher.lastName}</p>
                <p className="text-sm text-muted-foreground">{teacher.email}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Teacher Users ({users.filter(u => u.role === 'teacher').length})</CardTitle>
          </CardHeader>
          <CardContent>
            {users
              .filter(user => user.role === 'teacher')
              .slice(0, 3)
              .map((user) => (
                <div key={user.id} className="p-2 border rounded mb-2">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deletion Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runDeletionTest} 
            disabled={isRunningTest || teachers.length === 0}
          >
            {isRunningTest ? 'Running Test...' : 'Run Deletion Test'}
          </Button>

          {testResults.map((result, index) => (
            <Alert key={index} variant={
              result.type === 'success' ? 'default' :
              result.type === 'error' ? 'destructive' : 'default'
            }>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestTeacherDeletion() {
  return (
    <TeacherManagementProvider>
      <UserManagementProvider>
        <TestTeacherDeletionContent />
      </UserManagementProvider>
    </TeacherManagementProvider>
  )
}
