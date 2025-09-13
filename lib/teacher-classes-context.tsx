"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
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
  getClassById: (classId: string) => TeacherClass | undefined
  getClassStudents: (classId: string) => Student[]
  getClassSubjects: (classId: string) => Subject[]
  searchStudents: (classId: string, searchTerm: string) => Student[]
  filterStudentsByStatus: (classId: string, status: Student["enrollmentStatus"]) => Student[]
}

const TeacherClassesContext = createContext<TeacherClassesContextType | undefined>(undefined)

// Mock data for teacher classes
const mockClasses: TeacherClass[] = [
  {
    id: "cls_001",
    name: "Form 5A Science",
    code: "F5A-SCI",
    level: "Form 5",
    subsystem: "english",
    branch: "grammar",
    academicYear: "2024-2025",
    capacity: 40,
    room: "Room 101",
    students: [
      {
        id: "std_001",
        studentId: "STU2024001",
        firstName: "Marie",
        lastName: "Ngozi",
        email: "marie.ngozi@student.pisonacademy.cm",
        phone: "+237 678 901 234",
        photo: "/placeholder_64px.png",
        enrollmentStatus: "enrolled",
        parentName: "Paul Ngozi",
        parentPhone: "+237 678 901 235",
        parentEmail: "paul.ngozi@gmail.com",
        dateOfBirth: "2007-03-15",
        address: "Yaoundé, Cameroon",
      },
      {
        id: "std_002",
        studentId: "STU2024002",
        firstName: "Jean",
        lastName: "Baptiste",
        email: "jean.baptiste@student.pisonacademy.cm",
        phone: "+237 678 901 236",
        photo: "/placeholder_64px.png",
        enrollmentStatus: "enrolled",
        parentName: "Marie Baptiste",
        parentPhone: "+237 678 901 237",
        parentEmail: "marie.baptiste@gmail.com",
        dateOfBirth: "2007-05-22",
        address: "Yaoundé, Cameroon",
      },
      {
        id: "std_003",
        studentId: "STU2024003",
        firstName: "Fatima",
        lastName: "Alim",
        email: "fatima.alim@student.pisonacademy.cm",
        phone: "+237 678 901 238",
        photo: "/placeholder_64px.png",
        enrollmentStatus: "enrolled",
        parentName: "Hassan Alim",
        parentPhone: "+237 678 901 239",
        parentEmail: "hassan.alim@gmail.com",
        dateOfBirth: "2007-01-10",
        address: "Yaoundé, Cameroon",
      },
      {
        id: "std_004",
        studentId: "STU2024004",
        firstName: "Paul",
        lastName: "Biya Jr",
        email: "paul.biya@student.pisonacademy.cm",
        phone: "+237 678 901 240",
        photo: "/placeholder_64px.png",
        enrollmentStatus: "enrolled",
        parentName: "Chantal Biya",
        parentPhone: "+237 678 901 241",
        parentEmail: "chantal.biya@gmail.com",
        dateOfBirth: "2007-07-18",
        address: "Yaoundé, Cameroon",
      },
    ],
    subjects: [
      {
        id: "sub_001",
        name: "Mathematics",
        code: "MATH",
        coefficient: 4,
        description: "Advanced mathematics including calculus and algebra",
      },
      {
        id: "sub_002",
        name: "Physics",
        code: "PHY",
        coefficient: 3,
        description: "Classical and modern physics concepts",
      },
      {
        id: "sub_003",
        name: "Chemistry",
        code: "CHEM",
        coefficient: 3,
        description: "Organic and inorganic chemistry",
      },
      {
        id: "sub_004",
        name: "Biology",
        code: "BIO",
        coefficient: 3,
        description: "Human biology and life sciences",
      },
    ],
    schedule: [
      {
        day: "Monday",
        periods: [
          { time: "08:00-09:00", subject: "Mathematics", room: "Room 101" },
          { time: "09:00-10:00", subject: "Physics", room: "Lab 1" },
          { time: "10:30-11:30", subject: "Chemistry", room: "Lab 2" },
          { time: "11:30-12:30", subject: "Biology", room: "Room 101" },
        ],
      },
      {
        day: "Tuesday",
        periods: [
          { time: "08:00-09:00", subject: "Physics", room: "Lab 1" },
          { time: "09:00-10:00", subject: "Mathematics", room: "Room 101" },
          { time: "10:30-11:30", subject: "Biology", room: "Room 101" },
          { time: "11:30-12:30", subject: "Chemistry", room: "Lab 2" },
        ],
      },
    ],
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "cls_002",
    name: "Form 4B Arts",
    code: "F4B-ART",
    level: "Form 4",
    subsystem: "english",
    branch: "grammar",
    academicYear: "2024-2025",
    capacity: 35,
    room: "Room 205",
    students: [
      {
        id: "std_005",
        studentId: "STU2024005",
        firstName: "Aminata",
        lastName: "Touré",
        email: "aminata.toure@student.pisonacademy.cm",
        phone: "+237 678 901 242",
        photo: "/placeholder_64px.png",
        enrollmentStatus: "enrolled",
        parentName: "Ibrahim Touré",
        parentPhone: "+237 678 901 243",
        parentEmail: "ibrahim.toure@gmail.com",
        dateOfBirth: "2008-04-12",
        address: "Yaoundé, Cameroon",
      },
      {
        id: "std_006",
        studentId: "STU2024006",
        firstName: "Emmanuel",
        lastName: "Mbeki",
        email: "emmanuel.mbeki@student.pisonacademy.cm",
        phone: "+237 678 901 244",
        photo: "/placeholder_64px.png",
        enrollmentStatus: "enrolled",
        parentName: "Grace Mbeki",
        parentPhone: "+237 678 901 245",
        parentEmail: "grace.mbeki@gmail.com",
        dateOfBirth: "2008-09-05",
        address: "Yaoundé, Cameroon",
      },
    ],
    subjects: [
      {
        id: "sub_005",
        name: "English Language",
        code: "ENG",
        coefficient: 4,
        description: "Advanced English language and literature",
      },
      {
        id: "sub_006",
        name: "French",
        code: "FR",
        coefficient: 3,
        description: "French language and literature",
      },
      {
        id: "sub_007",
        name: "History",
        code: "HIST",
        coefficient: 2,
        description: "World and African history",
      },
      {
        id: "sub_008",
        name: "Geography",
        code: "GEO",
        coefficient: 2,
        description: "Physical and human geography",
      },
    ],
    schedule: [
      {
        day: "Monday",
        periods: [
          { time: "08:00-09:00", subject: "English Language", room: "Room 205" },
          { time: "09:00-10:00", subject: "French", room: "Room 205" },
          { time: "10:30-11:30", subject: "History", room: "Room 205" },
          { time: "11:30-12:30", subject: "Geography", room: "Room 205" },
        ],
      },
    ],
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
]

export function TeacherClassesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [classes, setClasses] = useState<TeacherClass[]>(mockClasses)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getTeacherClasses = async (): Promise<TeacherClass[]> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // In real implementation, filter classes by teacher ID
      const teacherClasses = classes.filter(
        (cls) =>
          // Mock filter - in real app, check if current user is assigned to this class
          true,
      )

      setIsLoading(false)
      return teacherClasses
    } catch (err) {
      setError("Failed to fetch teacher classes")
      setIsLoading(false)
      return []
    }
  }

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
