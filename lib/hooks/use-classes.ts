"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ClassOption {
  id: string
  name: string
  level: string
  subsystem: string
  branch: string
  academicYear: string
  capacity: number
  currentEnrollment: number
  status: string
}

interface UseClassesOptions {
  subsystem?: string
  branch?: string
  academicYear?: string
  status?: string
  includeInactive?: boolean
}

interface UseClassesReturn {
  classes: ClassOption[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useClasses(options: UseClassesOptions = {}): UseClassesReturn {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClasses = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      let query = supabase
        .from('classes')
        .select(`
          id,
          class_name,
          class_level,
          subsystem,
          stream,
          academic_year,
          capacity,
          current_enrollment,
          status
        `)
        .order('class_name', { ascending: true })

      // Apply filters
      if (options.subsystem) {
        query = query.eq('subsystem', options.subsystem)
      }
      if (options.branch) {
        query = query.eq('stream', options.branch)
      }
      if (options.academicYear) {
        query = query.eq('academic_year', options.academicYear)
      }
      if (options.status) {
        query = query.eq('status', options.status)
      } else if (!options.includeInactive) {
        query = query.eq('status', 'active')
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw new Error(`Failed to fetch classes: ${fetchError.message}`)
      }

      // Transform data to match our interface
      const transformedClasses: ClassOption[] = (data || []).map((cls: any) => ({
        id: cls.id,
        name: cls.class_name,
        level: cls.class_level,
        subsystem: cls.subsystem,
        branch: cls.stream,
        academicYear: cls.academic_year,
        capacity: cls.capacity || 0,
        currentEnrollment: cls.current_enrollment || 0,
        status: cls.status
      }))

      setClasses(transformedClasses)
    } catch (err) {
      console.error('Error fetching classes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch classes')
      setClasses([])
    } finally {
      setIsLoading(false)
    }
  }, [options.subsystem, options.branch, options.academicYear, options.status, options.includeInactive])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  return {
    classes,
    isLoading,
    error,
    refetch: fetchClasses
  }
}

// Hook specifically for student enrollment forms
export function useClassesForEnrollment(subsystem?: string, branch?: string) {
  return useClasses({
    subsystem,
    branch,
    status: 'active',
    includeInactive: false
  })
}

// Hook for teacher dashboard - get classes assigned to teacher
export function useTeacherClasses(teacherId?: string) {
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeacherClasses = useCallback(async () => {
    if (!teacherId) {
      setClasses([])
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

      // Get classes assigned to this teacher through teacher_branch_assignments
      const { data, error: fetchError } = await supabase
        .from('teacher_branch_assignments')
        .select(`
          class_id,
          classes:class_id(
            id,
            class_name,
            class_level,
            subsystem,
            stream,
            academic_year,
            capacity,
            current_enrollment,
            status
          )
        `)
        .eq('teacher_id', teacherId)
        .eq('academic_year', '2024-2025')
        .eq('term', 'Term 1')

      if (fetchError) {
        throw new Error(`Failed to fetch teacher classes: ${fetchError.message}`)
      }

      // Transform data
      const transformedClasses: ClassOption[] = (data || [])
        .map((assignment: any) => assignment.classes)
        .filter(Boolean)
        .map((cls: any) => ({
          id: cls.id,
          name: cls.class_name,
          level: cls.class_level,
          subsystem: cls.subsystem,
          branch: cls.stream,
          academicYear: cls.academic_year,
          capacity: cls.capacity || 0,
          currentEnrollment: cls.current_enrollment || 0,
          status: cls.status
        }))

      setClasses(transformedClasses)
    } catch (err) {
      console.error('Error fetching teacher classes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch teacher classes')
      setClasses([])
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    fetchTeacherClasses()
  }, [fetchTeacherClasses])

  return {
    classes,
    isLoading,
    error,
    refetch: fetchTeacherClasses
  }
}
