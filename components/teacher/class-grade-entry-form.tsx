"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Save, X, Users, BookOpen, ArrowLeft, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTeacherClasses } from "@/lib/teacher-classes-context"
import { useTeacherGrades } from "@/lib/teacher-grades-context"

interface ClassGradeEntryFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ClassGradeEntryForm({ onSuccess, onCancel }: ClassGradeEntryFormProps) {
  // Use teacher classes hook (same as "My Classes" dashboard)
  const { classes: teacherClasses, isLoading: classesLoading, loadTeacherClasses } = useTeacherClasses()
  
  // Use teacher grades hook only for assessments and grade operations
  const {
    assessments,
    grades,
    addGrade,
    getGradesByAssessment,
    getAssessmentsForTeacher,
    calculateGrade,
    loadAssessments,
    loading,
  } = useTeacherGrades()

  // State management
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("")
  const [gradeEntries, setGradeEntries] = useState<Record<string, { marks: number; remarks: string }>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load classes and assessments on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadTeacherClasses(),
          loadAssessments(),
        ])
      } catch (error) {
        console.error("Error loading data in ClassGradeEntryForm:", error)
      }
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get selected class
  const selectedClass = useMemo(() => {
    const found = teacherClasses.find((cls) => cls.id === selectedClassId)
    
    if (selectedClassId && !found) {
      console.error('❌ Selected class not found in teacherClasses:', {
        selectedClassId,
        availableClassIds: teacherClasses.map(c => c.id),
        availableClassNames: teacherClasses.map(c => c.name),
        totalClasses: teacherClasses.length
      })
    } else if (found) {
      console.log('✅ Selected class found:', {
        classId: found.id,
        className: found.name,
        studentsCount: found.students?.length || 0,
        hasStudentsArray: Array.isArray(found.students)
      })
    }
    
    return found
  }, [teacherClasses, selectedClassId])
  
  // Log when selectedClass changes
  useEffect(() => {
    if (selectedClass) {
      console.log('🔄 Selected class changed:', {
        classId: selectedClass.id,
        className: selectedClass.name,
        level: selectedClass.level,
        studentsCount: selectedClass.students?.length || 0,
        students: selectedClass.students?.map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          enrollmentStatus: s.enrollmentStatus
        })) || []
      })
    }
  }, [selectedClass])

  // Get students from selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) {
      console.log('⚠️ No selected class, returning empty students array')
      return []
    }
    
    // Log selected class data
    console.log('📚 Selected class data:', {
      classId: selectedClass.id,
      className: selectedClass.name,
      totalStudents: selectedClass.students?.length || 0,
      studentsArray: selectedClass.students,
      studentsUndefined: selectedClass.students === undefined,
      studentsNull: selectedClass.students === null
    })
    
    // Check if students array exists
    if (!selectedClass.students) {
      console.error('❌ Selected class has no students array:', {
        classId: selectedClass.id,
        className: selectedClass.name,
        selectedClassKeys: Object.keys(selectedClass)
      })
      return []
    }
    
    if (!Array.isArray(selectedClass.students)) {
      console.error('❌ Selected class students is not an array:', {
        classId: selectedClass.id,
        className: selectedClass.name,
        studentsType: typeof selectedClass.students,
        studentsValue: selectedClass.students
      })
      return []
    }
    
    // Log all students and their enrollment status
    const allStudents = selectedClass.students || []
    console.log('👥 All students in class:', {
      classId: selectedClass.id,
      className: selectedClass.name,
      totalStudents: allStudents.length,
      students: allStudents.map(s => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        enrollmentStatus: s.enrollmentStatus,
        studentId: s.studentId
      }))
    })
    
    // Filter by enrollment status
    const enrolledStudents = allStudents.filter((s) => {
      const isEnrolled = s.enrollmentStatus === "enrolled"
      if (!isEnrolled) {
        console.log(`⚠️ Student filtered out (not enrolled):`, {
          studentId: s.id,
          name: `${s.firstName} ${s.lastName}`,
          enrollmentStatus: s.enrollmentStatus,
          enrollmentStatusType: typeof s.enrollmentStatus
        })
      }
      return isEnrolled
    })
    
    console.log('✅ Filtered enrolled students:', {
      classId: selectedClass.id,
      className: selectedClass.name,
      totalStudents: allStudents.length,
      enrolledStudents: enrolledStudents.length,
      filteredOut: allStudents.length - enrolledStudents.length,
      enrolledStudentIds: enrolledStudents.map(s => s.id)
    })
    
    return enrolledStudents
  }, [selectedClass])

  // Get assessments for the selected class (filter by class_id, class_name, or class_level)
  const classAssessments = useMemo(() => {
    if (!selectedClassId) return []
    
    const allAssessments = getAssessmentsForTeacher()
    
    // Convert selectedClassId to string for consistent comparison
    const selectedClassIdStr = selectedClassId.toString().toLowerCase().trim()
    const selectedClassIdOriginal = selectedClassId.toString()
    
    // Normalize selected class level and name for comparison
    const selectedClassLevel = selectedClass?.level?.toLowerCase().trim() || ''
    const selectedClassName = selectedClass?.name?.toLowerCase().trim() || ''
    
    // Extract base level from class name (e.g., "Form 2" from "Form 2 BC")
    const selectedClassLevelFromName = selectedClassName.split(/\s+/).slice(0, 2).join(' ').toLowerCase().trim()
    
    console.log('🔍 Filtering assessments for class:', {
      selectedClassId: selectedClassIdStr,
      selectedClassIdOriginal,
      selectedClassLevel,
      selectedClassName,
      selectedClassLevelFromName,
      totalAssessments: allAssessments.length,
      assessments: allAssessments.map(a => ({
        id: a.id,
        title: a.title,
        classId: a.classId,
        className: a.className,
        classLevel: a.classLevel
      }))
    })
    
    const filtered = allAssessments.filter((assessment) => {
      // Normalize assessment class_id to string for comparison
      const assessmentClassId = (assessment.classId?.toString() || '').toLowerCase().trim()
      const assessmentClassIdOriginal = assessment.classId?.toString() || ''
      
      // Normalize assessment class_name if it exists
      const assessmentClassName = (assessment.className || '').toLowerCase().trim()
      
      // Normalize assessment class level
      const assessmentClassLevel = (assessment.classLevel || '').toLowerCase().trim()
      
      // Match 1: Check if assessment's class_id matches selected class ID (UUID)
      let matchesClassId = false
      if (assessmentClassId && selectedClassIdStr) {
        // Direct normalized string comparison
        matchesClassId = assessmentClassId === selectedClassIdStr
        
        // Also check original formats
        if (!matchesClassId) {
          matchesClassId = assessmentClassIdOriginal === selectedClassIdOriginal ||
                          assessment.classId === selectedClassId ||
                          assessmentClassIdOriginal === selectedClassId ||
                          assessment.classId === selectedClassIdOriginal
        }
      }
      
      // Match 2: Check if assessment's class_name matches selected class name
      let matchesClassName = false
      if (assessmentClassName && selectedClassName) {
        // Exact match
        matchesClassName = assessmentClassName === selectedClassName
        
        // Partial match - check if selected class name contains assessment class name or vice versa
        if (!matchesClassName) {
          matchesClassName = selectedClassName.includes(assessmentClassName) ||
                           assessmentClassName.includes(selectedClassName) ||
                           selectedClassName.startsWith(assessmentClassName) ||
                           assessmentClassName.startsWith(selectedClassName)
        }
      }
      
      // Match 3: Check if assessment's class_id matches selected class name (for assessments created with class name as class_id)
      let matchesClassIdAsName = false
      if (!matchesClassId && !matchesClassName && selectedClassName) {
        matchesClassIdAsName = assessmentClassId === selectedClassName ||
                              assessmentClassIdOriginal.toLowerCase().trim() === selectedClassName ||
                              selectedClassName.includes(assessmentClassId) ||
                              assessmentClassId.includes(selectedClassName)
      }
      
      // Match 4: Check if assessment's class level matches selected class level
      let matchesClassLevel = false
      if (selectedClassLevel && assessmentClassLevel) {
        matchesClassLevel = assessmentClassLevel === selectedClassLevel
      }
      
      // Match 5: Check if assessment's class_id matches selected class level (for assessments created with level as class_id)
      let matchesClassIdAsLevel = false
      if (!matchesClassId && !matchesClassName && !matchesClassLevel && selectedClassLevel) {
        matchesClassIdAsLevel = assessmentClassId === selectedClassLevel ||
                               assessmentClassIdOriginal.toLowerCase().trim() === selectedClassLevel ||
                               selectedClassLevel.includes(assessmentClassId) ||
                               assessmentClassId.includes(selectedClassLevel)
      }
      
      // Match 6: Check if assessment's class_name or class_id contains the base level (e.g., "Form 2" matches "Form 2 BC")
      let matchesPartialLevel = false
      if (!matchesClassId && !matchesClassName && !matchesClassLevel && selectedClassLevelFromName) {
        const assessmentClassIdContainsLevel = assessmentClassId.includes(selectedClassLevelFromName) ||
                                              selectedClassLevelFromName.includes(assessmentClassId)
        const assessmentClassNameContainsLevel = assessmentClassName.includes(selectedClassLevelFromName) ||
                                                selectedClassLevelFromName.includes(assessmentClassName)
        const assessmentLevelContainsLevel = assessmentClassLevel.includes(selectedClassLevelFromName) ||
                                            selectedClassLevelFromName.includes(assessmentClassLevel)
        
        matchesPartialLevel = assessmentClassIdContainsLevel || 
                            assessmentClassNameContainsLevel || 
                            assessmentLevelContainsLevel
      }
      
      const matches = matchesClassId || matchesClassName || matchesClassIdAsName || 
                     matchesClassLevel || matchesClassIdAsLevel || matchesPartialLevel
      
      if (matches) {
        console.log('✅ Assessment matched:', {
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          assessmentClassId: assessmentClassIdOriginal,
          assessmentClassName: assessment.className,
          assessmentClassLevel,
          matchesClassId,
          matchesClassName,
          matchesClassIdAsName,
          matchesClassLevel,
          matchesClassIdAsLevel,
          matchesPartialLevel
        })
      } else {
        console.log('❌ Assessment NOT matched:', {
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          assessmentClassId: assessmentClassIdOriginal,
          assessmentClassName: assessment.className,
          assessmentClassLevel,
          selectedClassId: selectedClassIdStr,
          selectedClassName,
          selectedClassLevel
        })
      }
      
      return matches
    })
    
    console.log('📊 Assessment filtering result:', {
      totalAssessments: allAssessments.length,
      filteredAssessments: filtered.length,
      selectedClassId: selectedClassIdStr,
      selectedClassName,
      selectedClassLevel,
      matchedAssessmentIds: filtered.map(a => a.id)
    })
    
    return filtered
  }, [selectedClassId, selectedClass, getAssessmentsForTeacher])

  // Get selected assessment
  const selectedAssessment = useMemo(() => {
    return classAssessments.find((a) => a.id === selectedAssessmentId)
  }, [classAssessments, selectedAssessmentId])

  // Get existing grades for the selected assessment
  const existingGrades = useMemo(() => {
    return selectedAssessment ? getGradesByAssessment(selectedAssessment.id) : []
  }, [selectedAssessment?.id, getGradesByAssessment])

  // Initialize grade entries when assessment changes
  useEffect(() => {
    console.log('🔄 Assessment or students changed:', {
      hasAssessment: !!selectedAssessment,
      assessmentId: selectedAssessment?.id,
      assessmentTitle: selectedAssessment?.title,
      classStudentsCount: classStudents.length,
      existingGradesCount: existingGrades.length
    })
    
    if (selectedAssessment && classStudents.length > 0) {
      console.log('✅ Initializing grade entries for students:', {
        assessmentId: selectedAssessment.id,
        studentsCount: classStudents.length,
        studentIds: classStudents.map(s => s.id)
      })
      
      const initialEntries: Record<string, { marks: number; remarks: string }> = {}

      classStudents.forEach((student) => {
        const existingGrade = existingGrades.find((g) => g.studentId === student.id)
        initialEntries[student.id] = {
          marks: existingGrade?.marks || 0,
          remarks: existingGrade?.remarks || "",
        }
      })

      setGradeEntries(initialEntries)
      console.log('✅ Grade entries initialized:', {
        entriesCount: Object.keys(initialEntries).length,
        studentIds: Object.keys(initialEntries)
      })
    } else if (selectedAssessment && classStudents.length === 0) {
      console.warn('⚠️ Assessment selected but no students available:', {
        assessmentId: selectedAssessment.id,
        assessmentTitle: selectedAssessment.title,
        selectedClassId,
        selectedClassName: selectedClass?.name,
        selectedClassStudentsCount: selectedClass?.students?.length || 0
      })
      setGradeEntries({})
    } else if (!selectedAssessment) {
      console.log('ℹ️ No assessment selected, clearing grade entries')
      setGradeEntries({})
    }
  }, [selectedAssessment?.id, classStudents, existingGrades, selectedClassId, selectedClass?.name])

  // Reset assessment when class changes
  useEffect(() => {
    if (selectedClassId) {
      setSelectedAssessmentId("")
      setGradeEntries({})
      setErrors({})
    }
  }, [selectedClassId])

  const validateGrades = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!selectedClassId) {
      newErrors.class = "Please select a class"
      setErrors(newErrors)
      return false
    }

    if (!selectedAssessmentId) {
      newErrors.assessment = "Please select an assessment"
      setErrors(newErrors)
      return false
    }

    if (!selectedAssessment) {
      newErrors.assessment = "Selected assessment not found"
      setErrors(newErrors)
      return false
    }

    // Validate each grade entry
    Object.entries(gradeEntries).forEach(([studentId, entry]) => {
      if (entry.marks < 0) {
        newErrors[`marks_${studentId}`] = "Marks cannot be negative"
      }
      if (entry.marks > selectedAssessment.totalMarks) {
        newErrors[`marks_${studentId}`] = `Marks cannot exceed ${selectedAssessment.totalMarks}`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [selectedClassId, selectedAssessmentId, selectedAssessment, gradeEntries])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateGrades() || !selectedAssessment) return

    setErrors({})
    
    const results: Array<{ student: typeof classStudents[0]; success: boolean; error?: string }> = []

    // Submit grades for all students
    for (const student of classStudents) {
      const entry = gradeEntries[student.id]
      if (entry && entry.marks >= 0) {
        try {
          const percentage = (entry.marks / selectedAssessment.totalMarks) * 100
          const grade = calculateGrade(entry.marks, selectedAssessment.totalMarks)

          await addGrade({
            assessmentId: selectedAssessment.id,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            marks: entry.marks,
            percentage: Math.round(percentage * 100) / 100,
            grade,
            remarks: entry.remarks,
          })
          
          results.push({ student, success: true })
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : typeof error === 'string' 
            ? error 
            : 'Failed to save grade'
          
          results.push({ 
            student, 
            success: false, 
            error: errorMessage 
          })
          
          // Set error for this specific student
          setErrors((prev) => ({
            ...prev,
            [`student_${student.id}`]: errorMessage
          }))
        }
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const total = results.length

    if (failed > 0) {
      const failedStudents = results
        .filter(r => !r.success)
        .map(r => `${r.student.firstName} ${r.student.lastName}`)
        .join(', ')
      
      setErrors((prev) => ({
        ...prev,
        submit: `Failed to save grades for ${failed} of ${total} student(s): ${failedStudents}`
      }))
    }

    // Only call onSuccess if all grades were saved successfully
    if (failed === 0 && successful > 0 && onSuccess) {
      onSuccess()
    } else if (successful > 0) {
      // Some succeeded, show partial success message
      console.log(`Successfully saved ${successful} of ${total} grade(s)`)
    }
  }, [validateGrades, selectedAssessment, classStudents, gradeEntries, calculateGrade, addGrade, onSuccess])

  const handleGradeChange = useCallback((studentId: string, field: "marks" | "remarks", value: string | number) => {
    setGradeEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }))

    // Clear errors for this field
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
    if (!entry || !selectedAssessment || entry.marks < 0) return null

    const percentage = (entry.marks / selectedAssessment.totalMarks) * 100
    const grade = calculateGrade(entry.marks, selectedAssessment.totalMarks)

    return { percentage: Math.round(percentage * 100) / 100, grade }
  }, [gradeEntries, selectedAssessment, calculateGrade])

  // If no class is selected, show class selection view
  if (!selectedClassId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Enter Grades
            </CardTitle>
            <CardDescription>Select a class to enter grades for students</CardDescription>
          </CardHeader>
          <CardContent>
            {classesLoading ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                <p className="text-muted-foreground">Loading your classes...</p>
              </div>
            ) : teacherClasses.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Classes Assigned</h3>
                <p className="text-muted-foreground">
                  You don't have any classes assigned to you yet. Please contact the administrator.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teacherClasses.map((cls) => (
                  <Card
                    key={cls.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedClassId(cls.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                        <Badge variant="outline" className="capitalize">
                          {cls.subsystem}
                        </Badge>
                      </div>
                      <CardDescription>
                        {cls.level} • {cls.branch.charAt(0).toUpperCase() + cls.branch.slice(1)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Students:</span>
                          <span className="font-medium">
                            {(() => {
                              // Calculate enrolled students count
                              const enrolledCount = cls.students.filter((s) => s.enrollmentStatus === "enrolled").length
                              // Use currentEnrollment as fallback if students array is empty or count is 0
                              const studentCount = enrolledCount > 0 
                                ? enrolledCount 
                                : (cls.currentEnrollment || 0)
                              
                              // Debug logging
                              if (enrolledCount === 0 && cls.currentEnrollment) {
                                console.log('Student count fallback used:', {
                                  className: cls.name,
                                  classId: cls.id,
                                  enrolledCount,
                                  currentEnrollment: cls.currentEnrollment,
                                  totalStudents: cls.students.length
                                })
                              }
                              
                              return studentCount
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Subjects:</span>
                          <span className="font-medium">{cls.subjects.length}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedClassId(cls.id)
                        }}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Enter Grades
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Class and assessment selected - show grade entry form
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedClassId("")
                  setSelectedAssessmentId("")
                  setGradeEntries({})
                  setErrors({})
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Classes
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Enter Grades - {selectedClass?.name}
                </CardTitle>
                <CardDescription>
                  {selectedClass?.level} • {selectedClass?.subjects.length} subjects • {classStudents.length} students
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Assessment Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assessment">Select Assessment *</Label>
              <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an assessment for this class" />
                </SelectTrigger>
                <SelectContent>
                  {classAssessments.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      <p>No assessments available for this class.</p>
                      <p className="mt-1 text-xs">Please contact the administrator to create assessments.</p>
                    </div>
                  ) : (
                    classAssessments.map((assessment) => (
                      <SelectItem key={assessment.id} value={assessment.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{assessment.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {assessment.className || selectedClass?.name}
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
            </div>

            {/* Assessment Details */}
            {selectedAssessment && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Subject:</span>
                    <p>{selectedAssessment.subject}</p>
                  </div>
                  <div>
                    <span className="font-medium">Class:</span>
                    <p>{selectedAssessment.className || selectedClass?.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Total Marks:</span>
                    <p>{selectedAssessment.totalMarks}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <p>{new Date(selectedAssessment.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grade Entry Table */}
      {selectedAssessment && classStudents.length > 0 && (
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
                    <TableHead>Marks (/{selectedAssessment.totalMarks})</TableHead>
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
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{student.studentId}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={selectedAssessment.totalMarks}
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
      {selectedAssessment && classStudents.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Students Found</h3>
            <p className="text-muted-foreground mb-4">
              No enrolled students found in class "{selectedClass?.name}".
            </p>
            <div className="text-sm text-muted-foreground space-y-2">
              {selectedClass && (
                <>
                  <p>
                    <strong>Class ID:</strong> {selectedClass.id}
                  </p>
                  <p>
                    <strong>Total students in class data:</strong> {selectedClass.students?.length || 0}
                  </p>
                  {selectedClass.students && selectedClass.students.length > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                      <p className="font-medium mb-2">Students in class (may not be enrolled):</p>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedClass.students.map((student) => (
                          <li key={student.id}>
                            {student.firstName} {student.lastName} - Status: {student.enrollmentStatus || 'unknown'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(!selectedClass.students || selectedClass.students.length === 0) && (
                    <p className="text-red-600">
                      <strong>Debug:</strong> The class has no students array or it's empty. 
                      This may indicate students weren't loaded from the API.
                    </p>
                  )}
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  console.log('🔄 Reloading teacher classes...')
                  loadTeacherClasses()
                }}
                className="mt-4"
              >
                Reload Classes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Assessment Selected Message */}
      {selectedClassId && !selectedAssessmentId && classAssessments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Assessments Available</h3>
            <p className="text-muted-foreground">
              No assessments have been created for this class yet. Please contact the administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

