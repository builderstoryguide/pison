"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { useAuth } from "./auth-context"

export interface TeacherClass {
  id: string
  name: string
  level: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  students: TeacherClassStudent[]
  schedule: ClassSchedule[]
}

export interface TeacherClassStudent {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  photo?: string
  enrollmentStatus: "enrolled" | "pending" | "transferred"
}

export interface ClassSchedule {
  id: string
  day: string
  startTime: string
  endTime: string
  subject: string
  period: string
}

export interface AttendanceSession {
  id: string
  classId: string
  className: string
  date: string
  period: string
  subject: string
  teacherId: string
  teacherName: string
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  status: "pending" | "completed" | "locked"
  markedAt?: string
}

export interface AttendanceRecord {
  id: string
  sessionId: string
  studentId: string
  studentName: string
  status: "present" | "absent" | "late" | "excused"
  notes?: string
  markedAt: string
}

interface TeacherAttendanceContextType {
  teacherClasses: TeacherClass[]
  attendanceSessions: AttendanceSession[]
  attendanceRecords: AttendanceRecord[]
  isLoading: boolean
  error: string | null
  getTeacherClasses: () => Promise<TeacherClass[]>
  createAttendanceSession: (sessionData: {
    classId: string
    date: string
    period: string
    subject: string
  }) => Promise<{ success: boolean; sessionId?: string; error?: string }>
  markAttendance: (
    sessionId: string,
    attendanceData: {
      studentId: string
      status: "present" | "absent" | "late" | "excused"
      notes?: string
    }[],
  ) => Promise<{ success: boolean; error?: string }>
  getSessionAttendance: (sessionId: string) => AttendanceRecord[]
  updateAttendanceRecord: (
    recordId: string,
    updates: {
      status?: "present" | "absent" | "late" | "excused"
      notes?: string
    },
  ) => Promise<{ success: boolean; error?: string }>
  getClassSchedule: (classId: string) => ClassSchedule[]
  getTodaySchedule: () => ClassSchedule[]
}

const TeacherAttendanceContext = createContext<TeacherAttendanceContextType | undefined>(undefined)

// Mock data for teacher classes
const mockTeacherClasses: TeacherClass[] = [
  {
    id: "cls_001",
    name: "Form 5A Science",
    level: "Form 5",
    subsystem: "english",
    branch: "grammar",
    students: [
      {
        id: "std_001",
        studentId: "STU2024001",
        firstName: "Marie",
        lastName: "Ngozi",
        email: "marie.ngozi@student.gbhs.cm",
        photo: "/placeholder_64px.png",
        enrollmentStatus: "enrolled",
      },
      {
        id: "std_002",
        studentId: "STU2024002",
        firstName: "Jean",
        lastName: "Baptiste",
        email: "jean.baptiste@student.gbhs.cm",
        photo: "/placeholder_64px.png",
        enrollmentStatus: "enrolled",
      },
      {
        id: "std_003",
        studentId: "STU2024003",
        firstName: "Fatima",
        lastName: "Alim",
        email: "fatima.alim@student.gbhs.cm",
        photo: "/placeholder_64px.png",
        enrollmentStatus: "enrolled",
      },
      {
        id: "std_004",
        studentId: "STU2024004",
        firstName: "Paul",
        lastName: "Biya Jr",
        email: "paul.biya@student.gbhs.cm",
        photo: "/placeholder_64px.png",
        enrollmentStatus: "enrolled",
      },
    ],
    schedule: [
      {
        id: "sch_001",
        day: "Monday",
        startTime: "08:00",
        endTime: "08:45",
        subject: "Mathematics",
        period: "Period 1",
      },
      {
        id: "sch_002",
        day: "Monday",
        startTime: "08:45",
        endTime: "09:30",
        subject: "Physics",
        period: "Period 2",
      },
      {
        id: "sch_003",
        day: "Tuesday",
        startTime: "08:00",
        endTime: "08:45",
        subject: "Chemistry",
        period: "Period 1",
      },
    ],
  },
  {
    id: "cls_002",
    name: "Form 4B Arts",
    level: "Form 4",
    subsystem: "english",
    branch: "grammar",
    students: [
      {
        id: "std_005",
        studentId: "STU2024005",
        firstName: "Aminata",
        lastName: "Touré",
        email: "aminata.toure@student.gbhs.cm",
        photo: "/placeholder_64px.png",
        enrollmentStatus: "enrolled",
      },
      {
        id: "std_006",
        studentId: "STU2024006",
        firstName: "Emmanuel",
        lastName: "Mbeki",
        email: "emmanuel.mbeki@student.gbhs.cm",
        photo: "/placeholder_64px.png",
        enrollmentStatus: "enrolled",
      },
    ],
    schedule: [
      {
        id: "sch_004",
        day: "Wednesday",
        startTime: "10:30",
        endTime: "11:15",
        subject: "English Literature",
        period: "Period 4",
      },
      {
        id: "sch_005",
        day: "Thursday",
        startTime: "09:30",
        endTime: "10:15",
        subject: "History",
        period: "Period 3",
      },
    ],
  },
]

// Mock attendance sessions
const mockAttendanceSessions: AttendanceSession[] = [
  {
    id: "ses_001",
    classId: "cls_001",
    className: "Form 5A Science",
    date: "2024-01-15",
    period: "Period 1",
    subject: "Mathematics",
    teacherId: "tch_001",
    teacherName: "Dr. Paul Biya Mbeki",
    totalStudents: 4,
    presentCount: 3,
    absentCount: 1,
    lateCount: 0,
    excusedCount: 0,
    status: "completed",
    markedAt: "2024-01-15T08:30:00Z",
  },
]

