"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

export interface Mark {
  id: string
  studentId: string
  studentName: string
  assessmentId: string
  assessmentName: string
  assessmentType: string
  subjectId: string
  subjectName: string
  classId: string
  className: string
  marksObtained: number
  totalMarks: number
  percentage: number
  gradeLetter: string
  remarks?: string
  submittedAt: string
  assessmentDate?: string
  term?: number
  academicYear?: string
}

export interface MarkFilters {
  classId?: string
  subjectId?: string
  studentId?: string
  assessmentId?: string
  term?: number
  academicYear?: string
  type?: string
  search?: string
}

// Query keys factory
export const adminMarksKeys = {
  all: ['admin-marks'] as const,
  lists: () => [...adminMarksKeys.all, 'list'] as const,
  list: (filters?: MarkFilters) => [...adminMarksKeys.lists(), filters] as const,
  detail: (gradeId: string) => [...adminMarksKeys.all, 'detail', gradeId] as const,
}

// Fetch marks function
async function fetchMarks(filters?: MarkFilters): Promise<Mark[]> {
  const params = new URLSearchParams()
  
  if (filters?.classId) params.append('classId', filters.classId)
  if (filters?.subjectId) params.append('subjectId', filters.subjectId)
  if (filters?.studentId) params.append('studentId', filters.studentId)
  if (filters?.assessmentId) params.append('assessmentId', filters.assessmentId)
  if (filters?.term) params.append('term', filters.term.toString())
  if (filters?.academicYear) params.append('academicYear', filters.academicYear)
  if (filters?.type) params.append('type', filters.type)
  if (filters?.search) params.append('search', filters.search)

  // Get user ID from localStorage for authentication
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
  const user = storedUser ? JSON.parse(storedUser) : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (user?.id) {
    headers['X-User-Id'] = user.id
  }

  const url = `/api/admin/marks/list?${params.toString()}`
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:72',message:'fetchMarks: Before fetch',data:{url,hasUserId:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const response = await fetch(url, { headers })
  // #region agent log
  const contentType = response.headers.get('content-type') || 'unknown'
  const responseText = await response.clone().text().catch(() => '')
  const responsePreview = responseText.substring(0, 200)
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:73',message:'fetchMarks: After fetch, before json',data:{url,status:response.status,statusText:response.statusText,contentType,isHTML:responsePreview.startsWith('<!'),responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  let data
  try {
    data = await response.json()
  } catch (jsonError: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:73',message:'fetchMarks: JSON parse error',data:{url,status:response.status,contentType,error:jsonError.message,responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error(`Failed to parse JSON from ${url}: ${jsonError.message}. Response preview: ${responsePreview.substring(0, 100)}`)
  }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch marks')
  }

  return data.marks || []
}

// Fetch single mark function
async function fetchMark(gradeId: string): Promise<Mark | null> {
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
  const user = storedUser ? JSON.parse(storedUser) : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (user?.id) {
    headers['X-User-Id'] = user.id
  }

  const url = `/api/admin/marks/${gradeId}`
  const response = await fetch(url, { headers })
  
  if (response.status === 404) {
    return null
  }

  let data
  try {
    data = await response.json()
  } catch (jsonError: any) {
    throw new Error(`Failed to parse JSON from ${url}: ${jsonError.message}`)
  }

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch mark')
  }

  return data.mark || null
}

// Create mark function
async function createMark(markData: {
  studentId: string
  assessmentId: string
  marksObtained: number
  remarks?: string
}): Promise<Mark> {
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
  const user = storedUser ? JSON.parse(storedUser) : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (user?.id) {
    headers['X-User-Id'] = user.id
  }

  const url = '/api/admin/marks'
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:100',message:'createMark: Before fetch',data:{url,method:'POST',hasUserId:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(markData),
  })
  // #region agent log
  const contentType = response.headers.get('content-type') || 'unknown'
  const responseText = await response.clone().text().catch(() => '')
  const responsePreview = responseText.substring(0, 200)
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:106',message:'createMark: After fetch, before json',data:{url,status:response.status,contentType,isHTML:responsePreview.startsWith('<!'),responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  let result
  try {
    result = await response.json()
  } catch (jsonError: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:106',message:'createMark: JSON parse error',data:{url,status:response.status,contentType,error:jsonError.message,responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw new Error(`Failed to parse JSON from ${url}: ${jsonError.message}. Response preview: ${responsePreview.substring(0, 100)}`)
  }

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create mark')
  }

  return result.mark
}

