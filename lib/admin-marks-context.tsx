"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import {
  useAdminMarks as useAdminMarksQuery,
  useCreateMark,
  useUpdateMark,
  useDeleteMark,
  useBulkCreateMarks,
  useBulkUpdateMarks,
  useBulkDeleteMarks,
  usePrefetchMarks,
  type Mark,
  type MarkFilters,
} from '@/hooks/use-admin-marks'

// Re-export types for backward compatibility
export type { Mark, MarkFilters }

interface AdminMarksContextType {
  marks: Mark[]
  loading: boolean
  error: string | null
  filters: MarkFilters
  setFilters: (filters: MarkFilters) => void
  createMark: (data: {
    studentId: string
    assessmentId: string
    marksObtained: number
    remarks?: string
  }) => Promise<Mark | null>
  updateMark: (gradeId: string, data: {
    marksObtained: number
    remarks?: string
  }) => Promise<Mark | null>
  deleteMark: (gradeId: string) => Promise<boolean>
  bulkCreateMarks: (marks: Array<{
    studentId: string
    assessmentId: string
    marksObtained: number
    remarks?: string
  }>) => Promise<{ success: number; errors: string[] }>
  bulkUpdateMarks: (marks: Array<{
    gradeId: string
    marksObtained: number
    remarks?: string
  }>) => Promise<{ success: number; errors: string[] }>
  bulkDeleteMarks: (gradeIds: string[]) => Promise<{ success: number; errors: string[] }>
  prefetchMarks: (filters?: MarkFilters) => void
}

const AdminMarksContext = createContext<AdminMarksContextType | undefined>(undefined)

export function AdminMarksProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<MarkFilters>({})
  
  // Use React Query hooks
  const { data: marks = [], isLoading: loading, error: queryError } = useAdminMarksQuery(filters)
  const createMarkMutation = useCreateMark()
  const updateMarkMutation = useUpdateMark()
  const deleteMarkMutation = useDeleteMark()
  const bulkCreateMutation = useBulkCreateMarks()
  const bulkUpdateMutation = useBulkUpdateMarks()
  const bulkDeleteMutation = useBulkDeleteMarks()
  const prefetchMarksFn = usePrefetchMarks()

  const createMark = async (data: {
    studentId: string
    assessmentId: string
    marksObtained: number
    remarks?: string
  }): Promise<Mark | null> => {
    try {
      const result = await createMarkMutation.mutateAsync(data)
      return result
    } catch {
      return null
    }
  }

  const updateMark = async (gradeId: string, data: {
    marksObtained: number
    remarks?: string
  }): Promise<Mark | null> => {
    try {
      const result = await updateMarkMutation.mutateAsync({ gradeId, data })
      return result
    } catch {
      return null
    }
  }

  const deleteMark = async (gradeId: string): Promise<boolean> => {
    try {
      await deleteMarkMutation.mutateAsync(gradeId)
      return true
    } catch {
      return false
    }
  }

  const bulkCreateMarks = async (marksData: Array<{
    studentId: string
    assessmentId: string
    marksObtained: number
    remarks?: string
  }>): Promise<{ success: number; errors: string[] }> => {
    try {
      const result = await bulkCreateMutation.mutateAsync(marksData)
      return result
    } catch (error: any) {
      return { success: 0, errors: [error.message || 'Failed to create marks'] }
    }
  }

  const bulkUpdateMarks = async (marksData: Array<{
    gradeId: string
    marksObtained: number
    remarks?: string
  }>): Promise<{ success: number; errors: string[] }> => {
    try {
      const result = await bulkUpdateMutation.mutateAsync(marksData)
      return result
    } catch (error: any) {
      return { success: 0, errors: [error.message || 'Failed to update marks'] }
    }
  }

  const bulkDeleteMarks = async (gradeIds: string[]): Promise<{ success: number; errors: string[] }> => {
    try {
      const result = await bulkDeleteMutation.mutateAsync(gradeIds)
      return result
    } catch (error: any) {
      return { success: 0, errors: [error.message || 'Failed to delete marks'] }
    }
  }

  return (
    <AdminMarksContext.Provider
      value={{
        marks,
        loading,
        error: queryError?.message || null,
        filters,
        setFilters,
        createMark,
        updateMark,
        deleteMark,
        bulkCreateMarks,
        bulkUpdateMarks,
        bulkDeleteMarks,
        prefetchMarks: prefetchMarksFn,
      }}
    >
      {children}
    </AdminMarksContext.Provider>
  )
}

export function useAdminMarks() {
  const context = useContext(AdminMarksContext)
  if (context === undefined) {
    throw new Error('useAdminMarks must be used within an AdminMarksProvider')
  }
  return context
}
