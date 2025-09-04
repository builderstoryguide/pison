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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-6">
        <DialogHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold break-words">{classData.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-2 break-words">
                {classData.level} • {classData.subsystem === "english" ? "English" : "French"} Subsystem •{" "}
                {classData.branch}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={classData.status === "active" ? "default" : "secondary"} className="px-2.5 py-0.5">
                {classData.status}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => onEdit(classData)} className="h-9">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(classData.id)} className="h-9">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-2">
            <TabsTrigger value="overview" className="font-medium">Overview</TabsTrigger>
            <TabsTrigger value="students" className="font-medium">Students</TabsTrigger>
            <TabsTrigger value="schedule" className="font-medium">Schedule</TabsTrigger>
            <TabsTrigger value="subjects" className="font-medium">Subjects</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 py-4">
            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrollment Status</CardTitle>
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {classData.currentEnrollment}/{classData.capacity}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Students enrolled</p>
                    </div>
                    <Badge 
                      className="ml-2" 
                      variant={utilizationPercentage > 90 ? "destructive" : utilizationPercentage > 75 ? "default" : "outline"}
                    >
                      {utilizationPercentage}% capacity
                    </Badge>
                  </div>
                  <div className="mt-4 w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${utilizationPercentage > 90 ? 'bg-destructive' : utilizationPercentage > 75 ? 'bg-primary' : 'bg-primary/70'}`}
                      style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Class Information</CardTitle>
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Teacher</span>
                    <span className="text-sm font-medium truncate max-w-[180px]" title={classData.classTeacher}>{classData.classTeacher}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Academic Year</span>
                    <span className="text-sm font-medium">{classData.academicYear}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={classData.status === "active" ? "default" : "secondary"}>{classData.status}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resources & Schedule</CardTitle>
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Subjects</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{classData.subjects.length}</span>
                      <Badge variant="outline" className="text-xs">Total</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Schedule</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{classData.schedule.reduce((total, day) => total + day.periods.length, 0)}</span>
                      <Badge variant="outline" className="text-xs">Periods</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-sm text-muted-foreground">Days</span>
                    <span className="text-sm font-medium">{classData.schedule.filter(day => day.periods.length > 0).length} scheduled</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Class Details</CardTitle>
                    <CardDescription>Comprehensive information about this class</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-8 md:grid-cols-2">
                  {/* System Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                      <h4 className="font-medium text-base">System Configuration</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-muted/40 p-3 rounded-md">
                        <span className="text-sm font-medium">Subsystem</span>
                        <Badge variant="secondary" className="capitalize">{classData.subsystem}</Badge>
                      </div>
                      <div className="flex items-center justify-between bg-muted/40 p-3 rounded-md">
                        <span className="text-sm font-medium">Branch</span>
                        <Badge variant="secondary" className="capitalize">{classData.branch}</Badge>
                      </div>
                      <div className="flex items-center justify-between bg-muted/40 p-3 rounded-md">
                        <span className="text-sm font-medium">Level</span>
                        <Badge variant="secondary">{classData.level}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Class Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <h4 className="font-medium text-base">Time Information</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-muted/40 p-3 rounded-md">
                        <span className="text-sm font-medium">Created</span>
                        <div className="text-sm">{formatDate(classData.createdAt)}</div>
                      </div>
                      <div className="flex items-center justify-between bg-muted/40 p-3 rounded-md">
                        <span className="text-sm font-medium">Last Updated</span>
                        <div className="text-sm">{formatDate(classData.updatedAt)}</div>
                      </div>
                      <div className="flex items-center justify-between bg-muted/40 p-3 rounded-md">
                        <span className="text-sm font-medium">Available Spots</span>
                        <Badge variant={classData.capacity - classData.currentEnrollment <= 5 ? "destructive" : "secondary"}>
                          {classData.capacity - classData.currentEnrollment} remaining
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

          <TabsContent value="subjects" className="space-y-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Class Subjects</h3>
                  <p className="text-sm text-muted-foreground">
                    {classData.subjects.length} subject{classData.subjects.length !== 1 ? 's' : ''} assigned to this class
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowManageSubjectsDialog(true)} className="shadow-sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage Subjects
              </Button>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Subject List</CardTitle>
                  <Badge variant="outline">{classData.subjects.length} total</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {classData.subjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-3 rounded-full bg-muted mb-4">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="text-lg font-medium mb-2">No subjects assigned</h4>
                    <p className="text-sm text-muted-foreground max-w-md mb-6">
                      This class doesn't have any subjects assigned yet. Add subjects to create a curriculum for this class.
                    </p>
                    <Button onClick={() => setShowManageSubjectsDialog(true)}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Add Subjects
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {classData.subjects.map((subject, index) => (
                      <div 
                        key={index} 
                        className="flex flex-col bg-card border rounded-lg shadow-sm overflow-hidden hover:border-primary/50 transition-colors"
                      >
                        <div className="bg-muted/30 p-4 border-b">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-primary/10">
                              <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                            </div>
                            <h4 className="font-medium text-sm leading-tight truncate" title={subject}>
                              {subject}
                            </h4>
                          </div>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-muted-foreground">Active</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Core Subject
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {classData.subjects.length > 0 && (
                <div className="border-t p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing all {classData.subjects.length} subjects
                    </p>
                    <Button variant="outline" size="sm" onClick={() => setShowManageSubjectsDialog(true)}>
                      <Settings className="h-3.5 w-3.5 mr-1.5" />
                      Manage
                    </Button>
                  </div>
                </div>
              )}
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
