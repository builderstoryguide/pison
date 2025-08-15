"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  BarChart3,
  Award,
  AlertCircle,
  Download,
  Edit,
  Trash2,
  UserCheck,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useExamination, type Examination } from "@/lib/examination-context"

interface ExaminationDetailsDialogProps {
  examination: Examination
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ExaminationDetailsDialog({
  examination,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ExaminationDetailsDialogProps) {
  const { generateReport, isLoading } = useExamination()
  const [reportData, setReportData] = useState<any>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "ongoing":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "internal":
        return "bg-purple-100 text-purple-800"
      case "external":
        return "bg-orange-100 text-orange-800"
      case "mock":
        return "bg-cyan-100 text-cyan-800"
      case "continuous_assessment":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const completionRate =
    examination.enrolledStudents > 0 ? (examination.completedStudents / examination.enrolledStudents) * 100 : 0

  const passRate =
    examination.results.length > 0
      ? (examination.results.filter(
          (result) => result.percentage >= (examination.passingMarks / examination.totalMarks) * 100,
        ).length /
          examination.results.length) *
        100
      : 0

  const averageScore =
    examination.results.length > 0
      ? examination.results.reduce((sum, result) => sum + result.percentage, 0) / examination.results.length
      : 0

  const handleGenerateReport = async () => {
    const result = await generateReport(examination.id)
    if (result.success && result.reportData) {
      setReportData(result.reportData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {examination.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(examination.status)}>
                {examination.status.replace("_", " ").toUpperCase()}
              </Badge>
              <Badge className={getTypeColor(examination.type)}>
                {examination.type.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Examination Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(examination.startDate), "PPP")} - {format(new Date(examination.endDate), "PPP")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{examination.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{examination.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{examination.examBoard}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Sub-system</p>
                      <p className="font-medium capitalize">{examination.subsystem}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Branch</p>
                      <p className="font-medium capitalize">{examination.branch}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Level</p>
                      <p className="font-medium">{examination.level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Marks</p>
                      <p className="font-medium">{examination.totalMarks}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Passing Marks</p>
                    <p className="font-medium">
                      {examination.passingMarks} (
                      {((examination.passingMarks / examination.totalMarks) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subjects */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {examination.subjects.map((subject) => (
                    <Badge key={subject} variant="outline">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            {examination.instructions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{examination.instructions}</p>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{examination.enrolledStudents}</div>
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Completed</span>
                      <span>{examination.completedStudents}</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                    <p className="text-xs text-muted-foreground">{completionRate.toFixed(1)}% completion rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Based on {examination.results.length} results</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Students above passing marks</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {examination.results.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Examination Results</CardTitle>
                  <CardDescription>Results for {examination.results.length} students</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examination.results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.studentName}</TableCell>
                          <TableCell>{result.subject}</TableCell>
                          <TableCell>
                            {result.marksObtained}/{result.totalMarks}
                          </TableCell>
                          <TableCell>{result.percentage.toFixed(1)}%</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                result.percentage >= (examination.passingMarks / examination.totalMarks) * 100
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {result.grade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                result.percentage >= (examination.passingMarks / examination.totalMarks) * 100
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {result.percentage >= (examination.passingMarks / examination.totalMarks) * 100
                                ? "Pass"
                                : "Fail"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No results have been recorded for this examination yet.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Performance Analytics</h3>
              <Button onClick={handleGenerateReport} disabled={isLoading}>
                <BarChart3 className="h-4 w-4 mr-2" />
                {isLoading ? "Generating..." : "Generate Report"}
              </Button>
            </div>

            {reportData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Average Score</p>
                        <p className="text-2xl font-bold">{reportData.averageScore.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pass Rate</p>
                        <p className="text-2xl font-bold">{reportData.passRate.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(reportData.completedStudents / reportData.totalStudents) * 100}
                          className="flex-1"
                        />
                        <span className="text-sm">
                          {reportData.completedStudents}/{reportData.totalStudents}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Subject Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.subjectAnalysis.map((subject: any) => (
                        <div key={subject.subject} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{subject.subject}</span>
                            <span>{subject.averageScore.toFixed(1)}%</span>
                          </div>
                          <Progress value={subject.averageScore} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Click "Generate Report" to view detailed analytics for this examination.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Examination Actions</CardTitle>
                <CardDescription>Manage this examination and its data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start bg-transparent" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Examination
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export Results
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Students
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Add Results
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="destructive" className="justify-start" onClick={onDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Examination
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
