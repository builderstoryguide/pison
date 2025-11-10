import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import type { 
  SubjectBranchWithDetails,
  CreateSubjectBranchRequest 
} from '@/lib/subject-branches-types'

interface SubjectBranchesParams {
  subjectId?: string
  academicYear?: string
  term?: string
  isActive?: boolean
  page?: number
  pageSize?: number
}

interface PaginatedBranchesResponse {
  branches: SubjectBranchWithDetails[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Optimized hook with intelligent caching and prefetching
export function useSubjectBranchesOptimized(params: SubjectBranchesParams = {}) {
  const { subjectId, academicYear, term, isActive, page = 1, pageSize = 20 } = params
  
  return useQuery({
    queryKey: ['subject-branches-optimized', { subjectId, academicYear, term, isActive, page, pageSize }],
    queryFn: async (): Promise<PaginatedBranchesResponse> => {
      const searchParams = new URLSearchParams()
      
      if (subjectId) searchParams.set('subjectId', subjectId)
      if (academicYear) searchParams.set('academicYear', academicYear)
      if (term) searchParams.set('term', term)
      if (isActive !== undefined) searchParams.set('isActive', isActive.toString())
      if (page) searchParams.set('page', page.toString())
      if (pageSize) searchParams.set('pageSize', pageSize.toString())

      const response = await fetch(`/api/subject-branches/ultra-fast?${searchParams.toString()}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch subject branches')
      }
      
      return {
        branches: data.branches,
        total: data.total,
        page: data.page || page,
        pageSize: data.pageSize || pageSize,
        hasMore: data.hasMore || false
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false
      return failureCount < 2
    },
  })
}

// Infinite query for large datasets
export function useSubjectBranchesInfinite(params: Omit<SubjectBranchesParams, 'page'> = {}) {
  const { subjectId, academicYear, term, isActive, pageSize = 20 } = params
  
  return useInfiniteQuery({
    queryKey: ['subject-branches-infinite', { subjectId, academicYear, term, isActive, pageSize }],
    queryFn: async ({ pageParam = 1 }): Promise<PaginatedBranchesResponse> => {
      const searchParams = new URLSearchParams()
      
      if (subjectId) searchParams.set('subjectId', subjectId)
      if (academicYear) searchParams.set('academicYear', academicYear)
      if (term) searchParams.set('term', term)
      if (isActive !== undefined) searchParams.set('isActive', isActive.toString())
      searchParams.set('page', pageParam.toString())
      searchParams.set('pageSize', pageSize.toString())

      const response = await fetch(`/api/subject-branches/ultra-fast?${searchParams.toString()}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch subject branches')
      }
      
      return {
        branches: data.branches,
        total: data.total,
        page: data.page || pageParam,
        pageSize: data.pageSize || pageSize,
        hasMore: data.hasMore || false
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Prefetch hook for intelligent data loading
export function usePrefetchSubjectBranches() {
  const queryClient = useQueryClient()

  const prefetchBranches = (params: SubjectBranchesParams) => {
    queryClient.prefetchQuery({
      queryKey: ['subject-branches-optimized', params],
      queryFn: async () => {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.set(key, value.toString())
        })

        const response = await fetch(`/api/subject-branches/ultra-fast?${searchParams.toString()}`)
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch subject branches')
        }
        
        return {
          branches: data.branches,
          total: data.total,
          page: data.page || 1,
          pageSize: data.pageSize || 20,
          hasMore: data.hasMore || false
        }
      },
      staleTime: 2 * 60 * 1000,
    })
  }

  return { prefetchBranches }
}

// Optimized mutation hooks
export function useCreateSubjectBranchOptimized() {
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
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['subject-branches-optimized'] })
      queryClient.invalidateQueries({ queryKey: ['subject-branches-infinite'] })
      
      // Optimistically update the cache
      queryClient.setQueryData(
        ['subject-branches-optimized', { subjectId: newBranch.subject_id }],
        (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            branches: [newBranch, ...oldData.branches],
            total: oldData.total + 1
          }
        }
      )
      
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

export function useDeleteSubjectBranchOptimized() {
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
    onSuccess: (_, branchId) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['subject-branches-optimized'] })
      queryClient.invalidateQueries({ queryKey: ['subject-branches-infinite'] })
      
      // Optimistically remove from cache
      queryClient.setQueriesData(
        { queryKey: ['subject-branches-optimized'] },
        (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            branches: oldData.branches.filter((branch: any) => branch.id !== branchId),
            total: Math.max(0, oldData.total - 1)
          }
        }
      )
      
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
