"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Calendar, Download, Search, CheckCircle, XCircle, Clock, FileText, BarChart3 } from "lucide-react"

export function ParentChildRecords() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedPeriod, setSelectedPeriod] = useState("current")

  // Mock data for child's records
  const childData = {
    name: "Amina Fru",
    class: "Form 5A",
    studentId: "STU2024001",
    avatar: "/placeholder-user.jpg",
  }

  const academicRecords = [
    {
      id: "1",
      subject: "Mathematics",
      teacher: "Mr. Paul Mbeki",
      currentGrade: "A-",
      percentage: 88,
      assignments: 12,
      completed: 11,
      tests: 4,
      testAverage: 85,
      lastUpdated: "2024-01-20",
    },
    {
      id: "2",
      subject: "English",
      teacher: "Mrs. Grace Tabi",
      currentGrade: "B+",
      percentage: 82,
      assignments: 10,
      completed: 9,
      tests: 3,
      testAverage: 80,
      lastUpdated: "2024-01-19",
    },
    {
      id: "3",
      subject: "Physics",
      teacher: "Dr. Marie Ngozi",
      currentGrade: "A",
      percentage: 92,
      assignments: 8,
      completed: 8,
      tests: 3,
      testAverage: 90,
      lastUpdated: "2024-01-18",
    },
    {
      id: "4",
      subject: "Chemistry",
      teacher: "Mr. John Doe",
      currentGrade: "B",
      percentage: 78,
      assignments: 9,
      completed: 7,
      tests: 2,
      testAverage: 75,
      lastUpdated: "2024-01-17",
    },
  ]

  const attendanceRecords = [
    {
      date: "2024-01-20",
      subjects: [
        { name: "Mathematics", status: "present" },
        { name: "English", status: "present" },
        { name: "Physics", status: "present" },
        { name: "Chemistry", status: "late" },
      ],
    },
    {
      date: "2024-01-19",
      subjects: [
        { name: "Mathematics", status: "present" },
        { name: "English", status: "present" },
        { name: "Physics", status: "present" },
        { name: "Chemistry", status: "absent" },
      ],
    },
    {
      date: "2024-01-18",
      subjects: [
        { name: "Mathematics", status: "present" },
        { name: "English", status: "present" },
        { name: "Physics", status: "present" },
        { name: "Chemistry", status: "present" },
      ],
    },
  ]

  const recentAssignments = [
    {
      id: "1",
      subject: "Mathematics",
      title: "Calculus Problem Set 5",
      dueDate: "2024-01-25",
      submittedDate: "2024-01-24",
      grade: "A-",
      status: "graded",
      feedback: "Excellent work on integration problems. Minor error in problem 7.",
    },
    {
      id: "2",
      subject: "English",
      title: "Essay: African Literature Themes",
      dueDate: "2024-01-28",
      submittedDate: null,
      grade: null,
      status: "pending",
      feedback: null,
    },
    {
      id: "3",
      subject: "Physics",
      title: "Lab Report: Wave Motion",
      dueDate: "2024-01-30",
      submittedDate: "2024-01-29",
      grade: "A",
      status: "graded",
      feedback: "Outstanding experimental design and analysis.",
    },
  ]

  const filteredRecords = academicRecords.filter((record) => {
    const matchesSearch =
      record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubject === "all" || record.subject === selectedSubject
    return matchesSearch && matchesSubject
  })

  const getGradeColor = (grade: string) => {
    if (grade?.startsWith("A")) return "text-green-600"
    if (grade?.startsWith("B")) return "text-blue-600"
    if (grade?.startsWith("C")) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "late":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "graded":
        return "default"
      case "pending":
        return "secondary"
      case "overdue":
        return "destructive"
      default:
        return "outline"
    }
  }

  const overallAverage = Math.round(
    academicRecords.reduce((sum, record) => sum + record.percentage, 0) / academicRecords.length,
  )

  const totalAssignments = academicRecords.reduce((sum, record) => sum + record.assignments, 0)
  const completedAssignments = academicRecords.reduce((sum, record) => sum + record.completed, 0)
  const completionRate = Math.round((completedAssignments / totalAssignments) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Academic Records</h1>
          <p className="text-muted-foreground">Comprehensive view of your child's academic performance</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Records
        </Button>
      </div>

      {/* Student Info */}
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
                {childData.class} • Student ID: {childData.studentId}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAverage}%</div>
            <Progress value={overallAverage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignment Completion</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedAssignments} of {totalAssignments} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academicRecords.length}</div>
            <p className="text-xs text-muted-foreground">Active subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Today</div>
            <p className="text-xs text-muted-foreground">Records are current</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search subjects or teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {academicRecords.map((record) => (
              <SelectItem key={record.id} value={record.subject}>
                {record.subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current">Current Semester</SelectItem>
            <SelectItem value="previous">Previous Semester</SelectItem>
            <SelectItem value="year">Full Academic Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grades">Grades & Performance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>Detailed breakdown by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{record.subject}</h3>
                        <p className="text-sm text-muted-foreground">Teacher: {record.teacher}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getGradeColor(record.currentGrade)}`}>
                          {record.currentGrade}
                        </div>
                        <p className="text-sm text-muted-foreground">{record.percentage}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium">Assignments</p>
                        <p className="text-lg">
                          {record.completed}/{record.assignments}
                        </p>
                        <Progress value={(record.completed / record.assignments) * 100} className="mt-1" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Tests</p>
                        <p className="text-lg">{record.tests}</p>
                        <p className="text-xs text-muted-foreground">Avg: {record.testAverage}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Overall</p>
                        <p className="text-lg">{record.percentage}%</p>
                        <Progress value={record.percentage} className="mt-1" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-sm">{record.lastUpdated}</p>
                      </div>
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
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>Daily attendance by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attendanceRecords.map((day, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-3">{day.date}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {day.subjects.map((subject, subIndex) => (
                        <div key={subIndex} className="flex items-center gap-2">
                          {getStatusIcon(subject.status)}
                          <span className="text-sm">{subject.name}</span>
                          <Badge variant="outline" className="ml-auto">
                            {subject.status}
                          </Badge>
                        </div>
                      ))}
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
              <CardTitle>Recent Assignments</CardTitle>
              <CardDescription>Assignment submissions and grades</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.title}</TableCell>
                      <TableCell>{assignment.subject}</TableCell>
                      <TableCell>{assignment.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {assignment.grade && (
                          <span className={getGradeColor(assignment.grade)}>{assignment.grade}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{assignment.feedback || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
