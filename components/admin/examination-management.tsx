"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  FileText,
  Calendar,
  Users,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Pagination } from "@/components/ui/pagination"
import { useExamination, type Examination } from "@/lib/examination-context"
import { ExaminationCreationForm } from "./examination-creation-form"
import { ExaminationEditForm } from "./examination-edit-form"
import { ExaminationDetailsDialog } from "./examination-details-dialog"
import { ExaminationSuccessDialog } from "./examination-success-dialog"

export function ExaminationManagement() {
  const { examinations, deleteExamination } = useExamination()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [subsystemFilter, setSubsystemFilter] = useState<string>("all")
  const [showCreationForm, setShowCreationForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedExamination, setSelectedExamination] = useState<Examination | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdExaminationTitle, setCreatedExaminationTitle] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Filter examinations based on search and filters
  const filteredExaminations = examinations.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.examBoard.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || exam.status === statusFilter
    const matchesType = typeFilter === "all" || exam.type === typeFilter
    const matchesSubsystem = subsystemFilter === "all" || exam.subsystem === subsystemFilter

    return matchesSearch && matchesStatus && matchesType && matchesSubsystem
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredExaminations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedExaminations = filteredExaminations.slice(startIndex, endIndex)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  // Calculate statistics
  const totalExaminations = examinations.length
  const scheduledExaminations = examinations.filter((e) => e.status === "scheduled").length
  const ongoingExaminations = examinations.filter((e) => e.status === "ongoing").length
  const totalEnrolledStudents = examinations.reduce((sum, exam) => sum + exam.enrolledStudents, 0)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText className="h-4 w-4" />
      case "scheduled":
        return <Calendar className="h-4 w-4" />
      case "ongoing":
        return <Clock className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

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

  const handleViewDetails = (examination: Examination) => {
    setSelectedExamination(examination)
    setShowDetailsDialog(true)
  }

  const handleEditExamination = (examination: Examination) => {
    setSelectedExamination(examination)
    setShowEditForm(true)
  }

  const handleDeleteExamination = async (id: string) => {
    if (confirm("Are you sure you want to delete this examination? This action cannot be undone.")) {
      await deleteExamination(id)
    }
  }

  const handleCreationSuccess = (result: { examinationId: string }) => {
    setShowCreationForm(false)
    // Get the created examination title
    const createdExam = examinations.find(exam => exam.id === result.examinationId)
    if (createdExam) {
      setCreatedExaminationTitle(createdExam.title)
      setShowSuccessDialog(true)
    }
  }

  const handleEditSuccess = (_result: { examinationId: string }) => {
    setShowEditForm(false)
    setSelectedExamination(null)
    // Optionally show success message
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Examination Management</h2>
          <p className="text-muted-foreground">Manage examinations, schedules, and results</p>
        </div>
        <Button onClick={() => setShowCreationForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Examination
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Examinations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExaminations}</div>
            <p className="text-xs text-muted-foreground">All examination records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledExaminations}</div>
            <p className="text-xs text-muted-foreground">Upcoming examinations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ongoingExaminations}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrolledStudents}</div>
            <p className="text-xs text-muted-foreground">Enrolled across all exams</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Examinations</CardTitle>
          <CardDescription>View and manage all examinations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search examinations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                  <SelectItem value="mock">Mock</SelectItem>
                  <SelectItem value="continuous_assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>

              <Select value={subsystemFilter} onValueChange={setSubsystemFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sub-system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Systems</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Examinations Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Examination</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExaminations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No examinations found</p>
                        <p className="text-sm text-muted-foreground">
                          {searchTerm || statusFilter !== "all" || typeFilter !== "all" || subsystemFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "Create your first examination to get started"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedExaminations.map((examination) => {
                    const completionRate =
                      examination.enrolledStudents > 0
                        ? (examination.completedStudents / examination.enrolledStudents) * 100
                        : 0

                    return (
                      <TableRow key={examination.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{examination.title}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {examination.subsystem.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {examination.branch}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{examination.examBoard}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(examination.type)}>
                            {examination.type.replace("_", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{examination.level}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">
                              {format(new Date(examination.startDate), "MMM dd")} -{" "}
                              {format(new Date(examination.endDate), "MMM dd, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">{examination.duration} minutes</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {examination.completedStudents}/{examination.enrolledStudents}
                            </p>
                            <p className="text-xs text-muted-foreground">{examination.subjects.length} subjects</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Progress value={completionRate} className="h-2" />
                            <p className="text-xs text-muted-foreground">{completionRate.toFixed(0)}% complete</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(examination.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(examination.status)}
                              {examination.status.replace("_", " ").toUpperCase()}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(examination)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditExamination(examination)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="h-4 w-4 mr-2" />
                                Manage Students
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Results
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteExamination(examination.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {filteredExaminations.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredExaminations.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              startIndex={startIndex}
              endIndex={endIndex}
            />
          )}
        </CardContent>
      </Card>

      {/* Examination Creation Form Dialog */}
      <Dialog open={showCreationForm} onOpenChange={setShowCreationForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Examination</DialogTitle>
          </DialogHeader>
          <ExaminationCreationForm onSuccess={handleCreationSuccess} onCancel={() => setShowCreationForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Examination Edit Form Dialog */}
      {selectedExamination && (
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Examination</DialogTitle>
            </DialogHeader>
            <ExaminationEditForm
              examination={selectedExamination}
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEditForm(false)}
            />
          </DialogContent>
        </Dialog>
      )}

             {/* Examination Details Dialog */}
       {selectedExamination && (
         <ExaminationDetailsDialog
           examination={selectedExamination}
           open={showDetailsDialog}
           onOpenChange={setShowDetailsDialog}
           onEdit={() => {
             setShowDetailsDialog(false)
             handleEditExamination(selectedExamination)
           }}
           onDelete={() => {
             setShowDetailsDialog(false)
             handleDeleteExamination(selectedExamination.id)
           }}
         />
       )}

       {/* Success Dialog */}
       <ExaminationSuccessDialog
         open={showSuccessDialog}
         onOpenChange={setShowSuccessDialog}
         examinationTitle={createdExaminationTitle}
         onCreateAnother={() => {
           setShowSuccessDialog(false)
           setShowCreationForm(true)
         }}
         onViewExamination={() => {
           setShowSuccessDialog(false)
           // You can add navigation to the examination details here
         }}
       />
     </div>
   )
 }
