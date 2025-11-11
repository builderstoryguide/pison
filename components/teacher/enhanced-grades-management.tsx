"use client"

import { useState, useMemo, useCallback } from "react"
import { useTeacherGrades } from "@/lib/teacher-grades-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart3,
  Save,
  X,
  Search,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react"
import { ClassGradeEntryForm } from "./class-grade-entry-form"
import { StudentGradesView } from "./student-grades-view"

export function EnhancedGradesManagement() {
  const {
    assessments,
    grades,
    students,
    classes,
    getAssessmentsByClass,
    getGradesByAssessment,
    getStudentsByClass,
    deleteAssessment,
    updateGrade,
    deleteGrade,
    loading,
    error,
  } = useTeacherGrades()

  const [selectedTab, setSelectedTab] = useState("overview")
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [editingGrade, setEditingGrade] = useState<string | null>(null)
  const [gradeEditData, setGradeEditData] = useState<{ marks: number; remarks: string }>({ marks: 0, remarks: "" })

  // Filtered assessments
  const filteredAssessments = useMemo(() => {
    let filtered = assessments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(assessment =>
        assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.className.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(assessment => assessment.type === filterType)
    }

    // Status filter (based on grading completion)
    if (filterStatus !== "all") {
      if (filterStatus === "graded") {
        filtered = filtered.filter(assessment => {
          const assessmentGrades = getGradesByAssessment(assessment.id)
          return assessmentGrades.length > 0
        })
      } else if (filterStatus === "ungraded") {
        filtered = filtered.filter(assessment => {
          const assessmentGrades = getGradesByAssessment(assessment.id)
          return assessmentGrades.length === 0
        })
      }
    }

    return filtered
  }, [assessments, searchTerm, filterType, filterStatus, getGradesByAssessment])

  // Assessment statistics
  const getAssessmentStats = useMemo(() => {
    return (assessmentId: string) => {
      const assessmentGrades = getGradesByAssessment(assessmentId)
      const assessment = assessments.find(a => a.id === assessmentId)
      
      if (assessmentGrades.length === 0) {
        return {
          totalStudents: 0,
          submittedCount: 0,
          averageGrade: 0,
          highestGrade: 0,
          lowestGrade: 0,
          passRate: 0,
          completionRate: 0,
        }
      }

      const percentages = assessmentGrades.map((grade) => grade.percentage)
      const passCount = assessmentGrades.filter((grade) => grade.percentage >= 50).length
      const totalStudents = assessment ? getStudentsByClass(assessment.classId).length : 0

      return {
        totalStudents,
        submittedCount: assessmentGrades.length,
        averageGrade: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
        highestGrade: Math.max(...percentages),
        lowestGrade: Math.min(...percentages),
        passRate: (passCount / assessmentGrades.length) * 100,
        completionRate: totalStudents > 0 ? (assessmentGrades.length / totalStudents) * 100 : 0,
      }
    }
  }, [getGradesByAssessment, assessments, getStudentsByClass])

  // Grade distribution
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

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalAssessments = assessments.length
    const totalGrades = grades.length
    const totalStudents = students.length
    const totalClasses = classes.length
    
    const completedAssessments = assessments.filter(assessment => {
      const assessmentGrades = getGradesByAssessment(assessment.id)
      return assessmentGrades.length > 0
    }).length

    const averageGrade = grades.length > 0 
      ? grades.reduce((sum, grade) => sum + grade.percentage, 0) / grades.length 
      : 0

    return {
      totalAssessments,
      completedAssessments,
      totalGrades,
      totalStudents,
      totalClasses,
      averageGrade,
      completionRate: totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0,
    }
  }, [assessments.length, grades, students.length, classes.length, getGradesByAssessment])

  // Handle assessment deletion
  const handleDeleteAssessment = async (assessmentId: string) => {
    try {
      await deleteAssessment(assessmentId)
    } catch (error) {
      console.error("Failed to delete assessment:", error)
    }
  }

  // Handle grade editing
  const handleEditGrade = (gradeId: string, currentMarks: number, currentRemarks: string) => {
    setEditingGrade(gradeId)
    setGradeEditData({ marks: currentMarks, remarks: currentRemarks })
  }

  const handleSaveGradeEdit = async () => {
    if (!editingGrade) return

    try {
      const grade = grades.find(g => g.id === editingGrade)
      if (!grade) return

      const assessment = assessments.find(a => a.id === grade.assessmentId)
      if (!assessment) return

      const percentage = (gradeEditData.marks / assessment.totalMarks) * 100
      
      await updateGrade(editingGrade, {
        marks: gradeEditData.marks,
        percentage: Math.round(percentage * 100) / 100,
        grade: grade.grade, // Recalculate grade if needed
        remarks: gradeEditData.remarks,
      })

      setEditingGrade(null)
      setGradeEditData({ marks: 0, remarks: "" })
    } catch (error) {
      console.error("Failed to update grade:", error)
    }
  }

  const handleDeleteGrade = async (gradeId: string) => {
    try {
      await deleteGrade(gradeId)
    } catch (error) {
      console.error("Failed to delete grade:", error)
    }
  }

  // Assessment details dialog component
  const AssessmentDetailsDialog = ({ assessment }: { assessment: any }) => {
    const stats = getAssessmentStats(assessment.id)
    const distribution = getGradeDistribution(assessment.id)
    const assessmentGrades = getGradesByAssessment(assessment.id)
    const classStudents = getStudentsByClass(assessment.classId)

    return (
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {assessment.title}
          </DialogTitle>
          <DialogDescription>
            {assessment.subject} • {assessment.className} • {new Date(assessment.date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.submittedCount}</div>
                <p className="text-xs text-muted-foreground">
                  out of {stats.totalStudents} students ({stats.completionRate.toFixed(1)}%)
                </p>
                <Progress value={stats.completionRate} className="mt-2" />
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
                  <Badge key={grade} variant="outline" className="text-sm">
                    {grade}: {count} ({((count / assessmentGrades.length) * 100).toFixed(1)}%)
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grades Table with CRUD Operations */}
          <Card>
            <CardHeader>
              <CardTitle>All Grades</CardTitle>
              <CardDescription>
                Manage individual student grades. Click on marks or remarks to edit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.map((student) => {
                    const grade = assessmentGrades.find(g => g.studentId === student.id)
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-muted-foreground">{student.studentId}</TableCell>
                        <TableCell>
                          {editingGrade === grade?.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max={assessment.totalMarks}
                                value={gradeEditData.marks}
                                onChange={(e) => setGradeEditData(prev => ({
                                  ...prev,
                                  marks: Number(e.target.value) || 0
                                }))}
                                className="w-20"
                              />
                              <Button size="sm" onClick={handleSaveGradeEdit}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setEditingGrade(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{grade?.marks || 0}/{assessment.totalMarks}</span>
                              {grade && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditGrade(grade.id, grade.marks, grade.remarks || "")}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {grade ? (
                            <span className="font-medium">{grade.percentage}%</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {grade ? (
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
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingGrade === grade?.id ? (
                            <Textarea
                              value={gradeEditData.remarks}
                              onChange={(e) => setGradeEditData(prev => ({
                                ...prev,
                                remarks: e.target.value
                              }))}
                              placeholder="Enter remarks..."
                              rows={1}
                              className="min-h-[32px] resize-none"
                            />
                          ) : (
                            <span className="text-sm">{grade?.remarks || "-"}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {grade ? (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Graded
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {grade && (
                            <div className="flex items-center gap-1">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Grade</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this grade for {student.name}? 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteGrade(grade.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
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
          <h1 className="text-3xl font-bold">Enhanced Grades Management</h1>
          <p className="text-muted-foreground">
            Enter grades and analyze student performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
                <p className="text-xs text-muted-foreground">
                  {overallStats.completedAssessments} completed ({overallStats.completionRate.toFixed(1)}%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.totalGrades}</div>
                <p className="text-xs text-muted-foreground">
                  Average: {overallStats.averageGrade.toFixed(1)}%
                </p>
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

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by title, subject, or class..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="graded">Graded</SelectItem>
                      <SelectItem value="ungraded">Not Graded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessments Table */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Assessments</CardTitle>
                <CardDescription>
                  Manage your assessments and view performance statistics
                </CardDescription>
              </div>
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
                    <TableHead>Progress</TableHead>
                    <TableHead>Average</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment) => {
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
                          <div className="flex items-center gap-2">
                            <Progress value={stats.completionRate} className="w-20" />
                            <span className="text-sm text-muted-foreground">
                              {stats.submittedCount}/{stats.totalStudents}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {stats.averageGrade > 0 ? (
                            <span className="font-medium">{stats.averageGrade.toFixed(1)}%</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{assessment.title}"? 
                                    This will also delete all associated grades and cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteAssessment(assessment.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              
              {filteredAssessments.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Assessments Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterType !== "all" || filterStatus !== "all" 
                      ? "Try adjusting your search or filters."
                      : "No assessments available."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enter-grades">
          <ClassGradeEntryForm onSuccess={() => setSelectedTab("overview")} />
        </TabsContent>

        <TabsContent value="student-grades">
          <StudentGradesView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
