"use client"

/**
 * Refactored Teacher Grades Entry Component
 * 
 * This is a cleaner version using extracted utilities and hooks.
 * To use this version:
 * 1. Rename current teacher-grades-entry.tsx to teacher-grades-entry-old.tsx
 * 2. Rename this file to teacher-grades-entry.tsx
 * 3. Test thoroughly before removing old version
 */

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useGradableItems } from "@/hooks/use-gradable-items"
import { useGradeEntry } from "@/hooks/use-grade-entry"
import { GradeEntryFilters } from "./grades/grade-entry-filters"
import { StudentGradesTable } from "./grades/student-grades-table"
import { useTeacherAssignments } from "@/hooks/use-teacher-assignments"
import { useClassStudents } from "@/hooks/use-class-students"

interface ClassAssignment {
  id: number
  name: string
  code: string
  subjects: unknown[]
  academicYear?: string
  [key: string]: unknown
}

interface TeacherGradesEntryRefactoredProps {
  preSelectedClassId?: string
  preSelectedSubjectId?: string
}

// Static examination sequences
const EXAMINATION_SEQUENCES = [
  { id: '1st-sequence', name: '1st Sequence' },
  { id: '2nd-sequence', name: '2nd Sequence' },
  { id: '3rd-sequence', name: '3rd Sequence' },
  { id: '4th-sequence', name: '4th Sequence' },
  { id: '5th-sequence', name: '5th Sequence' },
  { id: '6th-sequence', name: '6th Sequence' }
]

