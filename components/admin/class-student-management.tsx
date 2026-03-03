"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Search, UserPlus, Users } from "lucide-react"
import { useClassManagement, type ClassData } from "@/lib/class-management-context"
import { useClassListPdfExport } from "@/hooks/use-class-list-pdf-export"

interface ClassStudentManagementProps {
  classData: ClassData
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Student interface for database data
interface Student {
  id: string
  first_name: string
  last_name: string
  student_id: string
  email?: string
  status: string
  class?: string
}

export function ClassStudentManagement({ classData, open, onOpenChange }: ClassStudentManagementProps) {
  const { getClassStudents, assignStudentToClass, removeStudentFromClass } = useClassManagement()
  const { isGenerating, exportClassListPdf } = useClassListPdfExport()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load students when dialog opens
  useEffect(() => {
    if (open) {
      loadStudents()
    }
  }, [open, classData.id])

  const loadStudents = async () => {
    setIsLoadingStudents(true)
    try {
      // Load enrolled students
      const enrolled = await getClassStudents(classData.id)
      setEnrolledStudents(enrolled)

      // Load all students and filter out enrolled ones
      const response = await fetch('/api/students?status=active')
      if (response.ok) {
        const allStudents: Student[] = await response.json()
        const available = allStudents.filter(student => 
          !enrolled.some(enrolledStudent => enrolledStudent.id === student.id)
        )
        setAvailableStudents(available)
      }
    } catch (err) {
      console.error('Error loading students:', err)
      setError('Failed to load students')
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([])
  const [availableStudents, setAvailableStudents] = useState<Student[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)

  const handleAssignStudent = async () => {
    if (!selectedStudent) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await assignStudentToClass(selectedStudent, classData.id)
      if (result.success) {
        const student = availableStudents.find(s => s.id === selectedStudent)
        if (student) {
          setEnrolledStudents(prev => [...prev, student])
          setAvailableStudents(prev => prev.filter(s => s.id !== selectedStudent))
          setSelectedStudent("")
          setSuccessMessage(`Student ${student.first_name} ${student.last_name} has been assigned to ${classData.name}`)
        }
      } else {
        setError(result.error || "Failed to assign student")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await removeStudentFromClass(studentId, classData.id)
      if (result.success) {
        const student = enrolledStudents.find(s => s.id === studentId)
        if (student) {
          setEnrolledStudents(prev => prev.filter(s => s.id !== studentId))
          setAvailableStudents(prev => [...prev, student])
          setSuccessMessage(`Student ${student.first_name} ${student.last_name} has been removed from ${classData.name}`)
        }
      } else {
        setError(result.error || "Failed to remove student")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEnrolledStudents = enrolledStudents.filter(student =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAvailableStudents = availableStudents.filter(student =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Students - {classData.name}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        {isLoadingStudents ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrolled Students */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enrolled Students ({enrolledStudents.length}/{classData.capacity})
              </CardTitle>
              <CardDescription>
                Students currently enrolled in this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search enrolled students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrolledStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No enrolled students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEnrolledStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.first_name} {student.last_name}</TableCell>
                          <TableCell>{student.student_id}</TableCell>
                          <TableCell>
                            <Badge variant="default">{student.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveStudent(student.id)}
                              disabled={isLoading}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Available Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Available Students ({availableStudents.length})
              </CardTitle>
              <CardDescription>
                Students available to enroll in this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="student-select">Select Student to Enroll</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAvailableStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name} ({student.student_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAssignStudent}
                  disabled={!selectedStudent || isLoading || enrolledStudents.length >= classData.capacity}
                  className="w-full"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enroll Student
                </Button>

                {enrolledStudents.length >= classData.capacity && (
                  <p className="text-sm text-amber-600">
                    Class is at maximum capacity ({classData.capacity} students)
                  </p>
                )}

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAvailableStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                            No available students found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAvailableStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.first_name} {student.last_name}</TableCell>
                            <TableCell>{student.student_id}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{student.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => exportClassListPdf(classData.id, classData.name)}
            disabled={isGenerating || isLoadingStudents}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Download Class List (PDF)"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
