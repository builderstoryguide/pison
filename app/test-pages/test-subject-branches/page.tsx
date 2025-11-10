'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { BookOpen, Users, Calculator, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'
import type { 
  SubjectBranchWithDetails,
  TeacherBranchAssignmentWithDetails,
  StudentBranchEnrollmentWithDetails,
  AggregatedSubjectGrade
} from '@/lib/subject-branches-types'

export default function TestSubjectBranches() {
  const { toast } = useToast()
  
  // State management
  const [branches, setBranches] = useState<SubjectBranchWithDetails[]>([])
  const [assignments, setAssignments] = useState<TeacherBranchAssignmentWithDetails[]>([])
  const [enrollments, setEnrollments] = useState<StudentBranchEnrollmentWithDetails[]>([])
  const [aggregatedGrades, setAggregatedGrades] = useState<AggregatedSubjectGrade[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  // Load test data
  useEffect(() => {
    loadTestData()
  }, [])

  const loadTestData = async () => {
    try {
      setLoading(true)
      
      // Load all test data in parallel
      const [branchesRes, assignmentsRes, enrollmentsRes, gradesRes] = await Promise.all([
        fetch('/api/subject-branches'),
        fetch('/api/teacher-branch-assignments'),
        fetch('/api/student-branch-enrollments'),
        fetch('/api/aggregated-grades')
      ])
      
      const [branchesData, assignmentsData, enrollmentsData, gradesData] = await Promise.all([
        branchesRes.json(),
        assignmentsRes.json(),
        enrollmentsRes.json(),
        gradesRes.json()
      ])
      
      if (branchesData.success) setBranches(branchesData.branches || [])
      if (assignmentsData.success) setAssignments(assignmentsData.assignments || [])
      if (enrollmentsData.success) setEnrollments(enrollmentsData.enrollments || [])
      if (gradesData.success) setAggregatedGrades(gradesData.grades || [])
      
    } catch (error) {
      console.error('Error loading test data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load test data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const runSystemTests = async () => {
    const results: Record<string, any> = {}
    
    try {
      // Test 1: Create a subject branch
      toast({
        title: 'Running Tests',
        description: 'Testing subject branch creation...'
      })
      
      const createBranchResponse = await fetch('/api/subject-branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: 'test-subject-id',
          branch_name: 'Test Pure Mathematics',
          branch_code: 'TEST-PURE',
          description: 'Test branch for pure mathematics',
          weight_percentage: 40,
          is_optional: false,
          academic_year: '2024-2025',
          term: 'Term 1'
        })
      })
      
      results.createBranch = {
        success: createBranchResponse.ok,
        status: createBranchResponse.status,
        data: await createBranchResponse.json()
      }
      
      // Test 2: Assign teacher to branch
      toast({
        title: 'Running Tests',
        description: 'Testing teacher assignment...'
      })
      
      const assignTeacherResponse = await fetch('/api/teacher-branch-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: 'test-teacher-id',
          branch_id: 'test-branch-id',
          class_id: 'test-class-id',
          academic_year: '2024-2025',
          term: 'Term 1',
          is_primary_teacher: true
        })
      })
      
      results.assignTeacher = {
        success: assignTeacherResponse.ok,
        status: assignTeacherResponse.status,
        data: await assignTeacherResponse.json()
      }
      
      // Test 3: Enroll student in branch
      toast({
        title: 'Running Tests',
        description: 'Testing student enrollment...'
      })
      
      const enrollStudentResponse = await fetch('/api/student-branch-enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'test-student-id',
          branch_id: 'test-branch-id',
          class_id: 'test-class-id',
          academic_year: '2024-2025',
          term: 'Term 1'
        })
      })
      
      results.enrollStudent = {
        success: enrollStudentResponse.ok,
        status: enrollStudentResponse.status,
        data: await enrollStudentResponse.json()
      }
      
      // Test 4: Create branch assessment
      toast({
        title: 'Running Tests',
        description: 'Testing assessment creation...'
      })
      
      const createAssessmentResponse = await fetch('/api/branch-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: 'test-branch-id',
          teacher_id: 'test-teacher-id',
          class_id: 'test-class-id',
          title: 'Test Quiz',
          description: 'A test quiz for the branch',
          type: 'quiz',
          total_marks: 100,
          passing_marks: 50,
          weight_percentage: 100,
          assessment_date: new Date().toISOString().split('T')[0],
          academic_year: '2024-2025',
          term: 'Term 1'
        })
      })
      
      results.createAssessment = {
        success: createAssessmentResponse.ok,
        status: createAssessmentResponse.status,
        data: await createAssessmentResponse.json()
      }
      
      // Test 5: Grade assessment
      toast({
        title: 'Running Tests',
        description: 'Testing grade recording...'
      })
      
      const gradeAssessmentResponse = await fetch('/api/branch-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: 'test-assessment-id',
          student_id: 'test-student-id',
          teacher_id: 'test-teacher-id',
          marks_obtained: 85,
          remarks: 'Good work',
          feedback: 'Excellent understanding of the concepts'
        })
      })
      
      results.gradeAssessment = {
        success: gradeAssessmentResponse.ok,
        status: gradeAssessmentResponse.status,
        data: await gradeAssessmentResponse.json()
      }
      
      // Test 6: Calculate aggregated grades
      toast({
        title: 'Running Tests',
        description: 'Testing grade aggregation...'
      })
      
      const calculateGradesResponse = await fetch('/api/aggregated-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: 'test-student-id',
          subjectId: 'test-subject-id',
          classId: 'test-class-id',
          academicYear: '2024-2025',
          term: 'Term 1'
        })
      })
      
      results.calculateGrades = {
        success: calculateGradesResponse.ok,
        status: calculateGradesResponse.status,
        data: await calculateGradesResponse.json()
      }
      
      setTestResults(results)
      
      const successCount = Object.values(results).filter((r: any) => r.success).length
      const totalTests = Object.keys(results).length
      
      toast({
        title: 'Tests Completed',
        description: `${successCount}/${totalTests} tests passed`,
        variant: successCount === totalTests ? 'default' : 'destructive'
      })
      
    } catch (error) {
      console.error('Error running tests:', error)
      toast({
        title: 'Test Error',
        description: 'Failed to run system tests',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading test data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subject Branches System Test</h1>
          <p className="text-muted-foreground">
            Test the complete subject branches functionality
          </p>
        </div>
        <Button onClick={runSystemTests}>
          Run System Tests
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Subject Branches</p>
                <p className="text-2xl font-bold">{branches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Teacher Assignments</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Student Enrollments</p>
                <p className="text-2xl font-bold">{enrollments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Aggregated Grades</p>
                <p className="text-2xl font-bold">{aggregatedGrades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="branches">Subject Branches</TabsTrigger>
          <TabsTrigger value="assignments">Teacher Assignments</TabsTrigger>
          <TabsTrigger value="enrollments">Student Enrollments</TabsTrigger>
          <TabsTrigger value="grades">Aggregated Grades</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
        </TabsList>

        {/* System Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
              <CardDescription>
                Overview of the subject branches system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Database Schema:</strong> Complete schema with 6 tables for subject branches, teacher assignments, student enrollments, assessments, grades, and aggregated grades.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>API Endpoints:</strong> Full REST API with endpoints for CRUD operations on all entities, plus grade aggregation logic.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Admin Interface:</strong> Comprehensive admin interface for managing subject branches, teacher assignments, and student enrollments.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Teacher Interface:</strong> Teacher interface for creating assessments and recording grades for their assigned branches.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Grade Aggregation:</strong> Automatic calculation of final grades by combining marks from multiple teachers across different branches.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subject Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Branches</CardTitle>
              <CardDescription>
                All subject branches in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {branches.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No subject branches found. Create some branches to test the system.
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
                            <p className="text-sm text-muted-foreground">
                              Subject: {branch.subject?.subject_name} ({branch.subject?.subject_code})
                            </p>
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

        {/* Teacher Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Assignments</CardTitle>
              <CardDescription>
                Teacher assignments to subject branches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No teacher assignments found. Assign teachers to branches to test the system.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {assignment.teacher.first_name} {assignment.teacher.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {assignment.subject.subject_name} - {assignment.branch.branch_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.class.class_name} ({assignment.class.class_level})
                            </p>
                          </div>
                          <Badge variant={assignment.is_primary_teacher ? "default" : "secondary"}>
                            {assignment.is_primary_teacher ? "Primary Teacher" : "Secondary Teacher"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Enrollments Tab */}
        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Enrollments</CardTitle>
              <CardDescription>
                Student enrollments in subject branches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No student enrollments found. Enroll students in branches to test the system.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {enrollments.map((enrollment) => (
                    <Card key={enrollment.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {enrollment.student.first_name} {enrollment.student.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {enrollment.subject.subject_name} - {enrollment.branch.branch_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {enrollment.class.class_name} ({enrollment.class.class_level})
                            </p>
                          </div>
                          <Badge variant={enrollment.enrollment_status === 'enrolled' ? 'default' : 'secondary'}>
                            {enrollment.enrollment_status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aggregated Grades Tab */}
        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aggregated Grades</CardTitle>
              <CardDescription>
                Final aggregated grades combining all branch grades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aggregatedGrades.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No aggregated grades found. Create assessments and record grades to see aggregated results.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {aggregatedGrades.map((grade) => (
                    <Card key={grade.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              Student: {grade.student_id}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Subject: {grade.subject_id} | Class: {grade.class_id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Final Grade: {grade.final_percentage.toFixed(1)}% ({grade.final_grade_letter})
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={grade.final_percentage >= 50 ? "default" : "destructive"}>
                              {grade.final_grade_letter}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {grade.final_percentage.toFixed(1)}%
                            </p>
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

        {/* Test Results Tab */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Test Results</CardTitle>
              <CardDescription>
                Results of automated system tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(testResults).length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No test results available. Click "Run System Tests" to execute tests.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {Object.entries(testResults).map(([testName, result]) => (
                    <Card key={testName}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold capitalize">
                              {testName.replace(/([A-Z])/g, ' $1').trim()}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Status: {result.status} | Success: {result.success ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? "PASS" : "FAIL"}
                          </Badge>
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
    </div>
  )
}
