"use client"

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Class {
  id: string
  name: string
  level: string
  academicYear: string
}

interface Teacher {
  id: string
  teacher_id: string
  first_name: string
  last_name: string
  email: string
}

interface SubjectBranch {
  id: string
  branch_name: string
  branch_code: string
  subject_id: string
  subject: {
    subject_name: string
    subject_code: string
  }
}

interface Assignment {
  id: string
  teacher: Teacher
  branch: SubjectBranch
  class: Class
  is_primary_teacher: boolean
  assigned_at: string
}

export function TeacherAssignmentManagement() {
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [branches, setBranches] = useState<SubjectBranch[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedBranchId, setSelectedBranchId] = useState<string>("")
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [classesRes, teachersRes, branchesRes] = await Promise.all([
          fetch("/api/classes"),
          fetch("/api/teachers"),
          fetch("/api/subject-branches?isActive=true")
        ])

        if (classesRes.ok) {
          const data = await classesRes.json()
          setClasses(data)
        }
        
        if (teachersRes.ok) {
          const data = await teachersRes.json()
          // Handle different response structures for teachers
          if (Array.isArray(data)) {
            setTeachers(data)
          } else if (data.teachers && Array.isArray(data.teachers)) {
            setTeachers(data.teachers)
          }
        }

        if (branchesRes.ok) {
          const data = await branchesRes.json()
          if (data.success && Array.isArray(data.branches)) {
            setBranches(data.branches)
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching data:", error)
        toast.error("Failed to load initial data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch assignments when class is selected
  useEffect(() => {
    if (!selectedClassId) {
      setAssignments([])
      return
    }

    const fetchAssignments = async () => {
      try {
        const res = await fetch(`/api/teacher-branch-assignments?classId=${selectedClassId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && Array.isArray(data.assignments)) {
            setAssignments(data.assignments)
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching assignments:", error)
        toast.error("Failed to load assignments")
      }
    }

    fetchAssignments()
  }, [selectedClassId])

  const handleAssign = async () => {
    if (!selectedClassId || !selectedBranchId || !selectedTeacherId) {
      toast.error("Please select a class, subject branch, and teacher")
      return
    }

    setIsAssigning(true)
    try {
      const selectedClass = classes.find(c => c.id === selectedClassId)
      
      const res = await fetch("/api/teacher-branch-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          class_id: selectedClassId,
          branch_id: selectedBranchId,
          teacher_id: selectedTeacherId,
          academic_year: selectedClass?.academicYear || new Date().getFullYear().toString(),
          is_primary_teacher: true // Default to primary for now
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success("Teacher assigned successfully")
        // Refresh assignments
        const assignmentsRes = await fetch(`/api/teacher-branch-assignments?classId=${selectedClassId}`)
        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json()
          if (assignmentsData.success) {
            setAssignments(assignmentsData.assignments)
          }
        }
        // Reset selections except class
        setSelectedBranchId("")
        setSelectedTeacherId("")
      } else {
        toast.error(data.error || "Failed to assign teacher")
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error assigning teacher:", error)
      toast.error("An error occurred while assigning teacher")
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assignment Management</h1>
        <p className="text-muted-foreground">Assign teachers to subject branches for specific classes</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Assignment</CardTitle>
            <CardDescription>Select class, subject branch, and teacher</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject Branch</Label>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.subject?.subject_name} - {branch.branch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full" 
              onClick={handleAssign}
              disabled={isAssigning || !selectedClassId || !selectedBranchId || !selectedTeacherId}
            >
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Teacher
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Assignments</CardTitle>
            <CardDescription>
              {selectedClassId 
                ? `Assignments for ${classes.find(c => c.id === selectedClassId)?.name}`
                : "Select a class to view assignments"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedClassId ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Please select a class first
              </div>
            ) : isLoading ? (
              <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No assignments found for this class
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject Branch</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="font-medium">{assignment.branch.subject?.subject_name}</div>
                          <div className="text-xs text-muted-foreground">{assignment.branch.branch_name}</div>
                        </TableCell>
                        <TableCell>
                          {assignment.teacher.first_name} {assignment.teacher.last_name}
                        </TableCell>
                        <TableCell>
                          {assignment.is_primary_teacher ? (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                              Primary
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                              Secondary
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

