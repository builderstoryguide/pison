"use client"

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useClassesForEnrollment } from '@/lib/hooks/use-classes'
import { useClassStudents } from '@/lib/hooks/use-class-students'
import { ClassStudentsDialog } from '@/components/teacher/class-students-dialog'

export default function TestClassStudentIntegration() {
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('english')
  const [selectedBranch, setSelectedBranch] = useState<string>('grammar')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [showStudentsDialog, setShowStudentsDialog] = useState(false)

  // Fetch classes based on selected subsystem and branch
  const { classes: availableClasses, isLoading: classesLoading, error: classesError } = useClassesForEnrollment(
    selectedSubsystem,
    selectedBranch
  )

  // Fetch students for selected class
  const { students, isLoading: studentsLoading, error: studentsError } = useClassStudents(selectedClass)

  const filteredClasses = availableClasses.filter(cls => 
    cls.subsystem === selectedSubsystem && 
    cls.branch === selectedBranch
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Class-Student Integration Test</h1>
        <p className="text-muted-foreground">
          Test the integration between class management and student enrollment
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>Select subsystem and branch to see available classes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subsystem</label>
              <select 
                value={selectedSubsystem} 
                onChange={(e) => {
                  setSelectedSubsystem(e.target.value)
                  setSelectedClass('')
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="english">English</option>
                <option value="french">French</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Branch</label>
              <select 
                value={selectedBranch} 
                onChange={(e) => {
                  setSelectedBranch(e.target.value)
                  setSelectedClass('')
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="grammar">Grammar</option>
                <option value="technical">Technical</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Available Classes</CardTitle>
          <CardDescription>
            Classes for {selectedSubsystem} {selectedBranch}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="ml-2">Loading classes...</span>
            </div>
          ) : classesError ? (
            <div className="text-center py-8">
              <p className="text-destructive">Error: {classesError}</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No classes found for {selectedSubsystem} {selectedBranch}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((cls) => (
                <Card key={cls.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{cls.name}</CardTitle>
                      <Badge variant="outline" className="capitalize">
                        {cls.subsystem}
                      </Badge>
                    </div>
                    <CardDescription>
                      {cls.level} • {cls.branch.charAt(0).toUpperCase() + cls.branch.slice(1)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Students:</span>
                        <span className="font-medium">{cls.currentEnrollment}/{cls.capacity}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Academic Year:</span>
                        <span className="font-medium">{cls.academicYear}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={cls.status === 'active' ? 'default' : 'secondary'}>
                          {cls.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedClass(cls.id)
                          setShowStudentsDialog(true)
                        }}
                      >
                        View Students
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Class Students Preview */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle>Students in Selected Class</CardTitle>
            <CardDescription>
              Preview of students in the selected class
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="ml-2">Loading students...</span>
              </div>
            ) : studentsError ? (
              <div className="text-center py-8">
                <p className="text-destructive">Error: {studentsError}</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No students enrolled in this class</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Found {students.length} students in this class
                </p>
                <div className="grid gap-2">
                  {students.slice(0, 5).map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                        <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
                      </div>
                      <Badge variant="outline">{student.enrollmentStatus}</Badge>
                    </div>
                  ))}
                  {students.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... and {students.length - 5} more students
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Students Dialog */}
      {selectedClass && showStudentsDialog && (
        <ClassStudentsDialog
          classId={selectedClass}
          className={filteredClasses.find(c => c.id === selectedClass)?.name || 'Unknown Class'}
          open={showStudentsDialog}
          onOpenChange={setShowStudentsDialog}
        />
      )}
    </div>
  )
}
