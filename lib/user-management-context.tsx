"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { generateDefaultPassword } from './password-utils'
import { activityLogger, ActivityLogEntry } from './activity-logger'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'bursar'
  status: 'active' | 'inactive' | 'suspended'
  avatar?: string
  studentId?: string
  teacherRegNo?: string
  parentCode?: string
  subsystem?: 'english' | 'french'
  branch?: 'grammar' | 'technical' | 'commercial'
  class?: string
  phone?: string
  address?: string
  dateOfBirth?: string
  gender?: 'male' | 'female'
  permissions: string[]
  createdAt: string
  lastLogin?: string
  createdBy: string
  // Password management fields
  hasDefaultPassword?: boolean
  passwordLastChanged?: string
  passwordExpiryDate?: string
}

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: string
  details: string
  timestamp: string
  ipAddress: string
  userAgent: string
}

interface UserManagementContextType {
  users: User[]
  activityLogs: ActivityLog[]
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'createdBy'>) => Promise<{ success: boolean; password?: string }>
  updateUser: (userId: string, userData: Partial<User>) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>
  toggleUserStatus: (userId: string, status: 'active' | 'inactive' | 'suspended') => Promise<boolean>
  resetUserPassword: (userId: string) => Promise<{ success: boolean; password?: string }>
  getUserById: (userId: string) => User | undefined
  searchUsers: (query: string) => User[]
  filterUsers: (filters: UserFilters) => User[]
  logActivity: (action: string, details: string, userId?: string) => void
  isLoading: boolean
  error: string | null
  refreshUsers: () => Promise<void>
}

export interface UserFilters {
  role?: string
  status?: string
  subsystem?: string
  branch?: string
  class?: string
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined)

// Mock activity logs with more recent timestamps
const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    userId: '2',
    userName: 'Paul Biya Mbeki',
    action: 'LOGIN',
    details: 'User logged in successfully',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: '2',
    userId: '3',
    userName: 'Amina Fru',
    action: 'VIEW_GRADES',
    details: 'Viewed Mathematics grades for Form 5A',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
  },
  {
    id: '3',
    userId: '1',
    userName: 'Dr. Marie Ngozi',
    action: 'CREATE_USER',
    details: 'Created new teacher account for Jean Claude',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  },
  {
    id: '4',
    userId: '5',
    userName: 'Grace Tabi',
    action: 'PAYMENT_RECORDED',
    details: 'Recorded fee payment of 50,000 XAF for student Marie Ngozi',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: '5',
    userId: '1',
    userName: 'Dr. Marie Ngozi',
    action: 'CLASS_CREATED',
    details: 'Created new class Form 6 Science with 25 students',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  },
  {
    id: '6',
    userId: '2',
    userName: 'Paul Biya Mbeki',
    action: 'STUDENT_ENROLLED',
    details: 'Enrolled new student Marie Ngozi in Form 5A',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: '7',
    userId: '1',
    userName: 'Dr. Marie Ngozi',
    action: 'EXAM_CREATED',
    details: 'Created Mathematics mid-term exam for Form 5A',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  },
  {
    id: '8',
    userId: '2',
    userName: 'Paul Biya Mbeki',
    action: 'ATTENDANCE_MARKED',
    details: 'Marked attendance for Form 5A - 22 present, 3 absent',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
]

