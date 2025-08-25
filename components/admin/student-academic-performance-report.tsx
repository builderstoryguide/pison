"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  FileText,
  Download,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  GraduationCap,
  Users,
  BookOpen,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  Target,
  Clock,
} from "lucide-react"
import { useReportsAnalytics } from "@/lib/reports-analytics-context"
import { useStudentManagement } from "@/lib/student-management-context"
import { useExamination } from "@/lib/examination-context"

interface StudentPerformance {
  id: string
  studentId: string
  studentName: string
  class: string
  subsystem: string
  branch: string
  subjects: SubjectPerformance[]
  overallAverage: number
  rank: number
  totalStudents: number
  attendanceRate: number
  improvement: number
  status: "excellent" | "good" | "average" | "below_average" | "needs_improvement"
}

interface SubjectPerformance {
  subject: string
  average: number
  highest: number
  lowest: number
  grade: string
  rank: number
  totalStudents: number
  trend: "improving" | "declining" | "stable"
}

interface PerformanceSummary {
  totalStudents: number
  averageScore: number
  passRate: number
  excellentCount: number
  goodCount: number
  averageCount: number
  belowAverageCount: number
  needsImprovementCount: number
  topPerformers: StudentPerformance[]
  subjects: SubjectSummary[]
}

interface SubjectSummary {
  subject: string
  average: number
  passRate: number
  highest: number
  lowest: number
  totalStudents: number
}

