"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { supabase, testConnection } from "./supabase"
import { StorageUtils } from "./storage-utils"

export interface StudentEnrollmentData {
  firstName: string
  lastName: string
  middleName?: string
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
  ) => Promise<{ success: boolean; studentId?: string; parentCode?: string; error?: string }>
  generateStudentId: () => string
  testDatabaseConnection: () => Promise<boolean>
}

const StudentEnrollmentContext = createContext<StudentEnrollmentContextType | undefined>(undefined)

export function StudentEnrollmentProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUsingDatabase, setIsUsingDatabase] = useState(false)

  const testDatabaseConnection = async (): Promise<boolean> => {
    const connected = await testConnection()
    setIsUsingDatabase(connected)
    return connected
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

    const dbConnected = await testConnection()

    if (dbConnected) {
      try {
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
      }
    } else {
      // Generate from localStorage data
      try {
        const savedStudents = StorageUtils.getItem("students") || []
        const existingIds = savedStudents
          .map((s: any) => s.studentId || s.student_id)
          .filter((id: string) => id.startsWith(`STU${year}`))
        nextNumber = existingIds.length + 1
      } catch (error) {
        console.error("Error generating student ID from localStorage:", error)
      }
    }

    return `STU${year}${nextNumber.toString().padStart(3, "0")}`
  }

  const generateParentCode = async (): Promise<string> => {
    const year = new Date().getFullYear()
    let nextNumber = 1

    const dbConnected = await testConnection()

    if (dbConnected) {
      try {
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
      }
    } else {
      // Generate from localStorage data
      try {
        const savedParents = StorageUtils.getItem("parents") || []
        const existingCodes = savedParents
          .map((p: any) => p.parentCode || p.parent_code)
          .filter((code: string) => code.startsWith(`PAR${year}`))
        nextNumber = existingCodes.length + 1
      } catch (error) {
        console.error("Error generating parent code from localStorage:", error)
      }
    }

    return `PAR${year}${nextNumber.toString().padStart(3, "0")}`
  }

  const enrollStudent = async (
    studentData: StudentEnrollmentData,
  ): Promise<{ success: boolean; studentId?: string; parentCode?: string; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      const studentId = await generateActualStudentId()
      const parentCode = await generateParentCode()
      const dbConnected = await testConnection()
      setIsUsingDatabase(dbConnected)

      if (dbConnected) {
        // Save to Supabase
        const { data: student, error: studentError } = await supabase
          .from("students")
          .insert({
            student_id: studentId,
            first_name: studentData.firstName,
            last_name: studentData.lastName,
            middle_name: studentData.middleName,
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
            academic_year: "2024-2025",
            status: "active",
          })
          .select()
          .single()

        if (studentError) {
          throw new Error(`Failed to create student: ${studentError.message}`)
        }

        // Insert parent
        const { error: parentError } = await supabase.from("parents").insert({
          parent_code: parentCode,
          name: studentData.parentName,
          email: studentData.parentEmail,
          phone: studentData.parentPhone,
          address: studentData.parentAddress,
          occupation: studentData.parentOccupation,
          relationship: studentData.relationship,
          student_id: student.id,
        })

        if (parentError) {
          console.warn("Failed to create parent:", parentError.message)
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
      } else {
        // Save to localStorage as fallback
        const newStudent = {
          id: crypto.randomUUID(),
          studentId,
          student_id: studentId,
          firstName: studentData.firstName,
          first_name: studentData.firstName,
          lastName: studentData.lastName,
          last_name: studentData.lastName,
          middleName: studentData.middleName,
          middle_name: studentData.middleName,
          email: studentData.email,
          phone: studentData.phone,
          dateOfBirth: studentData.dateOfBirth,
          date_of_birth: studentData.dateOfBirth,
          gender: studentData.gender,
          placeOfBirth: studentData.placeOfBirth,
          place_of_birth: studentData.placeOfBirth,
          nationality: studentData.nationality || "Cameroonian",
          religion: studentData.religion,
          address: studentData.address,
          city: studentData.city,
          region: studentData.region,
          subsystem: studentData.subsystem,
          branch: studentData.branch,
          class: studentData.class,
          previousSchool: studentData.previousSchool,
          previous_school: studentData.previousSchool,
          previousClass: studentData.previousClass,
          previous_class: studentData.previousClass,
          isNewStudent: true,
          is_new_student: true,
          totalFees: 0,
          total_fees: 0,
          paidFees: 0,
          paid_fees: 0,
          feesStatus: "pending",
          fees_status: "pending",
          enrollmentStatus: "pending",
          enrollment_status: "pending",
          academicYear: "2024-2025",
          academic_year: "2024-2025",
          status: "active",
          enrollmentDate: new Date().toISOString(),
          enrollment_date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const newParent = {
          id: crypto.randomUUID(),
          parentCode,
          parent_code: parentCode,
          name: studentData.parentName,
          email: studentData.parentEmail,
          phone: studentData.parentPhone,
          address: studentData.parentAddress,
          occupation: studentData.parentOccupation,
          relationship: studentData.relationship,
          studentId: newStudent.id,
          student_id: newStudent.id,
          createdAt: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Save to localStorage
        const existingStudents = StorageUtils.getItem("students") || []
        const existingParents = StorageUtils.getItem("parents") || []

        StorageUtils.setItem("students", [...existingStudents, newStudent])
        StorageUtils.setItem("parents", [...existingParents, newParent])

        if (studentData.emergencyContactName && studentData.emergencyContactPhone) {
          const newEmergencyContact = {
            id: crypto.randomUUID(),
            studentId: newStudent.id,
            student_id: newStudent.id,
            name: studentData.emergencyContactName,
            phone: studentData.emergencyContactPhone,
            relationship: studentData.emergencyContactRelationship,
            createdAt: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }

          const existingEmergencyContacts = StorageUtils.getItem("emergency_contacts") || []
          StorageUtils.setItem("emergency_contacts", [...existingEmergencyContacts, newEmergencyContact])
        }

        if (studentData.bloodGroup || studentData.allergies || studentData.medicalConditions) {
          const newMedicalInfo = {
            id: crypto.randomUUID(),
            studentId: newStudent.id,
            student_id: newStudent.id,
            bloodGroup: studentData.bloodGroup,
            blood_group: studentData.bloodGroup,
            allergies: studentData.allergies,
            medicalConditions: studentData.medicalConditions,
            medical_conditions: studentData.medicalConditions,
            createdAt: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          const existingMedicalInfo = StorageUtils.getItem("medical_info") || []
          StorageUtils.setItem("medical_info", [...existingMedicalInfo, newMedicalInfo])
        }
      }

      return { success: true, studentId, parentCode }
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
