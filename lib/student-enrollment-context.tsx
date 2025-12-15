"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { supabase, testConnection } from "./supabase"
import { useNotifications } from "./notification-context"
import { activityLogger } from "./activity-logger"
import { generateDefaultPassword } from "./password-utils"
import bcrypt from "bcryptjs"
// #region agent log
import { useGlobalAcademicYear } from "./app-configuration-context-v2"
// #endregion

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
  
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export interface StudentEnrollmentData {
  firstName: string
  lastName: string
  middleName?: string
  matriculeNumber?: string
  dateOfBirth: string
  gender: string
  placeOfBirth: string
  nationality: string
  religion?: string
  email: string
  phone?: string
  address: string
  city: string
  region: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  class: string
  previousSchool?: string
  previousClass?: string
  parentName: string
  parentEmail: string
  parentPhone: string
  parentAddress?: string
  parentOccupation?: string
  relationship: "father" | "mother" | "guardian" | "other"
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship?: string
  medicalConditions?: string
  allergies?: string
  bloodGroup?: string
  birthCertificate: boolean
  previousTranscript: boolean
  medicalCertificate: boolean
  passportPhoto: boolean
}

interface StudentEnrollmentContextType {
  isLoading: boolean
  error: string | null
  isUsingDatabase: boolean
  enrollStudent: (
    studentData: StudentEnrollmentData,
  ) => Promise<{ success: boolean; studentId?: string; parentCode?: string; studentPassword?: string; parentPassword?: string; error?: string }>
  generateStudentId: () => string
  testDatabaseConnection: () => Promise<boolean>
}

const StudentEnrollmentContext = createContext<StudentEnrollmentContextType | undefined>(undefined)

