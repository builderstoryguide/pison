'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

// Enhanced interfaces with status tracking
export interface TimetablePeriod {
  id: string
  day: string
  startTime: string
  endTime: string
  subject: string
  teacher: string
  room: string
  periodNumber?: number
  periodType?: 'regular' | 'break' | 'lunch' | 'assembly' | 'exam'
  notes?: string
}

export interface TimetableClass {
  id: string
  name: string
  level: string
  subsystem: string
  branch: string
  periods: TimetablePeriod[]
  status: 'not_generated' | 'generating' | 'generated' | 'modified' | 'error'
  lastGenerated?: string
  lastModified?: string
  generatedBy?: string
  totalPeriods?: number
  academicYear?: string
  term?: string
}

export interface TimetableTeacher {
  id: string
  name: string
  subjects: string[]
  maxPeriodsPerDay: number
  email?: string
  phone?: string
}

export interface TimetableRoom {
  id: string
  name: string
  capacity: number
  type: string
  equipment?: string[]
}

export interface TimetableGenerationOptions {
  schoolStartTime?: string
  schoolEndTime?: string
  periodDuration?: number
  breakDuration?: number
  includeLunchBreak?: boolean
  lunchBreakStartTime?: string
  lunchBreakDuration?: number
  daysPerWeek?: number
  periodsPerDay?: number
  customPeriodsPerDay?: boolean
  mondayPeriods?: number
  tuesdayPeriods?: number
  wednesdayPeriods?: number
  thursdayPeriods?: number
  fridayPeriods?: number
  saturdayPeriods?: number
}

export interface PeriodUpdateData {
  subject?: string
  teacher?: string
  room?: string
  startTime?: string
  endTime?: string
  notes?: string
}

interface EnhancedTimetableContextType {
  // State
  classes: TimetableClass[]
  teachers: TimetableTeacher[]
  rooms: TimetableRoom[]
  isLoading: boolean
  error: string | null
  
  // Generation operations
  generateTimetable: (classId: string, academicYear?: string, term?: string, generatedBy?: string, options?: TimetableGenerationOptions) => Promise<{ success: boolean; error?: string }>
  regenerateTimetable: (classId: string, options?: TimetableGenerationOptions) => Promise<{ success: boolean; error?: string }>
  
  // CRUD operations for periods
  createPeriod: (classId: string, period: Omit<TimetablePeriod, 'id'>) => Promise<{ success: boolean; error?: string; periodId?: string }>
  updatePeriod: (classId: string, periodId: string, updates: PeriodUpdateData) => Promise<{ success: boolean; error?: string }>
  deletePeriod: (classId: string, periodId: string) => Promise<{ success: boolean; error?: string }>
  
  // Bulk period operations
  bulkUpdatePeriods: (classId: string, updates: Array<{ periodId: string; updates: PeriodUpdateData }>) => Promise<{ success: boolean; error?: string; updatedCount: number }>
  bulkDeletePeriods: (classId: string, periodIds: string[]) => Promise<{ success: boolean; error?: string; deletedCount: number }>
  
  // Timetable operations
  duplicateTimetable: (sourceClassId: string, targetClassId: string) => Promise<{ success: boolean; error?: string }>
  validateTimetable: (classId: string) => Promise<{ success: boolean; conflicts: Array<{ type: string; message: string; periods: string[] }> }>
  
  // Status operations
  updateTimetableStatus: (classId: string, status: TimetableClass['status'], metadata?: { lastModified?: string; generatedBy?: string }) => Promise<{ success: boolean; error?: string }>
  
  // Delete operations
  deleteTimetable: (classId: string) => Promise<{ success: boolean; error?: string }>
  bulkDeleteTimetables: (classIds: string[]) => Promise<{ success: boolean; deletedCount: number; errors: string[] }>
  
  // Export operations
  exportTimetable: (classId: string, format?: 'csv' | 'pdf' | 'json') => Promise<{ success: boolean; error?: string }>
  
