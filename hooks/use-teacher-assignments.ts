"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-context"

export interface Subject {
  id: number
  name: string
  code: string
  coefficient: number
}

export interface ClassAssignment {
  id: number
  name: string
  code: string
  level: string
  branch: string
  subsystem: string
  studentCount: number
  subjects: Subject[]
  academicYear?: string
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
      
      const response = await fetch(`/api/teachers/${user.id}/assignments?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch teacher assignments')
      }

      const data: AssignmentsResponse = await response.json()
      return data.classes || []
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}
