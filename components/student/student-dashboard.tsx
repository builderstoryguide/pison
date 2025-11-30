"use client"

import { useState } from "react"
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

interface SequenceData {
  marks: number
  maxMarks: number
  grade: string
}

interface SubjectData {
  id: number
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
  const [activeTab, setActiveTab] = useState("all")

  // Mock data for student
  const studentData = {
    id: "STU2024001",
    name: "Amina Fru",
    email: "amina.fru@student.pisonacademy.cm",
    class: "Form 5A",
    branch: "Grammar",
    subsystem: "English",
    avatar: "/placeholder.svg",
  }

  // Mock subjects data with teacher info and sequences
  const subjects = [
    {
      id: 1,
      name: "Mathematics",
      code: "MATH501",
      teacher: "Mr. John Kamga",
      coefficient: 5,
      sequences: {
        seq1: { marks: 85, maxMarks: 100, grade: "A" },
        seq2: { marks: 88, maxMarks: 100, grade: "A" },
        seq3: { marks: 82, maxMarks: 100, grade: "B+" },
        seq4: { marks: 90, maxMarks: 100, grade: "A+" },
        seq5: { marks: 87, maxMarks: 100, grade: "A" },
        seq6: { marks: 89, maxMarks: 100, grade: "A" },
      }
    },
    {
      id: 2,
      name: "English Language",
      code: "ENG501",
      teacher: "Mrs. Grace Ndip",
      coefficient: 4,
      sequences: {
        seq1: { marks: 78, maxMarks: 100, grade: "B+" },
        seq2: { marks: 82, maxMarks: 100, grade: "B+" },
        seq3: { marks: 85, maxMarks: 100, grade: "A" },
        seq4: { marks: 80, maxMarks: 100, grade: "B+" },
        seq5: { marks: 83, maxMarks: 100, grade: "B+" },
        seq6: { marks: 86, maxMarks: 100, grade: "A" },
      }
    },
    {
      id: 3,
      name: "Physics",
      code: "PHY501",
      teacher: "Dr. Paul Mbah",
      coefficient: 5,
      sequences: {
        seq1: { marks: 82, maxMarks: 100, grade: "B+" },
        seq2: { marks: 85, maxMarks: 100, grade: "A" },
        seq3: { marks: 80, maxMarks: 100, grade: "B+" },
        seq4: { marks: 87, maxMarks: 100, grade: "A" },
        seq5: { marks: 84, maxMarks: 100, grade: "B+" },
        seq6: { marks: 88, maxMarks: 100, grade: "A" },
      }
    },
    {
      id: 4,
      name: "Chemistry",
      code: "CHEM501",
      teacher: "Mrs. Sarah Fon",
      coefficient: 5,
      sequences: {
        seq1: { marks: 87, maxMarks: 100, grade: "A" },
        seq2: { marks: 84, maxMarks: 100, grade: "B+" },
        seq3: { marks: 86, maxMarks: 100, grade: "A" },
        seq4: { marks: 89, maxMarks: 100, grade: "A" },
        seq5: { marks: 85, maxMarks: 100, grade: "A" },
        seq6: { marks: 90, maxMarks: 100, grade: "A+" },
      }
    },
    {
      id: 5,
      name: "Biology",
      code: "BIO501",
      teacher: "Mr. Thomas Njie",
      coefficient: 4,
      sequences: {
        seq1: { marks: 80, maxMarks: 100, grade: "B+" },
        seq2: { marks: 83, maxMarks: 100, grade: "B+" },
        seq3: { marks: 81, maxMarks: 100, grade: "B+" },
        seq4: { marks: 85, maxMarks: 100, grade: "A" },
        seq5: { marks: 82, maxMarks: 100, grade: "B+" },
        seq6: { marks: 84, maxMarks: 100, grade: "B+" },
      }
    },
  ]

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
                    {subjects.map((subject) => (
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* First Sequence Tab */}
            <TabsContent value="seq1" className="space-y-4">
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
                    {subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{subject.code}</Badge>
                        </TableCell>
                        <TableCell>{subject.teacher}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{subject.coefficient}</Badge>
                        </TableCell>
                        {renderSequenceColumn(subject, 'seq1')}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Second Sequence Tab */}
            <TabsContent value="seq2" className="space-y-4">
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
                    {subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{subject.code}</Badge>
                        </TableCell>
                        <TableCell>{subject.teacher}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{subject.coefficient}</Badge>
                        </TableCell>
                        {renderSequenceColumn(subject, 'seq2')}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Third Sequence Tab */}
            <TabsContent value="seq3" className="space-y-4">
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
                    {subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{subject.code}</Badge>
                        </TableCell>
                        <TableCell>{subject.teacher}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{subject.coefficient}</Badge>
                        </TableCell>
                        {renderSequenceColumn(subject, 'seq3')}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Fourth Sequence Tab */}
            <TabsContent value="seq4" className="space-y-4">
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
                    {subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{subject.code}</Badge>
                        </TableCell>
                        <TableCell>{subject.teacher}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{subject.coefficient}</Badge>
                        </TableCell>
                        {renderSequenceColumn(subject, 'seq4')}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Fifth Sequence Tab */}
            <TabsContent value="seq5" className="space-y-4">
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
                    {subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{subject.code}</Badge>
                        </TableCell>
                        <TableCell>{subject.teacher}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{subject.coefficient}</Badge>
                        </TableCell>
                        {renderSequenceColumn(subject, 'seq5')}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Sixth Sequence Tab */}
            <TabsContent value="seq6" className="space-y-4">
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
                    {subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{subject.code}</Badge>
                        </TableCell>
                        <TableCell>{subject.teacher}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{subject.coefficient}</Badge>
                        </TableCell>
                        {renderSequenceColumn(subject, 'seq6')}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
