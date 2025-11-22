"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react"
import { supabase, isSupabaseAvailable } from "./supabase"
import { useAuth } from "@/lib/auth-context"
import { validateDatabaseSetup, createDatabaseSetupErrorResponse } from "./database-validation"
import { serializeSupabaseError } from "@/lib/safe-error"

// Types
export interface Assessment {
  id: string
  title: string
  type: "quiz" | "test" | "exam" | "assignment" | "project"
  subject: string
  classId: string
  className: string
  classLevel?: string // Optional class level for level-based filtering
  totalMarks: number
  date: string
  dueDate?: string
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
  teacherSubjects: string[] // Add teacher subjects
  loading: boolean
  loadingAssessments: boolean
  loadingGrades: boolean
  loadingStudents: boolean
  loadingClasses: boolean
  loadingSubjects: boolean
  error: string | null

  // Data loading functions (lazy loading)
  loadAssessments: () => Promise<void>
  loadGrades: () => Promise<void>
  loadStudents: () => Promise<void>
  loadClasses: () => Promise<void>
  loadTeacherSubjects: () => Promise<void>
  loadAllData: () => Promise<void>

  // Assessment functions
  createAssessment: (assessment: Omit<Assessment, "id" | "createdAt">) => Promise<void>
  updateAssessment: (id: string, updates: Partial<Assessment>) => Promise<void>
  deleteAssessment: (id: string) => Promise<void>
  getAssessmentsByClass: (classId: string) => Assessment[]
  getAssessmentsForTeacher: () => Assessment[]

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

  // Teacher functions
  getTeacherSubjects: () => string[] // Add function to get teacher subjects

  // Utility functions
  calculateGrade: (marks: number, totalMarks: number) => string
  calculateAverageOn20: (marks: number, totalMarks: number) => number
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
  const { user } = useAuth()
  // Mock data as fallback
  const mockAssessments: Assessment[] = [
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
  ]

  const mockGrades: Grade[] = [
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
  ]

  const mockStudents: Student[] = [
    {
      id: "student-1",
      name: "Marie Ngozi",
      email: "marie.ngozi@student.pisonacademy.cm",
      studentId: "STU001",
      classId: "class-1",
      className: "Form 5A",
    },
    {
      id: "student-2",
      name: "Jean Kamga",
      email: "jean.kamga@student.pisonacademy.cm",
      studentId: "STU002",
      classId: "class-1",
      className: "Form 5A",
    },
    {
      id: "student-3",
      name: "Fatima Bello",
      email: "fatima.bello@student.pisonacademy.cm",
      studentId: "STU003",
      classId: "class-2",
      className: "Form 6B",
    },
  ]

  const mockClasses: TeacherClass[] = [
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
  ]

  // Initialize with empty arrays - only use mock data if database is unavailable
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gradesEnrichmentRef = useRef<Set<string>>(new Set())
  const [useDatabase, setUseDatabase] = useState(false)
  const [dataLoaded, setDataLoaded] = useState({
    assessments: false,
    grades: false,
    students: false,
    classes: false,
    subjects: false,
  })
  const [teacherClassIds, setTeacherClassIds] = useState<string[]>([])
  const [teacherClassLevels, setTeacherClassLevels] = useState<string[]>([])

  const loadTeacherSubjects = useCallback(async () => {
    // Early return if database is not enabled
    if (!useDatabase || !supabase) {
      // Set default subjects if not using database
      if (teacherSubjects.length === 0) {
        setTeacherSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology'])
      }
      return
    }

    // Skip if already loaded
    if (dataLoaded.subjects) {
      return
    }

    setLoadingSubjects(true)

    try {
      // Validate user exists and has an ID
      if (!user || !user.id) {
        console.warn("Cannot load teacher subjects: User not authenticated. User state:", {
          userExists: !!user,
          userId: user?.id,
          userEmail: user?.email,
        })
        // Set default subjects for unauthenticated users
        setTeacherSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology'])
        return
      }

      // Validate database setup - check if teacher_subjects table exists
      try {
        const validationResult = await validateDatabaseSetup(supabase, ['teacher_subjects'], [])
        if (!validationResult.isValid) {
          console.warn("Teacher subjects table does not exist. Using default subjects.")
          const errorResponse = createDatabaseSetupErrorResponse(validationResult, 'teacher_subjects table')
          console.warn("Setup instructions:", errorResponse.setupInstructions)
          console.warn("Missing scripts:", errorResponse.missingScripts)
          // Set default subjects instead of throwing
          setTeacherSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology'])
          return
        }
      } catch (validationError) {
        console.warn("Error validating database setup for teacher_subjects:", validationError)
        // Continue with query attempt - might be a network issue
      }

      // Execute query with validated user ID
      const { data, error } = await supabase
        .from("teacher_subjects")
        .select("subject_name")
        .eq("teacher_id", user.id)
        .eq("is_active", true)

      if (error) {
        // Import error serialization
        const { serializeSupabaseError } = await import('./safe-error')
        const serializedError = serializeSupabaseError(error)
        
        // Check if it's a schema-related error
        if (
          error.code === 'PGRST116' ||
          error.message?.includes('relation') ||
          error.message?.includes('does not exist') ||
          error.message?.includes('no such table') ||
          error.message?.includes('schema cache')
        ) {
          console.warn("Schema error detected for teacher_subjects. Using default subjects.")
          console.warn("Error details:", JSON.stringify(serializedError, null, 2))
          const validationResult = await validateDatabaseSetup(supabase, ['teacher_subjects'], [])
          if (!validationResult.isValid) {
            const errorResponse = createDatabaseSetupErrorResponse(validationResult, 'teacher_subjects table')
            console.warn("Setup instructions:", errorResponse.setupInstructions)
          }
          // Set default subjects instead of throwing
          setTeacherSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology'])
          return
        }

        // Check for RLS (Row Level Security) policy errors
        if (
          error.code === '42501' ||
          error.message?.includes('permission denied') ||
          error.message?.includes('row-level security') ||
          error.message?.includes('policy violation')
        ) {
          console.error("RLS policy error fetching teacher subjects:", JSON.stringify(serializedError, null, 2))
          console.error("Context:", {
            userId: user.id,
            userEmail: user.email,
            table: "teacher_subjects",
            action: "SELECT",
            hint: "Check RLS policies for teacher_subjects table. Ensure policies allow users to read their own subjects.",
          })
          // Set default subjects instead of throwing
          setTeacherSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology'])
          return
        }

        // Check for authentication errors
        if (
          error.code === 'PGRST301' ||
          error.message?.includes('JWT') ||
          error.message?.includes('authentication') ||
          error.message?.includes('unauthorized')
        ) {
          console.error("Authentication error fetching teacher subjects:", JSON.stringify(serializedError, null, 2))
          console.error("Context:", {
            userId: user.id,
            userEmail: user.email,
            hint: "User session may have expired. Please refresh the page.",
          })
          // Set default subjects instead of throwing
          setTeacherSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology'])
          return
        }

        // Log other errors with full context
        console.error("Supabase error fetching teacher subjects:", JSON.stringify(serializedError, null, 2))
        console.error("Error context:", {
          userId: user.id,
          userEmail: user.email,
          table: "teacher_subjects",
          query: "SELECT subject_name WHERE teacher_id = ? AND is_active = true",
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
        })
        
        // Set default subjects on error instead of throwing
        setTeacherSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology'])
        return
      }

      // Process successful response
      if (data && Array.isArray(data) && data.length > 0) {
        const subjects = data.map((item: any) => item.subject_name).filter(Boolean)
        if (subjects.length > 0) {
          setTeacherSubjects(subjects)
          console.log(`Loaded ${subjects.length} teacher subjects for user ${user.id}`)
        } else {
          console.warn("No valid subjects found in response. Using default subjects.")
          setTeacherSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology'])
        }
      } else {
        // If no data, set some default subjects
        console.warn("No teacher subjects found in database for user. Using default subjects.", {
          userId: user.id,
          userEmail: user.email,
        })
        setTeacherSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology'])
      }
    } catch (err) {
      // Handle unexpected errors
      const { serializeSupabaseError } = await import('./safe-error')
      const serializedError = serializeSupabaseError(err)
      
      console.error("Unexpected error fetching teacher subjects:", JSON.stringify(serializedError, null, 2))
      console.error("Error context:", {
        userId: user?.id,
        userEmail: user?.email,
        userExists: !!user,
        useDatabase,
        supabaseAvailable: !!supabase,
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        errorStack: err instanceof Error ? err.stack : undefined,
      })
      
      // Set default subjects on error instead of throwing
      setTeacherSubjects(['Mathematics', 'Physics', 'Chemistry', 'Biology'])
    } finally {
      setLoadingSubjects(false)
      setDataLoaded(prev => ({ ...prev, subjects: true }))
    }
  }, [useDatabase, user, user?.id, dataLoaded.subjects, teacherSubjects.length])