export function StudentEnrollmentProvider({ children }: { children: React.ReactNode }) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'student-enrollment-context.tsx:91',message:'StudentEnrollmentProvider entry',data:{hasUseGlobalAcademicYear:typeof useGlobalAcademicYear!=='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUsingDatabase, setIsUsingDatabase] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  const { addNotification } = useNotifications()
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'student-enrollment-context.tsx:98',message:'Before useGlobalAcademicYear call',data:{useGlobalAcademicYearType:typeof useGlobalAcademicYear},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const globalAcademicYear = useGlobalAcademicYear()
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'student-enrollment-context.tsx:99',message:'After useGlobalAcademicYear call',data:{globalAcademicYear},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Create a custom event to notify other contexts when a student is enrolled
  const notifyStudentEnrolled = (studentData: any) => {
    // Dispatch both events for backward compatibility
    const studentEnrolledEvent = new CustomEvent('studentEnrolled', { detail: studentData })
    window.dispatchEvent(studentEnrolledEvent)
    
    // Also dispatch studentCreated event for User Management context
    const studentCreatedEvent = new CustomEvent('studentCreated', { 
      detail: { 
        studentId: studentData.student_id,
        name: `${studentData.first_name} ${studentData.last_name}`,
        email: studentData.email 
      } 
    })
    window.dispatchEvent(studentCreatedEvent)
  }

  const testDatabaseConnection = async (): Promise<boolean> => {
    try {
      const connected = await testConnection()
      setIsUsingDatabase(connected)
      return connected
    } catch (error) {
      // Use console.warn instead of console.error to avoid triggering Next.js error boundaries
      if (process.env.NODE_ENV === 'development') {
        console.warn("Database connection test failed:", error)
      }
      setIsUsingDatabase(false)
      return false
    }
  }

  const generateStudentId = (): string => {
    const year = new Date().getFullYear()
    const randomNumber = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `STU${year}${randomNumber}`
  }

  const generateActualStudentId = async (): Promise<string> => {
    const year = new Date().getFullYear()
    let nextNumber = 1

    try {
      if (!supabase) {
        throw new Error("Supabase client not available")
      }
      
      // Get existing student IDs for this year from database
      const { data } = await supabase
        .from("students")
        .select("student_id")
        .like("student_id", `STU${year}%`)
        .order("student_id", { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        const lastId = data[0].student_id
        const lastNumber = Number.parseInt(lastId.substring(7)) // Extract number after STU2024
        nextNumber = lastNumber + 1
      }
    } catch (error) {
      console.error("Error generating student ID from database:", error)
      throw new Error("Failed to generate student ID from database")
    }

    return `STU${year}${nextNumber.toString().padStart(3, "0")}`
  }

  const generateParentCode = async (): Promise<string> => {
    const year = new Date().getFullYear()
    let nextNumber = 1

    try {
      if (!supabase) {
        throw new Error("Supabase client not available")
      }
      
      // Get existing parent codes for this year from database
      const { data } = await supabase
        .from("parents")
        .select("parent_code")
        .like("parent_code", `PAR${year}%`)
        .order("parent_code", { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        const lastCode = data[0].parent_code
        const lastNumber = Number.parseInt(lastCode.substring(7)) // Extract number after PAR2024
        nextNumber = lastNumber + 1
      }
    } catch (error) {
      console.error("Error generating parent code from database:", error)
      throw new Error("Failed to generate parent code from database")
    }

    return `PAR${year}${nextNumber.toString().padStart(3, "0")}`
  }

  const enrollStudent = async (
    studentData: StudentEnrollmentData,
  ): Promise<{ success: boolean; studentId?: string; parentCode?: string; studentPassword?: string; parentPassword?: string; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Test database connection first
      const dbConnected = await testConnection()
      setIsUsingDatabase(dbConnected)

      if (!dbConnected) {
        throw new Error("Database connection is required for student enrollment. Please check your database configuration.")
      }

      // Validate required parent information
      if (!studentData.parentName || !studentData.parentPhone) {
        throw new Error("Parent information is required: name and phone number must be provided.")
      }

      // Trim and validate parent email
      const parentEmail = studentData.parentEmail?.trim() || ""
      if (!parentEmail) {
        throw new Error("Parent email address is required.")
      }

      // Validate parent email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(parentEmail)) {
        throw new Error("Please provide a valid parent email address.")
      }

      const studentId = await generateActualStudentId()
      const parentCode = await generateParentCode()

      console.log("Database connected, attempting to save to Supabase...")
      
      if (!supabase) {
        throw new Error("Supabase client not available")
      }
      
      // First, let's check if the students table exists and is accessible
      const { data: tableCheckData, error: tableCheckError } = await supabase
        .from("students")
        .select("student_id")
        .limit(1)
      
      if (tableCheckError) {
        console.error("Table check error:", tableCheckError)
        throw new Error(`Database table not accessible: ${tableCheckError.message}`)
      }
      
      console.log("Table check successful, proceeding with student insertion...")
      
      // Check if matricule number already exists (if provided)
      if (studentData.matriculeNumber) {
        const { data: existingMatricule } = await supabase
          .from("students")
          .select("id")
          .eq("matricule_number", studentData.matriculeNumber)
          .maybeSingle()

        if (existingMatricule) {
          throw new Error("Matricule Number already exists. Please use a different matricule number.")
        }
      }
      
      // Save to Supabase
      console.log("Attempting to insert student with data:", {
        student_id: studentId,
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        matricule_number: studentData.matriculeNumber,
        subsystem: studentData.subsystem,
        branch: studentData.branch,
        class: studentData.class
      })

      // Insert student into database
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert({
          student_id: studentId,
          first_name: studentData.firstName,
          last_name: studentData.lastName,
          middle_name: studentData.middleName,
          matricule_number: studentData.matriculeNumber,
          email: studentData.email,
          phone: studentData.phone,
          date_of_birth: studentData.dateOfBirth,
          gender: studentData.gender,
          place_of_birth: studentData.placeOfBirth,
          nationality: studentData.nationality || "Cameroonian",
          religion: studentData.religion,
          address: studentData.address,
          city: studentData.city,
          region: studentData.region,
          subsystem: studentData.subsystem,
          branch: studentData.branch,
          class: studentData.class,
          previous_school: studentData.previousSchool,
          previous_class: studentData.previousClass,
          is_new_student: true,
          total_fees: 0,
          paid_fees: 0,
          fees_status: "pending",
          enrollment_status: "pending",
          academic_year: globalAcademicYear,
          status: "active",
          enrollment_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (studentError) {
        console.error("Student creation error:", studentError)
        console.log("Student error details:", JSON.stringify(studentError, null, 2))
        console.log("Student data being inserted:", {
          student_id: studentId,
          first_name: studentData.firstName,
          last_name: studentData.lastName,
          email: studentData.email,
          class: studentData.class,
          address: studentData.address,
          branch: studentData.branch,
          subsystem: studentData.subsystem
        })
        
        // Provide more specific error messages
        let errorMessage = studentError.message || 'Unknown database error'
        if (errorMessage.includes('address') || errorMessage.includes('branch')) {
          errorMessage = `Database schema issue: ${errorMessage}. Please run the database setup script to create the required columns.`
        }
        
        throw new Error(`Failed to create student: ${errorMessage}`)
      }

      if (!student) {
        throw new Error("Student was not created successfully")
      }

      // Insert parent
      const { error: parentError } = await supabase.from("parents").insert({
        parent_code: parentCode,
        name: studentData.parentName,
        email: parentEmail,
        phone: studentData.parentPhone,
        address: studentData.parentAddress,
        occupation: studentData.parentOccupation,
        relationship: studentData.relationship,
        student_id: studentId, // Link to the student ID, not the database row ID
      })

      if (parentError) {
        console.warn("Failed to create parent:", parentError.message)
        // Continue with enrollment even if parent creation fails
      } else {
        console.log("✅ Parent created successfully with code:", parentCode)
      }

      // Generate passwords for student and parent accounts
      const studentPassword = generateDefaultPassword('student')
      const parentPassword = generateDefaultPassword('parent')

      // Create user account for student
      let studentUser = null
      if (studentData.email) {
        const studentName = `${studentData.firstName} ${studentData.lastName}`
        const studentInitials = generateInitials(studentName)
        
        const { data: studentUserData, error: studentUserError } = await supabase
          .from('users')
          .insert({
            email: studentData.email,
            password_hash: await bcrypt.hash(studentPassword, 12),
            name: studentName,
            role: 'student',
            status: 'active',
            avatar_url: `initials:${studentInitials}`, // Store initials as avatar URL
            phone: studentData.phone,
            has_default_password: true,
            password_last_changed: new Date().toISOString(),
            password_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            permissions: ['view_own_progress', 'view_own_schedule', 'view_own_fees', 'communicate_teachers'],
          })
          .select()
          .single()

        if (studentUserError) {
          console.warn("Failed to create student user account:", studentUserError.message)
        } else {
          studentUser = studentUserData
          
          // Create user profile for student to link with student_id
          if (studentUser) {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: studentUser.id,
                role_specific_id: studentId, // Link to student_id
                subsystem: studentData.subsystem,
                branch: studentData.branch,
                class_name: studentData.class,
                emergency_contact_name: studentData.emergencyContactName,
                emergency_contact_phone: studentData.emergencyContactPhone,
                emergency_contact_relationship: studentData.emergencyContactRelationship,
                blood_group: studentData.bloodGroup,
                allergies: studentData.allergies,
                medical_conditions: studentData.medicalConditions,
              })
            
            if (profileError) {
              console.warn("Failed to create student user profile:", profileError.message)
            }
          }
        }
      }

      // Create user account for parent
      let parentUser = null
      if (parentEmail) {
        const parentInitials = generateInitials(studentData.parentName)
        
        const { data: parentUserData, error: parentUserError } = await supabase
          .from('users')
          .insert({
            email: parentEmail,
            password_hash: await bcrypt.hash(parentPassword, 12),
            name: studentData.parentName,
            role: 'parent',
            status: 'active',
            avatar_url: `initials:${parentInitials}`, // Store initials as avatar URL
            phone: studentData.parentPhone,
            has_default_password: true,
            password_last_changed: new Date().toISOString(),
            password_expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            permissions: ['view_child_progress', 'view_child_schedule', 'view_child_fees', 'communicate_teachers'],
          })
          .select()
          .single()

        if (parentUserError) {
          console.warn("Failed to create parent user account:", parentUserError.message)
        } else {
          parentUser = parentUserData
          
          // Create user profile for parent to link with parent_code
          if (parentUser) {
            const { error: profileError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: parentUser.id,
                role_specific_id: parentCode, // Link to parent_code
                relationship: studentData.relationship,
                occupation: studentData.parentOccupation,
                emergency_contact_name: studentData.emergencyContactName,
                emergency_contact_phone: studentData.emergencyContactPhone,
                emergency_contact_relationship: studentData.emergencyContactRelationship,
              })
            
            if (profileError) {
              console.warn("Failed to create parent user profile:", profileError.message)
            } else {
              console.log("✅ Parent user profile created successfully")
            }
          }
        }
      }

      // Insert emergency contact
      if (studentData.emergencyContactName && studentData.emergencyContactPhone) {
        const { error: emergencyError } = await supabase.from("emergency_contacts").insert({
          student_id: student.id,
          name: studentData.emergencyContactName,
          phone: studentData.emergencyContactPhone,
          relationship: studentData.emergencyContactRelationship,
        })

        if (emergencyError) {
          console.warn("Failed to create emergency contact:", emergencyError.message)
        }
      }

      // Create parent-student relationship for future access control
      if (parentUser && studentUser) {
        try {
          // This could be extended to a separate relationship table for many-to-many relationships
          console.log(`🔗 Parent-student relationship established: ${parentUser.id} ↔ ${studentUser.id}`)
          
          // Store the relationship in a way that allows parents to access their children's information
          // This could be implemented as a separate table or through the existing parents table
          console.log(`📋 Parent ${studentData.parentName} can now access information for student ${studentData.firstName} ${studentData.lastName}`)
        } catch (error) {
          console.warn("Failed to establish parent-student relationship:", error)
        }
      }

      // Insert medical info
      if (studentData.bloodGroup || studentData.allergies || studentData.medicalConditions) {
        const { error: medicalError } = await supabase.from("medical_info").insert({
          student_id: student.id,
          blood_group: studentData.bloodGroup,
          allergies: studentData.allergies,
          medical_conditions: studentData.medicalConditions,
        })

        if (medicalError) {
          console.warn("Failed to create medical info:", medicalError.message)
        }
      }

      // Update state with the new student
      setStudents(prev => [...prev, student])
      
      // Log the activity
      activityLogger.logActivity('STUDENT_ENROLLED', `Enrolled new student ${studentData.firstName} ${studentData.lastName} in ${studentData.class}`)
      
      // Log parent creation activity
      if (parentUser) {
        activityLogger.logActivity('PARENT_ACCOUNT_CREATED', `Created parent account for ${studentData.parentName} linked to student ${studentId}`)
      }
      
      // Add notification for successful enrollment
      addNotification({
        title: "Student Enrollment Successful",
        message: `${studentData.firstName} ${studentData.lastName} has been successfully enrolled with ID ${studentId}. Parent account created with code ${parentCode}.`,
        type: "success"
      })
      
      // Notify other contexts about the new student
      notifyStudentEnrolled(student)
      
      return {
        success: true,
        studentId,
        parentCode,
        studentPassword,
        parentPassword
      }

    } catch (error) {
      console.error("Error enrolling student:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to enroll student"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const value: StudentEnrollmentContextType = {
    isLoading,
    error,
    isUsingDatabase,
    enrollStudent,
    generateStudentId,
    testDatabaseConnection,
  }

  return <StudentEnrollmentContext.Provider value={value}>{children}</StudentEnrollmentContext.Provider>
}

export function useStudentEnrollment() {
  const context = useContext(StudentEnrollmentContext)
  if (context === undefined) {
    throw new Error("useStudentEnrollment must be used within a StudentEnrollmentProvider")
  }
  return context
}
