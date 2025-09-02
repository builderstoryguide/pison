"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'bursar'
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

// Mock user database - REMOVED - Now using real API

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
      // Call the real authentication API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Transform the API response to match our User interface
        const userData: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          avatar: data.user.avatar,
          permissions: data.user.permissions,
          subsystem: data.user.subsystem,
          branch: data.user.branch,
          class: data.user.class,
          studentId: data.user.roleSpecificId,
          teacherRegNo: data.user.roleSpecificId,
          parentCode: data.user.roleSpecificId,
        }

        setUser(userData)
        localStorage.setItem("school_user", JSON.stringify(userData))
        return true
      } else {
        setError(data.error || "Login failed. Please try again.")
        return false
      }
    } catch (err) {
      console.error('Login error:', err)
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
