"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-context"

interface TeacherAssignmentsResponse {
  ok: boolean
  teacher: {
    id: string
    name: string
  }
  subjects: Array<{
    id: string
    subjectId: string | null
    subjectName: string
    subjectCode: string | null
    subBranchId: string | null
    subBranchName: string | null
    assignmentType: string
    isActive: boolean
    createdAt: string
  }>
  classes: Array<{
    id: string
    name: string
    level: string
    subsystem: string
    branch: string
    academicYear?: string
    capacity?: number
    currentEnrollment?: number
    assignmentType: string
    status?: string
    students?: any[]
    subjects?: any[]
  }>
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

interface UseTeacherAssignmentsOptions {
  page?: number
  limit?: number
  includeDetails?: boolean
  summaryOnly?: boolean
  enabled?: boolean
}

export function useTeacherAssignments(options: UseTeacherAssignmentsOptions = {}) {
  const { user } = useAuth()
  const {
    page = 1,
    limit = 50,
    includeDetails = false,
    summaryOnly = false,
    enabled = true,
  } = options

  return useQuery<TeacherAssignmentsResponse>({
    queryKey: ["teacher-assignments", user?.id, page, limit, includeDetails, summaryOnly],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated")
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(includeDetails && { includeDetails: "true" }),
        ...(summaryOnly && { summaryOnly: "true" }),
      })

      const response = await fetch(`/api/teachers/${user.id}/assignments?${params}`)
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch assignments")
      }

      return data
    },
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

