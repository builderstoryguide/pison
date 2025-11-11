"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Save, X, Users, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTeacherGrades } from "@/lib/teacher-grades-context"

interface GradeEntryFormProps {
  selectedAssessmentId?: string | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function GradeEntryForm({ selectedAssessmentId, onSuccess, onCancel }: GradeEntryFormProps) {
  const {
    assessments,
    students,
    grades,
    classes,
    addGrade,
    getStudentsByClass,
    getGradesByAssessment,
    getAssessmentsForTeacher,
    calculateGrade,
    loadStudents,
    loadAssessments,
    loading,
    loadingStudents,
  } = useTeacherGrades()

  // Get assessments filtered by teacher's assigned classes
  const teacherAssessments = getAssessmentsForTeacher()

  const [selectedAssessment, setSelectedAssessment] = useState(selectedAssessmentId || "")
  const [gradeEntries, setGradeEntries] = useState<Record<string, { marks: number; remarks: string }>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Sync selectedAssessment with prop when it changes
  useEffect(() => {
    if (selectedAssessmentId !== null && selectedAssessmentId !== selectedAssessment) {
      setSelectedAssessment(selectedAssessmentId)
    }
  }, [selectedAssessmentId, selectedAssessment])

  // Load students and assessments when component mounts
  // Only run once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadStudents(),
          loadAssessments(),
        ])
      } catch (error) {
        console.error("Error loading data in GradeEntryForm:", error)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const assessment = teacherAssessments.find((a) => a.id === selectedAssessment)
  
  // Memoize computed values to prevent infinite loops
  const classStudents = useMemo(() => {
    return assessment ? getStudentsByClass(assessment.classId) : []
  }, [assessment?.id, assessment?.classId, getStudentsByClass, students])
  
  const existingGrades = useMemo(() => {
    return assessment ? getGradesByAssessment(assessment.id) : []
  }, [assessment?.id, getGradesByAssessment, grades])

  // Debug logging to help diagnose issues
  useEffect(() => {
    if (assessment) {
      console.log("Assessment selected:", {
        assessmentId: assessment.id,
        classId: assessment.classId,
        className: assessment.className,
        totalStudents: students.length,
        classStudents: classStudents.length,
        studentClassIds: students.map(s => s.classId).filter((id, index, arr) => arr.indexOf(id) === index),
      })
    }
  }, [assessment?.id, students.length, classStudents.length])

  // Initialize grade entries when assessment changes
  // Use memoized arrays as dependencies - they're stable references
  useEffect(() => {
    if (assessment && classStudents.length > 0) {
      const initialEntries: Record<string, { marks: number; remarks: string }> = {}

      classStudents.forEach((student) => {
        const existingGrade = existingGrades.find((g) => g.studentId === student.id)
        initialEntries[student.id] = {
          marks: existingGrade?.marks || 0,
          remarks: existingGrade?.remarks || "",
        }
      })

      setGradeEntries(initialEntries)
    } else if (assessment && classStudents.length === 0) {
      // Clear entries if no students found
      setGradeEntries({})
    }
  }, [assessment?.id, classStudents, existingGrades])

  const validateGrades = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!selectedAssessment) {
      newErrors.assessment = "Please select an assessment"
      setErrors(newErrors)
      return false
    }

    if (!assessment) {
      newErrors.assessment = "Selected assessment not found"
      setErrors(newErrors)
      return false
    }

    // Validate each grade entry
    Object.entries(gradeEntries).forEach(([studentId, entry]) => {
      if (entry.marks < 0) {
        newErrors[`marks_${studentId}`] = "Marks cannot be negative"
      }
      if (entry.marks > assessment.totalMarks) {
        newErrors[`marks_${studentId}`] = `Marks cannot exceed ${assessment.totalMarks}`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [selectedAssessment, assessment, gradeEntries])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateGrades() || !assessment) return

    try {
      // Submit grades for all students
      for (const student of classStudents) {
        const entry = gradeEntries[student.id]
        if (entry && entry.marks >= 0) {
          const percentage = (entry.marks / assessment.totalMarks) * 100
          const grade = calculateGrade(entry.marks, assessment.totalMarks)

          await addGrade({
            assessmentId: assessment.id,
            studentId: student.id,
            studentName: student.name,
            marks: entry.marks,
            percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
            grade,
            remarks: entry.remarks,
          })
        }
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      setErrors({ submit: "Failed to save grades" })
    }
  }, [validateGrades, assessment, classStudents, gradeEntries, calculateGrade, addGrade, onSuccess])

  const handleGradeChange = useCallback((studentId: string, field: "marks" | "remarks", value: string | number) => {
    setGradeEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }))

    // Clear errors for this field - use functional update to avoid dependency on errors
    setErrors((prev) => {
      const errorKey = field === "marks" ? `marks_${studentId}` : `remarks_${studentId}`
      if (prev[errorKey]) {
        return { ...prev, [errorKey]: "" }
      }
      return prev
    })
  }, [])

  const getGradePreview = useCallback((studentId: string) => {
    const entry = gradeEntries[studentId]
    if (!entry || !assessment || entry.marks < 0) return null

    const percentage = (entry.marks / assessment.totalMarks) * 100
    const grade = calculateGrade(entry.marks, assessment.totalMarks)

    return { percentage: Math.round(percentage * 100) / 100, grade }
  }, [gradeEntries, assessment, calculateGrade])


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Enter Grades
          </CardTitle>
          <CardDescription>Enter grades for student assessments</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Assessment Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assessment">Select Assessment *</Label>
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an assessment" />
                </SelectTrigger>
                <SelectContent>
                  {teacherAssessments.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      <p>No assessments available for your assigned classes.</p>
                      <p className="mt-1 text-xs">Please contact the administrator to create assessments.</p>
                    </div>
                  ) : (
                    teacherAssessments.map((assessment) => (
                      <SelectItem key={assessment.id} value={assessment.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{assessment.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {assessment.className}
                          </Badge>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {assessment.type}
                          </Badge>
                          {assessment.subject && (
                            <Badge variant="outline" className="text-xs">
                              {assessment.subject}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.assessment && <p className="text-sm text-red-600">{errors.assessment}</p>}
              {teacherAssessments.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">
                  No assessments found for your assigned classes. Assessments are created by administrators.
                </p>
              )}
            </div>

            {/* Assessment Details */}
            {assessment && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Subject:</span>
                    <p>{assessment.subject}</p>
                  </div>
                  <div>
                    <span className="font-medium">Class:</span>
                    <p>{assessment.className}</p>
                  </div>
                  <div>
                    <span className="font-medium">Total Marks:</span>
                    <p>{assessment.totalMarks}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <p>{new Date(assessment.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {assessment && loadingStudents && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium mb-2">Loading Students...</h3>
            <p className="text-muted-foreground">Please wait while we load students for this class.</p>
          </CardContent>
        </Card>
      )}

      {/* Grade Entry Table */}
      {assessment && !loadingStudents && classStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Grades ({classStudents.length} students)
            </CardTitle>
            <CardDescription>Enter marks for each student</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Marks (/{assessment.totalMarks})</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.map((student) => {
                    const entry = gradeEntries[student.id] || { marks: 0, remarks: "" }
                    const preview = getGradePreview(student.id)
                    const hasError = errors[`marks_${student.id}`]

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-muted-foreground">{student.studentId}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={assessment.totalMarks}
                            value={entry.marks}
                            onChange={(e) =>
                              handleGradeChange(student.id, "marks", Number.parseInt(e.target.value) || 0)
                            }
                            className={`w-20 ${hasError ? "border-red-500" : ""}`}
                          />
                          {hasError && <p className="text-xs text-red-600 mt-1">{hasError}</p>}
                        </TableCell>
                        <TableCell>
                          {preview ? (
                            <span className="font-medium">{preview.percentage}%</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {preview ? (
                            <Badge
                              variant="outline"
                              className={`${
                                preview.grade === "A"
                                  ? "text-green-600"
                                  : preview.grade === "B"
                                    ? "text-blue-600"
                                    : preview.grade === "C"
                                      ? "text-yellow-600"
                                      : preview.grade === "D"
                                        ? "text-orange-600"
                                        : preview.grade === "E"
                                          ? "text-red-500"
                                          : "text-red-700"
                              }`}
                            >
                              {preview.grade}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={entry.remarks}
                            onChange={(e) => handleGradeChange(student.id, "remarks", e.target.value)}
                            placeholder="Optional remarks..."
                            rows={1}
                            className="min-h-[32px] resize-none"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Error Message */}
              {errors.submit && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save All Grades"}
                </Button>
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* No Students Message */}
      {assessment && !loadingStudents && classStudents.length === 0 && students.length > 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Students Found</h3>
            <p className="text-muted-foreground">
              No students are enrolled in class "{assessment.className}" (Class ID: {assessment.classId}).
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Total students loaded: {students.length}. Please ensure students are assigned to this class.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Students and No Data Loaded */}
      {assessment && !loadingStudents && classStudents.length === 0 && students.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Students Loaded</h3>
            <p className="text-muted-foreground">Unable to load students. Please check your connection and try again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