// Update mark function
async function updateMark(gradeId: string, markData: {
  marksObtained: number
  remarks?: string
}): Promise<Mark> {
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
  const user = storedUser ? JSON.parse(storedUser) : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (user?.id) {
    headers['X-User-Id'] = user.id
  }

  const url = `/api/admin/marks/${gradeId}`
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:131',message:'updateMark: Before fetch',data:{url,method:'PUT',gradeId,hasUserId:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(markData),
  })
  // #region agent log
  const contentType = response.headers.get('content-type') || 'unknown'
  const responseText = await response.clone().text().catch(() => '')
  const responsePreview = responseText.substring(0, 200)
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:137',message:'updateMark: After fetch, before json',data:{url,status:response.status,contentType,isHTML:responsePreview.startsWith('<!'),responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  let result
  try {
    result = await response.json()
  } catch (jsonError: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:137',message:'updateMark: JSON parse error',data:{url,status:response.status,contentType,error:jsonError.message,responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw new Error(`Failed to parse JSON from ${url}: ${jsonError.message}. Response preview: ${responsePreview.substring(0, 100)}`)
  }

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update mark')
  }

  return result.mark
}

// Delete mark function
async function deleteMark(gradeId: string): Promise<void> {
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
  const user = storedUser ? JSON.parse(storedUser) : null
  
  const headers: Record<string, string> = {}
  
  if (user?.id) {
    headers['X-User-Id'] = user.id
  }

  const url = `/api/admin/marks/${gradeId}`
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:157',message:'deleteMark: Before fetch',data:{url,method:'DELETE',gradeId,hasUserId:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  })
  // #region agent log
  const contentType = response.headers.get('content-type') || 'unknown'
  const responseText = await response.clone().text().catch(() => '')
  const responsePreview = responseText.substring(0, 200)
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:162',message:'deleteMark: After fetch, before json',data:{url,status:response.status,contentType,isHTML:responsePreview.startsWith('<!'),responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  let result
  try {
    result = await response.json()
  } catch (jsonError: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:162',message:'deleteMark: JSON parse error',data:{url,status:response.status,contentType,error:jsonError.message,responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    throw new Error(`Failed to parse JSON from ${url}: ${jsonError.message}. Response preview: ${responsePreview.substring(0, 100)}`)
  }

  if (!response.ok) {
    throw new Error(result.error || 'Failed to delete mark')
  }
}

// Bulk operations
async function bulkCreateMarks(marks: Array<{
  studentId: string
  assessmentId: string
  marksObtained: number
  remarks?: string
}>): Promise<{ success: number; errors: string[] }> {
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
  const user = storedUser ? JSON.parse(storedUser) : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (user?.id) {
    headers['X-User-Id'] = user.id
  }

  const url = '/api/admin/marks/bulk'
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:187',message:'bulkCreateMarks: Before fetch',data:{url,method:'POST',marksCount:marks.length,hasUserId:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ marks }),
  })
  // #region agent log
  const contentType = response.headers.get('content-type') || 'unknown'
  const responseText = await response.clone().text().catch(() => '')
  const responsePreview = responseText.substring(0, 200)
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:193',message:'bulkCreateMarks: After fetch, before json',data:{url,status:response.status,contentType,isHTML:responsePreview.startsWith('<!'),responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  let result
  try {
    result = await response.json()
  } catch (jsonError: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:193',message:'bulkCreateMarks: JSON parse error',data:{url,status:response.status,contentType,error:jsonError.message,responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    throw new Error(`Failed to parse JSON from ${url}: ${jsonError.message}. Response preview: ${responsePreview.substring(0, 100)}`)
  }

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create marks')
  }

  return { success: result.success, errors: result.errors || [] }
}

