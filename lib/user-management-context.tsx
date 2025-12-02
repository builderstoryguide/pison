"use client"

import React, { createContext, useContext} from 'react'
import { generateDefaultPassword } from './password-utils'
import { activityLogger, ActivityLogEntry } from './activity-logger'
import {
  useUsers,
  useUser,
  useCreateUser as useCreateUserMutation,
  useUpdateUser as useUpdateUserMutation,
  useDeleteUser as useDeleteUserMutation,
  useBulkDeleteUsers as useBulkDeleteUsersMutation,
  useToggleUserStatus as useToggleUserStatusMutation,
  useResetPassword as useResetPasswordMutation,
  usePrefetchUser,
  usePrefetchUsers,
} from '@/hooks/use-users'

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
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'createdBy'>) => Promise<{ success: boolean; password?: string; roleSpecificId?: string }>
  updateUser: (userId: string, userData: Partial<User>) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>
  bulkDeleteUsers: (userIds: string[]) => Promise<{ success: boolean; deletedCount: number; errors: string[] }>
  toggleUserStatus: (userId: string, status: 'active' | 'inactive' | 'suspended') => Promise<boolean>
  resetUserPassword: (userId: string) => Promise<{ success: boolean; password?: string }>
  getUserById: (userId: string) => User | undefined
  searchUsers: (query: string) => User[]
  filterUsers: (filters: UserFilters) => User[]
  logActivity: (action: string, details: string, userId?: string) => void
  isLoading: boolean
  isLoadingLogs: boolean
  error: string | null
  refreshUsers: () => Promise<void>
  refreshActivityLogs: () => Promise<void>
  loadUsers: (forceRefresh?: boolean) => Promise<void>
  prefetchUser: (userId: string) => void
  prefetchUsers: (filters?: UserFilters) => void
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
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
]

export function UserManagementProvider({ children }: { children: React.ReactNode }) {
  const [activityLogs, setActivityLogs] = React.useState<ActivityLog[]>(mockActivityLogs)

  // Use React Query hooks
  const { data: users = [], isLoading, error: queryError, refetch } = useUsers()
  const createUserMutation = useCreateUserMutation()
  const updateUserMutation = useUpdateUserMutation()
  const deleteUserMutation = useDeleteUserMutation()
  const bulkDeleteMutation = useBulkDeleteUsersMutation()
  const toggleStatusMutation = useToggleUserStatusMutation()
  const resetPasswordMutation = useResetPasswordMutation()
  const prefetchUserFn = usePrefetchUser()
  const prefetchUsersFn = usePrefetchUsers()

  const error = queryError ? (queryError as Error).message : null

  const logActivity = (action: string, details: string, userId?: string) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
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

  // Subscribe to activity logger
  React.useEffect(() => {
    const unsubscribe = activityLogger.subscribe((activity: ActivityLogEntry) => {
      const newLog: ActivityLog = {
        id: activity.id,
        userId: activity.userId || 'system',
        userName: activity.userName || 'System',
        action: activity.action,
        details: activity.details,
        timestamp: activity.timestamp,
        ipAddress: '192.168.1.100',
        userAgent: navigator.userAgent
      }
      setActivityLogs(prev => [newLog, ...prev])
    })

    return unsubscribe
  }, [])

  const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'createdBy'>): Promise<{ success: boolean; password?: string; roleSpecificId?: string }> => {
    try {
      const result = await createUserMutation.mutateAsync(userData)
      if (result.success) {
        logActivity('CREATE_USER', `Created new ${userData.role} account for ${userData.name}`)
        return {
          success: true,
          password: result.password,
          roleSpecificId: result.user?.role_specific_id
        }
      }
      return { success: false }
    } catch {
      return { success: false }
    }
  }

  const updateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
    try {
      await updateUserMutation.mutateAsync({ userId, userData })
      const user = users.find(u => u.id === userId)
      logActivity('UPDATE_USER', `Updated profile for ${user?.name}`, userId)
      return true
    } catch {
      return false
    }
  }

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const user = users.find(u => u.id === userId)
      await deleteUserMutation.mutateAsync(userId)
      logActivity('DELETE_USER', `Deleted user account for ${user?.name}`)
      return true
    } catch {
      return false
    }
  }

  const bulkDeleteUsers = async (userIds: string[]): Promise<{ success: boolean; deletedCount: number; errors: string[] }> => {
    try {
      const deletedUsers = users.filter(u => userIds.includes(u.id))
      const userNames = deletedUsers.map(u => u.name).join(', ')
      
      const result = await bulkDeleteMutation.mutateAsync(userIds)
      
      if (result.success) {
        logActivity('BULK_DELETE_USERS', `Bulk deleted ${result.deletedCount} users: ${userNames}`)
        return {
          success: true,
          deletedCount: result.deletedCount,
          errors: result.errors || []
        }
      }
      return {
        success: false,
        deletedCount: 0,
        errors: [result.error || 'Failed to delete users']
      }
    } catch (err) {
      return {
        success: false,
        deletedCount: 0,
        errors: [err instanceof Error ? err.message : 'Failed to delete users']
      }
    }
  }

  const toggleUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<boolean> => {
    try {
      await toggleStatusMutation.mutateAsync({ userId, status })
      const user = users.find(u => u.id === userId)
      logActivity('STATUS_CHANGE', `Changed status to ${status} for ${user?.name}`, userId)
      return true
    } catch {
      return false
    }
  }

  const resetUserPassword = async (userId: string): Promise<{ success: boolean; password?: string }> => {
    try {
      const result = await resetPasswordMutation.mutateAsync(userId)
      const user = users.find(u => u.id === userId)
      logActivity('PASSWORD_RESET', `Reset password for ${user?.name}`, userId)
      return { success: true, password: result.password }
    } catch {
      return { success: false }
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

  const refreshUsers = async () => {
    await refetch()
  }

  const refreshActivityLogs = async () => {
    // Activity logs are mocked for now
    // In production, fetch from API
  }

  const loadUsers = async (forceRefresh = false) => {
    if (forceRefresh) {
      await refetch()
    }
  }

  const prefetchUser = (userId: string) => {
    prefetchUserFn(userId)
  }

  const prefetchUsers = (filters?: UserFilters) => {
    prefetchUsersFn(filters)
  }

  return (
    <UserManagementContext.Provider value={{
      users,
      activityLogs,
      createUser,
      updateUser,
      deleteUser,
      bulkDeleteUsers,
      toggleUserStatus,
      resetUserPassword,
      getUserById,
      searchUsers,
      filterUsers,
      logActivity,
      isLoading: isLoading || createUserMutation.isPending || updateUserMutation.isPending || deleteUserMutation.isPending || bulkDeleteMutation.isPending || toggleStatusMutation.isPending || resetPasswordMutation.isPending,
      isLoadingLogs: false,
      error,
      refreshUsers,
      refreshActivityLogs,
      loadUsers,
      prefetchUser,
      prefetchUsers,
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
