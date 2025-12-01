"use client"

import { useState, useEffect } from 'react'

/**
 * Represents a unified gradable item (subject or branch)
 */
export interface GradableItem {
  id: string
  name: string
  code: string
  type: 'subject' | 'branch'
  maxMarks: number
  coefficient: number
  parentSubjectId?: string
}

interface UseGradableItemsResult {
  items: GradableItem[]
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Custom hook to fetch and unify subjects and branches for a class
 * 
 * This hook abstracts the complexity of fetching from /api/classes/[classId]/subjects
 * which returns both regular subjects and sub-branches as a unified list.
 * 
 * @param classId - The ID of the class
 * @param teacherId - Optional teacher ID to filter subjects
 * @returns Gradable items, loading state, error state, and refetch function
 */
export function useGradableItems(classId: string, teacherId?: string): UseGradableItemsResult {
  const [items, setItems] = useState<GradableItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = async () => {
    if (!classId) {
      setItems([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const url = teacherId 
        ? `/api/classes/${classId}/subjects?teacherId=${teacherId}`
        : `/api/classes/${classId}/subjects`

      const response = await fetch(url)

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let errorMessage = 'Failed to fetch subjects'

        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            // Failed to parse JSON, use default message
          }
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch subjects')
      }

      const subjectsList = data.subjects || []

      // Transform to GradableItem format
      const transformedItems: GradableItem[] = subjectsList
        .filter((item: { id: string | number }) => item.id)
        .map((item: {
          id: string | number
          name?: string
          subject_name?: string
          code?: string
          subject_code?: string
          coefficient?: number | string
          type?: 'subject' | 'branch'
          maxMarks?: number
          parentId?: string
        }) => ({
          id: item.id.toString(),
          name: item.name || item.subject_name || 'Unknown Subject',
          code: item.code || item.subject_code || '',
          coefficient: item.coefficient
            ? (typeof item.coefficient === 'number' ? item.coefficient : parseFloat(String(item.coefficient)))
            : 1.0,
          type: (item.type || 'subject') as 'subject' | 'branch',
          maxMarks: item.maxMarks || 20,
          parentSubjectId: item.parentId
        }))

      setItems(transformedItems)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subjects'
      setError(errorMessage)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, teacherId])

  return {
    items,
    loading,
    error,
    refetch: fetchItems
  }
}
