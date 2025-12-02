"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from './use-toast'

// TypeScript interfaces matching teacher-management-context
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
  qualification: string
  specialization: string
  experience: number
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
  qualification: string
  specialization: string
  experience: number
  salary: number
  startDate: string
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  status: "active" | "inactive"
}

// Query keys
export const teacherKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...teacherKeys.lists(), filters] as const,
  details: () => [...teacherKeys.all, 'detail'] as const,
  detail: (id: string) => [...teacherKeys.details(), id] as const,
}

// API helper functions
async function fetchTeachers(): Promise<Teacher[]> {
  const response = await fetch('/api/teachers')
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || errorData.error || 'Failed to fetch teachers')
  }
  
  const result = await response.json()
  return result.teachers || result || []
}

async function fetchTeacher(teacherId: string): Promise<Teacher> {
  const response = await fetch(`/api/teachers?id=${teacherId}`)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || errorData.error || 'Failed to fetch teacher')
  }
  
  const result = await response.json()
  return result.teacher || result
}

// Hooks
export function useTeachers(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: teacherKeys.list(filters),
    queryFn: () => fetchTeachers(),
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useTeacher(teacherId: string | undefined) {
  return useQuery({
    queryKey: teacherKeys.detail(teacherId || ''),
    queryFn: () => fetchTeacher(teacherId!),
    enabled: !!teacherId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
  })
}

export function usePrefetchTeacher() {
  const queryClient = useQueryClient()
  
  return (teacherId: string) => {
    queryClient.prefetchQuery({
      queryKey: teacherKeys.detail(teacherId),
      queryFn: () => fetchTeacher(teacherId),
      staleTime: 60000,
    })
  }
}

export function useCreateTeacher() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  
  return useMutation({
    mutationFn: async (teacherData: TeacherFormData) => {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create teacher')
      }
      
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() })
      toastSuccess('Teacher created', `Successfully created teacher: ${data.teacherId || 'N/A'}`)
      
      // Dispatch event for cross-context communication
      window.dispatchEvent(new CustomEvent('teacherCreated', { 
        detail: { teacherId: data.teacherId, teacher: data.teacher } 
      }))
    },
    onError: (error: Error) => {
      toastError('Failed to create teacher', error.message)
    },
  })
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  
  return useMutation({
    mutationFn: async ({ id, teacherData }: { id: string; teacherData: Partial<Teacher> }) => {
      const response = await fetch(`/api/teachers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...teacherData }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update teacher')
      }
      
      return result
    },
    onMutate: async ({ id, teacherData }) => {
      await queryClient.cancelQueries({ queryKey: teacherKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: teacherKeys.lists() })
      
      const previousTeacher = queryClient.getQueryData<Teacher>(teacherKeys.detail(id))
      const previousTeachers = queryClient.getQueryData<Teacher[]>(teacherKeys.lists())
      
      if (previousTeacher) {
        queryClient.setQueryData<Teacher>(teacherKeys.detail(id), {
          ...previousTeacher,
          ...teacherData,
        })
      }
      
      if (previousTeachers) {
        queryClient.setQueryData<Teacher[]>(teacherKeys.lists(), 
          previousTeachers.map(t => t.id === id ? { ...t, ...teacherData } : t)
        )
      }
      
      return { previousTeacher, previousTeachers }
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousTeacher) {
        queryClient.setQueryData(teacherKeys.detail(variables.id), context.previousTeacher)
      }
      if (context?.previousTeachers) {
        queryClient.setQueryData(teacherKeys.lists(), context.previousTeachers)
      }
      toastError('Failed to update teacher', error.message)
    },
    onSuccess: () => {
      toastSuccess('Teacher updated', 'Successfully updated teacher')
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() })
    },
  })
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/teachers?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete teacher')
      }
      
      return result
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: teacherKeys.lists() })
      
      const previousTeachers = queryClient.getQueryData<Teacher[]>(teacherKeys.lists())
      
      if (previousTeachers) {
        queryClient.setQueryData<Teacher[]>(teacherKeys.lists(), 
          previousTeachers.filter(t => t.id !== id)
        )
      }
      
      return { previousTeachers }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previousTeachers) {
        queryClient.setQueryData(teacherKeys.lists(), context.previousTeachers)
      }
      toastError('Failed to delete teacher', error.message)
    },
    onSuccess: () => {
      toastSuccess('Teacher deleted', 'Successfully deleted teacher')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() })
    },
  })
}
