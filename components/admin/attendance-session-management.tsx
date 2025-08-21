"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Clock, 
  Users, 
  BookOpen, 
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  AlertTriangle
} from "lucide-react"
import { useAttendance } from "@/lib/attendance-context"
import { AttendanceSession } from "@/lib/attendance-context"
import { format } from "date-fns"

interface AttendanceSessionManagementProps {
  sessionId: string
  onSuccess?: () => void
  onCancel?: () => void
  trigger?: React.ReactNode
}

export function AttendanceSessionManagement({ sessionId, onSuccess, onCancel, trigger }: AttendanceSessionManagementProps) {
  const { 
    getAttendanceSession, 
    updateAttendanceSession, 
    deleteAttendanceSession, 
    deleteAttendanceRecordsBySession,
    getAttendanceByClass,
    isLoading 
  } = useAttendance()
  
  const [isOpen, setIsOpen] = useState(false)
  const [session, setSession] = useState<AttendanceSession | null>(null)
  const [formData, setFormData] = useState({
    period: "",
    subject: "",
    status: "" as "pending" | "completed" | "locked",
  })
  const [activeTab, setActiveTab] = useState<"edit" | "view" | "records">("view")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  // Refs for focus management
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstTabRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Mock classes for the form
  const classes = [
    { id: "cls_001", name: "Form 5A Science" },
    { id: "cls_002", name: "Terminale C" },
    { id: "cls_003", name: "Form 4B Arts" },
    { id: "cls_004", name: "Première D" },
  ]

  const periods = [
    "Period 1 (07:30-08:15)",
    "Period 2 (08:15-09:00)",
    "Period 3 (09:15-10:00)",
    "Period 4 (10:00-10:45)",
    "Period 5 (11:00-11:45)",
    "Period 6 (11:45-12:30)",
    "Period 7 (14:00-14:45)",
    "Period 8 (14:45-15:30)",
  ]

  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "French",
    "History",
    "Geography",
    "Computer Science",
    "Physical Education",
  ]

  // Focus management when dialog opens
  useEffect(() => {
    if (isOpen && firstTabRef.current) {
      setTimeout(() => firstTabRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
        onCancel?.()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onCancel])

  const handleOpen = () => {
    const attendanceSession = getAttendanceSession(sessionId)
    if (attendanceSession) {
      setSession(attendanceSession)
      setFormData({
        period: attendanceSession.period,
        subject: attendanceSession.subject,
        status: attendanceSession.status,
      })
    }
    setIsOpen(true)
    setErrors({})
    setSuccessMessage("")
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.period.trim()) {
      newErrors.period = "Period is required"
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required"
    }
    if (!formData.status) {
      newErrors.status = "Status is required"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      await updateAttendanceSession(sessionId, {
        period: formData.period,
        subject: formData.subject,
        status: formData.status,
      })
      
      // Refresh session data
      const updatedSession = getAttendanceSession(sessionId)
      if (updatedSession) {
        setSession(updatedSession)
      }
      
      setSuccessMessage("Session updated successfully")
      setActiveTab("view")
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000)
      
      onSuccess?.()
    } catch (error) {
      console.error("Error updating attendance session:", error)
      setErrors({ submit: "Failed to update attendance session. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSession = async () => {
    if (!session) return

    try {
      await deleteAttendanceSession(sessionId)
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error deleting attendance session:", error)
      setErrors({ delete: "Failed to delete attendance session. Please try again." })
    }
  }

  const handleDeleteRecords = async () => {
    if (!session) return

    try {
      await deleteAttendanceRecordsBySession(sessionId)
      // Refresh session data
      const updatedSession = getAttendanceSession(sessionId)
      if (updatedSession) {
        setSession(updatedSession)
      }
      setSuccessMessage("Attendance records deleted successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
      onSuccess?.()
    } catch (error) {
      console.error("Error deleting attendance records:", error)
      setErrors({ deleteRecords: "Failed to delete attendance records. Please try again." })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-700 bg-green-100 border-green-200"
      case "pending":
        return "text-amber-700 bg-amber-100 border-amber-200"
      case "locked":
        return "text-red-700 bg-red-100 border-red-200"
      default:
        return "text-gray-700 bg-gray-100 border-gray-200"
    }
  }

  const getAttendanceRecords = () => {
    if (!session) return []
    return getAttendanceByClass(session.classId).filter(record => record.sessionId === sessionId)
  }

  if (!session) {
    return null
  }

  const attendanceRecords = getAttendanceRecords()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2" 
            onClick={handleOpen}
            aria-label="Manage attendance session"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Manage
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        ref={dialogRef}
        className="max-w-8xl w-[98vw] h-[85vh] overflow-hidden"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="dialog-title" className="text-xl font-semibold">
            Attendance Session Management
          </DialogTitle>
          <p id="dialog-description" className="text-sm text-muted-foreground">
            View, edit, and manage attendance session details and records
          </p>
        </DialogHeader>
        
        {/* Success/Error Messages */}
        {successMessage && (
          <div 
            className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2"
            role="alert"
            aria-live="polite"
          >
            <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
            <span className="text-green-800 text-sm">{successMessage}</span>
          </div>
        )}
        
        {Object.keys(errors).length > 0 && (
          <div 
            className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2"
            role="alert"
            aria-live="assertive"
          >
            <AlertTriangle className="h-4 w-4 text-red-600" aria-hidden="true" />
            <div className="text-red-800 text-sm">
              {Object.values(errors).map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-6 h-full flex flex-col">
          {/* Session Overview */}
          <Card className="flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Session Overview</CardTitle>
              <CardDescription>Basic information about this attendance session</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Class</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md border">
                    <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium">{session.className}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Teacher</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md border">
                    <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span>{session.teacherName}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={`${getStatusColor(session.status)} border`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div 
            className="flex space-x-1 bg-muted p-1 rounded-lg flex-shrink-0"
            role="tablist"
            aria-label="Session management tabs"
          >
            <Button
              ref={firstTabRef}
              variant={activeTab === "view" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("view")}
              className="flex items-center gap-2"
              role="tab"
              aria-selected={activeTab === "view"}
              aria-controls="view-panel"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              View
            </Button>
            <Button
              variant={activeTab === "edit" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("edit")}
              className="flex items-center gap-2"
              role="tab"
              aria-selected={activeTab === "edit"}
              aria-controls="edit-panel"
            >
              <Edit className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
            <Button
              variant={activeTab === "records" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("records")}
              className="flex items-center gap-2"
              role="tab"
              aria-selected={activeTab === "records"}
              aria-controls="records-panel"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Records ({attendanceRecords.length})
            </Button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === "view" && (
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle>Session Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Period</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md border">
                      <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span>{session.period}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md border">
                      <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span>{session.subject}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Attendance Summary</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md border border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                      <span className="font-medium text-green-700">{session.presentCount} Present</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-md border border-red-200">
                      <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                      <span className="font-medium text-red-700">{session.absentCount} Absent</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-md border border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                      <span className="font-medium text-amber-700">{session.lateCount} Late</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <UserCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
                      <span className="font-medium text-blue-700">{session.excusedCount} Excused</span>
                    </div>
                  </div>
                </div>

                {session.markedAt && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Marked At</Label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md border">
                      <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span>{format(new Date(session.markedAt), "PPp")}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "edit" && (
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle>Edit Session</CardTitle>
                <CardDescription>Update session details</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="period" className="text-sm font-medium">
                        Period <span className="text-red-500" aria-label="required">*</span>
                      </Label>
                      <Select 
                        value={formData.period} 
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, period: value }))
                          if (errors.period) setErrors(prev => ({ ...prev, period: "" }))
                        }}
                      >
                        <SelectTrigger id="period" aria-describedby={errors.period ? "period-error" : undefined}>
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
                      {errors.period && (
                        <p id="period-error" className="text-sm text-red-600" role="alert">
                          {errors.period}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">
                        Subject <span className="text-red-500" aria-label="required">*</span>
                      </Label>
                      <Select 
                        value={formData.subject} 
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, subject: value }))
                          if (errors.subject) setErrors(prev => ({ ...prev, subject: "" }))
                        }}
                      >
                        <SelectTrigger id="subject" aria-describedby={errors.subject ? "subject-error" : undefined}>
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
                      {errors.subject && (
                        <p id="subject-error" className="text-sm text-red-600" role="alert">
                          {errors.subject}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">
                      Status <span className="text-red-500" aria-label="required">*</span>
                    </Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value: "pending" | "completed" | "locked") => {
                        setFormData(prev => ({ ...prev, status: value }))
                        if (errors.status) setErrors(prev => ({ ...prev, status: "" }))
                      }}
                    >
                      <SelectTrigger id="status" aria-describedby={errors.status ? "status-error" : undefined}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="locked">Locked</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p id="status-error" className="text-sm text-red-600" role="alert">
                        {errors.status}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || isLoading}
                      aria-describedby={isSubmitting ? "submit-loading" : undefined}
                    >
                      <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                    {isSubmitting && (
                      <span id="submit-loading" className="sr-only">Saving changes, please wait</span>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "records" && (
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle>Attendance Records</CardTitle>
                <CardDescription>Individual student attendance records for this session</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {attendanceRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead scope="col">Student</TableHead>
                          <TableHead scope="col">Status</TableHead>
                          <TableHead scope="col">Notes</TableHead>
                          <TableHead scope="col">Marked At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.studentName}</TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(record.status)} border`}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.notes || "-"}</TableCell>
                            <TableCell>{format(new Date(record.markedAt), "PPp")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                    <p>No attendance records found for this session.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="flex items-center gap-2"
                    aria-label="Delete attendance records only"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete Records Only
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Attendance Records</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete all attendance records for this session? The session will remain but all student records will be removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteRecords} 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Records
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="flex items-center gap-2"
                    aria-label="Delete entire attendance session"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete Session
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Attendance Session</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this attendance session? This will also delete all related attendance records. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteSession} 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Session
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <Button
              ref={closeButtonRef}
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                onCancel?.()
              }}
              disabled={isLoading || isSubmitting}
              aria-label="Close attendance session management"
            >
              <X className="h-4 w-4 mr-2" aria-hidden="true" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
