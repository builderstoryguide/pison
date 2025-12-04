"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Subject grouping types
export type SubjectGrouping = 'languages' | 'related_trade_subjects' | 'trade_subjects' | 'others'

export const SUBJECT_GROUPINGS: Record<SubjectGrouping, string> = {
  languages: 'Languages',
  related_trade_subjects: 'Related Trade Subjects',
  trade_subjects: 'Trade Subjects',
  others: 'Others'
} as const

export interface Subject {
  id: string
  name: string
  code?: string
  description?: string
  has_sub_branches: boolean
  coefficient?: number
  is_active: boolean
  created_at: string
  updated_at: string
  sub_branches?: SubBranch[]
  subject_groupings?: SubjectGrouping[]
}

export interface SubBranch {
  id: string
  subject_id: string
  name: string
  coefficient: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TeacherAssignment {
  id: string
  teacher_id: string
  teacher_name?: string
  subject_id: string
  sub_branch_id?: string
  sub_branch_name?: string
  assignment_type: 'main_subject' | 'sub_branch'
  is_active: boolean
  created_at: string
}

export interface SubjectFilters {
  search?: string
  is_active?: boolean
  has_sub_branches?: boolean
}

interface SubjectManagementContextType {
  subjects: Subject[]
  selectedSubject: Subject | null
  isLoading: boolean
  error: string | null
  loadSubjects: (filters?: SubjectFilters) => Promise<void>
  createSubject: (subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'>, subBranches?: Omit<SubBranch, 'id' | 'subject_id' | 'created_at' | 'updated_at'>[]) => Promise<{ success: boolean; subject?: Subject }>
  updateSubject: (subjectId: string, subjectData: Partial<Subject>) => Promise<boolean>
  deleteSubject: (subjectId: string) => Promise<boolean>
  toggleStatus: (subjectId: string, isActive: boolean) => Promise<boolean>
  search: (query: string) => Subject[]
  filter: (filters: SubjectFilters) => Subject[]
  getSubjectById: (subjectId: string) => Subject | undefined
  setSelectedSubject: (subject: Subject | null) => void
  refreshSubjects: () => Promise<void>
  
  // Sub-branch operations
  createSubBranch: (subjectId: string, subBranchData: Omit<SubBranch, 'id' | 'subject_id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; subBranch?: SubBranch }>
  updateSubBranch: (subjectId: string, subBranchId: string, subBranchData: Partial<SubBranch>) => Promise<boolean>
  deleteSubBranch: (subjectId: string, subBranchId: string) => Promise<boolean>
  
  // Teacher assignment operations
  getTeacherAssignments: (subjectId: string) => Promise<TeacherAssignment[]>
  assignTeacher: (subjectId: string, teacherId: string, subBranchId?: string) => Promise<boolean>
  removeTeacherAssignment: (subjectId: string, assignmentId: string) => Promise<boolean>
}

const SubjectManagementContext = createContext<SubjectManagementContextType | undefined>(undefined)

export function SubjectManagementProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSubjects = useCallback(async (filters?: SubjectFilters) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.append('search', filters.search)
      if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString())
      if (filters?.has_sub_branches !== undefined) params.append('has_sub_branches', filters.has_sub_branches.toString())
      
      const url = `/api/subjects?${params.toString()}`
      console.log('Loading subjects with URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })
      
      console.log('Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`Failed to load subjects: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Loaded subjects:', data.length, 'subjects')
      setSubjects(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subjects'
      setError(errorMessage)
      console.error('Error loading subjects:', err)
      // Log more details about TypeError: Failed to fetch
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        console.error('Network error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack,
        })
      }
      setSubjects([]) // Clear subjects on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createSubject = async (
    subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'>,
    subBranches?: Omit<SubBranch, 'id' | 'subject_id' | 'created_at' | 'updated_at'>[]
  ) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...subjectData,
          sub_branches: subBranches || [],
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create subject')
      }
      