// Mock attendance records
const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: "att_001",
    sessionId: "ses_001",
    studentId: "std_001",
    studentName: "Marie Ngozi",
    status: "present",
    markedAt: "2024-01-15T08:30:00Z",
  },
  {
    id: "att_002",
    sessionId: "ses_001",
    studentId: "std_002",
    studentName: "Jean Baptiste",
    status: "absent",
    notes: "No notification received",
    markedAt: "2024-01-15T08:30:00Z",
  },
]

export function TeacherAttendanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>(mockTeacherClasses)
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(mockAttendanceSessions)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getTeacherClasses = async (): Promise<TeacherClass[]> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // In real implementation, filter classes by teacher ID
      const filteredClasses = teacherClasses.filter(
        (cls) =>
          // Mock filter - in real app, check if current user is assigned to this class
          true,
      )

      setIsLoading(false)
      return filteredClasses
    } catch (err) {
      setError("Failed to fetch teacher classes")
      setIsLoading(false)
      return []
    }
  }

  const createAttendanceSession = async (sessionData: {
    classId: string
    date: string
    period: string
    subject: string
  }): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const selectedClass = teacherClasses.find((cls) => cls.id === sessionData.classId)
      if (!selectedClass) {
        throw new Error("Class not found")
      }

      const newSession: AttendanceSession = {
        id: `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        classId: sessionData.classId,
        className: selectedClass.name,
        date: sessionData.date,
        period: sessionData.period,
        subject: sessionData.subject,
        teacherId: user?.id || "current_teacher",
        teacherName: user?.name || "Current Teacher",
        totalStudents: selectedClass.students.length,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        status: "pending",
      }

      setAttendanceSessions((prev) => [...prev, newSession])
      setIsLoading(false)

      return { success: true, sessionId: newSession.id }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create attendance session"
      setError(errorMessage)
      setIsLoading(false)
      return { success: false, error: errorMessage }
    }
  }

  const markAttendance = async (
    sessionId: string,
    attendanceData: {
      studentId: string
      status: "present" | "absent" | "late" | "excused"
      notes?: string
    }[],
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const session = attendanceSessions.find((s) => s.id === sessionId)
      if (!session) {
        throw new Error("Session not found")
      }

      // Create attendance records
      const newRecords: AttendanceRecord[] = attendanceData.map((data) => {
        const student = teacherClasses
          .find((cls) => cls.id === session.classId)
          ?.students.find((s) => s.id === data.studentId)

        return {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sessionId,
          studentId: data.studentId,
          studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown Student",
          status: data.status,
          notes: data.notes,
          markedAt: new Date().toISOString(),
        }
      })

      // Update attendance records
      setAttendanceRecords((prev) => [...prev.filter((record) => record.sessionId !== sessionId), ...newRecords])

      // Update session statistics
      const presentCount = attendanceData.filter((d) => d.status === "present").length
      const absentCount = attendanceData.filter((d) => d.status === "absent").length
      const lateCount = attendanceData.filter((d) => d.status === "late").length
      const excusedCount = attendanceData.filter((d) => d.status === "excused").length

      setAttendanceSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                presentCount,
                absentCount,
                lateCount,
                excusedCount,
                status: "completed" as const,
                markedAt: new Date().toISOString(),
              }
            : s,
        ),
      )

      setIsLoading(false)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to mark attendance"
      setError(errorMessage)
      setIsLoading(false)
      return { success: false, error: errorMessage }
    }
  }

  const getSessionAttendance = (sessionId: string): AttendanceRecord[] => {
    return attendanceRecords.filter((record) => record.sessionId === sessionId)
  }

  const updateAttendanceRecord = async (
    recordId: string,
    updates: {
      status?: "present" | "absent" | "late" | "excused"
      notes?: string
    },
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setAttendanceRecords((prev) =>
        prev.map((record) => (record.id === recordId ? { ...record, ...updates } : record)),
      )

      setIsLoading(false)
      return { success: true }
    } catch (err) {
      const errorMessage = "Failed to update attendance record"
      setError(errorMessage)
      setIsLoading(false)
      return { success: false, error: errorMessage }
    }
  }

  const getClassSchedule = (classId: string): ClassSchedule[] => {
    const classData = teacherClasses.find((cls) => cls.id === classId)
    return classData?.schedule || []
  }

  const getTodaySchedule = (): ClassSchedule[] => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" })
    const todaySchedule: ClassSchedule[] = []

    teacherClasses.forEach((cls) => {
      const classSchedule = cls.schedule.filter((schedule) => schedule.day === today)
      todaySchedule.push(...classSchedule)
    })

    return todaySchedule.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const value: TeacherAttendanceContextType = {
    teacherClasses,
    attendanceSessions,
    attendanceRecords,
    isLoading,
    error,
    getTeacherClasses,
    createAttendanceSession,
    markAttendance,
    getSessionAttendance,
    updateAttendanceRecord,
    getClassSchedule,
    getTodaySchedule,
  }

  return <TeacherAttendanceContext.Provider value={value}>{children}</TeacherAttendanceContext.Provider>
}

export function useTeacherAttendance() {
  const context = useContext(TeacherAttendanceContext)
  if (context === undefined) {
    throw new Error("useTeacherAttendance must be used within a TeacherAttendanceProvider")
  }
  return context
}
