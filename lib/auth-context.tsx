"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
<<<<<<< HEAD
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'bursar'
=======
  role: "admin" | "teacher" | "student" | "parent" | "burser"
>>>>>>> 248cbfaf103dd29d6cdf5cd19583d27a7d3b5222
  avatar?: string
  studentId?: string
  teacherRegNo?: string
  parentCode?: string
  subsystem?: "english" | "french"
  branch?: "grammar" | "technical" | "commercial"
  class?: string
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  register: (userData: RegisterData) => Promise<boolean>
  resetPassword: (email: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

interface LoginCredentials {
  identifier: string // email, student ID, teacher reg no, or parent code
  password: string
  role: User["role"]
  subsystem?: "english" | "french"
}

interface RegisterData {
  name: string
  email: string
  role: User["role"]
  studentId?: string
  teacherRegNo?: string
  parentCode?: string
  subsystem?: "english" | "french"
  branch?: "grammar" | "technical" | "commercial"
  class?: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user database
const mockUsers: User[] = [
  {
    id: "1",
    name: "Dr. Marie Ngozi",
    email: "admin@gbhs-yaounde.cm",
    role: "admin",
    permissions: ["all"],
    subsystem: "english",
  },
  {
    id: "2",
    name: "Paul Biya Mbeki",
    email: "p.mbeki@gbhs-yaounde.cm",
    role: "teacher",
    teacherRegNo: "TCH2024001",
    permissions: ["manage_classes", "grade_students", "mark_attendance"],
    subsystem: "english",
  },
  {
    id: "3",
    name: "Amina Fru",
    email: "amina.fru@student.gbhs-yaounde.cm",
    role: "student",
    studentId: "STU2024001",
    branch: "grammar",
    class: "Form 5A",
    permissions: ["view_grades", "view_schedule"],
    subsystem: "english",
  },
  {
    id: "4",
    name: "John Fru",
    email: "john.fru@parent.gbhs-yaounde.cm",
    role: "parent",
    parentCode: "PAR2024001",
    permissions: ["view_child_progress", "communicate_teachers"],
    subsystem: "english",
  },
  {
<<<<<<< HEAD
    id: '5',
    name: 'Grace Tabi',
    email: 'g.tabi@gbhs-yaounde.cm',
    role: 'bursar',
    permissions: ['manage_finances', 'track_payments', 'generate_reports'],
    subsystem: 'english'
  }
=======
    id: "5",
    name: "Grace Tabi",
    email: "g.tabi@gbhs-yaounde.cm",
    role: "burser",
    permissions: ["manage_finances", "track_payments", "generate_reports"],
    subsystem: "english",
  },
>>>>>>> 248cbfaf103dd29d6cdf5cd19583d27a7d3b5222
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem("school_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Find user based on role and identifier
      const foundUser = mockUsers.find((u) => {
        if (u.role !== credentials.role) return false

        switch (credentials.role) {
<<<<<<< HEAD
          case 'admin':
          case 'teacher':
          case 'bursar':
=======
          case "admin":
          case "teacher":
          case "burser":
>>>>>>> 248cbfaf103dd29d6cdf5cd19583d27a7d3b5222
            return u.email === credentials.identifier || u.teacherRegNo === credentials.identifier
          case "student":
            return u.studentId === credentials.identifier || u.email === credentials.identifier
          case "parent":
            return u.parentCode === credentials.identifier || u.email === credentials.identifier
          default:
            return false
        }
      })

      if (foundUser && credentials.password === "password123") {
        // Mock password check
        setUser(foundUser)
        localStorage.setItem("school_user", JSON.stringify(foundUser))
        return true
      } else {
        setError("Invalid credentials. Please check your login details.")
        return false
      }
    } catch (err) {
      setError("Login failed. Please try again.")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("school_user")
  }

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In real implementation, this would create a new user
      console.log("Registering user:", userData)
      return true
    } catch (err) {
      setError("Registration failed. Please try again.")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Password reset requested for:", email)
      return true
    } catch (err) {
      setError("Password reset failed. Please try again.")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        resetPassword,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
