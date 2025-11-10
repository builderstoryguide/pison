"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Users, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  UserCheck, 
  Plus, 
  Award, 
  Eye, 
  TrendingUp,
  BarChart3,
  Activity,
  Zap,
  Wifi,
  WifiOff,
  Settings,
  Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { useTeacher, useTeacherClasses, useTeacherGrades, useTeacherStudents } from '@/lib/teacher-ultra-fast/context'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { ClassStudentsDialog } from './class-students-dialog'

interface TeacherDashboardProps {
  onNavigate?: (view: string) => void
}

export function UltraFastTeacherDashboard({ onNavigate }: TeacherDashboardProps) {
  const { user } = useAuth()
  const { 
    data, 
    isLoading, 
    error, 
    performance, 
    isRealTimeConnected, 
    refreshData, 
    getCacheStats,
    config
  } = useTeacher()
  
  const { classes } = useTeacherClasses()
  const { assessments, grades } = useTeacherGrades()
  const { students } = useTeacherStudents()
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<{ id: string; name: string } | null>(null)

  // Memoized statistics for ultra-fast rendering
  const statistics = useMemo(() => {
    if (!data) return {
      totalClasses: 0,
      totalStudents: 0,
      totalAssessments: 0,
      totalGrades: 0,
      averageGrade: 0,
      pendingGrades: 0,
      cacheHitRate: 0,
      dataFreshness: 0
    }

    // Get real database statistics
    const gradesStats = data.grades.statistics
    const assessmentsStats = data.assessments.statistics

    const totalStudents = students.length
    const totalGrades = gradesStats.totalGrades
    const averageGrade = gradesStats.averageGrade
    const pendingGrades = gradesStats.pendingGrades

    const cacheStats = getCacheStats()
    const dataAge = data?.cache?.lastUpdated ? Date.now() - new Date(data.cache.lastUpdated).getTime() : 0
    const dataFreshness = Math.max(0, 100 - (dataAge / 60000)) // Freshness percentage

    return {
      totalClasses: classes.length,
      totalStudents,
      totalAssessments: assessmentsStats.totalStudents, // This represents total assessments
      totalGrades,
      averageGrade: Math.round(averageGrade),
      pendingGrades,
      cacheHitRate: cacheStats.l1?.hitRate || 0,
      dataFreshness
    }
  }, [data, classes, assessments, grades, getCacheStats])

  // Default performance metrics
  const DEFAULT_PERF = {
    loadTime: 0,
    renderTime: 0,
    cacheHitRate: 0,
    dataFreshness: 0,
    userInteractions: 0,
    apiResponseTime: 0,
    memoryUsage: 0
  }

  // Real-time performance monitoring
  const performanceMetrics = useMemo(() => {
    const metrics = performance ?? DEFAULT_PERF
    return {
      loadTime: metrics.loadTime,
      renderTime: metrics.renderTime,
      cacheHitRate: metrics.cacheHitRate,
      dataFreshness: metrics.dataFreshness,
      userInteractions: metrics.userInteractions,
      apiResponseTime: metrics.apiResponseTime,
      memoryUsage: metrics.memoryUsage
    }
  }, [performance])

  // Get recent activities from database
  const recentActivities = useMemo(() => {
    if (!data) return []

    const activities = []

    // Recent assessments
    const recentAssessments: any[] = []

    // Recent grades
    const recentGrades: any[] = []

    return [...recentAssessments, ...recentGrades]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6)
  }, [data])

  // Handle refresh with performance tracking
  const handleRefresh = useCallback(async (forceRefresh = false) => {
    setIsRefreshing(true)
    const startTime = globalThis.performance.now()
    
    try {
      await refreshData(forceRefresh)
      const duration = globalThis.performance.now() - startTime
      // Dashboard refreshed
    } catch (error) {
      // Refresh error
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshData])

  // Recent activity for real-time updates
  const recentActivity = useMemo(() => {
    if (!data) return []
    
    const activities = []
    
    // Recent assessments
    const recentAssessments = assessments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)
      .map(assessment => ({
        type: 'assessment',
        title: `New assessment: ${assessment.title}`,
        time: assessment.createdAt,
        status: assessment.status,
        icon: BookOpen
      }))
    
    // Recent grades
    const recentGrades = grades
      .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime())
      .slice(0, 2)
      .map(grade => ({
        type: 'grade',
        title: `Grade submitted for ${grade.studentName}`,
        time: grade.gradedAt,
        status: 'completed',
        icon: Award
      }))
    
    return [...recentAssessments, ...recentGrades]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5)
  }, [data, assessments, grades])

  // Local state for triggering re-renders
  const [tick, setTick] = useState(0)

  // Performance optimization: Only re-render when necessary
  useEffect(() => {
    const interval = setInterval(() => {
      // Update performance metrics every 5 seconds
      const cacheStats = getCacheStats()
      setTick(t => t + 1) // Trigger re-render for performance updates
    }, 5000)

    return () => clearInterval(interval)
  }, [getCacheStats])

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Loading your data...</p>
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground text-red-600">Error loading data: {error}</p>
          </div>
          <Button onClick={() => handleRefresh(true)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with real-time indicators */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {(user?.name ?? "").split(" ")[0] || "Teacher"}! 
            <span className="ml-2 flex items-center gap-2">
              {isRealTimeConnected ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Data: {(statistics?.dataFreshness ?? 0).toFixed(0)}% fresh
              </span>
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={showPerformanceMetrics} onOpenChange={setShowPerformanceMetrics}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Performance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Performance Metrics</DialogTitle>
                <DialogDescription>Real-time performance monitoring</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Load Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{(performanceMetrics?.loadTime ?? 0).toFixed(0)}ms</div>
                      <Progress value={Math.max(0, Math.min(100, (200 - (performanceMetrics?.loadTime ?? 0)) / 2))} className="mt-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Cache Hit Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{(performanceMetrics?.cacheHitRate ?? 0).toFixed(1)}%</div>
                      <Progress value={Math.max(0, Math.min(100, performanceMetrics?.cacheHitRate ?? 0))} className="mt-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Data Freshness</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{(statistics?.dataFreshness ?? 0).toFixed(0)}%</div>
                      <Progress value={Math.max(0, Math.min(100, statistics?.dataFreshness ?? 0))} className="mt-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">User Interactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{performanceMetrics?.userInteractions ?? 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">Total interactions</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            onClick={() => handleRefresh(false)}
            disabled={isRefreshing}
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          
          <Button onClick={() => onNavigate?.('assignments')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
        </div>
      </div>

      {/* Ultra-fast statistics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalClasses}</div>
            <p className="text-xs text-muted-foreground">Active classes assigned</p>
            <div className="mt-2">
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                onClick={() => onNavigate?.('classes')}
              >
                View all classes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Students across all classes</p>
            <div className="mt-2">
              <Progress value={Math.min(100, (statistics.totalStudents / 200) * 100)} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grades</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.pendingGrades}
            </div>
            <p className="text-xs text-muted-foreground">Assignments to grade</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={statistics.pendingGrades > 0 ? "destructive" : "default"} className="text-xs">
                {statistics.pendingGrades} pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.pendingGrades} pending grades
            </p>
            <div className="mt-2">
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                onClick={() => onNavigate?.('grades')}
              >
                Manage assessments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities from Database */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Your latest teaching activities from the database</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activities found
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const IconComponent = activity.icon
                return (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">
                          {activity.title}
                        </p>
                        <Badge 
                          variant={
                            activity.status === 'completed' ? 'default' :
                            activity.status === 'pending' ? 'secondary' : 'outline'
                          }
                          className="ml-2"
                        >
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main content tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* My Classes Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Classes</CardTitle>
                    <CardDescription>Classes you are teaching this academic year</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => onNavigate?.("classes")} size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {classes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any classes assigned yet. Please contact your administrator.
                    </p>
                    <Button variant="outline" onClick={() => handleRefresh(true)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {classes.slice(0, 3).map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{cls.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {cls.level} • {cls.subsystem} • {cls.currentEnrollment} students
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {cls.subsystem}
                        </Badge>
                      </div>
                    ))}
                    {classes.length > 3 && (
                      <div className="text-center">
                        <Button variant="outline" onClick={() => onNavigate?.("classes")} size="sm">
                          View {classes.length - 3} More Classes
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest actions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <activity.icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.time).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>All Classes</CardTitle>
              <CardDescription>Complete list of your assigned classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classes.map((cls) => (
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
                          <span className="font-medium">{cls.currentEnrollment}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Subjects:</span>
                          <span className="font-medium">{cls.subjects.length}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedClassForStudents({ id: cls.id, name: cls.name })}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Students
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigate?.('assignments')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>Recent Assessments</CardTitle>
              <CardDescription>Your latest assessments and grades</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No assessments created yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    assessments
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 10)
                      .map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">{assessment.title}</TableCell>
                        <TableCell>{assessment.className}</TableCell>
                        <TableCell>{assessment.subjectName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {assessment.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(assessment.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {assessment.statistics.submittedCount}/{assessment.statistics.totalStudents}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Award className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Class Students Dialog */}
      {selectedClassForStudents && (
        <ClassStudentsDialog
          classId={selectedClassForStudents.id}
          className={selectedClassForStudents.name}
          open={!!selectedClassForStudents}
          onOpenChange={(open) => !open && setSelectedClassForStudents(null)}
        />
      )}
    </div>
  )
}
