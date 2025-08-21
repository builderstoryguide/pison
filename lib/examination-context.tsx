"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { supabase } from "./supabase"

export interface ExamFormData {
  title: string
  type: "internal" | "external" | "mock" | "continuous_assessment"
  examBoard: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  level: string
  subjects: string[]
  startDate: string
  endDate: string
  duration: number
  totalMarks: number
  passingMarks: number
  venue: string
  instructions?: string
  status: "draft" | "scheduled" | "ongoing" | "completed" | "cancelled"
}

export interface ExamResult {
  id: string
  examId: string
  studentId: string
  studentName: string
  subject: string
  marksObtained: number
  totalMarks: number
  percentage: number
  grade: string
  remarks: string
  dateRecorded: string
}

export interface Examination {
  id: string
  title: string
  type: "internal" | "external" | "mock" | "continuous_assessment"
  examBoard: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  level: string
  subjects: string[]
  startDate: string
  endDate: string
  duration: number
  totalMarks: number
  passingMarks: number
  venue: string
  instructions: string
  status: "draft" | "scheduled" | "ongoing" | "completed" | "cancelled"
  createdAt: string
  createdBy: string
  enrolledStudents: number
  completedStudents: number
  results: ExamResult[]
}

interface ExaminationContextType {
  examinations: Examination[]
  isLoading: boolean
  createExamination: (data: ExamFormData) => Promise<{ success: boolean; examinationId?: string; error?: string }>
  updateExamination: (id: string, data: Partial<ExamFormData>) => Promise<{ success: boolean; error?: string }>
  deleteExamination: (id: string) => Promise<{ success: boolean; error?: string }>
  getExaminationById: (id: string) => Examination | undefined
  recordResult: (
    examId: string,
    result: Omit<ExamResult, "id" | "dateRecorded">,
  ) => Promise<{ success: boolean; error?: string }>
  updateResult: (resultId: string, data: Partial<ExamResult>) => Promise<{ success: boolean; error?: string }>
  getResultsByExam: (examId: string) => ExamResult[]
  getResultsByStudent: (studentId: string) => ExamResult[]
  generateReport: (examId: string) => Promise<{ success: boolean; reportData?: any; error?: string }>
}

const ExaminationContext = createContext<ExaminationContextType | undefined>(undefined)

// Mock implementation for testing when database is not available
const createMockExamination = async (data: ExamFormData): Promise<{ success: boolean; examinationId?: string; error?: string }> => {
  console.log("Using mock implementation for examination creation")
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Generate mock ID
  const mockId = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log("Mock examination created with ID:", mockId)
  
  return {
    success: true,
    examinationId: mockId
  }
}

