"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { 
  Users, 
  BookOpen, 
  Calendar, 
  MapPin, 
  Clock,
  RefreshCw,
  Eye,
  GraduationCap,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  MoreHorizontal,
  UserCheck,
  Award,
  TrendingUp,
  Activity,
  Zap
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useTeacher, useTeacherClasses, useTeacherStudents } from '@/lib/teacher-ultra-fast/context'
import { TeacherClass, TeacherClassStudent } from '@/lib/teacher-ultra-fast/types'
import { cn } from '@/lib/utils'

interface UltraFastClassesViewProps {
  onNavigate?: (view: string) => void
}

// Virtual scrolling component for large lists
interface VirtualListProps {
  items: any[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: any, index: number) => React.ReactNode
  className?: string
}

function VirtualList({ items, itemHeight, containerHeight, renderItem, className }: VirtualListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(visibleStart + Math.ceil(containerHeight / itemHeight) + 1, items.length)
  const visibleItems = items.slice(visibleStart, visibleEnd)

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleStart * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={item.id} style={{ height: itemHeight }}>
              {renderItem(item, visibleStart + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Class card component with performance optimization
const ClassCard = React.memo(({ 
  classData, 
  onViewDetails, 
  onViewGrades 
}: { 
  classData: TeacherClass
  onViewDetails: (classData: TeacherClass) => void
  onViewGrades: (classData: TeacherClass) => void
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all duration-200 cursor-pointer",
        isHovered && "shadow-lg scale-[1.02]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{classData.name}</CardTitle>
            <CardDescription className="mt-1">
              {classData.level} • {classData.subsystem} • {classData.branch}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {classData.subsystem}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(classData)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewGrades(classData)}>
                  <Award className="h-4 w-4 mr-2" />
                  View Grades
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Students Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{classData.currentEnrollment} students</span>
          <div className="ml-auto">
            <Progress 
              value={(classData.currentEnrollment / classData.capacity) * 100} 
              className="w-16 h-2" 
            />
          </div>
        </div>

        {/* Subjects */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookOpen className="h-4 w-4" />
            <span>Subjects ({classData.subjects.length})</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {classData.subjects.slice(0, 3).map((subject) => (
              <Badge key={subject.id} variant="secondary" className="text-xs">
                {subject.name}
              </Badge>
            ))}
            {classData.subjects.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{classData.subjects.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Schedule Preview */}
        {classData.schedule && classData.schedule.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              <span>Schedule</span>
            </div>
            <div className="space-y-1">
              {classData.schedule.slice(0, 2).map((schedule) => (
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

        {/* Performance Metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>Performance</span>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Grade:</span>
              <span className="font-medium">{classData.performance.averageGrade.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails(classData)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewGrades(classData)}
          >
            <Award className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

ClassCard.displayName = 'ClassCard'

// Class details dialog
const ClassDetailsDialog = ({ 
  classData, 
  open, 
  onOpenChange 
}: { 
  classData: TeacherClass | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const { students } = useTeacherStudents()

  if (!classData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {classData.name} - Class Details
          </DialogTitle>
          <DialogDescription>
            {classData.level} • {classData.subsystem} • {classData.branch}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
            <TabsTrigger value="subjects">Subjects ({classData.subjects.length})</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Class Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class Code:</span>
                    <span className="font-medium">{classData.code || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Academic Year:</span>
                    <span className="font-medium">{classData.academicYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium">{classData.currentEnrollment}/{classData.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room:</span>
                    <span className="font-medium">{classData.room || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Grade</span>
                      <span className="font-medium">{classData.performance.averageGrade.toFixed(1)}%</span>
                    </div>
                    <Progress value={classData.performance.averageGrade} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assessments:</span>
                      <span className="font-medium">{classData.performance.totalAssessments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-medium">{classData.performance.completedAssessments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Students ({students.length})</h3>
            </div>
            <div className="grid gap-2">
              {students.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.photo} alt={`${student.firstName} ${student.lastName}`} />
                    <AvatarFallback>
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {student.firstName} {student.lastName}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      ID: {student.studentId} • {student.enrollmentStatus}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{student.grades.averageGrade.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Avg Grade</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <h3 className="text-lg font-semibold">Subjects ({classData.subjects.length})</h3>
            <div className="grid gap-3">
              {classData.subjects.map((subject) => (
                <Card key={subject.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{subject.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {subject.code} • Coefficient: {subject.coefficient}
                        </p>
                        {subject.description && (
                          <p className="text-sm text-muted-foreground mt-1">{subject.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {subject.isPrimary && (
                          <Badge variant="default">Primary</Badge>
                        )}
                        <Badge variant="outline">{subject.schedule.length} periods</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <h3 className="text-lg font-semibold">Class Schedule</h3>
            <div className="space-y-2">
              {classData.schedule.map((schedule) => (
                <div key={schedule.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{schedule.day}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{schedule.startTime} - {schedule.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{schedule.subject}</span>
                  </div>
                  {schedule.room && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{schedule.room}</span>
                    </div>
                  )}
                  <Badge variant="outline">{schedule.period}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function UltraFastClassesView({ onNavigate }: UltraFastClassesViewProps) {
  const { classes, isLoading } = useTeacherClasses()
  const { refreshData } = useTeacher()
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null)
  const [showClassDetails, setShowClassDetails] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'students' | 'grades'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterBy, setFilterBy] = useState<'all' | 'english' | 'french'>('all')

  // Memoized filtered and sorted classes
  const filteredClasses = useMemo(() => {
    let filtered = classes

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(cls => 
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.level.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.branch.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by subsystem
    if (filterBy !== 'all') {
      filtered = filtered.filter(cls => cls.subsystem === filterBy)
    }

    // Sort classes (create a copy to avoid mutating the original array)
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'students':
          aValue = a.currentEnrollment
          bValue = b.currentEnrollment
          break
        case 'grades':
          aValue = a.performance.averageGrade
          bValue = b.performance.averageGrade
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return sorted
  }, [classes, searchQuery, sortBy, sortOrder, filterBy])

  const handleRefresh = useCallback(async (forceRefresh = false) => {
    setIsRefreshing(true)
    try {
      await refreshData(forceRefresh)
    } catch (error) {
      // Error refreshing classes
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshData])

  const handleViewDetails = useCallback((classData: TeacherClass) => {
    setSelectedClass(classData)
    setShowClassDetails(true)
  }, [])


  const handleViewGrades = useCallback((classData: TeacherClass) => {
    onNavigate?.('grades')
  }, [onNavigate])

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">My Classes</h2>
          <p className="text-muted-foreground">Loading your assigned classes...</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Classes</h2>
          <p className="text-muted-foreground">
            {filteredClasses.length} of {classes.length} classes
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleRefresh(true)}
            disabled={isRefreshing}
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="grades">Grades</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortOrder}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
              
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Display */}
      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No classes found' : 'No Classes Assigned'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? `No classes match your search "${searchQuery}". Try adjusting your filters.`
                : "You haven't been assigned to any classes yet. Contact your administrator to get class assignments."
              }
            </p>
            {searchQuery ? (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            ) : (
              <Button variant="outline" onClick={() => handleRefresh(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Again
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((classData) => (
                <ClassCard
                  key={classData.id}
                  classData={classData}
                  onViewDetails={handleViewDetails}
                  onViewGrades={handleViewGrades}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <VirtualList
                  items={filteredClasses}
                  itemHeight={120}
                  containerHeight={600}
                  renderItem={(classData) => (
                    <div className="p-4 border-b last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{classData.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {classData.level} • {classData.subsystem} • {classData.branch}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-medium">{classData.currentEnrollment}</div>
                            <div className="text-xs text-muted-foreground">Students</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">{classData.performance.averageGrade.toFixed(1)}%</div>
                            <div className="text-xs text-muted-foreground">Avg Grade</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(classData)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Class Details Dialog */}
      <ClassDetailsDialog
        classData={selectedClass}
        open={showClassDetails}
        onOpenChange={setShowClassDetails}
      />
    </div>
  )
}
