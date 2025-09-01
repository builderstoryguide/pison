"use client"

import { StudentManagementProvider, useStudentManagement } from '@/lib/student-management-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

function StudentContextDebug() {
  const { students, isLoading, error, isUsingDatabase, loadStudents } = useStudentManagement()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Student Context Debug</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Students Count:</strong> {students.length}</p>
            <p><strong>Database Connected:</strong> {isUsingDatabase ? 'Yes' : 'No'}</p>
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            {error && <p><strong>Error:</strong> {error}</p>}
          </div>
          
          <Button onClick={loadStudents} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Load Students
          </Button>
          
          {students.length > 0 && (
            <pre className="mt-4 bg-gray-100 p-4 rounded text-xs">
              {JSON.stringify(students, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestStudentContextPage() {
  return (
    <div className="container mx-auto py-6">
      <StudentManagementProvider>
        <StudentContextDebug />
      </StudentManagementProvider>
    </div>
  )
}
