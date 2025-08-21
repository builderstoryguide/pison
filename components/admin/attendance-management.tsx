"use client"

import { useState } from "react"
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Plus,
  Search,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  BarChart3,
  FileText,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { AttendanceMarkingForm } from "./attendance-marking-form"
import { EditAttendanceRecordForm } from "./edit-attendance-record-form"
import { AttendanceSessionManagement } from "./attendance-session-management"
import { AttendanceSessionCRUD } from "./attendance-session-crud"
import { BulkAttendanceOperations } from "./bulk-attendance-operations"
import { useAttendance } from "@/lib/attendance-context"

export function AttendanceManagement() {
  const { attendanceRecords, attendanceSessions, attendanceStats, studentSummaries, isLoading } = useAttendance()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedDateRange, setSelectedDateRange] = useState("week")
  const [showMarkingForm, setShowMarkingForm] = useState(false)

  // Mock classes for filtering
  const classes = [
    { id: "all", name: "All Classes" },
    { id: "cls_001", name: "Form 5A Science" },
    { id: "cls_002", name: "Terminale C" },
    { id: "cls_003", name: "Form 4B Arts" },
    { id: "cls_004", name: "Première D" },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "late":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "excused":
        return <UserCheck className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "text-green-600 bg-green-50"
      case "absent":
        return "text-red-600 bg-red-50"
      case "late":
        return "text-yellow-600 bg-yellow-50"
      case "excused":
        return "text-blue-600 bg-blue-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getAttendanceStatusColor = (rate: number) => {
    if (rate >= 95) return "text-green-600"
    if (rate >= 85) return "text-blue-600"
    if (rate >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  const filteredSessions = attendanceSessions.filter((session) => {
    const matchesSearch =
      session.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === "all" || session.classId === selectedClass
    const matchesStatus = selectedStatus === "all" || session.status === selectedStatus

    return matchesSearch && matchesClass && matchesStatus
  })

  const filteredStudentSummaries = studentSummaries.filter((student) => {
    const matchesSearch =
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.className.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === "all" || student.classId === selectedClass

    return matchesSearch && matchesClass
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Track and manage student attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Dialog open={showMarkingForm} onOpenChange={setShowMarkingForm}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Mark Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Mark Attendance</DialogTitle>
              </DialogHeader>
              <AttendanceMarkingForm
                onSuccess={() => setShowMarkingForm(false)}
                onCancel={() => setShowMarkingForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{attendanceStats.trendPercentage}%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.averageAttendance.toFixed(1)}%</div>
            <Progress value={attendanceStats.averageAttendance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats.presentRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {attendanceRecords.filter((r) => r.status === "present").length} present records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Rate</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{attendanceStats.absentRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {attendanceRecords.filter((r) => r.status === "absent").length} absent records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search sessions, classes, or teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="term">This Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Attendance Sessions
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Individual Records
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student Summary
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance Sessions</CardTitle>
                  <CardDescription>
                    Manage and view attendance sessions ({filteredSessions.length} sessions)
                  </CardDescription>
                </div>
                <AttendanceSessionCRUD
                  mode="create"
                  onSuccess={() => {
                    // Refresh data if needed
                  }}
                  trigger={
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Session
                    </Button>
                  }
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.date}</TableCell>
                      <TableCell>{session.className}</TableCell>
                      <TableCell>{session.subject}</TableCell>
                      <TableCell>{session.period}</TableCell>
                      <TableCell>{session.teacherName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            {session.presentCount}
                          </div>
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-3 w-3" />
                            {session.absentCount}
                          </div>
                          <div className="flex items-center gap-1 text-yellow-600">
                            <AlertCircle className="h-3 w-3" />
                            {session.lateCount}
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <UserCheck className="h-3 w-3" />
                            {session.excusedCount}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            session.status === "completed"
                              ? "default"
                              : session.status === "pending"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <AttendanceSessionCRUD
                            sessionId={session.id}
                            onSuccess={() => {
                              // Refresh data if needed
                            }}
                            trigger={
                              <Button variant="outline" size="sm">
                                Manage
                              </Button>
                            }
                          />
                          {session.status === "pending" && (
                            <AttendanceSessionCRUD
                              sessionId={session.id}
                              mode="edit"
                              onSuccess={() => {
                                // Refresh data if needed
                              }}
                              trigger={
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                              }
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Individual Attendance Records</CardTitle>
                  <CardDescription>
                    Manage individual student attendance records ({attendanceRecords.length} records)
                  </CardDescription>
                </div>
                <BulkAttendanceOperations
                  records={attendanceRecords}
                  onSuccess={() => {
                    // Refresh data if needed
                  }}
                  trigger={
                    <Button variant="outline" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Bulk Operations
                    </Button>
                  }
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.studentName}</TableCell>
                      <TableCell>{record.className}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.subject || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <EditAttendanceRecordForm
                          recordId={record.id}
                          onSuccess={() => {
                            // Refresh data if needed
                          }}
                          trigger={
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Attendance Summary</CardTitle>
              <CardDescription>
                Individual student attendance records ({filteredStudentSummaries.length} students)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Total Sessions</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Late</TableHead>
                    <TableHead>Excused</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudentSummaries.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">{student.studentName}</TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell>{student.totalSessions}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {student.presentCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          {student.absentCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-yellow-600">
                          <AlertCircle className="h-3 w-3" />
                          {student.lateCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-blue-600">
                          <UserCheck className="h-3 w-3" />
                          {student.excusedCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={getAttendanceStatusColor(student.attendanceRate)}>
                            {student.attendanceRate.toFixed(1)}%
                          </span>
                          <Progress value={student.attendanceRate} className="w-16" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.status === "excellent"
                              ? "default"
                              : student.status === "good"
                                ? "secondary"
                                : student.status === "concerning"
                                  ? "outline"
                                  : "destructive"
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Weekly attendance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Present Rate</span>
                    <span className="text-sm font-medium text-green-600">
                      {attendanceStats.presentRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={attendanceStats.presentRate} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Late Rate</span>
                    <span className="text-sm font-medium text-yellow-600">{attendanceStats.lateRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={attendanceStats.lateRate} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Absent Rate</span>
                    <span className="text-sm font-medium text-red-600">{attendanceStats.absentRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={attendanceStats.absentRate} className="h-2" />

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Excused Rate</span>
                    <span className="text-sm font-medium text-blue-600">{attendanceStats.excusedRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={attendanceStats.excusedRate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Class Performance</CardTitle>
                <CardDescription>Attendance by class</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classes.slice(1).map((cls) => {
                    const classAttendance = Math.random() * 20 + 80 // Mock data
                    return (
                      <div key={cls.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{cls.name}</span>
                          <span className={`text-sm ${getAttendanceStatusColor(classAttendance)}`}>
                            {classAttendance.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={classAttendance} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Reports</CardTitle>
              <CardDescription>Create detailed attendance reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-24 flex flex-col gap-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Daily Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Weekly Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Monthly Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Student Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Class Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2 bg-transparent">
                  <FileText className="h-6 w-6" />
                  <span>Custom Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
