'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Users, BookOpen, Calculator, FileText, CheckCircle } from 'lucide-react'
import type { 
  BranchAssessmentWithDetails,
  BranchGradeWithDetails,
  CreateBranchAssessmentRequest,
  GradeBranchAssessmentRequest
} from '@/lib/subject-branches-types'

interface TeacherBranchAssignment {
  id: string
  teacher_id: string
  branch_id: string
  class_id: string
  branch: {
    id: string
    branch_name: string
    branch_code: string
    subject_id: string
  }
  subject: {
    id: string
    subject_name: string
    subject_code: string
  }
  class: {
    id: string
    class_name: string
    class_level: string
  }
  is_primary_teacher: boolean
}

interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  email: string
}

export default function BranchAssessments() {
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()
  
  // State management
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherBranchAssignment[]>([])
  const [assessments, setAssessments] = useState<BranchAssessmentWithDetails[]>([])
  const [grades, setGrades] = useState<BranchGradeWithDetails[]>([])
  const [students, setStudents] = useState<Student[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [assessmentsLoading, setAssessmentsLoading] = useState(false)
  const [gradesLoading, setGradesLoading] = useState(false)
  
  // Dialog states
  const [createAssessmentOpen, setCreateAssessmentOpen] = useState(false)
  const [gradeAssessmentOpen, setGradeAssessmentOpen] = useState(false)
  
  // Selected items
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [selectedAssessment, setSelectedAssessment] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  
  // Form states
  const [assessmentForm, setAssessmentForm] = useState<CreateBranchAssessmentRequest>({
    branch_id: '',
    teacher_id: '',
    class_id: '',
    title: '',
    description: '',
    type: 'quiz',
    total_marks: 100,
    passing_marks: 50,
    weight_percentage: 100,
    assessment_date: new Date().toISOString().split('T')[0],
    due_date: '',
    academic_year: '2024-2025',
    term: 'Term 1'
  })
  
  const [gradeForm, setGradeForm] = useState<GradeBranchAssessmentRequest>({
    assessment_id: '',
    student_id: '',
    teacher_id: '',
    marks_obtained: 0,
    remarks: '',
    feedback: '',
    is_late: false,
    is_absent: false,
    is_excused: false
  })

  // Load initial data
  useEffect(() => {
    loadTeacherAssignments()
  }, [])

  // Load assessments when assignment changes
  useEffect(() => {
    if (selectedAssignment) {
      loadAssessments()
    }
  }, [selectedAssignment])

  // Load grades when assessment changes
  useEffect(() => {
    if (selectedAssessment) {
      loadGrades()
      loadStudents()
    }
  }, [selectedAssessment])

  const loadTeacherAssignments = async () => {
    try {
      setLoading(true)
      // In a real app, you'd get the current teacher ID from auth context
      const teacherId = 'current-teacher-id' // This should come from auth
      
      const response = await fetch(`/api/teacher-branch-assignments?teacherId=${teacherId}`)
      const data = await response.json()
      
      if (data.success) {
        setTeacherAssignments(data.assignments || [])
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load teacher assignments',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading teacher assignments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load teacher assignments',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAssessments = async () => {
    if (!selectedAssignment) return
    
    try {
      setAssessmentsLoading(true)
      const assignment = teacherAssignments.find(a => a.id === selectedAssignment)
      if (!assignment) return
      
      const response = await fetch(
        `/api/branch-assessments?branchId=${assignment.branch_id}&classId=${assignment.class_id}&teacherId=${assignment.teacher_id}`
      )
      const data = await response.json()
      
      if (data.success) {
        setAssessments(data.assessments || [])
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load assessments',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading assessments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load assessments',
        variant: 'destructive'
      })
    } finally {
      setAssessmentsLoading(false)
    }
  }

  const loadGrades = async () => {
    if (!selectedAssessment) return
    
    try {
      setGradesLoading(true)
      const response = await fetch(`/api/branch-grades?assessmentId=${selectedAssessment}`)
      const data = await response.json()
      
      if (data.success) {
        setGrades(data.grades || [])
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load grades',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading grades:', error)
      toast({
        title: 'Error',
        description: 'Failed to load grades',
        variant: 'destructive'
      })
    } finally {
      setGradesLoading(false)
    }
  }

  const loadStudents = async () => {
    if (!selectedAssessment) return
    
    try {
      const assessment = assessments.find(a => a.id === selectedAssessment)
      if (!assessment) return
      
      const response = await fetch(
        `/api/student-branch-enrollments?branchId=${assessment.branch_id}&classId=${assessment.class_id}&enrollmentStatus=enrolled`
      )
      const data = await response.json()
      
      if (data.success) {
        setStudents(data.enrollments?.map((e: any) => e.student) || [])
      }
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  const handleCreateAssessment = async () => {
    try {
      const response = await fetch('/api/branch-assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assessmentForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Assessment created successfully'
        })
        setCreateAssessmentOpen(false)
        setAssessmentForm({
          branch_id: '',
          teacher_id: '',
          class_id: '',
          title: '',
          description: '',
          type: 'quiz',
          total_marks: 100,
          passing_marks: 50,
          weight_percentage: 100,
          assessment_date: new Date().toISOString().split('T')[0],
          due_date: '',
          academic_year: '2024-2025',
          term: 'Term 1'
        })
        loadAssessments()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create assessment',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating assessment:', error)
      toast({
        title: 'Error',
        description: 'Failed to create assessment',
        variant: 'destructive'
      })
    }
  }

  const handleGradeAssessment = async () => {
    try {
      const response = await fetch('/api/branch-grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gradeForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Grade recorded successfully'
        })
        setGradeAssessmentOpen(false)
        setGradeForm({
          assessment_id: '',
          student_id: '',
          teacher_id: '',
          marks_obtained: 0,
          remarks: '',
          feedback: '',
          is_late: false,
          is_absent: false,
          is_excused: false
        })
        loadGrades()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to record grade',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error recording grade:', error)
      toast({
        title: 'Error',
        description: 'Failed to record grade',
        variant: 'destructive'
      })
    }
  }

  const openGradeDialog = (assessment: BranchAssessmentWithDetails) => {
    setSelectedAssessment(assessment.id)
    setGradeForm({
      ...gradeForm,
      assessment_id: assessment.id,
      teacher_id: assessment.teacher.id
    })
    setGradeAssessmentOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branch Assessments</h1>
          <p className="text-muted-foreground">
            Manage assessments and grades for your assigned subject branches
          </p>
        </div>
      </div>

      {/* Assignment Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Assignment</CardTitle>
          <CardDescription>
            Choose a subject branch assignment to manage assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {teacherAssignments.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No branch assignments found. Contact your administrator to get assigned to subject branches.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4">
                {teacherAssignments.map((assignment) => (
                  <Card 
                    key={assignment.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedAssignment === assignment.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedAssignment(assignment.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {assignment.subject.subject_name} - {assignment.branch.branch_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {assignment.class.class_name} ({assignment.class.class_level})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Branch Code: {assignment.branch.branch_code}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={assignment.is_primary_teacher ? "default" : "secondary"}>
                            {assignment.is_primary_teacher ? "Primary Teacher" : "Secondary Teacher"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedAssignment && (
        <Tabs defaultValue="assessments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
          </TabsList>

          {/* Assessments Tab */}
          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Branch Assessments</CardTitle>
                    <CardDescription>
                      Create and manage assessments for the selected branch
                    </CardDescription>
                  </div>
                  <Dialog open={createAssessmentOpen} onOpenChange={setCreateAssessmentOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Assessment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create Branch Assessment</DialogTitle>
                        <DialogDescription>
                          Create a new assessment for the selected branch
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="assessmentTitle">Title</Label>
                          <Input
                            id="assessmentTitle"
                            value={assessmentForm.title}
                            onChange={(e) => setAssessmentForm({...assessmentForm, title: e.target.value})}
                            placeholder="Assessment title"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="assessmentDescription">Description</Label>
                          <Textarea
                            id="assessmentDescription"
                            value={assessmentForm.description}
                            onChange={(e) => setAssessmentForm({...assessmentForm, description: e.target.value})}
                            placeholder="Assessment description..."
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="assessmentType">Type</Label>
                          <Select 
                            value={assessmentForm.type} 
                            onValueChange={(value: any) => setAssessmentForm({...assessmentForm, type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="quiz">Quiz</SelectItem>
                              <SelectItem value="test">Test</SelectItem>
                              <SelectItem value="exam">Exam</SelectItem>
                              <SelectItem value="assignment">Assignment</SelectItem>
                              <SelectItem value="project">Project</SelectItem>
                              <SelectItem value="practical">Practical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="totalMarks">Total Marks</Label>
                            <Input
                              id="totalMarks"
                              type="number"
                              value={assessmentForm.total_marks}
                              onChange={(e) => setAssessmentForm({...assessmentForm, total_marks: Number(e.target.value)})}
                              placeholder="100"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="passingMarks">Passing Marks</Label>
                            <Input
                              id="passingMarks"
                              type="number"
                              value={assessmentForm.passing_marks}
                              onChange={(e) => setAssessmentForm({...assessmentForm, passing_marks: Number(e.target.value)})}
                              placeholder="50"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="assessmentDate">Assessment Date</Label>
                          <Input
                            id="assessmentDate"
                            type="date"
                            value={assessmentForm.assessment_date}
                            onChange={(e) => setAssessmentForm({...assessmentForm, assessment_date: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="dueDate">Due Date (Optional)</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={assessmentForm.due_date}
                            onChange={(e) => setAssessmentForm({...assessmentForm, due_date: e.target.value})}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateAssessmentOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateAssessment}>
                          Create Assessment
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {assessmentsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading assessments...</p>
                  </div>
                ) : assessments.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No assessments found. Create a new assessment to get started.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-4">
                    {assessments.map((assessment) => (
                      <Card key={assessment.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{assessment.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {assessment.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {assessment.type}
                                </Badge>
                                <Badge variant="secondary">
                                  <Calculator className="h-3 w-3 mr-1" />
                                  {assessment.total_marks} marks
                                </Badge>
                                <Badge variant="outline">
                                  {new Date(assessment.assessment_date).toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={assessment.is_graded ? "default" : "secondary"}>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {assessment.grades_count} graded
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => openGradeDialog(assessment)}
                              >
                                Grade
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grades Tab */}
          <TabsContent value="grades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Grades</CardTitle>
                <CardDescription>
                  View and manage grades for assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {gradesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading grades...</p>
                  </div>
                ) : grades.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No grades found. Select an assessment and start grading students.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Assessment</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Graded Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade) => (
                        <TableRow key={grade.id}>
                          <TableCell>
                            {grade.student.first_name} {grade.student.last_name}
                            <br />
                            <span className="text-sm text-muted-foreground">
                              {grade.student.student_id}
                            </span>
                          </TableCell>
                          <TableCell>
                            {grade.assessment.title}
                            <br />
                            <span className="text-sm text-muted-foreground">
                              {grade.assessment.type} - {grade.assessment.total_marks} marks
                            </span>
                          </TableCell>
                          <TableCell>
                            {grade.marks_obtained} / {grade.assessment.total_marks}
                          </TableCell>
                          <TableCell>
                            {grade.percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <Badge variant={grade.percentage >= 50 ? "default" : "destructive"}>
                              {grade.grade_letter}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {grade.is_absent && <Badge variant="outline" className="text-xs">Absent</Badge>}
                              {grade.is_late && <Badge variant="outline" className="text-xs">Late</Badge>}
                              {grade.is_excused && <Badge variant="outline" className="text-xs">Excused</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(grade.graded_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Grade Assessment Dialog */}
      <Dialog open={gradeAssessmentOpen} onOpenChange={setGradeAssessmentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Grade Assessment</DialogTitle>
            <DialogDescription>
              Record grades for students in this assessment
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="gradeStudent">Student</Label>
              <Select 
                value={gradeForm.student_id} 
                onValueChange={(value) => setGradeForm({...gradeForm, student_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.student_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="marksObtained">Marks Obtained</Label>
              <Input
                id="marksObtained"
                type="number"
                value={gradeForm.marks_obtained}
                onChange={(e) => setGradeForm({...gradeForm, marks_obtained: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={gradeForm.remarks}
                onChange={(e) => setGradeForm({...gradeForm, remarks: e.target.value})}
                placeholder="Optional remarks"
              />
            </div>
            
            <div>
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={gradeForm.feedback}
                onChange={(e) => setGradeForm({...gradeForm, feedback: e.target.value})}
                placeholder="Detailed feedback for the student..."
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isAbsent"
                  checked={gradeForm.is_absent}
                  onChange={(e) => setGradeForm({...gradeForm, is_absent: e.target.checked})}
                />
                <Label htmlFor="isAbsent">Student was absent</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isLate"
                  checked={gradeForm.is_late}
                  onChange={(e) => setGradeForm({...gradeForm, is_late: e.target.checked})}
                />
                <Label htmlFor="isLate">Submission was late</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isExcused"
                  checked={gradeForm.is_excused}
                  onChange={(e) => setGradeForm({...gradeForm, is_excused: e.target.checked})}
                />
                <Label htmlFor="isExcused">Excused absence</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeAssessmentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGradeAssessment}>
              Record Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
