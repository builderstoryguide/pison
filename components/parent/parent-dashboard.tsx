"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Calendar,
  MessageSquare,
  TrendingUp,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  FileText,
  Phone,
  Mail,
} from "lucide-react"

interface ParentDashboardProps {
  onNavigate?: (view: string) => void
}

export function ParentDashboard({ onNavigate }: ParentDashboardProps) {
  // Mock data for parent's child
  const childData = {
    id: "STU2024001",
    name: "Amina Fru",
    class: "Form 5A",
    branch: "Grammar",
    subsystem: "English",
    avatar: "/placeholder-user.jpg",
    overallGrade: "B+",
    attendance: 92,
    recentGrades: [
      { subject: "Mathematics", grade: "A-", date: "2024-01-15", teacher: "Mr. Paul Mbeki" },
      { subject: "English", grade: "B+", date: "2024-01-12", teacher: "Mrs. Grace Tabi" },
      { subject: "Physics", grade: "A", date: "2024-01-10", teacher: "Dr. Marie Ngozi" },
      { subject: "Chemistry", grade: "B", date: "2024-01-08", teacher: "Mr. John Doe" },
    ],
    upcomingAssignments: [
      { subject: "Mathematics", title: "Calculus Assignment", dueDate: "2024-01-25", status: "pending" },
      { subject: "English", title: "Essay on Literature", dueDate: "2024-01-28", status: "pending" },
      { subject: "Physics", title: "Lab Report", dueDate: "2024-01-30", status: "in-progress" },
    ],
    teachers: [
      {
        id: "TCH001",
        name: "Mr. Paul Mbeki",
        subject: "Mathematics",
        email: "p.mbeki@pisonacademy.cm",
        phone: "+237 677 234 567",
        avatar: "/placeholder-user.jpg",
      },
      {
        id: "TCH002",
        name: "Mrs. Grace Tabi",
        subject: "English",
        email: "bursar@pisonacademy.cm",
        phone: "+237 677 567 890",
        avatar: "/placeholder-user.jpg",
      },
      {
        id: "TCH003",
        name: "Dr. Marie Ngozi",
        subject: "Physics",
        email: "admin@pisonacademy.cm",
        phone: "+237 677 123 456",
        avatar: "/placeholder-user.jpg",
      },
    ],
    attendanceRecord: [
      { date: "2024-01-20", status: "present", subject: "Mathematics" },
      { date: "2024-01-20", status: "present", subject: "English" },
      { date: "2024-01-19", status: "present", subject: "Physics" },
      { date: "2024-01-19", status: "absent", subject: "Chemistry", reason: "Sick" },
      { date: "2024-01-18", status: "present", subject: "Mathematics" },
    ],
  }

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-green-600"
    if (grade.startsWith("B")) return "text-blue-600"
    if (grade.startsWith("C")) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "text-green-600"
      case "absent":
        return "text-red-600"
      case "late":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-muted-foreground">Monitor your child's academic progress and communicate with teachers</p>
        </div>
      </div>

      {/* Child Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={childData.avatar || "/placeholder.svg"} alt={childData.name} />
              <AvatarFallback>
                {childData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">{childData.name}</CardTitle>
              <CardDescription>
                {childData.class} • {childData.branch} • {childData.subsystem} Subsystem
              </CardDescription>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="secondary">Student ID: {childData.id}</Badge>
                <Badge variant="outline" className={getGradeColor(childData.overallGrade)}>
                  Overall Grade: {childData.overallGrade}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childData.attendance}%</div>
            <Progress value={childData.attendance} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Grades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childData.recentGrades.length}</div>
            <p className="text-xs text-muted-foreground">New grades this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childData.upcomingAssignments.length}</div>
            <p className="text-xs text-muted-foreground">Upcoming assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childData.teachers.length}</div>
            <p className="text-xs text-muted-foreground">Subject teachers</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Grades</CardTitle>
              <CardDescription>Your child's latest academic performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {childData.recentGrades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{grade.subject}</p>
                        <p className="text-sm text-muted-foreground">Teacher: {grade.teacher}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getGradeColor(grade.grade)}`}>{grade.grade}</div>
                      <p className="text-sm text-muted-foreground">{grade.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Record</CardTitle>
              <CardDescription>Recent attendance history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {childData.attendanceRecord.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        {record.status === "present" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{record.subject}</p>
                        <p className="text-sm text-muted-foreground">{record.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={record.status === "present" ? "default" : "destructive"}
                        className={getStatusColor(record.status)}
                      >
                        {record.status}
                      </Badge>
                      {record.reason && <p className="text-sm text-muted-foreground mt-1">{record.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
              <CardDescription>Track your child's pending assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {childData.upcomingAssignments.map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Due: {assignment.dueDate}</p>
                      <Badge variant={assignment.status === "pending" ? "destructive" : "secondary"} className="mt-1">
                        {assignment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Teachers</CardTitle>
              <CardDescription>Contact your child's teachers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {childData.teachers.map((teacher) => (
                  <div key={teacher.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={teacher.avatar || "/placeholder.svg"} alt={teacher.name} />
                        <AvatarFallback>
                          {teacher.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{teacher.name}</p>
                        <p className="text-sm text-muted-foreground">{teacher.subject}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{teacher.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{teacher.phone}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => onNavigate?.("messages")}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for parents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start bg-transparent" onClick={() => onNavigate?.("grades")}>
              <GraduationCap className="mr-2 h-4 w-4" />
              View All Grades
            </Button>
            <Button
              variant="outline"
              className="justify-start bg-transparent"
              onClick={() => onNavigate?.("attendance")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Full Attendance
            </Button>
            <Button variant="outline" className="justify-start bg-transparent" onClick={() => onNavigate?.("messages")}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Teachers
            </Button>
            <Button variant="outline" className="justify-start bg-transparent" onClick={() => onNavigate?.("schedule")}>
              <Clock className="mr-2 h-4 w-4" />
              View Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
