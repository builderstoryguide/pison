"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from './use-toast'
import type { User, UserFilters } from '@/lib/user-management-context'

// Query keys for React Query
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  activityLogs: () => [...userKeys.all, 'activityLogs'] as const,
}

// API helper functions
async function fetchUsers(filters?: UserFilters): Promise<User[]> {
  const params = new URLSearchParams()
  if (filters?.role) params.append('role', filters.role)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.subsystem) params.append('subsystem', filters.subsystem)
  
  const response = await fetch(`/api/users?${params.toString()}`)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || errorData.error || 'Failed to fetch users')
  }
  
  const result = await response.json()
  
  if (!result.users) {
    throw new Error('Invalid response format')
  }
  
  // Transform API response to match User interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return result.users.map((apiUser: any) => ({
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
}

async function fetchUser(userId: string): Promise<User> {
  const response = await fetch(`/api/users?id=${userId}`)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || errorData.error || 'Failed to fetch user')
  }
  
  const result = await response.json()
  
  if (!result.user) {
    throw new Error('User not found')
  }
  
  // Transform API response
  const apiUser = result.user
  return {
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
  }
}

// Hook to fetch all users with caching
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => fetchUsers(filters),
    staleTime: 30000, // 30 seconds - data is fresh for this duration
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for this duration
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true,
  })
}

// Hook to fetch single user with caching
export function useUser(userId: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(userId || ''),
    queryFn: () => fetchUser(userId!),
    enabled: !!userId, // Only fetch if userId is provided
    staleTime: 60000, // 1 minute for individual users
    gcTime: 5 * 60 * 1000,
  })
}

// Prefetch users list
export function usePrefetchUsers() {
  const queryClient = useQueryClient()
  
  return (filters?: UserFilters) => {
    queryClient.prefetchQuery({
      queryKey: userKeys.list(filters),
      queryFn: () => fetchUsers(filters),
      staleTime: 30000,
    })
  }
}

// Prefetch single user
export function usePrefetchUser() {
  const queryClient = useQueryClient()
  
  return (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: userKeys.detail(userId),
      queryFn: () => fetchUser(userId),
      staleTime: 60000,
    })
  }
}

// Create user mutation with optimistic update
export function useCreateUser() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  
  return useMutation({
    mutationFn: async (userData: Omit<User, 'id' | 'createdAt' | 'createdBy'>) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }
      
      return result
    },
    onSuccess: (data) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      
      toastSuccess('User created', `Successfully created user with ID: ${data.user?.role_specific_id || 'N/A'}`)
      
      // Dispatch events for cross-context communication
      if (data.user?.role === 'student') {
        window.dispatchEvent(new CustomEvent('studentCreated', { 
          detail: { 
            studentId: data.user.role_specific_id,
            name: data.user.name,
            email: data.user.email 
          } 
        }))
      } else if (data.user?.role === 'teacher') {
        window.dispatchEvent(new CustomEvent('teacherCreated', { 
          detail: { 
            teacherId: data.user.role_specific_id,
            name: data.user.name,
            email: data.user.email 
          } 
        }))
      }
    },
    onError: (error: Error) => {
      toastError('Failed to create user', error.message)
    },
  })
}

// Update user mutation with optimistic update
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  
  return useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: Partial<User> }) => {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...userData }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user')
      }
      
      return result
    },
    onMutate: async ({ userId, userData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.detail(userId) })
      await queryClient.cancelQueries({ queryKey: userKeys.lists() })
      
      // Snapshot previous values
      const previousUser = queryClient.getQueryData<User>(userKeys.detail(userId))
      const previousUsers = queryClient.getQueryData<User[]>(userKeys.lists())
      
      // Optimistically update user detail
      if (previousUser) {
        queryClient.setQueryData<User>(userKeys.detail(userId), {
          ...previousUser,
          ...userData,
        })
      }
      
      // Optimistically update users list
      if (previousUsers) {
        queryClient.setQueryData<User[]>(userKeys.lists(), 
          previousUsers.map(u => u.id === userId ? { ...u, ...userData } : u)
        )
      }
      
      return { previousUser, previousUsers }
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(variables.userId), context.previousUser)
      }
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers)
      }
      toastError('Failed to update user', error.message)
    },
    onSuccess: () => {
      toastSuccess('User updated', 'Successfully updated user')
    },
    onSettled: (_data, _error, { userId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

// Delete user mutation with optimistic update
export function useDeleteUser() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }
      
      return result
    },
    onMutate: async (userId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() })
      
      // Snapshot previous value
      const previousUsers = queryClient.getQueryData<User[]>(userKeys.lists())
      
      // Optimistically remove user from list
      if (previousUsers) {
        queryClient.setQueryData<User[]>(userKeys.lists(), 
          previousUsers.filter(u => u.id !== userId)
        )
      }
      
      return { previousUsers }
    },
    onError: (error: Error, userId, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers)
      }
      toastError('Failed to delete user', error.message)
    },
    onSuccess: () => {
      toastSuccess('User deleted', 'Successfully deleted user')
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

// Bulk delete users mutation with optimistic update
export function useBulkDeleteUsers() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast()
  
  return useMutation({
    mutationFn: async (userIds: string[]) => {
      const response = await fetch('/api/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete users')
      }
      
      return result
    },
    onMutate: async (userIds) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() })
      
      // Snapshot previous value
      const previousUsers = queryClient.getQueryData<User[]>(userKeys.lists())
      
      // Optimistically remove users from list
      if (previousUsers) {
        queryClient.setQueryData<User[]>(userKeys.lists(), 
          previousUsers.filter(u => !userIds.includes(u.id))
        )
      }
      
      return { previousUsers }
    },
    onError: (error: Error, userIds, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers)
      }
      toastError('Bulk delete failed', error.message)
    },
    onSuccess: (result) => {
      if (result.errors && result.errors.length > 0) {
        toastWarning('Bulk delete completed with issues', `Deleted ${result.deletedCount} users. ${result.errors.length} errors occurred.`)
      } else {
        toastSuccess('Bulk delete successful', `Deleted ${result.deletedCount} users.`)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

// Toggle user status mutation with optimistic update
export function useToggleUserStatus() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  
  return useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'active' | 'inactive' | 'suspended' }) => {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user status')
      }
      
      return result
    },
    onMutate: async ({ userId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.detail(userId) })
      await queryClient.cancelQueries({ queryKey: userKeys.lists() })
      
      // Snapshot previous values
      const previousUser = queryClient.getQueryData<User>(userKeys.detail(userId))
      const previousUsers = queryClient.getQueryData<User[]>(userKeys.lists())
      
      // Optimistically update status
      if (previousUser) {
        queryClient.setQueryData<User>(userKeys.detail(userId), {
          ...previousUser,
          status,
        })
      }
      
      if (previousUsers) {
        queryClient.setQueryData<User[]>(userKeys.lists(), 
          previousUsers.map(u => u.id === userId ? { ...u, status } : u)
        )
      }
      
      return { previousUser, previousUsers }
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(variables.userId), context.previousUser)
      }
      if (context?.previousUsers) {
        queryClient.setQueryData(userKeys.lists(), context.previousUsers)
      }
      toastError('Failed to update status', error.message)
    },
    onSuccess: (_data, { status }) => {
      toastSuccess('Status updated', `User status changed to ${status}`)
    },
    onSettled: (_data, _error, { userId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

// Reset password mutation
export function useResetPassword() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password')
      }
      
      return result
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toastSuccess('Password reset', 'Password has been reset successfully')
    },
    onError: (error: Error) => {
      toastError('Failed to reset password', error.message)
    },
  })
}
