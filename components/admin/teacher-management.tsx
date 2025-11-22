"use client"

import React, { useState, useEffect } from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Download, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTeacherManagement } from "@/lib/teacher-management-context"
import { useUserManagement } from "@/lib/user-management-context"
import { useToast } from "@/hooks/use-toast"
import { TeacherEnrollmentForm } from "./teacher-enrollment-form"
import { TeacherEnrollmentSuccessDialog } from "./teacher-enrollment-success-dialog"
import { EditTeacherForm } from "./edit-teacher-form"
import { TeacherExportForm } from "./teacher-export-form"

export function TeacherManagement() {
  const { teachers, isLoading, deleteTeacher } = useTeacherManagement()
  const { users, createUser } = useUserManagement()
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()
 

  const [searchTerm, setSearchTerm] = useState("")
  const [filterSubsystem, setFilterSubsystem] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null)
  const [showTeacherDetails, setShowTeacherDetails] = useState(false)
  const [showEditTeacherForm, setShowEditTeacherForm] = useState(false)
  const [showExportForm, setShowExportForm] = useState(false)
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([])
  const [teacherEnrollmentSuccess, setTeacherEnrollmentSuccess] = useState<{
    teacherId: string
    teacherName: string
    email: string
    phone: string
    subsystem: string
    subjects: string[]
    classes: string[]
    password: string
  } | null>(null)
  const [teacherToDelete, setTeacherToDelete] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [subjectCodeMap, setSubjectCodeMap] = useState<Map<string, string>>(new Map())

  // Fetch subjects to create name-to-code mapping
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('/api/subjects?is_active=true')
        if (response.ok) {
          const data = await response.json()
          const subjects = Array.isArray(data) ? data : (data.subjects || [])
          
          const codeMap = new Map<string, string>()
          subjects.forEach((subject: any) => {
            if (subject.name && subject.code) {
              codeMap.set(subject.name, subject.code)
            }
          })
          
          setSubjectCodeMap(codeMap)
        }
      } catch (err) {
        console.error('Error fetching subjects for code mapping:', err)
      }
    }
    
    fetchSubjects()
  }, [])

  // Helper function to get subject code from name
  const getSubjectCode = (subjectName: string): string => {
    return subjectCodeMap.get(subjectName) || subjectName.substring(0, 4).toUpperCase()
  }

  // Debug effect for teacher enrollment success - placed after all state declarations
  React.useEffect(() => {
    console.log("🎯 Teacher enrollment success state changed:", teacherEnrollmentSuccess)
  }, [teacherEnrollmentSuccess])

  // Filter teachers based on search term and filters
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSubsystem = filterSubsystem === "all" || teacher.subsystem === filterSubsystem
    const matchesStatus = filterStatus === "all" || teacher.status === filterStatus

    return matchesSearch && matchesSubsystem && matchesStatus
  })

  const handleTeacherEnrollmentSuccess = async (result: { 
    teacherId: string; 
    teacherData: any; 
    password: string;
    userAccountCreated?: boolean;
    userAccountError?: string;
  }) => {
    console.log("🎉 Teacher enrollment success handler called with:", result)
    
    // The API route now handles user account creation, so we don't need to create it again
    // The API returns userAccountCreated and userAccountError to indicate the status
    
    // Always show success dialog first, regardless of user account creation
    setTeacherEnrollmentSuccess({
      teacherId: result.teacherId,
      teacherName:
        `${result.teacherData.title || ""} ${result.teacherData.firstName} ${result.teacherData.lastName}`.trim(),
      email: result.teacherData.email,
      phone: result.teacherData.phone,
      subsystem: result.teacherData.subsystem,
      subjects: result.teacherData.subjects || [],
      classes: result.teacherData.classes || [],
      password: result.password,
    })
    
    setShowAddTeacherForm(false)
    
    // Show appropriate toast based on user account creation status
    if (result.userAccountCreated === false) {
      // User account creation failed - API should have rolled back, but check anyway
      if (result.userAccountError) {
        toastError("Teacher enrollment failed", {
          description: `Could not create login credentials: ${result.userAccountError}. Please try again or contact support.`
        })
      } else {
        toastWarning("Teacher enrolled but user account already exists", {
          description: "The teacher was added to the system, but a user account with this email already exists. Please contact support to link the accounts."
        })
      }
    } else {
      // Success - user account was created successfully
      toastSuccess("Teacher enrolled successfully!", {
        description: `${result.teacherData.firstName} ${result.teacherData.lastName} has been added to the system with login credentials.`
      })
    }
  }

  const handleViewTeacher = (teacher: any) => {
    setSelectedTeacher(teacher)
    setShowTeacherDetails(true)
  }

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher)
    setShowEditTeacherForm(true)
  }

  const handleEditSuccess = async () => {
    setShowEditTeacherForm(false)
    setSelectedTeacher(null)
    
    // The updateTeacher function already calls loadTeachers(), but we can ensure
    // the UI refreshes by updating the refresh key
    setRefreshKey(prev => prev + 1)
    
    toastSuccess("Teacher updated successfully!", {
      description: "The teacher's information has been updated in the database and reflected in their account."
    })
  }

  const handleDeleteTeacher = async (teacher: any) => {
    setTeacherToDelete(teacher)
    setShowDeleteDialog(true)
  }

  const confirmDeleteTeacher = async () => {
    if (!teacherToDelete) return

    setIsDeleting(true)
    try {
      await deleteTeacher(teacherToDelete.id)
      toastSuccess("Teacher deleted successfully!", {
        description: `${teacherToDelete.firstName} ${teacherToDelete.lastName} has been removed from the system.`
      })
      
      // Force a re-render by updating the refresh key
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error("❌ Error deleting teacher:", error)
      toastError("Failed to delete teacher", {
        description: "Please try again or contact support if the problem persists."
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setTeacherToDelete(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teacher Management</h1>
          <p className="text-muted-foreground">Manage teachers and their information</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowExportForm(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => setShowAddTeacherForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
            <p className="text-xs text-muted-foreground">
              {teachers.filter(t => t.status === 'active').length} active, {teachers.filter(t => t.status === 'inactive').length} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.filter(t => t.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              Currently employed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">English Subsystem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.filter(t => t.subsystem === 'english').length}</div>
            <p className="text-xs text-muted-foreground">
              English curriculum
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">French Subsystem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.filter(t => t.subsystem === 'french').length}</div>
            <p className="text-xs text-muted-foreground">
              French curriculum
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Teachers</CardTitle>
          <CardDescription>A list of all teachers in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterSubsystem} onValueChange={setFilterSubsystem}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Subsystem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subsystems</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="french">French</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            {filteredTeachers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTeachers(filteredTeachers.map(t => t.id))
                  setShowExportForm(true)
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Filtered ({filteredTeachers.length})
              </Button>
            )}
          </div>

          {/* Teachers Table */}
          <div className="rounded-md border" key={refreshKey}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Teacher ID</TableHead>
                  <TableHead>Subsystem</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No teachers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.teacherId}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`/placeholder-32px.png?height=32&width=32`} />
                            <AvatarFallback>
                              {teacher.firstName.charAt(0)}
                              {teacher.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {teacher.title} {teacher.firstName} {teacher.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">{teacher.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{teacher.teacherId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{teacher.subsystem}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.slice(0, 2).map((subject: string) => (
                            <Badge key={subject} variant="secondary" className="text-xs" title={subject}>
                              {getSubjectCode(subject)}
                            </Badge>
                          ))}
                          {teacher.subjects.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{teacher.subjects.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(teacher.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewTeacher(teacher)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTeacher(teacher)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Teacher
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedTeacher(teacher)
                              setShowExportForm(true)
                            }}>
                              <Download className="mr-2 h-4 w-4" />
                              Export Data
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteTeacher(teacher)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Teacher
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
        </CardContent>
      </Card>

      {/* Add Teacher Dialog */}
      <Dialog open={showAddTeacherForm} onOpenChange={setShowAddTeacherForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
          </DialogHeader>
          <TeacherEnrollmentForm
            onSuccess={handleTeacherEnrollmentSuccess}
            onCancel={() => setShowAddTeacherForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Teacher Details Dialog */}
      <Dialog open={showTeacherDetails} onOpenChange={setShowTeacherDetails}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2 space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`/placeholder_64px.png?height=64&width=64`} />
                  <AvatarFallback className="text-lg">
                    {selectedTeacher.firstName.charAt(0)}
                    {selectedTeacher.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedTeacher.title} {selectedTeacher.firstName} {selectedTeacher.lastName}
                  </h3>
                  <p className="text-muted-foreground">{selectedTeacher.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{selectedTeacher.subsystem}</Badge>
                    {getStatusBadge(selectedTeacher.status)}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                              <div>
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Phone:</strong> {selectedTeacher.phone || "Not provided"}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedTeacher.email}
                  </p>
                  <p>
                    <strong>Address:</strong> {selectedTeacher.address || "Not provided"}
                  </p>
                  <p>
                    <strong>City:</strong> {selectedTeacher.city || "Not provided"}
                  </p>
                  <p>
                    <strong>Region:</strong> {selectedTeacher.region || "Not provided"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Teaching Information</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Teacher ID:</strong> {selectedTeacher.teacherId}
                  </p>
                  <p>
                    <strong>Subsystem:</strong> {selectedTeacher.subsystem}
                  </p>
                  <p>
                    <strong>Employment Type:</strong> {selectedTeacher.employmentType}
                  </p>
                  <p>
                    <strong>Start Date:</strong> {selectedTeacher.startDate || "Not provided"}
                  </p>
                  <p>
                    <strong>Experience:</strong> {selectedTeacher.experience || "Not provided"}
                  </p>
                </div>
              </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.subjects.map((subject: string) => (
                    <Badge key={subject} variant="secondary">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Classes</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.classes.length > 0 ? (
                    selectedTeacher.classes.map((cls: string) => (
                      <Badge key={cls} variant="outline">
                        {cls}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No classes assigned</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Qualifications</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.qualifications.length > 0 ? (
                    selectedTeacher.qualifications.map((qualification: string) => (
                      <Badge key={qualification} variant="secondary">
                        {qualification}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No qualifications listed</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Emergency Contact</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Name:</strong> {selectedTeacher.emergencyContact?.name || "Not provided"}
                  </p>
                  <p>
                    <strong>Relationship:</strong> {selectedTeacher.emergencyContact?.relationship || "Not provided"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedTeacher.emergencyContact?.phone || "Not provided"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={showEditTeacherForm} onOpenChange={setShowEditTeacherForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <EditTeacherForm
              teacher={selectedTeacher}
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEditTeacherForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Teacher Enrollment Success Dialog */}
      <TeacherEnrollmentSuccessDialog
        open={!!teacherEnrollmentSuccess}
        teacherId={teacherEnrollmentSuccess?.teacherId || ""}
        teacherName={teacherEnrollmentSuccess?.teacherName || ""}
        email={teacherEnrollmentSuccess?.email || ""}
        phone={teacherEnrollmentSuccess?.phone || ""}
        subsystem={teacherEnrollmentSuccess?.subsystem || ""}
        subjects={teacherEnrollmentSuccess?.subjects || []}
        classes={teacherEnrollmentSuccess?.classes || []}
        password={teacherEnrollmentSuccess?.password || ""}
        onClose={() => setTeacherEnrollmentSuccess(null)}
        onViewTeacher={() => {
          setTeacherEnrollmentSuccess(null)
          // Could navigate to teacher details here
        }}
        onEnrollAnother={() => {
          setTeacherEnrollmentSuccess(null)
          setShowAddTeacherForm(true)
        }}
      />

      {/* Export Teacher Data Dialog */}
      <Dialog open={showExportForm} onOpenChange={setShowExportForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Teacher Data</DialogTitle>
          </DialogHeader>
          <TeacherExportForm
            preSelectedTeacher={selectedTeacher}
            preSelectedTeachers={selectedTeachers.length > 0 ? selectedTeachers : undefined}
            onCancel={() => {
              setShowExportForm(false)
              setSelectedTeacher(null)
              setSelectedTeachers([])
            }}
            onSuccess={() => {
              setShowExportForm(false)
              setSelectedTeacher(null)
              setSelectedTeachers([])
              toastSuccess("Teacher data exported successfully!", {
                description: "The teacher data has been exported to your selected format."
              })
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Teacher Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {teacherToDelete?.title} {teacherToDelete?.firstName} {teacherToDelete?.lastName}
              </strong>
              ? This action cannot be undone and will permanently remove the teacher from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTeacher} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Teacher"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
