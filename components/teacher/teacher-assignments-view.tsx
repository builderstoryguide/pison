"use client"

import { useState, useEffect } from "react"
import { BookOpen, Users, GraduationCap, Search, AlertCircle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Subject {
  id: string
  subjectId: string | null
  subjectName: string
  subjectCode: string | null
  subBranchId: string | null
  subBranchName: string | null
  assignmentType: string
  isActive: boolean
  createdAt: string
}

interface Class {
  id: string
  name: string
  level: string
  subsystem: string
  branch: string
  academicYear?: string
  capacity?: number
  currentEnrollment?: number
  subjects?: string[]
  assignmentType: string
  status?: string
}

interface TeacherAssignments {
  teacher: {
    id: string
    name: string
  }
  subjects: Subject[]
  classes: Class[]
}

export function TeacherAssignmentsView() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<TeacherAssignments | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user?.id) {
      fetchAssignments()
    }
  }, [user])

  const fetchAssignments = async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/teachers/${user.id}/assignments`)
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to fetch assignments')
      }

      setAssignments(data)
    } catch (err) {
      console.error('Error fetching assignments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSubjects = assignments?.subjects.filter((subject) =>
    subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.subjectCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.subBranchName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const filteredClasses = assignments?.classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.subsystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.branch.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-muted-foreground">Loading your subjects and classes...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-muted-foreground">View all subjects and classes assigned to you</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Assignments</h3>
            <p className="text-muted-foreground text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-muted-foreground">
            View all subjects and classes assigned to you
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {assignments?.subjects.length || 0} Subjects
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {assignments?.classes.length || 0} Classes
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments?.subjects.length || 0}</div>
            <p className="text-xs text-muted-foreground">Subjects assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments?.classes.length || 0}</div>
            <p className="text-xs text-muted-foreground">Classes assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Teacher</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments?.classes.filter((cls) => cls.assignmentType === 'class_teacher').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Classes where you are class teacher</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects or classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs for Subjects and Classes */}
      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subjects">
            Subjects ({filteredSubjects.length})
          </TabsTrigger>
          <TabsTrigger value="classes">
            Classes ({filteredClasses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4">
          {filteredSubjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No subjects found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm
                    ? "No subjects match your search criteria."
                    : "You don't have any subjects assigned yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSubjects.map((subject) => (
                <Card key={subject.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{subject.subjectName}</CardTitle>
                        {subject.subjectCode && (
                          <CardDescription className="mt-1">
                            Code: {subject.subjectCode}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={subject.isActive ? "default" : "secondary"}>
                        {subject.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {subject.subBranchName && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Sub-branch:</span>
                        <span className="font-medium">{subject.subBranchName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline" className="capitalize">
                        {subject.assignmentType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-muted-foreground">Assigned</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          {filteredClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No classes found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm
                    ? "No classes match your search criteria."
                    : "You don't have any classes assigned yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Classes</CardTitle>
                <CardDescription>All classes you are assigned to teach</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Subsystem</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Assignment Type</TableHead>
                      <TableHead>Students</TableHead>
                      {filteredClasses.some((cls) => cls.subjects && cls.subjects.length > 0) && (
                        <TableHead>Subjects</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>{cls.level}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {cls.subsystem}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {cls.branch}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              cls.assignmentType === 'class_teacher' ? 'default' : 'outline'
                            }
                            className="capitalize"
                          >
                            {cls.assignmentType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {cls.currentEnrollment !== undefined && cls.capacity !== undefined ? (
                            <span>
                              {cls.currentEnrollment}/{cls.capacity}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        {filteredClasses.some((c) => c.subjects && c.subjects.length > 0) && (
                          <TableCell>
                            {cls.subjects && cls.subjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {cls.subjects.slice(0, 2).map((subject, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {subject}
                                  </Badge>
                                ))}
                                {cls.subjects.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{cls.subjects.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