      const data = await response.json()
      await loadSubjects()
      return { success: true, subject: data.subject }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subject'
      setError(errorMessage)
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  const updateSubject = async (subjectId: string, subjectData: Partial<Subject>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subjectData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update subject')
      }
      
      await loadSubjects()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subject')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSubject = async (subjectId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete subject')
      }
      
      await loadSubjects()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const toggleStatus = async (subjectId: string, isActive: boolean) => {
    return updateSubject(subjectId, { is_active: isActive })
  }

  const search = (query: string): Subject[] => {
    if (!query.trim()) return subjects
    
    const lowerQuery = query.toLowerCase()
    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(lowerQuery) ||
        subject.code?.toLowerCase().includes(lowerQuery) ||
        subject.description?.toLowerCase().includes(lowerQuery)
    )
  }

  const filter = (filters: SubjectFilters): Subject[] => {
    let filtered = subjects
    
    if (filters.search) {
      filtered = search(filters.search)
    }
    
    if (filters.is_active !== undefined) {
      filtered = filtered.filter((s) => s.is_active === filters.is_active)
    }
    
    if (filters.has_sub_branches !== undefined) {
      filtered = filtered.filter((s) => s.has_sub_branches === filters.has_sub_branches)
    }
    
    return filtered
  }

  const getSubjectById = (subjectId: string): Subject | undefined => {
    return subjects.find((s) => s.id === subjectId)
  }

  const refreshSubjects = async () => {
    await loadSubjects()
  }

  // Sub-branch operations
  const createSubBranch = async (
    subjectId: string,
    subBranchData: Omit<SubBranch, 'id' | 'subject_id' | 'created_at' | 'updated_at'>
  ) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/subjects/${subjectId}/sub-branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subBranchData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create sub-branch')
      }
      
      const data = await response.json()
      await loadSubjects()
      return { success: true, subBranch: data.sub_branch }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create sub-branch'
      setError(errorMessage)
      return { success: false }
    } finally {
      setIsLoading(false)
    }
  }

  const updateSubBranch = async (
    subjectId: string,
    subBranchId: string,
    subBranchData: Partial<SubBranch>
  ) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/subjects/${subjectId}/sub-branches/${subBranchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subBranchData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update sub-branch')
      }
      
      await loadSubjects()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sub-branch')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSubBranch = async (subjectId: string, subBranchId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/subjects/${subjectId}/sub-branches/${subBranchId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete sub-branch')
      }
      
      await loadSubjects()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sub-branch')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Teacher assignment operations
  const getTeacherAssignments = async (subjectId: string): Promise<TeacherAssignment[]> => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/teachers`)
      if (!response.ok) {
        throw new Error('Failed to load teacher assignments')
      }
      
      const data = await response.json()
      return data.assignments || []
    } catch (err) {
      console.error('Error loading teacher assignments:', err)
      return []
    }
  }

  const assignTeacher = async (subjectId: string, teacherId: string, subBranchId?: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/subjects/${subjectId}/teachers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacher_id: teacherId,
          sub_branch_id: subBranchId,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign teacher')
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign teacher')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removeTeacherAssignment = async (subjectId: string, assignmentId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/subjects/${subjectId}/teachers/${assignmentId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove teacher assignment')
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove teacher assignment')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Don't load subjects on mount - let components load what they need
  // This prevents race conditions and ensures components get the right data

  return (
    <SubjectManagementContext.Provider
      value={{
        subjects,
        selectedSubject,
        isLoading,
        error,
        loadSubjects,
        createSubject,
        updateSubject,
        deleteSubject,
        toggleStatus,
        search,
        filter,
        getSubjectById,
        setSelectedSubject,
        refreshSubjects,
        createSubBranch,
        updateSubBranch,
        deleteSubBranch,
        getTeacherAssignments,
        assignTeacher,
        removeTeacherAssignment,
      }}
    >
      {children}
    </SubjectManagementContext.Provider>
  )
}

export function useSubjectManagement() {
  const context = useContext(SubjectManagementContext)
  if (context === undefined) {
    throw new Error('useSubjectManagement must be used within a SubjectManagementProvider')
  }
  return context
}

