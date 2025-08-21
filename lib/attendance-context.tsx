"use client"

import React, { createContext, useContext, useState } from "react"

export interface AttendanceRecord {
  id: string
  sessionId: string
  studentId: string
  studentName: string
  classId: string
  className: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  markedBy: string
  markedAt: string
  notes?: string
  period?: string
  subject?: string
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

export interface AttendanceStats {
  totalSessions: number
  averageAttendance: number
  presentRate: number
  absentRate: number
  lateRate: number
  excusedRate: number
  trendDirection: "up" | "down" | "stable"
  trendPercentage: number
}

export interface StudentAttendanceSummary {
  studentId: string
  studentName: string
  classId: string
  className: string
  totalSessions: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  attendanceRate: number
  lastAbsent?: string
  consecutiveAbsences: number
  status: "excellent" | "good" | "concerning" | "critical"
}

interface AttendanceContextType {
  attendanceRecords: AttendanceRecord[]
  attendanceSessions: AttendanceSession[]
  attendanceStats: AttendanceStats
  studentSummaries: StudentAttendanceSummary[]
  isLoading: boolean
  // Create operations
  markAttendance: (sessionId: string, records: Omit<AttendanceRecord, "id" | "markedAt">[]) => Promise<void>
  createAttendanceSession: (session: Omit<AttendanceSession, "id" | "markedAt">) => Promise<string>
  // Read operations
  getAttendanceByClass: (classId: string, dateRange?: { start: string; end: string }) => AttendanceRecord[]
  getAttendanceByStudent: (studentId: string, dateRange?: { start: string; end: string }) => AttendanceRecord[]
  getAttendanceStats: (filters?: { classId?: string; dateRange?: { start: string; end: string } }) => AttendanceStats
  getAttendanceSession: (sessionId: string) => AttendanceSession | undefined
  getAttendanceRecord: (recordId: string) => AttendanceRecord | undefined
  // Update operations
  updateAttendanceRecord: (recordId: string, updates: Partial<AttendanceRecord>) => Promise<void>
  updateAttendanceSession: (sessionId: string, updates: Partial<AttendanceSession>) => Promise<void>
  // Delete operations
  deleteAttendanceRecord: (recordId: string) => Promise<void>
  deleteAttendanceSession: (sessionId: string) => Promise<void>
  deleteAttendanceRecordsBySession: (sessionId: string) => Promise<void>
  // Report operations
  generateAttendanceReport: (filters: {
    classId?: string
    studentId?: string
    dateRange: { start: string; end: string }
  }) => Promise<any>
  // Bulk operations
  bulkUpdateAttendance: (updates: { recordId: string; updates: Partial<AttendanceRecord> }[]) => Promise<void>
  bulkDeleteAttendanceRecords: (recordIds: string[]) => Promise<void>
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined)

// Mock data for attendance records
const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: "att_001",
    sessionId: "ses_001",
    studentId: "std_001",
    studentName: "Marie Ngozi",
    classId: "cls_001",
    className: "Form 5A Science",
    date: "2024-01-15",
    status: "present",
    markedBy: "tch_001",
    markedAt: "2024-01-15T08:30:00Z",
    period: "Period 1",
    subject: "Mathematics",
  },
  {
    id: "att_002",
    sessionId: "ses_001",
    studentId: "std_002",
    studentName: "Jean Baptiste",
    classId: "cls_001",
    className: "Form 5A Science",
    date: "2024-01-15",
    status: "absent",
    markedBy: "tch_001",
    markedAt: "2024-01-15T08:30:00Z",
    period: "Period 1",
    subject: "Mathematics",
    notes: "No notification received",
  },
  {
    id: "att_003",
    sessionId: "ses_001",
    studentId: "std_003",
    studentName: "Fatima Alim",
    classId: "cls_001",
    className: "Form 5A Science",
    date: "2024-01-15",
    status: "late",
    markedBy: "tch_001",
    markedAt: "2024-01-15T08:45:00Z",
    period: "Period 1",
    subject: "Mathematics",
    notes: "Arrived 15 minutes late",
  },
  {
    id: "att_004",
    sessionId: "ses_002",
    studentId: "std_004",
    studentName: "Paul Biya Jr",
    classId: "cls_002",
    className: "Terminale C",
    date: "2024-01-15",
    status: "excused",
    markedBy: "tch_002",
    markedAt: "2024-01-15T09:00:00Z",
    period: "Period 2",
    subject: "Physics",
    notes: "Medical appointment",
  },
  {
    id: "att_005",
    sessionId: "ses_003",
    studentId: "std_001",
    studentName: "Marie Ngozi",
    classId: "cls_001",
    className: "Form 5A Science",
    date: "2024-01-16",
    status: "present",
    markedBy: "tch_003",
    markedAt: "2024-01-16T08:30:00Z",
    period: "Period 1",
    subject: "Chemistry",
  },
]