export function StudentAcademicPerformanceReport() {
  const { generateReport, downloadReport } = useReportsAnalytics()
  const { students } = useStudentManagement()
  const { examinations } = useExamination()

  // State management
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [performanceData, setPerformanceData] = useState<PerformanceSummary | null>(null)
  const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null)
  const [showStudentDetails, setShowStudentDetails] = useState(false)
  const [reportFormat, setReportFormat] = useState<"pdf" | "excel">("pdf")

  // Mock data for demonstration
  const classes = [
    { value: "form1", label: "Form 1" },
    { value: "form2", label: "Form 2" },
    { value: "form3", label: "Form 3" },
    { value: "form4", label: "Form 4" },
    { value: "form5", label: "Form 5" },
    { value: "upper6", label: "Upper Sixth" },
    { value: "lower6", label: "Lower Sixth" },
  ]

  const terms = [
    { value: "first", label: "First Term" },
    { value: "second", label: "Second Term" },
    { value: "third", label: "Third Term" },
  ]

  const subsystems = [
    { value: "english", label: "English Sub-system" },
    { value: "french", label: "French Sub-system" },
  ]

  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "French",
    "History",
    "Geography",
    "Computer Science",
    "Physical Education",
  ]

  // Mock performance data
  const mockPerformanceData: PerformanceSummary = {
    totalStudents: 45,
    averageScore: 78.5,
    passRate: 92.3,
    excellentCount: 8,
    goodCount: 15,
    averageCount: 12,
    belowAverageCount: 7,
    needsImprovementCount: 3,
    topPerformers: [],
    subjects: [
      { subject: "Mathematics", average: 82.1, passRate: 95.6, highest: 98, lowest: 45, totalStudents: 45 },
      { subject: "Physics", average: 76.8, passRate: 88.9, highest: 96, lowest: 52, totalStudents: 45 },
      { subject: "Chemistry", average: 79.2, passRate: 91.1, highest: 97, lowest: 48, totalStudents: 45 },
      { subject: "Biology", average: 81.5, passRate: 93.3, highest: 99, lowest: 50, totalStudents: 45 },
      { subject: "English", average: 77.3, passRate: 89.8, highest: 95, lowest: 55, totalStudents: 45 },
    ],
  }

  const mockStudentPerformances: StudentPerformance[] = [
    {
      id: "1",
      studentId: "STU001",
      studentName: "John Doe",
      class: "Form 5A",
      subsystem: "english",
      branch: "grammar",
      overallAverage: 92.5,
      rank: 1,
      totalStudents: 45,
      attendanceRate: 98.5,
      improvement: 5.2,
      status: "excellent",
      subjects: [
        { subject: "Mathematics", average: 95, highest: 98, lowest: 92, grade: "A", rank: 1, totalStudents: 45, trend: "improving" },
        { subject: "Physics", average: 94, highest: 96, lowest: 90, grade: "A", rank: 1, totalStudents: 45, trend: "stable" },
        { subject: "Chemistry", average: 91, highest: 95, lowest: 88, grade: "A", rank: 2, totalStudents: 45, trend: "improving" },
        { subject: "Biology", average: 93, highest: 97, lowest: 89, grade: "A", rank: 1, totalStudents: 45, trend: "stable" },
        { subject: "English", average: 89, highest: 93, lowest: 85, grade: "A", rank: 3, totalStudents: 45, trend: "improving" },
      ],
    },
    {
      id: "2",
      studentId: "STU002",
      studentName: "Jane Smith",
      class: "Form 5A",
      subsystem: "english",
      branch: "grammar",
      overallAverage: 88.7,
      rank: 2,
      totalStudents: 45,
      attendanceRate: 96.2,
      improvement: 3.8,
      status: "excellent",
      subjects: [
        { subject: "Mathematics", average: 92, highest: 96, lowest: 88, grade: "A", rank: 2, totalStudents: 45, trend: "improving" },
        { subject: "Physics", average: 89, highest: 93, lowest: 85, grade: "A", rank: 3, totalStudents: 45, trend: "stable" },
        { subject: "Chemistry", average: 87, highest: 91, lowest: 83, grade: "A", rank: 4, totalStudents: 45, trend: "improving" },
        { subject: "Biology", average: 90, highest: 94, lowest: 86, grade: "A", rank: 2, totalStudents: 45, trend: "stable" },
        { subject: "English", average: 93, highest: 96, lowest: 90, grade: "A", rank: 1, totalStudents: 45, trend: "improving" },
      ],
    },
  ]

  useEffect(() => {
    // Load initial data
    setPerformanceData(mockPerformanceData)
    setStudentPerformances(mockStudentPerformances)
  }, [])

  const handleGenerateReport = async () => {
    if (!selectedClass || !selectedTerm) {
      return
    }

    setIsGenerating(true)
    try {
      const parameters = {
        class: selectedClass,
        term: selectedTerm,
        subsystem: selectedSubsystem === "all" ? undefined : selectedSubsystem,
        includeGraphs: true,
      }

      const reportId = await generateReport(
        "academic-performance",
        parameters,
        reportFormat,
        `Academic Performance Report - ${selectedClass} - ${selectedTerm}`,
        `Generated on ${new Date().toLocaleDateString()}`
      )

      console.log("Report generated:", reportId)
    } catch (error) {
      console.error("Failed to generate report:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-200"
      case "good":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "average":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "below_average":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "needs_improvement":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "stable":
        return <Target className="h-4 w-4 text-blue-600" />
      default:
        return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredStudents = studentPerformances.filter((student) => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = !selectedClass || student.class.toLowerCase().includes(selectedClass.toLowerCase())
    const matchesSubsystem = selectedSubsystem === "all" || student.subsystem === selectedSubsystem
    const matchesSubject = !selectedSubject || student.subjects.some(s => s.subject === selectedSubject)
    
    return matchesSearch && matchesClass && matchesSubsystem && matchesSubject
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Academic Performance Report</h1>
          <p className="text-muted-foreground">Generate comprehensive academic performance reports and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleGenerateReport} disabled={isGenerating || !selectedClass || !selectedTerm}>
            <FileText className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>Select criteria to generate the academic performance report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Class/Form *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.value} value={cls.value}>
                      {cls.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Academic Term *</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.value} value={term.value}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subsystem">Sub-system</Label>
              <Select value={selectedSubsystem} onValueChange={setSelectedSubsystem}>
                <SelectTrigger>
                  <SelectValue placeholder="All sub-systems" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sub-systems</SelectItem>
                  {subsystems.map((sys) => (
                    <SelectItem key={sys.value} value={sys.value}>
                      {sys.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Report Format</Label>
              <Select value={reportFormat} onValueChange={(value: "pdf" | "excel") => setReportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      {performanceData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.averageScore.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Class average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.passRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Students passing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Excellent Students</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceData.excellentCount}</div>
              <p className="text-xs text-muted-foreground">90% and above</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student Performance
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subject Analysis
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends & Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>Breakdown of students by performance level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Excellent (90%+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{performanceData?.excellentCount}</span>
                      <span className="text-sm text-muted-foreground">
                        ({((performanceData?.excellentCount || 0) / (performanceData?.totalStudents || 1) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={(performanceData?.excellentCount || 0) / (performanceData?.totalStudents || 1) * 100} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Good (80-89%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{performanceData?.goodCount}</span>
                      <span className="text-sm text-muted-foreground">
                        ({((performanceData?.goodCount || 0) / (performanceData?.totalStudents || 1) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={(performanceData?.goodCount || 0) / (performanceData?.totalStudents || 1) * 100} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Average (70-79%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{performanceData?.averageCount}</span>
                      <span className="text-sm text-muted-foreground">
                        ({((performanceData?.averageCount || 0) / (performanceData?.totalStudents || 1) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={(performanceData?.averageCount || 0) / (performanceData?.totalStudents || 1) * 100} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Below Average (60-69%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{performanceData?.belowAverageCount}</span>
                      <span className="text-sm text-muted-foreground">
                        ({((performanceData?.belowAverageCount || 0) / (performanceData?.totalStudents || 1) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={(performanceData?.belowAverageCount || 0) / (performanceData?.totalStudents || 1) * 100} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Needs Improvement (&lt;60%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{performanceData?.needsImprovementCount}</span>
                      <span className="text-sm text-muted-foreground">
                        ({((performanceData?.needsImprovementCount || 0) / (performanceData?.totalStudents || 1) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={(performanceData?.needsImprovementCount || 0) / (performanceData?.totalStudents || 1) * 100} />
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Students with the highest overall performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockStudentPerformances.slice(0, 5).map((student, index) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-sm text-muted-foreground">{student.studentId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{student.overallAverage.toFixed(1)}%</p>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Student Performance Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Performance Details</CardTitle>
                  <CardDescription>Individual student performance analysis</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Overall Average</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Improvement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">#{student.rank}</span>
                          {student.rank <= 3 && (
                            <Award className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-sm text-muted-foreground">{student.studentId}</p>
                        </div>
                      </TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{student.overallAverage.toFixed(1)}%</span>
                          <Progress value={student.overallAverage} className="w-16" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{student.attendanceRate.toFixed(1)}%</span>
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {student.improvement > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm ${student.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {student.improvement > 0 ? '+' : ''}{student.improvement.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student)
                            setShowStudentDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subject Analysis Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance Analysis</CardTitle>
              <CardDescription>Detailed analysis of performance by subject</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Average Score</TableHead>
                    <TableHead>Pass Rate</TableHead>
                    <TableHead>Highest Score</TableHead>
                    <TableHead>Lowest Score</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData?.subjects.map((subject) => (
                    <TableRow key={subject.subject}>
                      <TableCell className="font-medium">{subject.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{subject.average.toFixed(1)}%</span>
                          <Progress value={subject.average} className="w-16" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={subject.passRate >= 90 ? "default" : subject.passRate >= 80 ? "secondary" : "outline"}>
                          {subject.passRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-green-600 font-bold">{subject.highest}%</TableCell>
                      <TableCell className="text-red-600 font-bold">{subject.lowest}%</TableCell>
                      <TableCell>{subject.totalStudents}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {subject.average >= 85 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : subject.average >= 75 ? (
                            <Target className="h-4 w-4 text-blue-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {subject.average >= 85 ? 'Excellent' : subject.average >= 75 ? 'Good' : 'Needs Attention'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends & Insights Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Academic performance trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Improvement</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">+4.2%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Attendance Rate</span>
                    <div className="flex items-center gap-1 text-blue-600">
                      <UserCheck className="h-4 w-4" />
                      <span className="font-medium">96.8%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Subject Mastery</span>
                    <div className="flex items-center gap-1 text-green-600">
                      <Award className="h-4 w-4" />
                      <span className="font-medium">85%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Important observations and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Strong Performance in Sciences</p>
                      <p className="text-sm text-green-700">Students show excellent performance in Mathematics and Physics</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Attendance Improvement</p>
                      <p className="text-sm text-blue-700">Class attendance has improved by 3.2% this term</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Areas for Focus</p>
                      <p className="text-sm text-yellow-700">Consider additional support for students in English</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Student Details Dialog */}
      <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Performance Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Student Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    {selectedStudent.studentName}
                  </CardTitle>
                  <CardDescription>ID: {selectedStudent.studentId} | Class: {selectedStudent.class}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Overall Average</p>
                      <p className="text-2xl font-bold">{selectedStudent.overallAverage.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rank</p>
                      <p className="text-2xl font-bold">#{selectedStudent.rank}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Attendance</p>
                      <p className="text-2xl font-bold">{selectedStudent.attendanceRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Improvement</p>
                      <p className="text-2xl font-bold text-green-600">+{selectedStudent.improvement.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subject Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Average</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Rank</TableHead>
                        <TableHead>Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStudent.subjects.map((subject) => (
                        <TableRow key={subject.subject}>
                          <TableCell className="font-medium">{subject.subject}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{subject.average}%</span>
                              <Progress value={subject.average} className="w-16" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={subject.grade === 'A' ? 'default' : subject.grade === 'B' ? 'secondary' : 'outline'}>
                              {subject.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>#{subject.rank}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getTrendIcon(subject.trend)}
                              <span className="text-sm capitalize">{subject.trend}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
