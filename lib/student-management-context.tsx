"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase, testConnection } from "./supabase"

export interface Student {
  id: string
  student_id: string
  matricule_number?: string
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
  class_name?: string
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
  /**
   * Load students, using cached data when possible.
   * When options.force is true we always hit the network and refresh the cache.
   */
  loadStudents: (options?: { force?: boolean }) => Promise<void>
  getStudent: (id: string) => Student | undefined
  updateStudent: (id: string, updates: Partial<Student>) => Promise<boolean>
  deleteStudent: (id: string) => Promise<boolean>
  deleteStudentsBulk: (ids: string[]) => Promise<{ success: boolean; deletedCount: number; errors: string[] }>
  getFilteredStudents: () => Student[]
  getNewStudents: () => Student[]
  getStudentStats: () => StudentStats
  updateStudentStatus: (id: string, status: string) => Promise<boolean>
  resetStudentPassword: (studentId: string) => Promise<{ success: boolean; password?: string }>
  testDatabaseConnection: () => Promise<boolean>
  /** Prefetch students in the background without toggling the global loading state. */
  prefetchStudents: () => Promise<void>
}

const StudentManagementContext = createContext<StudentManagementContextType | undefined>(undefined)

// Mock students data for when database is not available
const mockStudents: Student[] = [
  {
    id: "1",
    student_id: "STU2024001",
    first_name: "Amina",
    last_name: "Fru",
            email: "amina.fru@student.pisonacademy.cm",
    phone: "+237 677 345 678",
    date_of_birth: "2006-08-22",
    gender: "female",
    nationality: "Cameroonian",
    address: "Bamenda, Cameroon",
    subsystem: "english",
    branch: "grammar",
    class: "Form 5A",
    total_fees: 150000,
    paid_fees: 150000,
    fees_status: "paid",
    enrollment_status: "enrolled",
    status: "active",
    enrollment_date: "2024-01-15",
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z"
  },
  {
    id: "2",
    student_id: "STU2024002",
    first_name: "John",
    last_name: "Mbeki",
            email: "john.mbeki@student.pisonacademy.cm",
    phone: "+237 677 456 789",
    date_of_birth: "2005-03-15",
    gender: "male",
    nationality: "Cameroonian",
    address: "Douala, Cameroon",
    subsystem: "english",
    branch: "technical",
    class: "Form 4B",
    total_fees: 150000,
    paid_fees: 75000,
    fees_status: "partial",
    enrollment_status: "enrolled",
    status: "active",
    enrollment_date: "2024-01-16",
    created_at: "2024-01-16T09:00:00Z",
    updated_at: "2024-01-16T09:00:00Z"
  }
]

// Shared fetcher used by React Query to load students with caching
async function fetchStudentsFromApi(): Promise<Student[]> {
  try {
    const dbConnected = await testConnection()

    // If database is not available, fall back to mock data
    if (!dbConnected) {
      return mockStudents
    }

    // Use API route which includes class_name in the response
    const response = await fetch("/api/students")

    if (!response.ok) {
      // On API failure, gracefully fall back to mock data
      return mockStudents
    }

    const data = await response.json()

    // Transform API response to match Student interface
    const transformedData: Student[] = (data || []).map((student: any) => ({
      id: student.id,
      student_id: student.student_id,
      matricule_number: student.matricule_number,
      first_name: student.first_name,
      last_name: student.last_name,
      middle_name: student.middle_name,
      email: student.email,
      phone: student.phone,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      place_of_birth: student.place_of_birth,
      nationality: student.nationality,
      religion: student.religion,
      address: student.address,
      city: student.city,
      region: student.region,
      subsystem: student.subsystem,
      branch: student.branch,
      class: student.class,
      class_name: student.class_name,
      previous_school: student.previous_school,
      previous_class: student.previous_class,
      is_new_student: student.is_new_student,
      total_fees: student.total_fees || 0,
      paid_fees: student.paid_fees || 0,
      fees_status: student.fees_status || "pending",
      enrollment_status: student.enrollment_status || "pending",
      academic_year: student.academic_year,
      status: student.status || "active",
      enrollment_date: student.enrollment_date,
      created_at: student.created_at,
      updated_at: student.updated_at,
    }))
    return transformedData
  } catch (err) {
    console.error("Error fetching students from API:", err)
    // On unexpected error, still return mock data so UI remains usable
    return mockStudents
  }
}

