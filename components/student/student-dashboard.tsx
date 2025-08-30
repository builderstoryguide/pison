"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  FileText,
  Phone,
  Mail,
  User,
  Award,
  BarChart3,
  CalendarDays,
  BookMarked,
  CreditCard,
} from "lucide-react"

interface StudentDashboardProps {
  onNavigate?: (view: string) => void
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  // Mock data for student
  const studentData = {
    id: "STU2024001",
    name: "Amina Fru",
    email: "amina.fru@student.gbhs-yaounde.cm",
    class: "Form 5A",
    branch: "Grammar",
    subsystem: "English",
    avatar: "/placeholder.svg",
    overallGrade: "A",
    attendance: 95,
    feesStatus: "paid",
    nextExam: "Mathematics - March 15, 2024",
    recentGrades: [
      { subject: "Mathematics", grade: "A", score: 85 },
      { subject: "English", grade: "A", score: 88 },
      { subject: "Physics", grade: "B+", score: 82 },
      { subject: "Chemistry", grade: "A-", score: 87 },
    ],
    upcomingAssignments: [
      { subject: "Mathematics", title: "Calculus Assignment", dueDate: "2024-03-10" },
      { subject: "English", title: "Essay Writing", dueDate: "2024-03-12" },
      { subject: "Physics", title: "Lab Report", dueDate: "2024-03-15" },
    ],
    schedule: [
      { day: "Monday", subjects: ["Mathematics", "English", "Physics", "Chemistry"] },
      { day: "Tuesday", subjects: ["Biology", "Mathematics", "English", "History"] },
      { day: "Wednesday", subjects: ["Physics", "Chemistry", "Mathematics", "English"] },
      { day: "Thursday", subjects: ["English", "Biology", "Mathematics", "Physics"] },
      { day: "Friday", subjects: ["Chemistry", "Mathematics", "English", "Biology"] },
    ],
    fees: {
      total: 75000,
      paid: 75000,
      balance: 0,
      status: "paid",
    },
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
      case "A+":
        return "text-green-600"
      case "B":
      case "B+":
        return "text-blue-600"
      case "C":
      case "C+":
        return "text-yellow-600"
      case "D":
      case "F":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-600"
      case "partial":
        return "text-yellow-600"
      case "pending":
        return "text-blue-600"
      case "overdue":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your academic overview</p>
        </div>
      </div>

      {/* Student Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={studentData.avatar} alt={studentData.name} />
              <AvatarFallback>
                {studentData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">{studentData.name}</CardTitle>
              <CardDescription>
                {studentData.class} • {studentData.branch} • {studentData.subsystem} Subsystem
              </CardDescription>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="secondary">Student ID: {studentData.id}</Badge>
                <Badge variant="outline" className={getGradeColor(studentData.overallGrade)}>
                  Overall Grade: {studentData.overallGrade}
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
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.attendance}%</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Status</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{studentData.feesStatus}</div>
            <p className="text-xs text-muted-foreground">Payment status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Exam</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">Mathematics</div>
            <p className="text-xs text-muted-foreground">March 15, 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.upcomingAssignments.length}</div>
            <p className="text-xs text-muted-foreground">Due this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Grades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Recent Grades
                </CardTitle>
                <CardDescription>Your latest academic performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentData.recentGrades.map((grade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{grade.subject}</p>
                        <p className="text-sm text-muted-foreground">Score: {grade.score}%</p>
                      </div>
                      <Badge variant="outline" className={getGradeColor(grade.grade)}>
                        {grade.grade}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5" />
                  Upcoming Assignments
                </CardTitle>
                <CardDescription>Deadlines to keep track of</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentData.upcomingAssignments.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                      </div>
                      <Badge variant="secondary">{assignment.dueDate}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Academic Performance
              </CardTitle>
              <CardDescription>Detailed view of your grades and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentData.recentGrades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{grade.subject}</h4>
                        <Badge variant="outline" className={getGradeColor(grade.grade)}>
                          {grade.grade}
                        </Badge>
                      </div>
                      <Progress value={grade.score} className="h-2" />
                      <p className="text-sm text-muted-foreground mt-1">Score: {grade.score}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>Your class timetable for the week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentData.schedule.map((day, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{day.day}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {day.subjects.map((subject, subjectIndex) => (
                        <Badge key={subjectIndex} variant="secondary" className="text-center">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookMarked className="h-5 w-5" />
                Assignment Tracker
              </CardTitle>
              <CardDescription>Manage your assignments and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentData.upcomingAssignments.map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{assignment.dueDate}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">Due soon</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Fee Information
              </CardTitle>
              <CardDescription>Your current fee status and payment history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{studentData.fees.total.toLocaleString()} FCFA</p>
                    <p className="text-sm text-muted-foreground">Total Fees</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{studentData.fees.paid.toLocaleString()} FCFA</p>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{studentData.fees.balance.toLocaleString()} FCFA</p>
                    <p className="text-sm text-muted-foreground">Balance</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Payment Status</h4>
                    <p className="text-sm text-muted-foreground">Current term fees</p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(studentData.fees.status)}>
                    {studentData.fees.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
