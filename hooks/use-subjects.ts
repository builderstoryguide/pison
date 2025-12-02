import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

interface Subject {
  id: string
  subject_name: string
  subject_code: string
  subsystem: string
  class_levels: string[]
  description: string | null
  is_core: boolean
  status: string
  created_at: string
  updated_at: string
}

interface CreateSubjectRequest {
  subject_name: string
  subject_code: string
  subsystem: string
  class_levels?: string[]
  description?: string
  is_core?: boolean
}

interface SubjectsResponse {
  success: boolean
  subjects: Subject[]
  total: number
  error?: string
}

// Query keys
export const subjectKeys = {
  all: ['subjects'] as const,
  lists: () => [...subjectKeys.all, 'list'] as const,
  details: () => [...subjectKeys.all, 'detail'] as const,
  detail: (id: string) => [...subjectKeys.details(), id] as const,
}

// Fetch subjects with caching
export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.lists(),
    queryFn: async (): Promise<Subject[]> => {
      const response = await fetch('/api/subjects')
      const data: SubjectsResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch subjects')
      }
      
      return data.subjects
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}

// Prefetch subject on hover
export function usePrefetchSubject() {
  const queryClient = useQueryClient()
  
  return (subjectId: string) => {
    queryClient.prefetchQuery({
      queryKey: subjectKeys.detail(subjectId),
      queryFn: async () => {
        const response = await fetch(`/api/subjects/${subjectId}`)
        const data = await response.json()
        if (!data.success) throw new Error(data.error)
        return data.subject
      },
      staleTime: 60000,
    })
  }
}

// Create subject mutation with optimistic updates
export function useCreateSubject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (subjectData: CreateSubjectRequest): Promise<Subject> => {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subjectData),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to create subject')
      }

      return data.subject
    },
    onSuccess: (newSubject) => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() })
      
      toast({
        title: 'Success',
        description: `Subject "${newSubject.subject_name}" created successfully`
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

// Delete subject mutation with optimistic updates
export function useDeleteSubject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (subjectId: string): Promise<void> => {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete subject')
      }
    },
    onMutate: async (subjectId) => {
      await queryClient.cancelQueries({ queryKey: subjectKeys.lists() })
      
      const previousSubjects = queryClient.getQueryData<Subject[]>(subjectKeys.lists())
      
      // Optimistically remove subject
      if (previousSubjects) {
        queryClient.setQueryData<Subject[]>(subjectKeys.lists(), 
          previousSubjects.filter(s => s.id !== subjectId)
        )
      }
      
      return { previousSubjects }
    },
    onError: (error: Error, _subjectId, context) => {
      // Rollback on error
      if (context?.previousSubjects) {
        queryClient.setQueryData(subjectKeys.lists(), context.previousSubjects)
      }
      
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Subject deleted successfully'
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() })
    },
  })
}
