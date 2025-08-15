"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useMemo } from "react"

// Types
export interface Assessment {
  id: string
  title: string
  type: "quiz" | "test" | "exam" | "assignment" | "project"
  subject: string
  classId: string
  className: string
  totalMarks: number
  date: string
  createdAt: string
}

export interface Grade {
  id: string
  assessmentId: string
  studentId: string
  studentName: string
  marks: number
  percentage: number
  grade: string
  remarks?: string
  submittedAt: string
}

export interface Student {
  id: string
  name: string
  email: string
  studentId: string
  classId: string
  className: string
  avatar?: string
}

export interface TeacherClass {
  id: string
  name: string
  subject: string
  level: string
  section: string
  studentCount: number
  schedule: string
}

interface TeacherGradesContextType {
  // State
  assessments: Assessment[]
  grades: Grade[]
  students: Student[]
  classes: TeacherClass[]
  loading: boolean
  error: string | null

  // Assessment functions
  createAssessment: (assessment: Omit<Assessment, "id" | "createdAt">) => Promise<void>
  updateAssessment: (id: string, updates: Partial<Assessment>) => Promise<void>
  deleteAssessment: (id: string) => Promise<void>
  getAssessmentsByClass: (classId: string) => Assessment[]

  // Grade functions
  addGrade: (grade: Omit<Grade, "id" | "submittedAt">) => Promise<void>
  updateGrade: (id: string, updates: Partial<Grade>) => Promise<void>
  deleteGrade: (id: string) => Promise<void>
  getGradesByAssessment: (assessmentId: string) => Grade[]
  getGradesByStudent: (studentId: string) => Grade[]
  getStudentGrades: (studentId: string, classId?: string) => Grade[]

  // Student functions
  getStudentsByClass: (classId: string) => Student[]
  getStudentStats: (studentId: string) => {
    totalAssessments: number
    averageGrade: number
    highestGrade: number
    lowestGrade: number
    gradeDistribution: Record<string, number>
  }

  // Class functions
  getTeacherClasses: () => TeacherClass[]

  // Utility functions
  calculateGrade: (marks: number, totalMarks: number) => string
  getGradeColor: (grade: string) => string
}

const TeacherGradesContext = createContext<TeacherGradesContextType | undefined>(undefined)

export function useTeacherGrades() {
  const context = useContext(TeacherGradesContext)
  if (context === undefined) {
    throw new Error("useTeacherGrades must be used within a TeacherGradesProvider")
  }
  return context
}

