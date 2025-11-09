"use client"

import { Separator } from "@/components/ui/separator"

import { useState, useEffect } from "react"
import {
  Calendar,
  Users,
  Clock,
  BookOpen,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  TrendingUp,
  FileText,
  Eye,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTeacherAttendance } from "@/lib/teacher-attendance-context"
import { TeacherAttendanceForm } from "./teacher-attendance-form"
import { useAuth } from "@/lib/auth-context"

interface TeacherDashboardProps {
  onNavigate?: (view: string) => void
}

export function TeacherDashboard({ onNavigate }: TeacherDashboardProps) {
  const { user } = useAuth()
  const { teacherClasses, attendanceSessions, getTeacherClasses, getTodaySchedule, isLoading } = useTeacherAttendance()

  const [showAttendanceForm, setShowAttendanceForm] = useState(false)
  const [todaySchedule, setTodaySchedule] = useState<any[]>([])

  useEffect(() => {
    getTeacherClasses()
    setTodaySchedule(getTodaySchedule())
  }, [])

  // Calculate statistics
  const totalClasses = teacherClasses.length
  const totalStudents = teacherClasses.reduce((sum, cls) => sum + cls.students.length, 0)
  const todaySessions = attendanceSessions.filter((session) => session.date === new Date().toISOString().split("T")[0])
  const completedToday = todaySessions.filter((session) => session.status === "completed").length
  const pendingToday = todaySessions.filter((session) => session.status === "pending").length

  // Add grades statistics
  const totalGrades = 45 // Mock data - in real app, get from grades context
  const pendingGrades = 12 // Mock data

  // Recent attendance sessions
  const recentSessions = attendanceSessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name?.split(" ")[0]}! Manage your classes and attendance.
          </p>
        </div>
        <Dialog open={showAttendanceForm} onOpenChange={setShowAttendanceForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Mark Attendance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mark Class Attendance</DialogTitle>
            </DialogHeader>
            <TeacherAttendanceForm
              onSuccess={() => setShowAttendanceForm(false)}
              onCancel={() => setShowAttendanceForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">Active classes assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Students across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedToday}/{todaySessions.length}
            </div>
            <p className="text-xs text-muted-foreground">Attendance marked today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                onClick={() => onNavigate?.("assignments")}
              >
                Manage assignments
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No classes scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaySchedule.map((schedule, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="text-center">
                      <div className="text-sm font-medium">{schedule.startTime}</div>
                      <div className="text-xs text-muted-foreground">to</div>
                      <div className="text-sm font-medium">{schedule.endTime}</div>
                    </div>
                    <Separator orientation="vertical" className="h-12" />
                    <div className="flex-1">
                      <h4 className="font-medium">{schedule.subject}</h4>
                      <p className="text-sm text-muted-foreground">{schedule.period}</p>
                    </div>
                    <Badge variant="outline">{schedule.day}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => onNavigate?.("classes")}
            >
              <Eye className="h-4 w-4 mr-2" />
              View My Classes
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => setShowAttendanceForm(true)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start bg-transparent"
              onClick={() => onNavigate?.("grades")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Enter Grades
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start bg-transparent"
              onClick={() => onNavigate?.("examinations")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Enter Exam Marks
            </Button>
                         <Button 
               variant="outline" 
               className="w-full justify-start bg-transparent"
               onClick={() => onNavigate?.("grades")}
             >
               <Plus className="h-4 w-4 mr-2" />
               Create Assessment
             </Button>
             <Button 
               variant="outline" 
               className="w-full justify-start bg-transparent"
               onClick={() => onNavigate?.("my-assignments")}
             >
               <BookOpen className="h-4 w-4 mr-2" />
               My Subjects & Classes
             </Button>
             <Button 
               variant="outline" 
               className="w-full justify-start bg-transparent"
               onClick={() => onNavigate?.("assignments")}
             >
               <Award className="h-4 w-4 mr-2" />
               Manage Assignments
             </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My Classes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Classes you are teaching this academic year</CardDescription>
            </div>
            <Button variant="outline" onClick={() => onNavigate?.("classes")}>
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teacherClasses.slice(0, 3).map((cls) => (
              <Card key={cls.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {cls.subsystem}
                    </Badge>
                  </div>
                  <CardDescription>
                    {cls.level} • {cls.branch.charAt(0).toUpperCase() + cls.branch.slice(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Students:</span>
                      <span className="font-medium">
                        {cls.students.filter((s) => s.enrollmentStatus === "enrolled").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subjects:</span>
                      <span className="font-medium">{cls.schedule.length}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 bg-transparent"
                    onClick={() => setShowAttendanceForm(true)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {teacherClasses.length > 3 && (
            <div className="text-center mt-4">
              <Button variant="outline" onClick={() => onNavigate?.("classes")}>
                View {teacherClasses.length - 3} More Classes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Sessions</CardTitle>
          <CardDescription>Your latest attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No attendance sessions recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                recentSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.date}</TableCell>
                    <TableCell>{session.className}</TableCell>
                    <TableCell>{session.subject}</TableCell>
                    <TableCell>{session.period}</TableCell>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
                 </CardContent>
       </Card>
    </div>
  )
}