export function StudentManagementProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

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

  const loadStudents = async (options?: { force?: boolean }) => {
    setIsLoading(true)
    setError(null)

    try {
      const queryOptions = {
        queryKey: ["students"],
        queryFn: fetchStudentsFromApi,
        staleTime: 5 * 60 * 1000, // 5 minutes
      } as const

      const data = options?.force
        ? await queryClient.fetchQuery(queryOptions)
        : await queryClient.ensureQueryData(queryOptions)

      if (data && Array.isArray(data)) {
        setStudents(data)
      } else {
        // If for some reason no data came back, fall back to mock data
        setStudents(mockStudents)
      }
    } catch (err) {
      console.error("Error loading students via React Query:", err)
      setStudents(mockStudents)
      setError(err instanceof Error ? err.message : "Failed to load students")
    } finally {
      setIsLoading(false)
    }
  }

  const prefetchStudents = async () => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ["students"],
        queryFn: fetchStudentsFromApi,
        staleTime: 5 * 60 * 1000,
      })
    } catch (err) {
      console.error("Error prefetching students:", err)
    }
  }

  const getStudent = (id: string): Student | undefined => {
    return students.find((student) => student.id === id)
  }

  // Optimistic update of a single student record
  const updateStudent = async (id: string, updates: Partial<Student>): Promise<boolean> => {
    // Snapshot current state in case we ever want to roll back behaviour in future
    const previousStudents = students

    // Optimistically apply update locally first so UI responds immediately
    const applyLocalUpdate = () => {
      const timestamp = new Date().toISOString()
      setStudents((prev) =>
        prev.map((student) =>
          student.id === id ? { ...student, ...updates, updated_at: timestamp } : student,
        ),
      )
    }

    applyLocalUpdate()

    try {
      const dbConnected = await testConnection()

      if (!dbConnected) {
        // Offline or DB not reachable: keep optimistic local state and exit
        return true
      }

      if (!supabase) {
        // No Supabase client: keep optimistic local state and exit
        return true
      }

      const { error: updateError } = await supabase
        .from("students")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (updateError) {
        // Log the error but keep optimistic state to preserve UX and offline-friendly behaviour
        console.error("Error updating student in database:", updateError)
        return true
      }

      return true
    } catch (err) {
      // Preserve optimistic local update even on error to avoid jarring UI rollbacks
      console.error("Unexpected error updating student:", err)
      // If you prefer strict consistency instead of offline-first behaviour, we could roll back here:
      // setStudents(previousStudents)
      return true
    }
  }

  // Optimistic delete of a single student
  const deleteStudent = async (id: string): Promise<boolean> => {
    // Snapshot current state so we can roll back on failure
    const previousStudents = students

    // Optimistically remove the student from local state immediately
    setStudents((prev) => prev.filter((student) => student.id !== id))

    try {
      const dbConnected = await testConnection()

      if (!dbConnected) {
        throw new Error(
          "Database connection is required for student management. Please check your database configuration.",
        )
      }

      // Delete from Supabase when available
      if (!supabase) {
        // No Supabase client – keep optimistic local state and return success
        return true
      }

      const { error: deleteError } = await supabase.from("students").delete().eq("id", id)

      if (deleteError) {
        throw new Error(`Failed to delete student: ${deleteError.message}`)
      }

      return true
    } catch (err) {
      // Roll back optimistic update on error
      setStudents(previousStudents)
      console.error("Error deleting student:", err)
      setError(err instanceof Error ? err.message : "Failed to delete student")
      return false
    }
  }

  // Optimistic bulk delete of multiple students at once
  const deleteStudentsBulk = async (
    ids: string[],
  ): Promise<{ success: boolean; deletedCount: number; errors: string[] }> => {
    const previousStudents = students

    // Optimistically remove all selected students from local state
    setStudents((prev) => prev.filter((student) => !ids.includes(student.id)))

    try {
      const dbConnected = await testConnection()

      if (!dbConnected) {
        throw new Error(
          "Database connection is required for student management. Please check your database configuration.",
        )
      }

      // Delete from Supabase when available
      if (!supabase) {
        return { success: true, deletedCount: ids.length, errors: [] }
      }

      const { error: deleteError } = await supabase.from("students").delete().in("id", ids)

      if (deleteError) {
        throw new Error(`Failed to delete students: ${deleteError.message}`)
      }

      return { success: true, deletedCount: ids.length, errors: [] }
    } catch (err) {
      // Roll back optimistic update on error
      setStudents(previousStudents)
      console.error("Error deleting students:", err)
      const message = err instanceof Error ? err.message : "Failed to delete students"
      setError(message)
      return { success: false, deletedCount: 0, errors: [message] }
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

  const resetStudentPassword = async (studentId: string): Promise<{ success: boolean; password?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the API endpoint to reset password
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: studentId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password')
      }

      if (result.success) {
        // Refresh students from database
        await loadStudents()

        const student = students.find(s => s.id === studentId)

        return { success: true, password: result.password }
      } else {
        throw new Error(result.error || 'Failed to reset password')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password'
      setError(errorMessage)
      return { success: false }
    } finally {
      setIsLoading(false)
    }
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
    // Initial load will use cache when available, otherwise hit the network once.
    loadStudents().catch((err) => {
      console.error("Initial student load failed:", err)
    })
    
    // Listen for student creation events from user management
    const handleStudentCreated = () => {
      // For creation events we bypass staleTime to pick up the new record promptly.
      loadStudents({ force: true }).catch((err) => {
        console.error("Student load after creation event failed:", err)
      })
    }
    
    window.addEventListener('studentCreated', handleStudentCreated)
    
    return () => {
      window.removeEventListener('studentCreated', handleStudentCreated)
    }
  }, [])

  // Listen for student enrollment events and refresh the list
  useEffect(() => {
    const handleStudentEnrolled = () => {
      // Enrollment also changes server state, so force a refresh while keeping cache warm.
      loadStudents({ force: true }).catch((err) => {
        console.error("Student load after enrollment event failed:", err)
      })
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
    deleteStudentsBulk,
    getFilteredStudents,
    getNewStudents,
    getStudentStats,
    updateStudentStatus,
    resetStudentPassword,
    testDatabaseConnection,
    prefetchStudents,
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
