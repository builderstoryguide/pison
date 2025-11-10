"use client"

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { useTeacherManagement } from '@/lib/teacher-management-context'

export default function TestTeacherDeletion() {
  // Production gate - prevent this page from running in production
  if (process.env.NEXT_PUBLIC_ENABLE_TEST_PAGES !== 'true') {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Test Page Not Available</h1>
          <p className="text-muted-foreground">This page is only available when explicitly enabled.</p>
        </div>
      </div>
    )
  }

  const { teachers, deleteTeacher, isLoading } = useTeacherManagement()
  const [teacherId, setTeacherId] = useState('')
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleDelete = async () => {
    if (!teacherId.trim()) {
      setResult({ success: false, message: 'Please enter a teacher ID' })
      return
    }

    setResult(null)
    console.log('🧪 Test: Starting teacher deletion for ID:', teacherId)

    try {
      await deleteTeacher(teacherId)
      setResult({ success: true, message: 'Teacher deleted successfully!' })
    } catch (error) {
      console.error('🧪 Test: Error deleting teacher:', error)
      setResult({ 
        success: false, 
        message: `Failed to delete teacher: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }
  }

  const handleDeleteFromList = async (teacher: any) => {
    setResult(null)
    console.log('🧪 Test: Starting teacher deletion from list for:', teacher)

    try {
      await deleteTeacher(teacher.id)
      setResult({ success: true, message: `Teacher ${teacher.firstName} ${teacher.lastName} deleted successfully!` })
    } catch (error) {
      console.error('🧪 Test: Error deleting teacher from list:', error)
      setResult({ 
        success: false, 
        message: `Failed to delete teacher: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Test Teacher Deletion
          </CardTitle>
          <CardDescription>
            Test the teacher deletion functionality and debug any issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manual ID Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="teacherId">Teacher ID</Label>
              <Input
                id="teacherId"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                placeholder="Enter teacher ID to delete"
              />
            </div>
            <Button 
              onClick={handleDelete} 
              disabled={isLoading || !teacherId.trim()}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isLoading ? 'Deleting...' : 'Delete Teacher by ID'}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          {/* Teachers List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Available Teachers</h3>
            {teachers.length === 0 ? (
              <p className="text-muted-foreground">No teachers found</p>
            ) : (
              <div className="space-y-2">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {teacher.firstName} {teacher.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {teacher.id} | Email: {teacher.email}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeleteFromList(teacher)}
                      disabled={isLoading}
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Debug Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Debug Information</h4>
            <div className="text-sm space-y-1">
              <div>Total teachers loaded: {teachers.length}</div>
              <div>Loading state: {isLoading ? 'Yes' : 'No'}</div>
              <div>Current teacher ID input: {teacherId || 'None'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
