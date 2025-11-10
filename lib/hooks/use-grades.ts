"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-context"

interface Grade {
  id: string
  assessmentId: string
  studentId: string
  studentName: string
  marks: number
  percentage: number
  grade: string
  remarks?: string
  submittedAt: string
}

interface UseGradesOptions {
  assessmentId?: string
  studentId?: string
  enabled?: boolean
}

export function useGrades(options: UseGradesOptions = {}) {
  const { user } = useAuth()
  const { assessmentId, studentId, enabled = true } = options

  return useQuery<Grade[]>({
    queryKey: ["grades", user?.id, assessmentId, studentId],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated")
      }

      // This would need to be implemented in the API
      const response = await fetch(`/api/grades?teacherId=${user.id}`)
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to fetch grades")
      }

      let grades = data.grades || []

      if (assessmentId) {
        grades = grades.filter((g: Grade) => g.assessmentId === assessmentId)
      }

      if (studentId) {
        grades = grades.filter((g: Grade) => g.studentId === studentId)
      }

      return grades
    },
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000,
  })
}