  // Data loading
  refreshClasses: () => Promise<void>
  loadClassesWithFilters: (filters: { subsystem?: string; branch?: string; academicYear?: string }) => Promise<void>
  
  // Utility functions
  getTimetableStatistics: (classId: string) => { totalPeriods: number; daysWithPeriods: number; subjects: string[]; teachers: string[] }
  getConflicts: (classId: string) => Array<{ type: string; message: string; periods: TimetablePeriod[] }>
}

const EnhancedTimetableContext = createContext<EnhancedTimetableContextType | undefined>(undefined)

export function EnhancedTimetableProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<TimetableClass[]>([])
  const [teachers, setTeachers] = useState<TimetableTeacher[]>([])
  const [rooms, setRooms] = useState<TimetableRoom[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock data for development
  const mockTeachers: TimetableTeacher[] = [
    { id: "1", name: "Paul Biya Mbeki", subjects: ["Mathematics", "Physics"], maxPeriodsPerDay: 6 },
    { id: "2", name: "Marie Ngozi", subjects: ["English Language", "Literature"], maxPeriodsPerDay: 6 },
    { id: "3", name: "Jean Claude", subjects: ["Biology", "Chemistry"], maxPeriodsPerDay: 6 },
    { id: "4", name: "Grace Tabi", subjects: ["History", "Geography"], maxPeriodsPerDay: 6 },
    { id: "5", name: "Amina Fru", subjects: ["French Language", "Spanish"], maxPeriodsPerDay: 6 }
  ]

  const mockRooms: TimetableRoom[] = [
    { id: "1", name: "Room A1", capacity: 30, type: "Classroom" },
    { id: "2", name: "Room A2", capacity: 30, type: "Classroom" },
    { id: "3", name: "Lab 1", capacity: 25, type: "Laboratory" },
    { id: "4", name: "Lab 2", capacity: 25, type: "Laboratory" },
    { id: "5", name: "Hall", capacity: 100, type: "Assembly Hall" }
  ]

  // Initialize mock data
  useEffect(() => {
    setTeachers(mockTeachers)
    setRooms(mockRooms)
  }, [])

  // Load classes with filters
  const loadClassesWithFilters = useCallback(async (filters: { subsystem?: string; branch?: string; academicYear?: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.subsystem && filters.subsystem !== 'all') params.append('subsystem', filters.subsystem)
      if (filters.branch && filters.branch !== 'all') params.append('branch', filters.branch)
      if (filters.academicYear) params.append('academicYear', filters.academicYear)

      const response = await fetch(`/api/timetable/admin-classes?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load classes')
      }

      if (result.success && result.classes) {
        // Transform API response to include status
        const transformedClasses: TimetableClass[] = result.classes.map((cls: any) => ({
          id: cls.id,
          name: cls.class_name || cls.name,
          level: cls.class_level || cls.level,
          subsystem: cls.subsystem,
          branch: cls.stream || cls.branch,
          periods: cls.periods || [],
          status: cls.periods && cls.periods.length > 0 ? 'generated' : 'not_generated',
          lastGenerated: cls.last_generated,
          lastModified: cls.last_modified,
          generatedBy: cls.generated_by,
          totalPeriods: cls.periods ? cls.periods.length : 0,
          academicYear: cls.academic_year,
          term: cls.term
        }))

        setClasses(transformedClasses)
      } else {
        setClasses([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load classes'
      setError(errorMessage)
      console.error('Error loading classes:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Generate timetable with status updates
  const generateTimetable = useCallback(async (
    classId: string, 
    academicYear: string = '2024-2025', 
    term: string = 'first', 
    generatedBy: string = 'admin',
    options?: TimetableGenerationOptions
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      // Update status to generating
      await updateTimetableStatus(classId, 'generating')

      const response = await fetch('/api/timetable/generate-from-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          academicYear,
          term,
          generatedBy,
          ...options
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        await updateTimetableStatus(classId, 'error')
        throw new Error(result.error || 'Failed to generate timetable')
      }

      if (result.success) {
        // Update status to generated and refresh data
        await updateTimetableStatus(classId, 'generated', {
          lastModified: new Date().toISOString(),
          generatedBy
        })
        
        await refreshClasses()
        return { success: true }
      } else {
        await updateTimetableStatus(classId, 'error')
        throw new Error(result.error || 'Failed to generate timetable')
      }
    } catch (err) {
      await updateTimetableStatus(classId, 'error')
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate timetable'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update timetable status
  const updateTimetableStatus = useCallback(async (
    classId: string, 
    status: TimetableClass['status'], 
    metadata?: { lastModified?: string; generatedBy?: string }
  ) => {
    try {
      // Update local state immediately for better UX
      setClasses(prev => prev.map(cls => 
        cls.id === classId 
          ? { 
              ...cls, 
              status,
              lastModified: metadata?.lastModified || cls.lastModified,
              generatedBy: metadata?.generatedBy || cls.generatedBy
            }
          : cls
      ))

      // In a real implementation, you would also update the database
      // const response = await fetch(`/api/timetable/status`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ classId, status, ...metadata })
      // })

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status'
      return { success: false, error: errorMessage }
    }
  }, [])

  // Create a new period
  const createPeriod = useCallback(async (classId: string, period: Omit<TimetablePeriod, 'id'>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/timetable/periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          ...period
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create period')
      }

      if (result.success) {
        const newPeriod: TimetablePeriod = {
          id: result.periodId || Date.now().toString(),
          ...period
        }

        // Update local state
        setClasses(prev => prev.map(cls => 
          cls.id === classId 
            ? { 
                ...cls, 
                periods: [...cls.periods, newPeriod],
                status: 'modified',
                lastModified: new Date().toISOString()
              }
            : cls
        ))

        return { success: true, periodId: newPeriod.id }
      } else {
        throw new Error(result.error || 'Failed to create period')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create period'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update a period
  const updatePeriod = useCallback(async (classId: string, periodId: string, updates: PeriodUpdateData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/timetable/periods/${periodId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update period')
      }

      if (result.success) {
        // Update local state
        setClasses(prev => prev.map(cls => 
          cls.id === classId 
            ? { 
                ...cls, 
                periods: cls.periods.map(p => 
                  p.id === periodId ? { ...p, ...updates } : p
                ),
                status: 'modified',
                lastModified: new Date().toISOString()
              }
            : cls
        ))

        return { success: true }
      } else {
        throw new Error(result.error || 'Failed to update period')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update period'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Delete a period
  const deletePeriod = useCallback(async (classId: string, periodId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/timetable/periods/${periodId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete period')
      }

      if (result.success) {
        // Update local state
        setClasses(prev => prev.map(cls => 
          cls.id === classId 
            ? { 
                ...cls, 
                periods: cls.periods.filter(p => p.id !== periodId),
                status: 'modified',
                lastModified: new Date().toISOString()
              }
            : cls
        ))

        return { success: true }
      } else {
        throw new Error(result.error || 'Failed to delete period')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete period'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Bulk update periods
  const bulkUpdatePeriods = useCallback(async (
    classId: string, 
    updates: Array<{ periodId: string; updates: PeriodUpdateData }>
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/timetable/periods/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId, updates }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to bulk update periods')
      }

      if (result.success) {
        // Update local state
        setClasses(prev => prev.map(cls => 
          cls.id === classId 
            ? { 
                ...cls, 
                periods: cls.periods.map(p => {
                  const update = updates.find(u => u.periodId === p.id)
                  return update ? { ...p, ...update.updates } : p
                }),
                status: 'modified',
                lastModified: new Date().toISOString()
              }
            : cls
        ))

        return { success: true, updatedCount: result.updatedCount || updates.length }
      } else {
        throw new Error(result.error || 'Failed to bulk update periods')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update periods'
      setError(errorMessage)
      return { success: false, error: errorMessage, updatedCount: 0 }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Bulk delete periods
  const bulkDeletePeriods = useCallback(async (classId: string, periodIds: string[]) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/timetable/periods/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId, periodIds }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to bulk delete periods')
      }

      if (result.success) {
        // Update local state
        setClasses(prev => prev.map(cls => 
          cls.id === classId 
            ? { 
                ...cls, 
                periods: cls.periods.filter(p => !periodIds.includes(p.id)),
                status: 'modified',
                lastModified: new Date().toISOString()
              }
            : cls
        ))

        return { success: true, deletedCount: result.deletedCount || periodIds.length }
      } else {
        throw new Error(result.error || 'Failed to bulk delete periods')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk delete periods'
      setError(errorMessage)
      return { success: false, error: errorMessage, deletedCount: 0 }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Regenerate timetable
  const regenerateTimetable = useCallback(async (classId: string, options?: TimetableGenerationOptions) => {
    // First delete existing timetable, then generate new one
    const deleteResult = await deleteTimetable(classId)
    if (!deleteResult.success) {
      return deleteResult
    }
    
    return generateTimetable(classId, '2024-2025', 'first', 'admin', options)
  }, [])

  // Duplicate timetable
  const duplicateTimetable = useCallback(async (sourceClassId: string, targetClassId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const sourceClass = classes.find(c => c.id === sourceClassId)
      if (!sourceClass || sourceClass.periods.length === 0) {
        throw new Error('Source timetable not found or empty')
      }

      // Create periods for target class
      const createPromises = sourceClass.periods.map(period => 
        createPeriod(targetClassId, {
          day: period.day,
          startTime: period.startTime,
          endTime: period.endTime,
          subject: period.subject,
          teacher: period.teacher,
          room: period.room,
          periodNumber: period.periodNumber,
          periodType: period.periodType,
          notes: period.notes
        })
      )

      const results = await Promise.allSettled(createPromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        await updateTimetableStatus(targetClassId, 'generated')
        return { success: true }
      } else {
        throw new Error(`Failed to duplicate timetable: ${failed} periods failed`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate timetable'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [classes])

  // Validate timetable
  const validateTimetable = useCallback(async (classId: string) => {
    const classData = classes.find(c => c.id === classId)
    if (!classData) {
      return { success: false, conflicts: [{ type: 'error', message: 'Class not found', periods: [] }] }
    }

    const conflicts: Array<{ type: string; message: string; periods: string[] }> = []

    // Check for time conflicts
    const timeConflicts = new Map<string, TimetablePeriod[]>()
    classData.periods.forEach(period => {
      const key = `${period.day}-${period.startTime}`
      if (!timeConflicts.has(key)) {
        timeConflicts.set(key, [])
      }
      timeConflicts.get(key)!.push(period)
    })

    timeConflicts.forEach((periods, key) => {
      if (periods.length > 1) {
        conflicts.push({
          type: 'time_conflict',
          message: `Multiple periods scheduled at ${key.replace('-', ' ')}`,
          periods: periods.map(p => p.id)
        })
      }
    })

    // Check for teacher conflicts (same teacher in different classes at same time)
    // This would require checking across all classes - simplified for now

    return { success: true, conflicts }
  }, [classes])

  // Delete timetable
  const deleteTimetable = useCallback(async (classId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/timetable/delete-from-admin?classId=${classId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete timetable')
      }

      if (result.success) {
        // Update local state
        setClasses(prev => prev.map(cls => 
          cls.id === classId 
            ? { ...cls, periods: [], status: 'not_generated' }
            : cls
        ))
        return { success: true }
      } else {
        throw new Error(result.error || 'Failed to delete timetable')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete timetable'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Bulk delete timetables
  const bulkDeleteTimetables = useCallback(async (classIds: string[]) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/timetable/bulk-delete-from-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classIds }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to bulk delete timetables')
      }

      // Update local state for all classes
      setClasses(prev => prev.map(cls => 
        classIds.includes(cls.id) 
          ? { ...cls, periods: [], status: 'not_generated' }
          : cls
      ))

      return { 
        success: true, 
        deletedCount: result.deletedCount || classIds.length, 
        errors: result.errors || [] 
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk delete timetables'
      setError(errorMessage)
      return { success: false, deletedCount: 0, errors: [errorMessage] }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Export timetable
  const exportTimetable = useCallback(async (classId: string, format: 'csv' | 'pdf' | 'json' = 'csv') => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/timetable/export?classId=${classId}&format=${format}`, {
        method: 'GET',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to export timetable')
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `timetable-${classId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export timetable'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh classes
  const refreshClasses = useCallback(async () => {
    await loadClassesWithFilters({ academicYear: '2024-2025' })
  }, [loadClassesWithFilters])

  // Utility functions
  const getTimetableStatistics = useCallback((classId: string) => {
    const classData = classes.find(c => c.id === classId)
    if (!classData) {
      return { totalPeriods: 0, daysWithPeriods: 0, subjects: [], teachers: [] }
    }

    const subjects = Array.from(new Set(classData.periods.map(p => p.subject)))
    const teachers = Array.from(new Set(classData.periods.map(p => p.teacher)))
    const daysWithPeriods = Array.from(new Set(classData.periods.map(p => p.day))).length

    return {
      totalPeriods: classData.periods.length,
      daysWithPeriods,
      subjects,
      teachers
    }
  }, [classes])

  const getConflicts = useCallback((classId: string) => {
    const classData = classes.find(c => c.id === classId)
    if (!classData) return []

    const conflicts: Array<{ type: string; message: string; periods: TimetablePeriod[] }> = []
    
    // Group periods by day and time to find conflicts
    const timeSlots = new Map<string, TimetablePeriod[]>()
    
    classData.periods.forEach(period => {
      const key = `${period.day}-${period.startTime}`
      if (!timeSlots.has(key)) {
        timeSlots.set(key, [])
      }
      timeSlots.get(key)!.push(period)
    })

    // Check for time conflicts
    timeSlots.forEach((periods, timeSlot) => {
      if (periods.length > 1) {
        conflicts.push({
          type: 'time_conflict',
          message: `Multiple periods scheduled at ${timeSlot.replace('-', ' on ')}`,
          periods
        })
      }
    })

    return conflicts
  }, [classes])

  const contextValue: EnhancedTimetableContextType = {
    // State
    classes,
    teachers,
    rooms,
    isLoading,
    error,
    
    // Generation operations
    generateTimetable,
    regenerateTimetable,
    
    // CRUD operations for periods
    createPeriod,
    updatePeriod,
    deletePeriod,
    
    // Bulk period operations
    bulkUpdatePeriods,
    bulkDeletePeriods,
    
    // Timetable operations
    duplicateTimetable,
    validateTimetable,
    
    // Status operations
    updateTimetableStatus,
    
    // Delete operations
    deleteTimetable,
    bulkDeleteTimetables,
    
    // Export operations
    exportTimetable,
    
    // Data loading
    refreshClasses,
    loadClassesWithFilters,
    
    // Utility functions
    getTimetableStatistics,
    getConflicts
  }

  return (
    <EnhancedTimetableContext.Provider value={contextValue}>
      {children}
    </EnhancedTimetableContext.Provider>
  )
}

export function useEnhancedTimetable() {
  const context = useContext(EnhancedTimetableContext)
  if (context === undefined) {
    throw new Error('useEnhancedTimetable must be used within an EnhancedTimetableProvider')
  }
  return context
}
