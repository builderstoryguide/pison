"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { supabase, testConnection } from "./supabase"
import { activityLogger } from "./activity-logger"

export interface ClassSubject {
  subjectId: string
  subjectName: string
  isTradeSubject: boolean
}

export interface ClassData {
  id: string
  name: string
  level: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  capacity: number
  currentEnrollment: number
  classTeacher: string
  subjects: ClassSubject[]
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
  subjects: ClassSubject[]
  academicYear: string
}

interface PaginationOptions {
  page: number
  pageSize: number
  filters?: {
    searchTerm?: string
    subsystem?: string
    branch?: string
    status?: string
  }
}

interface PaginatedClassesResult {
  classes: ClassData[]
  totalCount: number
  totalPages: number
  currentPage: number
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
  updateClassSchedule: (classId: string, schedule: ClassData['schedule']) => Promise<{ success: boolean; error?: string }>
  refreshClasses: () => Promise<void>
  testDatabaseConnection: () => Promise<boolean>
  getClassesPaginated: (options: PaginationOptions) => Promise<PaginatedClassesResult>
  totalClassesCount: number
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
    subjects: [
      { subjectId: "SUB001", subjectName: "Mathematics", isTradeSubject: false },
      { subjectId: "SUB002", subjectName: "English Language", isTradeSubject: false },
      { subjectId: "SUB003", subjectName: "Biology", isTradeSubject: false },
      { subjectId: "SUB004", subjectName: "Chemistry", isTradeSubject: false },
      { subjectId: "SUB005", subjectName: "Physics", isTradeSubject: false },
      { subjectId: "SUB006", subjectName: "History", isTradeSubject: false },
      { subjectId: "SUB007", subjectName: "Geography", isTradeSubject: false },
    ],
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
    subjects: [
      { subjectId: "SUB001", subjectName: "Mathematics", isTradeSubject: false },
      { subjectId: "SUB002", subjectName: "English Language", isTradeSubject: false },
      { subjectId: "SUB008", subjectName: "Technical Drawing", isTradeSubject: true },
      { subjectId: "SUB009", subjectName: "Workshop Practice", isTradeSubject: true },
      { subjectId: "SUB005", subjectName: "Physics", isTradeSubject: false },
    ],
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
    subjects: [
      { subjectId: "SUB010", subjectName: "Advanced Mathematics", isTradeSubject: false },
      { subjectId: "SUB005", subjectName: "Physics", isTradeSubject: true },
      { subjectId: "SUB004", subjectName: "Chemistry", isTradeSubject: true },
      { subjectId: "SUB003", subjectName: "Biology", isTradeSubject: true },
      { subjectId: "SUB002", subjectName: "English Language", isTradeSubject: false },
    ],
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
    subjects: [
      { subjectId: "SUB011", subjectName: "Mathématiques", isTradeSubject: true },
      { subjectId: "SUB012", subjectName: "Physique", isTradeSubject: true },
      { subjectId: "SUB013", subjectName: "Chimie", isTradeSubject: true },
      { subjectId: "SUB014", subjectName: "Français", isTradeSubject: false },
      { subjectId: "SUB015", subjectName: "Philosophie", isTradeSubject: false },
    ],
    schedule: [],
    academicYear: "2024/2025",
    status: "active",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
]

