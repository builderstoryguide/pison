"use client"

import { useEffect } from "react"
import {
  Users,
  Clock,
  BookOpen,
  TrendingUp,
  FileText,
  Eye,
  Award,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTeacherClasses } from "@/lib/teacher-classes-context"
import { useAuth } from "@/lib/auth-context"

interface TeacherDashboardProps {
  onNavigate?: (view: string) => void
}

export function TeacherDashboard({ onNavigate }: TeacherDashboardProps) {
  const { user } = useAuth()
  const { classes: teacherClasses, getTeacherClasses } = useTeacherClasses()

  useEffect(() => {
    getTeacherClasses()
  }, [getTeacherClasses])

  // Calculate statistics
  const totalClasses = teacherClasses.length
  const totalStudents = teacherClasses.reduce((sum, cls) => sum + cls.students.length, 0)

  // Get today's schedule from classes
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const todaySchedule = teacherClasses.flatMap(cls => 
    cls.schedule
      .filter(sched => sched.day.toLowerCase() === today)
      .flatMap(sched => 
        sched.periods.map(period => ({
          subject: period.subject,
          startTime: period.time.split('-')[0]?.trim() || '',
          endTime: period.time.split('-')[1]?.trim() || '',
          period: period.time,
          day: sched.day,
          room: period.room,
          className: cls.name
        }))
      )
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name?.split(" ")[0]}! Manage your classes and students.
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
            <p className="text-xs text-muted-foreground">Active classes assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Students across all classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySchedule.length}</div>
            <p className="text-xs text-muted-foreground">Classes scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                onClick={() => onNavigate?.("assignments")}
              >
                Manage assignments
              </Button>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="flex-1 min-w-[200px] justify-start bg-transparent"
              onClick={() => onNavigate?.("classes")}
            >
              <Eye className="h-4 w-4 mr-2" />
              View My Classes
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 min-w-[200px] justify-start bg-transparent"
              onClick={() => onNavigate?.("grades")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Enter Grades
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 min-w-[200px] justify-start bg-transparent"
              onClick={() => onNavigate?.("examinations")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Enter Exam Marks
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 min-w-[200px] justify-start bg-transparent"
              onClick={() => onNavigate?.("grades")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Assessment
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 min-w-[200px] justify-start bg-transparent"
              onClick={() => onNavigate?.("my-assignments")}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              My Subjects & Classes
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 min-w-[200px] justify-start bg-transparent"
              onClick={() => onNavigate?.("assignments")}
            >
              <Award className="h-4 w-4 mr-2" />
              Manage Assignments
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 min-w-[200px] justify-start bg-transparent"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Classes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Classes you are teaching this academic year</CardDescription>
            </div>
            <Button variant="outline" onClick={() => onNavigate?.("classes")}>
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teacherClasses.slice(0, 3).map((cls) => (
              <Card key={cls.id} className="border-2">
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
                      <span className="font-medium">
                        {cls.students.filter((s) => s.enrollmentStatus === "enrolled").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subjects:</span>
                      <span className="font-medium">{cls.subjects.length}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 bg-transparent"
                    onClick={() => onNavigate?.("classes")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Class Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {teacherClasses.length > 3 && (
            <div className="text-center mt-4">
              <Button variant="outline" onClick={() => onNavigate?.("classes")}>
                View {teacherClasses.length - 3} More Classes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

