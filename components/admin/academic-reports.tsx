"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpenCheck, 
  GraduationCap, 
  Users, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  BarChart3,
  PieChart,
  FileText,
  Target,
  ClipboardList
} from "lucide-react"

interface AcademicReportsProps {
  onNavigate?: (view: string) => void
}

export function AcademicReports({ onNavigate }: AcademicReportsProps = {}) {
  const [selectedPeriod, setSelectedPeriod] = useState("current-term")
  const [selectedClass, setSelectedClass] = useState("all")

  const handleNavigateToMarksTracking = () => {
    if (onNavigate) {
      onNavigate("marks-tracking")
    } else {
      // Fallback: use localStorage and reload
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminCurrentView', 'marks-tracking')
        window.location.reload()
      }
    }
  }

  const reportSections = [
    {
      id: "class-performance",
      title: "Class Performance Reports",
      description: "Comprehensive analysis of class academic performance and progress",
      icon: BookOpenCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      stats: {
        totalClasses: 24,
        averageScore: 78.5,
        change: 5.2,
        period: "vs last term"
      }
    },
    {
      id: "student-progress",
      title: "Student Progress Reports",
      description: "Individual student academic progress and achievement tracking",
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-50",
      stats: {
        totalStudents: 480,
        averageGrade: "B+",
        change: 2.1,
        period: "vs last term"
      }
    },
    {
      id: "subject-analysis",
      title: "Subject Performance Analysis",
      description: "Detailed analysis of subject-wise performance across all classes",
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      stats: {
        totalSubjects: 12,
        topSubject: "Mathematics",
        change: 8.7,
        period: "vs last term"
      }
    },
    {
      id: "teacher-effectiveness",
      title: "Teacher Effectiveness Reports",
      description: "Analysis of teaching effectiveness and student outcomes",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      stats: {
        totalTeachers: 35,
        averageRating: 4.2,
        change: 0.3,
        period: "vs last term"
      }
    },
    {
      id: "examination-results",
      title: "Examination Results Analysis",
      description: "Comprehensive examination results and performance trends",
      icon: FileText,
      color: "text-red-600",
      bgColor: "bg-red-50",
      stats: {
        totalExams: 8,
        passRate: 89.2,
        change: 3.5,
        period: "vs last term"
      }
    },
    {
      id: "marks-tracking",
      title: "Marks Entry Tracking",
      description: "Track marks entry status across teachers, subjects, and classes",
      icon: ClipboardList,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      stats: {
        totalTeachers: 0,
        teachersFilled: 0,
        change: 0,
        period: "current term"
      }
    }
  ]

  const classOptions = [
    { value: "all", label: "All Classes" },
    { value: "grade-1", label: "Grade 1" },
    { value: "grade-2", label: "Grade 2" },
    { value: "grade-3", label: "Grade 3" },
    { value: "grade-4", label: "Grade 4" },
    { value: "grade-5", label: "Grade 5" },
    { value: "grade-6", label: "Grade 6" },
    { value: "grade-7", label: "Grade 7" },
    { value: "grade-8", label: "Grade 8" },
    { value: "grade-9", label: "Grade 9" },
    { value: "grade-10", label: "Grade 10" },
    { value: "grade-11", label: "Grade 11" },
    { value: "grade-12", label: "Grade 12" }
  ]

  const generateReport = (_reportType: string) => {

    // TODO: Implement actual report generation logic
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Academic Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive academic reports and performance analytics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            {classOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="current-term">Current Term</option>
            <option value="last-term">Last Term</option>
            <option value="current-year">Current Academic Year</option>
            <option value="last-year">Last Academic Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          <TabsTrigger value="comparative">Comparative Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportSections.map((section) => (
              <Card key={section.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${section.bgColor}`}>
                      <section.icon className={`h-5 w-5 ${section.color}`} />
                    </div>
                    <Badge variant={section.stats.change >= 0 ? "default" : "destructive"}>
                      {section.stats.change >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(section.stats.change)}%
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      {section.id === "class-performance" && (
                        <p className="text-2xl font-bold">{section.stats.totalClasses} Classes</p>
                      )}
                      {section.id === "student-progress" && (
                        <p className="text-2xl font-bold">{section.stats.totalStudents} Students</p>
                      )}
                      {section.id === "subject-analysis" && (
                        <p className="text-2xl font-bold">{section.stats.totalSubjects} Subjects</p>
                      )}
                      {section.id === "teacher-effectiveness" && (
                        <p className="text-2xl font-bold">{section.stats.totalTeachers} Teachers</p>
                      )}
                      {section.id === "examination-results" && (
                        <p className="text-2xl font-bold">{section.stats.totalExams} Exams</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {section.stats.period}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          if (section.id === "marks-tracking") {
                            handleNavigateToMarksTracking()
                          } else {
                            generateReport(section.id)
                          }
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        {section.id === "marks-tracking" ? "View Tracking" : "View Report"}
                      </Button>
                      {section.id !== "marks-tracking" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => generateReport(section.id)}
                          aria-label={`Export report for ${section.title}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <div className="grid gap-6">
            {reportSections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${section.bgColor}`}>
                        <section.icon className={`h-5 w-5 ${section.color}`} />
                      </div>
                      <div>
                        <CardTitle>{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <PieChart className="h-4 w-4 mr-2" />
                        Chart View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <section.icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Detailed {section.title} will be displayed here</p>
                    <p className="text-sm">Click &quot;View Report&quot; to generate detailed analysis</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Academic Performance Trends</CardTitle>
                <CardDescription>Performance trends across classes and subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Performance trends chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Distribution of grades across all students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Grade distribution chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Comparison</CardTitle>
                <CardDescription>Compare performance across different subjects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Subject comparison chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        <TabsContent value="comparative" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Class Performance Comparison</CardTitle>
                <CardDescription>Compare academic performance across different classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpenCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Class comparison analysis will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Term-over-Term Analysis</CardTitle>
                <CardDescription>Compare current term performance with previous terms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Term comparison analysis will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