export function ExaminationProvider({ children }: { children: React.ReactNode }) {
  const [examinations, setExaminations] = useState<Examination[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load examinations from database on mount
  useEffect(() => {
    loadExaminations()
  }, [])

  const loadExaminations = useCallback(async () => {
    console.log("loadExaminations called")
    
    if (!supabase) {
      console.error("Supabase client not available")
      return
    }

    console.log("Supabase client available, attempting to load examinations")

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("examinations")
        .select(`
          *,
          exam_results (*)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading examinations:", error)
        return
      }

      // Transform database data to match our interface
      const transformedExaminations: Examination[] = data.map((exam: any) => ({
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
        results: exam.exam_results || [],
      }))

      setExaminations(transformedExaminations)
    } catch (error) {
      console.error("Error loading examinations:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createExamination = useCallback(
    async (data: ExamFormData): Promise<{ success: boolean; examinationId?: string; error?: string }> => {
      console.log("createExamination called with data:", data)
      
      if (!supabase) {
        console.warn("Supabase client not available, using mock implementation")
        // Mock implementation for testing
        return createMockExamination(data)
      }

      setIsLoading(true)
      try {
        // Transform form data to database format
        const examinationData = {
          title: data.title,
          type: data.type,
          exam_board: data.examBoard,
          subsystem: data.subsystem,
          branch: data.branch,
          level: data.level,
          subjects: data.subjects,
          start_date: data.startDate,
          end_date: data.endDate,
          duration: data.duration,
          total_marks: data.totalMarks,
          passing_marks: data.passingMarks,
          venue: data.venue,
          instructions: data.instructions || "",
          status: data.status,
          enrolled_students: 0,
          completed_students: 0,
        }

        console.log("Attempting to insert examination data:", examinationData)

        const { data: newExam, error } = await supabase
          .from("examinations")
          .insert([examinationData])
          .select()
          .single()

        if (error) {
          console.error("Error creating examination:", error)
          return { success: false, error: error.message }
        }

        // Transform the created examination to match our interface
        const newExamination: Examination = {
          id: newExam.id,
          title: newExam.title,
          type: newExam.type,
          examBoard: newExam.exam_board,
          subsystem: newExam.subsystem,
          branch: newExam.branch,
          level: newExam.level,
          subjects: newExam.subjects || [],
          startDate: newExam.start_date,
          endDate: newExam.end_date,
          duration: newExam.duration,
          totalMarks: newExam.total_marks,
          passingMarks: newExam.passing_marks,
          venue: newExam.venue,
          instructions: newExam.instructions || "",
          status: newExam.status,
          createdAt: newExam.created_at,
          createdBy: newExam.created_by || "unknown",
          enrolledStudents: newExam.enrolled_students || 0,
          completedStudents: newExam.completed_students || 0,
          results: [],
        }

        // Add to local state
        setExaminations((prev) => [newExamination, ...prev])
        setIsLoading(false)
        return { success: true, examinationId: newExamination.id }
      } catch (error) {
        console.error("Error creating examination:", error)
        setIsLoading(false)
        return { success: false, error: "Failed to create examination" }
      }
    },
    [],
  )

  const updateExamination = useCallback(
    async (id: string, data: Partial<ExamFormData>): Promise<{ success: boolean; error?: string }> => {
      if (!supabase) {
        return { success: false, error: "Database connection not available" }
      }

      setIsLoading(true)
      try {
        // Transform form data to database format
        const updateData: any = {}
        if (data.title) updateData.title = data.title
        if (data.type) updateData.type = data.type
        if (data.examBoard) updateData.exam_board = data.examBoard
        if (data.subsystem) updateData.subsystem = data.subsystem
        if (data.branch) updateData.branch = data.branch
        if (data.level) updateData.level = data.level
        if (data.subjects) updateData.subjects = data.subjects
        if (data.startDate) updateData.start_date = data.startDate
        if (data.endDate) updateData.end_date = data.endDate
        if (data.duration) updateData.duration = data.duration
        if (data.totalMarks) updateData.total_marks = data.totalMarks
        if (data.passingMarks) updateData.passing_marks = data.passingMarks
        if (data.venue) updateData.venue = data.venue
        if (data.instructions !== undefined) updateData.instructions = data.instructions
        if (data.status) updateData.status = data.status

        const { error } = await supabase
          .from("examinations")
          .update(updateData)
          .eq("id", id)

        if (error) {
          console.error("Error updating examination:", error)
          return { success: false, error: error.message }
        }

        // Update local state
        setExaminations((prev) => prev.map((exam) => (exam.id === id ? { ...exam, ...data } : exam)))

        setIsLoading(false)
        return { success: true }
      } catch (error) {
        console.error("Error updating examination:", error)
        setIsLoading(false)
        return { success: false, error: "Failed to update examination" }
      }
    },
    [],
  )

  const deleteExamination = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: "Database connection not available" }
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("examinations")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error deleting examination:", error)
        return { success: false, error: error.message }
      }

      // Remove from local state
      setExaminations((prev) => prev.filter((exam) => exam.id !== id))

      setIsLoading(false)
      return { success: true }
    } catch (error) {
      console.error("Error deleting examination:", error)
      setIsLoading(false)
      return { success: false, error: "Failed to delete examination" }
    }
  }, [])

  const getExaminationById = useCallback(
    (id: string): Examination | undefined => {
      return examinations.find((exam) => exam.id === id)
    },
    [examinations],
  )

  const recordResult = useCallback(
    async (
      examId: string,
      result: Omit<ExamResult, "id" | "dateRecorded">,
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))

        const newResult: ExamResult = {
          ...result,
          id: `result_${Date.now()}`,
          dateRecorded: new Date().toISOString(),
        }

        setExaminations((prev) =>
          prev.map((exam) => (exam.id === examId ? { ...exam, results: [...exam.results, newResult] } : exam)),
        )

        setIsLoading(false)
        return { success: true }
      } catch (error) {
        setIsLoading(false)
        return { success: false, error: "Failed to record result" }
      }
    },
    [],
  )

  const updateResult = useCallback(
    async (resultId: string, data: Partial<ExamResult>): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))

        setExaminations((prev) =>
          prev.map((exam) => ({
            ...exam,
            results: exam.results.map((result) => (result.id === resultId ? { ...result, ...data } : result)),
          })),
        )

        setIsLoading(false)
        return { success: true }
      } catch (error) {
        setIsLoading(false)
        return { success: false, error: "Failed to update result" }
      }
    },
    [],
  )

  const getResultsByExam = useCallback(
    (examId: string): ExamResult[] => {
      const exam = examinations.find((e) => e.id === examId)
      return exam?.results || []
    },
    [examinations],
  )

  const getResultsByStudent = useCallback(
    (studentId: string): ExamResult[] => {
      const allResults: ExamResult[] = []
      examinations.forEach((exam) => {
        const studentResults = exam.results.filter((result) => result.studentId === studentId)
        allResults.push(...studentResults)
      })
      return allResults
    },
    [examinations],
  )

  const generateReport = useCallback(
    async (examId: string): Promise<{ success: boolean; reportData?: any; error?: string }> => {
      setIsLoading(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const exam = examinations.find((e) => e.id === examId)
        if (!exam) {
          setIsLoading(false)
          return { success: false, error: "Examination not found" }
        }

        const reportData = {
          examTitle: exam.title,
          totalStudents: exam.enrolledStudents,
          completedStudents: exam.completedStudents,
          averageScore:
            exam.results.length > 0
              ? exam.results.reduce((sum, result) => sum + result.percentage, 0) / exam.results.length
              : 0,
          passRate:
            exam.results.length > 0
              ? (exam.results.filter((result) => result.percentage >= (exam.passingMarks / exam.totalMarks) * 100)
                  .length /
                  exam.results.length) *
                100
              : 0,
          subjectAnalysis: exam.subjects.map((subject) => ({
            subject,
            averageScore:
              exam.results
                .filter((result) => result.subject === subject)
                .reduce((sum, result, _, arr) => sum + result.percentage / arr.length, 0) || 0,
          })),
        }

        setIsLoading(false)
        return { success: true, reportData }
      } catch (error) {
        setIsLoading(false)
        return { success: false, error: "Failed to generate report" }
      }
    },
    [examinations],
  )

  const value: ExaminationContextType = {
    examinations,
    isLoading,
    createExamination,
    updateExamination,
    deleteExamination,
    getExaminationById,
    recordResult,
    updateResult,
    getResultsByExam,
    getResultsByStudent,
    generateReport,
  }

  return <ExaminationContext.Provider value={value}>{children}</ExaminationContext.Provider>
}

export function useExamination() {
  const context = useContext(ExaminationContext)
  if (context === undefined) {
    throw new Error("useExamination must be used within an ExaminationProvider")
  }
  return context
}