export function UserManagementProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const logActivity = (action: string, details: string, userId?: string) => {
    const newLog: ActivityLog = {
      id: generateId(),
      userId: userId || 'system',
      userName: userId ? users.find(u => u.id === userId)?.name || 'Unknown' : 'System',
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100', // Mock IP
      userAgent: navigator.userAgent
    }
    setActivityLogs(prev => [newLog, ...prev])
  }

  const loadUsers = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/users')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.users) {
        // Transform API response to match our User interface
        const transformedUsers: User[] = result.users.map((apiUser: any) => ({
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          role: apiUser.role,
          status: apiUser.status,
          avatar: apiUser.avatar_url,
          phone: apiUser.phone,
          address: apiUser.address,
          dateOfBirth: apiUser.date_of_birth,
          gender: apiUser.gender,
          permissions: apiUser.permissions || [],
          createdAt: apiUser.created_at,
          lastLogin: apiUser.last_login,
          createdBy: apiUser.created_by,
          hasDefaultPassword: apiUser.has_default_password,
          passwordLastChanged: apiUser.password_last_changed,
          passwordExpiryDate: apiUser.password_expiry_date,
          studentId: apiUser.role_specific_id,
          teacherRegNo: apiUser.role_specific_id,
          parentCode: apiUser.role_specific_id,
          subsystem: apiUser.subsystem,
          branch: apiUser.branch,
          class: apiUser.class_name,
        }))
        setUsers(transformedUsers)
      } else {
        throw new Error('Invalid response format from API')
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users'
      setError(errorMessage)
      
      // If it's a database setup error, show a helpful message
      if (errorMessage.includes('Database not set up') || errorMessage.includes('Please run the database setup script')) {
        setError('Database not configured. Please run the setup script in Supabase SQL Editor.')
      }
      
      // Keep empty array if API fails
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUsers = async () => {
    await loadUsers()
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Subscribe to activity logger
  useEffect(() => {
    const unsubscribe = activityLogger.subscribe((activity: ActivityLogEntry) => {
      const newLog: ActivityLog = {
        id: activity.id,
        userId: activity.userId || 'system',
        userName: activity.userName || 'System',
        action: activity.action,
        details: activity.details,
        timestamp: activity.timestamp,
        ipAddress: '192.168.1.100', // Mock IP
        userAgent: navigator.userAgent
      }
      setActivityLogs(prev => [newLog, ...prev])
    })

    return unsubscribe
  }, [])

  const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'createdBy'>): Promise<{ success: boolean; password?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the real API endpoint
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          // createdBy will be optional - in production, get from auth context
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      if (result.success) {
        // Refresh users from database
        await loadUsers()
        logActivity('CREATE_USER', `Created new ${userData.role} account for ${userData.name} with default password`)
        return { success: true, password: result.password }
      } else {
        throw new Error(result.error || 'Failed to create user')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user'
      setError(errorMessage)
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the real API endpoint
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...userData,
          // updatedBy will be optional - in production, get from auth context
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user')
      }

      if (result.success) {
        // Refresh users from database
        await loadUsers()
        
        const user = users.find(u => u.id === userId)
        logActivity('UPDATE_USER', `Updated profile for ${user?.name}`, userId)
        return true
      } else {
        throw new Error(result.error || 'Failed to update user')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const deleteUser = async (userId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the real API endpoint
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }

      if (result.success) {
        const user = users.find(u => u.id === userId)
        // Refresh users from database
        await loadUsers()
        logActivity('DELETE_USER', `Deleted user account for ${user?.name}`)
        return true
      } else {
        throw new Error(result.error || 'Failed to delete user')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the real API endpoint
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          status,
          // updatedBy will be optional - in production, get from auth context
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user status')
      }

      if (result.success) {
        // Refresh users from database
        await loadUsers()
        
        const user = users.find(u => u.id === userId)
        logActivity('STATUS_CHANGE', `Changed status to ${status} for ${user?.name}`, userId)
        return true
      } else {
        throw new Error(result.error || 'Failed to update user status')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const resetUserPassword = async (userId: string): Promise<{ success: boolean; password?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the real API endpoint
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          // resetBy will be optional - in production, get from auth context
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password')
      }

      if (result.success) {
        // Refresh users from database
        await loadUsers()

        const user = users.find(u => u.id === userId)
        logActivity('PASSWORD_RESET', `Reset password for ${user?.name}`, userId)
        return { success: true, password: result.password }
      } else {
        throw new Error(result.error || 'Failed to reset password')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password'
      setError(errorMessage)
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  const getUserById = (userId: string): User | undefined => {
    return users.find(user => user.id === userId)
  }

  const searchUsers = (query: string): User[] => {
    if (!query) return users
    
    const lowercaseQuery = query.toLowerCase()
    return users.filter(user => 
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.studentId?.toLowerCase().includes(lowercaseQuery) ||
      user.teacherRegNo?.toLowerCase().includes(lowercaseQuery) ||
      user.parentCode?.toLowerCase().includes(lowercaseQuery)
    )
  }

  const filterUsers = (filters: UserFilters): User[] => {
    return users.filter(user => {
      if (filters.role && user.role !== filters.role) return false
      if (filters.status && user.status !== filters.status) return false
      if (filters.subsystem && user.subsystem !== filters.subsystem) return false
      if (filters.branch && user.branch !== filters.branch) return false
      if (filters.class && user.class !== filters.class) return false
      return true
    })
  }

  return (
    <UserManagementContext.Provider value={{
      users,
      activityLogs,
      createUser,
      updateUser,
      deleteUser,
      toggleUserStatus,
      resetUserPassword,
      getUserById,
      searchUsers,
      filterUsers,
      logActivity,
      isLoading,
      error,
      refreshUsers
    }}>
      {children}
    </UserManagementContext.Provider>
  )
}

export function useUserManagement() {
  const context = useContext(UserManagementContext)
  if (context === undefined) {
    throw new Error('useUserManagement must be used within a UserManagementProvider')
  }
  return context
}
