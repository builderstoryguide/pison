"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart3, 
  Plus, 
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Calendar,
  Target,
  PieChart,
  LineChart,
  Activity,
  Zap,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Calculator,
  TrendingDown,
  Save
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useTeacher, useTeacherClasses, useTeacherStudents, useTeacherGrades } from '@/lib/teacher-ultra-fast/context'
import { Assessment, Grade, TeacherClass, TeacherClassStudent } from '@/lib/teacher-ultra-fast/types'

interface UltraFastGradesProps {
  onSuccess?: () => void
  onCancel?: () => void
}

// Grade analytics calculations
interface GradeAnalytics {
  totalAssessments: number
  totalGrades: number
  averageGrade: number
  highestGrade: number
  lowestGrade: number
  passRate: number
  gradeDistribution: Record<string, number>
  trendData: Array<{ date: string; average: number }>
  classPerformance: Array<{ classId: string; className: string; average: number; count: number }>
  subjectPerformance: Array<{ subject: string; average: number; count: number }>
}

// Assessment creation form
const AssessmentCreationForm = ({ 
  onAssessmentCreated, 
  onCancel 
}: { 
  onAssessmentCreated: (assessment: Assessment) => void
  onCancel: () => void
}) => {
  const { createAssessment } = useTeacherGrades()
  const { classes } = useTeacherClasses()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    type: "" as "quiz" | "test" | "exam" | "assignment" | "project",
    subjectId: "",
    classId: "",
    totalMarks: 100,
    date: new Date().toISOString().split("T")[0],
    dueDate: undefined as Date | undefined,
    description: "",
  })
  const selectedClass = classes.find(cls => cls.id === formData.classId)
  const availableSubjects = selectedClass?.subjects || []

  const assessmentTypes = [
    { value: "quiz", label: "Quiz", description: "Short assessment (10-30 minutes)" },
    { value: "test", label: "Test", description: "Medium assessment (45-90 minutes)" },
    { value: "exam", label: "Exam", description: "Major assessment (2+ hours)" },
    { value: "assignment", label: "Assignment", description: "Take-home work" },
    { value: "project", label: "Project", description: "Long-term project work" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const result = await createAssessment({
        title: formData.title,
        type: formData.type,
        subjectId: formData.subjectId,
        classId: formData.classId,
        totalMarks: formData.totalMarks,
        date: formData.date,
        dueDate: formData.dueDate?.toISOString().split("T")[0],
        description: formData.description,
        status: 'draft'
      })

      if (result.success && result.assessmentId) {
        onAssessmentCreated({
          id: result.assessmentId,
          title: formData.title,
          type: formData.type,
          subjectId: formData.subjectId,
          subjectName: availableSubjects.find(s => s.id === formData.subjectId)?.name || '',
          classId: formData.classId,
          className: selectedClass?.name || '',
          totalMarks: formData.totalMarks,
          date: formData.date,
          dueDate: formData.dueDate?.toISOString().split("T")[0],
          description: formData.description,
          status: 'draft',
          createdAt: new Date().toISOString(),
          statistics: {
            totalStudents: selectedClass?.currentEnrollment || 0,
            submittedCount: 0,
            averageGrade: 0,
            highestGrade: 0,
            lowestGrade: 0,
            passRate: 0,
            gradeDistribution: {}
          }
        })
      }
    } catch (error) {
      // Error creating assessment
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Assessment
        </CardTitle>
        <CardDescription>Create a new assessment for your students</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Assessment Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Mid-term Mathematics Test"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Assessment Type *</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select assessment type" />
              </SelectTrigger>
              <SelectContent>
                {assessmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Class *</Label>
            <Select value={formData.classId} onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    <div className="flex items-center gap-2">
                      <span>{cls.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {cls.currentEnrollment} students
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select 
              value={formData.subjectId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
              disabled={!formData.classId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks *</Label>
              <Input
                id="totalMarks"
                type="number"
                min="1"
                max="1000"
                value={formData.totalMarks}
                onChange={(e) => setFormData(prev => ({ ...prev, totalMarks: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Assessment Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the assessment content..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={!formData.title || !formData.type || !formData.classId || !formData.subjectId || isSubmitting} className="flex-1">
              {isSubmitting ? "Creating..." : "Create Assessment"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Grade entry form
const GradeEntryForm = ({ 
  assessment, 
  onGradesSubmitted, 
  onCancel 
}: { 
  assessment: Assessment
  onGradesSubmitted: () => void
  onCancel: () => void
}) => {
  const { submitGrade } = useTeacherGrades()
  const { students } = useTeacherStudents()
  const [grades, setGrades] = useState<Record<string, { marks: number; remarks: string }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Initialize grades
    const initialGrades: Record<string, { marks: number; remarks: string }> = {}
    students.forEach((student) => {
      initialGrades[student.id] = { marks: 0, remarks: '' }
    })
    setGrades(initialGrades)
  }, [students])

  const handleGradeChange = (studentId: string, marks: number) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks }
    }))
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const gradePromises = students.map(async (student) => {
        const gradeData = grades[student.id]
        if (gradeData.marks > 0) {
          const percentage = (gradeData.marks / assessment.totalMarks) * 100
          let grade = 'F'
          if (percentage >= 90) grade = 'A'
          else if (percentage >= 80) grade = 'B'
          else if (percentage >= 70) grade = 'C'
          else if (percentage >= 60) grade = 'D'
          else if (percentage >= 50) grade = 'E'

          return submitGrade({
            assessmentId: assessment.id,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            marks: gradeData.marks,
            percentage,
            grade,
            remarks: gradeData.remarks,
            submittedAt: new Date().toISOString(),
            gradedAt: new Date().toISOString()
          })
        }
        return null
      })

      await Promise.all(gradePromises.filter(Boolean))
      onGradesSubmitted()
    } catch (error) {
      // Error submitting grades
    } finally {
      setIsSubmitting(false)
    }
  }

  const getGradeStats = () => {
    const submittedGrades = Object.values(grades).filter(g => g.marks > 0)
    const totalMarks = submittedGrades.reduce((sum, g) => sum + g.marks, 0)
    const average = submittedGrades.length > 0 ? totalMarks / submittedGrades.length : 0
    const percentage = (average / assessment.totalMarks) * 100

    return {
      submitted: submittedGrades.length,
      total: students.length,
      average: average.toFixed(1),
      percentage: percentage.toFixed(1)
    }
  }

  const stats = getGradeStats()

  return (
    <div className="space-y-4">
      {/* Assessment Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {assessment.title}
          </CardTitle>
          <CardDescription>
            {assessment.className} • {assessment.subjectName} • {format(new Date(assessment.date), "PPP")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.submitted}</div>
              <p className="text-xs text-muted-foreground">Graded</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.average}</div>
              <p className="text-xs text-muted-foreground">Avg Marks</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.percentage}%</div>
              <p className="text-xs text-muted-foreground">Avg Percentage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Enter Grades</CardTitle>
          <CardDescription>Enter marks and remarks for each student</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="text-sm font-medium min-w-0">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {student.studentId}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`marks-${student.id}`} className="text-sm">Marks:</Label>
                    <Input
                      id={`marks-${student.id}`}
                      type="number"
                      min="0"
                      max={assessment.totalMarks}
                      value={grades[student.id]?.marks || 0}
                      onChange={(e) => handleGradeChange(student.id, parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">/{assessment.totalMarks}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`remarks-${student.id}`} className="text-sm">Remarks:</Label>
                    <Input
                      id={`remarks-${student.id}`}
                      value={grades[student.id]?.remarks || ''}
                      onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                      placeholder="Optional"
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit Grades"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Analytics dashboard
const AnalyticsDashboard = ({ analytics }: { analytics: GradeAnalytics }) => {
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">Assessments created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalGrades}</div>
            <p className="text-xs text-muted-foreground">Grades submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageGrade.toFixed(1)}%</div>
            <Progress value={analytics.averageGrade} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.passRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Students passing</p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution</CardTitle>
          <CardDescription>Distribution of grades across all assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(analytics.gradeDistribution).map(([grade, count]) => (
              <Badge key={grade} variant="outline" className="text-sm">
                {grade}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Class Performance</CardTitle>
          <CardDescription>Average grades by class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.classPerformance.map((classPerf) => (
              <div key={classPerf.classId} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{classPerf.className}</h4>
                  <p className="text-sm text-muted-foreground">{classPerf.count} assessments</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{classPerf.average.toFixed(1)}%</div>
                  <Progress value={classPerf.average} className="w-20 h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Main grades component
export function UltraFastGrades({ onSuccess, onCancel }: UltraFastGradesProps) {
  const { 
    getAssessments, 
    getGrades
  } = useTeacherGrades()
  const { 
    isRealTimeConnected, 
    refreshData 
  } = useTeacher()
  
  const [currentView, setCurrentView] = useState<'overview' | 'create' | 'enter' | 'analytics'>('overview')
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'completed'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const assessments = getAssessments()
  const grades = getGrades()

  const filteredAssessments = useMemo(() => {
    let filtered = assessments

    if (searchQuery) {
      filtered = filtered.filter(assessment => 
        assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(assessment => assessment.status === filterStatus)
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [assessments, searchQuery, filterStatus])

  // Calculate analytics
  const analytics = useMemo((): GradeAnalytics => {
    const totalAssessments = assessments.length
    const totalGrades = grades.length
    const averageGrade = totalGrades > 0 ? grades.reduce((sum, grade) => sum + grade.percentage, 0) / totalGrades : 0
    const highestGrade = totalGrades > 0 ? Math.max(...grades.map(g => g.percentage)) : 0
    const lowestGrade = totalGrades > 0 ? Math.min(...grades.map(g => g.percentage)) : 0
    const passRate = totalGrades > 0 ? (grades.filter(g => g.percentage >= 50).length / totalGrades) * 100 : 0

    const gradeDistribution = grades.reduce((acc, grade) => {
      acc[grade.grade] = (acc[grade.grade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Group by class
    const classPerformance = assessments.reduce((acc, assessment) => {
      const existing = acc.find(c => c.classId === assessment.classId)
      if (existing) {
        existing.average = (existing.average * existing.count + assessment.statistics.averageGrade) / (existing.count + 1)
        existing.count++
      } else {
        acc.push({
          classId: assessment.classId,
          className: assessment.className,
          average: assessment.statistics.averageGrade,
          count: 1
        })
      }
      return acc
    }, [] as Array<{ classId: string; className: string; average: number; count: number }>)

    // Group by subject
    const subjectPerformance = assessments.reduce((acc, assessment) => {
      const existing = acc.find(s => s.subject === assessment.subjectName)
      if (existing) {
        existing.average = (existing.average * existing.count + assessment.statistics.averageGrade) / (existing.count + 1)
        existing.count++
      } else {
        acc.push({
          subject: assessment.subjectName,
          average: assessment.statistics.averageGrade,
          count: 1
        })
      }
      return acc
    }, [] as Array<{ subject: string; average: number; count: number }>)

    return {
      totalAssessments,
      totalGrades,
      averageGrade,
      highestGrade,
      lowestGrade,
      passRate,
      gradeDistribution,
      trendData: [], // Would be calculated from historical data
      classPerformance,
      subjectPerformance
    }
  }, [assessments, grades])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
    } catch (error) {
      // Error refreshing grades
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshData])

  const handleCreateAssessment = useCallback((assessment: Assessment) => {
    setCurrentView('overview')
    handleRefresh()
  }, [handleRefresh])

  const handleEnterGrades = useCallback((assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setCurrentView('enter')
  }, [])

  const handleGradesSubmitted = useCallback(() => {
    setCurrentView('overview')
    setSelectedAssessment(null)
    handleRefresh()
    onSuccess?.()
  }, [handleRefresh, onSuccess])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Grades Management</h2>
          <p className="text-muted-foreground">
            Create assessments, enter grades, and analyze student performance
            <span className="ml-2 flex items-center gap-2">
              {isRealTimeConnected ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          
          {currentView === 'overview' && (
            <Button onClick={() => setCurrentView('create')} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create">Create Assessment</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assessments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assessments List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments ({filteredAssessments.length})</CardTitle>
              <CardDescription>Manage your assessments and view performance</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAssessments.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Assessments Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || filterStatus !== 'all' 
                      ? "No assessments match your current filters."
                      : "You haven't created any assessments yet."
                    }
                  </p>
                  <Button onClick={() => setCurrentView('create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Assessment
                  </Button>
                </div>
              ) : (
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
                    {filteredAssessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.title}</TableCell>
                        <TableCell>{assessment.className}</TableCell>
                        <TableCell>{assessment.subjectName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {assessment.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(assessment.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          {assessment.statistics.submittedCount}/{assessment.statistics.totalStudents}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEnterGrades(assessment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <AssessmentCreationForm
            onAssessmentCreated={handleCreateAssessment}
            onCancel={() => setCurrentView('overview')}
          />
        </TabsContent>

        <TabsContent value="enter">
          {selectedAssessment && (
            <GradeEntryForm
              assessment={selectedAssessment}
              onGradesSubmitted={handleGradesSubmitted}
              onCancel={() => {
                setCurrentView('overview')
                setSelectedAssessment(null)
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard analytics={analytics} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
