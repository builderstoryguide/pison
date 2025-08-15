"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Filter,
  Download,
  Users,
  GraduationCap,
  DollarSign,
  Calendar,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { useStudentManagement, type Student, type StudentFilters } from "@/lib/student-management-context"
import { StudentEnrollmentForm } from "./student-enrollment-form"
import { EnrollmentSuccessDialog } from "./enrollment-success-dialog"
import { StudentDetailsDialog } from "./student-details-dialog"
import { StudentFeesDialog } from "./student-fees-dialog"

const classes = {
  english: {
    grammar: ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Lower Sixth", "Upper Sixth"],
    technical: ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"],
    commercial: ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"],
  },
  french: {
    grammar: ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"],
    technical: ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"],
    commercial: ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"],
  },
}

export function StudentManagement() {
  const {
    students,
    isLoading,
    error,
    isUsingDatabase,
    filters,
    setFilters,
    loadStudents,
    updateStudent,
    deleteStudent,
    getFilteredStudents,
    getNewStudents,
    getStudentStats,
    updateStudentStatus,
    testDatabaseConnection,
  } = useStudentManagement()

  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)
  const [enrollmentSuccess, setEnrollmentSuccess] = useState<{ studentId: string; parentCode: string } | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentDetails, setShowStudentDetails] = useState(false)
  const [showFeesDialog, setShowFeesDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const stats = getStudentStats()
  const filteredStudents = getFilteredStudents()
  const newStudents = getNewStudents()

  // Filter students by tab
  const getTabStudents = (tab: string) => {
    switch (tab) {
      case "new":
        return newStudents
      case "enrolled":
        return filteredStudents.filter((s) => s.enrollment_status === "enrolled")
      case "pending":
        return filteredStudents.filter((s) => s.enrollment_status === "pending")
      default:
        return filteredStudents
    }
  }

  const tabStudents = getTabStudents(activeTab)

  const handleEnrollmentSuccess = (result: { studentId: string; parentCode: string }) => {
    setEnrollmentSuccess(result)
    setShowEnrollmentForm(false)
    loadStudents() // Refresh the students list
  }

  const handleUpdateFilters = (field: keyof StudentFilters, value: string) => {
    setFilters({ ...filters, [field]: value })
  }

  const handleStatusUpdate = async (studentId: string, newStatus: string) => {
    const success = await updateStudentStatus(studentId, newStatus)
    if (success) {
      loadStudents() // Refresh the list
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      const success = await deleteStudent(studentId)
      if (success) {
        loadStudents() // Refresh the list
      }
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Student ID",
      "Name",
      "Email",
      "Phone",
      "Class",
      "Branch",
      "Subsystem",
      "Enrollment Status",
      "Fees Status",
      "Total Fees",
      "Paid Fees",
      "Enrollment Date",
    ]

    const csvData = tabStudents.map((student) => [
      student.student_id,
      `${student.first_name} ${student.last_name}`,
      student.email,
      student.phone || "",
      student.class || "",
      student.branch || "",
      student.subsystem || "",
      student.enrollment_status,
      student.fees_status,
      student.total_fees || 0,
      student.paid_fees || 0,
      student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : "",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `students-${activeTab}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enrolled":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Enrolled
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "transferred":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Users className="h-3 w-3 mr-1" />
            Transferred
          </Badge>
        )
      case "graduated":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <GraduationCap className="h-3 w-3 mr-1" />
            Graduated
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getFeesBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
      case "pending":
        return <Badge className="bg-red-100 text-red-800">Pending</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  useEffect(() => {
    testDatabaseConnection()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Student Management</h2>
          <p className="text-muted-foreground">Manage student enrollment, records, and information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowEnrollmentForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Enroll Student
          </Button>
        </div>
      </div>

      {/* Database Status */}
      {!isUsingDatabase && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Using local storage. Connect to database for full functionality.</AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.enrolled} enrolled, {stats.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newStudents}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.feesPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.collectedFees.toLocaleString()} XAF of {stats.totalFees.toLocaleString()} XAF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academic Year</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2024-25</div>
            <p className="text-xs text-muted-foreground">Current session</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, ID, or email..."
                  value={filters.search}
                  onChange={(e) => handleUpdateFilters("search", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subsystem">Sub-system</Label>
              <Select value={filters.subsystem} onValueChange={(value) => handleUpdateFilters("subsystem", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All sub-systems" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sub-systems</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Select value={filters.branch} onValueChange={(value) => handleUpdateFilters("branch", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  <SelectItem value="grammar">Grammar</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={filters.class} onValueChange={(value) => handleUpdateFilters("class", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {filters.subsystem &&
                    filters.branch &&
                    classes[filters.subsystem as keyof typeof classes]?.[
                      filters.branch as keyof typeof classes.english
                    ]?.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleUpdateFilters("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feesStatus">Fees Status</Label>
              <Select value={filters.feesStatus} onValueChange={(value) => handleUpdateFilters("feesStatus", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All fees status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All fees status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            {tabStudents.length} student{tabStudents.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                All Students
                {stats.total > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {stats.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="new">
                New Students
                {stats.newStudents > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {stats.newStudents}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="enrolled">
                Enrolled
                {stats.enrolled > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {stats.enrolled}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                {stats.pending > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {stats.pending}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {tabStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No students found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === "all"
                      ? "No students match your current filters."
                      : `No ${activeTab} students found.`}
                  </p>
                  {activeTab === "all" && (
                    <Button onClick={() => setShowEnrollmentForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Enroll First Student
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Fees</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={`/placeholder-xyltx.png?key=70r0a&height=32&width=32`} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(student.first_name, student.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {student.first_name} {student.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">{student.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">{student.student_id}</code>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.class}</div>
                              <div className="text-sm text-muted-foreground capitalize">{student.subsystem} System</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {student.branch}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(student.enrollment_status)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getFeesBadge(student.fees_status)}
                              <div className="text-sm text-muted-foreground">
                                {student.paid_fees?.toLocaleString() || 0} / {student.total_fees?.toLocaleString() || 0}{" "}
                                XAF
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {student.enrollment_date
                                ? new Date(student.enrollment_date).toLocaleDateString()
                                : student.created_at
                                  ? new Date(student.created_at).toLocaleDateString()
                                  : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setShowStudentDetails(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setShowFeesDialog(true)
                                }}
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                              {student.enrollment_status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(student.id, "enrolled")}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Enrollment Form Dialog */}
      <Dialog open={showEnrollmentForm} onOpenChange={setShowEnrollmentForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Enrollment</DialogTitle>
            <DialogDescription>Complete the enrollment process for a new student</DialogDescription>
          </DialogHeader>
          <StudentEnrollmentForm onSuccess={handleEnrollmentSuccess} onCancel={() => setShowEnrollmentForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Enrollment Success Dialog */}
      {enrollmentSuccess && (
        <EnrollmentSuccessDialog
          studentId={enrollmentSuccess.studentId}
          parentCode={enrollmentSuccess.parentCode}
          onClose={() => setEnrollmentSuccess(null)}
        />
      )}

      {/* Student Details Dialog */}
      {selectedStudent && (
        <StudentDetailsDialog
          student={selectedStudent}
          open={showStudentDetails}
          onClose={() => {
            setShowStudentDetails(false)
            setSelectedStudent(null)
          }}
        />
      )}

      {/* Student Fees Dialog */}
      {selectedStudent && (
        <StudentFeesDialog
          student={selectedStudent}
          open={showFeesDialog}
          onClose={() => {
            setShowFeesDialog(false)
            setSelectedStudent(null)
          }}
          onUpdate={() => {
            loadStudents()
            setShowFeesDialog(false)
            setSelectedStudent(null)
          }}
        />
      )}
    </div>
  )
}
