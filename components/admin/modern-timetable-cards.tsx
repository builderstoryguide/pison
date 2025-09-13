'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TimetableStatusIndicator } from './timetable-status-indicator'
import { 
  Calendar,
  Clock,
  Users,
  MapPin,
  MoreHorizontal,
  Eye,
  Trash2,
  Download,
  Search,
  Filter,
  BookOpen,
  GraduationCap,
  Building,
  User
} from 'lucide-react'

interface TimetableClass {
  id: string
  name: string
  level: string
  subsystem: string
  branch: string
  periods: Array<{
    id: string
    day: string
    startTime: string
    endTime: string
    subject: string
    teacher: string
    room: string
  }>
  status: 'not_generated' | 'generating' | 'generated' | 'modified' | 'error'
  lastGenerated?: string
  lastModified?: string
  totalPeriods?: number
  academicYear?: string
  term?: string
}

interface ModernTimetableCardsProps {
  classes: TimetableClass[]
  selectedTimetables: Set<string>
  onSelectTimetable: (classId: string) => void
  onViewTimetable: (classId: string) => void
  onDeleteTimetable: (classId: string) => void
  onExportTimetable: (classId: string) => void
  showOnlyWithTimetables?: boolean
}

export function ModernTimetableCards({
  classes,
  selectedTimetables,
  onSelectTimetable,
  onViewTimetable,
  onDeleteTimetable,
  onExportTimetable,
  showOnlyWithTimetables = false
}: ModernTimetableCardsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubsystem, setFilterSubsystem] = useState<string>('all')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredClasses = classes.filter(classData => {
    const matchesSearch = classData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         classData.level.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubsystem = filterSubsystem === 'all' || classData.subsystem === filterSubsystem
    const matchesLevel = filterLevel === 'all' || classData.level === filterLevel
    const matchesStatus = filterStatus === 'all' || classData.status === filterStatus
    const hasTimtable = !showOnlyWithTimetables || classData.periods.length > 0

    return matchesSearch && matchesSubsystem && matchesLevel && matchesStatus && hasTimtable
  })

  const subsystems = Array.from(new Set(classes.map(c => c.subsystem)))
  const levels = Array.from(new Set(classes.map(c => c.level)))

  const getClassStats = (classData: TimetableClass) => {
    const subjects = Array.from(new Set(classData.periods.map(p => p.subject)))
    const teachers = Array.from(new Set(classData.periods.map(p => p.teacher)))
    const daysWithPeriods = Array.from(new Set(classData.periods.map(p => p.day))).length

    return {
      totalPeriods: classData.periods.length,
      subjects: subjects.length,
      teachers: teachers.length,
      daysWithPeriods
    }
  }

  const getTimeRange = (periods: any[]) => {
    if (periods.length === 0) return null
    
    const times = periods.map(p => p.startTime).sort()
    const endTimes = periods.map(p => p.endTime).sort()
    
    return {
      earliest: times[0],
      latest: endTimes[endTimes.length - 1]
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Enhanced Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filter Timetables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by class name or level..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filterSubsystem} onValueChange={setFilterSubsystem}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subsystems" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subsystems</SelectItem>
                  {subsystems.map(subsystem => (
                    <SelectItem key={subsystem} value={subsystem}>
                      {subsystem.charAt(0).toUpperCase() + subsystem.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="not_generated">Not Generated</SelectItem>
                  <SelectItem value="generating">Generating</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="modified">Modified</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {filteredClasses.length} of {classes.length} classes
                </span>
                {(searchQuery || filterSubsystem !== 'all' || filterLevel !== 'all' || filterStatus !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setFilterSubsystem('all')
                      setFilterLevel('all')
                      setFilterStatus('all')
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timetable Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((classData) => {
            const isSelected = selectedTimetables.has(classData.id)
            const stats = getClassStats(classData)
            const timeRange = getTimeRange(classData.periods)

            return (
              <Card 
                key={classData.id}
                className={`relative transition-all duration-200 hover:shadow-lg group ${
                  isSelected 
                    ? 'ring-2 ring-red-500 bg-red-50/50 dark:bg-red-950/20' 
                    : 'hover:shadow-md'
                }`}
              >
                {/* Selection Overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-red-500/5 rounded-lg pointer-events-none" />
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Selection Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelectTimetable(classData.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                          {classData.name}
                        </CardTitle>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {classData.level}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {classData.subsystem}
                          </Badge>
                          {classData.branch && (
                            <Badge variant="outline" className="text-xs">
                              {classData.branch}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewTimetable(classData.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View/Edit Timetable
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExportTimetable(classData.id)}>
                          <Download className="mr-2 h-4 w-4" />
                          Export Timetable
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeleteTimetable(classData.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Timetable
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between">
                    <TimetableStatusIndicator
                      status={classData.status}
                      lastGenerated={classData.lastGenerated}
                      lastModified={classData.lastModified}
                      totalPeriods={classData.totalPeriods}
                    />
                    
                    {timeRange && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeRange.earliest} - {timeRange.latest}
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  {stats.totalPeriods > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="text-sm font-medium">{stats.totalPeriods}</div>
                              <div className="text-xs text-muted-foreground">Periods</div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total scheduled periods</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="text-sm font-medium">{stats.daysWithPeriods}</div>
                              <div className="text-xs text-muted-foreground">Days</div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Days with scheduled periods</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-md">
                            <BookOpen className="h-4 w-4 text-purple-600" />
                            <div>
                              <div className="text-sm font-medium">{stats.subjects}</div>
                              <div className="text-xs text-muted-foreground">Subjects</div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Different subjects scheduled</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-md">
                            <User className="h-4 w-4 text-orange-600" />
                            <div>
                              <div className="text-sm font-medium">{stats.teachers}</div>
                              <div className="text-xs text-muted-foreground">Teachers</div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Different teachers assigned</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  {/* Empty State */}
                  {stats.totalPeriods === 0 && (
                    <div className="text-center py-4">
                      <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No timetable generated</p>
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewTimetable(classData.id)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {stats.totalPeriods > 0 ? 'View/Edit' : 'Generate'}
                    </Button>
                    
                    {stats.totalPeriods > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExportTimetable(classData.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800 transition-all duration-200">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                        <Trash2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Selected for bulk deletion</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredClasses.length === 0 && (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No Timetables Found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery || filterSubsystem !== 'all' || filterLevel !== 'all' || filterStatus !== 'all'
                    ? "Try adjusting your search criteria or filters"
                    : showOnlyWithTimetables
                    ? "No classes have generated timetables yet"
                    : "No classes available for timetable management"
                  }
                </p>
              </div>
              {(searchQuery || filterSubsystem !== 'all' || filterLevel !== 'all' || filterStatus !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterSubsystem('all')
                    setFilterLevel('all')
                    setFilterStatus('all')
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}
