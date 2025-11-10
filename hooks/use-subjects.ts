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

// Fetch subjects with caching
export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async (): Promise<Subject[]> => {
      const response = await fetch('/api/subjects')
      const data: SubjectsResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch subjects')
      }
      
      return data.subjects
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Create subject mutation
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
      // Invalidate and refetch subjects
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      
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

// Delete subject mutation
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
    onSuccess: (_, subjectId) => {
      // Invalidate and refetch subjects
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      
      toast({
        title: 'Success',
        description: 'Subject deleted successfully'
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
