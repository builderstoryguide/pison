'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { 
  Calendar,
  Clock,
  Users,
  MapPin,
  MoreHorizontal,
  Eye,
  Trash2,
  Download,
  CheckSquare,
  Square,
  Filter
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
}

interface EnhancedTimetableSelectionProps {
  classes: TimetableClass[]
  selectedTimetables: Set<string>
  onSelectTimetable: (classId: string) => void
  onSelectAll: () => void
  selectAll: boolean
  onViewTimetable: (classId: string) => void
  onDeleteTimetable: (classId: string) => void
  onExportTimetable: (classId: string) => void
}

export function EnhancedTimetableSelection({
  classes,
  selectedTimetables,
  onSelectTimetable,
  onSelectAll,
  selectAll,
  onViewTimetable,
  onDeleteTimetable,
  onExportTimetable
}: EnhancedTimetableSelectionProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterSubsystem, setFilterSubsystem] = useState<string>('all')

  const classesWithTimetables = classes.filter(c => c.periods.length > 0)
  const filteredClasses = filterSubsystem === 'all' 
    ? classesWithTimetables 
    : classesWithTimetables.filter(c => c.subsystem === filterSubsystem)

  const subsystems = Array.from(new Set(classesWithTimetables.map(c => c.subsystem)))

  const getClassStats = (classData: TimetableClass) => {
    const days = new Set(classData.periods.map(p => p.day)).size
    const subjects = new Set(classData.periods.map(p => p.subject)).size
    const teachers = new Set(classData.periods.map(p => p.teacher)).size
    
    return { days, subjects, teachers }
  }

  if (classesWithTimetables.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetables Generated</h3>
        <p className="text-gray-600">
          Generate timetables for your classes to enable bulk deletion options.
        </p>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectAll}
                onCheckedChange={onSelectAll}
                className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
              />
              <span className="text-sm font-medium">
                Select All ({filteredClasses.length} timetables)
              </span>
            </div>
            
            {selectedTimetables.size > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {selectedTimetables.size} selected for deletion
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Subsystem Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {filterSubsystem === 'all' ? 'All Subsystems' : filterSubsystem}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Subsystem</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterSubsystem('all')}>
                  All Subsystems ({classesWithTimetables.length})
                </DropdownMenuItem>
                {subsystems.map(subsystem => (
                  <DropdownMenuItem 
                    key={subsystem}
                    onClick={() => setFilterSubsystem(subsystem)}
                  >
                    {subsystem} ({classesWithTimetables.filter(c => c.subsystem === subsystem).length})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Timetables Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredClasses.map((classData) => {
              const isSelected = selectedTimetables.has(classData.id)
              const stats = getClassStats(classData)

              return (
                <motion.div
                  key={classData.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className={`relative transition-all duration-200 hover:shadow-md ${
                      isSelected 
                        ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-950/20' 
                        : 'hover:shadow-lg'
                    }`}
                  >
                    {/* Selection Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-red-500/10 rounded-lg pointer-events-none" />
                    )}

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => onSelectTimetable(classData.id)}
                                className={`mt-1 ${
                                  isSelected 
                                    ? 'data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600' 
                                    : ''
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isSelected ? 'Deselect' : 'Select'} for deletion</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <div className="flex-1">
                            <CardTitle className="text-base">{classData.name}</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {classData.level}
                            </p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onViewTimetable(classData.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Timetable
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onExportTimetable(classData.id)}>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDeleteTimetable(classData.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Individual
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Class Info */}
                      <div className="flex gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {classData.subsystem}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {classData.branch}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{classData.periods.length} periods</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Total scheduled periods</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{stats.days} days</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Days with scheduled periods</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>{stats.teachers} teachers</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Unique teachers assigned</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span>{stats.subjects} subjects</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Different subjects scheduled</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800"
                        >
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                            <CheckSquare className="h-4 w-4" />
                            <span className="text-xs font-medium">Selected for deletion</span>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {filteredClasses.length === 0 && filterSubsystem !== 'all' && (
          <Card className="p-8 text-center">
            <Filter className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetables Found</h3>
            <p className="text-gray-600 mb-4">
              No timetables found for the "{filterSubsystem}" subsystem.
            </p>
            <Button variant="outline" onClick={() => setFilterSubsystem('all')}>
              Show All Timetables
            </Button>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}
