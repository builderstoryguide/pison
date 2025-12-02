"use client"

import { useState } from "react"
import { useTeacherAssignments } from "@/hooks/use-teacher-assignments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Search, 
  BookOpen, 
  ArrowUpDown, 
  ChevronRight
} from "lucide-react"

interface TeacherSubjectsListProps {
  onNavigate?: (view: string, classId?: string, subjectId?: string) => void
}

export function TeacherSubjectsList({ onNavigate }: TeacherSubjectsListProps) {
  const { data: classes = [], isLoading, error } = useTeacherAssignments()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)

  // Flatten the data structure to get a list of all subject assignments
  const allSubjects = classes.flatMap(cls => 
    (cls.subjects || []).map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      coefficient: subject.coefficient,
      classId: cls.id,
      className: cls.name,
      classLevel: cls.level,
      classBranch: cls.branch,
      classSubsystem: cls.subsystem,
      studentCount: cls.studentCount
    }))
  )

  // Filter subjects
  const filteredSubjects = allSubjects.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.className.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort subjects
  const sortedSubjects = [...filteredSubjects].sort((a, b) => {
    if (!sortConfig) return 0
    
    const { key, direction } = sortConfig
    // @ts-ignore
    const aValue = a[key]
    // @ts-ignore
    const bValue = b[key]
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Subjects</h1>
            <p className="text-muted-foreground">Loading subjects...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-muted rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Subjects</CardTitle>
            <CardDescription className="text-red-600">
              {error instanceof Error ? error.message : "Failed to load subjects"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Subjects</h1>
          <p className="text-muted-foreground">
            Manage your assigned subjects across all classes
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subject Assignments</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects or classes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No Subjects Found</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                {searchTerm 
                  ? "No subjects match your search criteria." 
                  : "You don't have any subjects assigned yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px] cursor-pointer" onClick={() => requestSort('name')}>
                      <div className="flex items-center">
                        Subject Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => requestSort('code')}>
                      <div className="flex items-center">
                        Code
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => requestSort('className')}>
                      <div className="flex items-center">
                        Class
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Level / Branch</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSubjects.map((subject, index) => (
                    <TableRow key={`${subject.classId}-${subject.id}-${index}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center mr-3 text-primary">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          {subject.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subject.code}</Badge>
                      </TableCell>
                      <TableCell>{subject.className}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{subject.classLevel}</div>
                          <div className="text-muted-foreground text-xs">{subject.classBranch}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="rounded-full">
                          {subject.studentCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onNavigate?.("grades", subject.classId.toString(), subject.id.toString())}
                        >
                          Enter Grades
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
