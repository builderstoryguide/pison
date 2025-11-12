'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TimetablePeriodEditor } from './timetable-period-editor'
import { 
  Calendar,
  Clock, 
  User, 
  MapPin, 
  BookOpen, 
  Plus,
  Edit3,
  Trash2,
  MoreHorizontal,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react'
// Removed framer-motion import for compatibility

interface TimetablePeriod {
  id: string
  day: string
  startTime: string
  endTime: string
  subject: string
  teacher: string
  room: string
  periodNumber?: number
  periodType?: 'regular' | 'break' | 'lunch' | 'assembly' | 'exam'
  notes?: string
}

interface TimetableClass {
  id: string
  name: string
  level: string
  subsystem: string
  branch: string
  periods: TimetablePeriod[]
  status: 'not_generated' | 'generating' | 'generated' | 'modified' | 'error'
  lastGenerated?: string
  lastModified?: string
  generatedBy?: string
  totalPeriods?: number
  academicYear?: string
  term?: string
}

interface EnhancedTimetableViewProps {
  timetableClass: TimetableClass
  onClose: () => void
  onUpdatePeriod: (periodId: string, updates: Partial<TimetablePeriod>) => Promise<{ success: boolean; error?: string }>
  onCreatePeriod: (period: Omit<TimetablePeriod, 'id'>) => Promise<{ success: boolean; error?: string; periodId?: string }>
  onDeletePeriod: (periodId: string) => Promise<{ success: boolean; error?: string }>
  onRefresh: () => Promise<void>
  teachers: Array<{ id: string; name: string }>
  rooms: Array<{ id: string; name: string }>
  subjects: string[]
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = [
  "08:00", "08:45", "09:30", "10:15", "11:00", "11:45", 
  "12:30", "13:15", "14:00", "14:45", "15:30", "16:15", "17:00"
]

const statusConfig = {
  not_generated: { color: 'bg-gray-100 text-gray-800', label: 'Not Generated' },
  generating: { color: 'bg-blue-100 text-blue-800', label: 'Generating...' },
  generated: { color: 'bg-green-100 text-green-800', label: 'Generated' },
  modified: { color: 'bg-orange-100 text-orange-800', label: 'Modified' },
  error: { color: 'bg-red-100 text-red-800', label: 'Error' }
}

export function EnhancedTimetableView({
  timetableClass,
  onClose,
  onUpdatePeriod,
  onCreatePeriod,
  onDeletePeriod,
  onRefresh,
  teachers,
  rooms,
  subjects
}: EnhancedTimetableViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimetablePeriod | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleCreatePeriod = (_day?: string, _timeSlot?: string) => {
    setSelectedPeriod(null)
    setEditorMode('create')
    setIsEditorOpen(true)
  }

  const handleEditPeriod = (period: TimetablePeriod) => {
    setSelectedPeriod(period)
    setEditorMode('edit')
    setIsEditorOpen(true)
  }

  const handleEditorClose = () => {
    setIsEditorOpen(false)
    setSelectedPeriod(null)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const getConflicts = () => {
    const conflicts: Array<{ type: string; message: string; periods: TimetablePeriod[] }> = []
    const timeSlotMap = new Map<string, TimetablePeriod[]>()

    timetableClass.periods.forEach(period => {
      const key = `${period.day}-${period.startTime}`
      if (!timeSlotMap.has(key)) {
        timeSlotMap.set(key, [])
      }
      timeSlotMap.get(key)!.push(period)
    })

    timeSlotMap.forEach((periods, timeSlot) => {
      if (periods.length > 1) {
        conflicts.push({
          type: 'time_conflict',
          message: `Multiple periods at ${timeSlot.replace('-', ' ')}`,
          periods
        })
      }
    })

    return conflicts
  }

  const conflicts = getConflicts()

  const getStatistics = () => {
    const subjects = Array.from(new Set(timetableClass.periods.map(p => p.subject)))
    const teachersUsed = Array.from(new Set(timetableClass.periods.map(p => p.teacher)))
    const daysWithPeriods = Array.from(new Set(timetableClass.periods.map(p => p.day))).length
    
    return {
      totalPeriods: timetableClass.periods.length,
      subjects: subjects.length,
      teachers: teachersUsed.length,
      daysWithPeriods
    }
  }

  const stats = getStatistics()

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{timetableClass.name}</h2>
              <Badge className={statusConfig[timetableClass.status].color}>
                {statusConfig[timetableClass.status].label}
              </Badge>
              {timetableClass.status === 'generating' && (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              )}
            </div>
            <p className="text-muted-foreground">
              {timetableClass.level} • {timetableClass.subsystem} • {timetableClass.branch}
            </p>
            {timetableClass.lastModified && (
              <p className="text-xs text-muted-foreground">
                Last modified: {new Date(timetableClass.lastModified).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCreatePeriod()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Period
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalPeriods}</div>
                  <div className="text-xs text-muted-foreground">Total Periods</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.subjects}</div>
                  <div className="text-xs text-muted-foreground">Subjects</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.teachers}</div>
                  <div className="text-xs text-muted-foreground">Teachers</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{stats.daysWithPeriods}</div>
                  <div className="text-xs text-muted-foreground">Active Days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conflicts Alert */}
        {conflicts.length > 0 && (
          <div className="transition-all duration-200 ease-in-out">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium text-red-800">
                        {conflicts.length} Scheduling Conflict{conflicts.length !== 1 ? 's' : ''} Detected
                      </div>
                      <div className="text-sm text-red-700">
                        {conflicts.map((conflict, index) => (
                          <div key={index}>{conflict.message}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
        )}

        {/* Timetable Views */}
        <Tabs defaultValue="weekly" className="space-y-4">
          <TabsList>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="daily">Daily View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          {/* Weekly View */}
          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Timetable</CardTitle>
                <CardDescription>
                  Click on any empty slot to add a new period, or click on existing periods to edit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Time</TableHead>
                        {daysOfWeek.map(day => (
                          <TableHead key={day} className="text-center min-w-40">
                            {day}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeSlots.map((startTime, index) => {
                        const endTime = timeSlots[index + 1] || '18:00'
                        
                        return (
                          <TableRow key={startTime}>
                            <TableCell className="font-medium text-sm">
                              <div className="text-center">
                                <div>{startTime}</div>
                                <div className="text-xs text-muted-foreground">to</div>
                                <div>{endTime}</div>
                              </div>
                            </TableCell>
                            {daysOfWeek.map(day => {
                              const period = timetableClass.periods.find(p => 
                                p.day === day && p.startTime === startTime
                              )

                              return (
                                <TableCell key={`${day}-${startTime}`} className="p-1">
                                  {period ? (
                                    <div 
                                      className="p-3 border rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                                      onClick={() => handleEditPeriod(period)}
                                    >
                                      <div className="font-medium text-sm">{period.subject}</div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {period.teacher}
                                      </div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {period.room}
                                      </div>
                                      {period.periodType !== 'regular' && (
                                        <Badge variant="secondary" className="text-xs mt-1">
                                          {period.periodType}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <div 
                                      className="p-3 border-2 border-dashed border-muted-foreground/20 rounded-lg hover:border-muted-foreground/40 cursor-pointer transition-colors text-center"
                                      onClick={() => handleCreatePeriod(day, startTime)}
                                    >
                                      <Plus className="h-4 w-4 mx-auto text-muted-foreground" />
                                      <div className="text-xs text-muted-foreground mt-1">Add Period</div>
                                    </div>
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily View */}
          <TabsContent value="daily" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {daysOfWeek.map(day => {
                const dayPeriods = timetableClass.periods
                  .filter(p => p.day === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))

                return (
                  <Card key={day}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{day}</CardTitle>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCreatePeriod(day)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {dayPeriods.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No periods scheduled</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dayPeriods.map((period) => (
                            <div
                              key={period.id}
                              className="group transition-all duration-200 ease-in-out"
                            >
                                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                  <div className="text-center min-w-16">
                                    <div className="text-sm font-medium">{period.startTime}</div>
                                    <div className="text-xs text-muted-foreground">to</div>
                                    <div className="text-sm font-medium">{period.endTime}</div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium">{period.subject}</div>
                                    <div className="text-sm text-muted-foreground">{period.teacher}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {period.room}
                                    </div>
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleEditPeriod(period)}>
                                          <Edit3 className="mr-2 h-4 w-4" />
                                          Edit Period
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={() => onDeletePeriod(period.id)}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete Period
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Periods</CardTitle>
                    <CardDescription>
                      Complete list of all scheduled periods
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleCreatePeriod()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Period
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timetableClass.periods
                      .sort((a, b) => {
                        const dayOrder = daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day)
                        if (dayOrder !== 0) return dayOrder
                        return a.startTime.localeCompare(b.startTime)
                      })
                      .map((period) => (
                        <TableRow key={period.id}>
                          <TableCell>{period.day}</TableCell>
                          <TableCell>
                            {period.startTime} - {period.endTime}
                          </TableCell>
                          <TableCell className="font-medium">{period.subject}</TableCell>
                          <TableCell>{period.teacher}</TableCell>
                          <TableCell>{period.room}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {period.periodType || 'regular'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditPeriod(period)}>
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit Period
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => onDeletePeriod(period.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Period
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>

                {timetableClass.periods.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No Periods Scheduled</h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by adding your first period to this timetable.
                    </p>
                    <Button onClick={() => handleCreatePeriod()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Period
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Period Editor */}
        <TimetablePeriodEditor
          period={selectedPeriod || undefined}
          isOpen={isEditorOpen}
          onClose={handleEditorClose}
          onSave={onCreatePeriod}
          onUpdate={onUpdatePeriod}
          onDelete={onDeletePeriod}
          teachers={teachers}
          rooms={rooms}
          subjects={subjects}
          mode={editorMode}
        />
      </div>
    </TooltipProvider>
  )
}
