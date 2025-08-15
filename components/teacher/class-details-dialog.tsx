"use client"

import { useState } from "react"
import { X, Users, BookOpen, Calendar, MapPin, Phone, Mail, User, GraduationCap } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTeacherClasses, type TeacherClass, type Student } from "@/lib/teacher-classes-context"

interface ClassDetailsDialogProps {
  classData: TeacherClass
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClassDetailsDialog({ classData, open, onOpenChange }: ClassDetailsDialogProps) {
  const { searchStudents, filterStudentsByStatus } = useTeacherClasses()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<Student["enrollmentStatus"] | "all">("all")

  const getFilteredStudents = () => {
    let students = classData.students

    // Apply status filter
    if (statusFilter !== "all") {
      students = filterStudentsByStatus(classData.id, statusFilter)
    }

    // Apply search filter
    if (searchTerm.trim()) {
      students = searchStudents(classData.id, searchTerm)
    }

    return students
  }

  const filteredStudents = getFilteredStudents()
  const enrolledCount = classData.students.filter((s) => s.enrollmentStatus === "enrolled").length
  const capacityPercentage = (enrolledCount / classData.capacity) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{classData.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{classData.code}</Badge>
                <Badge variant="secondary" className="capitalize">
                  {classData.subsystem}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {classData.branch}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{enrolledCount}</div>
                  <p className="text-xs text-muted-foreground">of {classData.capacity} capacity</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classData.subjects.length}</div>
                  <p className="text-xs text-muted-foreground">Active subjects</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Capacity</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{capacityPercentage.toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground">Utilization</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Room</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classData.room}</div>
                  <p className="text-xs text-muted-foreground">Primary classroom</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Class Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Basic Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Level:</span>
                        <span>{classData.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Academic Year:</span>
                        <span>{classData.academicYear}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subsystem:</span>
                        <span className="capitalize">{classData.subsystem}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Branch:</span>
                        <span className="capitalize">{classData.branch}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Enrolled Students:</span>
                        <span>{enrolledCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Maximum Capacity:</span>
                        <span>{classData.capacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available Spots:</span>
                        <span>{classData.capacity - enrolledCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Subjects:</span>
                        <span>{classData.subjects.length}</span>
                      </div>
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
                <CardDescription>Students enrolled in this class</CardDescription>
              </CardHeader>
              <CardContent>
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
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No students found matching your criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subjects ({classData.subjects.length})</CardTitle>
                <CardDescription>Subjects taught in this class</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {classData.subjects.map((subject) => (
                    <Card key={subject.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{subject.name}</CardTitle>
                          <Badge variant="secondary">{subject.code}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Coefficient:</span>
                            <span className="font-medium">{subject.coefficient}</span>
                          </div>
                          {subject.description && (
                            <p className="text-sm text-muted-foreground">{subject.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>Class timetable for the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {classData.schedule.map((day) => (
                    <div key={day.day}>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {day.day}
                      </h4>
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                        {day.periods.map((period, index) => (
                          <Card key={index} className="p-3">
                            <div className="space-y-1">
                              <div className="font-medium text-sm">{period.time}</div>
                              <div className="text-sm text-muted-foreground">{period.subject}</div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {period.room}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
