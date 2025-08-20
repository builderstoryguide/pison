"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { supabase, testConnection } from "./supabase"

export interface ClassData {
  id: string
  name: string
  level: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  capacity: number
  currentEnrollment: number
  classTeacher: string
  subjects: string[]
  schedule: {
    day: string
    periods: {
      time: string
      subject: string
      teacher: string
    }[]
  }[]
  academicYear: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface ClassFormData {
  name: string
  level: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  capacity: number
  classTeacher: string
  subjects: string[]
  academicYear: string
}

interface ClassManagementContextType {
  classes: ClassData[]
  isLoading: boolean
  error: string | null
  isUsingDatabase: boolean
  createClass: (classData: ClassFormData) => Promise<{ success: boolean; classId?: string; error?: string }>
  updateClass: (classId: string, classData: Partial<ClassFormData>) => Promise<{ success: boolean; error?: string }>
  deleteClass: (classId: string) => Promise<{ success: boolean; error?: string }>
  getClassById: (classId: string) => ClassData | undefined
  assignStudentToClass: (studentId: string, classId: string) => Promise<{ success: boolean; error?: string }>
  removeStudentFromClass: (studentId: string, classId: string) => Promise<{ success: boolean; error?: string }>
  getClassStudents: (classId: string) => Promise<any[]>
  refreshClasses: () => Promise<void>
  testDatabaseConnection: () => Promise<boolean>
}

const ClassManagementContext = createContext<ClassManagementContextType | undefined>(undefined)

// Mock data for fallback when database is not available
const mockClasses: ClassData[] = [
  {
    id: "CLS001",
    name: "Form 1A",
    level: "Form 1",
    subsystem: "english",
    branch: "grammar",
    capacity: 40,
    currentEnrollment: 35,
    classTeacher: "Mrs. Sarah Johnson",
    subjects: ["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "History", "Geography"],
    schedule: [
      {
        day: "Monday",
        periods: [
          { time: "8:00-8:45", subject: "Mathematics", teacher: "Mr. John Doe" },
          { time: "8:45-9:30", subject: "English Language", teacher: "Mrs. Sarah Johnson" },
          { time: "9:30-10:15", subject: "Biology", teacher: "Dr. Mary Smith" },
        ],
      },
    ],
    academicYear: "2024/2025",
    status: "active",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "CLS002",
    name: "Form 2B",
    level: "Form 2",
    subsystem: "english",
    branch: "technical",
    capacity: 35,
    currentEnrollment: 32,
    classTeacher: "Mr. David Wilson",
    subjects: ["Mathematics", "English Language", "Technical Drawing", "Workshop Practice", "Physics"],
    schedule: [],
    academicYear: "2024/2025",
    status: "active",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "CLS003",
    name: "Form 5 Science",
    level: "Form 5",
    subsystem: "english",
    branch: "grammar",
    capacity: 45,
    currentEnrollment: 42,
    classTeacher: "Dr. Paul Biya",
    subjects: ["Advanced Mathematics", "Physics", "Chemistry", "Biology", "English Language"],
    schedule: [],
    academicYear: "2024/2025",
    status: "active",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "CLS004",
    name: "Terminale C",
    level: "Terminale",
    subsystem: "french",
    branch: "grammar",
    capacity: 40,
    currentEnrollment: 38,
    classTeacher: "M. Pierre Dubois",
    subjects: ["Mathématiques", "Physique", "Chimie", "Français", "Philosophie"],
    schedule: [],
    academicYear: "2024/2025",
    status: "active",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
]

export function ClassManagementProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUsingDatabase, setIsUsingDatabase] = useState(false)

  // Test database connection and load classes on mount
  useEffect(() => {
    const initializeData = async () => {
      const dbConnected = await testDatabaseConnection()
      setIsUsingDatabase(dbConnected)
      
      if (dbConnected) {
        await loadClasses()
      } else {
        // Fallback to mock data if database is not available
        setClasses(mockClasses)
        setError("Database connection is required for class management. Please check your database configuration.")
      }
    }

    initializeData()
  }, [])

  const testDatabaseConnection = async (): Promise<boolean> => {
    const connected = await testConnection()
    setIsUsingDatabase(connected)
    return connected
  }

  const loadClasses = async () => {
    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        throw new Error(`Failed to load classes: ${fetchError.message}`)
      }

      // Transform database data to match our interface
      const transformedClasses: ClassData[] = (data || []).map((dbClass) => ({
        id: dbClass.id,
        name: dbClass.class_name,
        level: dbClass.class_level,
        subsystem: dbClass.subsystem,
        branch: dbClass.stream || "grammar", // Default to grammar if stream is not set
        capacity: dbClass.capacity,
        currentEnrollment: dbClass.current_enrollment,
        classTeacher: dbClass.class_teacher_id || "Not Assigned", // We'll need to join with teachers table later
        subjects: [], // We'll need to join with subjects table later
        schedule: [], // We'll need to implement schedule management later
        academicYear: dbClass.academic_year,
        status: dbClass.status,
        createdAt: dbClass.created_at,
        updatedAt: dbClass.updated_at,
      }))

      setClasses(transformedClasses)
      console.log("Loaded classes from database:", transformedClasses.length)
    } catch (err) {
      console.error("Error loading classes:", err)
      setError(err instanceof Error ? err.message : "Failed to load classes")
      // Fallback to mock data
      setClasses(mockClasses)
    } finally {
      setIsLoading(false)
    }
  }

  const createClass = useCallback(
    async (classData: ClassFormData): Promise<{ success: boolean; classId?: string; error?: string }> => {
      setIsLoading(true)
      setError(null)

      try {
        if (!supabase) {
          throw new Error("Database connection is required for class management")
        }

        // Check if database is available
        const dbConnected = await testConnection()
        if (!dbConnected) {
          throw new Error("Database connection is required for class management. Please check your database configuration.")
        }

        // Insert class into database
        const { data: newClass, error: insertError } = await supabase
          .from("classes")
          .insert({
            class_name: classData.name,
            class_level: classData.level,
            stream: classData.branch,
            subsystem: classData.subsystem,
            academic_year: classData.academicYear,
            capacity: classData.capacity,
            current_enrollment: 0,
            class_teacher_id: null, // We'll need to implement teacher assignment later
            status: "active",
          })
          .select()
          .single()

        if (insertError) {
          throw new Error(`Failed to create class: ${insertError.message}`)
        }

        // Transform the created class to match our interface
        const transformedClass: ClassData = {
          id: newClass.id,
          name: newClass.class_name,
          level: newClass.class_level,
          subsystem: newClass.subsystem,
          branch: newClass.stream || "grammar",
          capacity: newClass.capacity,
          currentEnrollment: newClass.current_enrollment,
          classTeacher: newClass.class_teacher_id || "Not Assigned",
          subjects: classData.subjects,
          schedule: [],
          academicYear: newClass.academic_year,
          status: newClass.status,
          createdAt: newClass.created_at,
          updatedAt: newClass.updated_at,
        }

        setClasses((prev) => [transformedClass, ...prev])
        setIsLoading(false)
        return { success: true, classId: newClass.id }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create class"
        setError(errorMessage)
        setIsLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [],
  )

  const updateClass = useCallback(
    async (classId: string, classData: Partial<ClassFormData>): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      setError(null)

      try {
        if (!supabase) {
          throw new Error("Database connection is required for class management")
        }

        const updateData: any = {}
        if (classData.name) updateData.class_name = classData.name
        if (classData.level) updateData.class_level = classData.level
        if (classData.branch) updateData.stream = classData.branch
        if (classData.subsystem) updateData.subsystem = classData.subsystem
        if (classData.academicYear) updateData.academic_year = classData.academicYear
        if (classData.capacity) updateData.capacity = classData.capacity
        updateData.updated_at = new Date().toISOString()

        const { error: updateError } = await supabase
          .from("classes")
          .update(updateData)
          .eq("id", classId)

        if (updateError) {
          throw new Error(`Failed to update class: ${updateError.message}`)
        }

        setClasses((prev) =>
          prev.map((cls) =>
            cls.id === classId
              ? {
                  ...cls,
                  ...classData,
                  updatedAt: new Date().toISOString().split("T")[0],
                }
              : cls,
          ),
        )

        setIsLoading(false)
        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update class"
        setError(errorMessage)
        setIsLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [],
  )

  const deleteClass = useCallback(async (classId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      if (!supabase) {
        throw new Error("Database connection is required for class management")
      }

      const { error: deleteError } = await supabase
        .from("classes")
        .delete()
        .eq("id", classId)

      if (deleteError) {
        throw new Error(`Failed to delete class: ${deleteError.message}`)
      }

      setClasses((prev) => prev.filter((cls) => cls.id !== classId))
      setIsLoading(false)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete class"
      setError(errorMessage)
      setIsLoading(false)
      return { success: false, error: errorMessage }
    }
  }, [])

  const getClassById = useCallback(
    (classId: string): ClassData | undefined => {
      return classes.find((cls) => cls.id === classId)
    },
    [classes],
  )

  const assignStudentToClass = useCallback(
    async (studentId: string, classId: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      setError(null)

      try {
        if (!supabase) {
          throw new Error("Database connection is required for class management")
        }

        // Update student's class assignment
        const { error: studentUpdateError } = await supabase
          .from("students")
          .update({ class: classId })
          .eq("id", studentId)

        if (studentUpdateError) {
          throw new Error(`Failed to assign student to class: ${studentUpdateError.message}`)
        }

        // Update class enrollment count - first get current enrollment
        const { data: currentClass, error: fetchError } = await supabase
          .from("classes")
          .select("current_enrollment")
          .eq("id", classId)
          .single()

        if (fetchError) {
          throw new Error(`Failed to fetch current enrollment: ${fetchError.message}`)
        }

        const { error: classUpdateError } = await supabase
          .from("classes")
          .update({ 
            current_enrollment: (currentClass.current_enrollment || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", classId)

        if (classUpdateError) {
          throw new Error(`Failed to update class enrollment: ${classUpdateError.message}`)
        }

        // Update local state
        setClasses((prev) =>
          prev.map((cls) =>
            cls.id === classId
              ? {
                  ...cls,
                  currentEnrollment: cls.currentEnrollment + 1,
                  updatedAt: new Date().toISOString().split("T")[0],
                }
              : cls,
          ),
        )

        setIsLoading(false)
        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to assign student to class"
        setError(errorMessage)
        setIsLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [],
  )

  const removeStudentFromClass = useCallback(
    async (studentId: string, classId: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      setError(null)

      try {
        if (!supabase) {
          throw new Error("Database connection is required for class management")
        }

        // Remove student's class assignment
        const { error: studentUpdateError } = await supabase
          .from("students")
          .update({ class: null })
          .eq("id", studentId)

        if (studentUpdateError) {
          throw new Error(`Failed to remove student from class: ${studentUpdateError.message}`)
        }

        // Update class enrollment count - first get current enrollment
        const { data: currentClass, error: fetchError } = await supabase
          .from("classes")
          .select("current_enrollment")
          .eq("id", classId)
          .single()

        if (fetchError) {
          throw new Error(`Failed to fetch current enrollment: ${fetchError.message}`)
        }

        const { error: classUpdateError } = await supabase
          .from("classes")
          .update({ 
            current_enrollment: Math.max(0, (currentClass.current_enrollment || 0) - 1),
            updated_at: new Date().toISOString()
          })
          .eq("id", classId)

        if (classUpdateError) {
          throw new Error(`Failed to update class enrollment: ${classUpdateError.message}`)
        }

        // Update local state
        setClasses((prev) =>
          prev.map((cls) =>
            cls.id === classId
              ? {
                  ...cls,
                  currentEnrollment: Math.max(0, cls.currentEnrollment - 1),
                  updatedAt: new Date().toISOString().split("T")[0],
                }
              : cls,
          ),
        )

        setIsLoading(false)
        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to remove student from class"
        setError(errorMessage)
        setIsLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [],
  )

  const getClassStudents = useCallback(async (classId: string): Promise<any[]> => {
    if (!supabase) {
    return []
    }

    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("class", classId)

      if (error) {
        console.error("Error fetching class students:", error)
        return []
      }

      return data || []
    } catch (err) {
      console.error("Error fetching class students:", err)
      return []
    }
  }, [])

  const refreshClasses = useCallback(async (): Promise<void> => {
    if (isUsingDatabase) {
      await loadClasses()
    }
  }, [isUsingDatabase])

  const value: ClassManagementContextType = {
    classes,
    isLoading,
    error,
    isUsingDatabase,
    createClass,
    updateClass,
    deleteClass,
    getClassById,
    assignStudentToClass,
    removeStudentFromClass,
    getClassStudents,
    refreshClasses,
    testDatabaseConnection,
  }

  return <ClassManagementContext.Provider value={value}>{children}</ClassManagementContext.Provider>
}

export function useClassManagement() {
  const context = useContext(ClassManagementContext)
  if (context === undefined) {
    throw new Error("useClassManagement must be used within a ClassManagementProvider")
  }
  return context
}
