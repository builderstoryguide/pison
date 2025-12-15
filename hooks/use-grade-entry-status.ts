"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-context"

export interface SequenceStatus {
  sequenceId: string
  sequenceName: string
  sequenceNumber: number
  isCompleted: boolean
  completedDate?: string
  studentCount: number
  enteredCount: number
}

export interface ClassSubjectStatus {
  classId: string
  className: string
  subjectId: string
  subjectName: string
  sequences: SequenceStatus[]
}

export interface GradeEntryStatusResponse {
  success: boolean
  data: ClassSubjectStatus[]
  academicYear: string
  term: string
  totalClasses: number
  totalSequences: number
  error?: string
}

interface UseGradeEntryStatusOptions {
  classId?: string
  subjectId?: string
  academicYear?: string
  term?: string
  enabled?: boolean
}

export function useGradeEntryStatus(options: UseGradeEntryStatusOptions = {}) {
  const { user } = useAuth()
  const {
    classId,
    subjectId,
    academicYear,
    term,
    enabled = true
  } = options

  return useQuery<GradeEntryStatusResponse>({
    queryKey: ['grade-entry-status', user?.id, classId, subjectId, academicYear, term],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated")
      }

      const params = new URLSearchParams({
        teacherId: user.id,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        ...(academicYear && { academicYear }),
        ...(term && { term })
      })

      const response = await fetch(`/api/grades/entry-status?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch grade entry status')
      }

      const data: GradeEntryStatusResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch grade entry status')
      }

      return data
    },
    enabled: enabled && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - grade entry status changes frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Use cached data if available
  })
}

/**
 * Hook to get status for a specific class-subject combination
 */
export function useClassSubjectStatus(classId: string, subjectId: string, options: Omit<UseGradeEntryStatusOptions, 'classId' | 'subjectId'> = {}) {
  const query = useGradeEntryStatus({
    ...options,
    classId,
    subjectId
  })

  const classSubjectStatus = query.data?.data.find(
    item => item.classId === classId && item.subjectId === subjectId
  )

  return {
    ...query,
    classSubjectStatus,
    sequences: classSubjectStatus?.sequences || []
  }
}

/**
 * Hook to get overall completion statistics
 */
export function useGradeEntryStats(options: UseGradeEntryStatusOptions = {}) {
  const query = useGradeEntryStatus(options)

  const stats = query.data?.data.reduce((acc, item) => {
    const completed = item.sequences.filter(s => s.isCompleted).length
    const total = item.sequences.length
    acc.totalClasses = (acc.totalClasses || 0) + 1
    acc.totalSequences = (acc.totalSequences || 0) + total
    acc.completedSequences = (acc.completedSequences || 0) + completed
    acc.pendingSequences = (acc.pendingSequences || 0) + (total - completed)
    return acc
  }, {
    totalClasses: 0,
    totalSequences: 0,
    completedSequences: 0,
    pendingSequences: 0
  }) || {
    totalClasses: 0,
    totalSequences: 0,
    completedSequences: 0,
    pendingSequences: 0
  }

  const completionPercentage = stats.totalSequences > 0
    ? Math.round((stats.completedSequences / stats.totalSequences) * 100)
    : 0

  return {
    ...query,
    stats: {
      ...stats,
      completionPercentage
    }
  }
}
