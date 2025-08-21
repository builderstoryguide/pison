"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, GraduationCap, Calendar, BookOpen, Settings, UserPlus, UserMinus, Edit, Trash2, Clock } from "lucide-react"
import { useClassManagement, type ClassData } from "@/lib/class-management-context"
import { useStudentManagement, type Student } from "@/lib/student-management-context"
import { AddStudentToClassDialog } from "./add-student-to-class-dialog"
import { RemoveStudentFromClassDialog } from "./remove-student-from-class-dialog"
import { ClassScheduleManagement } from "./class-schedule-management"
import { ManageClassSubjectsDialog } from "./manage-class-subjects-dialog"
import { useToast } from "@/hooks/use-toast"

interface ClassDetailsDialogProps {
  classData: ClassData
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (classData: ClassData) => void
  onDelete: (classId: string) => void
}

export function ClassDetailsDialog({ classData, open, onOpenChange, onEdit, onDelete }: ClassDetailsDialogProps) {
  const { getClassStudents, assignStudentToClass, removeStudentFromClass, updateClass, refreshClasses } = useClassManagement()
  const { students: allStudents } = useStudentManagement()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [students, setStudents] = useState<any[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false)
  const [showRemoveStudentDialog, setShowRemoveStudentDialog] = useState(false)
  const [showManageSubjectsDialog, setShowManageSubjectsDialog] = useState(false)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  // Load students when dialog opens
  useEffect(() => {
    if (open) {
      const loadStudents = async () => {
        setIsLoadingStudents(true)
        try {
          const classStudents = await getClassStudents(classData.id)
          setStudents(classStudents)
        } catch (error) {
          console.error("Error loading students:", error)
        } finally {
          setIsLoadingStudents(false)
        }
      }
      loadStudents()
    }
  }, [open, classData.id, getClassStudents])

  // Handle adding students to class
  const handleAddStudents = async (addedStudents: Student[]) => {
    try {
      for (const student of addedStudents) {
        const result = await assignStudentToClass(student.id, classData.id)
        if (!result.success) {
          throw new Error(result.error || "Failed to add student")
        }
      }
      
      // Refresh the class students list
      const updatedStudents = await getClassStudents(classData.id)
      setStudents(updatedStudents)
      
      // Refresh classes to update enrollment count
      await refreshClasses()
      
      toast("Students added successfully", {
        description: `${addedStudents.length} student${addedStudents.length === 1 ? '' : 's'} added to ${classData.name}`,
      })
         } catch (error) {
      toast("Error adding students", {
        description: error instanceof Error ? error.message : "Failed to add students to class",
      })
    }
  }

  // Handle removing students from class
  const handleRemoveStudents = async (removedStudents: Student[]) => {
    try {
      for (const student of removedStudents) {
        const result = await removeStudentFromClass(student.id, classData.id)
        if (!result.success) {
          throw new Error(result.error || "Failed to remove student")
        }
      }
      
      // Refresh the class students list
      const updatedStudents = await getClassStudents(classData.id)
      setStudents(updatedStudents)
      
      // Refresh classes to update enrollment count
      await refreshClasses()
      
      toast("Students removed successfully", {
        description: `${removedStudents.length} student${removedStudents.length === 1 ? '' : 's'} removed from ${classData.name}`,
      })
         } catch (error) {
      toast("Error removing students", {
        description: error instanceof Error ? error.message : "Failed to remove students from class",
      })
    }
  }

  // Handle updating class subjects
  const handleUpdateSubjects = async (updatedSubjects: string[]) => {
    try {
      const result = await updateClass(classData.id, { subjects: updatedSubjects })
      if (!result.success) {
        throw new Error(result.error || "Failed to update subjects")
      }
      
      // Refresh classes to update the subjects
      await refreshClasses()
      
      toast("Subjects updated successfully", {
        description: `Subjects for ${classData.name} have been updated.`,
      })
         } catch (error) {
      toast("Error updating subjects", {
        description: error instanceof Error ? error.message : "Failed to update subjects",
      })
    }
  }
  const utilizationPercentage = Math.round((classData.currentEnrollment / classData.capacity) * 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl break-words">{classData.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1 break-words">
                {classData.level} • {classData.subsystem === "english" ? "English" : "French"} Subsystem •{" "}
                {classData.branch}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                  <div className="text-sm font-medium break-words">{classData.classTeacher}</div>
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
                  <div className="text-sm font-medium break-words">{classData.academicYear}</div>
                  <p className="text-xs text-muted-foreground">Current session</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Schedule</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {classData.schedule.reduce((total, day) => total + day.periods.length, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {classData.schedule.filter(day => day.periods.length > 0).length} day{classData.schedule.filter(day => day.periods.length > 0).length !== 1 ? 's' : ''} scheduled
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Class Information</CardTitle>
                <CardDescription>Detailed information about this class</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">System Configuration</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex-shrink-0">Subsystem:</span>
                        <span className="capitalize text-right ml-2">{classData.subsystem}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex-shrink-0">Branch:</span>
                        <span className="capitalize text-right ml-2">{classData.branch}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex-shrink-0">Level:</span>
                        <span className="text-right ml-2">{classData.level}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Class Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground flex-shrink-0">Created:</span>
                        <span className="text-right ml-2 break-words">{formatDate(classData.createdAt)}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground flex-shrink-0">Last Updated:</span>
                        <span className="text-right ml-2 break-words">{formatDate(classData.updatedAt)}</span>
                      </div>
                      <div className="flex justify-between items-center">
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
                <Button size="sm" onClick={() => setShowAddStudentDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowRemoveStudentDialog(true)}
                  disabled={students.length === 0}
                >
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
                    <Button onClick={() => setShowAddStudentDialog(true)}>
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
              <Button size="sm" onClick={() => setShowScheduleDialog(true)}>
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
                    <Button onClick={() => setShowScheduleDialog(true)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classData.schedule.map((day, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-lg">{day.day}</h4>
                          <Badge variant="secondary">
                            {day.periods.length} period{day.periods.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {day.periods.map((period, periodIndex) => (
                            <div key={periodIndex} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{period.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{period.subject}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">{period.teacher}</span>
                                </div>
                              </div>
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
              <Button size="sm" onClick={() => setShowManageSubjectsDialog(true)}>
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

      {/* Add Student Dialog */}
      <AddStudentToClassDialog
        open={showAddStudentDialog}
        onOpenChange={setShowAddStudentDialog}
        classId={classData.id}
        className={classData.name}
        currentStudents={students.map(s => s.id)}
        onSuccess={handleAddStudents}
      />

      {/* Remove Student Dialog */}
      <RemoveStudentFromClassDialog
        open={showRemoveStudentDialog}
        onOpenChange={setShowRemoveStudentDialog}
        classId={classData.id}
        className={classData.name}
        classStudents={students}
        onSuccess={handleRemoveStudents}
      />

      {/* Manage Subjects Dialog */}
      <ManageClassSubjectsDialog
        open={showManageSubjectsDialog}
        onOpenChange={setShowManageSubjectsDialog}
        classData={classData}
        onSuccess={handleUpdateSubjects}
      />

      {/* Schedule Management Dialog */}
      <ClassScheduleManagement
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        classData={classData}
      />
    </Dialog>
  )
}
