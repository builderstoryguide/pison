"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Clock, Users, CheckCircle, XCircle, AlertCircle, UserCheck, Save } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useTeacherAttendance, type TeacherClassStudent } from "@/lib/teacher-attendance-context"

interface TeacherAttendanceFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function TeacherAttendanceForm({ onSuccess, onCancel }: TeacherAttendanceFormProps) {
  const { teacherClasses, createAttendanceSession, markAttendance, getClassSchedule, getTodaySchedule, isLoading } =
    useTeacherAttendance()

  const [date, setDate] = useState<Date>(new Date())
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [students, setStudents] = useState<TeacherClassStudent[]>([])
  const [attendanceData, setAttendanceData] = useState<
    Record<string, { status: "present" | "absent" | "late" | "excused"; notes?: string }>
  >({})
  const [sessionCreated, setSessionCreated] = useState(false)
  const [sessionId, setSessionId] = useState("")
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([])

  // Initialize attendance data when students change
  useEffect(() => {
    const initialData: Record<string, { status: "present" | "absent" | "late" | "excused"; notes?: string }> = {}
    students.forEach((student) => {
      initialData[student.id] = { status: "present" }
    })
    setAttendanceData(initialData)
  }, [students])

  // Update students when class is selected
  useEffect(() => {
    if (selectedClass) {
      const classData = teacherClasses.find((cls) => cls.id === selectedClass)
      if (classData) {
        setStudents(classData.students.filter((s) => s.enrollmentStatus === "enrolled"))

        // Get available subjects and periods for this class
        const schedule = getClassSchedule(selectedClass)
        const subjects = [...new Set(schedule.map((s) => s.subject))]
        const periods = [...new Set(schedule.map((s) => s.period))]

        setAvailableSubjects(subjects)
        setAvailablePeriods(periods)
      }
    } else {
      setStudents([])
      setAvailableSubjects([])
      setAvailablePeriods([])
    }
  }, [selectedClass, teacherClasses, getClassSchedule])

  const handleCreateSession = async () => {
    if (!selectedClass || !selectedSubject || !selectedPeriod) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const result = await createAttendanceSession({
        classId: selectedClass,
        date: format(date, "yyyy-MM-dd"),
        period: selectedPeriod,
        subject: selectedSubject,
      })

      if (result.success && result.sessionId) {
        setSessionId(result.sessionId)
        setSessionCreated(true)
      } else {
        alert(result.error || "Failed to create attendance session")
      }
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
      const attendanceRecords = students.map((student) => ({
        studentId: student.id,
        status: attendanceData[student.id]?.status || "present",
        notes: attendanceData[student.id]?.notes,
      }))

      const result = await markAttendance(sessionId, attendanceRecords)

      if (result.success) {
        onSuccess?.()
      } else {
        alert(result.error || "Failed to mark attendance")
      }
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
    <div className="w-full max-w-none overflow-x-hidden">
      <div className="space-y-6 p-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold truncate">Mark Attendance</h2>
            <p className="text-muted-foreground text-sm">Record student attendance for your class session</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" onClick={onCancel} size="sm">
              Cancel
            </Button>
          </div>
        </div>

        {!sessionCreated ? (
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Session Details</CardTitle>
              <CardDescription className="text-sm">Set up the attendance session for your class</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium">
                      Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal text-sm",
                            !date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{date ? format(date, "PPP") : "Pick a date"}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(date) => date && setDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="class" className="text-sm font-medium">
                      Class
                    </Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your class" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{cls.name}</span>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {cls.subsystem}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                ({cls.students.filter((s) => s.enrollmentStatus === "enrolled").length} students)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium">
                      Subject
                    </Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            <span className="truncate">{subject}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period" className="text-sm font-medium">
                      Period
                    </Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={!selectedClass}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePeriods.map((period) => (
                          <SelectItem key={period} value={period}>
                            <span className="truncate">{period}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {selectedClass && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2 text-sm">Class Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Students:</span>
                      <span className="font-medium">{students.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Class Level:</span>
                      <span className="font-medium truncate ml-2">
                        {teacherClasses.find((c) => c.id === selectedClass)?.level}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreateSession}
                disabled={!selectedClass || !selectedSubject || !selectedPeriod || isLoading}
                className="w-full"
                size="sm"
              >
                {isLoading ? "Creating Session..." : "Create Attendance Session"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Session Summary */}
            <Card className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    Session: {selectedSubject} - {selectedPeriod}
                  </span>
                </CardTitle>
                <CardDescription className="text-sm">
                  <span className="truncate">
                    {teacherClasses.find((c) => c.id === selectedClass)?.name} • {format(date, "PPP")}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="font-semibold text-sm">{statusCounts.present}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="font-semibold text-sm">{statusCounts.absent}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-600">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="font-semibold text-sm">{statusCounts.late}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-600">
                      <UserCheck className="h-4 w-4 flex-shrink-0" />
                      <span className="font-semibold text-sm">{statusCounts.excused}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Excused</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Attendance List */}
            <Card className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span>Student Attendance ({students.length} students)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {students.map((student, index) => (
                    <div key={student.id} className="w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                            <AvatarImage
                              src={student.photo || "/placeholder.svg"}
                              alt={`${student.firstName} ${student.lastName}`}
                            />
                            <AvatarFallback className="text-xs">
                              {student.firstName.charAt(0)}
                              {student.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm truncate">
                              {student.firstName} {student.lastName}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">ID: {student.studentId}</p>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <RadioGroup
                            value={attendanceData[student.id]?.status || "present"}
                            onValueChange={(value) => handleAttendanceChange(student.id, value as any)}
                            className="grid grid-cols-2 sm:flex sm:gap-3 gap-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="present" id={`present-${student.id}`} />
                              <Label htmlFor={`present-${student.id}`} className="text-green-600 text-xs sm:text-sm">
                                Present
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="absent" id={`absent-${student.id}`} />
                              <Label htmlFor={`absent-${student.id}`} className="text-red-600 text-xs sm:text-sm">
                                Absent
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="late" id={`late-${student.id}`} />
                              <Label htmlFor={`late-${student.id}`} className="text-yellow-600 text-xs sm:text-sm">
                                Late
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="excused" id={`excused-${student.id}`} />
                              <Label htmlFor={`excused-${student.id}`} className="text-blue-600 text-xs sm:text-sm">
                                Excused
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>

                      {(attendanceData[student.id]?.status === "absent" ||
                        attendanceData[student.id]?.status === "late" ||
                        attendanceData[student.id]?.status === "excused") && (
                        <div className="mt-2 ml-0 sm:ml-11">
                          <Textarea
                            placeholder="Add notes (optional)"
                            value={attendanceData[student.id]?.notes || ""}
                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                            className="h-16 text-sm resize-none"
                          />
                        </div>
                      )}

                      {index < students.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={onCancel} size="sm" className="w-full sm:w-auto bg-transparent">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitAttendance} disabled={isLoading} size="sm" className="w-full sm:w-auto">
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Saving..." : "Submit Attendance"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
