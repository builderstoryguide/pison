"use client"

import { useState } from "react"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { useTeacherManagement } from "@/lib/teacher-management-context"
import { TeacherEnrollmentForm } from "./teacher-enrollment-form"
import { TeacherEnrollmentSuccessDialog } from "./teacher-enrollment-success-dialog"

export function TeacherManagement() {
  const { teachers, isLoading } = useTeacherManagement()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSubsystem, setFilterSubsystem] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null)
  const [showTeacherDetails, setShowTeacherDetails] = useState(false)
  const [teacherEnrollmentSuccess, setTeacherEnrollmentSuccess] = useState<{
    teacherId: string
    teacherName: string
    email: string
    phone: string
    subsystem: string
    subjects: string[]
    classes: string[]
  } | null>(null)

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

  const handleTeacherEnrollmentSuccess = (result: { teacherId: string; teacherData: any }) => {
    setTeacherEnrollmentSuccess({
      teacherId: result.teacherId,
      teacherName:
        `${result.teacherData.title || ""} ${result.teacherData.firstName} ${result.teacherData.lastName}`.trim(),
      email: result.teacherData.email,
      phone: result.teacherData.phone,
      subsystem: result.teacherData.subsystem,
      subjects: result.teacherData.subjects || [],
      classes: result.teacherData.classes || [],
    })
    setShowAddTeacherForm(false)
  }

  const handleViewTeacher = (teacher: any) => {
    setSelectedTeacher(teacher)
    setShowTeacherDetails(true)
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
        <Button onClick={() => setShowAddTeacherForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.filter((t) => t.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">English Subsystem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.filter((t) => t.subsystem === "English").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">French Subsystem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.filter((t) => t.subsystem === "French").length}</div>
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
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="French">French</SelectItem>
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
          </div>

          {/* Teachers Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Teacher ID</TableHead>
                  <TableHead>Subsystem</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
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
                            <Badge key={subject} variant="secondary" className="text-xs">
                              {subject}
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
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Mail className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Phone className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
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
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Teacher
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4">
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
                      <strong>Phone:</strong> {selectedTeacher.phone}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedTeacher.email}
                    </p>
                    <p>
                      <strong>Address:</strong> {selectedTeacher.address}
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
                      <strong>Department:</strong> {selectedTeacher.department}
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
                  {selectedTeacher.classes.map((cls: string) => (
                    <Badge key={cls} variant="outline">
                      {cls}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Teacher Enrollment Success Dialog */}
      {teacherEnrollmentSuccess && (
        <TeacherEnrollmentSuccessDialog
          teacherId={teacherEnrollmentSuccess.teacherId}
          teacherName={teacherEnrollmentSuccess.teacherName}
          email={teacherEnrollmentSuccess.email}
          phone={teacherEnrollmentSuccess.phone}
          subsystem={teacherEnrollmentSuccess.subsystem}
          subjects={teacherEnrollmentSuccess.subjects}
          classes={teacherEnrollmentSuccess.classes}
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
      )}
    </div>
  )
}
