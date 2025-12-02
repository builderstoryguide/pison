"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface HistoryEntry {
  id: string
  date: string
  class: string
  classId: string
  subject: string
  sequence: string
  count: number
}

interface GradeHistoryResponse {
  success: boolean
  history: HistoryEntry[]
  error?: string
}

export function useGradeHistory(teacherId?: string) {
  return useQuery({
    queryKey: ['grade-history', teacherId],
    queryFn: async () => {
      if (!teacherId) throw new Error("Teacher ID is required")
      const res = await fetch(`/api/grades/history?teacherId=${teacherId}`)
      if (!res.ok) throw new Error("Failed to fetch grade history")
      const data: GradeHistoryResponse = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to fetch grade history")
      return data.history
    },
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useDeleteGradeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/grades/history?id=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete grade entry")
      }
      return res.json()
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['grade-history'] })

      // Snapshot the previous value
      const previousHistory = queryClient.getQueryData<HistoryEntry[]>(['grade-history'])

      // Optimistically update to the new value
      if (previousHistory) {
        queryClient.setQueryData<HistoryEntry[]>(['grade-history'], (old) => {
          // We need to find the specific query key that matches, but since we invalidated 'grade-history' generally,
          // we might need to be more specific or iterate over active queries.
          // However, react-query's setQueryData takes a specific key.
          // Since we don't know the exact teacherId here easily without passing it, 
          // we'll rely on the fact that the query key is ['grade-history', teacherId].
          // A better approach for optimistic updates with variable keys is to use setQueriesData.
          return old?.filter(entry => entry.id !== deletedId) || []
        })
        
        // More robust approach: update all grade-history queries
        queryClient.setQueriesData({ queryKey: ['grade-history'] }, (old: HistoryEntry[] | undefined) => {
            return old?.filter(entry => entry.id !== deletedId) || []
        })
      }

      return { previousHistory }
    },
    onError: (_err, _newTodo, context) => {
      // Rollback to the previous value
      if (context?.previousHistory) {
         // We can't easily restore specifically without the exact key, 
         // but since we updated all, we might want to invalidate.
         // For simplicity in this specific app context where a teacher usually only sees their own history:
         queryClient.setQueriesData({ queryKey: ['grade-history'] }, context.previousHistory)
      }
    },
    onSettled: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['grade-history'] })
    },
  })
}
