"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BookOpen } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface SequenceData {
  marks: number
  maxMarks: number
  grade: string
}

interface SubjectData {
  id: string | number
  name: string
  code: string
  teacher: string
  coefficient: number
  sequences: Record<string, SequenceData>
}

interface StudentDashboardProps {
  onNavigate?: (view: string) => void
}

export function StudentDashboard(_: StudentDashboardProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("all")
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudentData = async () => {
      console.log("Fetching student data...", { userClass: user?.class, userId: user?.id, studentId: user?.studentId })
      
      if (!user?.studentId && !user?.class) {
        console.warn("User studentId and class are missing, skipping fetch")
        setLoading(false)
        return
      }

      try {
        if (!supabase) {
            console.error("Supabase client is not initialized")
            setLoading(false)
            return
        }

        let classId: string | null = null

        // 1. Try to get class ID from class_students table (most reliable)
        if (user?.studentId) {
            // First get the student's UUID from the students table
            const { data: studentData, error: _ } = await supabase
                .from('students')
                .select('id')
                .eq('student_id', user.studentId)
                .single()
            
            if (studentData) {
                const { data: enrollmentData, error: __ } = await supabase
                    .from('class_students')
                    .select('class_id')
                    .eq('student_id', studentData.id)
                    .single()
                
                if (enrollmentData) {
                    classId = enrollmentData.class_id
                    console.log("Found class ID via enrollment:", classId)
                }
            }
        }

        // 2. Fallback: Get class ID by name if not found via enrollment
        if (!classId && user?.class) {
            // Check if user.class is a UUID
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.class)
            
            if (isUuid) {
                console.log("User class is a UUID, using directly:", user.class)
                classId = user.class
            } else {
                console.log("Looking up class by name:", user.class)
                const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('id')
                .eq('name', user.class)
                .maybeSingle()

                if (classData) {
                    classId = classData.id
                    console.log("Found class ID by name:", classId)
                } else if (classError) {
                    console.error("Error finding class by name:", classError.message || classError)
                } else {
                    console.warn("Class not found by name:", user.class)
                }
            }
        }

        if (!classId) {
            console.error("Class ID could not be determined. User details:", { 
                studentId: user?.studentId, 
                className: user?.class 
            })
            // Don't throw, just set empty subjects and return to avoid crashing the UI
            setSubjects([])
            setLoading(false)
            return
        }

        // 3. Get subjects for this class
        const { data: classSubjects, error: subjectsError } = await supabase
          .from('class_subjects')
          .select(`
            subject_id,
            subjects (
              id,
              name,
              code
            )
          `)
          .eq('class_id', classId)

        if (subjectsError) {
            console.error("Error fetching class subjects:", subjectsError.message || subjectsError)
            throw subjectsError
        }
        
        console.log("Found class subjects:", classSubjects)

        // 4. Transform to component format
        interface RawSubjectData {
          subject_id: string
          subjects: {
            id: string
            name: string
            code: string
          }
        }

        const formattedSubjects: SubjectData[] = (classSubjects as unknown as RawSubjectData[]).map((item) => ({
          id: item.subjects.id,
          name: item.subjects.name,
          code: item.subjects.code || item.subjects.name.substring(0, 3).toUpperCase(),
          teacher: "TBA", // Placeholder as teacher assignment is in a different table
          coefficient: 1, // Default coefficient
          sequences: {} // Initialize with empty sequences
        }))

        setSubjects(formattedSubjects)
      } catch (error: any) {
        console.error('Error fetching student subjects:', error)
        console.error('Error message:', error.message)
        if (error.stack) {
            console.error('Error stack:', error.stack)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [user])

  // Mock data for student display (fallback to user data)
  const studentData = {
    id: user?.studentId || "STU2024001",
    name: user?.name || "Student Name",
    email: user?.email || "student@school.com",
    class: user?.class || "Form 5A",
    branch: user?.branch || "General",
    subsystem: user?.subsystem || "English",
    avatar: user?.avatar || "/placeholder.svg",
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "text-green-600 bg-green-50"
      case "B+":
      case "B":
        return "text-blue-600 bg-blue-50"
      case "C+":
      case "C":
        return "text-yellow-600 bg-yellow-50"
      case "D":
      case "U":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const renderSequenceColumn = (subject: SubjectData, sequenceKey: string) => {
    const sequence = subject.sequences[sequenceKey]
    if (!sequence) return <TableCell className="text-center text-muted-foreground">-</TableCell>
    
    return (
      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="font-medium">{sequence.marks}/{sequence.maxMarks}</span>
          <Badge variant="outline" className={getGradeColor(sequence.grade)}>
            {sequence.grade}
          </Badge>
        </div>
      </TableCell>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your academic overview</p>
        </div>
      </div>

      {/* Student Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={studentData.avatar} alt={studentData.name} />
              <AvatarFallback>
                {studentData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">{studentData.name}</CardTitle>
              <CardDescription>
                {studentData.class} • {studentData.branch} • {studentData.subsystem} Subsystem
              </CardDescription>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="secondary">Student ID: {studentData.id}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Subjects and Marks Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Subjects & Marks
          </CardTitle>
          <CardDescription>View your subjects and marks across all sequences</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">All Subjects</TabsTrigger>
              <TabsTrigger value="seq1">1st Sequence</TabsTrigger>
              <TabsTrigger value="seq2">2nd Sequence</TabsTrigger>
              <TabsTrigger value="seq3">3rd Sequence</TabsTrigger>
              <TabsTrigger value="seq4">4th Sequence</TabsTrigger>
              <TabsTrigger value="seq5">5th Sequence</TabsTrigger>
              <TabsTrigger value="seq6">6th Sequence</TabsTrigger>
            </TabsList>

            {/* All Subjects Tab */}
            <TabsContent value="all" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject Name</TableHead>
                      <TableHead>Subject Code</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead className="text-center">Coefficient</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">Loading subjects...</TableCell>
                      </TableRow>
                    ) : subjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">No subjects found for your class.</TableCell>
                      </TableRow>
                    ) : (
                      subjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{subject.code}</Badge>
                          </TableCell>
                          <TableCell>{subject.teacher}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{subject.coefficient}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Sequence Tabs */}
            {['seq1', 'seq2', 'seq3', 'seq4', 'seq5', 'seq6'].map((seq) => (
              <TabsContent key={seq} value={seq} className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject Name</TableHead>
                        <TableHead>Subject Code</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead className="text-center">Coefficient</TableHead>
                        <TableHead className="text-center">Marks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">Loading subjects...</TableCell>
                        </TableRow>
                      ) : subjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">No subjects found for your class.</TableCell>
                        </TableRow>
                      ) : (
                        subjects.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{subject.code}</Badge>
                            </TableCell>
                            <TableCell>{subject.teacher}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{subject.coefficient}</Badge>
                            </TableCell>
                            {renderSequenceColumn(subject, seq)}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
