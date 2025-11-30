"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { supabase, isSupabaseAvailable } from "./supabase"

// Types
export interface Assessment {
  id: string
  assessmentId: string
  title: string
  description?: string
  type: "quiz" | "test" | "exam" | "assignment" | "project" | "midterm" | "final"
  subject: string
  classId: string
  className?: string
  teacherId: string
  totalMarks: number
  passingMarks: number
  weightPercentage: number
  assessmentDate: string
  dueDate?: string
  status: "draft" | "published" | "in_progress" | "completed" | "archived"
  isGraded: boolean
  createdAt: string
  updatedAt: string
}

export interface Grade {
  id: string
  gradeId: string
  assessmentId: string
  studentId: string
  studentName: string
  teacherId: string
  marksObtained: number
  percentage: number
  gradeLetter: string
  gradePoint: number
  remarks?: string
  feedback?: string
  isLate: boolean
  isAbsent: boolean
  isExcused: boolean
  submittedAt: string
  gradedAt: string
  createdAt: string
  updatedAt: string
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

export interface AssessmentStatistics {
  totalStudents: number
  gradedCount: number
  averageMarks: number
  averagePercentage: number
  highestMarks: number
  lowestMarks: number
  passCount: number
  failCount: number
  gradeDistribution: Record<string, number>
}

export interface StudentGradeStatistics {
  totalAssessments: number
  completedAssessments: number
  averagePercentage: number
  averageGradePoint: number
  highestGrade: string
  lowestGrade: string
  passRate: number
  gradeDistribution: Record<string, number>
}

interface TeacherGradesDatabaseContextType {
  // State
  assessments: Assessment[]
  grades: Grade[]
  students: Student[]
  classes: TeacherClass[]
  loading: boolean
  error: string | null

  // Assessment functions
  createAssessment: (assessment: Omit<Assessment, "id" | "assessmentId" | "createdAt" | "updatedAt">) => Promise<string>
  updateAssessment: (id: string, updates: Partial<Assessment>) => Promise<void>
  deleteAssessment: (id: string) => Promise<void>
  getAssessmentsByClass: (classId: string) => Assessment[]
  getAssessmentsByTeacher: (teacherId: string) => Assessment[]
  getAssessmentStatistics: (assessmentId: string) => AssessmentStatistics

  // Grade functions
  addGrade: (grade: Omit<Grade, "id" | "gradeId" | "submittedAt" | "gradedAt" | "createdAt" | "updatedAt">) => Promise<string>
  updateGrade: (id: string, updates: Partial<Grade>) => Promise<void>
  deleteGrade: (id: string) => Promise<void>
  getGradesByAssessment: (assessmentId: string) => Grade[]
  getGradesByStudent: (studentId: string) => Grade[]
  getStudentGrades: (studentId: string, classId?: string) => Grade[]
  getStudentGradeStatistics: (studentId: string, classId?: string) => StudentGradeStatistics
  bulkAddGrades: (grades: Omit<Grade, "id" | "gradeId" | "submittedAt" | "gradedAt" | "createdAt" | "updatedAt">[]) => Promise<void>

  // Student functions
  getStudentsByClass: (classId: string) => Student[]
  getStudentStats: (studentId: string) => StudentGradeStatistics

  // Class functions
  getTeacherClasses: () => TeacherClass[]

