"use client"

import { useQuery } from "@tanstack/react-query"

export interface Student {
  id: number
  studentId: string
  firstName: string
  lastName: string
  email: string
  [key: string]: unknown
}

interface StudentsResponse {
  students: Student[]
  error?: string
}

export function useClassStudents(classId: string | undefined) {
  return useQuery({
    queryKey: ['class-students', classId],
    queryFn: async () => {
      if (!classId) throw new Error("Class ID is required")
      
      const response = await fetch(`/api/classes/${classId}/students`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }

      const data: StudentsResponse = await response.json()
      return data.students || []
    },
    enabled: !!classId,
    staleTime: 5 * 60 * 1000, // 5 minutes - student lists don't change often
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Use cached data if available
  })
}
