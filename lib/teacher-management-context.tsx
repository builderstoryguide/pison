"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase, isSupabaseAvailable } from "./supabase"

// Helper function to generate initials from name
function generateInitials(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'U'
  }
  
  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) // Limit to 2 characters
}

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
  addTeacher: (teacherData: TeacherFormData) => Promise<{ teacherId: string; password: string }>
  updateTeacher: (id: string, teacherData: Partial<Teacher>) => Promise<void>
  deleteTeacher: (id: string) => Promise<void>
  resetTeacherPassword: (teacherId: string) => Promise<{ success: boolean; password?: string; error?: string }>
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

  const addTeacher = async (teacherData: TeacherFormData): Promise<{ 
    teacherId: string; 
    password: string;
    userAccountCreated?: boolean;
    userAccountError?: string;
  }> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("🔄 Starting teacher enrollment process...")
      console.log("👤 Teacher data:", { ...teacherData, id: "..." })

      // Call API route to create teacher (uses service role client, bypasses RLS)
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...teacherData,
          createdBy: null // TODO: Get current user ID from session if available
        }),
      })

      if (!response.ok) {
        let errorData: any = { error: 'Unknown error' }
        try {
          errorData = await response.json()
        } catch (parseError) {
          // If response is not JSON, use status text
          errorData = { 
            error: `Server error: ${response.statusText || 'Unknown error'}`,
            details: `HTTP ${response.status}`
          }
        }
        
        // Build comprehensive error message
        let errorMessage = errorData.error || `Failed to create teacher: ${response.statusText}`
        
        // Add details if available
        if (errorData.details) {
          errorMessage += ` (${errorData.details})`
        }
        
        // Add specific error codes
        if (errorData.code) {
          console.error("❌ Error code:", errorData.code)
        }
        
        // Handle specific HTTP status codes
        if (response.status === 400) {
          errorMessage = errorData.error || 'Invalid request. Please check all required fields are filled correctly.'
        } else if (response.status === 409) {
          errorMessage = errorData.error || 'A teacher with this information already exists.'
        } else if (response.status === 403) {
          errorMessage = errorData.error || 'Permission denied. Please contact administrator.'
        } else if (response.status === 500) {
          errorMessage = errorData.error || 'Server error occurred while creating teacher. Please try again later.'
        }
        
        console.error("❌ API error:", errorMessage)
        console.error("❌ Response status:", response.status)
        console.error("❌ Error details:", errorData)
        
        throw new Error(errorMessage)
      }

      let result: any
      try {
        result = await response.json()
      } catch (parseError) {
        console.error("❌ Failed to parse API response:", parseError)
        throw new Error("Invalid response from server. Please try again.")
      }
      
      // Validate result structure
      if (!result || typeof result !== 'object') {
        console.error("❌ Invalid API response structure:", result)
        throw new Error("Invalid response from server. Please try again.")
      }
      
      if (!result.success) {
        const errorMessage = result.error || "Failed to create teacher"
        console.error("❌ API returned error:", errorMessage)
        throw new Error(errorMessage)
      }
      
      // Validate required fields in response
      if (!result.teacherId || !result.password) {
        console.error("❌ Missing required fields in API response:", result)
        throw new Error("Incomplete response from server. Please try again.")
      }

      console.log("✅ Teacher created successfully via API")
      console.log("📝 Teacher ID:", result.teacherId)
      console.log("🔑 Generated password:", result.password ? "***" : "not provided")
      
      // Reload teachers to get the complete data
      await loadTeachers()

      // Dispatch teacherCreated event to notify User Management context
      window.dispatchEvent(new CustomEvent('teacherCreated', { 
        detail: { 
          teacherId: result.teacherId,
          name: `${teacherData.firstName} ${teacherData.lastName}`,
          email: teacherData.email 
        } 
      }))

      console.log("🎉 Teacher enrollment completed successfully!")
      console.log("📤 Returning result:", { teacherId: result.teacherId, password: result.password })
      
      return { 
        teacherId: result.teacherId, 
        password: result.password,
        userAccountCreated: result.userAccountCreated ?? true, // Default to true for backward compatibility
        userAccountError: result.userAccountError
      }
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
      // Get the current teacher to find associated user
      const { data: currentTeacher, error: fetchError } = await supabase
        .from("teachers")
        .select("id, teacher_id, email, user_id")
        .eq("id", id)
        .single()

      if (fetchError) throw fetchError

      // Update teachers table
      const { error: teacherError } = await supabase
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

      if (teacherError) throw teacherError

      // Update user account if it exists
      if (currentTeacher) {
        let userId: string | null = null

        // Try to find user by user_id if available
        if (currentTeacher.user_id) {
          userId = currentTeacher.user_id
        } else {
          // Try to find user by email
          const { data: userByEmail } = await supabase
            .from("users")
            .select("id")
            .eq("email", teacherData.email || currentTeacher.email)
            .eq("role", "teacher")
            .single()

          if (userByEmail) {
            userId = userByEmail.id
          } else if (currentTeacher.teacher_id) {
            // Try to find user by teacher_id in user_profiles
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("user_id")
              .eq("role_specific_id", currentTeacher.teacher_id)
              .single()

            if (profile) {
              userId = profile.user_id
            }
          }
        }

        // Update user account if found
        if (userId) {
          const fullName = `${teacherData.firstName || ""} ${teacherData.lastName || ""}`.trim()
          
          const { error: userError } = await supabase
            .from("users")
            .update({
              name: fullName || undefined,
              email: teacherData.email || undefined,
              phone: teacherData.phone || undefined,
              status: teacherData.status || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)

          if (userError) {
            console.warn("⚠️ Failed to update user account:", userError)
            // Don't throw error - teacher was updated successfully
          }

          // Update user profile if it exists
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("id")
            .eq("user_id", userId)
            .single()

          if (profile) {
            const { error: profileError } = await supabase
              .from("user_profiles")
              .update({
                subsystem: teacherData.subsystem || undefined,
                emergency_contact_name: teacherData.emergencyContact?.name || undefined,
                emergency_contact_phone: teacherData.emergencyContact?.phone || undefined,
                emergency_contact_relationship: teacherData.emergencyContact?.relationship || undefined,
                updated_at: new Date().toISOString(),
              })
              .eq("id", profile.id)

            if (profileError) {
              console.warn("⚠️ Failed to update user profile:", profileError)
              // Don't throw error - teacher was updated successfully
            }
          }
        }
      }

      // Reload teachers to reflect changes
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

  const resetTeacherPassword = async (teacherId: string): Promise<{ success: boolean; password?: string; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not available' }
    }

    setIsLoading(true)
    setError(null)

    try {
      // Find the teacher record
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id, teacher_id, email, user_id')
        .eq('id', teacherId)
        .maybeSingle()

      if (teacherError || !teacher) {
        return { success: false, error: 'Teacher not found' }
      }

      // Find the user account
      let userId: string | null = null

      // Try to get user_id from teacher record first
      if (teacher.user_id) {
        userId = teacher.user_id
      } else {
        // Try to find user by email
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', teacher.email)
          .eq('role', 'teacher')
          .maybeSingle()

        if (userByEmail) {
          userId = userByEmail.id
        } else {
          // Try to find user by teacher_id in user_profiles
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('role_specific_id', teacher.teacher_id)
            .maybeSingle()

          if (profile) {
            userId = profile.user_id
          }
        }
      }

      if (!userId) {
        return { success: false, error: 'User account not found for this teacher. Please create a user account first.' }
      }

      // Call the password reset API
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          resetBy: null, // Could be enhanced to track who reset the password
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to reset password' }))
        return { success: false, error: errorData.error || 'Failed to reset password' }
      }

      const result = await response.json()
      if (result.success && result.password) {
        return { success: true, password: result.password }
      } else {
        return { success: false, error: result.error || 'Password reset failed' }
      }
    } catch (err) {
      console.error('Error resetting teacher password:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const value: TeacherManagementContextType = {
    teachers,
    isLoading,
    error,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    resetTeacherPassword,
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
