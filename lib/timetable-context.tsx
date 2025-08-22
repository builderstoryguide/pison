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
  isLoading: boolean
  error: string | null
  generateTimetable: (classId: string) => Promise<{ success: boolean; error?: string }>
  updateTimetable: (classId: string, periods: TimetablePeriod[]) => Promise<{ success: boolean; error?: string }>
  deleteTimetable: (classId: string) => Promise<{ success: boolean; error?: string }>
  exportTimetable: (classId: string) => Promise<{ success: boolean; error?: string }>
  getClassTimetable: (classId: string) => TimetablePeriod[]
  getTeacherTimetable: (teacherId: string) => TimetablePeriod[]
  getRoomTimetable: (roomId: string) => TimetablePeriod[]
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined)

// Mock data
const mockClasses: TimetableClass[] = [
  {
    id: "CLS001",
    name: "Form 1A",
    level: "Form 1",
    subsystem: "english",
    branch: "grammar",
    periods: []
  },
  {
    id: "CLS002",
    name: "Form 2B",
    level: "Form 2",
    subsystem: "english",
    branch: "technical",
    periods: []
  },
  {
    id: "CLS003",
    name: "Form 5 Science",
    level: "Form 5",
    subsystem: "english",
    branch: "grammar",
    periods: []
  },
  {
    id: "CLS004",
    name: "Form 3A",
    level: "Form 3",
    subsystem: "english",
    branch: "commercial",
    periods: []
  },
  {
    id: "CLS005",
    name: "Sixième A",
    level: "Sixième",
    subsystem: "french",
    branch: "grammar",
    periods: []
  }
]

const mockTeachers: TimetableTeacher[] = [
  {
    id: "TCH001",
    name: "Mr. John Doe",
    subjects: ["Mathematics", "Physics"],
    maxPeriodsPerDay: 6
  },
  {
    id: "TCH002",
    name: "Mrs. Sarah Johnson",
    subjects: ["English Language", "Literature"],
    maxPeriodsPerDay: 5
  },
  {
    id: "TCH003",
    name: "Dr. Mary Smith",
    subjects: ["Biology", "Chemistry"],
    maxPeriodsPerDay: 6
  },
  {
    id: "TCH004",
    name: "Mr. David Wilson",
    subjects: ["History", "Geography"],
    maxPeriodsPerDay: 5
  },
  {
    id: "TCH005",
    name: "Mrs. Grace Tabi",
    subjects: ["French Language", "Spanish"],
    maxPeriodsPerDay: 4
  }
]

const mockRooms: TimetableRoom[] = [
  {
    id: "RM001",
    name: "Room 101",
    capacity: 40,
    type: "classroom"
  },
  {
    id: "RM002",
    name: "Science Lab 1",
    capacity: 30,
    type: "laboratory"
  },
  {
    id: "RM003",
    name: "Computer Lab",
    capacity: 25,
    type: "laboratory"
  },
  {
    id: "RM004",
    name: "Room 102",
    capacity: 35,
    type: "classroom"
  },
  {
    id: "RM005",
    name: "Library",
    capacity: 50,
    type: "library"
  }
]

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = [
  "08:00-08:45", "08:45-09:30", "09:30-10:15", "10:15-11:00",
  "11:00-11:45", "11:45-12:30", "12:30-13:15", "13:15-14:00",
  "14:00-14:45", "14:45-15:30", "15:30-16:15", "16:15-17:00"
]

export function TimetableProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<TimetableClass[]>(mockClasses)
  const [teachers, setTeachers] = useState<TimetableTeacher[]>(mockTeachers)
  const [rooms, setRooms] = useState<TimetableRoom[]>(mockRooms)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateTimetable = async (classId: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      const selectedClass = classes.find(c => c.id === classId)
      if (!selectedClass) {
        throw new Error("Selected class not found")
      }

      // Generate mock timetable periods
      const generatedPeriods: TimetablePeriod[] = []
      const subjects = ["Mathematics", "English Language", "Biology", "Chemistry", "Physics", "History", "Geography", "French Language"]
      
      daysOfWeek.forEach(day => {
        timeSlots.slice(0, 8).forEach((timeSlot, index) => {
          const [startTime, endTime] = timeSlot.split("-")
          const subject = subjects[index % subjects.length]
          const teacher = teachers.find(t => t.subjects.includes(subject))?.name || "TBD"
          const room = rooms[Math.floor(Math.random() * rooms.length)]?.name || "TBD"

          generatedPeriods.push({
            id: `${selectedClass.id}_${day}_${index}`,
            day,
            startTime,
            endTime,
            subject,
            teacher,
            room,
            class: selectedClass.name
          })
        })
      })

      // Update the class with generated periods
      setClasses(prev => prev.map(c => 
        c.id === classId 
          ? { ...c, periods: generatedPeriods }
          : c
      ))

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate timetable"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const updateTimetable = async (classId: string, periods: TimetablePeriod[]): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setClasses(prev => prev.map(c => 
        c.id === classId 
          ? { ...c, periods }
          : c
      ))

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update timetable"
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setClasses(prev => prev.map(c => 
        c.id === classId 
          ? { ...c, periods: [] }
          : c
      ))

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete timetable"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const exportTimetable = async (classId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const classData = classes.find(c => c.id === classId)
      if (!classData) {
        throw new Error("Class not found")
      }

      // Create CSV content
      const csvContent = [
        ["Day", "Time", "Subject", "Teacher", "Room"],
        ...classData.periods.map(p => [p.day, `${p.startTime}-${p.endTime}`, p.subject, p.teacher, p.room])
      ].map(row => row.join(",")).join("\n")

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${classData.name}_timetable.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to export timetable"
      return { success: false, error: errorMessage }
    }
  }

  const getClassTimetable = (classId: string): TimetablePeriod[] => {
    const classData = classes.find(c => c.id === classId)
    return classData?.periods || []
  }

  const getTeacherTimetable = (teacherId: string): TimetablePeriod[] => {
    const teacher = teachers.find(t => t.id === teacherId)
    if (!teacher) return []

    return classes.flatMap(c => 
      c.periods.filter(p => p.teacher === teacher.name)
    )
  }

  const getRoomTimetable = (roomId: string): TimetablePeriod[] => {
    const room = rooms.find(r => r.id === roomId)
    if (!room) return []

    return classes.flatMap(c => 
      c.periods.filter(p => p.room === room.name)
    )
  }

  const value: TimetableContextType = {
    classes,
    teachers,
    rooms,
    isLoading,
    error,
    generateTimetable,
    updateTimetable,
    deleteTimetable,
    exportTimetable,
    getClassTimetable,
    getTeacherTimetable,
    getRoomTimetable
  }

  return <TimetableContext.Provider value={value}>{children}</TimetableContext.Provider>
}

export function useTimetable() {
  const context = useContext(TimetableContext)
  if (context === undefined) {
    throw new Error("useTimetable must be used within a TimetableProvider")
  }
  return context
}
