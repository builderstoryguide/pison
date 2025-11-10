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
import { useClassManagement } from '@/lib/class-management-context'
import { ShimmerSubjectBranchesManagement } from '@/components/ui/shimmer-loading'
import { Plus, Edit, Trash2, Users, BookOpen, GraduationCap, Calculator } from 'lucide-react'
import type { 
  SubjectBranchWithDetails, 
  TeacherBranchAssignmentWithDetails,
  StudentBranchEnrollmentWithDetails,
  CreateSubjectBranchRequest,
  AssignTeacherToBranchRequest,
  EnrollStudentInBranchRequest
} from '@/lib/subject-branches-types'

interface Subject {
  id: string
  subject_name: string
  subject_code: string
  subsystem: string
}

interface Teacher {
  id: string
  teacher_id: string
  first_name: string
  last_name: string
  email: string
}

interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  email: string
}


export default function SubjectBranchesManagement() {
  const { toast } = useToast()
  const { classes: contextClasses, isLoading: classesLoading } = useClassManagement()
  
  // State management
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [branches, setBranches] = useState<SubjectBranchWithDetails[]>([])
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherBranchAssignmentWithDetails[]>([])
  const [studentEnrollments, setStudentEnrollments] = useState<StudentBranchEnrollmentWithDetails[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [branchesLoading, setBranchesLoading] = useState(false)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)
  const [isCreatingBranch, setIsCreatingBranch] = useState(false)
  
  // Dialog states
  const [createBranchOpen, setCreateBranchOpen] = useState(false)
  const [assignTeacherOpen, setAssignTeacherOpen] = useState(false)
  const [enrollStudentOpen, setEnrollStudentOpen] = useState(false)
  
  // Form states
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [academicYear, setAcademicYear] = useState('2024-2025')
  const [term, setTerm] = useState('Term 1')
  
  // Create branch form
  const [branchForm, setBranchForm] = useState<CreateSubjectBranchRequest>({
    subject_id: '',
    branch_name: '',
    branch_code: '',
    description: '',
    weight_percentage: 100,
    is_optional: false,
    academic_year: '2024-2025',
    term: 'Term 1'
  })
  
  // Assign teacher form
  const [teacherForm, setTeacherForm] = useState<AssignTeacherToBranchRequest>({
    teacher_id: '',
    branch_id: '',
    class_id: '',
    academic_year: '2024-2025',
    term: 'Term 1',
    is_primary_teacher: false
  })
  
  // Enroll student form
  const [enrollmentForm, setEnrollmentForm] = useState<EnrollStudentInBranchRequest>({
    student_id: '',
    branch_id: '',
    class_id: '',
    academic_year: '2024-2025',
    term: 'Term 1'
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load branches when subject changes
  useEffect(() => {
    if (selectedSubject) {
      loadBranches()
    }
  }, [selectedSubject, academicYear, term])

  // Load teacher assignments when branch changes
  useEffect(() => {
    if (selectedBranch && selectedClass) {
      loadTeacherAssignments()
    }
  }, [selectedBranch, selectedClass, academicYear, term])

  // Load student enrollments when branch changes
  useEffect(() => {
    if (selectedBranch && selectedClass) {
      loadStudentEnrollments()
    }
  }, [selectedBranch, selectedClass, academicYear, term])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load subjects, teachers, and students in parallel (classes come from context)
      const [subjectsRes, teachersRes, studentsRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/teachers'),
        fetch('/api/students')
      ])
      
      // Check if all responses are ok
      const responses = [subjectsRes, teachersRes, studentsRes]
      const failedResponses = responses.filter(res => !res.ok)
      
      if (failedResponses.length > 0) {
        console.error('Some API calls failed:', failedResponses.map(res => ({ status: res.status, url: res.url })))
        toast({
          title: 'Warning',
          description: 'Some data could not be loaded. Please check your database connection.',
          variant: 'destructive'
        })
      }
      
      // Parse JSON responses safely
      const [subjectsData, teachersData, studentsData] = await Promise.all([
        subjectsRes.ok ? subjectsRes.json().catch(() => ({ success: false, subjects: [] })) : { success: false, subjects: [] },
        teachersRes.ok ? teachersRes.json().catch(() => ({ success: false, teachers: [] })) : { success: false, teachers: [] },
        studentsRes.ok ? studentsRes.json().catch(() => ({ success: false, students: [] })) : { success: false, students: [] }
      ])
      
      if (subjectsData.success) setSubjects(subjectsData.subjects || [])
      if (teachersData.success) setTeachers(teachersData.teachers || [])
      if (studentsData.success) setStudents(studentsData.students || [])
      
    } catch (error) {
      console.error('Error loading initial data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load initial data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadBranches = async () => {
    if (!selectedSubject) return
    
    try {
      setBranchesLoading(true)
      const response = await fetch(
        `/api/subject-branches?subjectId=${selectedSubject}&academicYear=${academicYear}&term=${term}`
      )
      const data = await response.json()
      
      if (data.success) {
        setBranches(data.branches || [])
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load subject branches',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading branches:', error)
      toast({
        title: 'Error',
        description: 'Failed to load subject branches',
        variant: 'destructive'
      })
    } finally {
      setBranchesLoading(false)
    }
  }

  const loadTeacherAssignments = async () => {
    if (!selectedBranch || !selectedClass) return
    
    try {
      setAssignmentsLoading(true)
      const response = await fetch(
        `/api/teacher-branch-assignments?branchId=${selectedBranch}&classId=${selectedClass}&academicYear=${academicYear}&term=${term}`
      )
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
      setAssignmentsLoading(false)
    }
  }

  const loadStudentEnrollments = async () => {
    if (!selectedBranch || !selectedClass) return
    
    try {
      setEnrollmentsLoading(true)
      const response = await fetch(
        `/api/student-branch-enrollments?branchId=${selectedBranch}&classId=${selectedClass}&academicYear=${academicYear}&term=${term}`
      )
      const data = await response.json()
      
      if (data.success) {
        setStudentEnrollments(data.enrollments || [])
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load student enrollments',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading student enrollments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load student enrollments',
        variant: 'destructive'
      })
    } finally {
      setEnrollmentsLoading(false)
    }
  }

  const handleCreateBranch = async () => {
    setIsCreatingBranch(true)
    try {
      const response = await fetch('/api/subject-branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(branchForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: `Subject branch "${branchForm.branch_name}" created successfully`
        })
        setCreateBranchOpen(false)
        setBranchForm({
          subject_id: '',
          branch_name: '',
          branch_code: '',
          description: '',
          weight_percentage: 100,
          is_optional: false,
          academic_year: '2024-2025',
          term: 'Term 1'
        })
        loadBranches()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create subject branch',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating branch:', error)
      toast({
        title: 'Error',
        description: 'Failed to create subject branch',
        variant: 'destructive'
      })
    } finally {
      setIsCreatingBranch(false)
    }
  }

  const handleAssignTeacher = async () => {
    try {
      const response = await fetch('/api/teacher-branch-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(teacherForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Teacher assigned to branch successfully'
        })
        setAssignTeacherOpen(false)
        setTeacherForm({
          teacher_id: '',
          branch_id: '',
          class_id: '',
          academic_year: '2024-2025',
          term: 'Term 1',
          is_primary_teacher: false
        })
        loadTeacherAssignments()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to assign teacher to branch',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error assigning teacher:', error)
      toast({
        title: 'Error',
        description: 'Failed to assign teacher to branch',
        variant: 'destructive'
      })
    }
  }

  const handleEnrollStudent = async () => {
    try {
      const response = await fetch('/api/student-branch-enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enrollmentForm)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Student enrolled in branch successfully'
        })
        setEnrollStudentOpen(false)
        setEnrollmentForm({
          student_id: '',
          branch_id: '',
          class_id: '',
          academic_year: '2024-2025',
          term: 'Term 1'
        })
        loadStudentEnrollments()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to enroll student in branch',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error enrolling student:', error)
      toast({
        title: 'Error',
        description: 'Failed to enroll student in branch',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return <ShimmerSubjectBranchesManagement />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subject Branches Management</h1>
          <p className="text-muted-foreground">
            Manage subject branches, teacher assignments, and student enrollments
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.subject_name} ({subject.subject_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={classesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={classesLoading ? "Loading classes..." : "Select class"} />
                </SelectTrigger>
                <SelectContent>
                  {contextClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2024-2025"
              />
            </div>
            
            <div>
              <Label htmlFor="term">Term</Label>
              <Input
                id="term"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Term 1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="branches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="branches">Subject Branches</TabsTrigger>
          <TabsTrigger value="assignments">Teacher Assignments</TabsTrigger>
          <TabsTrigger value="enrollments">Student Enrollments</TabsTrigger>
        </TabsList>

        {/* Subject Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subject Branches</CardTitle>
                  <CardDescription>
                    Manage branches for the selected subject
                  </CardDescription>
                </div>
                <Dialog open={createBranchOpen} onOpenChange={setCreateBranchOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Branch
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create Subject Branch</DialogTitle>
                      <DialogDescription>
                        Create a new branch for the selected subject
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="branchSubject">Subject</Label>
                        <Select 
                          value={branchForm.subject_id} 
                          onValueChange={(value) => setBranchForm({...branchForm, subject_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.subject_name} ({subject.subject_code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="branchName">Branch Name</Label>
                        <Input
                          id="branchName"
                          value={branchForm.branch_name}
                          onChange={(e) => setBranchForm({...branchForm, branch_name: e.target.value})}
                          placeholder="e.g., Pure Mathematics"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="branchCode">Branch Code</Label>
                        <Input
                          id="branchCode"
                          value={branchForm.branch_code}
                          onChange={(e) => setBranchForm({...branchForm, branch_code: e.target.value})}
                          placeholder="e.g., PURE"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="branchDescription">Description</Label>
                        <Textarea
                          id="branchDescription"
                          value={branchForm.description}
                          onChange={(e) => setBranchForm({...branchForm, description: e.target.value})}
                          placeholder="Branch description..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="weightPercentage">Weight Percentage</Label>
                        <Input
                          id="weightPercentage"
                          type="number"
                          min="0"
                          max="100"
                          value={branchForm.weight_percentage}
                          onChange={(e) => setBranchForm({...branchForm, weight_percentage: Number(e.target.value)})}
                          placeholder="100"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setCreateBranchOpen(false)}
                        disabled={isCreatingBranch}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateBranch}
                        disabled={isCreatingBranch}
                      >
                        {isCreatingBranch ? 'Creating...' : 'Create Branch'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {branchesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading branches...</p>
                </div>
              ) : branches.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No branches found for the selected subject. Create a new branch to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {branches.map((branch) => (
                    <Card key={branch.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{branch.branch_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Code: {branch.branch_code} | Weight: {branch.weight_percentage}%
                            </p>
                            {branch.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {branch.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" />
                              {branch.enrolled_students_count} students
                            </Badge>
                            <Badge variant="outline">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {branch.teachers.length} teachers
                            </Badge>
                            {branch.is_optional && (
                              <Badge variant="outline">Optional</Badge>
                            )}
                          </div>
                        </div>
                        
                        {branch.teachers.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Assigned Teachers:</h4>
                            <div className="flex flex-wrap gap-2">
                              {branch.teachers.map((teacher) => (
                                <Badge key={teacher.id} variant={teacher.is_primary_teacher ? "default" : "secondary"}>
                                  {teacher.first_name} {teacher.last_name}
                                  {teacher.is_primary_teacher && " (Primary)"}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teacher Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Teacher Assignments</CardTitle>
                  <CardDescription>
                    Manage teacher assignments to subject branches
                  </CardDescription>
                </div>
                <Dialog open={assignTeacherOpen} onOpenChange={setAssignTeacherOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedBranch || !selectedClass}>
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Teacher
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Assign Teacher to Branch</DialogTitle>
                      <DialogDescription>
                        Assign a teacher to the selected branch and class
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="assignTeacher">Teacher</Label>
                        <Select 
                          value={teacherForm.teacher_id} 
                          onValueChange={(value) => setTeacherForm({...teacherForm, teacher_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.first_name} {teacher.last_name} ({teacher.teacher_id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="assignBranch">Branch</Label>
                        <Select 
                          value={teacherForm.branch_id} 
                          onValueChange={(value) => setTeacherForm({...teacherForm, branch_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.branch_name} ({branch.branch_code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="assignClass">Class</Label>
                        <Select 
                          value={teacherForm.class_id} 
                          onValueChange={(value) => setTeacherForm({...teacherForm, class_id: value})}
                          disabled={classesLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={classesLoading ? "Loading classes..." : "Select class"} />
                          </SelectTrigger>
                          <SelectContent>
                            {contextClasses.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name} ({cls.level})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isPrimary"
                          checked={teacherForm.is_primary_teacher}
                          onChange={(e) => setTeacherForm({...teacherForm, is_primary_teacher: e.target.checked})}
                        />
                        <Label htmlFor="isPrimary">Primary Teacher</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAssignTeacherOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAssignTeacher}>
                        Assign Teacher
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading assignments...</p>
                </div>
              ) : teacherAssignments.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No teacher assignments found. Select a branch and class, then assign teachers.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          {assignment.teacher.first_name} {assignment.teacher.last_name}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            {assignment.teacher.teacher_id}
                          </span>
                        </TableCell>
                        <TableCell>
                          {assignment.branch.branch_name}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            {assignment.branch.branch_code}
                          </span>
                        </TableCell>
                        <TableCell>
                          {assignment.class.class_name}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            {assignment.class.class_level}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={assignment.is_primary_teacher ? "default" : "secondary"}>
                            {assignment.is_primary_teacher ? "Primary" : "Secondary"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(assignment.assigned_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Enrollments Tab */}
        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Enrollments</CardTitle>
                  <CardDescription>
                    Manage student enrollments in subject branches
                  </CardDescription>
                </div>
                <Dialog open={enrollStudentOpen} onOpenChange={setEnrollStudentOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={!selectedBranch || !selectedClass}>
                      <Plus className="h-4 w-4 mr-2" />
                      Enroll Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Enroll Student in Branch</DialogTitle>
                      <DialogDescription>
                        Enroll a student in the selected branch and class
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="enrollStudent">Student</Label>
                        <Select 
                          value={enrollmentForm.student_id} 
                          onValueChange={(value) => setEnrollmentForm({...enrollmentForm, student_id: value})}
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
                        <Label htmlFor="enrollBranch">Branch</Label>
                        <Select 
                          value={enrollmentForm.branch_id} 
                          onValueChange={(value) => setEnrollmentForm({...enrollmentForm, branch_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.branch_name} ({branch.branch_code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="enrollClass">Class</Label>
                        <Select 
                          value={enrollmentForm.class_id} 
                          onValueChange={(value) => setEnrollmentForm({...enrollmentForm, class_id: value})}
                          disabled={classesLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={classesLoading ? "Loading classes..." : "Select class"} />
                          </SelectTrigger>
                          <SelectContent>
                            {contextClasses.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name} ({cls.level})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEnrollStudentOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleEnrollStudent}>
                        Enroll Student
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {enrollmentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading enrollments...</p>
                </div>
              ) : studentEnrollments.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No student enrollments found. Select a branch and class, then enroll students.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          {enrollment.student.first_name} {enrollment.student.last_name}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            {enrollment.student.student_id}
                          </span>
                        </TableCell>
                        <TableCell>
                          {enrollment.branch.branch_name}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            {enrollment.branch.branch_code}
                          </span>
                        </TableCell>
                        <TableCell>
                          {enrollment.class.class_name}
                          <br />
                          <span className="text-sm text-muted-foreground">
                            {enrollment.class.class_level}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={enrollment.enrollment_status === 'enrolled' ? 'default' : 'secondary'}>
                            {enrollment.enrollment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(enrollment.enrolled_at).toLocaleDateString()}
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
    </div>
  )
}
