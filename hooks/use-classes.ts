"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from './use-toast'

// TypeScript interfaces matching class-management-context
export interface ClassSubject {
  subjectId: string
  subjectName: string
  isTradeSubject: boolean
}

export interface ClassData {
  id: string
  name: string
  level: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  capacity: number
  currentEnrollment: number
  classTeacher: string
  subjects: ClassSubject[]
  schedule: Array<{
    day: string
    periods: Array<{
      time: string
      subject: string
      teacher: string
    }>
  }>
  academicYear: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface ClassFormData {
  name: string
  level: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  capacity: number
  classTeacher: string
  subjects: ClassSubject[]
  academicYear: string
}

// Query keys
export const classKeys = {
  all: ['classes'] as const,
  lists: () => [...classKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...classKeys.lists(), filters] as const,
  details: () => [...classKeys.all, 'detail'] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
}

// API helper functions
async function fetchClasses(): Promise<ClassData[]> {
  const response = await fetch('/api/classes')
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || errorData.error || 'Failed to fetch classes')
  }
  
  const result = await response.json()
  return result.classes || result || []
}

async function fetchClass(classId: string): Promise<ClassData> {
  const response = await fetch(`/api/classes?id=${classId}`)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || errorData.error || 'Failed to fetch class')
  }
  
  const result = await response.json()
  return result.class || result
}

// Hooks
export function useClasses(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: classKeys.list(filters),
    queryFn: () => fetchClasses(),
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useClass(classId: string | undefined) {
  return useQuery({
    queryKey: classKeys.detail(classId || ''),
    queryFn: () => fetchClass(classId!),
    enabled: !!classId,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
  })
}

export function usePrefetchClass() {
  const queryClient = useQueryClient()
  
  return (classId: string) => {
    queryClient.prefetchQuery({
      queryKey: classKeys.detail(classId),
      queryFn: () => fetchClass(classId),
      staleTime: 60000,
    })
  }
}

export function useCreateClass() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  
  return useMutation({
    mutationFn: async (classData: ClassFormData) => {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classData),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create class')
      }
      
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() })
      toastSuccess('Class created', `Successfully created class: ${data.classId || 'N/A'}`)
    },
    onError: (error: Error) => {
      toastError('Failed to create class', error.message)
    },
  })
}

export function useUpdateClass() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  
  return useMutation({
    mutationFn: async ({ id, classData }: { id: string; classData: Partial<ClassData> }) => {
      const response = await fetch(`/api/classes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...classData }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update class')
      }
      
      return result
    },
    onMutate: async ({ id, classData }) => {
      await queryClient.cancelQueries({ queryKey: classKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: classKeys.lists() })
      
      const previousClass = queryClient.getQueryData<ClassData>(classKeys.detail(id))
      const previousClasses = queryClient.getQueryData<ClassData[]>(classKeys.lists())
      
      if (previousClass) {
        queryClient.setQueryData<ClassData>(classKeys.detail(id), {
          ...previousClass,
          ...classData,
        })
      }
      
      if (previousClasses) {
        queryClient.setQueryData<ClassData[]>(classKeys.lists(), 
          previousClasses.map(c => c.id === id ? { ...c, ...classData } : c)
        )
      }
      
      return { previousClass, previousClasses }
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousClass) {
        queryClient.setQueryData(classKeys.detail(variables.id), context.previousClass)
      }
      if (context?.previousClasses) {
        queryClient.setQueryData(classKeys.lists(), context.previousClasses)
      }
      toastError('Failed to update class', error.message)
    },
    onSuccess: () => {
      toastSuccess('Class updated', 'Successfully updated class')
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: classKeys.lists() })
    },
  })
}

export function useDeleteClass() {
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/classes?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete class')
      }
      
      return result
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: classKeys.lists() })
      
      const previousClasses = queryClient.getQueryData<ClassData[]>(classKeys.lists())
      
      if (previousClasses) {
        queryClient.setQueryData<ClassData[]>(classKeys.lists(), 
          previousClasses.filter(c => c.id !== id)
        )
      }
      
      return { previousClasses }
    },
    onError: (error: Error, _id, context) => {
      if (context?.previousClasses) {
        queryClient.setQueryData(classKeys.lists(), context.previousClasses)
      }
      toastError('Failed to delete class', error.message)
    },
    onSuccess: () => {
      toastSuccess('Class deleted', 'Successfully deleted class')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() })
    },
  })
}
