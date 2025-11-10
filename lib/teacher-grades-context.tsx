"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react"
import { supabase, isSupabaseAvailable } from "./supabase"
import { useAuth } from "@/lib/auth-context"
import { validateDatabaseSetup, createDatabaseSetupErrorResponse } from "./database-validation"

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

  const [assessments, setAssessments] = useState<Assessment[]>(mockAssessments)
  const [grades, setGrades] = useState<Grade[]>(mockGrades)
  const [students, setStudents] = useState<Student[]>(mockStudents)
  const [classes, setClasses] = useState<TeacherClass[]>(mockClasses)
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useDatabase, setUseDatabase] = useState(false)
  const [dataLoaded, setDataLoaded] = useState({
    assessments: false,
    grades: false,
    students: false,
    classes: false,
    subjects: false,
  })

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

  // Individual load functions for lazy loading
  const loadAssessments = useCallback(async () => {
    if (!useDatabase || !supabase || dataLoaded.assessments) return

    setLoadingAssessments(true)
    try {
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from("assessments")
        .select("*")
        .order("created_at", { ascending: false })

      if (!assessmentsError && assessmentsData) {
        const formattedAssessments: Assessment[] = assessmentsData.map((assessment: any) => ({
          id: assessment.id,
          title: assessment.title,
          type: assessment.type,
          subject: assessment.subject,
          classId: assessment.class_id,
          className: assessment.class_name || "",
          totalMarks: assessment.total_marks,
          date: assessment.assessment_date,
          dueDate: assessment.due_date,
          createdAt: assessment.created_at,
        }))
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
  }, [useDatabase, dataLoaded.assessments])

  const loadGrades = useCallback(async () => {
    if (!useDatabase || !supabase || dataLoaded.grades) return

    setLoadingGrades(true)
    try {
      const { data: gradesData, error: gradesError } = await supabase
        .from("grades")
        .select("*")
        .order("submitted_at", { ascending: false })

      if (!gradesError && gradesData) {
        const formattedGrades: Grade[] = gradesData.map((grade: any) => ({
          id: grade.id,
          assessmentId: grade.assessment_id,
          studentId: grade.student_id,
          studentName: grade.student_name || "",
          marks: grade.marks_obtained,
          percentage: grade.percentage,
          grade: grade.grade_letter,
          remarks: grade.remarks,
          submittedAt: grade.submitted_at,
        }))
        setGrades(formattedGrades)
        setDataLoaded(prev => ({ ...prev, grades: true }))
      } else if (gradesError) {
        try {
          const { serializeSupabaseError } = await import('./safe-error')
          console.error('Supabase error fetching grades:', serializeSupabaseError(gradesError))
        } catch (_) {
          console.error('Supabase error fetching grades:', gradesError)
        }
      }
    } catch (err) {
      console.error("Error loading grades:", err)
    } finally {
      setLoadingGrades(false)
    }
  }, [useDatabase, dataLoaded.grades])

  const loadStudents = useCallback(async () => {
    if (!useDatabase || !supabase || dataLoaded.students) return

    setLoadingStudents(true)
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, first_name, last_name, email, student_id, class_id, class_name")
        .order("first_name", { ascending: true })

      if (!studentsError && studentsData) {
        const formattedStudents: Student[] = studentsData.map((student: any) => ({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          email: student.email,
          studentId: student.student_id,
          classId: student.class_id || "",
          className: student.class_name || "",
        }))
        setStudents(formattedStudents)
        setDataLoaded(prev => ({ ...prev, students: true }))
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
  }, [useDatabase, dataLoaded.students])

  const loadClasses = useCallback(async () => {
    if (!useDatabase || !supabase || dataLoaded.classes) return

    setLoadingClasses(true)
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

  // Check database availability on mount (but don't load data)
  useEffect(() => {
    const checkDatabase = async () => {
      if (isSupabaseAvailable() && supabase) {
        try {
          const { error } = await supabase.from("assessments").select("count", { count: "exact", head: true })
          if (!error) {
            console.log("✅ Database connection established for teacher grades - using Supabase")
            setUseDatabase(true)
            // Don't auto-load data - components will call load functions explicitly
          } else {
            console.log("⚠️ Database connection failed, using mock data for teacher grades")
            setUseDatabase(false)
          }
        } catch (err) {
          console.log("⚠️ Database connection failed, using mock data for teacher grades")
          setUseDatabase(false)
        }
      } else {
        console.log("⚠️ Supabase not available, using mock data for teacher grades")
        setUseDatabase(false)
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

  // Grade functions
  const addGrade = useCallback(async (gradeData: Omit<Grade, "id" | "submittedAt">) => {
    setLoading(true)
    setError(null)
    try {
      if (useDatabase && supabase) {
        // Use the database function for creating grade
        const { data: createdGradeId, error } = await supabase
          .rpc('create_grade', {
            p_assessment_id: gradeData.assessmentId,
            p_student_id: gradeData.studentId,
            p_teacher_id: user?.id, // TODO: Get from auth context
            p_marks_obtained: gradeData.marks,
            p_remarks: gradeData.remarks || null,
            p_feedback: null,
            p_is_late: false,
            p_is_absent: false,
            p_is_excused: false
          })

        if (error) throw error

        // Fetch the created grade to get all details
        const { data: createdGrade, error: fetchError } = await supabase
          .from("grades")
          .select("*")
          .eq("id", createdGradeId)
          .single()

        if (fetchError) {
          throw fetchError
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
      setError("Failed to add grade")
      console.error("Error adding grade:", err)
    } finally {
      setLoading(false)
    }
  }, [useDatabase, user?.id])

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

  // Teacher functions
  const getTeacherSubjects = useCallback(() => {
    return teacherSubjects
  }, [teacherSubjects])

  // Utility functions
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

  const contextValue = useMemo(
    () => ({
      // State
      assessments,
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
      assessments,
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
