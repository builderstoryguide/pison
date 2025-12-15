"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-context"

export interface Subject {
  id: number | string
  name: string
  code: string
  coefficient?: number
}

export interface ClassAssignment {
  id: number | string
  name: string
  code?: string
  level: string
  branch: string
  subsystem: string
  studentCount?: number
  currentEnrollment?: number
  subjects?: Subject[]
  academicYear?: string
  capacity?: number
  assignmentType?: string
  status?: string
  [key: string]: unknown
}

interface AssignmentsResponse {
  ok: boolean
  classes: ClassAssignment[]
  error?: string
}

export function useTeacherAssignments(summaryOnly = false) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['teacher-assignments', user?.id, { summaryOnly }],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated")
      
      const params = new URLSearchParams()
      if (summaryOnly) params.append('summaryOnly', 'true')
      // Ensure we get full details when summaryOnly is false
      if (!summaryOnly) {
        params.append('includeDetails', 'false') // We don't need full student details, just counts
      }
      
      const response = await fetch(`/api/teachers/${user.id}/assignments?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch teacher assignments')
      }

      const data: AssignmentsResponse = await response.json()
      
      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch teacher assignments')
      }
      
      // Ensure all classes have required fields with proper typing
      const classes = (data.classes || []).map(cls => ({
        ...cls,
        studentCount: (cls as ClassAssignment).studentCount ?? (cls as ClassAssignment).currentEnrollment ?? 0,
        subjects: (cls as ClassAssignment).subjects || [],
      })) as ClassAssignment[]
      
      return classes
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce unnecessary requests
    refetchOnMount: false, // Use cached data if available
  })
}
