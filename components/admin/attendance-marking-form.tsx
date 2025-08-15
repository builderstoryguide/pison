"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Clock, Users, CheckCircle, XCircle, AlertCircle, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useAttendance, type AttendanceRecord } from "@/lib/attendance-context"

interface AttendanceMarkingFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

// Mock student data for the selected class
const mockStudents = [
  { id: "std_001", name: "Marie Ngozi", studentId: "2024001", photo: "/placeholder_64px.png" },
  { id: "std_002", name: "Jean Baptiste", studentId: "2024002", photo: "/placeholder_64px.png" },
  { id: "std_003", name: "Fatima Alim", studentId: "2024003", photo: "/placeholder_64px.png" },
  { id: "std_004", name: "Paul Biya Jr", studentId: "2024004", photo: "/placeholder_64px.png" },
  { id: "std_005", name: "Aminata Touré", studentId: "2024005", photo: "/placeholder_64px.png" },
  { id: "std_006", name: "Emmanuel Mbeki", studentId: "2024006", photo: "/placeholder_64px.png" },
  { id: "std_007", name: "Sarah Fon", studentId: "2024007", photo: "/placeholder_64px.png" },
  { id: "std_008", name: "John Nkomo", studentId: "2024008", photo: "/placeholder_64px.png" },
]

// Mock class data
const mockClasses = [
  { id: "cls_001", name: "Form 5A Science", subsystem: "English", students: 30 },
  { id: "cls_002", name: "Terminale C", subsystem: "French", students: 25 },
  { id: "cls_003", name: "Form 4B Arts", subsystem: "English", students: 28 },
  { id: "cls_004", name: "Première D", subsystem: "French", students: 32 },
]

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English Language",
  "French Language",
  "Literature",
  "History",
  "Geography",
  "Economics",
  "Computer Science",
  "Physical Education",
  "Civic Education",
  "Philosophy",
]

const periods = [
  "Period 1 (8:00-8:45)",
  "Period 2 (8:45-9:30)",
  "Period 3 (9:45-10:30)",
  "Period 4 (10:30-11:15)",
  "Period 5 (11:30-12:15)",
  "Period 6 (12:15-13:00)",
  "Period 7 (14:00-14:45)",
  "Period 8 (14:45-15:30)",
]

export function AttendanceMarkingForm({ onSuccess, onCancel }: AttendanceMarkingFormProps) {
  const { createAttendanceSession, markAttendance, isLoading } = useAttendance()
  const [date, setDate] = useState<Date>(new Date())
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [students, setStudents] = useState(mockStudents)
  const [attendanceData, setAttendanceData] = useState<
    Record<
      string,
      {
        status: "present" | "absent" | "late" | "excused"
        notes?: string
      }
    >
  >({})
  const [sessionCreated, setSessionCreated] = useState(false)
  const [sessionId, setSessionId] = useState("")

  // Initialize attendance data when students change
  useEffect(() => {
    const initialData: Record<string, { status: "present" | "absent" | "late" | "excused"; notes?: string }> = {}
    students.forEach((student) => {
      initialData[student.id] = { status: "present" }
    })
    setAttendanceData(initialData)
  }, [students])

  const handleCreateSession = async () => {
    if (!selectedClass || !selectedSubject || !selectedPeriod) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const classData = mockClasses.find((c) => c.id === selectedClass)
      const newSessionId = await createAttendanceSession({
        classId: selectedClass,
        className: classData?.name || "",
        date: format(date, "yyyy-MM-dd"),
        period: selectedPeriod,
        subject: selectedSubject,
        teacherId: "current_teacher_id",
        teacherName: "Current Teacher",
        totalStudents: students.length,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        status: "pending",
      })

      setSessionId(newSessionId)
      setSessionCreated(true)
    } catch (error) {
      console.error("Error creating session:", error)
      alert("Failed to create attendance session")
    }
  }

  const handleAttendanceChange = (studentId: string, status: "present" | "absent" | "late" | "excused") => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }))
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes },
    }))
  }

  const handleSubmitAttendance = async () => {
    if (!sessionId) return

    try {
      const records: Omit<AttendanceRecord, "id" | "markedAt">[] = students.map((student) => ({
        studentId: student.id,
        studentName: student.name,
        classId: selectedClass,
        className: mockClasses.find((c) => c.id === selectedClass)?.name || "",
        date: format(date, "yyyy-MM-dd"),
        status: attendanceData[student.id]?.status || "present",
        markedBy: "current_teacher_id",
        period: selectedPeriod,
        subject: selectedSubject,
        notes: attendanceData[student.id]?.notes,
      }))

      await markAttendance(sessionId, records)
      onSuccess?.()
    } catch (error) {
      console.error("Error marking attendance:", error)
      alert("Failed to mark attendance")
    }
  }

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 }
    Object.values(attendanceData).forEach((data) => {
      counts[data.status]++
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mark Attendance</h2>
          <p className="text-muted-foreground">Record student attendance for class session</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      {!sessionCreated ? (
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <CardDescription>Set up the attendance session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        <div className="flex items-center gap-2">
                          <span>{cls.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {cls.subsystem}
                          </Badge>
                          <span className="text-xs text-muted-foreground">({cls.students} students)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleCreateSession}
              disabled={!selectedClass || !selectedSubject || !selectedPeriod || isLoading}
              className="w-full"
            >
              {isLoading ? "Creating Session..." : "Create Attendance Session"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Session Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session: {selectedSubject} - {selectedPeriod}
              </CardTitle>
              <CardDescription>
                {mockClasses.find((c) => c.id === selectedClass)?.name} • {format(date, "PPP")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-semibold">{statusCounts.present}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="font-semibold">{statusCounts.absent}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-semibold">{statusCounts.late}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Late</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600">
                    <UserCheck className="h-4 w-4" />
                    <span className="font-semibold">{statusCounts.excused}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Excused</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Attendance List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Attendance ({students.length} students)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student, index) => (
                  <div key={student.id}>
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <img
                        src={student.photo || "/placeholder.svg"}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{student.name}</h4>
                        <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <RadioGroup
                          value={attendanceData[student.id]?.status || "present"}
                          onValueChange={(value) => handleAttendanceChange(student.id, value as any)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="present" id={`present-${student.id}`} />
                            <Label htmlFor={`present-${student.id}`} className="text-green-600">
                              Present
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="absent" id={`absent-${student.id}`} />
                            <Label htmlFor={`absent-${student.id}`} className="text-red-600">
                              Absent
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="late" id={`late-${student.id}`} />
                            <Label htmlFor={`late-${student.id}`} className="text-yellow-600">
                              Late
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="excused" id={`excused-${student.id}`} />
                            <Label htmlFor={`excused-${student.id}`} className="text-blue-600">
                              Excused
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    {(attendanceData[student.id]?.status === "absent" ||
                      attendanceData[student.id]?.status === "late" ||
                      attendanceData[student.id]?.status === "excused") && (
                      <div className="mt-2 ml-14">
                        <Textarea
                          placeholder="Add notes (optional)"
                          value={attendanceData[student.id]?.notes || ""}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          className="h-20"
                        />
                      </div>
                    )}

                    {index < students.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitAttendance} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Submit Attendance"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
