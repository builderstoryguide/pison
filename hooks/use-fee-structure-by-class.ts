"use client"

import { useQuery, useQueryClient } from '@tanstack/react-query'

// Query keys for React Query
export const feeStructureKeys = {
  all: ['fee-structure-by-class'] as const,
  byClass: (classId: string, academicYear: string, term: string) => 
    [...feeStructureKeys.all, classId, academicYear, term] as const,
}

// Type for fee structure response
export interface FeeStructureByClass {
  id: string
  name: string
  totalAmount: number
  academicYear: string
  term: string
  isActive: boolean
  dueDate: string
  createdAt: string
  updatedAt: string
}

// API helper function
async function fetchFeeStructureByClass(
  classId: string,
  academicYear: string,
  term: string
): Promise<FeeStructureByClass> {
  const params = new URLSearchParams({
    classId,
    academicYear,
    term,
  })

  const response = await fetch(`/api/bursar/fee-structures/by-class?${params.toString()}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    if (response.status === 404) {
      throw new Error(errorData.error || 'No fee structure found for the specified class, academic year, and term')
    }
    throw new Error(errorData.error || 'Failed to fetch fee structure')
  }

  const data = await response.json()
  return data
}

// Hook to fetch fee structure by class with caching
export function useFeeStructureByClass(
  classId: string | null | undefined,
  academicYear: string | null | undefined,
  term: string | null | undefined,
  options?: {
    enabled?: boolean
    staleTime?: number
    gcTime?: number
  }
) {
  const enabled = options?.enabled !== false && !!classId && !!academicYear && !!term

  return useQuery({
    queryKey: feeStructureKeys.byClass(
      classId || '',
      academicYear || '',
      term || ''
    ),
    queryFn: () => fetchFeeStructureByClass(classId!, academicYear!, term!),
    enabled,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes - data is fresh for this duration
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10 minutes - keep in cache for this duration
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid unnecessary requests
    refetchOnMount: true, // Refetch when component mounts if data is stale
    retry: (failureCount, error: any) => {
      // Don't retry on 404 errors (fee structure not found)
      if (error?.message?.includes('No fee structure found')) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
  })
}

// Prefetch fee structure by class
export function usePrefetchFeeStructureByClass() {
  const queryClient = useQueryClient()

  return (classId: string, academicYear: string, term: string) => {
    queryClient.prefetchQuery({
      queryKey: feeStructureKeys.byClass(classId, academicYear, term),
      queryFn: () => fetchFeeStructureByClass(classId, academicYear, term),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }
}

