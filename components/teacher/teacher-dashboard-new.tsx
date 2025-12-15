"use client";

import { useEffect } from "react";

import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  GraduationCap,
  FileText,
  ClipboardList,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useTeacherAssignments } from "@/hooks/use-teacher-assignments";
import { useQueryClient } from "@tanstack/react-query";
import { useGradeEntryStats } from "@/hooks/use-grade-entry-status";
import { Progress } from "@/components/ui/progress";
import { QuickEntryWidget } from "@/components/teacher/grades/quick-entry-widget";

interface TeacherDashboardNewProps {
  onNavigate?: (view: string, classId?: string, subjectId?: string) => void;
}

export function TeacherDashboardNew({ onNavigate }: TeacherDashboardNewProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    data: classes = [],
    isLoading: loading,
    error,
  } = useTeacherAssignments();

  // Get grade entry statistics
  const { stats, isLoading: loadingStats } = useGradeEntryStats();



  // Prefetch grade history
  const prefetchGradeHistory = () => {
    queryClient.prefetchQuery({
      queryKey: ['grade-history', user?.id],
      queryFn: async () => {
        if (!user?.id) return []
        const res = await fetch(`/api/grades/history?teacherId=${user.id}`)
        if (!res.ok) throw new Error("Failed to fetch grade history")
        const data = await res.json()
        if (!data.success) throw new Error(data.error || "Failed to fetch grade history")
        return data.history || []
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Prefetch class students when hovering over class card
  const prefetchClassStudents = (classId: string | number) => {
    queryClient.prefetchQuery({
      queryKey: ['class-students', classId.toString()],
      queryFn: async () => {
        const response = await fetch(`/api/classes/${classId}/students`)
        if (!response.ok) throw new Error('Failed to fetch students')
        const data = await response.json()
        return data.students || []
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Prefetch gradable items (subjects) for a class
  const prefetchGradableItems = (classId: string | number) => {
    if (!user?.id) return
    queryClient.prefetchQuery({
      queryKey: ['gradable-items', classId.toString(), user.id],
      queryFn: async () => {
        const response = await fetch(`/api/classes/${classId}/subjects?teacherId=${user.id}`)
        if (!response.ok) throw new Error('Failed to fetch subjects')
        const data = await response.json()
        if (!data.success) throw new Error(data.error || 'Failed to fetch subjects')
        return data.subjects || []
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Prefetch grade entry data for a specific class-subject combination
  const prefetchGradeEntryData = (classId: string | number, subjectId: string | number) => {
    if (!user?.id) return
    queryClient.prefetchQuery({
      queryKey: ['grade-entry-status', user.id, classId.toString(), subjectId.toString()],
      queryFn: async () => {
        const params = new URLSearchParams({
          teacherId: user.id,
          classId: classId.toString(),
          subjectId: subjectId.toString()
        })
        const response = await fetch(`/api/grades/entry-status?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch grade entry status')
        const data = await response.json()
        if (!data.success) throw new Error(data.error || 'Failed to fetch grade entry status')
        return data
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Prefetch sequence configuration on mount
  useEffect(() => {
    if (classes.length > 0 && classes[0]?.academicYear) {
      const academicYear = classes[0].academicYear
      queryClient.prefetchQuery({
        queryKey: ['sequence-configuration', academicYear],
        queryFn: async () => {
          const response = await fetch(`/api/sequences/configuration?academicYear=${encodeURIComponent(academicYear)}`)
          if (!response.ok) throw new Error('Failed to fetch sequence configuration')
          return response.json()
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  }, [classes, queryClient]);

  // Calculate statistics with proper data validation
  const totalClasses = classes.length;
  const totalStudents = classes.reduce(
    (sum, cls) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const count = (cls as any).studentCount ?? (cls as any).currentEnrollment ?? 0;
      return sum + (typeof count === 'number' ? count : 0);
    },
    0
  );
  const uniqueSubjects = new Set(
    classes.flatMap((cls) => {
      if (!cls.subjects || !Array.isArray(cls.subjects)) return [];
      return cls.subjects
        .map((s) => s?.id)
        .filter((id): id is string | number => id != null && (typeof id === 'string' || typeof id === 'number'));
    })
  );

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
    );
  }

  if (error) {
    return (
      <div className="space-y-6 px-4 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">
              Error Loading Dashboard
            </CardTitle>
            <CardDescription>
              {error instanceof Error
                ? error.message
                : "Failed to load assignments"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name?.split(" ")[0]}! Here&apos;s an overview
            of your teaching assignments.
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
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
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
            <CardTitle className="text-sm font-medium">Grade Entry Progress</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.completionPercentage}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedSequences}/{stats.totalSequences} sequences
                </p>
                <Progress value={stats.completionPercentage} className="mt-2 h-2" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grade Entry Progress Section */}
      {!loadingStats && stats.totalSequences > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Grade Entry Progress</CardTitle>
            <CardDescription>
              Track your progress entering grades for all sequences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.completedSequences}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.pendingSequences}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.totalClasses}</div>
                  <div className="text-sm text-muted-foreground">Classes</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => onNavigate?.("grades")}
                onMouseEnter={() => {
                  // Prefetch data for first class and subject when hovering
                  if (classes.length > 0) {
                    const firstClass = classes[0]
                    prefetchClassStudents(firstClass.id)
                    prefetchGradableItems(firstClass.id)
                    if (Array.isArray(firstClass.subjects) && firstClass.subjects.length > 0 && firstClass.subjects[0]?.id) {
                      prefetchGradeEntryData(firstClass.id, firstClass.subjects[0].id)
                    }
                  }
                }}
                className="flex-1"
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Enter Grades
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate?.("grades-history")}
                onMouseEnter={prefetchGradeHistory}
              >
                <FileText className="mr-2 h-4 w-4" />
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Entry Widget */}
      {!loadingStats && stats.totalSequences > 0 && (
        <QuickEntryWidget
          onEnterGrades={(classId: string, subjectId: string, sequenceId?: string, term?: string) => {
            if (typeof window !== 'undefined') {
              // Store selection in localStorage for grade entry page
              if (classId) {
                localStorage.setItem('selectedClassId', classId)
              }
              if (subjectId) {
                localStorage.setItem('selectedSubjectId', subjectId)
              }
              if (sequenceId) {
                localStorage.setItem('selectedSequenceId', sequenceId)
              }
              if (term) {
                localStorage.setItem('selectedTerm', term)
              }
            }
            
            if (classId && subjectId) {
              onNavigate?.("grades", classId, subjectId)
            } else {
              onNavigate?.("grades")
            }
          }}
        />
      )}

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
                You don&apos;t have any classes assigned yet. Please contact
                your administrator.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((classItem) => (
              <Card
                key={classItem.id}
                className="hover:shadow-lg transition-shadow"
                onMouseEnter={() => {
                  prefetchClassStudents(classItem.id)
                  prefetchGradableItems(classItem.id)
                  // Prefetch grade entry status for first subject if available
                  if (Array.isArray(classItem.subjects) && classItem.subjects.length > 0 && classItem.subjects[0]?.id) {
                    prefetchGradeEntryData(classItem.id, classItem.subjects[0].id)
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {classItem.name}
                      </CardTitle>
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
                    <span className="font-medium">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(classItem as any).studentCount ?? (classItem as any).currentEnrollment ?? 0}
                    </span>
                  </div>

                  {/* Subjects */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Subjects ({Array.isArray(classItem.subjects) ? classItem.subjects.length : 0})
                      </span>
                    </div>
                    {Array.isArray(classItem.subjects) && classItem.subjects.length > 0 ? (
                      <div className="space-y-1">
                        {classItem.subjects.slice(0, 3).map((subject) => {
                          if (!subject || !subject.id) return null;
                          return (
                            <div
                              key={subject.id}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                            >
                              <span className="font-medium truncate">
                                {subject.name || 'Unknown Subject'}
                              </span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {subject.code || 'N/A'}
                              </Badge>
                            </div>
                          );
                        })}
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
