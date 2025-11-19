"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Save, X, Users, BookOpen, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTeacherExamMarks, type ExamMark, type Student } from "@/lib/teacher-exam-marks-context"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import type { Examination } from "@/lib/examination-context"
import { useToast } from "@/hooks/use-toast"

interface ExamMarksEntryFormProps {
  examination: Examination
  onSuccess?: () => void
  onCancel?: () => void
}

interface ClassOption {
  id: string
  name: string
  level: string
}

export function ExamMarksEntryForm({ examination, onSuccess, onCancel }: ExamMarksEntryFormProps) {
  const { user } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const {
    loadStudentsForClass,
    loadExistingMarks,
    saveExamMarks,
    calculateGrade,
    calculatePercentage,
    isLoading,
    error,
  } = useTeacherExamMarks()

  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [teacherClasses, setTeacherClasses] = useState<ClassOption[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [marksEntries, setMarksEntries] = useState<Record<string, { marks: number; remarks: string }>>({})
  const [existingMarks, setExistingMarks] = useState<ExamMark[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)

  // Filter subjects to only those the teacher teaches
  const availableSubjects = examination.subjects.filter((subject) => {
    // In a real implementation, you'd check teacher_subjects table
    // For now, show all examination subjects
    return true
  })

  // Load teacher's classes
  useEffect(() => {
    const loadTeacherClasses = async () => {
      if (!supabase || !user?.id) return

      setIsLoadingClasses(true)
      try {
        const { data, error: classesError } = await supabase
          .from("classes")
          .select("id, class_name, class_level")
          .eq("class_teacher_id", user.id)
          .eq("status", "active")
          .eq("subsystem", examination.subsystem)
          .eq("stream", examination.branch)
          .eq("class_level", examination.level)

        if (classesError) {
          console.error("Error loading teacher classes:", classesError)
        } else {
          const classes: ClassOption[] = (data || []).map((cls: any) => ({
            id: cls.id,
            name: cls.class_name,
            level: cls.class_level,
          }))
          setTeacherClasses(classes)
        }
      } catch (err) {
        console.error("Error loading classes:", err)
      } finally {
        setIsLoadingClasses(false)
      }
    }

    loadTeacherClasses()
  }, [user?.id, examination.subsystem, examination.branch, examination.level])

  // Load students when class is selected
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) {
        setStudents([])
        return
      }

      const classStudents = await loadStudentsForClass(selectedClass)
      setStudents(classStudents)

      // Initialize marks entries
      const initialEntries: Record<string, { marks: number; remarks: string }> = {}
      classStudents.forEach((student) => {
        const existingMark = existingMarks.find((m) => m.studentId === student.id)
        initialEntries[student.id] = {
          marks: existingMark?.marksObtained || 0,
          remarks: existingMark?.remarks || "",
        }
      })
      setMarksEntries(initialEntries)
    }

    loadStudents()
  }, [selectedClass, loadStudentsForClass, existingMarks])

  // Load existing marks when class and subject are selected
  useEffect(() => {
    const loadMarks = async () => {
      if (!selectedClass || !selectedSubject || !examination.id) {
        setExistingMarks([])
        return
      }

      const marks = await loadExistingMarks(examination.id, selectedClass, selectedSubject)
      setExistingMarks(marks)

      // Update marks entries with existing marks
      const updatedEntries = { ...marksEntries }
      marks.forEach((mark) => {
        updatedEntries[mark.studentId] = {
          marks: mark.marksObtained,
          remarks: mark.remarks || "",
        }
      })
      setMarksEntries(updatedEntries)
    }

    loadMarks()
  }, [selectedClass, selectedSubject, examination.id, loadExistingMarks])

  const validateMarks = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!selectedClass) {
      newErrors.class = "Please select a class"
    }

    if (!selectedSubject) {
      newErrors.subject = "Please select a subject"
    }

    // Validate each marks entry
    Object.entries(marksEntries).forEach(([studentId, entry]) => {
      const student = students.find((s) => s.id === studentId)
      if (entry.marks < 0) {
        newErrors[`marks_${studentId}`] = `Marks cannot be negative for ${student?.name || "student"}`
      }
      if (entry.marks > examination.totalMarks) {
        newErrors[`marks_${studentId}`] = `Marks cannot exceed ${examination.totalMarks} for ${student?.name || "student"}`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [selectedClass, selectedSubject, marksEntries, students, examination.totalMarks])

  const handleMarksChange = useCallback((studentId: string, marks: number) => {
    setMarksEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: Math.max(0, Math.min(examination.totalMarks, marks)),
      },
    }))
    // Clear error for this student
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[`marks_${studentId}`]
      return newErrors
    })
  }, [examination.totalMarks])

  const handleRemarksChange = useCallback((studentId: string, remarks: string) => {
    setMarksEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }))
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateMarks() || !selectedClass || !selectedSubject) {
      toastError("Validation Error", {
        description: "Please fix the errors before submitting",
      })
      return
    }

    try {
      // Prepare marks data
      const marksToSave: ExamMark[] = students
        .filter((student) => {
          const entry = marksEntries[student.id]
          return entry && entry.marks > 0
        })
        .map((student) => {
          const entry = marksEntries[student.id]
          const marksObtained = entry?.marks || 0
          const percentage = calculatePercentage(marksObtained, examination.totalMarks)
          const grade = calculateGrade(marksObtained, examination.totalMarks)

          return {
            examinationId: examination.id,
            studentId: student.id,
            studentName: student.name,
            subject: selectedSubject,
            marksObtained,
            totalMarks: examination.totalMarks,
            percentage,
            grade,
            remarks: entry?.remarks || "",
          }
        })

      if (marksToSave.length === 0) {
        toastError("No Marks", {
          description: "Please enter at least one mark",
        })
        return
      }

      const result = await saveExamMarks(marksToSave)

      if (result.success) {
        toastSuccess("Marks Saved", {
          description: `Successfully saved marks for ${marksToSave.length} student(s)`,
        })
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toastError("Failed to Save Marks", {
          description: result.error || "An error occurred while saving marks",
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save marks"
      toastError("Error", {
        description: errorMessage,
      })
    }
  }, [
    validateMarks,
    selectedClass,
    selectedSubject,
    students,
    marksEntries,
    examination,
    calculateGrade,
    calculatePercentage,
    saveExamMarks,
    toast,
    onSuccess,
  ])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Examination Info */}
      <Card>
        <CardHeader>
          <CardTitle>Examination Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Examination</Label>
              <p className="font-medium">{examination.title}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Total Marks</Label>
              <p className="font-medium">{examination.totalMarks}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class and Subject</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class" disabled={isLoadingClasses}>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {teacherClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.class && <p className="text-sm text-red-600">{errors.class}</p>}
              {isLoadingClasses && <p className="text-sm text-muted-foreground">Loading classes...</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subject && <p className="text-sm text-red-600">{errors.subject}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Marks Entry Table */}
      {selectedClass && selectedSubject && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Marks</CardTitle>
            <CardDescription>
              Enter marks for each student. Marks must be between 0 and {examination.totalMarks}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="w-32">Student ID</TableHead>
                    <TableHead className="w-32">Marks</TableHead>
                    <TableHead className="w-24">Percentage</TableHead>
                    <TableHead className="w-16">Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => {
                    const entry = marksEntries[student.id]
                    const marksObtained = entry?.marks || 0
                    const percentage = marksObtained > 0 ? calculatePercentage(marksObtained, examination.totalMarks) : 0
                    const grade = marksObtained > 0 ? calculateGrade(marksObtained, examination.totalMarks) : "-"
                    const existingMark = existingMarks.find((m) => m.studentId === student.id)
                    const hasError = errors[`marks_${student.id}`]

                    return (
                      <TableRow key={student.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-muted-foreground">{student.studentId || "-"}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={examination.totalMarks}
                            value={marksObtained}
                            onChange={(e) => handleMarksChange(student.id, parseFloat(e.target.value) || 0)}
                            className={`w-full ${hasError ? "border-red-500" : ""} ${existingMark ? "bg-blue-50" : ""}`}
                          />
                          {hasError && <p className="text-xs text-red-600 mt-1">{hasError}</p>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={percentage >= examination.passingMarks ? "default" : "destructive"}>
                            {percentage.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={grade === "F" ? "destructive" : "default"}>{grade}</Badge>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={entry?.remarks || ""}
                            onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                            placeholder="Optional remarks"
                            rows={1}
                            className="min-w-[150px]"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {existingMarks.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Note: Blue highlighted rows indicate marks that have already been entered.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedClass && selectedSubject && students.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No students found in this class</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !selectedClass || !selectedSubject}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Marks
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

