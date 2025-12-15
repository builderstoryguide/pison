"use client"

import { useQuery } from '@tanstack/react-query'

// Query keys for React Query
export const studentFeeAssignmentKeys = {
  all: ['student-fee-assignments'] as const,
  lists: () => [...studentFeeAssignmentKeys.all, 'list'] as const,
  list: (filters?: {
    studentId?: string
    classId?: string
    academicYear?: string
    term?: string
    status?: string
  }) => [...studentFeeAssignmentKeys.lists(), filters] as const,
}

// Type for student fee assignment
export interface StudentFeeAssignment {
  id: string
  studentId: string
  studentName: string
  studentNumber: string
  className?: string
  subsystem?: string
  branch?: string | null
  feeStructureId: string
  feeStructureName?: string
  academicYear: string
  term: string
  dueDate: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  lastPaymentDate?: string | null
  notes?: string | null
}

// API helper function
async function fetchStudentFeeAssignments(filters?: {
  studentId?: string
  classId?: string
  academicYear?: string
  term?: string
  status?: string
}): Promise<StudentFeeAssignment[]> {
  const params = new URLSearchParams()
  if (filters?.studentId) params.append('studentId', filters.studentId)
  if (filters?.classId) params.append('classId', filters.classId)
  if (filters?.academicYear) params.append('academicYear', filters.academicYear)
  if (filters?.term) params.append('term', filters.term)
  if (filters?.status) params.append('status', filters.status)

  const response = await fetch(`/api/bursar/student-fees?${params.toString()}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch student fee assignments')
  }

  const result = await response.json()
  
  // Handle both response formats
  if (result.success && result.data) {
    return result.data
  }
  if (Array.isArray(result)) {
    return result
  }
  if (Array.isArray(result.data)) {
    return result.data
  }
  
  return []
}

// Hook to fetch student fee assignments with caching
export function useStudentFeeAssignments(filters?: {
  studentId?: string
  classId?: string
  academicYear?: string
  term?: string
  status?: string
}) {
  return useQuery({
    queryKey: studentFeeAssignmentKeys.list(filters),
    queryFn: () => fetchStudentFeeAssignments(filters),
    enabled: !!filters?.studentId || !!filters?.classId, // Only fetch if we have at least one filter
    staleTime: 30000, // 30 seconds - data is fresh for this duration
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for this duration
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Refetch when component mounts if data is stale
  })
}

// Helper function to calculate totals from fee assignments
export function calculateFeeTotals(assignments: StudentFeeAssignment[]) {
  return {
    totalAmount: assignments.reduce((sum, assignment) => sum + assignment.totalAmount, 0),
    paidAmount: assignments.reduce((sum, assignment) => sum + assignment.paidAmount, 0),
    balanceAmount: assignments.reduce((sum, assignment) => sum + assignment.balanceAmount, 0),
  }
}

