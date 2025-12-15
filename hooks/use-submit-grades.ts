"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export interface GradeSubmission {
  studentId: string
  marks: number
  grade?: string
  remarks?: string
  coefficient?: number
  totalMarks?: number
  rank?: number
}

export interface SubmitGradesParams {
  classId: string
  subjectId: string
  term: string
  sequenceId?: string
  examinationName?: string
  grades: GradeSubmission[]
}

export interface SubmitGradesResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Hook for submitting grades with optimistic UI updates
 */
export function useSubmitGrades() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<SubmitGradesResponse, Error, SubmitGradesParams>({
    mutationFn: async (params) => {
      if (!user?.id) {
        throw new Error("User not authenticated")
      }

      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          teacherId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit grades')
      }

      const data = await response.json()
      return data
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ 
        queryKey: ['grade-entry-status', user?.id, variables.classId, variables.subjectId] 
      })

      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData([
        'grade-entry-status',
        user?.id,
        variables.classId,
        variables.subjectId
      ])

      // Optimistically update the grade entry status
      queryClient.setQueryData(
        ['grade-entry-status', user?.id, variables.classId, variables.subjectId],
        (old: any) => {
          if (!old || !old.data) return old

          const updatedData = {
            ...old,
            data: old.data.map((item: any) => {
              if (item.classId === variables.classId && item.subjectId === variables.subjectId) {
                return {
                  ...item,
                  sequences: item.sequences.map((seq: any) => {
                    // Find the sequence that matches
                    const sequenceMatch = variables.sequenceId 
                      ? seq.sequenceId === variables.sequenceId
                      : seq.sequenceName === variables.examinationName

                    if (sequenceMatch) {
                      return {
                        ...seq,
                        isCompleted: true,
                        enteredCount: variables.grades.length,
                        completedDate: new Date().toISOString()
                      }
                    }
                    return seq
                  })
                }
              }
              return item
            })
          }

          return updatedData
        }
      )

      // Return context with snapshot
      return { previousStatus }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousStatus) {
        queryClient.setQueryData(
          ['grade-entry-status', user?.id, variables.classId, variables.subjectId],
          context.previousStatus
        )
      }
      
      toast.error(error.message || "Failed to submit grades")
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch grade entry status to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: ['grade-entry-status', user?.id, variables.classId, variables.subjectId] 
      })
      
      // Invalidate overall stats
      queryClient.invalidateQueries({ 
        queryKey: ['grade-entry-status', user?.id] 
      })

      // Invalidate teacher assignments to refresh student counts if needed
      queryClient.invalidateQueries({ 
        queryKey: ['teacher-assignments', user?.id] 
      })

      toast.success(data.message || `Successfully submitted ${variables.grades.length} grades`)
    },
  })
}
