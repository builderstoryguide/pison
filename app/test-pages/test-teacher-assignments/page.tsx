"use client"

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function TestTeacherAssignments() {
  const [teacherId, setTeacherId] = useState('')
  const [debugData, setDebugData] = useState<any>(null)
  const [assignmentsData, setAssignmentsData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testDebugEndpoint = async () => {
    if (!teacherId) {
      setError('Please enter a teacher ID')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/teachers/debug-assignments', window.location.origin)
      url.searchParams.set('teacherId', String(teacherId))
      const response = await fetch(url.toString(), { credentials: 'include' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setDebugData(data)
      console.log('Debug data:', data)
    } catch (err) {
      setError(`Failed to fetch debug data: ${err instanceof Error ? err.message : 'Unknown error'}`)
      console.error('Debug error:', err)
    } finally {
      setLoading(false)
    }
  }

  const testAssignmentsEndpoint = async () => {
    if (!teacherId) {
      setError('Please enter a teacher ID')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/teachers/assigned-classes', window.location.origin)
      url.searchParams.set('teacherId', String(teacherId))
      const response = await fetch(url.toString(), { credentials: 'include' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setAssignmentsData(data)
      console.log('Assignments data:', data)
    } catch (err) {
      setError(`Failed to fetch assignments data: ${err instanceof Error ? err.message : 'Unknown error'}`)
      console.error('Assignments error:', err)
    } finally {
      setLoading(false)
    }
  }

  const testAllAssignments = async () => {
    if (!teacherId) {
      setError('Please enter a teacher ID')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/teachers/test-assignments', window.location.origin)
      url.searchParams.set('teacherId', String(teacherId))
      const response = await fetch(url.toString(), { credentials: 'include' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      console.log('All assignments:', data)
      alert('All assignments data logged to console')
    } catch (err) {
      setError(`Failed to fetch all assignments: ${err instanceof Error ? err.message : 'Unknown error'}`)
      console.error('All assignments error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teacher Assignments Debug Tool</CardTitle>
          <CardDescription>
            Test and debug teacher class assignments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="teacherId">Teacher User ID</Label>
            <Input
              id="teacherId"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              placeholder="Enter teacher user ID"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={testDebugEndpoint} disabled={loading}>
              Test Debug Endpoint
            </Button>
            <Button onClick={testAssignmentsEndpoint} disabled={loading}>
              Test Assignments Endpoint
            </Button>
            <Button onClick={testAllAssignments} disabled={loading} variant="outline">
              Test All Assignments
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {debugData && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Data</CardTitle>
            <CardDescription>Raw debug information</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {assignmentsData && (
        <Card>
          <CardHeader>
            <CardTitle>Assignments Data</CardTitle>
            <CardDescription>Teacher assigned classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={assignmentsData.success ? "default" : "destructive"}>
                  {assignmentsData.success ? "Success" : "Failed"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {assignmentsData.classes?.length || 0} classes found
                </span>
              </div>
              
              {assignmentsData.error && (
                <Alert variant="destructive">
                  <AlertDescription>{assignmentsData.error}</AlertDescription>
                </Alert>
              )}

              {assignmentsData.classes && assignmentsData.classes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Assigned Classes:</h4>
                  {assignmentsData.classes.map((cls: any, index: number) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="font-medium">{cls.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Level: {cls.level} | Subsystem: {cls.subsystem}
                      </div>
                      {cls.subjects && cls.subjects.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium">Subjects:</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cls.subjects.map((subject: any, subIndex: number) => (
                              <Badge key={subIndex} variant="outline" className="text-xs">
                                {subject.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Separator />
              
              <details>
                <summary className="cursor-pointer font-medium">Raw Data</summary>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-sm mt-2">
                  {JSON.stringify(assignmentsData, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
