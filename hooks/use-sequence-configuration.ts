"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { TermSequenceCounts } from "@/lib/sequence-term-mapping"

export interface SequenceConfiguration {
  id: string
  academic_year: string
  term?: string | null
  use_fixed_sequences: boolean
  default_max_marks: number
  total_sequences?: number
  term_sequence_counts?: TermSequenceCounts
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

export interface SequenceGradeUsage {
  gradeCount: number
  assessmentCount: number
}

export interface SequenceConfigurationResponse {
  success: boolean
  configuration: SequenceConfiguration | null
  totalSequences: number
  termSequenceCounts: TermSequenceCounts
  sequences: Sequence[]
  sequencesByTerm?: Record<string, Sequence[]>
  academicYear: string
  sequence6Usage?: SequenceGradeUsage
}

export interface UpdateSequenceConfigurationRequest {
  academicYear: string
  totalSequences: 5 | 6
  termSequenceCounts: TermSequenceCounts
  defaultMaxMarks?: number
  useFixedSequences?: boolean
  /** @deprecated use totalSequences */
  numberOfSequences?: number
  sequenceAssignments?: SequenceAssignment[]
}

export interface UpdateSequenceConfigurationResponse {
  success: boolean
  configuration: SequenceConfiguration
  totalSequences: number
  termSequenceCounts: TermSequenceCounts
  sequences: Sequence[]
  sequencesByTerm?: Record<string, Sequence[]>
  sequence6Usage?: SequenceGradeUsage
  warning?: string
  message?: string
  error?: string
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  if (typeof window === 'undefined') return headers
  try {
    const storedUser = localStorage.getItem('school_user')
    if (storedUser) {
      const currentUser = JSON.parse(storedUser)
      if (currentUser?.id) headers['X-User-Id'] = currentUser.id
    }
  } catch {
    console.warn('Invalid user data in localStorage')
  }
  return headers
}

export function useSequenceConfiguration(academicYear: string | null) {
  return useQuery<SequenceConfigurationResponse>({
    queryKey: ['sequence-configuration', academicYear],
    queryFn: async () => {
      if (!academicYear) {
        throw new Error('Academic year is required')
      }

      const response = await fetch(
        `/api/sequences/configuration?academicYear=${encodeURIComponent(academicYear)}`,
        { headers: getAuthHeaders() }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch sequence configuration')
      }

      return response.json()
    },
    enabled: !!academicYear,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateSequenceConfiguration() {
  const queryClient = useQueryClient()

  return useMutation<UpdateSequenceConfigurationResponse, Error, UpdateSequenceConfigurationRequest>({
    mutationFn: async (data: UpdateSequenceConfigurationRequest) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      }

      const response = await fetch('/api/sequences/configuration', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          academicYear: data.academicYear,
          totalSequences: data.totalSequences,
          termSequenceCounts: data.termSequenceCounts,
          defaultMaxMarks: data.defaultMaxMarks,
          useFixedSequences: data.useFixedSequences,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        let errorMessage = 'Failed to update sequence configuration'
        if (errorData?.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error
          } else if (errorData.error?.message) {
            errorMessage = errorData.error.message
          }
        }
        throw new Error(errorMessage)
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      if (data.warning) {
        console.warn('[sequence-configuration]', data.warning)
      }
      if (data.success) {
        queryClient.setQueryData(['sequence-configuration', variables.academicYear], {
          success: true,
          configuration: data.configuration,
          totalSequences: data.totalSequences,
          termSequenceCounts: data.termSequenceCounts,
          sequences: data.sequences,
          sequencesByTerm: data.sequencesByTerm,
          academicYear: variables.academicYear,
          sequence6Usage: data.sequence6Usage,
        } satisfies SequenceConfigurationResponse)
      }
      queryClient.invalidateQueries({ queryKey: ['sequence-configuration', variables.academicYear] })
      queryClient.invalidateQueries({ queryKey: ['sequences', variables.academicYear] })
      queryClient.invalidateQueries({ queryKey: ['grade-entry-status'] })
    },
  })
}
