"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  FileText,
  ChevronRight
} from "lucide-react"

interface Subject {
  id: number
  name: string
  code: string
  coefficient: number
}

interface ClassAssignment {
  id: number
  name: string
  code: string
  level: string
  branch: string
  subsystem: string
  studentCount: number
  subjects: Subject[]
}

interface TeacherDashboardNewProps {
  onNavigate?: (view: string, classId?: string, subjectId?: string) => void
}

export function TeacherDashboardNew({ onNavigate }: TeacherDashboardNewProps) {
  const { user } = useAuth()
  const [classes, setClasses] = useState<ClassAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeacherAssignments = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        // Add cache-busting parameter to ensure fresh data
        const cacheBuster = new Date().getTime()
        const response = await fetch(`/api/teachers/${user.id}/assignments?t=${cacheBuster}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch teacher assignments')
        }

        const data = await response.json()
        setClasses(data.classes || [])
      } catch (err) {
        // Error fetching teacher assignments
        setError(err instanceof Error ? err.message : 'Failed to load assignments')
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherAssignments()

    // Refresh data when page becomes visible (when user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTeacherAssignments()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.id])

  // Calculate statistics
  const totalClasses = classes.length
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0)
  const uniqueSubjects = new Set(classes.flatMap(cls => cls.subjects?.map(s => s.id) || []))

  if (loading) {
    return (
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Loading your assignments...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name?.split(" ")[0]}! Here&apos;s an overview of your teaching assignments.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              Classes assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Students across all classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueSubjects.size}</div>
            <p className="text-xs text-muted-foreground">
              Unique subjects taught
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Action</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onNavigate?.("grades-history")}
            >
              View Grade History
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Classes Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">My Classes</h2>
            <p className="text-sm text-muted-foreground">
              Classes and subjects assigned to you
            </p>
          </div>
        </div>

        {classes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Classes Assigned</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                You don&apos;t have any classes assigned yet. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((classItem) => (
              <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{classItem.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {classItem.level} • {classItem.branch}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {classItem.subsystem}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Class Info */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Students:</span>
                    <span className="font-medium">{classItem.studentCount || 0}</span>
                  </div>

                  {/* Subjects */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Subjects ({classItem.subjects?.length || 0})</span>
                    </div>
                    {classItem.subjects && classItem.subjects.length > 0 ? (
                      <div className="space-y-1">
                        {classItem.subjects.slice(0, 3).map((subject) => (
                          <div 
                            key={subject.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => onNavigate?.("class-grades", classItem.id.toString(), subject.id.toString())}
                            role="button"
                            tabIndex={0}
                          >
                            <span className="font-medium truncate">{subject.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {subject.code}
                            </Badge>
                          </div>
                        ))}
                        {classItem.subjects.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center pt-1">
                            +{classItem.subjects.length - 3} more subjects
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        No subjects assigned
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => onNavigate?.("class-grades", classItem.id.toString())}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Enter Grades
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
