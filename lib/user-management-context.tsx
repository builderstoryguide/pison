"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { generateDefaultPassword } from './password-utils'

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
}

export interface UserFilters {
  role?: string
  status?: string
  subsystem?: string
  branch?: string
  class?: string
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined)

// Mock users database
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. Marie Ngozi',
    email: 'admin@gbhs-yaounde.cm',
    role: 'admin',
    status: 'active',
    permissions: ['all'],
    subsystem: 'english',
    phone: '+237 677 123 456',
    address: 'Yaoundé, Cameroon',
    createdAt: '2024-01-15T08:00:00Z',
    lastLogin: '2024-01-20T14:30:00Z',
    createdBy: 'system'
  },
  {
    id: '2',
    name: 'Paul Biya Mbeki',
    email: 'p.mbeki@gbhs-yaounde.cm',
    role: 'teacher',
    status: 'active',
    teacherRegNo: 'TCH2024001',
    permissions: ['manage_classes', 'grade_students', 'mark_attendance'],
    subsystem: 'english',
    phone: '+237 677 234 567',
    address: 'Douala, Cameroon',
    dateOfBirth: '1985-03-15',
    gender: 'male',
    createdAt: '2024-01-16T09:00:00Z',
    lastLogin: '2024-01-20T13:45:00Z',
    createdBy: '1'
  },
  {
    id: '3',
    name: 'Amina Fru',
    email: 'amina.fru@student.gbhs-yaounde.cm',
    role: 'student',
    status: 'active',
    studentId: 'STU2024001',
    branch: 'grammar',
    class: 'Form 5A',
    permissions: ['view_grades', 'view_schedule'],
    subsystem: 'english',
    phone: '+237 677 345 678',
    address: 'Bamenda, Cameroon',
    dateOfBirth: '2006-08-22',
    gender: 'female',
    createdAt: '2024-01-17T10:00:00Z',
    lastLogin: '2024-01-20T12:15:00Z',
    createdBy: '1'
  },
  {
    id: '4',
    name: 'John Fru',
    email: 'john.fru@parent.gbhs-yaounde.cm',
    role: 'parent',
    status: 'active',
    parentCode: 'PAR2024001',
    permissions: ['view_child_progress', 'communicate_teachers'],
    subsystem: 'english',
    phone: '+237 677 456 789',
    address: 'Bamenda, Cameroon',
    createdAt: '2024-01-17T11:00:00Z',
    lastLogin: '2024-01-19T16:20:00Z',
    createdBy: '1'
  },
  {
    id: '5',
    name: 'Grace Tabi',
    email: 'g.tabi@gbhs-yaounde.cm',
    role: 'bursar',
    status: 'active',
    permissions: ['manage_finances', 'track_payments', 'generate_reports'],
    subsystem: 'english',
    phone: '+237 677 567 890',
    address: 'Yaoundé, Cameroon',
    dateOfBirth: '1980-11-10',
    gender: 'female',
    createdAt: '2024-01-18T08:30:00Z',
    lastLogin: '2024-01-20T09:00:00Z',
    createdBy: '1'
  }
]

// Mock activity logs
const mockActivityLogs: ActivityLog[] = [
  {
    id: '1',
    userId: '2',
    userName: 'Paul Biya Mbeki',
    action: 'LOGIN',
    details: 'User logged in successfully',
    timestamp: '2024-01-20T13:45:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  {
    id: '2',
    userId: '3',
    userName: 'Amina Fru',
    action: 'VIEW_GRADES',
    details: 'Viewed Mathematics grades',
    timestamp: '2024-01-20T12:15:00Z',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
  },
  {
    id: '3',
    userId: '1',
    userName: 'Dr. Marie Ngozi',
    action: 'CREATE_USER',
    details: 'Created new teacher account for Jean Claude',
    timestamp: '2024-01-20T10:30:00Z',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  },
  {
    id: '4',
    userId: '5',
    userName: 'Grace Tabi',
    action: 'PAYMENT_RECORDED',
            details: 'Recorded fee payment of 50,000 XAF',
    timestamp: '2024-01-20T09:00:00Z',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
]

export function UserManagementProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(mockUsers)
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

  const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'createdBy'>): Promise<{ success: boolean; password?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      // Generate default password for new user
      const defaultPassword = generateDefaultPassword(userData.role)
      const passwordExpiryDate = new Date()
      passwordExpiryDate.setDate(passwordExpiryDate.getDate() + 30) // Expires in 30 days

      const newUser: User = {
        ...userData,
        id: generateId(),
        createdAt: new Date().toISOString(),
        createdBy: '1', // Current admin user
        hasDefaultPassword: true,
        passwordLastChanged: new Date().toISOString(),
        passwordExpiryDate: passwordExpiryDate.toISOString()
      }

      setUsers(prev => [...prev, newUser])
      logActivity('CREATE_USER', `Created new ${userData.role} account for ${userData.name} with default password`)
      return { success: true, password: defaultPassword }
    } catch (err) {
      setError('Failed to create user')
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...userData } : user
      ))
      
      const user = users.find(u => u.id === userId)
      logActivity('UPDATE_USER', `Updated profile for ${user?.name}`, userId)
      return true
    } catch (err) {
      setError('Failed to update user')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const deleteUser = async (userId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const user = users.find(u => u.id === userId)
      setUsers(prev => prev.filter(user => user.id !== userId))
      logActivity('DELETE_USER', `Deleted user account for ${user?.name}`)
      return true
    } catch (err) {
      setError('Failed to delete user')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status } : user
      ))
      
      const user = users.find(u => u.id === userId)
      logActivity('STATUS_CHANGE', `Changed status to ${status} for ${user?.name}`, userId)
      return true
    } catch (err) {
      setError('Failed to update user status')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const resetUserPassword = async (userId: string): Promise<{ success: boolean; password?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const user = users.find(u => u.id === userId)
      if (!user) {
        setError('User not found')
        return { success: false }
      }

      // Generate new temporary password
      const newPassword = generateDefaultPassword(user.role)
      const passwordExpiryDate = new Date()
      passwordExpiryDate.setDate(passwordExpiryDate.getDate() + 7) // Expires in 7 days

      // Update user with new password info
      setUsers(prev => prev.map(u => 
        u.id === userId ? {
          ...u,
          hasDefaultPassword: true,
          passwordLastChanged: new Date().toISOString(),
          passwordExpiryDate: passwordExpiryDate.toISOString()
        } : u
      ))

      logActivity('PASSWORD_RESET', `Reset password for ${user.name}`, userId)
      return { success: true, password: newPassword }
    } catch (err) {
      setError('Failed to reset password')
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
      error
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