// Cache structure for storing paginated class results
interface ClassCache {
  timestamp: number;
  data: {
    [key: string]: {
      classes: ClassData[];
      totalCount: number;
      totalPages: number;
    };
  };
}

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export function ClassManagementProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUsingDatabase, setIsUsingDatabase] = useState(false)
  const [totalClassesCount, setTotalClassesCount] = useState(0)
  
  // Cache for paginated class results
  const [classCache, setClassCache] = useState<ClassCache>({
    timestamp: Date.now(),
    data: {}
  })
  
  // Function to invalidate the cache
  const invalidateCache = useCallback(() => {
    setClassCache({
      timestamp: 0, // Setting timestamp to 0 invalidates all cache entries
      data: {}
    })
  }, [])

  const testDatabaseConnection = async (): Promise<boolean> => {
    const connected = await testConnection()
    setIsUsingDatabase(connected)
    return connected
  }

  const loadClasses = useCallback(async () => {
    if (!supabase) {
      setError("Supabase client not available")
      setClasses([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Try v_classes view first, fallback to classes table if view doesn't exist
      let { data, error: fetchError } = await supabase
        .from("v_classes")
        .select(`
          id,
          class_name,
          class_level,
          subsystem,
          stream,
          capacity,
          current_enrollment,
          class_teacher_id,
          academic_year,
          status,
          created_at,
          updated_at,
          teacher_first_name,
          teacher_last_name
        `)
        .order("created_at", { ascending: false })

      // If view doesn't exist, fallback to base table without nested select
      if (fetchError && fetchError.code === '42P01') {
        const { serializeSupabaseError } = await import('./safe-error')
        console.warn('v_classes view not found, falling back to classes table:', serializeSupabaseError(fetchError))
        const fallbackQuery = await supabase
          .from("classes")
          .select(`
            id,
            name,
            level,
            subsystem,
            section,
            student_count,
            class_teacher_id,
            created_at,
            updated_at
          `)
          .order("created_at", { ascending: false })
        
        if (fallbackQuery.error) {
          const errDetails = await import('./safe-error').then(m => m.serializeSupabaseError(fallbackQuery.error))
          console.error("Database error details:", errDetails)
          setError(`Failed to load classes: ${fallbackQuery.error.message || 'Unknown error'}`)
          setClasses([])
          setIsLoading(false)
          return
        }
        
        data = fallbackQuery.data?.map((cls: any) => ({
          id: cls.id,
          class_name: cls.name,
          class_level: cls.level,
          subsystem: cls.subsystem,
          stream: cls.section || '',
          capacity: 0,
          current_enrollment: cls.student_count || 0,
          class_teacher_id: cls.class_teacher_id,
          academic_year: null,
          status: 'active',
          created_at: cls.created_at,
          updated_at: cls.updated_at,
          teacher_first_name: null,
          teacher_last_name: null,
        })) || []
      } else if (fetchError) {
        const { serializeSupabaseError } = await import('./safe-error')
        const errDetails = serializeSupabaseError(fetchError)
        console.error("Database error details:", errDetails)
        setError(`Failed to load classes: ${fetchError.message || 'Unknown error'}`)
        setClasses([])
        setIsLoading(false)
        return
      }

      // Transform database data to match our interface
      const transformedClasses: ClassData[] = (data || []).map((dbClass: any) => ({
        id: dbClass.id,
        name: dbClass.class_name,
        level: dbClass.class_level,
        subsystem: dbClass.subsystem,
        branch: dbClass.stream || "grammar", // Default to grammar if stream is not set
        capacity: dbClass.capacity,
        currentEnrollment: dbClass.current_enrollment,
        classTeacher: (dbClass.teacher_first_name && dbClass.teacher_last_name)
          ? `${dbClass.teacher_first_name} ${dbClass.teacher_last_name}`
          : (dbClass.class_teacher_id ? "Teacher ID: " + dbClass.class_teacher_id : "Not Assigned"),
        subjects: [], // Will be populated in batch below
        schedule: [], // We'll need to implement schedule management later
        academicYear: dbClass.academic_year,
        status: dbClass.status,
        createdAt: dbClass.created_at,
        updatedAt: dbClass.updated_at,
      }))

      // Early exit if no classes found
      if (transformedClasses.length === 0) {
        setClasses([])
        setIsLoading(false)
        return
      }

      // Batch fetch all subjects for all classes in a single query with subject details
      const classIds = transformedClasses.map(cls => cls.id)
      const academicYears = [...new Set(transformedClasses.map(cls => cls.academicYear).filter(Boolean))]
      
      try {
        // Build query to get class subjects with subject details
        let subjectsQuery = supabase
          .from("class_subjects")
          .select(`
            class_id,
            subject_id,
            is_trade_subject,
            academic_year,
            subjects!inner(id, name)
          `)
          .in("class_id", classIds)
        
        // Only filter by academic year if we have academic years
        if (academicYears.length > 0) {
          subjectsQuery = subjectsQuery.in("academic_year", academicYears)
        }

        const { data: allSubjectsData, error: subjectsError } = await subjectsQuery

        if (subjectsError) {
          console.warn("Warning: Failed to load subjects for classes:", subjectsError.message)
        } else if (allSubjectsData) {
          // Create a map of classId -> subject objects for quick lookup
          const subjectsByClassId: Record<string, ClassSubject[]> = {}
          
          allSubjectsData.forEach((item: any) => {
            if (!subjectsByClassId[item.class_id]) {
              subjectsByClassId[item.class_id] = []
            }
            // Use subject name from joined subjects table, fallback to subject_name if available
            const subjectName = item.subjects?.name || item.subject_name || 'Unknown Subject'
            subjectsByClassId[item.class_id].push({
              subjectId: item.subject_id,
              subjectName: subjectName,
              isTradeSubject: item.is_trade_subject || false
            })
          })
          
          // Assign subjects to each class
          transformedClasses.forEach(classData => {
            classData.subjects = subjectsByClassId[classData.id] || []
          })
        }
      } catch (err) {
        console.warn("Warning: Failed to batch load subjects:", err)
        // Continue with empty subjects arrays rather than failing completely
      }

      setClasses(transformedClasses)
      console.log("Loaded classes from database:", transformedClasses.length)
    } catch (err) {
      try {
        const { serializeSupabaseError } = await import('./safe-error')
        const errDetails = serializeSupabaseError(err as any)
        console.error("Error loading classes:", errDetails)
        setError(err instanceof Error ? err.message : "Failed to load classes")
      } catch (_) {
        console.error("Error loading classes:", err)
        setError(err instanceof Error ? err.message : "Failed to load classes")
      }
      // Don't fallback to mock data - require database connection
      setClasses([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Test database connection and load classes on mount
  useEffect(() => {
    const initializeData = async () => {
      const dbConnected = await testDatabaseConnection()
      setIsUsingDatabase(dbConnected)
      
      if (dbConnected) {
        await loadClasses()
      } else {
        // Don't fallback to mock data - require database connection
        setClasses([])
        setError("Database connection is required for class management. Please check your database configuration.")
      }
    }

    initializeData()
  }, [loadClasses])

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

        // Get the actual teacher UUID if a teacher is assigned
        let teacherUuid = null
        if (classData.classTeacher && classData.classTeacher !== "__global__") {
          const { data: teacherData, error: teacherError } = await supabase
            .from("teachers")
            .select("id")
            .eq("teacher_id", classData.classTeacher)
            .single()

          if (teacherError) {
            console.warn("Warning: Failed to find teacher:", teacherError.message)
          } else if (teacherData) {
            teacherUuid = teacherData.id
          }
        }

        // Insert class into database
        // Populate both old and new columns for backward compatibility during migration
        const { data: newClass, error: insertError } = await supabase
          .from("classes")
          .insert({
            // New columns (preferred)
            class_name: classData.name,
            class_level: classData.level,
            stream: classData.branch,
            // Old columns (for backward compatibility - name has NOT NULL constraint)
            name: classData.name,
            level: classData.level,
            section: classData.branch,
            // Common columns
            subsystem: classData.subsystem,
            academic_year: classData.academicYear,
            capacity: classData.capacity,
            current_enrollment: 0,
            student_count: 0, // Keep old column in sync
            class_teacher_id: teacherUuid,
            status: "active",
          })
          .select()
          .single()

        if (insertError) {
          throw new Error(`Failed to create class: ${insertError.message}`)
        }

        // Insert subjects for this class
        if (classData.subjects && classData.subjects.length > 0) {
          const subjectRecords = classData.subjects.map(subject => ({
            class_id: newClass.id,
            subject_id: subject.subjectId,
            is_trade_subject: subject.isTradeSubject || false,
            academic_year: classData.academicYear,
            subject_name: subject.subjectName // Keep for backward compatibility during migration
          }))

          const { error: subjectsError } = await supabase
            .from("class_subjects")
            .insert(subjectRecords)

          if (subjectsError) {
            console.warn("Warning: Failed to save subjects for class:", subjectsError.message)
            // Don't fail the entire operation if subjects fail to save
          }
        }

        // Get teacher name if a teacher is assigned
        let teacherName = "Not Assigned"
        if (newClass.class_teacher_id) {
          try {
            const { data: teacherData } = await supabase
              .from("teachers")
              .select("first_name, last_name")
              .eq("id", newClass.class_teacher_id)
              .single()
            
            if (teacherData && teacherData.first_name && teacherData.last_name) {
              teacherName = `${teacherData.first_name} ${teacherData.last_name}`
            }
          } catch (err) {
            console.warn("Warning: Failed to fetch teacher name for new class:", err)
            teacherName = "Teacher ID: " + newClass.class_teacher_id
          }
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
          classTeacher: teacherName,
          subjects: classData.subjects,
          schedule: [],
          academicYear: newClass.academic_year,
          status: newClass.status,
          createdAt: newClass.created_at,
          updatedAt: newClass.updated_at,
        }

        setClasses((prev) => [transformedClass, ...prev])
        
        // Log the activity
        activityLogger.logActivity('CLASS_CREATED', `Created new class ${classData.name} with capacity ${classData.capacity}`)
        
        // Invalidate cache since data has changed
        invalidateCache()
        
        setIsLoading(false)
        return { success: true, classId: newClass.id }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create class"
        setError(errorMessage)
        setIsLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [invalidateCache],
  )

  const updateClass = useCallback(
    async (classId: string, classData: Partial<ClassFormData>): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true)
      setError(null)

      try {
        if (!supabase) {
          throw new Error("Database connection is required for class management")
        }

        // Get the actual teacher UUID if a teacher is being updated
        let teacherUuid = undefined
        if (classData.classTeacher && classData.classTeacher !== "__global__") {
          const { data: teacherData, error: teacherError } = await supabase
            .from("teachers")
            .select("id")
            .eq("teacher_id", classData.classTeacher)
            .single()

          if (teacherError) {
            console.warn("Warning: Failed to find teacher for update:", teacherError.message)
          } else if (teacherData) {
            teacherUuid = teacherData.id
          }
        }

        // Update both old and new columns for backward compatibility during migration
        const updateData: any = {}
        if (classData.name) {
          updateData.class_name = classData.name
          updateData.name = classData.name // Keep old column in sync
        }
        if (classData.level) {
          updateData.class_level = classData.level
          updateData.level = classData.level // Keep old column in sync
        }
        if (classData.branch) {
          updateData.stream = classData.branch
          updateData.section = classData.branch // Keep old column in sync
        }
        if (classData.subsystem) updateData.subsystem = classData.subsystem
        if (classData.academicYear) updateData.academic_year = classData.academicYear
        if (classData.capacity) updateData.capacity = classData.capacity
        if (teacherUuid !== undefined) updateData.class_teacher_id = teacherUuid
        updateData.updated_at = new Date().toISOString()

        const { error: updateError } = await supabase
          .from("classes")
          .update(updateData)
          .eq("id", classId)

        if (updateError) {
          throw new Error(`Failed to update class: ${updateError.message}`)
        }

        // Update subjects if provided
        if (classData.subjects) {
          // First, delete existing subjects for this class
          const { error: deleteSubjectsError } = await supabase
            .from("class_subjects")
            .delete()
            .eq("class_id", classId)

          if (deleteSubjectsError) {
            console.warn("Warning: Failed to delete existing subjects:", deleteSubjectsError.message)
          }

          // Then, insert new subjects
          if (classData.subjects.length > 0) {
            // Get the current academic year if not provided
            let academicYear = classData.academicYear
            if (!academicYear && supabase) {
              const { data: currentClass } = await supabase
                .from("classes")
                .select("academic_year")
                .eq("id", classId)
                .single()
              academicYear = currentClass?.academic_year
            }

            if (academicYear) {
              const subjectRecords = classData.subjects.map(subject => ({
                class_id: classId,
                subject_id: subject.subjectId,
                is_trade_subject: subject.isTradeSubject || false,
                academic_year: academicYear,
                subject_name: subject.subjectName // Keep for backward compatibility during migration
              }))

              const { error: subjectsError } = await supabase
                .from("class_subjects")
                .insert(subjectRecords)

              if (subjectsError) {
                console.warn("Warning: Failed to update subjects for class:", subjectsError.message)
              }
            }
          }
        }

        // Get updated teacher name if teacher was changed
        let updatedTeacherName = undefined
        if (teacherUuid !== undefined) {
          try {
            const { data: teacherData } = await supabase
              .from("teachers")
              .select("first_name, last_name")
              .eq("id", teacherUuid)
              .single()
            
            if (teacherData && teacherData.first_name && teacherData.last_name) {
              updatedTeacherName = `${teacherData.first_name} ${teacherData.last_name}`
            }
          } catch (err) {
            console.warn("Warning: Failed to fetch updated teacher name:", err)
            updatedTeacherName = "Teacher ID: " + teacherUuid
          }
        }

        setClasses((prev) =>
          prev.map((cls) =>
            cls.id === classId
              ? {
                  ...cls,
                  ...classData,
                  classTeacher: updatedTeacherName || cls.classTeacher,
                  updatedAt: new Date().toISOString().split("T")[0],
                }
              : cls,
          ),
        )
        
        // Invalidate cache since data has changed
        invalidateCache()

        setIsLoading(false)
        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update class"
        setError(errorMessage)
        setIsLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [invalidateCache],
  )

  const deleteClass = useCallback(async (classId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      if (!supabase) {
        throw new Error("Database connection is required for class management")
      }

              // First, delete associated subjects
        const { error: deleteSubjectsError } = await supabase
          .from("class_subjects")
          .delete()
          .eq("class_id", classId)

        if (deleteSubjectsError) {
          console.warn("Warning: Failed to delete class subjects:", deleteSubjectsError.message)
        }

        // Then delete the class
        const { error: deleteError } = await supabase
          .from("classes")
          .delete()
          .eq("id", classId)

        if (deleteError) {
          throw new Error(`Failed to delete class: ${deleteError.message}`)
        }

      setClasses((prev) => prev.filter((cls) => cls.id !== classId))
      
      // Invalidate cache since data has changed
      invalidateCache()
      
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

        // First, check if student is already assigned to a different class
        const { data: currentStudent, error: studentFetchError } = await supabase
          .from("students")
          .select("class")
          .eq("id", studentId)
          .single()

        if (studentFetchError) {
          throw new Error(`Failed to fetch student data: ${studentFetchError.message}`)
        }

        const previousClassId = currentStudent?.class

        // Update student's class assignment
        // Handle potential type mismatch between classId (UUID) and students.class (VARCHAR)
        const { error: studentUpdateError } = await supabase
          .from("students")
          .update({ class: classId.toString() })
          .eq("id", studentId)

        if (studentUpdateError) {
          throw new Error(`Failed to assign student to class: ${studentUpdateError.message}`)
        }

        // If student was previously in a different class, decrement that class enrollment
        if (previousClassId && previousClassId !== classId.toString()) {
          const { data: prevClass, error: prevFetchError } = await supabase
            .from("classes")
            .select("current_enrollment")
            .eq("id", previousClassId)
            .single()

          if (!prevFetchError && prevClass) {
            const prevEnrollment = Math.max(0, (prevClass.current_enrollment || 0) - 1)
            await supabase
              .from("classes")
              .update({ 
                current_enrollment: prevEnrollment,
                student_count: prevEnrollment,
                updated_at: new Date().toISOString()
              })
              .eq("id", previousClassId)

            // Update local state for previous class
            setClasses((prev) =>
              prev.map((cls) =>
                cls.id === previousClassId
                  ? {
                      ...cls,
                      currentEnrollment: Math.max(0, cls.currentEnrollment - 1),
                      updatedAt: new Date().toISOString().split("T")[0],
                    }
                  : cls,
              ),
            )
          }
        }

        // Update new class enrollment count
        const { data: currentClass, error: fetchError } = await supabase
          .from("classes")
          .select("current_enrollment")
          .eq("id", classId)
          .single()

        if (fetchError) {
          throw new Error(`Failed to fetch current enrollment: ${fetchError.message}`)
        }

        // Only increment if student wasn't already in this class
        const shouldIncrement = !previousClassId || previousClassId !== classId.toString()
        const newEnrollment = shouldIncrement 
          ? (currentClass.current_enrollment || 0) + 1
          : (currentClass.current_enrollment || 0)

        const { error: classUpdateError } = await supabase
          .from("classes")
          .update({ 
            current_enrollment: newEnrollment,
            student_count: newEnrollment, // Keep old column in sync
            updated_at: new Date().toISOString()
          })
          .eq("id", classId)

        if (classUpdateError) {
          throw new Error(`Failed to update class enrollment: ${classUpdateError.message}`)
        }

        // Update local state for new class
        setClasses((prev) =>
          prev.map((cls) =>
            cls.id === classId
              ? {
                  ...cls,
                  currentEnrollment: shouldIncrement ? cls.currentEnrollment + 1 : cls.currentEnrollment,
                  updatedAt: new Date().toISOString().split("T")[0],
                }
              : cls,
          ),
        )
        
        // Invalidate cache since enrollment data has changed
        invalidateCache()

        setIsLoading(false)
        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to assign student to class"
        setError(errorMessage)
        setIsLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [invalidateCache],
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

        const newEnrollment = Math.max(0, (currentClass.current_enrollment || 0) - 1)
        const { error: classUpdateError } = await supabase
          .from("classes")
          .update({ 
            current_enrollment: newEnrollment,
            student_count: newEnrollment, // Keep old column in sync
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
        
        // Invalidate cache since enrollment data has changed
        invalidateCache()

        setIsLoading(false)
        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to remove student from class"
        setError(errorMessage)
        setIsLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [invalidateCache],
  )

  const getClassStudents = useCallback(async (classId: string): Promise<any[]> => {
    if (!supabase) {
    return []
    }

    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("class", classId.toString())

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

  const updateClassSchedule = useCallback(async (classId: string, schedule: ClassData['schedule']): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      if (isUsingDatabase && supabase) {
        const { error } = await supabase
          .from("classes")
          .update({ 
            schedule: schedule,
            updated_at: new Date().toISOString()
          })
          .eq("id", classId)

        if (error) {
          throw new Error(`Failed to update class schedule: ${error.message}`)
        }
      }

      // Update local state
      setClasses((prev) =>
        prev.map((cls) =>
          cls.id === classId
            ? {
                ...cls,
                schedule: schedule,
                updatedAt: new Date().toISOString().split("T")[0],
              }
            : cls,
        ),
      )

      setIsLoading(false)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update class schedule"
      setError(errorMessage)
      setIsLoading(false)
      return { success: false, error: errorMessage }
    }
  }, [isUsingDatabase])

  const refreshClasses = useCallback(async (): Promise<void> => {
    if (isUsingDatabase) {
      // Invalidate cache before reloading
      invalidateCache()
      await loadClasses()
    }
  }, [isUsingDatabase, invalidateCache, loadClasses])
  
  const getClassesPaginated = useCallback(async (options: PaginationOptions): Promise<PaginatedClassesResult> => {
    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    // Create a cache key based on the options
    const cacheKey = JSON.stringify(options)
    
    // Check if we have a valid cached result
    const now = Date.now()
    const isCacheValid = classCache.timestamp > now - CACHE_EXPIRATION
    const cachedResult = classCache.data[cacheKey]
    
    if (isCacheValid && cachedResult) {
      return {
        classes: cachedResult.classes,
        totalCount: cachedResult.totalCount,
        totalPages: cachedResult.totalPages,
        currentPage: options.page
      }
    }
    
    setIsLoading(true)
    setError(null)

    try {
      const { page, pageSize, filters } = options
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      // Build query with filters
      let query = supabase
        .from("v_classes")
        .select(`
          id,
          class_name,
          class_level,
          subsystem,
          stream,
          capacity,
          current_enrollment,
          class_teacher_id,
          academic_year,
          status,
          created_at,
          updated_at,
          teacher_first_name,
          teacher_last_name
        `, { count: 'exact' })
        .order("created_at", { ascending: false })
      
      // Apply filters if provided
      if (filters) {
        if (filters.subsystem && filters.subsystem !== 'all') {
          query = query.eq('subsystem', filters.subsystem)
        }
        
        if (filters.branch && filters.branch !== 'all') {
          query = query.eq('stream', filters.branch)
        }
        
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status)
        }
        
        if (filters.searchTerm) {
          // Search in class name, level, or teacher name
          query = query.or(`class_name.ilike.%${filters.searchTerm}%,class_level.ilike.%${filters.searchTerm}%`)
        }
      }
      
      // Apply pagination
      query = query.range(from, to)
      
      // Execute query
      const { data, error: fetchError, count } = await query
      
      if (fetchError) {
        console.error("Database error details:", fetchError)
        throw new Error(`Failed to load classes: ${fetchError.message || 'Unknown error'}`)
      }
      
      // Update total count
      if (count !== null) {
        setTotalClassesCount(count)
      }
      
      // Transform database data to match our interface
      const transformedClasses: ClassData[] = (data || []).map((dbClass) => ({
        id: dbClass.id,
        name: dbClass.class_name,
        level: dbClass.class_level,
        subsystem: dbClass.subsystem,
        branch: dbClass.stream || "grammar",
        capacity: dbClass.capacity,
        currentEnrollment: dbClass.current_enrollment,
        classTeacher: (dbClass.teacher_first_name && dbClass.teacher_last_name)
          ? `${dbClass.teacher_first_name} ${dbClass.teacher_last_name}`
          : (dbClass.class_teacher_id ? "Teacher ID: " + dbClass.class_teacher_id : "Not Assigned"),
        subjects: [], // Will be populated in batch below
        schedule: [],
        academicYear: dbClass.academic_year,
        status: dbClass.status,
        createdAt: dbClass.created_at,
        updatedAt: dbClass.updated_at,
      }))

      // Early exit if no classes found
      if (transformedClasses.length === 0) {
        setIsLoading(false)
        return {
          classes: [],
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
          currentPage: page
        }
      }

      // Batch fetch all subjects for the paginated classes with subject details
      const classIds = transformedClasses.map(cls => cls.id)
      const academicYears = [...new Set(transformedClasses.map(cls => cls.academicYear).filter(Boolean))]
      
      try {
        // Build query to get class subjects with subject details
        let subjectsQuery = supabase
          .from("class_subjects")
          .select(`
            class_id,
            subject_id,
            is_trade_subject,
            academic_year,
            subjects!inner(id, name)
          `)
          .in("class_id", classIds)
        
        // Only filter by academic year if we have academic years
        if (academicYears.length > 0) {
          subjectsQuery = subjectsQuery.in("academic_year", academicYears)
        }

        const { data: allSubjectsData, error: subjectsError } = await subjectsQuery

        if (subjectsError) {
          console.warn("Warning: Failed to load subjects for classes:", subjectsError.message)
        } else if (allSubjectsData) {
          // Create a map of classId -> subject objects for quick lookup
          const subjectsByClassId: Record<string, ClassSubject[]> = {}
          
          allSubjectsData.forEach((item: any) => {
            if (!subjectsByClassId[item.class_id]) {
              subjectsByClassId[item.class_id] = []
            }
            // Use subject name from joined subjects table, fallback to subject_name if available
            const subjectName = item.subjects?.name || item.subject_name || 'Unknown Subject'
            subjectsByClassId[item.class_id].push({
              subjectId: item.subject_id,
              subjectName: subjectName,
              isTradeSubject: item.is_trade_subject || false
            })
          })
          
          // Assign subjects to each class
          transformedClasses.forEach(classData => {
            classData.subjects = subjectsByClassId[classData.id] || []
          })
          
          // Verification logging (can be removed after confirming data accuracy)
          console.log('[Class Management] Loaded classes with data:', {
            totalClasses: transformedClasses.length,
            sampleClass: transformedClasses[0] ? {
              name: transformedClasses[0].name,
              enrollment: `${transformedClasses[0].currentEnrollment}/${transformedClasses[0].capacity}`,
              teacher: transformedClasses[0].classTeacher,
              subjectCount: transformedClasses[0].subjects.length
            } : null
          })
        }
      } catch (err) {
        console.warn("Warning: Failed to batch load subjects:", err)
        // Continue with empty subjects arrays rather than failing completely
      }

      // Store the result in cache
      const result = {
        classes: transformedClasses,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page
      }
      
      // Update the cache
      setClassCache(prevCache => ({
        timestamp: Date.now(),
        data: {
          ...prevCache.data,
          [cacheKey]: {
            classes: transformedClasses,
            totalCount: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize)
          }
        }
      }))
      
      setIsLoading(false)
      return result
    } catch (err) {
      console.error("Error loading paginated classes:", err)
      setError(err instanceof Error ? err.message : "Failed to load classes")
      setIsLoading(false)
      return {
        classes: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: options.page
      }
    }
  }, [])

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
    updateClassSchedule,
    refreshClasses,
    testDatabaseConnection,
    getClassesPaginated,
    totalClassesCount,
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