  // Utility functions
  calculateGrade: (marks: number, totalMarks: number) => string
  calculateGradePoint: (gradeLetter: string) => number
  getGradeColor: (grade: string) => string
  loadData: () => Promise<void>
}

const TeacherGradesDatabaseContext = createContext<TeacherGradesDatabaseContextType | undefined>(undefined)

export function useTeacherGradesDatabase() {
  const context = useContext(TeacherGradesDatabaseContext)
  if (context === undefined) {
    throw new Error("useTeacherGradesDatabase must be used within a TeacherGradesDatabaseProvider")
  }
  return context
}

export function TeacherGradesDatabaseProvider({ children }: { children: ReactNode }) {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = useCallback(async () => {
    if (!isSupabaseAvailable()) {
      setError("Database connection not available")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Load assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase!
        .from("assessments")
        .select("*")
        .order("created_at", { ascending: false })

      if (assessmentsError) throw assessmentsError

      const formattedAssessments: Assessment[] = assessmentsData?.map((assessment: any) => ({
        id: assessment.id,
        assessmentId: assessment.assessment_id,
        title: assessment.title,
        description: assessment.description,
        type: assessment.type,
        subject: assessment.subject,
        classId: assessment.class_id,
        teacherId: assessment.teacher_id,
        totalMarks: assessment.total_marks,
        passingMarks: assessment.passing_marks,
        weightPercentage: assessment.weight_percentage,
        assessmentDate: assessment.assessment_date,
        dueDate: assessment.due_date,
        status: assessment.status,
        isGraded: assessment.is_graded,
        createdAt: assessment.created_at,
        updatedAt: assessment.updated_at,
      })) || []

      setAssessments(formattedAssessments)

      // Load grades
      const { data: gradesData, error: gradesError } = await supabase!
        .from("grades")
        .select("*")
        .order("created_at", { ascending: false })

      if (gradesError) throw gradesError

      const formattedGrades: Grade[] = gradesData?.map((grade: any) => ({
        id: grade.id,
        gradeId: grade.grade_id,
        assessmentId: grade.assessment_id,
        studentId: grade.student_id,
        studentName: grade.student_name,
        teacherId: grade.teacher_id,
        marksObtained: grade.marks_obtained,
        percentage: grade.percentage,
        gradeLetter: grade.grade_letter,
        gradePoint: grade.grade_point,
        remarks: grade.remarks,
        feedback: grade.feedback,
        isLate: grade.is_late,
        isAbsent: grade.is_absent,
        isExcused: grade.is_excused,
        submittedAt: grade.submitted_at,
        gradedAt: grade.graded_at,
        createdAt: grade.created_at,
        updatedAt: grade.updated_at,
      })) || []

      setGrades(formattedGrades)

      // Load students (from students table)
      const { data: studentsData, error: studentsError } = await supabase!
        .from("students")
        .select("id, first_name, last_name, email, student_id, class_id")
        .order("first_name")

      if (studentsError) throw studentsError

      const formattedStudents: Student[] = studentsData?.map((student: any) => ({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        email: student.email,
        studentId: student.student_id,
        classId: student.class_id,
        className: "Class", // You might want to join with classes table
      })) || []

      setStudents(formattedStudents)

    } catch (err) {
      console.error("Error loading data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  // Assessment functions
  const createAssessment = useCallback(async (assessmentData: Omit<Assessment, "id" | "assessmentId" | "createdAt" | "updatedAt">): Promise<string> => {
    if (!isSupabaseAvailable()) {
      throw new Error("Database connection not available")
    }

    setLoading(true)
    setError(null)

    try {
      // Generate assessment ID using database function
      const { data: assessmentIdData, error: idError } = await supabase!
        .rpc("generate_assessment_id")

      if (idError) throw idError

      const assessmentId = assessmentIdData

      const newAssessment = {
        assessment_id: assessmentId,
        title: assessmentData.title,
        description: assessmentData.description,
        type: assessmentData.type,
        subject: assessmentData.subject,
        class_id: assessmentData.classId,
        teacher_id: assessmentData.teacherId,
        total_marks: assessmentData.totalMarks,
        passing_marks: assessmentData.passingMarks,
        weight_percentage: assessmentData.weightPercentage,
        assessment_date: assessmentData.assessmentDate,
        due_date: assessmentData.dueDate,
        status: assessmentData.status,
        is_graded: assessmentData.isGraded,
      }

      const { data: insertedAssessment, error: insertError } = await supabase!
        .from("assessments")
        .insert(newAssessment)
        .select()
        .single()

      if (insertError) throw insertError

      await loadData() // Reload data
      return insertedAssessment.id

    } catch (err) {
      console.error("Error creating assessment:", err)
      setError(err instanceof Error ? err.message : "Failed to create assessment")
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadData])

  const updateAssessment = useCallback(async (id: string, updates: Partial<Assessment>) => {
    if (!isSupabaseAvailable()) {
      throw new Error("Database connection not available")
    }

    setLoading(true)
    setError(null)

    try {
      const updateData: any = {}
      if (updates.title) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.type) updateData.type = updates.type
      if (updates.subject) updateData.subject = updates.subject
      if (updates.totalMarks) updateData.total_marks = updates.totalMarks
      if (updates.passingMarks) updateData.passing_marks = updates.passingMarks
      if (updates.weightPercentage) updateData.weight_percentage = updates.weightPercentage
      if (updates.assessmentDate) updateData.assessment_date = updates.assessmentDate
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate
      if (updates.status) updateData.status = updates.status
      if (updates.isGraded !== undefined) updateData.is_graded = updates.isGraded

      const { error } = await supabase!
        .from("assessments")
        .update(updateData)
        .eq("id", id)

      if (error) throw error

      await loadData() // Reload data

    } catch (err) {
      console.error("Error updating assessment:", err)
      setError(err instanceof Error ? err.message : "Failed to update assessment")
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadData])

  const deleteAssessment = useCallback(async (id: string) => {
    if (!isSupabaseAvailable()) {
      throw new Error("Database connection not available")
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase!
        .from("assessments")
        .delete()
        .eq("id", id)

      if (error) throw error

      await loadData() // Reload data

    } catch (err) {
      console.error("Error deleting assessment:", err)
      setError(err instanceof Error ? err.message : "Failed to delete assessment")
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadData])

  // Grade functions
  const addGrade = useCallback(async (gradeData: Omit<Grade, "id" | "gradeId" | "submittedAt" | "gradedAt" | "createdAt" | "updatedAt">): Promise<string> => {
    if (!isSupabaseAvailable()) {
      throw new Error("Database connection not available")
    }

    setLoading(true)
    setError(null)

    try {
      // Generate grade ID using database function
      const { data: gradeIdData, error: idError } = await supabase!
        .rpc("generate_grade_id")

      if (idError) throw idError

      const gradeId = gradeIdData

      // Get assessment to get total marks
      const assessment = assessments.find(a => a.id === gradeData.assessmentId)
      const totalMarks = assessment?.totalMarks || 20
      
      // Calculate grade letter and point
      const gradeLetter = calculateGrade(gradeData.marksObtained, totalMarks)
      const gradePoint = calculateGradePoint(gradeLetter)

      const newGrade = {
        grade_id: gradeId,
        assessment_id: gradeData.assessmentId,
        student_id: gradeData.studentId,
        student_name: gradeData.studentName,
        teacher_id: gradeData.teacherId,
        marks_obtained: gradeData.marksObtained,
        percentage: gradeData.percentage,
        grade_letter: gradeLetter,
        grade_point: gradePoint,
        remarks: gradeData.remarks,
        feedback: gradeData.feedback,
        is_late: gradeData.isLate,
        is_absent: gradeData.isAbsent,
        is_excused: gradeData.isExcused,
      }

      const { data: insertedGrade, error: insertError } = await supabase!
        .from("grades")
        .insert(newGrade)
        .select()
        .single()

      if (insertError) throw insertError

      await loadData() // Reload data
      return insertedGrade.id

    } catch (err) {
      console.error("Error adding grade:", err)
      setError(err instanceof Error ? err.message : "Failed to add grade")
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadData])

  const updateGrade = useCallback(async (id: string, updates: Partial<Grade>) => {
    if (!isSupabaseAvailable()) {
      throw new Error("Database connection not available")
    }

    setLoading(true)
    setError(null)

    try {
      const updateData: any = {}
      if (updates.marksObtained !== undefined) updateData.marks_obtained = updates.marksObtained
      if (updates.percentage !== undefined) updateData.percentage = updates.percentage
      if (updates.gradeLetter) updateData.grade_letter = updates.gradeLetter
      if (updates.gradePoint !== undefined) updateData.grade_point = updates.gradePoint
      if (updates.remarks !== undefined) updateData.remarks = updates.remarks
      if (updates.feedback !== undefined) updateData.feedback = updates.feedback
      if (updates.isLate !== undefined) updateData.is_late = updates.isLate
      if (updates.isAbsent !== undefined) updateData.is_absent = updates.isAbsent
      if (updates.isExcused !== undefined) updateData.is_excused = updates.isExcused

      const { error } = await supabase!
        .from("grades")
        .update(updateData)
        .eq("id", id)

      if (error) throw error

      await loadData() // Reload data

    } catch (err) {
      console.error("Error updating grade:", err)
      setError(err instanceof Error ? err.message : "Failed to update grade")
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadData])

  const deleteGrade = useCallback(async (id: string) => {
    if (!isSupabaseAvailable()) {
      throw new Error("Database connection not available")
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase!
        .from("grades")
        .delete()
        .eq("id", id)

      if (error) throw error

      await loadData() // Reload data

    } catch (err) {
      console.error("Error deleting grade:", err)
      setError(err instanceof Error ? err.message : "Failed to delete grade")
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadData])

  const bulkAddGrades = useCallback(async (gradesData: Omit<Grade, "id" | "gradeId" | "submittedAt" | "gradedAt" | "createdAt" | "updatedAt">[]) => {
    if (!isSupabaseAvailable()) {
      throw new Error("Database connection not available")
    }

    setLoading(true)
    setError(null)

    try {
      const gradesToInsert = await Promise.all(
        gradesData.map(async (gradeData) => {
          // Generate grade ID
          const { data: gradeIdData } = await supabase!.rpc("generate_grade_id")
          const gradeId = gradeIdData

          // Get assessment to get total marks
          const assessment = assessments.find(a => a.id === gradeData.assessmentId)
          const totalMarks = assessment?.totalMarks || 20
          
          // Calculate grade letter and point
          const gradeLetter = calculateGrade(gradeData.marksObtained, totalMarks)
          const gradePoint = calculateGradePoint(gradeLetter)

          return {
            grade_id: gradeId,
            assessment_id: gradeData.assessmentId,
            student_id: gradeData.studentId,
            student_name: gradeData.studentName,
            teacher_id: gradeData.teacherId,
            marks_obtained: gradeData.marksObtained,
            percentage: gradeData.percentage,
            grade_letter: gradeLetter,
            grade_point: gradePoint,
            remarks: gradeData.remarks,
            feedback: gradeData.feedback,
            is_late: gradeData.isLate,
            is_absent: gradeData.isAbsent,
            is_excused: gradeData.isExcused,
          }
        })
      )

      const { error } = await supabase!
        .from("grades")
        .insert(gradesToInsert)

      if (error) throw error

      await loadData() // Reload data

    } catch (err) {
      console.error("Error bulk adding grades:", err)
      setError(err instanceof Error ? err.message : "Failed to bulk add grades")
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadData])

  // Query functions
  const getAssessmentsByClass = useCallback(
    (classId: string) => {
      return assessments.filter((assessment) => assessment.classId === classId)
    },
    [assessments],
  )

  const getAssessmentsByTeacher = useCallback(
    (teacherId: string) => {
      return assessments.filter((assessment) => assessment.teacherId === teacherId)
    },
    [assessments],
  )

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

  const getStudentsByClass = useCallback(
    (classId: string) => {
      return students.filter((student) => student.classId === classId)
    },
    [students],
  )

  const getTeacherClasses = useCallback(() => {
    return classes
  }, [classes])

  // Statistics functions
  const getAssessmentStatistics = useCallback(
    (assessmentId: string): AssessmentStatistics => {
      const assessmentGrades = getGradesByAssessment(assessmentId)
      
      if (assessmentGrades.length === 0) {
        return {
          totalStudents: 0,
          gradedCount: 0,
          averageMarks: 0,
          averagePercentage: 0,
          highestMarks: 0,
          lowestMarks: 0,
          passCount: 0,
          failCount: 0,
          gradeDistribution: {},
        }
      }

      const marks = assessmentGrades.map((grade) => grade.marksObtained)
      const percentages = assessmentGrades.map((grade) => grade.percentage)
      const passCount = assessmentGrades.filter((grade) => grade.percentage >= 50).length
      const failCount = assessmentGrades.length - passCount

      const gradeDistribution = assessmentGrades.reduce(
        (acc, grade) => {
          acc[grade.gradeLetter] = (acc[grade.gradeLetter] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      return {
        totalStudents: assessmentGrades.length,
        gradedCount: assessmentGrades.length,
        averageMarks: marks.reduce((sum, m) => sum + m, 0) / marks.length,
        averagePercentage: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
        highestMarks: Math.max(...marks),
        lowestMarks: Math.min(...marks),
        passCount,
        failCount,
        gradeDistribution,
      }
    },
    [getGradesByAssessment],
  )

  const getStudentGradeStatistics = useCallback(
    (studentId: string, classId?: string): StudentGradeStatistics => {
      const studentGrades = getStudentGrades(studentId, classId)

      if (studentGrades.length === 0) {
        return {
          totalAssessments: 0,
          completedAssessments: 0,
          averagePercentage: 0,
          averageGradePoint: 0,
          highestGrade: "",
          lowestGrade: "",
          passRate: 0,
          gradeDistribution: {},
        }
      }

      const percentages = studentGrades.map((grade) => grade.percentage)
      const gradePoints = studentGrades.map((grade) => grade.gradePoint)
      const gradeLetters = studentGrades.map((grade) => grade.gradeLetter)
      const passCount = studentGrades.filter((grade) => grade.percentage >= 50).length

      const gradeDistribution = gradeLetters.reduce(
        (acc, grade) => {
          acc[grade] = (acc[grade] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      return {
        totalAssessments: studentGrades.length,
        completedAssessments: studentGrades.length,
        averagePercentage: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
        averageGradePoint: gradePoints.reduce((sum, gp) => sum + gp, 0) / gradePoints.length,
        highestGrade: gradeLetters.sort().pop() || "",
        lowestGrade: gradeLetters.sort().shift() || "",
        passRate: (passCount / studentGrades.length) * 100,
        gradeDistribution,
      }
    },
    [getStudentGrades],
  )

  const getStudentStats = useCallback(
    (studentId: string) => {
      return getStudentGradeStatistics(studentId)
    },
    [getStudentGradeStatistics],
  )

  // Utility functions
  const calculateGrade = useCallback((marks: number, totalMarks: number): string => {
    const percentage = (marks / totalMarks) * 100
    if (percentage >= 90) return "A+"
    if (percentage >= 85) return "A"
    if (percentage >= 80) return "A-"
    if (percentage >= 75) return "B+"
    if (percentage >= 70) return "B"
    if (percentage >= 65) return "B-"
    if (percentage >= 60) return "C+"
    if (percentage >= 55) return "C"
    if (percentage >= 50) return "C-"
    if (percentage >= 45) return "D+"
    if (percentage >= 40) return "D"
    if (percentage >= 35) return "D-"
    return "F"
  }, [])

  const calculateGradePoint = useCallback((gradeLetter: string): number => {
    switch (gradeLetter) {
      case "A+": return 4.00
      case "A": return 3.75
      case "A-": return 3.50
      case "B+": return 3.25
      case "B": return 3.00
      case "B-": return 2.75
      case "C+": return 2.50
      case "C": return 2.25
      case "C-": return 2.00
      case "D+": return 1.75
      case "D": return 1.50
      case "D-": return 1.25
      case "F": return 0.00
      default: return 0.00
    }
  }, [])

  const getGradeColor = useCallback((grade: string): string => {
    switch (grade) {
      case "A+":
      case "A":
      case "A-":
        return "text-green-600"
      case "B+":
      case "B":
      case "B-":
        return "text-blue-600"
      case "C+":
      case "C":
      case "C-":
        return "text-yellow-600"
      case "D+":
      case "D":
      case "D-":
        return "text-orange-600"
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
      getAssessmentsByTeacher,
      getAssessmentStatistics,

      // Grade functions
      addGrade,
      updateGrade,
      deleteGrade,
      getGradesByAssessment,
      getGradesByStudent,
      getStudentGrades,
      getStudentGradeStatistics,
      bulkAddGrades,

      // Student functions
      getStudentsByClass,
      getStudentStats,

      // Class functions
      getTeacherClasses,

      // Utility functions
      calculateGrade,
      calculateGradePoint,
      getGradeColor,
      loadData,
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
      getAssessmentsByTeacher,
      getAssessmentStatistics,
      addGrade,
      updateGrade,
      deleteGrade,
      getGradesByAssessment,
      getGradesByStudent,
      getStudentGrades,
      getStudentGradeStatistics,
      bulkAddGrades,
      getStudentsByClass,
      getStudentStats,
      getTeacherClasses,
      calculateGrade,
      calculateGradePoint,
      getGradeColor,
      loadData,
    ],
  )

  return <TeacherGradesDatabaseContext.Provider value={contextValue}>{children}</TeacherGradesDatabaseContext.Provider>
}
