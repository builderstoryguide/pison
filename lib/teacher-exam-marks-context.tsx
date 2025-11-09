"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { supabase } from "./supabase"
import { useAuth } from "./auth-context"

export interface ExamMark {
  id?: string
  examinationId: string
  studentId: string
  studentName: string
  subject: string
  marksObtained: number
  totalMarks: number
  percentage: number
  grade?: string
  remarks?: string
  dateRecorded?: string
}

export interface Student {
  id: string
  name: string
  studentId?: string
  classId?: string
}

interface TeacherExamMarksContextType {
  isLoading: boolean
  error: string | null
  loadStudentsForClass: (classId: string) => Promise<Student[]>
  loadExistingMarks: (examinationId: string, classId: string, subject: string) => Promise<ExamMark[]>
  saveExamMarks: (marks: ExamMark[]) => Promise<{ success: boolean; error?: string }>
  updateExamMarks: (marks: ExamMark[]) => Promise<{ success: boolean; error?: string }>
  calculateGrade: (marksObtained: number, totalMarks: number) => string
  calculatePercentage: (marksObtained: number, totalMarks: number) => number
}

const TeacherExamMarksContext = createContext<TeacherExamMarksContextType | undefined>(undefined)

// Grade calculation function
function calculateGrade(marksObtained: number, totalMarks: number): string {
  const percentage = (marksObtained / totalMarks) * 100
  
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C+'
  if (percentage >= 40) return 'C'
  if (percentage >= 30) return 'D'
  return 'F'
}

export function TeacherExamMarksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStudentsForClass = useCallback(async (classId: string): Promise<Student[]> => {
    if (!supabase) {
      console.error("Supabase client not available")
      return []
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from("students")
        .select("id, first_name, last_name, student_id, class")
        .eq("class", classId)
        .eq("status", "active")
        .order("first_name", { ascending: true })

      if (fetchError) {
        console.error("Error loading students:", fetchError)
        throw new Error(`Failed to load students: ${fetchError.message}`)
      }

      const students: Student[] = (data || []).map((student: any) => ({
        id: student.id,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
        studentId: student.student_id,
        classId: student.class,
      }))

      return students
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load students"
      setError(errorMessage)
      console.error("Error loading students for class:", err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadExistingMarks = useCallback(
    async (examinationId: string, classId: string, subject: string): Promise<ExamMark[]> => {
      if (!supabase) {
        console.error("Supabase client not available")
        return []
      }

      setIsLoading(true)
      setError(null)

      try {
        // First, get all students in the class
        const { data: students, error: studentsError } = await supabase
          .from("students")
          .select("id, first_name, last_name")
          .eq("class", classId)
          .eq("status", "active")

        if (studentsError) {
          throw new Error(`Failed to load students: ${studentsError.message}`)
        }

        const studentIds = (students || []).map((s: any) => s.id)

        if (studentIds.length === 0) {
          return []
        }

        // Load existing marks for these students
        const { data: marksData, error: marksError } = await supabase
          .from("exam_results")
          .select("*")
          .eq("examination_id", examinationId)
          .eq("subject", subject)
          .in("student_id", studentIds)

        if (marksError) {
          console.error("Error loading existing marks:", marksError)
          // If no marks exist yet, that's okay - return empty array
          if (marksError.code === 'PGRST116' || marksError.message?.includes('does not exist')) {
            return []
          }
          throw new Error(`Failed to load marks: ${marksError.message}`)
        }

        const marks: ExamMark[] = (marksData || []).map((mark: any) => ({
          id: mark.id,
          examinationId: mark.examination_id,
          studentId: mark.student_id,
          studentName: mark.student_name,
          subject: mark.subject,
          marksObtained: parseFloat(mark.marks_obtained),
          totalMarks: mark.total_marks,
          percentage: parseFloat(mark.percentage),
          grade: mark.grade,
          remarks: mark.remarks,
          dateRecorded: mark.date_recorded,
        }))

        return marks
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load existing marks"
        setError(errorMessage)
        console.error("Error loading existing marks:", err)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const saveExamMarks = useCallback(
    async (marks: ExamMark[]): Promise<{ success: boolean; error?: string }> => {
      if (!supabase || !user) {
        return { success: false, error: "Database connection or user authentication not available" }
      }

      setIsLoading(true)
      setError(null)

      try {
        // Validate marks
        for (const mark of marks) {
          if (mark.marksObtained < 0) {
            throw new Error(`Marks cannot be negative for ${mark.studentName}`)
          }
          if (mark.marksObtained > mark.totalMarks) {
            throw new Error(`Marks cannot exceed total marks (${mark.totalMarks}) for ${mark.studentName}`)
          }
        }

        // Prepare data for insertion
        const marksData = marks.map((mark) => ({
          examination_id: mark.examinationId,
          student_id: mark.studentId,
          student_name: mark.studentName,
          subject: mark.subject,
          marks_obtained: mark.marksObtained,
          total_marks: mark.totalMarks,
          percentage: mark.percentage,
          grade: mark.grade,
          remarks: mark.remarks || null,
        }))

        // Insert marks (use upsert to handle duplicates)
        const { error: insertError } = await supabase
          .from("exam_results")
          .upsert(marksData, {
            onConflict: "examination_id,student_id,subject",
          })

        if (insertError) {
          console.error("Error saving exam marks:", insertError)
          throw new Error(`Failed to save marks: ${insertError.message}`)
        }

        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to save exam marks"
        setError(errorMessage)
        console.error("Error saving exam marks:", err)
        return { success: false, error: errorMessage }
      } finally {
        setIsLoading(false)
      }
    },
    [user],
  )

  const updateExamMarks = useCallback(
    async (marks: ExamMark[]): Promise<{ success: boolean; error?: string }> => {
      // Update is the same as save (upsert handles both)
      return saveExamMarks(marks)
    },
    [saveExamMarks],
  )

  const calculateGrade = useCallback((marksObtained: number, totalMarks: number): string => {
    return calculateGrade(marksObtained, totalMarks)
  }, [])

  const calculatePercentage = useCallback((marksObtained: number, totalMarks: number): number => {
    if (totalMarks === 0) return 0
    return Math.round((marksObtained / totalMarks) * 100 * 100) / 100 // Round to 2 decimal places
  }, [])

  const value: TeacherExamMarksContextType = {
    isLoading,
    error,
    loadStudentsForClass,
    loadExistingMarks,
    saveExamMarks,
    updateExamMarks,
    calculateGrade,
    calculatePercentage,
  }

  return (
    <TeacherExamMarksContext.Provider value={value}>
      {children}
    </TeacherExamMarksContext.Provider>
  )
}

export function useTeacherExamMarks() {
  const context = useContext(TeacherExamMarksContext)
  if (context === undefined) {
    throw new Error("useTeacherExamMarks must be used within a TeacherExamMarksProvider")
  }
  return context
}

