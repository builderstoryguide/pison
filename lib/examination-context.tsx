"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

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
  instructions: string
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

// Mock data for examinations
const mockExaminations: Examination[] = [
  {
    id: "exam_001",
    title: "First Term Mathematics Examination",
    type: "internal",
    examBoard: "School Board",
    subsystem: "english",
    branch: "grammar",
    level: "Form 5",
    subjects: ["Mathematics", "Further Mathematics"],
    startDate: "2024-03-15",
    endDate: "2024-03-16",
    duration: 180,
    totalMarks: 100,
    passingMarks: 50,
    venue: "Main Hall",
    instructions: "Calculators allowed. Show all working clearly.",
    status: "completed",
    createdAt: "2024-02-15T10:00:00Z",
    createdBy: "admin_001",
    enrolledStudents: 45,
    completedStudents: 43,
    results: [],
  },
  {
    id: "exam_002",
    title: "GCE Advanced Level Mock Examination",
    type: "mock",
    examBoard: "Cambridge International",
    subsystem: "english",
    branch: "grammar",
    level: "Upper Sixth",
    subjects: ["Physics", "Chemistry", "Biology", "Mathematics"],
    startDate: "2024-04-01",
    endDate: "2024-04-05",
    duration: 180,
    totalMarks: 100,
    passingMarks: 40,
    venue: "Science Laboratory",
    instructions: "Follow GCE examination guidelines strictly.",
    status: "scheduled",
    createdAt: "2024-03-01T09:00:00Z",
    createdBy: "admin_001",
    enrolledStudents: 32,
    completedStudents: 0,
    results: [],
  },
  {
    id: "exam_003",
    title: "Probatoire Blanc - Sciences",
    type: "mock",
    examBoard: "Ministère de l'Éducation",
    subsystem: "french",
    branch: "grammar",
    level: "Première",
    subjects: ["Mathématiques", "Physique", "Chimie", "SVT"],
    startDate: "2024-03-20",
    endDate: "2024-03-22",
    duration: 240,
    totalMarks: 20,
    passingMarks: 10,
    venue: "Salle des Sciences",
    instructions: "Épreuve selon le format officiel du Probatoire.",
    status: "ongoing",
    createdAt: "2024-02-20T14:00:00Z",
    createdBy: "admin_001",
    enrolledStudents: 38,
    completedStudents: 15,
    results: [],
  },
  {
    id: "exam_004",
    title: "Technical Drawing Assessment",
    type: "continuous_assessment",
    examBoard: "School Board",
    subsystem: "english",
    branch: "technical",
    level: "Form 4",
    subjects: ["Technical Drawing", "Workshop Practice"],
    startDate: "2024-03-10",
    endDate: "2024-03-12",
    duration: 120,
    totalMarks: 50,
    passingMarks: 25,
    venue: "Technical Workshop",
    instructions: "Bring all drawing instruments. Practical assessment included.",
    status: "completed",
    createdAt: "2024-02-10T11:00:00Z",
    createdBy: "teacher_003",
    enrolledStudents: 28,
    completedStudents: 28,
    results: [],
  },
]

export function ExaminationProvider({ children }: { children: React.ReactNode }) {
  const [examinations, setExaminations] = useState<Examination[]>(mockExaminations)
  const [isLoading, setIsLoading] = useState(false)

  const createExamination = useCallback(
    async (data: ExamFormData): Promise<{ success: boolean; examinationId?: string; error?: string }> => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const newExamination: Examination = {
          id: `exam_${Date.now()}`,
          ...data,
          createdAt: new Date().toISOString(),
          createdBy: "current_user",
          enrolledStudents: 0,
          completedStudents: 0,
          results: [],
        }

        setExaminations((prev) => [...prev, newExamination])
        setIsLoading(false)
        return { success: true, examinationId: newExamination.id }
      } catch (error) {
        setIsLoading(false)
        return { success: false, error: "Failed to create examination" }
      }
    },
    [],
  )

  const updateExamination = useCallback(
    async (id: string, data: Partial<ExamFormData>): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))

        setExaminations((prev) => prev.map((exam) => (exam.id === id ? { ...exam, ...data } : exam)))

        setIsLoading(false)
        return { success: true }
      } catch (error) {
        setIsLoading(false)
        return { success: false, error: "Failed to update examination" }
      }
    },
    [],
  )

  const deleteExamination = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      setExaminations((prev) => prev.filter((exam) => exam.id !== id))

      setIsLoading(false)
      return { success: true }
    } catch (error) {
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