  // State for teacher class names
  const [teacherClassNames, setTeacherClassNames] = useState<string[]>([])

  // Load teacher's assigned class IDs, levels, and names
  const loadTeacherClassIds = useCallback(async () => {
    if (!user?.id || user.role !== 'teacher') {
      setTeacherClassIds([])
      setTeacherClassLevels([])
      setTeacherClassNames([])
      return
    }

    try {
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = new Date().getTime()
      const response = await fetch(`/api/teachers/${user.id}/assignments?includeDetails=true&page=1&limit=100&t=${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      const data = await response.json()

      if (response.ok && data.ok && data.classes) {
        const classIds = data.classes.map((cls: any) => cls.id).filter(Boolean)
        // Extract unique class levels from assigned classes
        const classLevels = data.classes
          .map((cls: any) => cls.level || cls.class_level)
          .filter((level: string | undefined): level is string => Boolean(level))
        const uniqueLevels = Array.from(new Set(classLevels))
        
        // Extract unique class names from assigned classes
        const classNames = data.classes
          .map((cls: any) => cls.name || cls.class_name)
          .filter((name: string | undefined): name is string => Boolean(name))
        const uniqueNames = Array.from(new Set(classNames))
        
        setTeacherClassIds(classIds)
        setTeacherClassLevels(uniqueLevels)
        setTeacherClassNames(uniqueNames)
        console.log(`📋 Loaded ${classIds.length} class IDs, ${uniqueLevels.length} class levels, and ${uniqueNames.length} class names for teacher ${user.id}`)
      } else {
        console.warn('Failed to load teacher class IDs:', data.error)
        setTeacherClassIds([])
        setTeacherClassLevels([])
        setTeacherClassNames([])
      }
    } catch (err) {
      console.error("Error loading teacher class IDs:", err)
      setTeacherClassIds([])
      setTeacherClassLevels([])
      setTeacherClassNames([])
    }
  }, [user?.id, user?.role])

  // Individual load functions for lazy loading
  const loadAssessments = useCallback(async () => {
    if (!useDatabase || !supabase || dataLoaded.assessments) return

    setLoadingAssessments(true)
    // Clear assessments before loading to prevent showing stale/mock data
    setAssessments([])
    try {
      // Load teacher's class IDs and levels if not already loaded
      if (teacherClassIds.length === 0 && user?.id && user.role === 'teacher') {
        await loadTeacherClassIds()
      }

      // Fetch all assessments (we'll filter by class_id OR class_level after joining with classes)
      // We don't pre-filter here because we need to check both class_id and class_level matches
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from("assessments")
        .select("*")
        .order("created_at", { ascending: false })

      if (!assessmentsError && assessmentsData) {
        // Fetch class information for assessments to get class_level
        // Get unique class IDs from assessments
        const assessmentClassIds = [...new Set(assessmentsData.map((a: any) => a.class_id).filter(Boolean))]
        
        let classLevelMap: Record<string, string> = {}
        let classNameMap: Record<string, string> = {}
        let classesData: any[] = []
        
        if (assessmentClassIds.length > 0) {
          // Try to fetch classes - handle both UUID and VARCHAR class_id formats
          // First, try to filter valid UUIDs
          const validUuidIds = assessmentClassIds.filter((id: string) => {
            // Check if it's a valid UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            return uuidRegex.test(id)
          })
          
          // Also try to match by class_name if class_id is not a UUID
          const nonUuidIds = assessmentClassIds.filter((id: string) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            return !uuidRegex.test(id)
          })
          
          // Fetch classes by UUID
          if (validUuidIds.length > 0) {
            const { data: fetchedClassesById } = await supabase
              .from("classes")
              .select("id, class_name, class_level")
              .in("id", validUuidIds)
            
            if (fetchedClassesById) {
              classesData = [...classesData, ...fetchedClassesById]
              fetchedClassesById.forEach((cls: any) => {
                if (cls.id) {
                  // Store with both UUID string and original format for lookup
                  const idStr = cls.id.toString()
                  const idLower = idStr.toLowerCase().trim()
                  classLevelMap[idStr] = cls.class_level || ''
                  classLevelMap[idLower] = cls.class_level || ''
                  classNameMap[idStr] = cls.class_name || ''
                  classNameMap[idLower] = cls.class_name || ''
                  
                  // Also map by class_name for lookups
                  if (cls.class_name) {
                    const nameLower = cls.class_name.toLowerCase().trim()
                    classLevelMap[cls.class_name] = cls.class_level || ''
                    classLevelMap[nameLower] = cls.class_level || ''
                    classNameMap[cls.class_name] = cls.class_name
                    classNameMap[nameLower] = cls.class_name
                  }
                  
                  // Map by class_level for level-based lookups
                  if (cls.class_level) {
                    const levelLower = cls.class_level.toLowerCase().trim()
                    classLevelMap[cls.class_level] = cls.class_level
                    classLevelMap[levelLower] = cls.class_level
                  }
                }
              })
            }
          }
          
          // Fetch classes by name (for non-UUID class_ids)
          if (nonUuidIds.length > 0) {
            // Try exact match first
            const { data: fetchedClassesByName } = await supabase
              .from("classes")
              .select("id, class_name, class_level")
              .in("class_name", nonUuidIds)
            
            if (fetchedClassesByName) {
              classesData = [...classesData, ...fetchedClassesByName]
              fetchedClassesByName.forEach((cls: any) => {
                if (cls.id) {
                  const idStr = cls.id.toString()
                  const idLower = idStr.toLowerCase().trim()
                  // Map both by UUID and by class_name for lookup
                  classLevelMap[idStr] = cls.class_level || ''
                  classLevelMap[idLower] = cls.class_level || ''
                  classNameMap[idStr] = cls.class_name || ''
                  classNameMap[idLower] = cls.class_name || ''
                  
                  // Also map by class_name for non-UUID lookups
                  if (cls.class_name) {
                    const nameLower = cls.class_name.toLowerCase().trim()
                    classLevelMap[cls.class_name] = cls.class_level || ''
                    classLevelMap[nameLower] = cls.class_level || ''
                    classNameMap[cls.class_name] = cls.class_name
                    classNameMap[nameLower] = cls.class_name
                  }
                  
                  // Map by class_level
                  if (cls.class_level) {
                    const levelLower = cls.class_level.toLowerCase().trim()
                    classLevelMap[cls.class_level] = cls.class_level
                    classLevelMap[levelLower] = cls.class_level
                  }
                }
              })
            }
            
            // Also try fetching by class_level (for assessments with level as class_id)
            const { data: fetchedClassesByLevel } = await supabase
              .from("classes")
              .select("id, class_name, class_level")
              .in("class_level", nonUuidIds)
            
            if (fetchedClassesByLevel) {
              // Avoid duplicates
              const existingIds = new Set(classesData.map((c: any) => c.id))
              const newClasses = fetchedClassesByLevel.filter((c: any) => !existingIds.has(c.id))
              classesData = [...classesData, ...newClasses]
              
              newClasses.forEach((cls: any) => {
                if (cls.id) {
                  const idStr = cls.id.toString()
                  const idLower = idStr.toLowerCase().trim()
                  classLevelMap[idStr] = cls.class_level || ''
                  classLevelMap[idLower] = cls.class_level || ''
                  classNameMap[idStr] = cls.class_name || ''
                  classNameMap[idLower] = cls.class_name || ''
                  
                  if (cls.class_name) {
                    const nameLower = cls.class_name.toLowerCase().trim()
                    classLevelMap[cls.class_name] = cls.class_level || ''
                    classLevelMap[nameLower] = cls.class_level || ''
                    classNameMap[cls.class_name] = cls.class_name
                    classNameMap[nameLower] = cls.class_name
                  }
                  
                  if (cls.class_level) {
                    const levelLower = cls.class_level.toLowerCase().trim()
                    classLevelMap[cls.class_level] = cls.class_level
                    classLevelMap[levelLower] = cls.class_level
                  }
                }
              })
            }
          }
          
          console.log('📚 Class lookup results:', {
            assessmentClassIds: assessmentClassIds.length,
            validUuids: validUuidIds.length,
            nonUuids: nonUuidIds.length,
            classesFound: classesData.length,
            classLevelMapKeys: Object.keys(classLevelMap).length,
            sampleClassLevelMap: Object.fromEntries(Object.entries(classLevelMap).slice(0, 5))
          })
        }

        // Filter assessments by class_id OR class_level OR class_name
        // Convert teacher class IDs to strings for consistent comparison
        const teacherClassIdsStr = teacherClassIds.map(id => id.toString().toLowerCase().trim())
        
        // Get teacher's class names from state (loaded from assignments API)
        // Also add class names from the classes we fetched
        const teacherClassNamesSet = new Set<string>()
        
        // Add class names from teacher's assigned classes (from state)
        teacherClassNames.forEach((name: string) => {
          if (name) {
            teacherClassNamesSet.add(name.toLowerCase().trim())
          }
        })
        
        // Also add class names from the classes we fetched from database
        classesData.forEach((cls: any) => {
          if (cls.class_name) {
            teacherClassNamesSet.add(cls.class_name.toLowerCase().trim())
          }
        })
        
        // Also get class names from teacher's assigned classes (if we have that data)
        // For now, we'll be more permissive and include assessments that might match
        let filteredAssessments = assessmentsData
        
        if (teacherClassIds.length > 0 || teacherClassLevels.length > 0 || teacherClassNamesSet.size > 0) {
          filteredAssessments = assessmentsData.filter((assessment: any) => {
            // Normalize assessment class_id to string for comparison
            const assessmentClassId = (assessment.class_id?.toString() || '').toLowerCase().trim()
            const assessmentClassIdOriginal = assessment.class_id?.toString() || ''
            
            // Normalize assessment class_name if it exists
            const assessmentClassName = (assessment.class_name || '').toLowerCase().trim()
            
            // Check if assessment's class_id matches teacher's class IDs
            // Try multiple comparison methods to handle UUID and VARCHAR formats
            let matchesClassId = false
            if (teacherClassIdsStr.length > 0 && assessmentClassId) {
              // Direct string comparison (normalized)
              matchesClassId = teacherClassIdsStr.includes(assessmentClassId)
              
              // Also check if any teacher class ID matches when both are normalized
              if (!matchesClassId) {
                matchesClassId = teacherClassIdsStr.some(teacherId => {
                  const normalizedTeacherId = teacherId.toLowerCase().trim()
                  const normalizedAssessmentId = assessmentClassId.toLowerCase().trim()
                  return normalizedTeacherId === normalizedAssessmentId
                })
              }
              
              // Check against original format as well
              if (!matchesClassId && assessmentClassIdOriginal) {
                matchesClassId = teacherClassIds.some(teacherId => {
                  const teacherIdStr = teacherId.toString()
                  return teacherIdStr === assessmentClassIdOriginal || 
                         teacherIdStr === assessment.class_id ||
                         assessmentClassIdOriginal === teacherIdStr
                })
              }
            }
            
            // Check if assessment's class level matches teacher's class levels
            // Try to get class level from map (by UUID or by name)
            const assessmentClassLevel = classLevelMap[assessmentClassIdOriginal] || 
                                       classLevelMap[assessment.class_id] || 
                                       classLevelMap[assessmentClassId] ||
                                       assessment.class_level || ''
            
            let matchesClassLevel = false
            if (teacherClassLevels.length > 0 && assessmentClassLevel) {
              const assessmentLevelLower = assessmentClassLevel.toLowerCase().trim()
              matchesClassLevel = teacherClassLevels.some(level => {
                const levelLower = level.toLowerCase().trim()
                return levelLower === assessmentLevelLower
              })
            }
            
            // Check if assessment's class_name matches teacher's class names
            let matchesClassName = false
            if (teacherClassNamesSet.size > 0 && assessmentClassName) {
              matchesClassName = teacherClassNamesSet.has(assessmentClassName) ||
                                Array.from(teacherClassNamesSet).some(name => {
                                  return name === assessmentClassName ||
                                         name.includes(assessmentClassName) ||
                                         assessmentClassName.includes(name) ||
                                         name.startsWith(assessmentClassName) ||
                                         assessmentClassName.startsWith(name)
                                })
            }
            
            // Check if assessment's class_id matches teacher's class names (for assessments with name as class_id)
            let matchesClassIdAsName = false
            if (!matchesClassId && teacherClassNamesSet.size > 0 && assessmentClassId) {
              matchesClassIdAsName = Array.from(teacherClassNamesSet).some(name => {
                return name === assessmentClassId ||
                       name.includes(assessmentClassId) ||
                       assessmentClassId.includes(name) ||
                       name.startsWith(assessmentClassId) ||
                       assessmentClassId.startsWith(name)
              })
            }
            
            // Check if assessment's class_id matches teacher's class levels (for assessments with level as class_id)
            let matchesClassIdAsLevel = false
            if (!matchesClassId && !matchesClassLevel && teacherClassLevels.length > 0 && assessmentClassId) {
              const assessmentIdStr = assessmentClassIdOriginal?.toString() || assessmentClassId
              // Check if assessment class_id is not a UUID (might be a level string like "Form 1")
              const isNotUuid = !assessmentIdStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
              
              if (isNotUuid) {
                const assessmentIdLower = assessmentIdStr.toLowerCase().trim()
                matchesClassIdAsLevel = teacherClassLevels.some(level => {
                  const levelLower = level.toLowerCase().trim()
                  return levelLower === assessmentIdLower ||
                         levelLower.includes(assessmentIdLower) ||
                         assessmentIdLower.includes(levelLower) ||
                         // Also check if both contain "form" and same number
                         (levelLower.includes('form') && assessmentIdLower.includes('form') &&
                          levelLower.match(/\d+/)?.[0] === assessmentIdLower.match(/\d+/)?.[0])
                })
              }
            }
            
            const matches = matchesClassId || matchesClassLevel || matchesClassName || 
                          matchesClassIdAsName || matchesClassIdAsLevel
            
            // Enhanced debug logging
            if (!matches && assessmentClassId) {
              console.log('🔴 Assessment filtered out (teacher level):', {
                assessmentId: assessment.id,
                assessmentTitle: assessment.title,
                assessmentClassId: assessmentClassIdOriginal,
                assessmentClassName,
                assessmentClassLevel,
                teacherClassIds: teacherClassIdsStr.slice(0, 3), // Show first 3 for brevity
                teacherClassLevels,
                teacherClassNames: Array.from(teacherClassNamesSet).slice(0, 3),
                matchesClassId,
                matchesClassLevel,
                matchesClassName,
                matchesClassIdAsName,
                matchesClassIdAsLevel
              })
            } else if (matches) {
              console.log('🟢 Assessment included (teacher level):', {
                assessmentId: assessment.id,
                assessmentTitle: assessment.title,
                assessmentClassId: assessmentClassIdOriginal,
                matchesClassId,
                matchesClassLevel,
                matchesClassName,
                matchesClassIdAsName,
                matchesClassIdAsLevel
              })
            }
            
            return matches
          })
        } else {
          // If no teacher class filters, include all assessments (will be filtered in component)
          console.log('⚠️ No teacher class filters, including all assessments for component-level filtering')
        }
        
        console.log('Assessment filtering summary:', {
          totalAssessments: assessmentsData.length,
          filteredAssessments: filteredAssessments.length,
          teacherClassIds: teacherClassIdsStr.length,
          teacherClassLevels: teacherClassLevels.length
        })

        const formattedAssessments: Assessment[] = filteredAssessments.map((assessment: any) => {
          // Normalize class_id to string for consistent storage
          const classId = assessment.class_id?.toString() || ''
          const classIdOriginal = assessment.class_id
          const classIdLower = classId.toLowerCase().trim()
          
          // Get class level from map using multiple lookup methods (case-insensitive)
          let classLevel = ''
          if (classIdOriginal) {
            classLevel = classLevelMap[classIdOriginal] || 
                        classLevelMap[classId] || 
                        classLevelMap[classIdOriginal?.toString()] ||
                        classLevelMap[classIdLower] ||
                        classLevelMap[classIdOriginal.toString().toLowerCase().trim()] ||
                        ''
          }
          
          // If still no class level, try using assessment's class_name field
          if (!classLevel && assessment.class_name) {
            const assessmentClassName = assessment.class_name.toLowerCase().trim()
            classLevel = classLevelMap[assessment.class_name] ||
                        classLevelMap[assessmentClassName] ||
                        ''
          }
          
          // Fallback: if class_id looks like a level (e.g., "Form 2"), use it as classLevel
          if (!classLevel && classId && !classId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // Check if it matches common level patterns like "Form 2", "Level 1", etc.
            const levelPattern = /^(form|level|grade|class)\s*\d+/i
            if (levelPattern.test(classId)) {
              classLevel = classId
            }
          }
          
          // Final fallback: use assessment.class_level if it exists
          if (!classLevel) {
            classLevel = assessment.class_level || ''
          }
          
          // Get class name from map using multiple lookup methods (case-insensitive)
          let className = ''
          if (classIdOriginal) {
            className = classNameMap[classIdOriginal] || 
                       classNameMap[classId] ||
                       classNameMap[classIdOriginal?.toString()] || 
                       classNameMap[classIdLower] ||
                       classNameMap[classIdOriginal.toString().toLowerCase().trim()] ||
                       ''
          }
          
          // Fallback: use assessment's class_name field if available
          if (!className) {
            className = assessment.class_name || ''
          }
          
          // If class_id is not a UUID and looks like a class name, use it as className
          if (!className && classId && !classId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // Check if it contains level info (like "Form 2 BC")
            const namePattern = /^(form|level|grade|class)\s*\d+/i
            if (namePattern.test(classId)) {
              className = classId
            }
          }
          
          console.log('📝 Formatting assessment:', {
            assessmentId: assessment.id,
            assessmentTitle: assessment.title,
            classId: classIdOriginal,
            className,
            classLevel,
            assessmentClassName: assessment.class_name,
            assessmentClassLevel: assessment.class_level
          })
          
          return {
            id: assessment.id,
            title: assessment.title,
            type: assessment.type,
            subject: assessment.subject,
            classId: classId, // Store as normalized string
            className: className,
            classLevel: classLevel, // Ensure classLevel is always populated
            totalMarks: assessment.total_marks,
            date: assessment.assessment_date,
            dueDate: assessment.due_date,
            createdAt: assessment.created_at,
          }
        })
        setAssessments(formattedAssessments)
        setDataLoaded(prev => ({ ...prev, assessments: true }))
      } else if (assessmentsError) {
        try {
          const { serializeSupabaseError } = await import('./safe-error')
          console.error('Supabase error fetching assessments:', serializeSupabaseError(assessmentsError))
        } catch (_) {
          console.error('Supabase error fetching assessments:', assessmentsError)
        }
      }
    } catch (err) {
      console.error("Error loading assessments:", err)
    } finally {
      setLoadingAssessments(false)
    }
  }, [useDatabase, supabase, dataLoaded.assessments, teacherClassIds, teacherClassLevels, teacherClassNames, user?.id, user?.role, loadTeacherClassIds])

  const loadGrades = useCallback(async () => {
    if (!useDatabase || !supabase || dataLoaded.grades) return

    setLoadingGrades(true)
    // Clear grades before loading to prevent showing stale/mock data
    setGrades([])
    try {
      // Load grades with a join to students table to get student names
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select(`
          *,
          students:student_id (
            id,
            first_name,
            last_name
          )
        `)
        .order("submitted_at", { ascending: false })

      if (!gradesError && gradesData) {
        const formattedGrades: Grade[] = gradesData.map((grade: any) => {
          // Get student name from joined data or from grade.student_name field
          let studentName = grade.student_name || ""
          
          // If student_name is missing, try to get it from the joined students data
          if (!studentName && grade.students) {
            const student = Array.isArray(grade.students) ? grade.students[0] : grade.students
            if (student && student.first_name && student.last_name) {
              studentName = `${student.first_name} ${student.last_name}`.trim()
            }
          }
          
          // If still no name, use studentId as fallback (will be enriched later if students are loaded)
          if (!studentName) {
            studentName = grade.student_id || ""
          }
          
          return {
            id: grade.id,
            assessmentId: grade.assessment_id,
            studentId: grade.student_id,
            studentName: studentName,
            marks: grade.marks_obtained,
            percentage: grade.percentage,
            grade: grade.grade_letter,
            remarks: grade.remarks,
            submittedAt: grade.submitted_at,
          }
        })
        setGrades(formattedGrades)
        setDataLoaded(prev => ({ ...prev, grades: true }))
      } else if (gradesError) {
        // If join fails, try loading without join and enrich later
        const { data: gradesDataFallback, error: fallbackError } = await supabase
          .from("grades")
          .select("*")
          .order("submitted_at", { ascending: false })

        if (!fallbackError && gradesDataFallback) {
          const formattedGrades: Grade[] = gradesDataFallback.map((grade: any) => ({
            id: grade.id,
            assessmentId: grade.assessment_id,
            studentId: grade.student_id,
            studentName: grade.student_name || grade.student_id || "",
            marks: grade.marks_obtained,
            percentage: grade.percentage,
            grade: grade.grade_letter,
            remarks: grade.remarks,
            submittedAt: grade.submitted_at,
          }))
          setGrades(formattedGrades)
          setDataLoaded(prev => ({ ...prev, grades: true }))
        } else {
          try {
            const { serializeSupabaseError } = await import('./safe-error')
            console.error('Supabase error fetching grades:', serializeSupabaseError(gradesError))
          } catch (_) {
            console.error('Supabase error fetching grades:', gradesError)
          }
        }
      }
    } catch (err) {
      console.error("Error loading grades:", err)
    } finally {
      setLoadingGrades(false)
    }
  }, [useDatabase, dataLoaded.grades])

  const loadStudents = useCallback(async () => {
    if (!useDatabase || !supabase) return
    // Allow reload if students array is empty even if dataLoaded is true
    if (dataLoaded.students && students.length > 0) return

    setLoadingStudents(true)
    // Clear students before loading to prevent showing stale/mock data
    setStudents([])
    try {
      // Try to load students with both class_id and class fields to handle schema variations
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, first_name, last_name, email, student_id, class_id, class, class_name")
        .order("first_name", { ascending: true })

      if (!studentsError && studentsData) {
        const formattedStudents: Student[] = studentsData.map((student: any) => {
          // Handle both class_id (VARCHAR) and class (UUID) fields
          // Prefer class (UUID) if available, otherwise use class_id
          const classId = student.class || student.class_id || ""
          
          return {
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            email: student.email,
            studentId: student.student_id,
            classId: classId.toString(), // Ensure it's a string for comparison
            className: student.class_name || "",
          }
        })
        setStudents(formattedStudents)
        setDataLoaded(prev => ({ ...prev, students: true }))
        console.log(`Loaded ${formattedStudents.length} students`)
      } else if (studentsError) {
        try {
          const { serializeSupabaseError } = await import('./safe-error')
          console.error('Supabase error fetching students:', serializeSupabaseError(studentsError))
        } catch (_) {
          console.error('Supabase error fetching students:', studentsError)
        }
      }
    } catch (err) {
      console.error("Error loading students:", err)
    } finally {
      setLoadingStudents(false)
    }
  }, [useDatabase, dataLoaded.students, students.length])

  const loadClasses = useCallback(async () => {
    if (!useDatabase || !supabase || dataLoaded.classes) return

    setLoadingClasses(true)
    // Clear classes before loading to prevent showing stale/mock data
    setClasses([])
    try {
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .order("name", { ascending: true })

      if (!classesError && classesData) {
        const formattedClasses: TeacherClass[] = classesData.map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          subject: cls.subject || "",
          level: cls.level || "",
          section: cls.section || "",
          studentCount: cls.student_count || 0,
          schedule: cls.schedule || "",
        }))
        setClasses(formattedClasses)
        setDataLoaded(prev => ({ ...prev, classes: true }))
      } else if (classesError) {
        try {
          const { serializeSupabaseError } = await import('./safe-error')
          console.error('Supabase error fetching classes:', serializeSupabaseError(classesError))
        } catch (_) {
          console.error('Supabase error fetching classes:', classesError)
        }
      }
    } catch (err) {
      console.error("Error loading classes:", err)
    } finally {
      setLoadingClasses(false)
    }
  }, [useDatabase, dataLoaded.classes])

  // Load all data at once (for backward compatibility)
  const loadAllData = useCallback(async () => {
    if (!useDatabase || !supabase) return

    setLoading(true)
    try {
      await Promise.all([
        loadAssessments(),
        loadGrades(),
        loadStudents(),
        loadClasses(),
        loadTeacherSubjects(),
      ])
    } catch (err) {
      try {
        const { serializeSupabaseError } = await import('./safe-error')
        console.error("Error loading data from database:", serializeSupabaseError(err as any))
      } catch (_) {
        console.error("Error loading data from database:", err)
      }
      setError("Failed to load data from database")
    } finally {
      setLoading(false)
    }
  }, [useDatabase, loadAssessments, loadGrades, loadStudents, loadClasses, loadTeacherSubjects])

  // Enrich grades with student names from students array
  useEffect(() => {
    if (grades.length > 0 && students.length > 0) {
      // Create a map of student IDs to names for efficient lookup
      const studentNameMap = new Map<string, string>()
      students.forEach(student => {
        if (student.id && student.name) {
          studentNameMap.set(student.id, student.name)
        }
      })
      
      // Check if any grades need enrichment
      const gradesNeedingEnrichment = grades.filter(
        grade => {
          const gradeKey = `${grade.id}-${grade.studentId}`
          const needsEnrichment = (!grade.studentName || grade.studentName === grade.studentId || grade.studentName === "") &&
                                 studentNameMap.has(grade.studentId) &&
                                 !gradesEnrichmentRef.current.has(gradeKey)
          return needsEnrichment
        }
      )
      
      if (gradesNeedingEnrichment.length > 0) {
        setGrades(prevGrades => {
          const enrichedGrades = prevGrades.map(grade => {
            // If grade already has a proper name (not empty and not equal to studentId), keep it
            if (grade.studentName && grade.studentName !== grade.studentId && grade.studentName.trim() !== "") {
              return grade
            }
            
            // Try to find student name from map
            const studentName = studentNameMap.get(grade.studentId)
            if (studentName && studentName !== grade.studentName) {
              const gradeKey = `${grade.id}-${grade.studentId}`
              gradesEnrichmentRef.current.add(gradeKey)
              return {
                ...grade,
                studentName: studentName
              }
            }
            
            // If no student found, keep the current value (might be studentId or empty)
            return grade
          })
          
          return enrichedGrades
        })
      }
    }
  }, [grades.length, students.length])

  // Load teacher class IDs and levels when user is available
  useEffect(() => {
    if (user?.id && user.role === 'teacher' && useDatabase) {
      loadTeacherClassIds()
    } else if (!useDatabase && user?.role === 'teacher') {
      // For mock data, use mock class IDs and levels
      setTeacherClassIds(mockClasses.map(cls => cls.id))
      const mockLevels = [...new Set(mockClasses.map(cls => cls.level).filter(Boolean))]
      setTeacherClassLevels(mockLevels)
    }
  }, [user?.id, user?.role, useDatabase, loadTeacherClassIds])

  // Check database availability on mount (but don't load data)
  useEffect(() => {
    const checkDatabase = async () => {
      if (isSupabaseAvailable() && supabase) {
        try {
          const { error } = await supabase.from("assessments").select("count", { count: "exact", head: true })
          if (!error) {
            console.log("✅ Database connection established for teacher grades - using Supabase")
            setUseDatabase(true)
            // Clear any mock data when database is available
            setAssessments([])
            setGrades([])
            setStudents([])
            setClasses([])
            // Don't auto-load data - components will call load functions explicitly
          } else {
            console.log("⚠️ Database connection failed, will use empty data")
            setUseDatabase(false)
            // Keep arrays empty - don't use mock data
          }
        } catch (err) {
          console.log("⚠️ Database check failed, will use empty data:", err)
          setUseDatabase(false)
          // Keep arrays empty - don't use mock data
        }
      } else {
        console.log("⚠️ Supabase not available, will use empty data")
        setUseDatabase(false)
        // Keep arrays empty - don't use mock data
      }
    }

    checkDatabase()
  }, [])

  // Assessment functions
  const createAssessment = useCallback(async (assessmentData: Omit<Assessment, "id" | "createdAt">) => {
    setLoading(true)
    setError(null)
    try {
      if (useDatabase && supabase) {
        // Validate required fields
        if (!assessmentData.title || !assessmentData.type || !assessmentData.subject || !assessmentData.classId) {
          throw new Error("Missing required fields: title, type, subject, or classId")
        }

        // Validate date format
        const assessmentDate = new Date(assessmentData.date)
        if (isNaN(assessmentDate.getTime())) {
          throw new Error("Invalid date format")
        }

        console.log("Creating assessment with data:", {
          title: assessmentData.title,
          type: assessmentData.type,
          subject: assessmentData.subject,
          class_id: assessmentData.classId,
          total_marks: assessmentData.totalMarks,
          assessment_date: assessmentData.date,
          teacher_id: user?.id,
          status: "draft",
        })

        // Use the database function for creating assessment
        const { data: createdId, error } = await supabase
          .rpc('create_assessment', {
            p_title: assessmentData.title,
            p_type: assessmentData.type,
            p_subject: assessmentData.subject,
            p_class_id: assessmentData.classId,
            p_teacher_id: user?.id, // TODO: Get from auth context
            p_total_marks: assessmentData.totalMarks,
            p_assessment_date: assessmentData.date,
            p_description: null, // Not in current interface
            p_passing_marks: 50.0, // Default value
            p_weight_percentage: 100.0, // Default value
            p_due_date: assessmentData.dueDate || null,
            p_status: "draft"
          })

        if (error) {
          console.error("Supabase error:", error)
          throw error
        }

        console.log("Assessment created successfully:", createdId)

        // Fetch the created assessment to get all details
        const { data: createdAssessment, error: fetchError } = await supabase
          .from("assessments")
          .select("*")
          .eq("id", createdId)
          .single()

        if (fetchError) {
          throw fetchError
        }

        const newAssessment: Assessment = {
          id: createdAssessment.id,
          title: createdAssessment.title,
          type: createdAssessment.type,
          subject: createdAssessment.subject,
          classId: createdAssessment.class_id,
          className: createdAssessment.class_name || createdAssessment.class_id, // Fallback to class_id if class_name not available
          totalMarks: createdAssessment.total_marks,
          date: createdAssessment.assessment_date,
          dueDate: createdAssessment.due_date,
          createdAt: createdAssessment.created_at,
        }
        setAssessments((prev) => [...prev, newAssessment])
      } else {
        // Fallback to mock data
        const newAssessment: Assessment = {
          ...assessmentData,
          id: `assessment-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }
        setAssessments((prev) => [...prev, newAssessment])
      }
    } catch (err) {
      setError("Failed to create assessment")
      console.error("Error creating assessment:", err)
      // Log more detailed error information
      if (err instanceof Error) {
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name
        })
      }
    } finally {
      setLoading(false)
    }
  }, [useDatabase, user?.id])

  const updateAssessment = useCallback(async (id: string, updates: Partial<Assessment>) => {
    setLoading(true)
    setError(null)
    try {
      if (useDatabase && supabase) {
        const { error } = await supabase
          .from("assessments")
          .update({
            title: updates.title,
            type: updates.type,
            subject: updates.subject,
            class_id: updates.classId,
            total_marks: updates.totalMarks,
            assessment_date: updates.date,
          })
          .eq("id", id)

        if (error) {
          console.error("Supabase update error:", error)
          throw error
        }
      }
      
      setAssessments((prev) =>
        prev.map((assessment) => (assessment.id === id ? { ...assessment, ...updates } : assessment)),
      )
    } catch (err) {
      setError("Failed to update assessment")
      console.error("Error updating assessment:", err)
    } finally {
      setLoading(false)
    }
  }, [useDatabase])

  const deleteAssessment = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      if (useDatabase && supabase) {
        const { error } = await supabase.from("assessments").delete().eq("id", id)
        if (error) throw error
      }
      
      setAssessments((prev) => prev.filter((assessment) => assessment.id !== id))
      setGrades((prev) => prev.filter((grade) => grade.assessmentId !== id))
    } catch (err) {
      setError("Failed to delete assessment")
      console.error("Error deleting assessment:", err)
    } finally {
      setLoading(false)
    }
  }, [useDatabase])

  const getAssessmentsByClass = useCallback(
    (classId: string) => {
      return assessments.filter((assessment) => assessment.classId === classId)
    },
    [assessments],
  )

  // Get assessments filtered by teacher's assigned classes
  // Note: loadAssessments() already filters assessments, but this function provides
  // an additional safety check using consistent comparison logic
  // Filters by both class_id and class_level to show assessments created for a level
  const getAssessmentsForTeacher = useCallback(() => {
    // If no class IDs or levels loaded yet, return all assessments
    if (teacherClassIds.length === 0 && teacherClassLevels.length === 0) {
      console.log('getAssessmentsForTeacher: No teacher class IDs/levels, returning all assessments', {
        totalAssessments: assessments.length
      })
      return assessments
    }
    
    // Convert teacher class IDs to strings for consistent comparison
    const teacherClassIdsStr = teacherClassIds.map(id => id.toString().toLowerCase().trim())
    
    // Filter assessments using consistent comparison logic (same as loadAssessments)
    const filtered = assessments.filter((assessment) => {
      // Normalize assessment class_id to string for comparison
      const assessmentClassId = (assessment.classId?.toString() || '').toLowerCase().trim()
      const assessmentClassIdOriginal = assessment.classId?.toString() || ''
      
      // Check if assessment's class_id matches teacher's class IDs
      let matchesClassId = false
      if (teacherClassIdsStr.length > 0 && assessmentClassId) {
        // Direct string comparison (normalized)
        matchesClassId = teacherClassIdsStr.includes(assessmentClassId)
        
        // Also check if any teacher class ID matches when both are normalized
        if (!matchesClassId) {
          matchesClassId = teacherClassIdsStr.some(teacherId => {
            const normalizedTeacherId = teacherId.toLowerCase().trim()
            const normalizedAssessmentId = assessmentClassId.toLowerCase().trim()
            return normalizedTeacherId === normalizedAssessmentId
          })
        }
        
        // Check against original format as well
        if (!matchesClassId && assessmentClassIdOriginal) {
          matchesClassId = teacherClassIds.some(teacherId => {
            const teacherIdStr = teacherId.toString()
            return teacherIdStr === assessmentClassIdOriginal || 
                   teacherIdStr === assessment.classId ||
                   assessmentClassIdOriginal === teacherIdStr
          })
        }
      }
      
      // Check if assessment's class level matches teacher's class levels
      let matchesClassLevel = false
      if (teacherClassLevels.length > 0 && assessment.classLevel) {
        const assessmentLevelLower = assessment.classLevel.toLowerCase().trim()
        matchesClassLevel = teacherClassLevels.some(level => {
          const levelLower = level.toLowerCase().trim()
          return levelLower === assessmentLevelLower ||
                 levelLower.includes(assessmentLevelLower) ||
                 assessmentLevelLower.includes(levelLower)
        })
      }
      
      // Check if assessment's class_id matches teacher's class levels (for assessments with level as class_id)
      let matchesClassIdAsLevel = false
      if (!matchesClassId && !matchesClassLevel && teacherClassLevels.length > 0 && assessmentClassId) {
        const assessmentIdStr = assessmentClassIdOriginal?.toString() || assessmentClassId
        // Check if assessment class_id is not a UUID (might be a level string like "Form 1")
        const isNotUuid = !assessmentIdStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        
        if (isNotUuid) {
          const assessmentIdLower = assessmentIdStr.toLowerCase().trim()
          matchesClassIdAsLevel = teacherClassLevels.some(level => {
            const levelLower = level.toLowerCase().trim()
            return levelLower === assessmentIdLower ||
                   levelLower.includes(assessmentIdLower) ||
                   assessmentIdLower.includes(levelLower) ||
                   // Also check if both contain "form" and same number
                   (levelLower.includes('form') && assessmentIdLower.includes('form') &&
                    levelLower.match(/\d+/)?.[0] === assessmentIdLower.match(/\d+/)?.[0])
          })
        }
      }
      
      return matchesClassId || matchesClassLevel || matchesClassIdAsLevel
    })
    
    console.log('getAssessmentsForTeacher filtering:', {
      totalAssessments: assessments.length,
      filteredAssessments: filtered.length,
      teacherClassIds: teacherClassIdsStr.length,
      teacherClassLevels: teacherClassLevels.length
    })
    
    return filtered
  }, [assessments, teacherClassIds, teacherClassLevels])

  // Utility functions (defined early so they can be used in other callbacks)
  const calculateGrade = useCallback((marks: number, totalMarks: number): string => {
    const percentage = (marks / totalMarks) * 100
    // Convert percentage to Cameroonian scale of 20
    const averageOn20 = (percentage / 100) * 20
    
    if (averageOn20 >= 16) return "A" // 16-20: Excellent
    if (averageOn20 >= 14) return "B" // 14-15.99: Very Good
    if (averageOn20 >= 12) return "C" // 12-13.99: Good
    if (averageOn20 >= 10) return "D" // 10-11.99: Fair
    if (averageOn20 >= 8) return "E"  // 8-9.99: Poor
    return "F" // 0-7.99: Very Poor
  }, [])

  // Grade functions
  const addGrade = useCallback(async (gradeData: Omit<Grade, "id" | "submittedAt">) => {
    setLoading(true)
    setError(null)
    
    // Pre-validation of parameters
    if (!gradeData.assessmentId) {
      const errorMsg = 'Assessment ID is required'
      setError(errorMsg)
      setLoading(false)
      throw new Error(errorMsg)
    }
    
    if (!gradeData.studentId) {
      const errorMsg = 'Student ID is required'
      setError(errorMsg)
      setLoading(false)
      throw new Error(errorMsg)
    }
    
    if (gradeData.marks < 0) {
      const errorMsg = 'Marks cannot be negative'
      setError(errorMsg)
      setLoading(false)
      throw new Error(errorMsg)
    }
    
    if (!user?.id) {
      const errorMsg = 'User ID is required to create grade'
      setError(errorMsg)
      setLoading(false)
      throw new Error(errorMsg)
    }
    
    try {
      if (useDatabase && supabase) {
        // Check if grade already exists to prevent duplicate key errors
        const { data: existingGrade, error: checkError } = await supabase
          .from("grades")
          .select("id, marks_obtained, percentage, grade_letter, remarks")
          .eq("assessment_id", gradeData.assessmentId)
          .eq("student_id", gradeData.studentId)
          .maybeSingle()

        if (checkError && checkError.code !== 'PGRST116') {
          // Log check error but continue (might be table doesn't exist, etc.)
          console.warn("Error checking for existing grade:", serializeSupabaseError(checkError))
        }

        // If grade already exists, update it instead of creating new one
        if (existingGrade) {
          // Get assessment to calculate percentage and grade
          const assessment = assessments.find(a => a.id === gradeData.assessmentId)
          const totalMarks = assessment?.totalMarks || 100
          const percentage = (gradeData.marks / totalMarks) * 100
          const grade = calculateGrade(gradeData.marks, totalMarks)

          const { data: updatedGrade, error: updateError } = await supabase
            .from("grades")
            .update({
              marks_obtained: gradeData.marks,
              percentage: Math.round(percentage * 100) / 100,
              grade_letter: grade,
              remarks: gradeData.remarks || null,
            })
            .eq("id", existingGrade.id)
            .select()
            .single()

          if (updateError) {
            const errorDetails = serializeSupabaseError(updateError)
            const errorMessage = errorDetails.message || 'Failed to update existing grade'
            console.error("Error updating existing grade:", {
              ...errorDetails,
              context: {
                gradeId: existingGrade.id,
                assessmentId: gradeData.assessmentId,
                studentId: gradeData.studentId,
                operation: 'update_existing_grade'
              }
            })
            throw new Error(`Failed to update existing grade: ${errorMessage}`)
          }

          if (updatedGrade) {
            const newGrade: Grade = {
              id: updatedGrade.id,
              assessmentId: updatedGrade.assessment_id,
              studentId: updatedGrade.student_id,
              studentName: updatedGrade.student_name || gradeData.studentId,
              marks: updatedGrade.marks_obtained,
              percentage: updatedGrade.percentage,
              grade: updatedGrade.grade_letter,
              remarks: updatedGrade.remarks,
              submittedAt: updatedGrade.submitted_at,
            }
            // Update the grade in the local state
            setGrades((prev) => prev.map(g => g.id === newGrade.id ? newGrade : g))
            return // Successfully updated, exit early
          }
        }

        // Use the database function for creating grade
        const { data: createdGradeId, error } = await supabase
          .rpc('create_grade', {
            p_assessment_id: gradeData.assessmentId,
            p_student_id: gradeData.studentId,
            p_teacher_id: user.id,
            p_marks_obtained: gradeData.marks,
            p_remarks: gradeData.remarks || null,
            p_feedback: null,
            p_is_late: false,
            p_is_absent: false,
            p_is_excused: false
          })

        if (error) {
          // Extract error information using multiple methods
          let errorDetails: any = {}
          let errorMessage: string = 'Unknown error from create_grade RPC'
          
          // Method 1: Try serialization
          try {
            errorDetails = serializeSupabaseError(error)
            errorMessage = errorDetails.message || errorMessage
          } catch (serializeErr) {
            // Method 2: Direct property access
            try {
              errorMessage = (error as any)?.message || 
                            (error as any)?.details || 
                            (error as any)?.hint ||
                            (error as any)?.error_description ||
                            String(error) || 
                            errorMessage
              
              errorDetails = {
                message: errorMessage,
                code: (error as any)?.code,
                details: (error as any)?.details,
                hint: (error as any)?.hint,
                status: (error as any)?.status,
                type: 'direct_extraction'
              }
            } catch {
              // Method 3: JSON stringify fallback
              try {
                const errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error))
                errorMessage = errorStr !== '{}' ? errorStr : errorMessage
                errorDetails = {
                  message: errorMessage,
                  rawString: errorStr,
                  type: 'json_stringify'
                }
              } catch {
                // Method 4: Final fallback
                errorDetails = {
                  message: errorMessage,
                  rawErrorType: typeof error,
                  rawErrorConstructor: error?.constructor?.name,
                  type: 'fallback'
                }
              }
            }
          }
          
          // Check for duplicate key constraint error
          const isDuplicateError = errorMessage.includes('duplicate key') || 
                                  errorMessage.includes('unique constraint') ||
                                  errorMessage.includes('grades_assessment_student_unique') ||
                                  (errorDetails.code === '23505') // PostgreSQL unique violation code
          
          if (isDuplicateError) {
            // Try to update existing grade instead
            const { data: existingGradeForUpdate } = await supabase
              .from("grades")
              .select("id")
              .eq("assessment_id", gradeData.assessmentId)
              .eq("student_id", gradeData.studentId)
              .maybeSingle()

            if (existingGradeForUpdate) {
              // Update existing grade
              const assessment = assessments.find(a => a.id === gradeData.assessmentId)
              const totalMarks = assessment?.totalMarks || 100
              const percentage = (gradeData.marks / totalMarks) * 100
              const grade = calculateGrade(gradeData.marks, totalMarks)

              const { data: updatedGrade, error: updateError } = await supabase
                .from("grades")
                .update({
                  marks_obtained: gradeData.marks,
                  percentage: Math.round(percentage * 100) / 100,
                  grade_letter: grade,
                  remarks: gradeData.remarks || null,
                })
                .eq("id", existingGradeForUpdate.id)
                .select()
                .single()

              if (!updateError && updatedGrade) {
                const newGrade: Grade = {
                  id: updatedGrade.id,
                  assessmentId: updatedGrade.assessment_id,
                  studentId: updatedGrade.student_id,
                  studentName: updatedGrade.student_name || gradeData.studentId,
                  marks: updatedGrade.marks_obtained,
                  percentage: updatedGrade.percentage,
                  grade: updatedGrade.grade_letter,
                  remarks: updatedGrade.remarks,
                  submittedAt: updatedGrade.submitted_at,
                }
                setGrades((prev) => prev.map(g => g.id === newGrade.id ? newGrade : g))
                return // Successfully updated, exit early
              }
            }
            
            // If update failed, throw user-friendly duplicate error
            throw new Error(`A grade already exists for this student in this assessment. The grade has been updated.`)
          }
          
          // Enhanced error logging with context - log raw error first
          console.error("Raw error object:", {
            error,
            errorType: typeof error,
            errorConstructor: error?.constructor?.name,
            errorKeys: error ? Object.keys(error) : [],
            errorOwnPropertyNames: error ? Object.getOwnPropertyNames(error) : [],
            errorString: String(error),
            errorJSON: (() => {
              try {
                return JSON.stringify(error, Object.getOwnPropertyNames(error))
              } catch {
                return 'Could not stringify'
              }
            })()
          })
          
          const errorContext = {
            ...errorDetails,
            context: {
              assessmentId: gradeData.assessmentId,
              studentId: gradeData.studentId,
              marks: gradeData.marks,
              teacherId: user.id,
              operation: 'create_grade_rpc'
            }
          }
          
          console.error("Error adding grade - RPC call failed:", errorContext)
          throw new Error(`Failed to create grade for student ${gradeData.studentId} in assessment ${gradeData.assessmentId}: ${errorMessage}`)
        }

        if (!createdGradeId) {
          const errorMsg = 'create_grade RPC returned no grade ID'
          console.error("Error adding grade:", errorMsg)
          throw new Error(errorMsg)
        }

        // Fetch the created grade to get all details
        const { data: createdGrade, error: fetchError } = await supabase
          .from("grades")
          .select("*")
          .eq("id", createdGradeId)
          .single()

        if (fetchError) {
          // Serialize error with proper error handling
          let errorDetails: any
          let errorMessage: string
          
          try {
            errorDetails = serializeSupabaseError(fetchError)
            errorMessage = errorDetails.message || 'Unknown error fetching created grade'
          } catch (serializeErr) {
            // Fallback if serialization fails
            errorMessage = fetchError?.message || fetchError?.details || String(fetchError) || 'Unknown error fetching created grade'
            errorDetails = {
              message: errorMessage,
              rawError: fetchError,
              serializationError: serializeErr instanceof Error ? serializeErr.message : String(serializeErr),
              type: 'serialization_failed'
            }
          }
          
          console.error("Error adding grade - Fetch failed:", {
            ...errorDetails,
            context: {
              createdGradeId,
              assessmentId: gradeData.assessmentId,
              studentId: gradeData.studentId,
              operation: 'fetch_created_grade'
            }
          })
          throw new Error(`Failed to fetch created grade (ID: ${createdGradeId}): ${errorMessage}`)
        }

        if (!createdGrade) {
          const errorMsg = `Grade with ID ${createdGradeId} was not found after creation`
          console.error("Error adding grade:", errorMsg)
          throw new Error(errorMsg)
        }

        const newGrade: Grade = {
          id: createdGrade.id,
          assessmentId: createdGrade.assessment_id,
          studentId: createdGrade.student_id,
          studentName: createdGrade.student_name || createdGrade.student_id, // Fallback to student_id if student_name not available
          marks: createdGrade.marks_obtained,
          percentage: createdGrade.percentage,
          grade: createdGrade.grade_letter,
          remarks: createdGrade.remarks,
          submittedAt: createdGrade.submitted_at,
        }
        setGrades((prev) => [...prev, newGrade])
      } else {
        // Fallback to mock data
        const newGrade: Grade = {
          ...gradeData,
          id: `grade-${Date.now()}`,
          submittedAt: new Date().toISOString(),
        }
        setGrades((prev) => [...prev, newGrade])
      }
    } catch (err) {
      // Serialize error with proper error handling
      let errorDetails: any
      let errorMessage: string
      
      try {
        errorDetails = serializeSupabaseError(err)
        errorMessage = errorDetails.message || 'Failed to add grade'
      } catch (serializeErr) {
        // Fallback if serialization fails
        if (err instanceof Error) {
          errorMessage = err.message || 'Failed to add grade'
        } else if (typeof err === 'string') {
          errorMessage = err
        } else {
          errorMessage = 'Failed to add grade'
        }
        
        errorDetails = {
          message: errorMessage,
          rawError: err,
          serializationError: serializeErr instanceof Error ? serializeErr.message : String(serializeErr),
          type: 'serialization_failed'
        }
      }
      
      setError(errorMessage)
      
      // Enhanced error logging with context
      const errorInfo = {
        ...errorDetails,
        context: {
          assessmentId: gradeData.assessmentId,
          studentId: gradeData.studentId,
          marks: gradeData.marks,
          teacherId: user?.id,
          operation: 'add_grade'
        }
      }
      console.error("Error adding grade:", errorInfo)
      
      // Re-throw the error so calling code can handle it
      throw err
    } finally {
      setLoading(false)
    }
  }, [useDatabase, user?.id, supabase, assessments, calculateGrade])

  const updateGrade = useCallback(async (id: string, updates: Partial<Grade>) => {
    setLoading(true)
    setError(null)
    try {
      if (useDatabase && supabase) {
        const { error } = await supabase
          .from("grades")
          .update({
            marks_obtained: updates.marks,
            percentage: updates.percentage,
            grade_letter: updates.grade,
            remarks: updates.remarks,
          })
          .eq("id", id)

        if (error) throw error
      }
      
      setGrades((prev) => prev.map((grade) => (grade.id === id ? { ...grade, ...updates } : grade)))
    } catch (err) {
      setError("Failed to update grade")
      console.error("Error updating grade:", err)
    } finally {
      setLoading(false)
    }
  }, [useDatabase])

  const deleteGrade = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      if (useDatabase && supabase) {
        const { error } = await supabase.from("grades").delete().eq("id", id)
        if (error) throw error
      }
      
      setGrades((prev) => prev.filter((grade) => grade.id !== id))
    } catch (err) {
      setError("Failed to delete grade")
      console.error("Error deleting grade:", err)
    } finally {
      setLoading(false)
    }
  }, [useDatabase])

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
      if (!classId) return []
      // Convert both to strings for comparison to handle UUID and VARCHAR types
      const normalizedClassId = classId.toString().trim()
      return students.filter((student) => {
        const studentClassId = (student.classId || "").toString().trim()
        return studentClassId === normalizedClassId && studentClassId !== ""
      })
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

  // Teacher functions
  const getTeacherSubjects = useCallback(() => {
    return teacherSubjects
  }, [teacherSubjects])


  const calculateAverageOn20 = useCallback((marks: number, totalMarks: number): number => {
    const percentage = (marks / totalMarks) * 100
    return Math.round((percentage / 100) * 20 * 100) / 100 // Round to 2 decimal places
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

  // Filter assessments by teacher's classes for the context value
  // This ensures components always get filtered assessments
  // Filters by both class_id and class_level to show assessments created for a level
  const filteredAssessments = useMemo(() => {
    if (teacherClassIds.length === 0 && teacherClassLevels.length === 0) {
      return assessments // Return all if no class IDs or levels loaded yet
    }
    
    return assessments.filter((assessment) => {
      // Check if assessment's class_id matches teacher's class IDs
      const matchesClassId = teacherClassIds.length > 0 && teacherClassIds.includes(assessment.classId)
      
      // Check if assessment's class level matches teacher's class levels
      const matchesClassLevel = teacherClassLevels.length > 0 && 
        assessment.classLevel && 
        teacherClassLevels.includes(assessment.classLevel)
      
      return matchesClassId || matchesClassLevel
    })
  }, [assessments, teacherClassIds, teacherClassLevels])

  const contextValue = useMemo(
    () => ({
      // State - use filtered assessments
      assessments: filteredAssessments,
      grades,
      students,
      classes,
      teacherSubjects,
      loading,
      loadingAssessments,
      loadingGrades,
      loadingStudents,
      loadingClasses,
      loadingSubjects,
      error,

      // Data loading functions (lazy loading)
      loadAssessments,
      loadGrades,
      loadStudents,
      loadClasses,
      loadTeacherSubjects,
      loadAllData,

      // Assessment functions
      createAssessment,
      updateAssessment,
      deleteAssessment,
      getAssessmentsByClass,
      getAssessmentsForTeacher,

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

      // Teacher functions
      getTeacherSubjects,

      // Utility functions
      calculateGrade,
      calculateAverageOn20,
      getGradeColor,
    }),
    [
      filteredAssessments,
      grades,
      students,
      classes,
      teacherSubjects,
      loading,
      loadingAssessments,
      loadingGrades,
      loadingStudents,
      loadingClasses,
      loadingSubjects,
      error,
      loadAssessments,
      loadGrades,
      loadStudents,
      loadClasses,
      loadTeacherSubjects,
      loadAllData,
      createAssessment,
      updateAssessment,
      deleteAssessment,
      getAssessmentsByClass,
      getAssessmentsForTeacher,
      addGrade,
      updateGrade,
      deleteGrade,
      getGradesByAssessment,
      getGradesByStudent,
      getStudentGrades,
      getStudentsByClass,
      getStudentStats,
      getTeacherClasses,
      getTeacherSubjects,
      calculateGrade,
      getGradeColor,
    ],
  )

  return <TeacherGradesContext.Provider value={contextValue}>{children}</TeacherGradesContext.Provider>
}
