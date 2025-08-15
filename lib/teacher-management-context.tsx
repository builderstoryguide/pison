"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase, isSupabaseAvailable } from "./supabase"

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
  usingDatabase: boolean
}

const TeacherManagementContext = createContext<TeacherManagementContextType | undefined>(undefined)

export function TeacherManagementProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usingDatabase, setUsingDatabase] = useState(false)

  // Check if we can use database
  useEffect(() => {
    const checkDatabase = async () => {
      if (isSupabaseAvailable()) {
        try {
          const { error } = await supabase!.from("teachers").select("count", { count: "exact", head: true })
          if (!error) {
            setUsingDatabase(true)
          }
        } catch {
          setUsingDatabase(false)
        }
      }
    }

    checkDatabase()
    loadTeachers()
  }, [])

  const generateTeacherId = async (): Promise<string> => {
    const currentYear = new Date().getFullYear()
    let teacherId: string
    let isUnique = false
    let counter = 1

    while (!isUnique) {
      teacherId = `TCH${currentYear}${counter.toString().padStart(3, "0")}`

      if (usingDatabase && supabase) {
        const { data } = await supabase.from("teachers").select("teacher_id").eq("teacher_id", teacherId).single()
        isUnique = !data
      } else {
        // Check localStorage
        const existingTeachers = JSON.parse(localStorage.getItem("teachers") || "[]")
        isUnique = !existingTeachers.some((t: Teacher) => t.teacherId === teacherId)
      }

      if (!isUnique) counter++
    }

    return teacherId!
  }

  const loadTeachers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (usingDatabase && supabase) {
        // Load from database
        const { data: teachersData, error: teachersError } = await supabase
          .from("teachers")
          .select("*")
          .order("created_at", { ascending: false })

        if (teachersError) throw teachersError

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
      } else {
        // Load from localStorage
        const storedTeachers = localStorage.getItem("teachers")
        if (storedTeachers) {
          setTeachers(JSON.parse(storedTeachers))
        }
      }
    } catch (err) {
      console.error("Error loading teachers:", err)
      setError(err instanceof Error ? err.message : "Failed to load teachers")

      // Fallback to localStorage
      const storedTeachers = localStorage.getItem("teachers")
      if (storedTeachers) {
        setTeachers(JSON.parse(storedTeachers))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const addTeacher = async (teacherData: TeacherFormData): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      const teacherId = await generateTeacherId()
      const now = new Date().toISOString()

      const newTeacher: Teacher = {
        ...teacherData,
        id: crypto.randomUUID(),
        teacherId,
        createdAt: now,
        updatedAt: now,
      }

      if (usingDatabase && supabase) {
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

        if (teacherError) throw teacherError

        await loadTeachers() // Reload to get the complete data
      } else {
        // Save to localStorage
        const updatedTeachers = [newTeacher, ...teachers]
        setTeachers(updatedTeachers)
        localStorage.setItem("teachers", JSON.stringify(updatedTeachers))
      }

      return teacherId
    } catch (err) {
      console.error("Error adding teacher:", err)
      setError(err instanceof Error ? err.message : "Failed to add teacher")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateTeacher = async (id: string, teacherData: Partial<Teacher>) => {
    setIsLoading(true)
    setError(null)

    try {
      if (usingDatabase && supabase) {
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
      } else {
        // Update in localStorage
        const updatedTeachers = teachers.map((teacher) =>
          teacher.id === id ? { ...teacher, ...teacherData, updatedAt: new Date().toISOString() } : teacher,
        )
        setTeachers(updatedTeachers)
        localStorage.setItem("teachers", JSON.stringify(updatedTeachers))
      }
    } catch (err) {
      console.error("Error updating teacher:", err)
      setError(err instanceof Error ? err.message : "Failed to update teacher")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTeacher = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      if (usingDatabase && supabase) {
        // Delete from database
        const { error } = await supabase.from("teachers").delete().eq("id", id)

        if (error) throw error

        await loadTeachers()
      } else {
        // Delete from localStorage
        const updatedTeachers = teachers.filter((teacher) => teacher.id !== id)
        setTeachers(updatedTeachers)
        localStorage.setItem("teachers", JSON.stringify(updatedTeachers))
      }
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
    usingDatabase,
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