// Mock data for attendance sessions
const mockAttendanceSessions: AttendanceSession[] = [
  {
    id: "ses_001",
    classId: "cls_001",
    className: "Form 5A Science",
    date: "2024-01-15",
    period: "Period 1",
    subject: "Mathematics",
    teacherId: "tch_001",
    teacherName: "Dr. Emmanuel Mbeki",
    totalStudents: 30,
    presentCount: 28,
    absentCount: 1,
    lateCount: 1,
    excusedCount: 0,
    status: "completed",
    markedAt: "2024-01-15T08:30:00Z",
  },
  {
    id: "ses_002",
    classId: "cls_002",
    className: "Terminale C",
    date: "2024-01-15",
    period: "Period 2",
    subject: "Physics",
    teacherId: "tch_002",
    teacherName: "Prof. Aminata Touré",
    totalStudents: 25,
    presentCount: 23,
    absentCount: 1,
    lateCount: 0,
    excusedCount: 1,
    status: "completed",
    markedAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "ses_003",
    classId: "cls_001",
    className: "Form 5A Science",
    date: "2024-01-16",
    period: "Period 1",
    subject: "Chemistry",
    teacherId: "tch_003",
    teacherName: "Dr. Sarah Fon",
    totalStudents: 30,
    presentCount: 29,
    absentCount: 1,
    lateCount: 0,
    excusedCount: 0,
    status: "completed",
    markedAt: "2024-01-16T08:30:00Z",
  },
  {
    id: "ses_004",
    classId: "cls_003",
    className: "Form 4B Arts",
    date: "2024-01-16",
    period: "Period 3",
    subject: "English Literature",
    teacherId: "tch_004",
    teacherName: "Mr. John Nkomo",
    totalStudents: 28,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    status: "pending",
  },
]

