"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase, testConnection } from "./supabase"

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
  clearFilters: () => void
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
    class: "all",
    branch: "all",
    subsystem: "all",
    status: "all",
    feesStatus: "all",
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

      if (!dbConnected) {
        throw new Error("Database connection is required for student management. Please check your database configuration.")
      }

      // Load from Supabase
      const { data, error: fetchError } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        throw new Error(`Failed to load students: ${fetchError.message}`)
      }

      setStudents(data || [])
      console.log("Loaded students from database:", data?.length || 0)
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

      if (!dbConnected) {
        throw new Error("Database connection is required for student management. Please check your database configuration.")
      }

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

      if (!dbConnected) {
        throw new Error("Database connection is required for student management. Please check your database configuration.")
      }

      // Delete from Supabase
      const { error: deleteError } = await supabase.from("students").delete().eq("id", id)

      if (deleteError) {
        throw new Error(`Failed to delete student: ${deleteError.message}`)
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
      // Enhanced search functionality
      const searchTerm = filters.search.toLowerCase().trim()
      const matchesSearch = !searchTerm || [
        `${student.first_name} ${student.last_name}`,
        student.student_id,
        student.email,
        student.phone || '',
        student.middle_name || '',
        student.address || '',
        student.city || '',
        student.region || '',
        student.nationality || '',
        student.previous_school || ''
      ].some(field => field.toLowerCase().includes(searchTerm))

      // Filter by class (handle "all" value)
      const matchesClass = !filters.class || filters.class === "all" || student.class === filters.class
      
      // Filter by branch (handle "all" value)
      const matchesBranch = !filters.branch || filters.branch === "all" || student.branch === filters.branch
      
      // Filter by subsystem (handle "all" value)
      const matchesSubsystem = !filters.subsystem || filters.subsystem === "all" || student.subsystem === filters.subsystem
      
      // Filter by status (handle "all" value)
      const matchesStatus = !filters.status || filters.status === "all" || student.enrollment_status === filters.status
      
      // Filter by fees status (handle "all" value)
      const matchesFeesStatus = !filters.feesStatus || filters.feesStatus === "all" || student.fees_status === filters.feesStatus

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

  const clearFilters = () => {
    setFilters({
      search: "",
      class: "all",
      branch: "all",
      subsystem: "all",
      status: "all",
      feesStatus: "all",
    })
  }

  // Load students on mount
  useEffect(() => {
    loadStudents()
  }, [])

  // Listen for student enrollment events and refresh the list
  useEffect(() => {
    const handleStudentEnrolled = () => {
      console.log("Student enrolled event received, refreshing student list...")
      loadStudents()
    }

    window.addEventListener('studentEnrolled', handleStudentEnrolled)
    
    return () => {
      window.removeEventListener('studentEnrolled', handleStudentEnrolled)
    }
  }, [])

  const value: StudentManagementContextType = {
    students,
    isLoading,
    error,
    isUsingDatabase,
    filters,
    setFilters,
    clearFilters,
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
