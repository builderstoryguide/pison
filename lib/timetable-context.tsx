"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

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

interface TimetableContextType {
  classes: TimetableClass[]
  teachers: TimetableTeacher[]
  rooms: TimetableRoom[]
  generateTimetable: (classId: string) => Promise<{ success: boolean; error?: string }>
  deleteTimetable: (classId: string) => Promise<{ success: boolean; error?: string }>
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
    
    try {
      // Build query parameters
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

      const url = `/api/timetable/classes${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.classes) {
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
      } else {
        throw new Error('Invalid response format from API')
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load classes'
      setError(errorMessage)
      
      // If it's a database setup error, show a helpful message
      if (errorMessage.includes('Database not set up') || errorMessage.includes('Please run the database setup script')) {
        setError('Database not configured. Please run the timetable setup script in Supabase SQL Editor.')
      }
      
      // Keep empty array if API fails
      setClasses([])
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

  const generateTimetable = async (classId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          academicYear: '2024-2025',
          term: 'first',
          generatedBy: 'admin' // In production, get from auth context
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate timetable')
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
      const response = await fetch(`/api/timetable?classId=${classId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete timetable')
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
