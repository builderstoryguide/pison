"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export default function TestSimpleAssignments() {
  const [teacherId, setTeacherId] = useState('')
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state for creating assignments
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [classesRes, subjectsRes, branchesRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/subjects'),
        fetch('/api/subject-branches')
      ])

      if (classesRes.ok) {
        const classesData = await classesRes.json()
        setClasses(classesData.classes || [])
      }

      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json()
        setSubjects(subjectsData.subjects || [])
      }

      if (branchesRes.ok) {
        const branchesData = await branchesRes.json()
        setBranches(branchesData.branches || [])
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const testTeacherAssignments = async () => {
    if (!teacherId) {
      setError('Please enter a teacher ID')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const id = teacherId.trim()
      const url = `/api/teachers/simple-assignments?teacherId=${encodeURIComponent(id)}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setAssignments(data.classes || [])
        setSuccess(`Found ${data.classes?.length || 0} classes for teacher`)
        console.log('Teacher assignments:', data)
      } else {
        setError(data.error || 'Failed to fetch assignments')
      }
    } catch (err) {
      setError('Failed to fetch assignments')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async () => {
    if (!teacherId || !selectedClass || !selectedSubject || !selectedBranch) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/teachers/simple-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId,
          classId: selectedClass,
          subjectId: selectedSubject,
          branchId: selectedBranch,
          academicYear: '2024-2025',
          term: 'Term 1'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess('Assignment created successfully!')
        // Refresh assignments
        testTeacherAssignments()
        // Clear form
        setSelectedClass('')
        setSelectedSubject('')
        setSelectedBranch('')
      } else {
        setError(data.error || 'Failed to create assignment')
      }
    } catch (err) {
      setError('Failed to create assignment')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getBranchesForSubject = (subjectId: string) => {
    return branches.filter(branch => branch.subject_id === subjectId)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simple Teacher Assignments</CardTitle>
          <CardDescription>
            Test and create simple teacher class assignments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="teacherId">Teacher ID (from teacher creation)</Label>
            <Input
              id="teacherId"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              placeholder="Enter teacher ID (e.g., TCH2024001)"
            />
          </div>

          <Button onClick={testTeacherAssignments} disabled={loading}>
            {loading ? 'Loading...' : 'Test Teacher Assignments'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Assignments</CardTitle>
            <CardDescription>Classes assigned to this teacher</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments.map((assignment, index) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="font-medium">{assignment.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Level: {assignment.level} | Subsystem: {assignment.subsystem}
                  </div>
                  {assignment.subjects && assignment.subjects.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-medium">Subjects:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {assignment.subjects.map((subject: any, subIndex: number) => (
                          <Badge key={subIndex} variant="outline" className="text-xs">
                            {subject.name}
                            {subject.branch && ` (${subject.branch.name})`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New Assignment</CardTitle>
          <CardDescription>Assign a class and subject to a teacher</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.class_name} ({cls.class_level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Subject</Label>
            <Select value={selectedSubject} onValueChange={(value) => {
              setSelectedSubject(value)
              setSelectedBranch('') // Reset branch when subject changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Branch</Label>
            <Select 
              value={selectedBranch} 
              onValueChange={setSelectedBranch}
              disabled={!selectedSubject}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a branch" />
              </SelectTrigger>
              <SelectContent>
                {getBranchesForSubject(selectedSubject).map((branch) => (
                  <SelectItem key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={createAssignment} disabled={loading || !teacherId || !selectedClass || !selectedSubject || !selectedBranch}>
            {loading ? 'Creating...' : 'Create Assignment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