export function TeacherGradesEntryRefactored({ preSelectedClassId, preSelectedSubjectId }: TeacherGradesEntryRefactoredProps = {}) {
  const { user } = useAuth()
  const { toast } = useToast()

  // State
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  // React Query Hooks
  const { 
    data: classes = [], 
    isLoading: loadingClasses 
  } = useTeacherAssignments(true)

  const { 
    data: students = [], 
    isLoading: loadingStudents 
  } = useClassStudents(selectedClass || undefined)

  // Custom hooks
  const {
    items: gradableItems,
    loading: loadingSubjects
  } = useGradableItems(selectedClass, user?.id)

  const selectedItem = gradableItems.find(item => item.id === selectedSubject)
  const maxMarks = selectedItem?.maxMarks || 20
  const coefficient = selectedItem?.coefficient || 1.0

  const {
    grades,
    updateGrade,
    updateRemarks,
    clearAll,
    validate,
    enteredCount,
    getGradesForSubmission
  } = useGradeEntry(students, coefficient, maxMarks)

  // Auto-select subject if pre-selected
  useEffect(() => {
    if (preSelectedSubjectId && gradableItems.length > 0) {
      const subjectExists = gradableItems.some(s => s.id.toString() === preSelectedSubjectId)
      if (subjectExists) {
        setSelectedSubject(preSelectedSubjectId)
      }
    }
  }, [preSelectedSubjectId, gradableItems])

  // Auto-select class if pre-selected
  useEffect(() => {
    if (preSelectedClassId && classes.length > 0 && !selectedClass) {
      setSelectedClass(preSelectedClassId)
    }
  }, [preSelectedClassId, classes, selectedClass])

  // Handle submission
  const handleSubmit = async () => {
    if (!selectedClass || !selectedSubject || !selectedExam) {
      toast({
        title: "Validation Error",
        description: "Please select class, subject, and examination",
        variant: "destructive"
      })
      return
    }

    // Validate all marks
    const validation = validate()
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.message,
        variant: "destructive"
      })
      return
    }

    const gradesToSubmit = getGradesForSubmission()
    if (gradesToSubmit.length === 0) {
      toast({
        title: "No Marks Entered",
        description: "Please enter at least one mark before submitting",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)

      const currentClass = classes.find(c => c.id.toString() === selectedClass)

      if (selectedItem?.type === 'branch') {
        // Handle Branch Grades
        const academicYear = currentClass?.academicYear || new Date().getFullYear().toString()
        const term = EXAMINATION_SEQUENCES.find(e => e.id === selectedExam)?.name || selectedExam

        // Search for existing assessment
        const searchParams = new URLSearchParams({
          branchId: selectedSubject,
          classId: selectedClass,
          academicYear,
          term,
          type: 'exam'
        })

        const searchRes = await fetch(`/api/branch-assessments?${searchParams.toString()}`)
        let assessmentId = ''

        if (searchRes.ok) {
          const searchData = await searchRes.json()
          if (searchData.success && searchData.assessments?.length > 0) {
            assessmentId = searchData.assessments[0].id
          }
        }

        if (!assessmentId) {
          // Create new assessment
          const createRes = await fetch('/api/branch-assessments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              branch_id: selectedSubject,
              teacher_id: user?.id,
              class_id: selectedClass,
              title: `${term} Exam`,
              type: 'exam',
              total_marks: maxMarks,
              academic_year: academicYear,
              term,
              assessment_date: new Date().toISOString()
            })
          })

          const createData = await createRes.json()
          if (!createData.success) {
            throw new Error(createData.error || 'Failed to create assessment')
          }
          assessmentId = createData.assessment.id
        }

        // Submit grades
        const promises = gradesToSubmit.map(entry => {
          const markValue = typeof entry.mark === 'number' ? entry.mark : parseFloat(entry.mark as string)
          return fetch('/api/branch-grades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assessment_id: assessmentId,
              student_id: entry.studentId,
              teacher_id: user?.id,
              marks_obtained: markValue,
              remarks: entry.remarks
            })
          })
        })

        const results = await Promise.all(promises)
        const failed = results.filter(r => !r.ok)

        if (failed.length > 0) {
          throw new Error(`Failed to submit ${failed.length} grades`)
        }
      } else {
        // Handle Legacy Subject Grades
        const response = await fetch('/api/grades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: selectedClass,
            subjectId: selectedSubject,
            examinationName: EXAMINATION_SEQUENCES.find(e => e.id === selectedExam)?.name || selectedExam,
            teacherId: user?.id,
            grades: gradesToSubmit.map(entry => {
              const markValue = typeof entry.mark === 'number' ? entry.mark : parseFloat(entry.mark as string)
              return {
                studentId: entry.studentId,
                mark: markValue,
                coefficient: entry.coefficient,
                totalMarks: entry.totalMarks,
                grade: entry.grade,
                rank: entry.rank,
                remarks: entry.remarks
              }
            })
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to submit grades')
        }
      }

      toast({
        title: "Success",
        description: `Successfully submitted ${gradesToSubmit.length} grades`
      })

      clearAll()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit grades",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {selectedItem ? `${selectedItem.name} Grades` : 'Enter Grades'}
        </h1>
        <p className="text-muted-foreground">
          {selectedClass && classes.find(c => c.id.toString() === selectedClass)
            ? `Entering grades for ${classes.find(c => c.id.toString() === selectedClass)?.name || 'selected class'}`
            : 'Enter student grades for examinations and assessments'
          }
        </p>
      </div>

      {/* Filters */}
      <GradeEntryFilters
        classes={classes}
        gradableItems={gradableItems}
        examinationSequences={EXAMINATION_SEQUENCES}
        selectedClass={selectedClass}
        selectedSubject={selectedSubject}
        selectedExam={selectedExam}
        onClassChange={setSelectedClass}
        onSubjectChange={setSelectedSubject}
        onExamChange={setSelectedExam}
        loadingClasses={loadingClasses}
        loadingSubjects={loadingSubjects}
        preSelectedClassId={preSelectedClassId}
        preSelectedSubjectId={preSelectedSubjectId}
      />

      {/* Grades Table */}
      {selectedClass && selectedSubject && selectedExam && (
        <StudentGradesTable
          students={students}
          grades={grades}
          maxMarks={maxMarks}
          coefficient={coefficient}
          enteredCount={enteredCount}
          onMarkChange={updateGrade}
          onRemarksChange={updateRemarks}
          onClearAll={clearAll}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
          isLoading={loadingStudents}
        />
      )}
    </div>
  )
}