async function bulkUpdateMarks(marks: Array<{
  gradeId: string
  marksObtained: number
  remarks?: string
}>): Promise<{ success: number; errors: string[] }> {
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
  const user = storedUser ? JSON.parse(storedUser) : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (user?.id) {
    headers['X-User-Id'] = user.id
  }

  const url = '/api/admin/marks/bulk'
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:218',message:'bulkUpdateMarks: Before fetch',data:{url,method:'PUT',marksCount:marks.length,hasUserId:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ marks }),
  })
  // #region agent log
  const contentType = response.headers.get('content-type') || 'unknown'
  const responseText = await response.clone().text().catch(() => '')
  const responsePreview = responseText.substring(0, 200)
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:224',message:'bulkUpdateMarks: After fetch, before json',data:{url,status:response.status,contentType,isHTML:responsePreview.startsWith('<!'),responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  let result
  try {
    result = await response.json()
  } catch (jsonError: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:224',message:'bulkUpdateMarks: JSON parse error',data:{url,status:response.status,contentType,error:jsonError.message,responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    throw new Error(`Failed to parse JSON from ${url}: ${jsonError.message}. Response preview: ${responsePreview.substring(0, 100)}`)
  }

  if (!response.ok) {
    throw new Error(result.error || 'Failed to update marks')
  }

  return { success: result.success, errors: result.errors || [] }
}

async function bulkDeleteMarks(gradeIds: string[]): Promise<{ success: number; errors: string[] }> {
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
  const user = storedUser ? JSON.parse(storedUser) : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (user?.id) {
    headers['X-User-Id'] = user.id
  }

  const url = '/api/admin/marks/bulk'
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:245',message:'bulkDeleteMarks: Before fetch',data:{url,method:'DELETE',gradeIdsCount:gradeIds.length,hasUserId:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
  const response = await fetch(url, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ gradeIds }),
  })
  // #region agent log
  const contentType = response.headers.get('content-type') || 'unknown'
  const responseText = await response.clone().text().catch(() => '')
  const responsePreview = responseText.substring(0, 200)
  fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:251',message:'bulkDeleteMarks: After fetch, before json',data:{url,status:response.status,contentType,isHTML:responsePreview.startsWith('<!'),responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
  let result
  try {
    result = await response.json()
  } catch (jsonError: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-admin-marks.ts:251',message:'bulkDeleteMarks: JSON parse error',data:{url,status:response.status,contentType,error:jsonError.message,responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    throw new Error(`Failed to parse JSON from ${url}: ${jsonError.message}. Response preview: ${responsePreview.substring(0, 100)}`)
  }

  if (!response.ok) {
    throw new Error(result.error || 'Failed to delete marks')
  }

  return { success: result.deletedCount, errors: result.errors || [] }
}

// Main hook for fetching marks
export function useAdminMarks(filters?: MarkFilters) {
  const { toast } = useToast()

  return useQuery({
    queryKey: adminMarksKeys.list(filters),
    queryFn: () => fetchMarks(filters),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch marks',
        variant: 'destructive',
      })
    },
  })
}

// Create mark mutation with optimistic update
export function useCreateMark() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createMark,
    onMutate: async (newMark) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: adminMarksKeys.lists() })

      // Snapshot previous value
      const previousMarks = queryClient.getQueriesData({ queryKey: adminMarksKeys.lists() })

      // Optimistically update - create a temporary mark
      const tempMark: Mark = {
        id: `temp-${Date.now()}`,
        studentId: newMark.studentId,
        studentName: 'Loading...',
        assessmentId: newMark.assessmentId,
        assessmentName: 'Loading...',
        assessmentType: 'test',
        subjectId: '',
        subjectName: 'Loading...',
        classId: '',
        className: 'Loading...',
        marksObtained: newMark.marksObtained,
        totalMarks: 20,
        percentage: (newMark.marksObtained / 20) * 100,
        gradeLetter: newMark.marksObtained >= 17 ? 'A' : newMark.marksObtained >= 14 ? 'B' : newMark.marksObtained >= 12 ? 'C' : newMark.marksObtained >= 10 ? 'D' : newMark.marksObtained >= 8 ? 'E' : 'F',
        remarks: newMark.remarks,
        submittedAt: new Date().toISOString(),
      }

      // Optimistically add to all relevant queries
      queryClient.setQueriesData({ queryKey: adminMarksKeys.lists() }, (old: Mark[] | undefined) => {
        return old ? [...old, tempMark] : [tempMark]
      })

      return { previousMarks }
    },
    onError: (error: Error, _newMark, context) => {
      // Rollback on error
      if (context?.previousMarks) {
        context.previousMarks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to create mark',
        variant: 'destructive',
      })
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Mark created successfully',
      })
    },
    onSettled: () => {
      // Refetch to get accurate data
      queryClient.invalidateQueries({ queryKey: adminMarksKeys.lists() })
    },
  })
}

