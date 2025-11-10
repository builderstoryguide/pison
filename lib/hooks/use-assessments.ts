"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-context"

interface Assessment {
  id: string
  title: string
  type: string
  subject: string
  classId: string
  className: string
  totalMarks: number
  date: string
  dueDate?: string
  createdAt: string
}

interface UseAssessmentsOptions {
  classId?: string
  subject?: string
  enabled?: boolean
}

export function useAssessments(options: UseAssessmentsOptions = {}) {
  const { user } = useAuth()
  const { classId, subject, enabled = true } = options

  return useQuery<Assessment[]>({
    queryKey: ["assessments", user?.id, classId, subject],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated")
      }

      // This would need to be implemented in the API
      // For now, we'll use the context provider
      const response = await fetch(`/api/assessments?teacherId=${user.id}`)
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch assessments")
      }

      let assessments = data.assessments || []

      if (classId) {
        assessments = assessments.filter((a: Assessment) => a.classId === classId)
      }

      if (subject) {
        assessments = assessments.filter((a: Assessment) => a.subject === subject)
      }

      return assessments
    },
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000,
  })
}

