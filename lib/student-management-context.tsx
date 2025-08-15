"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase, testConnection } from "./supabase"
import { StorageUtils } from "./storage-utils"

export interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  phone?: string
  date_of_birth?: string
  gender?: string
  place_of_birth?: string
  nationality?: string
  religion?: string
  address?: string
  city?: string
  region?: string
  subsystem?: "english" | "french"
  branch?: "grammar" | "technical" | "commercial"
  class?: string
  previous_school?: string
  previous_class?: string
  is_new_student?: boolean
  total_fees: number
  paid_fees: number
  fees_status: "paid" | "partial" | "pending" | "overdue"
  enrollment_status: "enrolled" | "pending" | "transferred" | "graduated"
  academic_year?: string
  status: "active" | "inactive"
  enrollment_date?: string
  created_at?: string
  updated_at?: string
}

export interface StudentFilters {
  search: string
  class: string
  branch: string
  subsystem: string
  status: string
  feesStatus: string
}

export interface StudentStats {
  total: number
  enrolled: number
  pending: number
  newStudents: number
  totalFees: number
  collectedFees: number
  feesPercentage: number
}

interface StudentManagementContextType {
  students: Student[]
  isLoading: boolean
  error: string | null
  isUsingDatabase: boolean
  filters: StudentFilters
  setFilters: (filters: StudentFilters) => void
  loadStudents: () => Promise<void>
  getStudent: (id: string) => Student | undefined
  updateStudent: (id: string, updates: Partial<Student>) => Promise<boolean>
  deleteStudent: (id: string) => Promise<boolean>
  getFilteredStudents: () => Student[]
  getNewStudents: () => Student[]
  getStudentStats: () => StudentStats
  updateStudentStatus: (id: string, status: string) => Promise<boolean>
  testDatabaseConnection: () => Promise<boolean>
}

const StudentManagementContext = createContext<StudentManagementContextType | undefined>(undefined)