// Mock student attendance summaries
const mockStudentSummaries: StudentAttendanceSummary[] = [
  {
    studentId: "std_001",
    studentName: "Marie Ngozi",
    classId: "cls_001",
    className: "Form 5A Science",
    totalSessions: 45,
    presentCount: 42,
    absentCount: 2,
    lateCount: 1,
    excusedCount: 0,
    attendanceRate: 93.3,
    consecutiveAbsences: 0,
    status: "excellent",
  },
  {
    studentId: "std_002",
    studentName: "Jean Baptiste",
    classId: "cls_001",
    className: "Form 5A Science",
    totalSessions: 45,
    presentCount: 38,
    absentCount: 5,
    lateCount: 2,
    excusedCount: 0,
    attendanceRate: 84.4,
    lastAbsent: "2024-01-15",
    consecutiveAbsences: 1,
    status: "good",
  },
  {
    studentId: "std_003",
    studentName: "Fatima Alim",
    classId: "cls_001",
    className: "Form 5A Science",
    totalSessions: 45,
    presentCount: 35,
    absentCount: 8,
    lateCount: 2,
    excusedCount: 0,
    attendanceRate: 77.8,
    lastAbsent: "2024-01-12",
    consecutiveAbsences: 0,
    status: "concerning",
  },
  {
    studentId: "std_004",
    studentName: "Paul Biya Jr",
    classId: "cls_002",
    className: "Terminale C",
    totalSessions: 42,
    presentCount: 30,
    absentCount: 10,
    lateCount: 1,
    excusedCount: 1,
    attendanceRate: 71.4,
    lastAbsent: "2024-01-14",
    consecutiveAbsences: 2,
    status: "critical",
  },
]

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords)
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>(mockAttendanceSessions)
  const [studentSummaries, setStudentSummaries] = useState<StudentAttendanceSummary[]>(mockStudentSummaries)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate attendance statistics
  const attendanceStats: AttendanceStats = React.useMemo(() => {
    const totalRecords = attendanceRecords.length
    if (totalRecords === 0) {
      return {
        totalSessions: 0,
        averageAttendance: 0,
        presentRate: 0,
        absentRate: 0,
        lateRate: 0,
        excusedRate: 0,
        trendDirection: "stable",
        trendPercentage: 0,
      }
    }

    const presentCount = attendanceRecords.filter((r) => r.status === "present").length
    const absentCount = attendanceRecords.filter((r) => r.status === "absent").length
    const lateCount = attendanceRecords.filter((r) => r.status === "late").length
    const excusedCount = attendanceRecords.filter((r) => r.status === "excused").length

    return {
      totalSessions: attendanceSessions.length,
      averageAttendance: ((presentCount + lateCount) / totalRecords) * 100,
      presentRate: (presentCount / totalRecords) * 100,
      absentRate: (absentCount / totalRecords) * 100,
      lateRate: (lateCount / totalRecords) * 100,
      excusedRate: (excusedCount / totalRecords) * 100,
      trendDirection: "up",
      trendPercentage: 2.5,
    }
  }, [attendanceRecords, attendanceSessions])

  const markAttendance = async (sessionId: string, records: Omit<AttendanceRecord, "id" | "markedAt">[]) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newRecords = records.map((record) => ({
        ...record,
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        markedAt: new Date().toISOString(),
      }))

      setAttendanceRecords((prev) => [...prev, ...newRecords])

      // Update session statistics
      setAttendanceSessions((prev) =>
        prev.map((session) => {
          if (session.id === sessionId) {
            const presentCount = records.filter((r) => r.status === "present").length
            const absentCount = records.filter((r) => r.status === "absent").length
            const lateCount = records.filter((r) => r.status === "late").length
            const excusedCount = records.filter((r) => r.status === "excused").length

            return {
              ...session,
              presentCount,
              absentCount,
              lateCount,
              excusedCount,
              status: "completed" as const,
              markedAt: new Date().toISOString(),
            }
          }
          return session
        }),
      )

      console.log("Attendance marked successfully")
    } catch (error) {
      console.error("Error marking attendance:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const createAttendanceSession = async (session: Omit<AttendanceSession, "id" | "markedAt">) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      const newSession: AttendanceSession = {
        ...session,
        id: `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: "pending",
      }

      setAttendanceSessions((prev) => [...prev, newSession])
      console.log("Attendance session created successfully")
      return newSession.id
    } catch (error) {
      console.error("Error creating attendance session:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateAttendanceRecord = async (recordId: string, updates: Partial<AttendanceRecord>) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setAttendanceRecords((prev) =>
        prev.map((record) => (record.id === recordId ? { ...record, ...updates } : record)),
      )

      console.log("Attendance record updated successfully")
    } catch (error) {
      console.error("Error updating attendance record:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getAttendanceByClass = (classId: string, dateRange?: { start: string; end: string }) => {
    let filtered = attendanceRecords.filter((record) => record.classId === classId)

    if (dateRange) {
      filtered = filtered.filter((record) => record.date >= dateRange.start && record.date <= dateRange.end)
    }

    return filtered
  }

  const getAttendanceByStudent = (studentId: string, dateRange?: { start: string; end: string }) => {
    let filtered = attendanceRecords.filter((record) => record.studentId === studentId)

    if (dateRange) {
      filtered = filtered.filter((record) => record.date >= dateRange.start && record.date <= dateRange.end)
    }

    return filtered
  }

  const getAttendanceStats = (filters?: { classId?: string; dateRange?: { start: string; end: string } }) => {
    let filtered = attendanceRecords

    if (filters?.classId) {
      filtered = filtered.filter((record) => record.classId === filters.classId)
    }

    if (filters?.dateRange) {
      filtered = filtered.filter(
        (record) => record.date >= filters.dateRange!.start && record.date <= filters.dateRange!.end,
      )
    }

    const totalRecords = filtered.length
    if (totalRecords === 0) {
      return {
        totalSessions: 0,
        averageAttendance: 0,
        presentRate: 0,
        absentRate: 0,
        lateRate: 0,
        excusedRate: 0,
        trendDirection: "stable" as const,
        trendPercentage: 0,
      }
    }

    const presentCount = filtered.filter((r) => r.status === "present").length
    const absentCount = filtered.filter((r) => r.status === "absent").length
    const lateCount = filtered.filter((r) => r.status === "late").length
    const excusedCount = filtered.filter((r) => r.status === "excused").length

    return {
      totalSessions: attendanceSessions.length,
      averageAttendance: ((presentCount + lateCount) / totalRecords) * 100,
      presentRate: (presentCount / totalRecords) * 100,
      absentRate: (absentCount / totalRecords) * 100,
      lateRate: (lateCount / totalRecords) * 100,
      excusedRate: (excusedCount / totalRecords) * 100,
      trendDirection: "up" as const,
      trendPercentage: 2.5,
    }
  }

  const generateAttendanceReport = async (filters: {
    classId?: string
    studentId?: string
    dateRange: { start: string; end: string }
  }) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      let filtered = attendanceRecords

      if (filters.classId) {
        filtered = filtered.filter((record) => record.classId === filters.classId)
      }

      if (filters.studentId) {
        filtered = filtered.filter((record) => record.studentId === filters.studentId)
      }

      filtered = filtered.filter(
        (record) => record.date >= filters.dateRange.start && record.date <= filters.dateRange.end,
      )

      const report = {
        totalRecords: filtered.length,
        presentCount: filtered.filter((r) => r.status === "present").length,
        absentCount: filtered.filter((r) => r.status === "absent").length,
        lateCount: filtered.filter((r) => r.status === "late").length,
        excusedCount: filtered.filter((r) => r.status === "excused").length,
        records: filtered,
        generatedAt: new Date().toISOString(),
      }

      console.log("Attendance report generated successfully")
      return report
    } catch (error) {
      console.error("Error generating attendance report:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Read operations
  const getAttendanceSession = (sessionId: string) => {
    return attendanceSessions.find((session) => session.id === sessionId)
  }

  const getAttendanceRecord = (recordId: string) => {
    return attendanceRecords.find((record) => record.id === recordId)
  }

  // Update operations
  const updateAttendanceSession = async (sessionId: string, updates: Partial<AttendanceSession>) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setAttendanceSessions((prev) =>
        prev.map((session) => (session.id === sessionId ? { ...session, ...updates } : session)),
      )

      console.log("Attendance session updated successfully")
    } catch (error) {
      console.error("Error updating attendance session:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Delete operations
  const deleteAttendanceRecord = async (recordId: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setAttendanceRecords((prev) => prev.filter((record) => record.id !== recordId))

      console.log("Attendance record deleted successfully")
    } catch (error) {
      console.error("Error deleting attendance record:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAttendanceSession = async (sessionId: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Delete the session and all related records
      setAttendanceSessions((prev) => prev.filter((session) => session.id !== sessionId))
      setAttendanceRecords((prev) => prev.filter((record) => record.sessionId !== sessionId))

      console.log("Attendance session and related records deleted successfully")
    } catch (error) {
      console.error("Error deleting attendance session:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAttendanceRecordsBySession = async (sessionId: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setAttendanceRecords((prev) => prev.filter((record) => record.sessionId !== sessionId))

      // Update session to reset counts
      setAttendanceSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                presentCount: 0,
                absentCount: 0,
                lateCount: 0,
                excusedCount: 0,
                status: "pending" as const,
              }
            : session,
        ),
      )

      console.log("Attendance records for session deleted successfully")
    } catch (error) {
      console.error("Error deleting attendance records by session:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Bulk operations
  const bulkUpdateAttendance = async (updates: { recordId: string; updates: Partial<AttendanceRecord> }[]) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setAttendanceRecords((prev) =>
        prev.map((record) => {
          const update = updates.find((u) => u.recordId === record.id)
          return update ? { ...record, ...update.updates } : record
        }),
      )

      console.log("Bulk attendance update completed successfully")
    } catch (error) {
      console.error("Error performing bulk attendance update:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const bulkDeleteAttendanceRecords = async (recordIds: string[]) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setAttendanceRecords((prev) => prev.filter((record) => !recordIds.includes(record.id)))

      console.log("Bulk attendance records deletion completed successfully")
    } catch (error) {
      console.error("Error performing bulk attendance records deletion:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value: AttendanceContextType = {
    attendanceRecords,
    attendanceSessions,
    attendanceStats,
    studentSummaries,
    isLoading,
    // Create operations
    markAttendance,
    createAttendanceSession,
    // Read operations
    getAttendanceByClass,
    getAttendanceByStudent,
    getAttendanceStats,
    getAttendanceSession,
    getAttendanceRecord,
    // Update operations
    updateAttendanceRecord,
    updateAttendanceSession,
    // Delete operations
    deleteAttendanceRecord,
    deleteAttendanceSession,
    deleteAttendanceRecordsBySession,
    // Report operations
    generateAttendanceReport,
    // Bulk operations
    bulkUpdateAttendance,
    bulkDeleteAttendanceRecords,
  }

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>
}

export function useAttendance() {
  const context = useContext(AttendanceContext)
  if (context === undefined) {
    throw new Error("useAttendance must be used within an AttendanceProvider")
  }
  return context
}
