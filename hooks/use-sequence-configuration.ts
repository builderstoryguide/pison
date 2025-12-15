"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface SequenceConfiguration {
  id: string
  academic_year: string
  term?: string | null
  use_fixed_sequences: boolean
  default_max_marks: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Sequence {
  id: string
  academic_year: string
  term: string
  sequence_number: number
  sequence_name: string
  start_date?: string | null
  end_date?: string | null
  max_marks: number
  is_active: boolean
}

export interface SequenceAssignment {
  sequenceNumber: number
  term: string
}

export interface SequenceConfigurationResponse {
  success: boolean
  configuration: SequenceConfiguration | null
  sequences: Sequence[]
  sequencesByTerm?: Record<string, Sequence[]>
  academicYear: string
}

export interface UpdateSequenceConfigurationRequest {
  academicYear: string
  numberOfSequences: number
  defaultMaxMarks?: number
  useFixedSequences?: boolean
  sequenceAssignments?: SequenceAssignment[]
}

export interface UpdateSequenceConfigurationResponse {
  success: boolean
  configuration: SequenceConfiguration
  sequences: Sequence[]
  sequencesByTerm?: Record<string, Sequence[]>
  message?: string
  error?: string
}

export interface ReassignSequenceRequest {
  academicYear: string
  sequenceNumber: number
  term: string
}

export interface ReassignSequenceResponse {
  success: boolean
  sequence: Sequence
  message?: string
  error?: string
}

/**
 * Fetch sequence configuration for an academic year
 */
export function useSequenceConfiguration(academicYear: string | null) {
  return useQuery<SequenceConfigurationResponse>({
    queryKey: ['sequence-configuration', academicYear],
    queryFn: async () => {
      if (!academicYear) {
        throw new Error('Academic year is required')
      }

      // Get user ID from localStorage for authentication
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
      let currentUser = null
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser)
        } catch {
          // Invalid JSON in localStorage, proceed without user
          console.warn('Invalid user data in localStorage')
        }
      }
      
      const headers: Record<string, string> = {}
      
      // Add X-User-Id header if user is logged in
      if (currentUser?.id) {
        headers['X-User-Id'] = currentUser.id
      }
      const response = await fetch(
        `/api/sequences/configuration?academicYear=${encodeURIComponent(academicYear)}`,
        { headers }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch sequence configuration')
      }

      return response.json()
    },
    enabled: !!academicYear,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Return all query states including isRefetching
  })
}

/**
 * Update sequence configuration (admin only)
 */
export function useUpdateSequenceConfiguration() {
  const queryClient = useQueryClient()

  return useMutation<UpdateSequenceConfigurationResponse, Error, UpdateSequenceConfigurationRequest>({
    mutationFn: async (data: UpdateSequenceConfigurationRequest) => {
      // Get user ID from localStorage for authentication
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
      const currentUser = storedUser ? JSON.parse(storedUser) : null
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // Add X-User-Id header if user is logged in
      if (currentUser?.id) {
        headers['X-User-Id'] = currentUser.id
      }

      const response = await fetch('/api/sequences/configuration', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Extract error message properly (handle nested error objects)
        let errorMessage = 'Failed to update sequence configuration'
        if (errorData?.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error
          } else if (errorData.error?.message) {
            errorMessage = errorData.error.message
          } else if (errorData.error?.error) {
            errorMessage = errorData.error.error
          }
        }
        
        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Log successful mutation
      if (data.success) {
        console.log('✅ Sequence configuration mutation succeeded:', {
          academicYear: variables.academicYear,
          numberOfSequences: variables.numberOfSequences,
          sequencesCount: data.sequences?.length || 0,
          message: data.message
        })
      }
      
      // Update the query cache with the returned data immediately
      // This ensures subsequent reads get the correct data without waiting for a refetch
      if (data.success) {
        queryClient.setQueryData(
          ['sequence-configuration', variables.academicYear],
          data
        )
      }
      
      // Also invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['sequence-configuration', variables.academicYear] })
      queryClient.invalidateQueries({ queryKey: ['sequences', variables.academicYear] })
      queryClient.invalidateQueries({ queryKey: ['grade-entry-status'] })
    },
  })
}

/**
 * Reassign a sequence to a different term (admin only)
 */
export function useReassignSequence() {
  const queryClient = useQueryClient()

  return useMutation<ReassignSequenceResponse, Error, ReassignSequenceRequest>({
    mutationFn: async (data: ReassignSequenceRequest) => {
      // Get user ID from localStorage for authentication
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
      const currentUser = storedUser ? JSON.parse(storedUser) : null
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // Add X-User-Id header if user is logged in
      if (currentUser?.id) {
        headers['X-User-Id'] = currentUser.id
      }
      
      const response = await fetch('/api/sequences/assign', {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Extract error message properly (handle nested error objects)
        let errorMessage = 'Failed to reassign sequence'
        if (errorData?.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error
          } else if (errorData.error?.message) {
            errorMessage = errorData.error.message
          } else if (errorData.error?.error) {
            errorMessage = errorData.error.error
          }
        }
        
        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: async (data, variables) => {
      // Get user ID for the fetch request
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
      const currentUser = storedUser ? JSON.parse(storedUser) : null
      
      const headers: Record<string, string> = {}
      if (currentUser?.id) {
        headers['X-User-Id'] = currentUser.id
      }

      // Immediately fetch updated configuration to update cache optimistically
      // This ensures the UI reflects the change immediately without waiting for invalidation refetch
      try {
        const response = await fetch(
          `/api/sequences/configuration?academicYear=${encodeURIComponent(variables.academicYear)}`,
          { headers }
        )
        if (response.ok) {
          const updatedData = await response.json()
          // Update the query cache with the fresh data immediately
          queryClient.setQueryData(
            ['sequence-configuration', variables.academicYear],
            updatedData
          )
        }
      } catch (error) {
        // If fetch fails, we'll still invalidate queries below to trigger a refetch
        console.error('Error fetching updated sequence configuration:', error)
      }

      // Still invalidate related queries to trigger background refetch for consistency
      // This ensures the cache stays in sync with the database
      queryClient.invalidateQueries({ queryKey: ['sequence-configuration', variables.academicYear] })
      queryClient.invalidateQueries({ queryKey: ['sequences', variables.academicYear] })
      queryClient.invalidateQueries({ queryKey: ['grade-entry-status'] })
    },
  })
}
