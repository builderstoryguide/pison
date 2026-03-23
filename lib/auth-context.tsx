"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { apiPost } from './api-utils'

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
    // Check for stored session with safe JSON parsing
    try {
      const storedUser = localStorage.getItem("school_user")
      if (storedUser && storedUser.trim()) {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser && typeof parsedUser === 'object' && parsedUser.id) {
          console.log('📋 Restored user session for:', parsedUser.name)
          setUser(parsedUser)
        } else {
          console.warn('⚠️ Invalid stored user data, clearing localStorage')
          localStorage.removeItem("school_user")
        }
      }
    } catch (err) {
      console.error('❌ Error parsing stored user data:', err)
      localStorage.removeItem("school_user")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔐 Attempting login for:', { 
        identifier: credentials.identifier, 
        role: credentials.role,
        subsystem: credentials.subsystem 
      })

      // Use the safer API utility
      const result = await apiPost('/api/auth/login', credentials, undefined, 'include')
      
      if (!result.success) {
        console.warn('🚫 Login failed:', result.error)
        setError(result.error || "Login failed. Please check your credentials and try again.")
        return false
      }

      const data = result.data
      if (data && data.success && data.user) {
        // Transform the API response to match our User interface
        const userData: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          avatar: data.user.avatar,
          permissions: data.user.permissions || [],
          subsystem: data.user.subsystem,
          branch: data.user.branch,
          class: data.user.class,
          studentId: data.user.roleSpecificId,
          teacherRegNo: data.user.roleSpecificId,
          parentCode: data.user.roleSpecificId,
        }

        console.log('✅ Login successful for:', userData.name)
        setUser(userData)
        localStorage.setItem("school_user", JSON.stringify(userData))
        return true
      } else {
        const errorMsg = data?.error || "Invalid response from server. Please try again."
        console.warn('🚫 Invalid login response:', data)
        setError(errorMsg)
        return false
      }
    } catch (err) {
      console.error('💥 Login error:', err)
      
      let errorMessage = "Login failed. Please try again."
      
      if (err instanceof Error) {
        if (err.message.includes('JSON Parse Error')) {
          errorMessage = "Server communication error. The server may be down or returning an unexpected response."
        } else if (err.message.includes('fetch failed') || err.message.includes('Network')) {
          errorMessage = "Network error. Please check your internet connection and ensure the server is running."
        } else if (err.message.includes('timeout')) {
          errorMessage = "Request timeout. The server is taking too long to respond."
        }
      }
      
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
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

/** Same as useAuth when inside AuthProvider; returns null when no provider (e.g. isolated PDF shell). */
export function useOptionalAuth(): AuthContextType | null {
  const context = useContext(AuthContext)
  return context ?? null
}
