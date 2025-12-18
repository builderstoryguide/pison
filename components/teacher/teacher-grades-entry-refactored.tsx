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
import { SequenceNavigator } from "./grades/sequence-navigator"
import { useTeacherAssignments } from "@/hooks/use-teacher-assignments"
import { useClassStudents } from "@/hooks/use-class-students"
import { useClassSubjectStatus } from "@/hooks/use-grade-entry-status"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useGlobalAcademicYear } from "@/lib/app-configuration-context-v2"
import { useSequenceConfiguration, type Sequence } from "@/hooks/use-sequence-configuration"

interface TeacherGradesEntryRefactoredProps {
  preSelectedClassId?: string
  preSelectedSubjectId?: string
}

// Fallback sequences if API fails
const FALLBACK_SEQUENCES = [
  { id: '1st-sequence', name: '1st Sequence', sequence_number: 1 },
  { id: '2nd-sequence', name: '2nd Sequence', sequence_number: 2 },
  { id: '3rd-sequence', name: '3rd Sequence', sequence_number: 3 },
  { id: '4th-sequence', name: '4th Sequence', sequence_number: 4 },
  { id: '5th-sequence', name: '5th Sequence', sequence_number: 5 },
  { id: '6th-sequence', name: '6th Sequence', sequence_number: 6 }
]

export function TeacherGradesEntryRefactored({ preSelectedClassId, preSelectedSubjectId }: TeacherGradesEntryRefactoredProps = {}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const globalAcademicYear = useGlobalAcademicYear()

  // State
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [saveAndContinue, setSaveAndContinue] = useState(false)

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
    getGradesForSubmission,
    setInitialGrades
  } = useGradeEntry(students, coefficient, maxMarks)

  const currentClass = classes.find(c => c.id.toString() === selectedClass)
  const academicYear = currentClass?.academicYear || globalAcademicYear

  // Fetch sequence configuration
  const { data: sequenceConfig } = useSequenceConfiguration(academicYear)

  // Derived state for terms and filtered sequences
  const terms = sequenceConfig?.sequences 
    ? Array.from(new Set(sequenceConfig.sequences.map(s => s.term))).sort() 
    : []

  // Filter sequences based on selected term
  const filteredSequences = sequenceConfig?.sequences
    ? sequenceConfig.sequences
        .filter(s => s.is_active && (!selectedTerm || s.term === selectedTerm))
        .sort((a, b) => a.sequence_number - b.sequence_number)
    : FALLBACK_SEQUENCES

  // Unify sequence types (API vs Fallback)
  const examinationSequences = filteredSequences.map(s => {
    const seq = s as (Sequence & { name?: string })
    return {
      ...s,
      name: seq.name || seq.sequence_name || `Sequence ${s.sequence_number}`
    }
  })

  // Reset exam when term changes
  useEffect(() => {
    setSelectedExam("")
  }, [selectedTerm, setSelectedExam])

  // Get sequence status for current class/subject
  const { sequences: sequenceStatuses, classSubjectStatus } = useClassSubjectStatus(
    selectedClass,
    selectedSubject,
    { enabled: !!selectedClass && !!selectedSubject }
  )

  // Map sequences with status
  const sequencesWithStatus = examinationSequences.map(seq => {
    const status = sequenceStatuses.find(s => 
      s.sequenceId === seq.id || 
      s.sequenceName === seq.name ||
      s.sequenceNumber === seq.sequence_number
    )
    return {
      ...seq,
      isCompleted: status?.isCompleted || false,
      completedDate: status?.completedDate,
      studentCount: status?.studentCount || students.length,
      enteredCount: status?.enteredCount || 0
    }
  })

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
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedExam) {
      toast({
        title: "Validation Error",
        description: "Please select class, subject, term and examination",
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
        const academicYear = currentClass?.academicYear || globalAcademicYear
        const term = selectedTerm
        const sequenceName = examinationSequences.find(e => e.id === selectedExam)?.name || selectedExam // fallback if needed

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
              title: `${sequenceName}`,
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
            term: selectedTerm,
            examinationName: examinationSequences.find(e => e.id === selectedExam)?.name || selectedExam,
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

      // Auto-advance to next pending sequence if enabled
      if (saveAndContinue) {
        const currentIndex = sequencesWithStatus.findIndex(s => s.id === selectedExam)
        const nextPending = sequencesWithStatus.find((s, idx) => idx > currentIndex && !s.isCompleted)
        
        if (nextPending) {
          setTimeout(() => {
            setSelectedExam(nextPending.id)
            toast({
              title: "Moved to next sequence",
              description: `Now entering grades for ${nextPending.name}`
            })
          }, 500)
        } else {
          toast({
            title: "All sequences complete",
            description: "You've completed all sequences for this class and subject"
          })
        }
      }

      setSaveAndContinue(false)
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
        examinationSequences={examinationSequences.map(s => ({ id: s.id, name: s.name }))}
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
        // New props for Term selection
        terms={terms}
        selectedTerm={selectedTerm}
        onTermChange={setSelectedTerm}
      />

      {/* Sequence Navigator */}
      {selectedClass && selectedSubject && sequencesWithStatus.length > 0 && (
        <Card className="p-4">
            <SequenceNavigator
            sequences={sequencesWithStatus.map(s => ({
              ...s,
              sequenceId: s.id,
              sequenceName: s.name,
              sequenceNumber: s.sequence_number
            }))}
            currentSequenceId={selectedExam}
            onSequenceSelect={setSelectedExam}
            showProgress={true}
          />
        </Card>
      )}

      {/* Completion Checklist Sidebar */}
      {selectedClass && selectedSubject && classSubjectStatus && (
        <Card className="p-4">
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Completion Status</h3>
            <div className="space-y-1">
              {sequencesWithStatus.map((seq) => (
                <div
                  key={seq.id}
                  className={`flex items-center gap-2 text-sm p-2 rounded ${
                    seq.isCompleted ? 'bg-green-50 dark:bg-green-950' : 'bg-muted/50'
                  }`}
                >
                  {seq.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={seq.isCompleted ? 'line-through text-muted-foreground' : ''}>
                    {seq.name}
                  </span>
                  {seq.id === selectedExam && (
                    <Badge variant="outline" className="ml-auto text-xs">Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Grades Table */}
      {selectedClass && selectedSubject && selectedExam && (
        <div className="space-y-4">
          <StudentGradesTable
            students={students}
            grades={grades}
            maxMarks={maxMarks}
            coefficient={coefficient}
            enteredCount={enteredCount}
            onMarkChange={updateGrade}
            onRemarksChange={updateRemarks}
            onClearAll={clearAll}
            onSubmit={() => {
              setSaveAndContinue(false)
              handleSubmit()
            }}
            isSubmitting={submitting}
            isLoading={loadingStudents}
          />
          
          {/* Additional Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setSaveAndContinue(false)
                handleSubmit()
              }}
              disabled={submitting}
            >
              Save Grades
            </Button>
            <Button
              onClick={() => {
                setSaveAndContinue(true)
                handleSubmit()
              }}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save and Continue to Next Sequence"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
