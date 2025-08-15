"use client"

import { useState, useMemo } from "react"
import { Search, TrendingUp, Award, BookOpen, Filter, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useTeacherGrades } from "@/lib/teacher-grades-context"

interface StudentGradesViewProps {
  onNavigateToGradeEntry?: () => void
}

export function StudentGradesView({ onNavigateToGradeEntry }: StudentGradesViewProps) {
  const { students, classes, assessments, grades, getStudentGrades, getStudentStats, getStudentsByClass } =
    useTeacherGrades()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClassId, setSelectedClassId] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  // Filter students based on search and class selection
  const filteredStudents = useMemo(() => {
    let filtered = students

    // Filter by class
    if (selectedClassId !== "all") {
      filtered = getStudentsByClass(selectedClassId)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return filtered
  }, [students, selectedClassId, searchTerm, getStudentsByClass])

  // Get student performance data
  const getStudentPerformance = (studentId: string) => {
    const studentGrades = getStudentGrades(studentId)
    const stats = getStudentStats(studentId)

    return {
      grades: studentGrades,
      stats,
      recentGrades: studentGrades.slice(-5), // Last 5 grades
    }
  }

  const StudentDetailDialog = ({ studentId }: { studentId: string }) => {
    const student = students.find((s) => s.id === studentId)
    const performance = getStudentPerformance(studentId)

    if (!student) return null

    return (
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
              <AvatarFallback>
                {student.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{student.name}</div>
              <div className="text-sm text-muted-foreground">{student.studentId}</div>
            </div>
          </DialogTitle>
          <DialogDescription>
            {student.className} • {student.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Performance Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performance.stats.totalAssessments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performance.stats.averageGrade.toFixed(1)}%</div>
                <Progress value={performance.stats.averageGrade} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest Grade</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{performance.stats.highestGrade}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lowest Grade</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{performance.stats.lowestGrade}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(performance.stats.gradeDistribution).map(([grade, count]) => (
                  <Badge key={grade} variant="outline">
                    {grade}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Grades */}
          <Card>
            <CardHeader>
              <CardTitle>All Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.grades.map((grade) => {
                    const assessment = assessments.find((a) => a.id === grade.assessmentId)
                    return (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{assessment?.title || "Unknown Assessment"}</TableCell>
                        <TableCell>{assessment?.subject || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {assessment?.type || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {grade.marks}/{assessment?.totalMarks || 0}
                        </TableCell>
                        <TableCell>{grade.percentage}%</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${
                              grade.grade === "A"
                                ? "text-green-600"
                                : grade.grade === "B"
                                  ? "text-blue-600"
                                  : grade.grade === "C"
                                    ? "text-yellow-600"
                                    : grade.grade === "D"
                                      ? "text-orange-600"
                                      : grade.grade === "E"
                                        ? "text-red-500"
                                        : "text-red-700"
                            }`}
                          >
                            {grade.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>{assessment ? new Date(assessment.date).toLocaleDateString() : "-"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Grades</h1>
          <p className="text-muted-foreground">View and analyze individual student performance</p>
        </div>
        {onNavigateToGradeEntry && (
          <Button onClick={onNavigateToGradeEntry}>
            <BookOpen className="h-4 w-4 mr-2" />
            Enter Grades
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({filteredStudents.length})</CardTitle>
          <CardDescription>Click on a student to view detailed performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Assessments</TableHead>
                <TableHead>Average Grade</TableHead>
                <TableHead>Recent Performance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No students found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  const performance = getStudentPerformance(student.id)

                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                            <AvatarFallback>
                              {student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{student.studentId}</TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{performance.stats.totalAssessments} assessments</Badge>
                      </TableCell>
                      <TableCell>
                        {performance.stats.totalAssessments > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{performance.stats.averageGrade.toFixed(1)}%</span>
                            <Progress value={performance.stats.averageGrade} className="w-16" />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No grades</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {performance.recentGrades.slice(-3).map((grade, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className={`text-xs ${
                                grade.grade === "A"
                                  ? "text-green-600"
                                  : grade.grade === "B"
                                    ? "text-blue-600"
                                    : grade.grade === "C"
                                      ? "text-yellow-600"
                                      : grade.grade === "D"
                                        ? "text-orange-600"
                                        : grade.grade === "E"
                                          ? "text-red-500"
                                          : "text-red-700"
                              }`}
                            >
                              {grade.grade}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <StudentDetailDialog studentId={student.id} />
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
