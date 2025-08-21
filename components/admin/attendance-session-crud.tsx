"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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
  Plus,
  Copy,
  Archive,
  RefreshCw,
  Settings,
  FileText,
  Download
} from "lucide-react"
import { useAttendance } from "@/lib/attendance-context"
import { AttendanceSession, AttendanceRecord } from "@/lib/attendance-context"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"

interface AttendanceSessionCRUDProps {
  sessionId?: string
  onSuccess?: () => void
  onCancel?: () => void
  trigger?: React.ReactNode
  mode?: "create" | "edit" | "view"
}

export function AttendanceSessionCRUD({ 
  sessionId, 
  onSuccess, 
  onCancel, 
  trigger, 
  mode = "view" 
}: AttendanceSessionCRUDProps) {
  const { 
    getAttendanceSession, 
    createAttendanceSession,
    updateAttendanceSession, 
    deleteAttendanceSession, 
    deleteAttendanceRecordsBySession,
    getAttendanceByClass,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    isLoading 
  } = useAttendance()
  
  const [isOpen, setIsOpen] = useState(false)
  const [session, setSession] = useState<AttendanceSession | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "edit" | "records" | "actions" | "reports">("overview")
  const [isCreating, setIsCreating] = useState(!sessionId)
  
  const [formData, setFormData] = useState({
    classId: "",
    className: "",
    date: new Date(),
    period: "",
    subject: "",
    teacherId: "",
    teacherName: "",
    status: "pending" as "pending" | "completed" | "locked",
    totalStudents: 0,
  })

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [recordFormData, setRecordFormData] = useState({
    status: "" as "present" | "absent" | "late" | "excused",
    notes: "",
    period: "",
    subject: "",
  })

  // Mock data
  const classes = [
    { id: "cls_001", name: "Form 5A Science" },
    { id: "cls_002", name: "Terminale C" },
    { id: "cls_003", name: "Form 4B Arts" },
  ]

  const teachers = [
    { id: "tch_001", name: "Dr. Marie Ngozi" },
    { id: "tch_002", name: "Prof. Jean Baptiste" },
    { id: "tch_003", name: "Mrs. Fatima Alim" },
  ]

  const periods = [
    "Period 1 (07:30-08:15)",
    "Period 2 (08:15-09:00)",
    "Period 3 (09:15-10:00)",
    "Period 4 (10:00-10:45)",
  ]

  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology",
    "English", "French", "History", "Geography",
  ]

  useEffect(() => {
    if (sessionId && isOpen) {
      const attendanceSession = getAttendanceSession(sessionId)
      if (attendanceSession) {
        setSession(attendanceSession)
        setFormData({
          classId: attendanceSession.classId,
          className: attendanceSession.className,
          date: new Date(attendanceSession.date),
          period: attendanceSession.period,
          subject: attendanceSession.subject,
          teacherId: attendanceSession.teacherId,
          teacherName: attendanceSession.teacherName,
          status: attendanceSession.status,
          totalStudents: attendanceSession.totalStudents,
        })
      }
    }
  }, [sessionId, isOpen, getAttendanceSession])

  const handleOpen = () => {
    setIsOpen(true)
    if (!sessionId) {
      setIsCreating(true)
      setActiveTab("edit")
      setFormData({
        classId: "",
        className: "",
        date: new Date(),
        period: "",
        subject: "",
        teacherId: "",
        teacherName: "",
        status: "pending",
        totalStudents: 0,
      })
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const newSessionId = await createAttendanceSession({
        classId: formData.classId,
        className: formData.className,
        date: format(formData.date, "yyyy-MM-dd"),
        period: formData.period,
        subject: formData.subject,
        teacherId: formData.teacherId,
        teacherName: formData.teacherName,
        status: formData.status,
        totalStudents: formData.totalStudents,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
      })
      
      const newSession = getAttendanceSession(newSessionId)
      if (newSession) {
        setSession(newSession)
        setIsCreating(false)
        setActiveTab("overview")
      }
      
      onSuccess?.()
    } catch (error) {
      console.error("Error creating attendance session:", error)
      alert("Failed to create attendance session")
    }
  }

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    try {
      await updateAttendanceSession(session.id, {
        classId: formData.classId,
        className: formData.className,
        date: format(formData.date, "yyyy-MM-dd"),
        period: formData.period,
        subject: formData.subject,
        teacherId: formData.teacherId,
        teacherName: formData.teacherName,
        status: formData.status,
        totalStudents: formData.totalStudents,
      })
      
      const updatedSession = getAttendanceSession(session.id)
      if (updatedSession) {
        setSession(updatedSession)
      }
      
      onSuccess?.()
    } catch (error) {
      console.error("Error updating attendance session:", error)
      alert("Failed to update attendance session")
    }
  }

  const handleDeleteSession = async () => {
    if (!session) return

    try {
      await deleteAttendanceSession(session.id)
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error deleting attendance session:", error)
      alert("Failed to delete attendance session")
    }
  }

  const handleDeleteRecords = async () => {
    if (!session) return

    try {
      await deleteAttendanceRecordsBySession(session.id)
      const updatedSession = getAttendanceSession(session.id)
      if (updatedSession) {
        setSession(updatedSession)
      }
      onSuccess?.()
    } catch (error) {
      console.error("Error deleting attendance records:", error)
      alert("Failed to delete attendance records")
    }
  }

  const handleEditRecord = (record: AttendanceRecord) => {
    setEditingRecord(record)
    setRecordFormData({
      status: record.status,
      notes: record.notes || "",
      period: record.period || "",
      subject: record.subject || "",
    })
  }

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRecord) return

    try {
      await updateAttendanceRecord(editingRecord.id, {
        status: recordFormData.status,
        notes: recordFormData.notes,
        period: recordFormData.period,
        subject: recordFormData.subject,
      })
      
      setEditingRecord(null)
      if (session) {
        const updatedSession = getAttendanceSession(session.id)
        if (updatedSession) {
          setSession(updatedSession)
        }
      }
      
      onSuccess?.()
    } catch (error) {
      console.error("Error updating attendance record:", error)
      alert("Failed to update attendance record")
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await deleteAttendanceRecord(recordId)
      if (session) {
        const updatedSession = getAttendanceSession(session.id)
        if (updatedSession) {
          setSession(updatedSession)
        }
      }
      onSuccess?.()
    } catch (error) {
      console.error("Error deleting attendance record:", error)
      alert("Failed to delete attendance record")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-50"
      case "pending": return "text-yellow-600 bg-yellow-50"
      case "locked": return "text-red-600 bg-red-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  const getAttendanceRecords = () => {
    if (!session) return []
    return getAttendanceByClass(session.classId).filter(record => record.sessionId === session.id)
  }

  const attendanceRecords = getAttendanceRecords()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleOpen}>
            {isCreating ? <Plus className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isCreating ? "Create Session" : "Manage Session"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-8xl w-[98vw] max-h-[98vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle>
            {isCreating ? "Create New Attendance Session" : "Attendance Session Management"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8">
          {session && (
            <Card>
              <CardHeader className="pb-6">
                <CardTitle className="text-lg">Session Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Class</Label>
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-md">
                      <BookOpen className="h-5 w-5" />
                      <span className="font-medium">{session.className}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-md">
                      <Calendar className="h-5 w-5" />
                      <span>{format(new Date(session.date), "PPP")}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Teacher</Label>
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-md">
                      <User className="h-5 w-5" />
                      <span>{session.teacherName}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge className={getStatusColor(session.status)}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="edit">{isCreating ? "Create" : "Edit"}</TabsTrigger>
              <TabsTrigger value="records">Records ({attendanceRecords.length})</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {session && (
                <Card>
                  <CardHeader className="pb-6">
                    <CardTitle>Session Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-muted-foreground">Period</Label>
                        <div className="flex items-center gap-3 p-4 bg-muted rounded-md">
                          <Clock className="h-5 w-5" />
                          <span>{session.period}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
                        <div className="flex items-center gap-3 p-4 bg-muted rounded-md">
                          <BookOpen className="h-5 w-5" />
                          <span>{session.subject}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">Attendance Summary</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-md">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-600">{session.presentCount} Present</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-md">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-600">{session.absentCount} Absent</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-md">
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium text-yellow-600">{session.lateCount} Late</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-md">
                          <UserCheck className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-blue-600">{session.excusedCount} Excused</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="edit" className="space-y-6">
              <Card>
                <CardHeader className="pb-6">
                  <CardTitle>{isCreating ? "Create New Session" : "Edit Session"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={isCreating ? handleCreateSession : handleUpdateSession} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="classId">Class</Label>
                        <Select value={formData.classId} onValueChange={(value) => {
                          const selectedClass = classes.find(c => c.id === value)
                          setFormData(prev => ({ 
                            ...prev, 
                            classId: value, 
                            className: selectedClass?.name || "" 
                          }))
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="date">Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.date}
                              onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="teacherId">Teacher</Label>
                        <Select value={formData.teacherId} onValueChange={(value) => {
                          const selectedTeacher = teachers.find(t => t.id === value)
                          setFormData(prev => ({ 
                            ...prev, 
                            teacherId: value, 
                            teacherName: selectedTeacher?.name || "" 
                          }))
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="period">Period</Label>
                        <Select value={formData.period} onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}>
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
                      <div className="space-y-3">
                        <Label htmlFor="subject">Subject</Label>
                        <Select value={formData.subject} onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}>
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value: "pending" | "completed" | "locked") => setFormData(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="locked">Locked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="totalStudents">Total Students</Label>
                        <Input
                          type="number"
                          value={formData.totalStudents}
                          onChange={(e) => setFormData(prev => ({ ...prev, totalStudents: parseInt(e.target.value) || 0 }))}
                          placeholder="Enter total number of students"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                      <Button type="submit" disabled={isLoading}>
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Saving..." : (isCreating ? "Create Session" : "Save Changes")}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="records" className="space-y-6">
              <Card>
                <CardHeader className="pb-6">
                  <CardTitle>Attendance Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {attendanceRecords.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Marked At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.studentName}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(record.status)}>
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.notes || "-"}</TableCell>
                            <TableCell>{format(new Date(record.markedAt), "PPp")}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditRecord(record)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Record</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this attendance record?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteRecord(record.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No attendance records found for this session.
                    </div>
                  )}
                </CardContent>
              </Card>

              {editingRecord && (
                <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Attendance Record</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateRecord} className="space-y-4">
                      <div className="space-y-3">
                        <Label>Student</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {editingRecord.studentName}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="recordStatus">Status</Label>
                        <Select value={recordFormData.status} onValueChange={(value: "present" | "absent" | "late" | "excused") => setRecordFormData(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="recordNotes">Notes</Label>
                        <Textarea
                          value={recordFormData.notes}
                          onChange={(e) => setRecordFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add notes about this attendance record..."
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setEditingRecord(null)}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              <Card>
                <CardHeader className="pb-6">
                  <CardTitle>Session Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="flex items-center gap-3 p-4">
                      <Copy className="h-5 w-5" />
                      Duplicate Session
                    </Button>
                    <Button variant="outline" className="flex items-center gap-3 p-4">
                      <Archive className="h-5 w-5" />
                      Archive Session
                    </Button>
                    <Button variant="outline" className="flex items-center gap-3 p-4">
                      <RefreshCw className="h-5 w-5" />
                      Refresh Data
                    </Button>
                    <Button variant="outline" className="flex items-center gap-3 p-4">
                      <Download className="h-5 w-5" />
                      Export Data
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Danger Zone</h4>
                    <div className="flex gap-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete Records Only
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Attendance Records</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete all attendance records for this session?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteRecords} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete Records
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Delete Session
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Attendance Session</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this attendance session? This will also delete all related attendance records.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete Session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader className="pb-6">
                  <CardTitle>Session Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="flex items-center gap-3 p-4">
                      <FileText className="h-5 w-5" />
                      Attendance Summary
                    </Button>
                    <Button variant="outline" className="flex items-center gap-3 p-4">
                      <Download className="h-5 w-5" />
                      Export to PDF
                    </Button>
                    <Button variant="outline" className="flex items-center gap-3 p-4">
                      <Download className="h-5 w-5" />
                      Export to Excel
                    </Button>
                    <Button variant="outline" className="flex items-center gap-3 p-4">
                      <FileText className="h-5 w-5" />
                      Detailed Report
                    </Button>
                  </div>

                  {session && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Quick Statistics</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{session.presentCount}</div>
                          <div className="text-sm text-muted-foreground">Present</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{session.absentCount}</div>
                          <div className="text-sm text-muted-foreground">Absent</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{session.lateCount}</div>
                          <div className="text-sm text-muted-foreground">Late</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{session.excusedCount}</div>
                          <div className="text-sm text-muted-foreground">Excused</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex gap-3">
              {!isCreating && (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("edit")}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Session
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                onCancel?.()
              }}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
