"use client"

import { useState, useEffect } from "react"
import { Users, BookOpen, MapPin, Phone, Mail, User, GraduationCap } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { type TeacherClass, type Student } from "@/lib/teacher-classes-context"

interface ClassDetailsDialogProps {
  classData: TeacherClass
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClassDetailsDialog({ classData, open, onOpenChange }: ClassDetailsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<Student["enrollmentStatus"] | "all">("all")

  // Debug: Log class data when dialog opens
  useEffect(() => {
    if (open) {
      console.log('Class Details Dialog opened for class:', {
        classId: classData.id,
        className: classData.name,
        studentsCount: classData.students?.length || 0,
        students: classData.students,
      })
    }
  }, [open, classData])

  const getFilteredStudents = () => {
    let students = classData.students || []

    // Apply status filter first
    if (statusFilter !== "all") {
      students = students.filter((student) => student.enrollmentStatus === statusFilter)
    }

    // Apply search filter on the already filtered students
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      students = students.filter(
        (student) =>
          student.firstName.toLowerCase().includes(term) ||
          student.lastName.toLowerCase().includes(term) ||
          student.studentId.toLowerCase().includes(term) ||
          student.email.toLowerCase().includes(term)
      )
    }

    return students
  }

  const filteredStudents = getFilteredStudents()
  const enrolledCount = (classData.students || []).filter((s) => s.enrollmentStatus === "enrolled").length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-6">
        <DialogHeader className="pb-4">
          <div>
            <DialogTitle className="text-2xl font-bold">{classData.name}</DialogTitle>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="outline" className="px-2 py-1">{classData.code}</Badge>
              <Badge variant="secondary" className="capitalize px-2 py-1">
                {classData.subsystem}
              </Badge>
              <Badge variant="outline" className="capitalize px-2 py-1">
                {classData.branch}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-2">
            <TabsTrigger value="overview" className="font-medium">Overview</TabsTrigger>
            <TabsTrigger value="students" className="font-medium">Students</TabsTrigger>
            <TabsTrigger value="subjects" className="font-medium">Subjects</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 py-4">
            <div className="flex flex-col gap-6">
              <Card className="shadow-sm w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <div className="p-1 rounded-md bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{enrolledCount}</div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-muted-foreground">of {classData.capacity} capacity</p>
                    <Badge variant="outline" className="ml-2">{Math.round((enrolledCount / classData.capacity) * 100)}%</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                  <div className="p-1 rounded-md bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classData.subjects.length}</div>
                  <p className="text-sm text-muted-foreground mt-2">Active subjects</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm w-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Room</CardTitle>
                  <div className="p-1 rounded-md bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold truncate" title={classData.room}>{classData.room}</div>
                  <p className="text-sm text-muted-foreground mt-2">Primary classroom</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="p-1 rounded-md bg-primary/10">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  Class Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">Basic Details</h4>
                      <dl className="space-y-3">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <dt className="text-sm text-muted-foreground">Level</dt>
                          <dd className="text-sm font-medium">{classData.level}</dd>
                        </div>
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <dt className="text-sm text-muted-foreground">Academic Year</dt>
                          <dd className="text-sm font-medium">{classData.academicYear}</dd>
                        </div>
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <dt className="text-sm text-muted-foreground">Subsystem</dt>
                          <dd className="text-sm font-medium capitalize">{classData.subsystem}</dd>
                        </div>
                        <div className="flex items-center justify-between pb-2">
                          <dt className="text-sm text-muted-foreground">Branch</dt>
                          <dd className="text-sm font-medium capitalize">{classData.branch}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">Enrollment Statistics</h4>
                      <dl className="space-y-3">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <dt className="text-sm text-muted-foreground">Enrolled Students</dt>
                          <dd className="text-sm font-medium">{enrolledCount}</dd>
                        </div>
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <dt className="text-sm text-muted-foreground">Maximum Capacity</dt>
                          <dd className="text-sm font-medium">{classData.capacity}</dd>
                        </div>
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <dt className="text-sm text-muted-foreground">Available Spots</dt>
                          <dd className="text-sm font-medium">
                            <span className={classData.capacity - enrolledCount <= 5 ? "text-destructive" : ""}>
                              {classData.capacity - enrolledCount}
                            </span>
                          </dd>
                        </div>
                        <div className="flex items-center justify-between pb-2">
                          <dt className="text-sm text-muted-foreground">Total Subjects</dt>
                          <dd className="text-sm font-medium">{classData.subjects.length}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search students by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Students ({filteredStudents.length})</CardTitle>
                <CardDescription>
                  {classData.students && classData.students.length > 0 
                    ? `${classData.students.length} total students enrolled in this class`
                    : 'No students enrolled in this class'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!classData.students || classData.students.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Students Enrolled</h3>
                    <p className="text-sm text-muted-foreground">
                      This class doesn't have any students enrolled yet.
                    </p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No students found matching your search criteria.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try adjusting your search term or status filter.
                    </p>
                  </div>
                ) : (
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Parent/Guardian</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={student.photo || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {student.firstName[0]}
                                  {student.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">{student.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.studentId}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {student.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {student.phone}
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {student.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {student.parentName && (
                                <div className="flex items-center gap-1 text-sm">
                                  <User className="h-3 w-3" />
                                  {student.parentName}
                                </div>
                              )}
                              {student.parentPhone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {student.parentPhone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                student.enrollmentStatus === "enrolled"
                                  ? "default"
                                  : student.enrollmentStatus === "pending"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="capitalize"
                            >
                              {student.enrollmentStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6 py-4">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Subjects ({classData.subjects.length})</CardTitle>
                      <CardDescription>Subjects taught in this class</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {classData.subjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No subjects assigned to this class</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {classData.subjects.map((subject) => (
                    <Card key={subject.id} className="shadow-sm border-l-4 border-l-primary/50 w-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-medium line-clamp-2" title={subject.name}>
                            {subject.name}
                          </CardTitle>
                          <Badge variant="outline" className="ml-2 whitespace-nowrap">
                            {subject.code}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Coefficient</span>
                            <Badge variant="secondary">{subject.coefficient}</Badge>
                          </div>
                          {subject.description && (
                            <div className="pt-2 border-t border-border">
                              <h5 className="text-xs font-medium text-muted-foreground mb-1">Description</h5>
                              <p className="text-sm line-clamp-3" title={subject.description}>
                                {subject.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
