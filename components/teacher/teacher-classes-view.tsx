"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTeacherClasses } from "@/lib/teacher-classes-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ShimmerList } from "@/components/ui/shimmer-loading"
import { 
  Users, 
  BookOpen, 
  Calendar, 
  MapPin, 
  Clock,
  RefreshCw,
  Eye,
  GraduationCap
} from "lucide-react"
import { ClassDetailsDialog } from "./class-details-dialog"

interface TeacherClassesViewProps {
  onNavigate?: (view: string) => void
}

export function TeacherClassesView({ onNavigate }: TeacherClassesViewProps) {
  const { user } = useAuth()
  const { classes: teacherClasses, getTeacherClasses, isLoading } = useTeacherClasses()
  const [selectedClass, setSelectedClass] = useState<any>(null)
  const [showClassDetails, setShowClassDetails] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadClasses = async () => {
    setIsRefreshing(true)
    try {
      await getTeacherClasses()
    } catch (error) {
      console.error('Error loading teacher classes:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadClasses()
  }, [])

  const handleViewClass = (classData: any) => {
    setSelectedClass(classData)
    setShowClassDetails(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">My Classes</h2>
          <p className="text-muted-foreground">Classes assigned to you by the administrator</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Assigned Classes</CardTitle>
            <CardDescription>Your teaching assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <ShimmerList items={3} />
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
          <h2 className="text-2xl font-bold">My Classes</h2>
          <p className="text-muted-foreground">Classes assigned to you by the administrator</p>
        </div>
        <Button
          variant="outline"
          onClick={loadClasses}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Classes Grid */}
      {teacherClasses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
            <p className="text-muted-foreground mb-4">
              You haven't been assigned to any classes yet. Contact your administrator to get class assignments.
            </p>
            <Button variant="outline" onClick={loadClasses}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teacherClasses.map((classData) => (
            <Card key={classData.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{classData.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {classData.level} • {classData.subsystem} • {classData.branch}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {classData.subsystem}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Students Count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{classData.students.length} students</span>
                </div>

                {/* Subjects */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="h-4 w-4" />
                    <span>Subjects ({classData.subjects?.length || 0})</span>
                  </div>
                  {classData.subjects && classData.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {classData.subjects.slice(0, 3).map((subject: any) => (
                        <Badge key={subject.id} variant="secondary" className="text-xs">
                          {subject.name}
                        </Badge>
                      ))}
                      {classData.subjects.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{classData.subjects.length - 3} more
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No subjects assigned</p>
                  )}
                </div>

                {/* Schedule Preview */}
                {classData.schedule && classData.schedule.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      <span>Schedule</span>
                    </div>
                    <div className="space-y-1">
                      {classData.schedule.slice(0, 2).map((schedule: any) => (
                        <div key={schedule.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{schedule.day} {schedule.startTime}-{schedule.endTime}</span>
                          <span>•</span>
                          <span>{schedule.subject}</span>
                        </div>
                      ))}
                      {classData.schedule.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{classData.schedule.length - 2} more periods
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewClass(classData)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate?.('attendance')}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Class Details Dialog */}
      {selectedClass && (
        <ClassDetailsDialog
          classData={selectedClass}
          open={showClassDetails}
          onOpenChange={setShowClassDetails}
        />
      )}
    </div>
  )
}