// Update mark mutation with optimistic update
export function useUpdateMark() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ gradeId, data }: { gradeId: string; data: { marksObtained: number; remarks?: string } }) =>
      updateMark(gradeId, data),
    onMutate: async ({ gradeId, data }) => {
      await queryClient.cancelQueries({ queryKey: adminMarksKeys.lists() })

      const previousMarks = queryClient.getQueriesData({ queryKey: adminMarksKeys.lists() })

      // Optimistically update the mark
      queryClient.setQueriesData({ queryKey: adminMarksKeys.lists() }, (old: Mark[] | undefined) => {
        if (!old) return old
        return old.map((mark) => {
          if (mark.id === gradeId) {
            const totalMarks = mark.totalMarks || 20
            const percentage = (data.marksObtained / totalMarks) * 100
            const gradeLetter = percentage >= 85 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : percentage >= 40 ? 'E' : 'F'
            return {
              ...mark,
              marksObtained: data.marksObtained,
              percentage,
              gradeLetter,
              remarks: data.remarks !== undefined ? data.remarks : mark.remarks,
            }
          }
          return mark
        })
      })

      return { previousMarks }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousMarks) {
        context.previousMarks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to update mark',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Mark updated successfully',
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminMarksKeys.lists() })
    },
  })
}

// Delete mark mutation with optimistic update
export function useDeleteMark() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteMark,
    onMutate: async (gradeId) => {
      await queryClient.cancelQueries({ queryKey: adminMarksKeys.lists() })

      const previousMarks = queryClient.getQueriesData({ queryKey: adminMarksKeys.lists() })

      // Optimistically remove the mark
      queryClient.setQueriesData({ queryKey: adminMarksKeys.lists() }, (old: Mark[] | undefined) => {
        if (!old) return old
        return old.filter((mark) => mark.id !== gradeId)
      })

      return { previousMarks }
    },
    onError: (error: Error, _gradeId, context) => {
      if (context?.previousMarks) {
        context.previousMarks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete mark',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Mark deleted successfully',
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminMarksKeys.lists() })
    },
  })
}

// Bulk operations mutations
export function useBulkCreateMarks() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: bulkCreateMarks,
    onSuccess: (result) => {
      toast({
        title: 'Success',
        description: `${result.success} mark(s) created successfully`,
      })
      queryClient.invalidateQueries({ queryKey: adminMarksKeys.lists() })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create marks',
        variant: 'destructive',
      })
    },
  })
}

export function useBulkUpdateMarks() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: bulkUpdateMarks,
    onSuccess: (result) => {
      toast({
        title: 'Success',
        description: `${result.success} mark(s) updated successfully`,
      })
      queryClient.invalidateQueries({ queryKey: adminMarksKeys.lists() })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update marks',
        variant: 'destructive',
      })
    },
  })
}

export function useBulkDeleteMarks() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: bulkDeleteMarks,
    onMutate: async (gradeIds) => {
      await queryClient.cancelQueries({ queryKey: adminMarksKeys.lists() })

      const previousMarks = queryClient.getQueriesData({ queryKey: adminMarksKeys.lists() })

      // Optimistically remove marks
      queryClient.setQueriesData({ queryKey: adminMarksKeys.lists() }, (old: Mark[] | undefined) => {
        if (!old) return old
        return old.filter((mark) => !gradeIds.includes(mark.id))
      })

      return { previousMarks }
    },
    onError: (error: Error, _gradeIds, context) => {
      if (context?.previousMarks) {
        context.previousMarks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete marks',
        variant: 'destructive',
      })
    },
    onSuccess: (result) => {
      toast({
        title: 'Success',
        description: `${result.success} mark(s) deleted successfully`,
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminMarksKeys.lists() })
    },
  })
}

// Prefetching hooks
export function usePrefetchMarks() {
  const queryClient = useQueryClient()

  return (filters?: MarkFilters) => {
    queryClient.prefetchQuery({
      queryKey: adminMarksKeys.list(filters),
      queryFn: () => fetchMarks(filters),
      staleTime: 30 * 1000,
    })
  }
}

export function usePrefetchMark() {
  const queryClient = useQueryClient()

  return (gradeId: string) => {
    // Prefetch specific mark using the new API
    queryClient.prefetchQuery({
      queryKey: adminMarksKeys.detail(gradeId),
      queryFn: () => fetchMark(gradeId),
      staleTime: 60 * 1000,
    })
  }
}
