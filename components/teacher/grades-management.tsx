"use client"

import { useState, useMemo, useEffect } from "react"
import { useTeacherGrades } from "@/lib/teacher-grades-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssessmentCreationForm } from "./assessment-creation-form"
import { GradeEntryForm } from "./grade-entry-form"
import { StudentGradesView } from "./student-grades-view"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Plus, BookOpen, Users, TrendingUp, Award, Edit, Trash2, Eye, BarChart3, Loader2 } from "lucide-react"

export function GradesManagement() {
  const {
    assessments,
    grades,
    students,
    classes,
    getAssessmentsByClass,
    getGradesByAssessment,
    getStudentsByClass,
    deleteAssessment,
    loading,
    loadingAssessments,
    loadingGrades,
    loadAssessments,
    loadGrades,
    loadAllData,
  } = useTeacherGrades()

  const [selectedTab, setSelectedTab] = useState("overview")
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null)
  const [assessmentPage, setAssessmentPage] = useState(1)
  const assessmentsPerPage = 20

  // Lazy load data when component mounts
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Memoized statistics
  const getAssessmentStats = useMemo(() => {
    return (assessmentId: string) => {
      const assessmentGrades = getGradesByAssessment(assessmentId)
      if (assessmentGrades.length === 0) {
        return {
          totalStudents: 0,
          submittedCount: 0,
          averageGrade: 0,
          highestGrade: 0,
          lowestGrade: 0,
          passRate: 0,
        }
      }

      const percentages = assessmentGrades.map((grade) => grade.percentage)
      const passCount = assessmentGrades.filter((grade) => grade.percentage >= 50).length

      return {
        totalStudents: assessmentGrades.length,
        submittedCount: assessmentGrades.length,
        averageGrade: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
        highestGrade: Math.max(...percentages),
        lowestGrade: Math.min(...percentages),
        passRate: (passCount / assessmentGrades.length) * 100,
      }
    }
  }, [getGradesByAssessment])

  const getGradeDistribution = useMemo(() => {
    return (assessmentId: string) => {
      const assessmentGrades = getGradesByAssessment(assessmentId)
      const distribution = assessmentGrades.reduce(
        (acc, grade) => {
          acc[grade.grade] = (acc[grade.grade] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )
      return distribution
    }
  }, [getGradesByAssessment])

  const overallStats = useMemo(() => {
    return {
      totalAssessments: assessments.length,
      totalGrades: grades.length,
      totalStudents: students.length,
      totalClasses: classes.length,
    }
  }, [assessments.length, grades.length, students.length, classes.length])

  // Paginated assessments
  const paginatedAssessments = useMemo(() => {
    const sorted = [...assessments].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return sorted.slice(0, assessmentPage * assessmentsPerPage)
  }, [assessments, assessmentPage, assessmentsPerPage])

  const hasMoreAssessments = assessments.length > paginatedAssessments.length

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (
      window.confirm("Are you sure you want to delete this assessment? This will also delete all associated grades.")
    ) {
      await deleteAssessment(assessmentId)
    }
  }

  const AssessmentDetailsDialog = ({ assessment }: { assessment: any }) => {
    const stats = getAssessmentStats(assessment.id)
    const distribution = getGradeDistribution(assessment.id)
    const assessmentGrades = getGradesByAssessment(assessment.id)

    return (
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{assessment.title}</DialogTitle>
          <DialogDescription>
            {assessment.subject} • {assessment.className} • {new Date(assessment.date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.submittedCount}</div>
                <p className="text-xs text-muted-foreground">out of {stats.totalStudents} students</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageGrade.toFixed(1)}%</div>
                <Progress value={stats.averageGrade} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Highest</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.highestGrade}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</div>
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
                {Object.entries(distribution).map(([grade, count]) => (
                  <Badge key={grade} variant="outline">
                    {grade}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grades Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentGrades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.studentName}</TableCell>
                      <TableCell>
                        {grade.marks}/{assessment.totalMarks}
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
                      <TableCell>{grade.remarks || "-"}</TableCell>
                    </TableRow>
                  ))}
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
      <div>
        <h1 className="text-3xl font-bold">Grades Management</h1>
        <p className="text-muted-foreground">Create assessments, enter grades, and analyze student performance</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create-assessment">Create Assessment</TabsTrigger>
          <TabsTrigger value="enter-grades">Enter Grades</TabsTrigger>
          <TabsTrigger value="student-grades">Student Grades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.totalAssessments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.totalGrades}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.totalClasses}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Assessments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Assessments</CardTitle>
                <CardDescription>Manage your assessments and view performance</CardDescription>
              </div>
              <Button onClick={() => setSelectedTab("create-assessment")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Assessment
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAssessments && paginatedAssessments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-muted-foreground">Loading assessments...</p>
                      </TableCell>
                    </TableRow>
                  ) : paginatedAssessments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">No assessments found. Create your first assessment!</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAssessments.map((assessment) => {
                      const stats = getAssessmentStats(assessment.id)
                      return (
                        <TableRow key={assessment.id}>
                          <TableCell className="font-medium">{assessment.title}</TableCell>
                          <TableCell>{assessment.className}</TableCell>
                          <TableCell>{assessment.subject}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {assessment.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(assessment.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {stats.submittedCount}/{stats.totalStudents}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <AssessmentDetailsDialog assessment={assessment} />
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAssessment(assessment.id)
                                  setSelectedTab("enter-grades")
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAssessment(assessment.id)}
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
              {hasMoreAssessments && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => setAssessmentPage(prev => prev + 1)}
                    variant="outline"
                    disabled={loadingAssessments}
                  >
                    {loadingAssessments ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      `Load More (${assessments.length - paginatedAssessments.length} remaining)`
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create-assessment">
          <AssessmentCreationForm onSuccess={() => setSelectedTab("overview")} />
        </TabsContent>

        <TabsContent value="enter-grades">
          <GradeEntryForm selectedAssessmentId={selectedAssessment} onSuccess={() => setSelectedTab("overview")} />
        </TabsContent>

        <TabsContent value="student-grades">
          <StudentGradesView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
