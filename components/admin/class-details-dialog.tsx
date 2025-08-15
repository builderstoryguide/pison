"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, GraduationCap, Calendar, BookOpen, Settings, UserPlus, UserMinus, Edit, Trash2 } from "lucide-react"
import { useClassManagement, type ClassData } from "@/lib/class-management-context"

interface ClassDetailsDialogProps {
  classData: ClassData
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (classData: ClassData) => void
  onDelete: (classId: string) => void
}

export function ClassDetailsDialog({ classData, open, onOpenChange, onEdit, onDelete }: ClassDetailsDialogProps) {
  const { getClassStudents } = useClassManagement()
  const [activeTab, setActiveTab] = useState("overview")

  const students = getClassStudents(classData.id)
  const utilizationPercentage = Math.round((classData.currentEnrollment / classData.capacity) * 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{classData.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {classData.level} • {classData.subsystem === "english" ? "English" : "French"} Subsystem •{" "}
                {classData.branch}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={classData.status === "active" ? "default" : "secondary"}>{classData.status}</Badge>
              <Button variant="outline" size="sm" onClick={() => onEdit(classData)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(classData.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrollment</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {classData.currentEnrollment}/{classData.capacity}
                  </div>
                  <p className="text-xs text-muted-foreground">{utilizationPercentage}% capacity</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Class Teacher</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">{classData.classTeacher}</div>
                  <p className="text-xs text-muted-foreground">Primary instructor</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classData.subjects.length}</div>
                  <p className="text-xs text-muted-foreground">Total subjects</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Academic Year</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">{classData.academicYear}</div>
                  <p className="text-xs text-muted-foreground">Current session</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Class Information</CardTitle>
                <CardDescription>Detailed information about this class</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">System Configuration</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subsystem:</span>
                        <span className="capitalize">{classData.subsystem}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Branch:</span>
                        <span className="capitalize">{classData.branch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Level:</span>
                        <span>{classData.level}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Class Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{classData.createdAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span>{classData.updatedAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={classData.status === "active" ? "default" : "secondary"}>
                          {classData.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Class Students</h3>
                <p className="text-sm text-muted-foreground">{classData.currentEnrollment} students enrolled</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
                <Button variant="outline" size="sm">
                  <UserMinus className="h-4 w-4 mr-2" />
                  Remove Student
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No students enrolled</h3>
                    <p className="text-muted-foreground mb-4">This class doesn't have any students enrolled yet.</p>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Student
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Student list would go here */}
                    <p className="text-muted-foreground">Student management interface would be implemented here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Class Schedule</h3>
                <p className="text-sm text-muted-foreground">Weekly timetable for this class</p>
              </div>
              <Button size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Edit Schedule
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                {classData.schedule.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No schedule configured</h3>
                    <p className="text-muted-foreground mb-4">Set up the weekly schedule for this class.</p>
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classData.schedule.map((day, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{day.day}</h4>
                        <div className="space-y-2">
                          {day.periods.map((period, periodIndex) => (
                            <div key={periodIndex} className="flex items-center justify-between text-sm">
                              <span className="font-medium">{period.time}</span>
                              <span>{period.subject}</span>
                              <span className="text-muted-foreground">{period.teacher}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Class Subjects</h3>
                <p className="text-sm text-muted-foreground">
                  {classData.subjects.length} subjects assigned to this class
                </p>
              </div>
              <Button size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Subjects
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {classData.subjects.map((subject, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{subject}</span>
                      </div>
                      <Badge variant="outline">Active</Badge>
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