export function StudentManagementProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUsingDatabase, setIsUsingDatabase] = useState(false)
  const [filters, setFilters] = useState<StudentFilters>({
    search: "",
    class: "",
    branch: "",
    subsystem: "",
    status: "",
    feesStatus: "",
  })

  const testDatabaseConnection = async (): Promise<boolean> => {
    const connected = await testConnection()
    setIsUsingDatabase(connected)
    return connected
  }

  const loadStudents = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const dbConnected = await testConnection()
      setIsUsingDatabase(dbConnected)

      if (dbConnected) {
        // Load from Supabase
        const { data, error: fetchError } = await supabase
          .from("students")
          .select("*")
          .order("created_at", { ascending: false })

        if (fetchError) {
          throw new Error(`Failed to load students: ${fetchError.message}`)
        }

        setStudents(data || [])
      } else {
        // Load from localStorage
        const savedStudents = StorageUtils.getItem("students") || []
        setStudents(savedStudents)
      }
    } catch (err) {
      console.error("Error loading students:", err)
      setError(err instanceof Error ? err.message : "Failed to load students")
    } finally {
      setIsLoading(false)
    }
  }

  const getStudent = (id: string): Student | undefined => {
    return students.find((student) => student.id === id)
  }

  const updateStudent = async (id: string, updates: Partial<Student>): Promise<boolean> => {
    try {
      const dbConnected = await testConnection()

      if (dbConnected) {
        // Update in Supabase
        const { error: updateError } = await supabase
          .from("students")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)

        if (updateError) {
          throw new Error(`Failed to update student: ${updateError.message}`)
        }
      } else {
        // Update in localStorage
        const savedStudents = StorageUtils.getItem("students") || []
        const updatedStudents = savedStudents.map((student: Student) =>
          student.id === id ? { ...student, ...updates, updated_at: new Date().toISOString() } : student,
        )
        StorageUtils.setItem("students", updatedStudents)
      }

      // Update local state
      setStudents((prev) =>
        prev.map((student) =>
          student.id === id ? { ...student, ...updates, updated_at: new Date().toISOString() } : student,
        ),
      )

      return true
    } catch (err) {
      console.error("Error updating student:", err)
      setError(err instanceof Error ? err.message : "Failed to update student")
      return false
    }
  }

  const deleteStudent = async (id: string): Promise<boolean> => {
    try {
      const dbConnected = await testConnection()

      if (dbConnected) {
        // Delete from Supabase
        const { error: deleteError } = await supabase.from("students").delete().eq("id", id)

        if (deleteError) {
          throw new Error(`Failed to delete student: ${deleteError.message}`)
        }
      } else {
        // Delete from localStorage
        const savedStudents = StorageUtils.getItem("students") || []
        const filteredStudents = savedStudents.filter((student: Student) => student.id !== id)
        StorageUtils.setItem("students", filteredStudents)
      }

      // Update local state
      setStudents((prev) => prev.filter((student) => student.id !== id))
      return true
    } catch (err) {
      console.error("Error deleting student:", err)
      setError(err instanceof Error ? err.message : "Failed to delete student")
      return false
    }
  }

  const getFilteredStudents = (): Student[] => {
    return students.filter((student) => {
      const matchesSearch =
        !filters.search ||
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.student_id.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.email.toLowerCase().includes(filters.search.toLowerCase())

      const matchesClass = !filters.class || student.class === filters.class
      const matchesBranch = !filters.branch || student.branch === filters.branch
      const matchesSubsystem = !filters.subsystem || student.subsystem === filters.subsystem
      const matchesStatus = !filters.status || student.enrollment_status === filters.status
      const matchesFeesStatus = !filters.feesStatus || student.fees_status === filters.feesStatus

      return matchesSearch && matchesClass && matchesBranch && matchesSubsystem && matchesStatus && matchesFeesStatus
    })
  }

  const getNewStudents = (): Student[] => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return students.filter((student) => {
      // Check if student is marked as new
      if (student.is_new_student) return true

      // Check if enrolled within last 7 days
      if (student.enrollment_date || student.created_at) {
        const enrollmentDate = new Date(student.enrollment_date || student.created_at!)
        return enrollmentDate >= sevenDaysAgo
      }

      return false
    })
  }

  const getStudentStats = (): StudentStats => {
    const total = students.length
    const enrolled = students.filter((s) => s.enrollment_status === "enrolled").length
    const pending = students.filter((s) => s.enrollment_status === "pending").length
    const newStudents = getNewStudents().length

    const totalFees = students.reduce((sum, s) => sum + (s.total_fees || 0), 0)
    const collectedFees = students.reduce((sum, s) => sum + (s.paid_fees || 0), 0)
    const feesPercentage = totalFees > 0 ? Math.round((collectedFees / totalFees) * 100) : 0

    return {
      total,
      enrolled,
      pending,
      newStudents,
      totalFees,
      collectedFees,
      feesPercentage,
    }
  }

  const updateStudentStatus = async (id: string, status: string): Promise<boolean> => {
    return await updateStudent(id, { enrollment_status: status as any })
  }

  // Load students on mount
  useEffect(() => {
    loadStudents()
  }, [])

  const value: StudentManagementContextType = {
    students,
    isLoading,
    error,
    isUsingDatabase,
    filters,
    setFilters,
    loadStudents,
    getStudent,
    updateStudent,
    deleteStudent,
    getFilteredStudents,
    getNewStudents,
    getStudentStats,
    updateStudentStatus,
    testDatabaseConnection,
  }

  return <StudentManagementContext.Provider value={value}>{children}</StudentManagementContext.Provider>
}

export function useStudentManagement() {
  const context = useContext(StudentManagementContext)
  if (context === undefined) {
    throw new Error("useStudentManagement must be used within a StudentManagementProvider")
  }
  return context
}
