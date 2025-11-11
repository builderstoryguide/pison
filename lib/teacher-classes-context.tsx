"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "./auth-context"

export interface Subject {
  id: string
  name: string
  code: string
  coefficient: number
  description?: string
}

export interface Student {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  photo?: string
  enrollmentStatus: "enrolled" | "pending" | "transferred"
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  dateOfBirth?: string
  address?: string
}

export interface ClassSchedule {
  day: string
  periods: {
    time: string
    subject: string
    room: string
  }[]
}

export interface TeacherClass {
  id: string
  name: string
  code: string
  level: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  academicYear: string
  capacity: number
  currentEnrollment?: number // Optional enrollment count from database
  room: string
  students: Student[]
  subjects: Subject[]
  schedule: ClassSchedule[]
  createdAt: string
  updatedAt: string
}

interface TeacherClassesContextType {
  classes: TeacherClass[]
  isLoading: boolean
  error: string | null
  getTeacherClasses: () => Promise<TeacherClass[]>
  loadTeacherClasses: () => Promise<void> // Explicit load function for lazy loading
  getClassById: (classId: string) => TeacherClass | undefined
  getClassStudents: (classId: string) => Student[]
  getClassSubjects: (classId: string) => Subject[]
  searchStudents: (classId: string, searchTerm: string) => Student[]
  filterStudentsByStatus: (classId: string, status: Student["enrollmentStatus"]) => Student[]
}

const TeacherClassesContext = createContext<TeacherClassesContextType | undefined>(undefined)

export function TeacherClassesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Explicit load function for lazy loading
  const loadTeacherClasses = useCallback(async (): Promise<void> => {
    if (!user?.id || user.role !== 'teacher') {
      setClasses([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch teacher assignments which includes classes with details (subjects and students)
      const response = await fetch(`/api/teachers/${user.id}/assignments?includeDetails=true&page=1&limit=100`)
      const data = await response.json()

      console.log('Teacher classes API response:', {
        ok: data.ok,
        classesCount: data.classes?.length || 0,
        subjectsCount: data.subjects?.length || 0,
        classesWithSubjects: data.classes?.filter((cls: any) => cls.subjects && cls.subjects.length > 0).length || 0,
        totalSubjectsInClasses: data.classes?.reduce((sum: number, cls: any) => sum + (cls.subjects?.length || 0), 0) || 0,
        error: data.error,
      })

      if (!response.ok || !data.ok) {
        const errorMessage = data.error || 'Failed to fetch teacher classes'
        console.error('API returned error:', errorMessage, data)
        
        // Check if this is a linkage error
        // Note: The API should auto-repair this, but if we still get this error,
        // it means auto-repair failed or there's a different issue
        if (errorMessage.includes('not linked to user account') || 
            errorMessage.includes('migration script') ||
            data.needsMigration) {
          // Show user-friendly message and log for monitoring
          const userMessage = 'Your teacher account is being set up. If this persists, please contact support.'
          setError(userMessage)
          console.warn('Teacher linkage issue detected. Auto-repair may have failed.', {
            error: errorMessage,
            userId: user?.id,
            data
          })
          throw new Error(userMessage)
        }
        
        throw new Error(errorMessage)
      }

      if (!data.classes || data.classes.length === 0) {
        console.warn('API returned no classes. Response:', data)
        setClasses([])
        setIsLoading(false)
        return []
      }

      // Transform classes from API response to TeacherClass format
      const transformedClasses: TeacherClass[] = (data.classes || []).map((cls: any) => {
        // Generate a code from the class name if not provided
        const classCode = cls.name
          .split(' ')
          .map((word: string) => word.substring(0, 3).toUpperCase())
          .join('-')

        // Transform students data (already in correct format from API)
        const students: Student[] = (cls.students || []).map((student: any) => ({
          id: student.id,
          studentId: student.studentId || '',
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          email: student.email || '',
          phone: student.phone,
          photo: student.photo,
          enrollmentStatus: student.enrollmentStatus || 'enrolled',
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          dateOfBirth: student.dateOfBirth,
          address: student.address,
        }))

        // Transform subjects data (already in correct format from API)
        const subjects: Subject[] = (cls.subjects || []).map((subject: any) => ({
          id: subject.id || `sub_${subject.name}`,
          name: subject.name || 'Unknown Subject',
          code: subject.code || subject.name?.substring(0, 4).toUpperCase() || 'N/A',
          coefficient: subject.coefficient || 1,
          description: subject.description,
        }))

        return {
          id: cls.id,
          name: cls.name || 'Unknown Class',
          code: classCode,
          level: cls.level || '',
          subsystem: (cls.subsystem || 'english') as 'english' | 'french',
          branch: (cls.branch || 'grammar') as 'grammar' | 'technical' | 'commercial',
          academicYear: cls.academicYear || '',
          capacity: cls.capacity || 40,
          currentEnrollment: cls.currentEnrollment || students.filter(s => s.enrollmentStatus === 'enrolled').length,
          room: 'Room TBD', // Room info would need to come from timetable or class data
          students,
          subjects,
          schedule: [], // Schedule would need to come from timetable
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      })

      setClasses(transformedClasses)
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching teacher classes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch teacher classes')
      setClasses([])
      setIsLoading(false)
    }
  }, [user?.id, user?.role])

  // Keep getTeacherClasses for backward compatibility, but it now calls loadTeacherClasses
  const getTeacherClasses = useCallback(async (): Promise<TeacherClass[]> => {
    await loadTeacherClasses()
    return classes
  }, [loadTeacherClasses, classes])

  // Don't auto-fetch classes on mount - components will call loadTeacherClasses explicitly
  // This enables lazy loading

  const getClassById = (classId: string): TeacherClass | undefined => {
    return classes.find((cls) => cls.id === classId)
  }

  const getClassStudents = (classId: string): Student[] => {
    const classData = classes.find((cls) => cls.id === classId)
    return classData?.students || []
  }

  const getClassSubjects = (classId: string): Subject[] => {
    const classData = classes.find((cls) => cls.id === classId)
    return classData?.subjects || []
  }

  const searchStudents = (classId: string, searchTerm: string): Student[] => {
    const students = getClassStudents(classId)
    if (!searchTerm.trim()) return students

    const term = searchTerm.toLowerCase()
    return students.filter(
      (student) =>
        student.firstName.toLowerCase().includes(term) ||
        student.lastName.toLowerCase().includes(term) ||
        student.studentId.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term),
    )
  }

  const filterStudentsByStatus = (classId: string, status: Student["enrollmentStatus"]): Student[] => {
    const students = getClassStudents(classId)
    return students.filter((student) => student.enrollmentStatus === status)
  }

  const value: TeacherClassesContextType = {
    classes,
    isLoading,
    error,
    getTeacherClasses,
    loadTeacherClasses,
    getClassById,
    getClassStudents,
    getClassSubjects,
    searchStudents,
    filterStudentsByStatus,
  }

  return <TeacherClassesContext.Provider value={value}>{children}</TeacherClassesContext.Provider>
}

export function useTeacherClasses() {
  const context = useContext(TeacherClassesContext)
  if (context === undefined) {
    throw new Error("useTeacherClasses must be used within a TeacherClassesProvider")
  }
  return context
}