export function TeacherGradesProvider({ children }: { children: React.ReactNode }) {
  const [assessments, setAssessments] = useState<Assessment[]>([
    {
      id: "1",
      title: "Mathematics Quiz 1",
      type: "quiz",
      subject: "Mathematics",
      classId: "class-1",
      className: "Form 5A",
      totalMarks: 20,
      date: "2024-01-15",
      createdAt: "2024-01-10T10:00:00Z",
    },
    {
      id: "2",
      title: "Physics Test 1",
      type: "test",
      subject: "Physics",
      classId: "class-2",
      className: "Form 6B",
      totalMarks: 50,
      date: "2024-01-20",
      createdAt: "2024-01-15T14:30:00Z",
    },
  ])

  const [grades, setGrades] = useState<Grade[]>([
    {
      id: "1",
      assessmentId: "1",
      studentId: "student-1",
      studentName: "Marie Ngozi",
      marks: 18,
      percentage: 90,
      grade: "A",
      remarks: "Excellent work",
      submittedAt: "2024-01-15T15:30:00Z",
    },
    {
      id: "2",
      assessmentId: "1",
      studentId: "student-2",
      studentName: "Jean Kamga",
      marks: 15,
      percentage: 75,
      grade: "B",
      remarks: "Good effort",
      submittedAt: "2024-01-15T15:35:00Z",
    },
  ])

  const [students] = useState<Student[]>([
    {
      id: "student-1",
      name: "Marie Ngozi",
      email: "marie.ngozi@student.gbhs.cm",
      studentId: "STU001",
      classId: "class-1",
      className: "Form 5A",
    },
    {
      id: "student-2",
      name: "Jean Kamga",
      email: "jean.kamga@student.gbhs.cm",
      studentId: "STU002",
      classId: "class-1",
      className: "Form 5A",
    },
    {
      id: "student-3",
      name: "Fatima Bello",
      email: "fatima.bello@student.gbhs.cm",
      studentId: "STU003",
      classId: "class-2",
      className: "Form 6B",
    },
  ])

  const [classes] = useState<TeacherClass[]>([
    {
      id: "class-1",
      name: "Form 5A",
      subject: "Mathematics",
      level: "Form 5",
      section: "A",
      studentCount: 25,
      schedule: "Mon, Wed, Fri - 8:00 AM",
    },
    {
      id: "class-2",
      name: "Form 6B",
      subject: "Physics",
      level: "Form 6",
      section: "B",
      studentCount: 22,
      schedule: "Tue, Thu - 10:00 AM",
    },
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Assessment functions
  const createAssessment = useCallback(async (assessmentData: Omit<Assessment, "id" | "createdAt">) => {
    setLoading(true)
    setError(null)
    try {
      const newAssessment: Assessment = {
        ...assessmentData,
        id: `assessment-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      setAssessments((prev) => [...prev, newAssessment])
    } catch (err) {
      setError("Failed to create assessment")
    } finally {
      setLoading(false)
    }
  }, [])

  const updateAssessment = useCallback(async (id: string, updates: Partial<Assessment>) => {
    setLoading(true)
    setError(null)
    try {
      setAssessments((prev) =>
        prev.map((assessment) => (assessment.id === id ? { ...assessment, ...updates } : assessment)),
      )
    } catch (err) {
      setError("Failed to update assessment")
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteAssessment = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      setAssessments((prev) => prev.filter((assessment) => assessment.id !== id))
      setGrades((prev) => prev.filter((grade) => grade.assessmentId !== id))
    } catch (err) {
      setError("Failed to delete assessment")
    } finally {
      setLoading(false)
    }
  }, [])

  const getAssessmentsByClass = useCallback(
    (classId: string) => {
      return assessments.filter((assessment) => assessment.classId === classId)
    },
    [assessments],
  )

  // Grade functions
  const addGrade = useCallback(async (gradeData: Omit<Grade, "id" | "submittedAt">) => {
    setLoading(true)
    setError(null)
    try {
      const newGrade: Grade = {
        ...gradeData,
        id: `grade-${Date.now()}`,
        submittedAt: new Date().toISOString(),
      }
      setGrades((prev) => [...prev, newGrade])
    } catch (err) {
      setError("Failed to add grade")
    } finally {
      setLoading(false)
    }
  }, [])

  const updateGrade = useCallback(async (id: string, updates: Partial<Grade>) => {
    setLoading(true)
    setError(null)
    try {
      setGrades((prev) => prev.map((grade) => (grade.id === id ? { ...grade, ...updates } : grade)))
    } catch (err) {
      setError("Failed to update grade")
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteGrade = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      setGrades((prev) => prev.filter((grade) => grade.id !== id))
    } catch (err) {
      setError("Failed to delete grade")
    } finally {
      setLoading(false)
    }
  }, [])

  const getGradesByAssessment = useCallback(
    (assessmentId: string) => {
      return grades.filter((grade) => grade.assessmentId === assessmentId)
    },
    [grades],
  )

  const getGradesByStudent = useCallback(
    (studentId: string) => {
      return grades.filter((grade) => grade.studentId === studentId)
    },
    [grades],
  )

  const getStudentGrades = useCallback(
    (studentId: string, classId?: string) => {
      let studentGrades = grades.filter((grade) => grade.studentId === studentId)

      if (classId) {
        const classAssessments = assessments.filter((assessment) => assessment.classId === classId)
        const classAssessmentIds = classAssessments.map((assessment) => assessment.id)
        studentGrades = studentGrades.filter((grade) => classAssessmentIds.includes(grade.assessmentId))
      }

      return studentGrades
    },
    [grades, assessments],
  )

  // Student functions
  const getStudentsByClass = useCallback(
    (classId: string) => {
      return students.filter((student) => student.classId === classId)
    },
    [students],
  )

  const getStudentStats = useCallback(
    (studentId: string) => {
      const studentGrades = getGradesByStudent(studentId)

      if (studentGrades.length === 0) {
        return {
          totalAssessments: 0,
          averageGrade: 0,
          highestGrade: 0,
          lowestGrade: 0,
          gradeDistribution: {},
        }
      }

      const percentages = studentGrades.map((grade) => grade.percentage)
      const gradeLetters = studentGrades.map((grade) => grade.grade)

      const gradeDistribution = gradeLetters.reduce(
        (acc, grade) => {
          acc[grade] = (acc[grade] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      return {
        totalAssessments: studentGrades.length,
        averageGrade: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
        highestGrade: Math.max(...percentages),
        lowestGrade: Math.min(...percentages),
        gradeDistribution,
      }
    },
    [getGradesByStudent],
  )

  // Class functions
  const getTeacherClasses = useCallback(() => {
    return classes
  }, [classes])

  // Utility functions
  const calculateGrade = useCallback((marks: number, totalMarks: number): string => {
    const percentage = (marks / totalMarks) * 100
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    if (percentage >= 50) return "E"
    return "F"
  }, [])

  const getGradeColor = useCallback((grade: string): string => {
    switch (grade) {
      case "A":
        return "text-green-600"
      case "B":
        return "text-blue-600"
      case "C":
        return "text-yellow-600"
      case "D":
        return "text-orange-600"
      case "E":
        return "text-red-500"
      case "F":
        return "text-red-700"
      default:
        return "text-gray-600"
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      // State
      assessments,
      grades,
      students,
      classes,
      loading,
      error,

      // Assessment functions
      createAssessment,
      updateAssessment,
      deleteAssessment,
      getAssessmentsByClass,

      // Grade functions
      addGrade,
      updateGrade,
      deleteGrade,
      getGradesByAssessment,
      getGradesByStudent,
      getStudentGrades,

      // Student functions
      getStudentsByClass,
      getStudentStats,

      // Class functions
      getTeacherClasses,

      // Utility functions
      calculateGrade,
      getGradeColor,
    }),
    [
      assessments,
      grades,
      students,
      classes,
      loading,
      error,
      createAssessment,
      updateAssessment,
      deleteAssessment,
      getAssessmentsByClass,
      addGrade,
      updateGrade,
      deleteGrade,
      getGradesByAssessment,
      getGradesByStudent,
      getStudentGrades,
      getStudentsByClass,
      getStudentStats,
      getTeacherClasses,
      calculateGrade,
      getGradeColor,
    ],
  )

  return <TeacherGradesContext.Provider value={contextValue}>{children}</TeacherGradesContext.Provider>
}
