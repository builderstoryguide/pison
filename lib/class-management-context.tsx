"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

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
  createClass: (classData: ClassFormData) => Promise<{ success: boolean; classId?: string; error?: string }>
  updateClass: (classId: string, classData: Partial<ClassFormData>) => Promise<{ success: boolean; error?: string }>
  deleteClass: (classId: string) => Promise<{ success: boolean; error?: string }>
  getClassById: (classId: string) => ClassData | undefined
  assignStudentToClass: (studentId: string, classId: string) => Promise<{ success: boolean; error?: string }>
  removeStudentFromClass: (studentId: string, classId: string) => Promise<{ success: boolean; error?: string }>
  getClassStudents: (classId: string) => any[]
  refreshClasses: () => Promise<void>
}

const ClassManagementContext = createContext<ClassManagementContextType | undefined>(undefined)

// Mock data for classes
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
  const [classes, setClasses] = useState<ClassData[]>(mockClasses)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createClass = useCallback(
    async (classData: ClassFormData): Promise<{ success: boolean; classId?: string; error?: string }> => {
      setIsLoading(true)
      setError(null)

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const newClass: ClassData = {
          id: `CLS${String(classes.length + 1).padStart(3, "0")}`,
          ...classData,
          currentEnrollment: 0,
          schedule: [],
          status: "active",
          createdAt: new Date().toISOString().split("T")[0],
          updatedAt: new Date().toISOString().split("T")[0],
        }

        setClasses((prev) => [...prev, newClass])
        setIsLoading(false)
        return { success: true, classId: newClass.id }
      } catch (err) {
        const errorMessage = "Failed to create class"
        setError(errorMessage)
        setIsLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [classes.length],
  )

  const updateClass = useCallback(
    async (classId: string, classData: Partial<ClassFormData>): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      setError(null)

      try {
        await new Promise((resolve) => setTimeout(resolve, 500))

        setClasses((prev) =>
          prev.map((cls) =>
            cls.id === classId ? { ...cls, ...classData, updatedAt: new Date().toISOString().split("T")[0] } : cls,
          ),
        )

        setIsLoading(false)
        return { success: true }
      } catch (err) {
        const errorMessage = "Failed to update class"
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
      await new Promise((resolve) => setTimeout(resolve, 500))

      setClasses((prev) => prev.filter((cls) => cls.id !== classId))
      setIsLoading(false)
      return { success: true }
    } catch (err) {
      const errorMessage = "Failed to delete class"
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
        await new Promise((resolve) => setTimeout(resolve, 500))

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
        const errorMessage = "Failed to assign student to class"
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
        await new Promise((resolve) => setTimeout(resolve, 500))

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
        const errorMessage = "Failed to remove student from class"
        setError(errorMessage)
        setIsLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [],
  )

  const getClassStudents = useCallback((classId: string): any[] => {
    // Mock implementation - in real app, this would fetch students for the class
    return []
  }, [])

  const refreshClasses = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      // In real app, this would fetch fresh data from API
      setIsLoading(false)
    } catch (err) {
      setError("Failed to refresh classes")
      setIsLoading(false)
    }
  }, [])

  const value: ClassManagementContextType = {
    classes,
    isLoading,
    error,
    createClass,
    updateClass,
    deleteClass,
    getClassById,
    assignStudentToClass,
    removeStudentFromClass,
    getClassStudents,
    refreshClasses,
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
