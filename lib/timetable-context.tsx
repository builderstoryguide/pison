"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { serializeSupabaseError } from '@/lib/safe-error'
import { apiGet, ApiResponse } from '@/lib/api-utils'

export interface TimetablePeriod {
  id: string
  day: string
  startTime: string
  endTime: string
  subject: string
  teacher: string
  room: string
  class: string
}

export interface TimetableClass {
  id: string
  name: string
  level: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  periods: TimetablePeriod[]
}

export interface TimetableTeacher {
  id: string
  name: string
  subjects: string[]
  maxPeriodsPerDay: number
}

export interface TimetableRoom {
  id: string
  name: string
  capacity: number
  type: "classroom" | "laboratory" | "library" | "hall"
}

// Timetable generation options interface
export interface TimetableGenerationOptions {
  schoolStartTime?: string;
  schoolEndTime?: string;
  periodDuration?: number;
  breakDuration?: number;
  includeLunchBreak?: boolean;
  lunchBreakStartTime?: string;
  lunchBreakDuration?: number;
  daysPerWeek?: number;
  periodsPerDay?: number;
  customPeriodsPerDay?: boolean;
  mondayPeriods?: number;
  tuesdayPeriods?: number;
  wednesdayPeriods?: number;
  thursdayPeriods?: number;
  fridayPeriods?: number;
  saturdayPeriods?: number;
}

interface TimetableContextType {
  classes: TimetableClass[]
  teachers: TimetableTeacher[]
  rooms: TimetableRoom[]
  generateTimetable: (classId: string, options?: TimetableGenerationOptions) => Promise<{ success: boolean; error?: string }>
  deleteTimetable: (classId: string) => Promise<{ success: boolean; error?: string }>
  bulkDeleteTimetables: (classIds: string[]) => Promise<{ success: boolean; deletedCount: number; errors: string[] }>
  exportTimetable: (classId: string) => Promise<{ success: boolean; error?: string }>
  refreshClasses: (filters?: { subsystem?: string; branch?: string; academicYear?: string }) => Promise<void>
  loadClassesWithFilters: (filters: { subsystem?: string; branch?: string; academicYear?: string }) => Promise<void>
  isLoading: boolean
  error: string | null
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined)

// Mock data for fallback
const mockTeachers: TimetableTeacher[] = [
  {
    id: "1",
    name: "Paul Biya Mbeki",
    subjects: ["Mathematics", "Physics"],
    maxPeriodsPerDay: 6
  },
  {
    id: "2",
    name: "Marie Ngozi",
    subjects: ["English Language", "Literature"],
    maxPeriodsPerDay: 6
  },
  {
    id: "3",
    name: "Jean Claude",
    subjects: ["Biology", "Chemistry"],
    maxPeriodsPerDay: 6
  },
  {
    id: "4",
    name: "Grace Tabi",
    subjects: ["History", "Geography"],
    maxPeriodsPerDay: 6
  },
  {
    id: "5",
    name: "Amina Fru",
    subjects: ["French Language", "Spanish"],
    maxPeriodsPerDay: 6
  }
]

const mockRooms: TimetableRoom[] = [
  {
    id: "1",
    name: "Room 101",
    capacity: 30,
    type: "classroom"
  },
  {
    id: "2",
    name: "Room 102",
    capacity: 30,
    type: "classroom"
  },
  {
    id: "3",
    name: "Science Lab 1",
    capacity: 25,
    type: "laboratory"
  },
  {
    id: "4",
    name: "Computer Lab",
    capacity: 20,
    type: "laboratory"
  },
  {
    id: "5",
    name: "Library",
    capacity: 50,
    type: "library"
  },
  {
    id: "6",
    name: "Assembly Hall",
    capacity: 200,
    type: "hall"
  }
]

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = [
  "08:00-08:45", "08:45-09:30", "09:30-10:15", "10:15-11:00",
  "11:00-11:45", "11:45-12:30", "12:30-13:15", "13:15-14:00",
  "14:00-14:45", "14:45-15:30", "15:30-16:15", "16:15-17:00"
]

