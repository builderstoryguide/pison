import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type { 
  SubjectBranchWithDetails,
  CreateSubjectBranchRequest 
} from '@/lib/subject-branches-types'

interface SubjectBranchesResponse {
  success: boolean
  branches: SubjectBranchWithDetails[]
  total: number
  error?: string
}

interface SubjectBranchesParams {
  subjectId?: string
  academicYear?: string
  term?: string
  isActive?: boolean
}

// Fetch subject branches with caching
export function useSubjectBranches(params: SubjectBranchesParams = {}) {
  return useQuery({
    queryKey: ['subject-branches', params],
    queryFn: async (): Promise<SubjectBranchWithDetails[]> => {
      const searchParams = new URLSearchParams()
      
      if (params.subjectId) searchParams.set('subjectId', params.subjectId)
      if (params.academicYear) searchParams.set('academicYear', params.academicYear)
      if (params.term) searchParams.set('term', params.term)
      if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString())

      const response = await fetch(`/api/subject-branches/optimized?${searchParams.toString()}`)
      const data: SubjectBranchesResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch subject branches')
      }
      
      return data.branches
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Create subject branch mutation
export function useCreateSubjectBranch() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (branchData: CreateSubjectBranchRequest): Promise<SubjectBranchWithDetails> => {
      const response = await fetch('/api/subject-branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branchData),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create subject branch')
      }

      return data.branch
    },
    onSuccess: (newBranch) => {
      // Invalidate all subject-branches queries
      queryClient.invalidateQueries({ queryKey: ['subject-branches'] })
      
      toast({
        title: 'Success',
        description: `Subject branch "${newBranch.branch_name}" created successfully`
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    },
  })
}

// Delete subject branch mutation
export function useDeleteSubjectBranch() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (branchId: string): Promise<void> => {
      const response = await fetch(`/api/subject-branches/${branchId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete subject branch')
      }
    },
    onSuccess: () => {
      // Invalidate all subject-branches queries
      queryClient.invalidateQueries({ queryKey: ['subject-branches'] })
      
      toast({
        title: 'Success',
        description: 'Subject branch deleted successfully'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    },
  })
}
