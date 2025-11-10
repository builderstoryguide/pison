"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ClassStudent {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  enrollmentStatus: string
  enrollmentDate: string
}

interface UseClassStudentsReturn {
  students: ClassStudent[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useClassStudents(classId?: string): UseClassStudentsReturn {
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    if (!classId) {
      setStudents([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Get students enrolled in this class
      const { data, error: fetchError } = await supabase
        .from('student_class_enrollments')
        .select(`
          id,
          student_id,
          enrollment_date,
          status,
          students:student_id(
            id,
            student_id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('enrollment_date', { ascending: false })

      if (fetchError) {
        throw new Error(`Failed to fetch class students: ${fetchError.message}`)
      }

      // Transform data
      const transformedStudents: ClassStudent[] = (data || [])
        .map((enrollment: any) => enrollment.students)
        .filter(Boolean)
        .map((student: any) => ({
          id: student.id,
          studentId: student.student_id,
          firstName: student.first_name,
          lastName: student.last_name,
          email: student.email,
          phone: student.phone,
          enrollmentStatus: 'enrolled',
          enrollmentDate: data?.find((e: any) => e.student_id === student.id)?.enrollment_date || ''
        }))

      setStudents(transformedStudents)
    } catch (err) {
      console.error('Error fetching class students:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch class students')
      setStudents([])
    } finally {
      setIsLoading(false)
    }
  }, [classId])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return {
    students,
    isLoading,
    error,
    refetch: fetchStudents
  }
}
