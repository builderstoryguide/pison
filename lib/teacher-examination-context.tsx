"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { supabase } from "./supabase"
import { useAuth } from "./auth-context"
import type { Examination } from "./examination-context"

interface TeacherExaminationContextType {
  examinations: Examination[]
  isLoading: boolean
  error: string | null
  loadExaminationsForTeacher: () => Promise<void>
  getExaminationById: (id: string) => Examination | undefined
  refreshExaminations: () => Promise<void>
}

const TeacherExaminationContext = createContext<TeacherExaminationContextType | undefined>(undefined)

export function TeacherExaminationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [examinations, setExaminations] = useState<Examination[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadExaminationsForTeacher = useCallback(async () => {
    if (!supabase || !user || user.role !== 'teacher' || !user.id) {
      console.warn("Cannot load examinations: User not authenticated or not a teacher")
      setExaminations([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // First, get teacher's assigned subjects
      const { data: teacherSubjects, error: subjectsError } = await supabase
        .from("teacher_subjects")
        .select("subject_name")
        .eq("teacher_id", user.id)
        .eq("is_active", true)

      if (subjectsError) {
        console.error("Error loading teacher subjects:", subjectsError)
        // Continue even if this fails - we'll filter later
      }

      const teacherSubjectNames = (teacherSubjects || []).map((ts: any) => ts.subject_name)

      // Get teacher's assigned classes
      // Check if teacher is class teacher or assigned via class_teachers
      const { data: teacherClasses, error: classesError } = await supabase
        .from("classes")
        .select("class_level, subsystem, stream")
        .eq("class_teacher_id", user.id)
        .eq("status", "active")

      if (classesError) {
        console.error("Error loading teacher classes:", classesError)
      }

      // Build filters for examinations
      // Examinations should match:
      // 1. Teacher's subjects (examination subjects overlap with teacher subjects)
      // 2. Teacher's classes (examination level/subsystem/branch match teacher's classes)
      // 3. Status is 'scheduled' or 'ongoing'

      let query = supabase
        .from("examinations")
        .select("*")
        .in("status", ["scheduled", "ongoing"])

      // Filter by teacher's subsystem and branch if available
      if (user.subsystem) {
        query = query.eq("subsystem", user.subsystem)
      }

      if (user.branch) {
        query = query.eq("branch", user.branch)
      }

      const { data: allExaminations, error: examsError } = await query

      if (examsError) {
        console.error("Error loading examinations:", examsError)
        throw new Error(`Failed to load examinations: ${examsError.message}`)
      }

      // Filter examinations to only include those relevant to the teacher
      const filteredExaminations = (allExaminations || []).filter((exam: any) => {
        // Check if examination has any subjects that match teacher's subjects
        const examSubjects = exam.subjects || []
        const hasMatchingSubject = teacherSubjectNames.length === 0 || 
          examSubjects.some((subject: string) => teacherSubjectNames.includes(subject))

        // Check if examination level matches teacher's classes
        const hasMatchingLevel = teacherClasses && teacherClasses.length > 0
          ? teacherClasses.some((cls: any) => 
              cls.class_level === exam.level &&
              cls.subsystem === exam.subsystem &&
              (cls.stream || 'grammar') === exam.branch
            )
          : true // If no classes found, don't filter by level

        // If teacher has no subjects assigned, show all examinations matching their subsystem/branch
        if (teacherSubjectNames.length === 0 && teacherClasses && teacherClasses.length === 0) {
          return hasMatchingLevel || (user.subsystem === exam.subsystem && user.branch === exam.branch)
        }

        return hasMatchingSubject && (hasMatchingLevel || teacherClasses.length === 0)
      })

      // Transform database data to match Examination interface
      const transformedExaminations: Examination[] = filteredExaminations.map((exam: any) => ({
        id: exam.id,
        title: exam.title,
        type: exam.type,
        examBoard: exam.exam_board,
        subsystem: exam.subsystem,
        branch: exam.branch,
        level: exam.level,
        subjects: exam.subjects || [],
        startDate: exam.start_date,
        endDate: exam.end_date,
        duration: exam.duration,
        totalMarks: exam.total_marks,
        passingMarks: exam.passing_marks,
        venue: exam.venue,
        instructions: exam.instructions || "",
        status: exam.status,
        createdAt: exam.created_at,
        createdBy: exam.created_by || "unknown",
        enrolledStudents: exam.enrolled_students || 0,
        completedStudents: exam.completed_students || 0,
        results: [],
      }))

      setExaminations(transformedExaminations)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load examinations"
      setError(errorMessage)
      console.error("Error loading examinations for teacher:", err)
      setExaminations([])
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const getExaminationById = useCallback(
    (id: string): Examination | undefined => {
      return examinations.find((exam) => exam.id === id)
    },
    [examinations],
  )

  const refreshExaminations = useCallback(async () => {
    await loadExaminationsForTeacher()
  }, [loadExaminationsForTeacher])

  // Load examinations when component mounts or user changes
  useEffect(() => {
    if (user && user.role === 'teacher') {
      loadExaminationsForTeacher()
    }
  }, [user, loadExaminationsForTeacher])

  const value: TeacherExaminationContextType = {
    examinations,
    isLoading,
    error,
    loadExaminationsForTeacher,
    getExaminationById,
    refreshExaminations,
  }

  return (
    <TeacherExaminationContext.Provider value={value}>
      {children}
    </TeacherExaminationContext.Provider>
  )
}

export function useTeacherExamination() {
  const context = useContext(TeacherExaminationContext)
  if (context === undefined) {
    throw new Error("useTeacherExamination must be used within a TeacherExaminationProvider")
  }
  return context
}

