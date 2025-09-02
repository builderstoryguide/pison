"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase, isSupabaseAvailable } from "./supabase"

// Fallback UUID generation function
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export interface TeacherFormData {
  title: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  nationality: string
  idNumber: string
  address: string
  city: string
  region: string
  subsystem: "english" | "french"
  subjects: string[]
  classes: string[]
  qualifications: string[]
  experience: string
  employmentType: "full-time" | "part-time" | "contract"
  salary: number
  startDate: string
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  status: "active" | "inactive"
}

export interface Teacher {
  id: string
  teacherId: string
  title: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  nationality: string
  idNumber: string
  address: string
  city: string
  region: string
  subsystem: "english" | "french"
  subjects: string[]
  classes: string[]
  qualifications: string[]
  experience: string
  employmentType: "full-time" | "part-time" | "contract"
  salary: number
  startDate: string
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

interface TeacherManagementContextType {
  teachers: Teacher[]
  isLoading: boolean
  error: string | null
  addTeacher: (teacherData: TeacherFormData) => Promise<string>
  updateTeacher: (id: string, teacherData: Partial<Teacher>) => Promise<void>
  deleteTeacher: (id: string) => Promise<void>
  getTeacher: (id: string) => Teacher | undefined
  loadTeachers: () => Promise<void>
}

const TeacherManagementContext = createContext<TeacherManagementContextType | undefined>(undefined)

export function TeacherManagementProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dbConnected, setDbConnected] = useState(false)

  // Check database connection on mount
  useEffect(() => {
    const checkDatabase = async () => {
      if (isSupabaseAvailable()) {
        try {
          const { error } = await supabase!.from("teachers").select("count", { count: "exact", head: true })
          if (!error) {
            console.log("✅ Database connection established - using Supabase")
            setDbConnected(true)
          } else {
            console.log("⚠️ Database connection failed, using mock data:", error.message)
            setDbConnected(false)
          }
        } catch (err) {
          console.log("⚠️ Database connection failed, using mock data:", err)
          setDbConnected(false)
        }
      } else {
        console.log("⚠️ Supabase not available - using mock data")
        setDbConnected(false)
      }
    }

    checkDatabase()
    loadTeachers()
    
    // Listen for teacher creation events from user management
    const handleTeacherCreated = () => {
      console.log('Teacher created event received, refreshing teacher data...')
      loadTeachers()
    }
    
    window.addEventListener('teacherCreated', handleTeacherCreated)
    
    return () => {
      window.removeEventListener('teacherCreated', handleTeacherCreated)
    }
  }, [])

  const generateTeacherId = async (): Promise<string> => {
    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    const currentYear = new Date().getFullYear()
    let teacherId: string
    let isUnique = false
    let counter = 1

    while (!isUnique) {
      teacherId = `TCH${currentYear}${counter.toString().padStart(3, "0")}`

      const { data } = await supabase.from("teachers").select("teacher_id").eq("teacher_id", teacherId).single()
      isUnique = !data

      if (!isUnique) counter++
    }

    return teacherId!
  }

  const loadTeachers = async () => {
    if (!supabase) {
      setError("Supabase client not available")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Load from database
      const { data: teachersData, error: teachersError } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false })

      if (teachersError) {
        console.error("❌ Error loading teachers:", teachersError)
        throw teachersError
      }

      const formattedTeachers: Teacher[] =
        teachersData?.map((teacher: any) => ({
          id: teacher.id,
          teacherId: teacher.teacher_id,
          title: teacher.title || "",
          firstName: teacher.first_name,
          lastName: teacher.last_name,
          email: teacher.email,
          phone: teacher.phone || "",
          dateOfBirth: teacher.date_of_birth || "",
          gender: teacher.gender || "",
          nationality: teacher.nationality || "",
          idNumber: teacher.id_number || "",
          address: teacher.address || "",
          city: teacher.city || "",
          region: teacher.region || "",
          subsystem: teacher.subsystem,
          subjects: teacher.subjects || [],
          classes: teacher.classes || [],
          qualifications: teacher.qualifications || [],
          experience: teacher.experience || "",
          employmentType: teacher.employment_type,
          salary: teacher.salary || 0,
          startDate: teacher.start_date || "",
          emergencyContact: {
            name: teacher.emergency_contact_name || "",
            relationship: teacher.emergency_contact_relationship || "",
            phone: teacher.emergency_contact_phone || "",
          },
          status: teacher.status || "active",
          createdAt: teacher.created_at,
          updatedAt: teacher.updated_at,
        })) || []

      setTeachers(formattedTeachers)
    } catch (err) {
      console.error("Error loading teachers:", err)
      const errorMessage = err instanceof Error ? err.message : 
        typeof err === 'string' ? err : 
        err && typeof err === 'object' && 'message' in err ? String(err.message) :
        "Failed to load teachers"
      setError(errorMessage)
      setTeachers([])
    } finally {
      setIsLoading(false)
    }
  }

  const addTeacher = async (teacherData: TeacherFormData): Promise<string> => {
    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("🔄 Starting teacher enrollment process...")
      
      const teacherId = await generateTeacherId()
      const now = new Date().toISOString()

      const newTeacher: Teacher = {
        ...teacherData,
        id: generateUUID(),
        teacherId,
        createdAt: now,
        updatedAt: now,
      }

      console.log("📝 Generated teacher ID:", teacherId)
      console.log("👤 Teacher data:", { ...newTeacher, id: newTeacher.id.substring(0, 8) + "..." })

      console.log("💾 Saving teacher to database...")
      // Save to database
      const { error: teacherError } = await supabase.from("teachers").insert({
        teacher_id: teacherId,
        title: teacherData.title,
        first_name: teacherData.firstName,
        last_name: teacherData.lastName,
        email: teacherData.email,
        phone: teacherData.phone,
        date_of_birth: teacherData.dateOfBirth,
        gender: teacherData.gender,
        nationality: teacherData.nationality,
        id_number: teacherData.idNumber,
        address: teacherData.address,
        city: teacherData.city,
        region: teacherData.region,
        subsystem: teacherData.subsystem,
        subjects: teacherData.subjects,
        classes: teacherData.classes,
        qualifications: teacherData.qualifications,
        experience: teacherData.experience,
        employment_type: teacherData.employmentType,
        salary: teacherData.salary,
        start_date: teacherData.startDate,
        emergency_contact_name: teacherData.emergencyContact.name,
        emergency_contact_relationship: teacherData.emergencyContact.relationship,
        emergency_contact_phone: teacherData.emergencyContact.phone,
        status: teacherData.status,
      })

      if (teacherError) {
        console.error("❌ Database error:", teacherError)
        console.error("❌ Error details:", {
          message: teacherError.message,
          details: teacherError.details,
          hint: teacherError.hint,
          code: teacherError.code
        })
        
        // Provide more specific error messages based on the error
        let errorMessage = "Failed to add teacher"
        
        if (teacherError.message) {
          if (teacherError.message.includes("valid_phone")) {
            errorMessage = "Invalid phone number format. Please ensure the phone number follows the Cameroon format (+237 6XXXXXXXX)."
          } else if (teacherError.message.includes("duplicate key")) {
            errorMessage = "A teacher with this email or ID number already exists."
          } else if (teacherError.message.includes("not null")) {
            errorMessage = "Missing required information. Please fill in all required fields."
          } else {
            errorMessage = teacherError.message
          }
        }
        
        throw new Error(errorMessage)
      }

      console.log("✅ Teacher saved to database successfully")
      await loadTeachers() // Reload to get the complete data

      console.log("🎉 Teacher enrollment completed successfully!")
      return teacherId
    } catch (err) {
      console.error("Error adding teacher:", err)
      const errorMessage = err instanceof Error ? err.message : 
        typeof err === 'string' ? err : 
        err && typeof err === 'object' && 'message' in err ? String(err.message) :
        "Failed to add teacher"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const updateTeacher = async (id: string, teacherData: Partial<Teacher>) => {
    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    setIsLoading(true)
    setError(null)

    try {
      // Update in database
      const { error } = await supabase
        .from("teachers")
        .update({
          title: teacherData.title,
          first_name: teacherData.firstName,
          last_name: teacherData.lastName,
          email: teacherData.email,
          phone: teacherData.phone,
          date_of_birth: teacherData.dateOfBirth,
          gender: teacherData.gender,
          nationality: teacherData.nationality,
          id_number: teacherData.idNumber,
          address: teacherData.address,
          city: teacherData.city,
          region: teacherData.region,
          subsystem: teacherData.subsystem,
          subjects: teacherData.subjects,
          classes: teacherData.classes,
          qualifications: teacherData.qualifications,
          experience: teacherData.experience,
          employment_type: teacherData.employmentType,
          salary: teacherData.salary,
          start_date: teacherData.startDate,
          emergency_contact_name: teacherData.emergencyContact?.name,
          emergency_contact_relationship: teacherData.emergencyContact?.relationship,
          emergency_contact_phone: teacherData.emergencyContact?.phone,
          status: teacherData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      await loadTeachers()
    } catch (err) {
      console.error("Error updating teacher:", err)
      setError(err instanceof Error ? err.message : "Failed to update teacher")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTeacher = async (id: string) => {
    if (!supabase) {
      throw new Error("Supabase client not available")
    }

    setIsLoading(true)
    setError(null)

    try {
      // First, get the teacher data to find the corresponding user
      const { data: teacher, error: fetchError } = await supabase
        .from("teachers")
        .select("teacher_id, email")
        .eq("id", id)
        .single()

      if (fetchError) {
        console.error("❌ Error fetching teacher data:", fetchError)
        throw fetchError
      }

      if (!teacher) {
        throw new Error("Teacher not found")
      }

      // Find the corresponding user record
      const { data: user, error: userFetchError } = await supabase
        .from("users")
        .select("id")
        .eq("email", teacher.email)
        .eq("role", "teacher")
        .single()

      if (userFetchError && userFetchError.code !== 'PGRST116') {
        console.error("❌ Error fetching user data:", userFetchError)
        // Continue with teacher deletion even if user not found
      }

      // Delete from teachers table
      const { error: teacherDeleteError, count } = await supabase
        .from("teachers")
        .delete()
        .eq("id", id)

      if (teacherDeleteError) {
        console.error("❌ Database error during teacher deletion:", teacherDeleteError)
        throw teacherDeleteError
      }

      // Delete from users table if user record exists
      if (user) {
        const { error: userDeleteError } = await supabase
          .from("users")
          .delete()
          .eq("id", user.id)

        if (userDeleteError) {
          console.error("❌ Error deleting user record:", userDeleteError)
          // Don't throw error here, as teacher was already deleted
          console.warn("⚠️ Teacher deleted but user record deletion failed")
        } else {
          console.log("✅ Teacher and user records deleted successfully")
        }
      } else {
        console.log("✅ Teacher deleted successfully (no user record found)")
      }

      // Reload teachers to update the UI
      await loadTeachers()
      
      // Also manually remove the teacher from state as a fallback
      setTeachers(prevTeachers => {
        const updatedTeachers = prevTeachers.filter(teacher => teacher.id !== id)
        return updatedTeachers
      })
    } catch (err) {
      console.error("Error deleting teacher:", err)
      setError(err instanceof Error ? err.message : "Failed to delete teacher")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getTeacher = (id: string): Teacher | undefined => {
    return teachers.find((teacher) => teacher.id === id)
  }

  const value: TeacherManagementContextType = {
    teachers,
    isLoading,
    error,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    getTeacher,
    loadTeachers,
  }

  return <TeacherManagementContext.Provider value={value}>{children}</TeacherManagementContext.Provider>
}

export function useTeacherManagement() {
  const context = useContext(TeacherManagementContext)
  if (context === undefined) {
    throw new Error("useTeacherManagement must be used within a TeacherManagementProvider")
  }
  return context
}