export function TimetableProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<TimetableClass[]>([])
  const [teachers, setTeachers] = useState<TimetableTeacher[]>(mockTeachers)
  const [rooms, setRooms] = useState<TimetableRoom[]>(mockRooms)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadClassesWithFilters = async (filters: { subsystem?: string; branch?: string; academicYear?: string } = {}) => {
    setIsLoading(true)
    setError(null)
    
    // Build query parameters helper function
    const buildParams = () => {
      const params = new URLSearchParams()
      if (filters.subsystem && filters.subsystem !== 'all') {
        params.append('subsystem', filters.subsystem)
      }
      if (filters.branch && filters.branch !== 'all') {
        params.append('branch', filters.branch)
      }
      if (filters.academicYear) {
        params.append('academicYear', filters.academicYear)
      }
      return params
    }

    // Helper function to serialize API response errors
    const serializeApiError = (error: unknown, endpointName: string, status?: number) => {
      try {
        if (error === null || error === undefined) {
          return {
            message: `Unknown error from ${endpointName} endpoint`,
            type: 'null_error',
            endpoint: endpointName,
            status: status || 0,
            timestamp: new Date().toISOString()
          }
        }

        const serialized = serializeSupabaseError(error)
        return {
          ...serialized,
          endpoint: endpointName,
          status: status || serialized.status || 0
        }
      } catch (serializationError) {
        return {
          message: `Error occurred but could not be serialized: ${error instanceof Error ? error.message : String(error)}`,
          type: 'serialization_failure',
          endpoint: endpointName,
          status: status || 0,
          rawError: String(error),
          timestamp: new Date().toISOString()
        }
      }
    }

    let primaryError: ReturnType<typeof serializeApiError> | null = null

    try {
      // Try the primary endpoint: admin-classes
      const params = buildParams()
      const primaryUrl = `/api/timetable/admin-classes${params.toString() ? `?${params.toString()}` : ''}`
      
      console.log('[Timetable] Attempting to load classes from primary endpoint:', primaryUrl)
      const primaryResponse: ApiResponse<any> = await apiGet(primaryUrl)
      
      if (!primaryResponse.success) {
        // Create error object from apiGet response
        const errorObj = primaryResponse.error 
          ? new Error(primaryResponse.error)
          : new Error(`HTTP ${primaryResponse.status || 500}: Request failed`)
        
        primaryError = serializeApiError(errorObj, 'admin-classes', primaryResponse.status)
        
        // Log raw error first for debugging
        console.error('[Timetable] Raw primary endpoint error:', {
          error: errorObj,
          response: primaryResponse,
          errorType: typeof errorObj,
          context: 'primary_endpoint'
        })
        
        // Log serialized error with full context
        console.error('[Timetable] Primary endpoint failed:', {
          errorDetails: primaryError,
          url: primaryUrl,
          status: primaryResponse.status,
          stack: new Error().stack
        })
        
        throw errorObj
      }

      const result = primaryResponse.data

      if (!result || !result.success || !result.classes) {
        const errorMsg = 'Invalid response format from primary endpoint: missing success flag or classes array'
        const errorObj = new Error(errorMsg)
        primaryError = serializeApiError(errorObj, 'admin-classes', primaryResponse.status)
        
        // Log error
        console.error('[Timetable] Primary endpoint invalid response:', {
          errorDetails: primaryError,
          receivedData: result,
          url: primaryUrl
        })
        
        throw errorObj
      }

      // Transform API response to match our interface
      const transformedClasses: TimetableClass[] = result.classes.map((apiClass: any) => ({
        id: apiClass.id,
        name: apiClass.name,
        level: apiClass.level,
        subsystem: apiClass.subsystem,
        branch: apiClass.branch,
        periods: [] // Will be loaded separately when needed
      }))
      
      setClasses(transformedClasses)
      console.log('[Timetable] Successfully loaded classes from primary endpoint:', transformedClasses.length, 'classes')
      
    } catch (primaryErrorObj) {
      // Preserve primary error details if not already set
      if (!primaryError) {
        primaryError = serializeApiError(primaryErrorObj, 'admin-classes')
      }

      // Log raw error first
      console.error('[Timetable] Raw primary endpoint catch block error:', {
        error: primaryErrorObj,
        errorType: typeof primaryErrorObj,
        errorConstructor: primaryErrorObj instanceof Error ? primaryErrorObj.constructor.name : undefined,
        context: 'primary_endpoint_catch'
      })

      // Log serialized error with full context
      console.error('[Timetable] Primary endpoint error:', {
        errorDetails: primaryError,
        stack: primaryErrorObj instanceof Error ? primaryErrorObj.stack : new Error().stack
      })

      // Try fallback endpoint: timetable classes
      let fallbackError: ReturnType<typeof serializeApiError> | null = null

      try {
        const params = buildParams()
        const fallbackUrl = `/api/timetable/classes${params.toString() ? `?${params.toString()}` : ''}`
        
        console.log('[Timetable] Attempting fallback to secondary endpoint:', fallbackUrl)
        const fallbackResponse: ApiResponse<any> = await apiGet(fallbackUrl)
        
        if (!fallbackResponse.success) {
          // Create error object from apiGet response
          const errorObj = fallbackResponse.error 
            ? new Error(fallbackResponse.error)
            : new Error(`HTTP ${fallbackResponse.status || 500}: Request failed`)
          
          fallbackError = serializeApiError(errorObj, 'classes', fallbackResponse.status)
          
          // Log raw error first for debugging
          console.error('[Timetable] Raw fallback endpoint error:', {
            error: errorObj,
            response: fallbackResponse,
            errorType: typeof errorObj,
            context: 'fallback_endpoint'
          })
          
          // Log serialized error with full context
          console.error('[Timetable] Fallback endpoint failed:', {
            errorDetails: fallbackError,
            url: fallbackUrl,
            status: fallbackResponse.status,
            stack: new Error().stack
          })
          
          throw errorObj
        }

        const fallbackResult = fallbackResponse.data

        if (!fallbackResult || !fallbackResult.success || !fallbackResult.classes) {
          const errorMsg = 'Invalid response format from fallback endpoint: missing success flag or classes array'
          const errorObj = new Error(errorMsg)
          fallbackError = serializeApiError(errorObj, 'classes', fallbackResponse.status)
          
          // Log error
          console.error('[Timetable] Fallback endpoint invalid response:', {
            errorDetails: fallbackError,
            receivedData: fallbackResult,
            url: fallbackUrl
          })
          
          throw errorObj
        }

        // Transform API response to match our interface
        const transformedClasses: TimetableClass[] = fallbackResult.classes.map((apiClass: any) => ({
          id: apiClass.id,
          name: apiClass.name,
          level: apiClass.level,
          subsystem: apiClass.subsystem,
          branch: apiClass.branch,
          periods: [] // Will be loaded separately when needed
        }))
        
        setClasses(transformedClasses)
        setError('Using timetable classes instead of admin classes. For full functionality, please create classes in the Class Management section.')
        console.log('[Timetable] Successfully loaded classes from fallback endpoint:', transformedClasses.length, 'classes')
        
      } catch (fallbackErrorObj) {
        // Preserve fallback error details if not already set
        if (!fallbackError) {
          fallbackError = serializeApiError(fallbackErrorObj, 'classes')
        }

        // Log raw error first
        console.error('[Timetable] Raw fallback endpoint catch block error:', {
          error: fallbackErrorObj,
          errorType: typeof fallbackErrorObj,
          errorConstructor: fallbackErrorObj instanceof Error ? fallbackErrorObj.constructor.name : undefined,
          context: 'fallback_endpoint_catch'
        })

        // Log serialized error with full context
        console.error('[Timetable] Both endpoints failed:', {
          primaryErrorDetails: primaryError,
          fallbackErrorDetails: fallbackError,
          rawFallbackError: fallbackErrorObj,
          stack: fallbackErrorObj instanceof Error ? fallbackErrorObj.stack : new Error().stack
        })

        // Both endpoints failed - combine error messages
        const primaryMessage = primaryError?.message || 'Unknown error'
        const fallbackMessage = fallbackError?.message || 'Unknown error'
        const combinedErrorMessages = [
          `Primary endpoint (${primaryError?.endpoint || 'admin-classes'}) failed: ${primaryMessage}`,
          `Fallback endpoint (${fallbackError?.endpoint || 'classes'}) failed: ${fallbackMessage}`
        ]

        // Provide actionable error message based on error types
        let userFriendlyMessage = 'Failed to load classes from both endpoints:\n'
        userFriendlyMessage += `• ${combinedErrorMessages[0]}\n`
        userFriendlyMessage += `• ${combinedErrorMessages[1]}`

        // Add specific guidance based on error content
        if (primaryMessage.includes('Classes table not found') || 
            fallbackMessage.includes('Database not set up') ||
            fallbackMessage.includes('timetable_classes')) {
          userFriendlyMessage += '\n\nPlease ensure the database tables are properly set up. Run the timetable database setup script if needed.'
        } else if (primaryMessage.includes('Missing environment variables') ||
                   fallbackMessage.includes('Missing environment variables')) {
          userFriendlyMessage += '\n\nPlease check your environment variables configuration (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).'
        } else if (primaryError?.status === 404 || fallbackError?.status === 404) {
          userFriendlyMessage += '\n\nOne or more API endpoints may not be available. Please check your API routes configuration.'
        } else if ((primaryError?.status && primaryError.status >= 500) || (fallbackError?.status && fallbackError.status >= 500)) {
          userFriendlyMessage += '\n\nServer error detected. Please check the server logs and database connection.'
        }

        setError(userFriendlyMessage)
        setClasses([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadClasses = async () => {
    await loadClassesWithFilters()
  }

  const refreshClasses = async (filters?: { subsystem?: string; branch?: string; academicYear?: string }) => {
    await loadClassesWithFilters(filters)
  }

  const loadTimetableForClass = async (classId: string) => {
    try {
      const response = await fetch(`/api/timetable?classId=${classId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.timetables) {
        // Transform API response to match our interface
        const transformedPeriods: TimetablePeriod[] = result.timetables.map((period: any) => ({
          id: period.period_id || period.id,
          day: period.day_of_week,
          startTime: period.start_time,
          endTime: period.end_time,
          subject: period.subject_name || 'TBD',
          teacher: period.teacher_name || 'TBD',
          room: period.room_name || 'TBD',
          class: period.class_name || 'TBD'
        }))

        // Update the class with periods
        setClasses(prev => prev.map(c => 
          c.id === classId 
            ? { ...c, periods: transformedPeriods }
            : c
        ))

        return transformedPeriods
      } else {
        throw new Error('Invalid response format from API')
      }
    } catch (error) {
      console.error('Failed to load timetable for class:', error)
      throw error
    }
  }



  useEffect(() => {
    loadClasses()
  }, [])

  const generateTimetable = async (classId: string, options?: TimetableGenerationOptions): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Use the new API endpoint that handles admin classes
      const response = await fetch('/api/timetable/generate-from-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          academicYear: '2024-2025',
          term: 'first',
          generatedBy: 'admin', // In production, get from auth context
          // Include custom timetable generation options if provided
          ...options
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // If the new endpoint fails, try the original endpoint as fallback
        if (response.status === 404 && result.error?.includes('Admin class not found')) {
          // Try the original endpoint
          const fallbackResponse = await fetch('/api/timetable', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              classId,
              academicYear: '2024-2025',
              term: 'first',
              generatedBy: 'admin'
            }),
          })

          const fallbackResult = await fallbackResponse.json()

          if (!fallbackResponse.ok) {
            throw new Error(fallbackResult.error || 'Failed to generate timetable')
          }

          if (fallbackResult.success) {
            // Load the generated timetable
            await loadTimetableForClass(classId)
            return { success: true }
          } else {
            throw new Error(fallbackResult.error || 'Failed to generate timetable')
          }
        } else {
          throw new Error(result.error || 'Failed to generate timetable')
        }
      }

      if (result.success) {
        // Load the generated timetable
        await loadTimetableForClass(classId)
        return { success: true }
      } else {
        throw new Error(result.error || 'Failed to generate timetable')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate timetable'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTimetable = async (classId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Try to delete using the admin class ID first
      const response = await fetch(`/api/timetable/delete-from-admin?classId=${classId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        // If the admin endpoint fails, try the original endpoint as fallback
        if (response.status === 404) {
          // Try the original endpoint
          const fallbackResponse = await fetch(`/api/timetable?classId=${classId}`, {
            method: 'DELETE',
          })

          const fallbackResult = await fallbackResponse.json()

          if (!fallbackResponse.ok) {
            throw new Error(fallbackResult.error || 'Failed to delete timetable')
          }

          if (fallbackResult.success) {
            // Update the class to remove periods
            setClasses(prev => prev.map(c => 
              c.id === classId 
                ? { ...c, periods: [] }
                : c
            ))
            return { success: true }
          } else {
            throw new Error(fallbackResult.error || 'Failed to delete timetable')
          }
        } else {
          throw new Error(result.error || 'Failed to delete timetable')
        }
      }

      if (result.success) {
        // Update the class to remove periods
        setClasses(prev => prev.map(c => 
          c.id === classId 
            ? { ...c, periods: [] }
            : c
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
  }

  const bulkDeleteTimetables = async (classIds: string[]): Promise<{ success: boolean; deletedCount: number; errors: string[] }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Try to delete using the admin class IDs first
      const response = await fetch('/api/timetable/bulk-delete-from-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classIds }),
      })

      const result = await response.json()

      if (!response.ok) {
        // If the admin endpoint fails, try the original endpoint as fallback
        if (response.status === 404) {
          // Try the original endpoint
          const fallbackResponse = await fetch('/api/timetable/bulk-delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ classIds }),
          })

          const fallbackResult = await fallbackResponse.json()

          if (!fallbackResponse.ok) {
            throw new Error(fallbackResult.error || 'Failed to delete timetables')
          }

          if (fallbackResult.success) {
            // Update the classes to remove periods for deleted timetables
            setClasses(prev => prev.map(c => 
              classIds.includes(c.id) 
                ? { ...c, periods: [] }
                : c
            ))
            
            return {
              success: true,
              deletedCount: fallbackResult.deletedCount,
              errors: fallbackResult.errors || []
            }
          } else {
            throw new Error(fallbackResult.error || 'Failed to delete timetables')
          }
        } else {
          throw new Error(result.error || 'Failed to delete timetables')
        }
      }

      if (result.success) {
        // Update the classes to remove periods for deleted timetables
        setClasses(prev => prev.map(c => 
          classIds.includes(c.id) 
            ? { ...c, periods: [] }
            : c
        ))
        
        return {
          success: true,
          deletedCount: result.deletedCount,
          errors: result.errors || []
        }
      } else {
        throw new Error(result.error || 'Failed to delete timetables')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete timetables'
      setError(errorMessage)
      return {
        success: false,
        deletedCount: 0,
        errors: [errorMessage]
      }
    } finally {
      setIsLoading(false)
    }
  }

  const exportTimetable = async (classId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const selectedClass = classes.find(c => c.id === classId)
      if (!selectedClass || selectedClass.periods.length === 0) {
        throw new Error('No timetable to export')
      }

      // Create CSV content
      const csvContent = [
        ['Day', 'Time', 'Subject', 'Teacher', 'Room'].join(','),
        ...selectedClass.periods.map(period => [
          period.day,
          `${period.startTime}-${period.endTime}`,
          period.subject,
          period.teacher,
          period.room
        ].join(','))
      ].join('\n')

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timetable_${selectedClass.name.replace(/\s+/g, '_')}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export timetable'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  return (
    <TimetableContext.Provider value={{
      classes,
      teachers,
      rooms,
      generateTimetable,
      deleteTimetable,
      bulkDeleteTimetables,
      exportTimetable,
      refreshClasses,
      loadClassesWithFilters,
      isLoading,
      error
    }}>
      {children}
    </TimetableContext.Provider>
  )
}

export function useTimetable() {
  const context = useContext(TimetableContext)
  if (context === undefined) {
    throw new Error('useTimetable must be used within a TimetableProvider')
  }
  return context
}
