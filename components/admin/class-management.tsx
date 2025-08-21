"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Users,
  GraduationCap,
  School,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { useClassManagement, type ClassData, type ClassFormData } from "@/lib/class-management-context"
import { ClassForm } from "./class-form"
import { ClassDetailsDialog } from "./class-details-dialog"
import { ClassStudentManagement } from "./class-student-management"

export function ClassManagement() {
  const { classes, isLoading, deleteClass } = useClassManagement()
  const [searchTerm, setSearchTerm] = useState("")
  const [subsystemFilter, setSubsystemFilter] = useState<string>("all")
  const [branchFilter, setBranchFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showStudentManagement, setShowStudentManagement] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [successMessage, setSuccessMessage] = useState<{
    type: 'create' | 'update'
    classId: string
    classData: ClassFormData
  } | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])

  // Filter classes based on search and filters
  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.classTeacher.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSubsystem = subsystemFilter === "all" || cls.subsystem === subsystemFilter
    const matchesBranch = branchFilter === "all" || cls.branch === branchFilter
    const matchesStatus = statusFilter === "all" || cls.status === statusFilter

    return matchesSearch && matchesSubsystem && matchesBranch && matchesStatus
  })

  // Pagination logic
  const totalItems = filteredClasses.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedClasses = filteredClasses.slice(startIndex, endIndex)

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, subsystemFilter, branchFilter, statusFilter])

  // Calculate statistics
  const totalClasses = classes.length
  const activeClasses = classes.filter((cls) => cls.status === "active").length
  const totalEnrollment = classes.reduce((sum, cls) => sum + cls.currentEnrollment, 0)
  const totalCapacity = classes.reduce((sum, cls) => sum + cls.capacity, 0)
  const utilizationRate = totalCapacity > 0 ? Math.round((totalEnrollment / totalCapacity) * 100) : 0

  const handleFormSuccess = (result: { classId: string; classData: ClassFormData }) => {
    const type = selectedClass ? 'update' : 'create'
    setSuccessMessage({ type, ...result })
    setShowCreateForm(false)
    setSelectedClass(null)
  }

  const handleViewClass = (classData: ClassData) => {
    setSelectedClass(classData)
    setShowDetailsDialog(true)
  }

  const handleEditClass = (classData: ClassData) => {
    setSelectedClass(classData)
    setShowCreateForm(true)
  }

  const handleDeleteClass = async (classId: string) => {
    if (confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
      await deleteClass(classId)
    }
  }

  const handleManageStudents = (classData: ClassData) => {
    setSelectedClass(classData)
    setShowStudentManagement(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Class Management</h1>
          <p className="text-muted-foreground">Manage classes, assignments, and schedules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">{activeClasses} active classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollment</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollment}</div>
            <p className="text-xs text-muted-foreground">Students across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}</div>
            <p className="text-xs text-muted-foreground">Maximum student capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">Current capacity usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
          <CardDescription>View and manage all classes in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search classes, levels, or teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={subsystemFilter} onValueChange={setSubsystemFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Subsystem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subsystems</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="french">French</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="grammar">Grammar</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Bulk Actions and Pagination Controls */}
          <div className="flex items-center justify-between mb-4">
            {selectedClasses.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedClasses.length} class(es) selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedClasses.length} class(es)?`)) {
                      selectedClasses.forEach(classId => deleteClass(classId))
                      setSelectedClasses([])
                    }
                  }}
                >
                  Delete Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedClasses([])}
                >
                  Clear Selection
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">entries per page</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} classes
            </div>
          </div>

          {/* Classes Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedClasses.length === paginatedClasses.length && paginatedClasses.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClasses(paginatedClasses.map(cls => cls.id))
                        } else {
                          setSelectedClasses([])
                        }
                      }}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Loading classes...
                    </TableCell>
                  </TableRow>
                ) : paginatedClasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      No classes found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClasses.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClasses(prev => [...prev, cls.id])
                            } else {
                              setSelectedClasses(prev => prev.filter(id => id !== cls.id))
                            }
                          }}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{cls.level}</TableCell>
                      <TableCell className="capitalize">{cls.subsystem}</TableCell>
                      <TableCell className="capitalize">{cls.branch}</TableCell>
                      <TableCell>{cls.classTeacher}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>
                            {cls.currentEnrollment}/{cls.capacity}
                          </span>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${Math.min((cls.currentEnrollment / cls.capacity) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{cls.subjects.length}</TableCell>
                      <TableCell>
                        <Badge variant={cls.status === "active" ? "default" : "secondary"}>{cls.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewClass(cls)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClass(cls)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Class
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageStudents(cls)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Manage Students
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteClass(cls.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Class
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Class Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ClassForm 
            onSuccess={handleFormSuccess} 
            onCancel={() => {
              setShowCreateForm(false)
              setSelectedClass(null)
            }}
            editClass={selectedClass}
          />
        </DialogContent>
      </Dialog>

      {/* Class Details Dialog */}
      {selectedClass && (
        <ClassDetailsDialog
          classData={selectedClass}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          onEdit={handleEditClass}
          onDelete={handleDeleteClass}
        />
      )}

      {/* Student Management Dialog */}
      {selectedClass && (
        <ClassStudentManagement
          classData={selectedClass}
          open={showStudentManagement}
          onOpenChange={setShowStudentManagement}
        />
      )}

      {/* Success Message */}
      {successMessage && (
        <Dialog open={!!successMessage} onOpenChange={() => setSuccessMessage(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {successMessage.type === 'create' ? 'Class Created Successfully!' : 'Class Updated Successfully!'}
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <School className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-muted-foreground">
                  {successMessage.classData.name} has been {successMessage.type === 'create' ? 'created' : 'updated'} with ID: {successMessage.classId}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setSuccessMessage(null)}>
                  Close
                </Button>
                {successMessage.type === 'create' && (
                  <Button
                    onClick={() => {
                      setSuccessMessage(null)
                      setShowCreateForm(true)
                    }}
                  >
                    Create Another
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
