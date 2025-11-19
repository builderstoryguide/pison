"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Users,
  GraduationCap,
  DollarSign,
  Calendar,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Pagination } from "@/components/ui/pagination"
import { Checkbox } from "@/components/ui/checkbox"
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

import { useStudentManagement, type Student, type StudentFilters } from "@/lib/student-management-context"
import { useUserManagement } from "@/lib/user-management-context"
import { useToast } from "@/hooks/use-toast"
import { getStudentClassName } from "@/lib/utils"
import { StudentEnrollmentForm } from "./student-enrollment-form"
import { EnrollmentSuccessDialog } from "./enrollment-success-dialog"
import { StudentDetailsDialog } from "./student-details-dialog"
import { StudentFeesDialog } from "./student-fees-dialog"
import { EditStudentForm } from "./edit-student-form"
import { ShimmerStatsCards, ShimmerDataTable } from "@/components/ui/shimmer-loading"
import { StudentBulkUpload } from "./student-bulk-upload"

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
    clearFilters,
    loadStudents,
    updateStudent,
    deleteStudent,
    deleteStudentsBulk,
    getFilteredStudents,
    getNewStudents,
    getStudentStats,
    updateStudentStatus,
    testDatabaseConnection,
  } = useStudentManagement()

  const { users } = useUserManagement()
  const { success, error: showError } = useToast()

  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [enrollmentSuccess, setEnrollmentSuccess] = useState<{ 
    studentId: string; 
    parentCode: string; 
    studentName: string;
    studentPassword?: string;
    parentPassword?: string;
    studentEmail?: string;
    parentEmail?: string;
    className?: string;
  } | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentDetails, setShowStudentDetails] = useState(false)
  const [showFeesDialog, setShowFeesDialog] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null)
  
  // Bulk selection state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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

  // Pagination logic
  const tabStudents = getTabStudents(activeTab)
  const totalPages = Math.ceil(tabStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStudents = tabStudents.slice(startIndex, endIndex)



  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  // Clear selection when tab changes or filters are applied
  useEffect(() => {
    setSelectedStudents([])
  }, [activeTab, filters])

  const handleEnrollmentSuccess = (result: { 
    studentId: string; 
    parentCode: string; 
    studentName: string;
    studentPassword?: string;
    parentPassword?: string;
    studentEmail?: string;
    parentEmail?: string;
    className?: string;
  }) => {
    setEnrollmentSuccess(result)
    setShowEnrollmentForm(false)
    loadStudents() // Refresh the students list
    success("Student enrolled successfully", `${result.studentName} has been successfully enrolled in the system.`)
  }

  const handleUpdateFilters = (field: keyof StudentFilters, value: string) => {
    setFilters({ ...filters, [field]: value })
  }

  const handleStatusUpdate = async (studentId: string, newStatus: string) => {
    const student = students.find(s => s.id === studentId)
    const studentName = student ? `${student.first_name} ${student.last_name}` : "Student"
    
    const updateSuccess = await updateStudentStatus(studentId, newStatus)
    if (updateSuccess) {
      loadStudents() // Refresh the list
      success("Status updated successfully", `${studentName}'s enrollment status has been updated to ${newStatus}.`)
    } else {
      showError("Failed to update status", "There was an error updating the student's status. Please try again.")
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    // Find the student to get their name for the confirmation dialog
    const student = students.find(s => s.id === studentId)
    if (!student) {
      showError("Student not found", "The student you're trying to delete could not be found.")
      return
    }

    // The actual deletion will be handled by the AlertDialog
    setStudentToDelete({ id: studentId, name: `${student.first_name} ${student.last_name}` })
  }

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return

    try {
      const deleteSuccess = await deleteStudent(studentToDelete.id)
      if (deleteSuccess) {
        success("Student deleted successfully", `${studentToDelete.name} has been permanently removed from the system.`)
        loadStudents() // Refresh the list
      } else {
        showError("Failed to delete student", "There was an error deleting the student. Please try again.")
      }
    } catch (err) {
      showError("Error deleting student", "An unexpected error occurred while deleting the student.")
    } finally {
      setStudentToDelete(null)
    }
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setShowEditForm(true)
    setShowStudentDetails(false)
  }

  const handleSaveStudent = async (updatedData: Partial<Student>) => {
    if (!selectedStudent) return false
    
    const updateSuccess = await updateStudent(selectedStudent.id, updatedData)
    if (updateSuccess) {
      // Close the form first
      setShowEditForm(false)
      setSelectedStudent(null)
      
      // Show success message
      success("Student updated successfully", `${selectedStudent.first_name} ${selectedStudent.last_name}'s information has been updated.`)
      
      // Refresh the list after a short delay to ensure database update has propagated
      setTimeout(() => {
        loadStudents()
      }, 300)
      
      return true
    } else {
      showError("Failed to update student", "There was an error updating the student's information. Please try again.")
      return false
    }
  }

  // Bulk selection handlers
  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId])
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(paginatedStudents.map(student => student.id))
    } else {
      setSelectedStudents([])
    }
  }

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) {
      showError("No students selected", "Please select at least one student to delete.")
      return
    }

    setIsBulkDeleting(true)
    try {
      const result = await deleteStudentsBulk(selectedStudents)
      if (result.success) {
        success("Bulk delete successful", `${result.deletedCount} student${result.deletedCount === 1 ? '' : 's'} have been permanently deleted from the system.`)
        setSelectedStudents([])
        loadStudents() // Refresh the list
      } else {
        showError("Bulk delete failed", result.errors.join(", "))
      }
    } catch (err) {
      showError("Error during bulk delete", "An unexpected error occurred while deleting the students.")
    } finally {
      setIsBulkDeleting(false)
      setShowBulkDeleteDialog(false)
    }
  }

  const clearSelection = () => {
    setSelectedStudents([])
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



  useEffect(() => {
    testDatabaseConnection()
  }, [])

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.getElementById('search') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Student Management</h2>
            <p className="text-muted-foreground">
              Manage student enrollment, information, and academic records
            </p>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
            <div className="h-10 w-28 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        {/* Statistics Cards */}
        <ShimmerStatsCards />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter students by class, status, and other criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-10 flex-1 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* Student Table */}
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>View and manage all students in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <ShimmerDataTable rows={10} columns={8} />
          </CardContent>
        </Card>
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
          <Button variant="outline" onClick={() => loadStudents()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => console.log('Students state:', students)}>
            Debug Log
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={() => setShowEnrollmentForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Enroll Student
          </Button>
        </div>
      </div>

      {/* Database Status */}
      {!isUsingDatabase && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Database connection is required for student management. Please check your database configuration.</AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Debug Information */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Debug Info:</strong> Students: {students.length} | 
          Filtered: {filteredStudents.length} | 
          Tab: {activeTab} | 
          Tab Students: {tabStudents.length} | 
          Paginated: {paginatedStudents.length} | 
          Page: {currentPage}/{totalPages} | 
          Database: {isUsingDatabase ? 'Yes' : 'No'}
        </AlertDescription>
      </Alert>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              {students.filter(s => s.status === 'active').length} active, {students.filter(s => s.status === 'inactive').length} inactive
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
                              {stats.collectedFees.toLocaleString()} XOF of {stats.totalFees.toLocaleString()} XOF
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              Clear All Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, ID, email, phone, address... (Ctrl+K)"
                  value={filters.search}
                  onChange={(e) => handleUpdateFilters("search", e.target.value)}
                  className="pl-8"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleUpdateFilters("search", "")
                    }
                  }}
                />
                {filters.search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => handleUpdateFilters("search", "")}
                  >
                    ×
                  </Button>
                )}
              </div>
              {filters.search && (
                <p className="text-xs text-muted-foreground">
                  Searching in: name, ID, email, phone, address, city, region, nationality, previous school
                </p>
              )}
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
          
          {/* Quick Filters */}
          <div className="mt-4 pt-4 border-t">
            <Label className="text-sm font-medium mb-2 block">Quick Filters:</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, status: "enrolled", feesStatus: "paid" })}
                className="text-xs"
              >
                Fully Enrolled & Paid
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, feesStatus: "pending" })}
                className="text-xs"
              >
                Pending Fees
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, status: "pending" })}
                className="text-xs"
              >
                Pending Enrollment
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, feesStatus: "overdue" })}
                className="text-xs"
              >
                Overdue Fees
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-800">
                  {selectedStudents.length} student{selectedStudents.length === 1 ? '' : 's'} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="text-orange-700 border-orange-300 hover:bg-orange-100"
                >
                  Clear Selection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                {tabStudents.length} student{tabStudents.length !== 1 ? "s" : ""} found
                {filters.search && (
                  <span className="ml-2 text-blue-600">
                    • Searching for "{filters.search}"
                  </span>
                )}
              </CardDescription>
            </div>
            {filters.search && (
              <Badge variant="outline" className="text-xs">
                Search Results
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                All Students
                {students.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {students.length}
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
              {/* Search Results Summary */}
              {(filters.search || filters.subsystem !== "all" || filters.branch !== "all" || filters.class !== "all" || filters.status !== "all" || filters.feesStatus !== "all") && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-medium mb-1">Active Filters:</p>
                  <div className="flex flex-wrap gap-2">
                    {filters.search && (
                      <Badge variant="secondary">Search: "{filters.search}"</Badge>
                    )}
                    {filters.subsystem !== "all" && (
                      <Badge variant="secondary">System: {filters.subsystem}</Badge>
                    )}
                    {filters.branch !== "all" && (
                      <Badge variant="secondary">Branch: {filters.branch}</Badge>
                    )}
                    {filters.class !== "all" && (
                      <Badge variant="secondary">Class: {filters.class}</Badge>
                    )}
                    {filters.status !== "all" && (
                      <Badge variant="secondary">Status: {filters.status}</Badge>
                    )}
                    {filters.feesStatus !== "all" && (
                      <Badge variant="secondary">Fees: {filters.feesStatus}</Badge>
                    )}
                  </div>
                </div>
              )}
              
              {tabStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No students found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filters.search 
                      ? `No students found matching "${filters.search}". Try adjusting your search terms or filters.`
                      : activeTab === "all"
                      ? "No students match your current filters."
                      : `No ${activeTab} students found.`}
                  </p>
                  {filters.search && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                      <p className="font-medium mb-1">Search Tips:</p>
                      <ul className="text-left space-y-1">
                        <li>• Try searching by student name, ID, or email</li>
                        <li>• Check spelling and try partial matches</li>
                        <li>• Clear filters to see all students</li>
                      </ul>
                    </div>
                  )}
                  {activeTab === "all" && !filters.search && (
                    <Button onClick={() => setShowEnrollmentForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Enroll First Student
                    </Button>
                  )}
                  {(filters.search || activeTab !== "all") && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={paginatedStudents.length > 0 && selectedStudents.length === paginatedStudents.length}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all students"
                          />
                        </TableHead>
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
                      {paginatedStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                              aria-label={`Select ${student.first_name} ${student.last_name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <UserAvatar 
                                user={{ 
                                  name: `${student.first_name} ${student.last_name}`,
                                  avatar: null 
                                }} 
                                size="sm" 
                              />
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
                              <div className="font-medium">{getStudentClassName(student) || student.class || 'Not Assigned'}</div>
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
                                XOF
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
                
              {/* Pagination Controls */}
              {tabStudents.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={tabStudents.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  startIndex={startIndex}
                  endIndex={endIndex}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Enrollment Form Dialog */}
      <Dialog open={showEnrollmentForm} onOpenChange={setShowEnrollmentForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enroll New Student</DialogTitle>
            <DialogDescription>
              Complete the enrollment form to add a new student to the system
            </DialogDescription>
          </DialogHeader>
          <StudentEnrollmentForm onSuccess={handleEnrollmentSuccess} onCancel={() => setShowEnrollmentForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Enrollment Success Dialog */}
      {enrollmentSuccess && (
        <Dialog open={!!enrollmentSuccess} onOpenChange={() => setEnrollmentSuccess(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enrollment Successful!</DialogTitle>
              <DialogDescription>
                {enrollmentSuccess.studentName} has been successfully enrolled
              </DialogDescription>
            </DialogHeader>
            <EnrollmentSuccessDialog
              studentId={enrollmentSuccess.studentId}
              parentCode={enrollmentSuccess.parentCode}
              studentName={enrollmentSuccess.studentName}
              studentPassword={enrollmentSuccess.studentPassword}
              parentPassword={enrollmentSuccess.parentPassword}
              studentEmail={enrollmentSuccess.studentEmail}
              parentEmail={enrollmentSuccess.parentEmail}
              className={enrollmentSuccess.className}
              onClose={() => setEnrollmentSuccess(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Student Details Dialog */}
      {selectedStudent && (
        <Dialog open={showStudentDetails} onOpenChange={() => {
          setShowStudentDetails(false)
          setSelectedStudent(null)
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
              <DialogDescription>View detailed information about {selectedStudent.first_name} {selectedStudent.last_name}</DialogDescription>
            </DialogHeader>
            <StudentDetailsDialog
              student={selectedStudent}
              onClose={() => {
                setShowStudentDetails(false)
                setSelectedStudent(null)
              }}
              onEdit={handleEditStudent}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Student Fees Dialog */}
      {selectedStudent && (
        <Dialog open={showFeesDialog} onOpenChange={() => {
          setShowFeesDialog(false)
          setSelectedStudent(null)
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Fees</DialogTitle>
              <DialogDescription>Manage fees for {selectedStudent.first_name} {selectedStudent.last_name}</DialogDescription>
            </DialogHeader>
            <StudentFeesDialog
              student={selectedStudent}
              onClose={() => {
                loadStudents()
                setShowFeesDialog(false)
                setSelectedStudent(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Student Form Dialog */}
      {selectedStudent && (
        <Dialog open={showEditForm} onOpenChange={() => {
          setShowEditForm(false)
          setSelectedStudent(null)
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>
                Update information for {selectedStudent.first_name} {selectedStudent.last_name}
              </DialogDescription>
            </DialogHeader>
            <EditStudentForm
              student={selectedStudent}
              onSave={handleSaveStudent}
              onCancel={() => {
                setShowEditForm(false)
                setSelectedStudent(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Student Upload</DialogTitle>
            <DialogDescription>
              Upload Excel or CSV files to enroll multiple students at once
            </DialogDescription>
          </DialogHeader>
                     <StudentBulkUpload
             onSuccess={() => {
               setShowBulkUpload(false)
               loadStudents()
               success("Bulk upload successful", "Students have been successfully uploaded to the system.")
             }}
             onCancel={() => setShowBulkUpload(false)}
           />
         </DialogContent>
       </Dialog>

       {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Student</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete {studentToDelete?.name}? This action cannot be undone and will permanently remove all their data from the system.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel onClick={() => setStudentToDelete(null)}>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={confirmDeleteStudent}
               className="bg-red-600 hover:bg-red-700"
             >
               Delete Student
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

       {/* Bulk Delete Confirmation Dialog */}
       <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Multiple Students</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete {selectedStudents.length} student{selectedStudents.length === 1 ? '' : 's'}? This action cannot be undone and will permanently remove all their data from the system.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel onClick={() => setShowBulkDeleteDialog(false)}>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleBulkDelete}
               className="bg-red-600 hover:bg-red-700"
               disabled={isBulkDeleting}
             >
               {isBulkDeleting ? "Deleting..." : `Delete ${selectedStudents.length} Student${selectedStudents.length === 1 ? '' : 's'}`}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   )
 }
