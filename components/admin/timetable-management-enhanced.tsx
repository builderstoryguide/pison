"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Download, Calendar, Clock, MapPin, User, Users, BookOpen, Save, RefreshCw, AlertCircle, FileText, Eye, Printer, Settings, Trash2 as TrashIcon, X } from 'lucide-react'
import { ImprovedBulkDeleteSystem } from './improved-bulk-delete-system'
import { ModernTimetableCards } from './modern-timetable-cards'
import { EnhancedTimetableView } from './enhanced-timetable-view'
import { TimetableStatusIndicator } from './timetable-status-indicator'
import { TimetableStatusBanner } from './timetable-status-banner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { useEnhancedTimetable } from '@/lib/enhanced-timetable-context'
import { useToast } from '@/hooks/use-toast'
import { ShimmerTimetableGrid, ShimmerList } from '@/components/ui/shimmer-loading'
// TimetableOptionsComponent import removed - component doesn't exist

// Types
interface TimetablePeriod {
  id: string
  day: string
  startTime: string
  endTime: string
  subject: string
  teacher: string
  room: string
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

interface TimetableGenerationOptions {
  schoolStartTime?: string
  schoolEndTime?: string
  periodDuration?: number
  breakDuration?: number
  includeLunchBreak?: boolean
  lunchBreakStartTime?: string
  lunchBreakDuration?: number
  daysPerWeek?: number
  periodsPerDay?: number
  customPeriodsPerDay?: boolean
  mondayPeriods?: number
  tuesdayPeriods?: number
  wednesdayPeriods?: number
  thursdayPeriods?: number
  fridayPeriods?: number
  saturdayPeriods?: number
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = [
  "08:00-08:45", "08:45-09:30", "09:30-10:15", "10:15-11:00",
  "11:00-11:45", "11:45-12:30", "12:30-13:15", "13:15-14:00",
  "14:00-14:45", "14:45-15:30", "15:30-16:15", "16:15-17:00"
]

export function TimetableManagementEnhanced() {
  const { 
    classes, 
    teachers, 
    rooms, 
    isLoading, 
    error, 
    generateTimetable, 
    deleteTimetable, 
    bulkDeleteTimetables,
    exportTimetable,
    refreshClasses,
    loadClassesWithFilters,
    createPeriod,
    updatePeriod,
    deletePeriod,
    updateTimetableStatus
  } = useEnhancedTimetable()
  
  const { toast } = useToast()
  
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("all")
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGenerationOptions, setShowGenerationOptions] = useState(false)
  const [generationOptions, setGenerationOptions] = useState<TimetableGenerationOptions>({})

  // Generation selection state (for classes without timetables)
  const [selectedClassesForGeneration, setSelectedClassesForGeneration] = useState<Set<string>>(new Set())
  const [selectAllForGeneration, setSelectAllForGeneration] = useState(false)
  const [isGenerationDialogOpen, setIsGenerationDialogOpen] = useState(false)

  // Bulk selection state (for classes with timetables - for deletion)
  const [selectedTimetables, setSelectedTimetables] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Timetable viewing state
  const [viewingTimetable, setViewingTimetable] = useState<TimetableClass | null>(null)
  const [recentlyGenerated, setRecentlyGenerated] = useState<Set<string>>(new Set())
  const [statusBanners, setStatusBanners] = useState<TimetableClass[]>([])

  // Empty state component
  const EmptyState = ({ message, description }: { message: string; description: string }) => (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <Calendar className="h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold">{message}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  )

  // Load classes on component mount
  useEffect(() => {
    loadClassesWithFilters({ 
      subsystem: selectedSubsystem === 'all' ? undefined : selectedSubsystem,
      branch: selectedBranch === 'all' ? undefined : selectedBranch,
      academicYear: '2024-2025'
    })
  }, [selectedSubsystem, selectedBranch, loadClassesWithFilters])

  // Handle timetable generation
  const handleGenerateTimetable = async (classId: string, options?: TimetableGenerationOptions) => {
    setIsGenerating(true)
    
    // Update status to generating
    await updateTimetableStatus(classId, 'generating', { generatedBy: 'admin' })
    
    try {
      const result = await generateTimetable(classId, '2024-2025', 'first', 'admin', options)
      if (result.success) {
        // Update status to generated
        await updateTimetableStatus(classId, 'generated', { 
          generatedBy: 'admin',
          lastModified: new Date().toISOString()
        })
        
        // Add to recently generated set
        setRecentlyGenerated(prev => new Set(prev).add(classId))
        
        // Refresh classes to get updated data
        await refreshClasses()
        
        // Find the generated class and add to status banners
        const generatedClass = classes.find(c => c.id === classId)
        if (generatedClass) {
          const updatedClass = {
            ...generatedClass,
            status: 'generated' as const,
            lastGenerated: new Date().toISOString(),
            generatedBy: 'admin'
          }
          setStatusBanners(prev => [updatedClass, ...prev.filter(c => c.id !== classId)])
        }
        
        toast.success("Timetable generated successfully", {
          description: `${generatedClass?.name || 'Class'} timetable is now ready for use`
        })
      } else {
        // Update status to error
        await updateTimetableStatus(classId, 'error', { generatedBy: 'admin' })
        toast.error("Failed to generate timetable", { description: result.error })
      }
    } catch (error) {
      // Update status to error
      await updateTimetableStatus(classId, 'error', { generatedBy: 'admin' })
      toast.error("An unexpected error occurred", { description: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setIsGenerating(false)
      setShowGenerationOptions(false)
    }
  }

  const handleGenerateWithOptions = async (options: TimetableGenerationOptions) => {
    if (!selectedClass) return
    await handleGenerateTimetable(selectedClass, options)
  }

  // Handle timetable deletion
  const handleDeleteTimetable = async (classId: string) => {
    try {
      const result = await deleteTimetable(classId)
      if (result.success) {
        toast.success("Timetable deleted successfully")
        await refreshClasses()
      } else {
        toast.error("Failed to delete timetable", { description: result.error })
      }
    } catch (error) {
      toast.error("An unexpected error occurred", { description: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  // Export handlers
  const handleExportTimetable = async (classId: string) => {
    try {
      await exportTimetable(classId)
      toast.success("Timetable exported successfully")
    } catch (error) {
      toast.error("Failed to export timetable", { description: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTimetables(new Set())
      setSelectAll(false)
    } else {
      const classesWithTimetables = classes.filter(c => c.periods.length > 0)
      setSelectedTimetables(new Set(classesWithTimetables.map(c => c.id)))
      setSelectAll(true)
    }
  }

  const handleSelectTimetable = (classId: string) => {
    const newSelection = new Set(selectedTimetables)
    if (newSelection.has(classId)) {
      newSelection.delete(classId)
    } else {
      newSelection.add(classId)
    }
    setSelectedTimetables(newSelection)
    
    const classesWithTimetables = classes.filter(c => c.periods.length > 0)
    setSelectAll(newSelection.size === classesWithTimetables.length && classesWithTimetables.length > 0)
  }

  const handleBulkDelete = async () => {
    if (selectedTimetables.size === 0) {
      toast.warning("No timetables selected for deletion")
      return
    }

    const result = await bulkDeleteTimetables(Array.from(selectedTimetables))
    
    if (result.success) {
      if (result.errors.length > 0) {
        toast.warning(`Deleted ${result.deletedCount} timetables with ${result.errors.length} errors`)
      } else {
        toast.success(`Successfully deleted ${result.deletedCount} timetables`)
      }
      setSelectedTimetables(new Set())
      setSelectAll(false)
      await refreshClasses()
    } else {
      toast.error("Failed to delete timetables", { description: result.errors[0] })
    }
  }

  // Generation selection handlers
  const handleSelectAllForGeneration = () => {
    if (selectAllForGeneration) {
      setSelectedClassesForGeneration(new Set())
      setSelectAllForGeneration(false)
    } else {
      const classesWithoutTimetables = classes.filter(c => c.periods.length === 0)
      setSelectedClassesForGeneration(new Set(classesWithoutTimetables.map(c => c.id)))
      setSelectAllForGeneration(true)
    }
  }

  const handleSelectClassForGeneration = (classId: string) => {
    const newSelection = new Set(selectedClassesForGeneration)
    if (newSelection.has(classId)) {
      newSelection.delete(classId)
    } else {
      newSelection.add(classId)
    }
    setSelectedClassesForGeneration(newSelection)
    
    const classesWithoutTimetables = classes.filter(c => c.periods.length === 0)
    setSelectAllForGeneration(newSelection.size === classesWithoutTimetables.length && classesWithoutTimetables.length > 0)
  }

  const handleBulkGenerateTimetables = async () => {
    setIsGenerating(true)
    try {
      const promises = Array.from(selectedClassesForGeneration).map(classId => 
        generateTimetable(classId, '2024-2025', 'first', 'admin')
      )
      
      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      if (successful > 0) {
        toast.success(`Generated ${successful} timetables successfully${failed > 0 ? ` (${failed} failed)` : ''}`)
        setSelectedClassesForGeneration(new Set())
        setSelectAllForGeneration(false)
        await refreshClasses()
      } else {
        toast.error("Failed to generate any timetables")
      }
    } catch (error) {
      toast.error("An unexpected error occurred during bulk generation", { description: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setIsGenerating(false)
      setIsGenerationDialogOpen(false)
    }
  }

  const handleConfirmBulkGeneration = () => {
    setIsGenerationDialogOpen(true)
  }

  // Enhanced timetable view handlers
  const handleViewTimetable = (timetableClass: TimetableClass) => {
    setViewingTimetable(timetableClass)
  }

  const handleCloseView = () => {
    setViewingTimetable(null)
  }

  const handleCreatePeriod = async (period: Omit<TimetablePeriod, 'id'>) => {
    if (!viewingTimetable) return { success: false, error: 'No timetable selected' }
    
    const result = await createPeriod(viewingTimetable.id, period)
    if (result.success) {
      await refreshClasses()
      // Update the viewing timetable with the new data
      const updatedClass = classes.find(c => c.id === viewingTimetable.id)
      if (updatedClass) {
        setViewingTimetable(updatedClass)
      }
    }
    return result
  }

  const handleUpdatePeriod = async (periodId: string, updates: Partial<TimetablePeriod>) => {
    if (!viewingTimetable) return { success: false, error: 'No timetable selected' }
    
    const result = await updatePeriod(viewingTimetable.id, periodId, updates)
    if (result.success) {
      await refreshClasses()
      // Update the viewing timetable with the new data
      const updatedClass = classes.find(c => c.id === viewingTimetable.id)
      if (updatedClass) {
        setViewingTimetable(updatedClass)
      }
    }
    return result
  }

  const handleDeletePeriod = async (periodId: string) => {
    if (!viewingTimetable) return { success: false, error: 'No timetable selected' }
    
    const result = await deletePeriod(viewingTimetable.id, periodId)
    if (result.success) {
      await refreshClasses()
      // Update the viewing timetable with the new data
      const updatedClass = classes.find(c => c.id === viewingTimetable.id)
      if (updatedClass) {
        setViewingTimetable(updatedClass)
      }
    }
    return result
  }

  // Show enhanced timetable view if viewing a specific timetable
  if (viewingTimetable) {
    return (
      <EnhancedTimetableView
        timetableClass={viewingTimetable}
        onClose={handleCloseView}
        onUpdatePeriod={handleUpdatePeriod}
        onCreatePeriod={handleCreatePeriod}
        onDeletePeriod={handleDeletePeriod}
        onRefresh={refreshClasses}
        teachers={teachers}
        rooms={rooms}
        subjects={['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'French Language', 'Literature', 'Economics', 'Computer Science']}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Timetable Management</h1>
          <p className="text-muted-foreground">Advanced timetable generation and management system</p>
        </div>
        
        {/* Shimmer for filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter classes by subsystem and branch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Shimmer for timetable list */}
        <Card>
          <CardHeader>
            <CardTitle>Available Classes</CardTitle>
            <CardDescription>Select a class to generate or view its timetable</CardDescription>
          </CardHeader>
          <CardContent>
            <ShimmerList items={6} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="flex items-center gap-4 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <div>
            <h3 className="text-lg font-semibold">Error Loading Timetables</h3>
            <p>{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable Management</h1>
          <p className="text-muted-foreground">
            Generate, manage, and export class timetables
          </p>
        </div>
        <Button onClick={() => refreshClasses()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Banners */}
      {statusBanners.length > 0 && (
        <div className="space-y-4">
          {statusBanners.map((timetableClass) => (
            <TimetableStatusBanner
              key={timetableClass.id}
              timetableClass={timetableClass}
              onViewTimetable={() => handleViewTimetable(timetableClass)}
              onDismiss={() => {
                setStatusBanners(prev => prev.filter(c => c.id !== timetableClass.id))
                setRecentlyGenerated(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(timetableClass.id)
                  return newSet
                })
              }}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedSubsystem} onValueChange={setSelectedSubsystem}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select subsystem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subsystems</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="french">French</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="grammar">Grammar</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Generation Toolbar */}
      {selectedClassesForGeneration.size > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedClassesForGeneration.size} class{selectedClassesForGeneration.size !== 1 ? 'es' : ''} selected for generation
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleConfirmBulkGeneration}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Generate Timetables
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedClassesForGeneration(new Set())
                setSelectAllForGeneration(false)
              }}
              disabled={isGenerating}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

        {/* Improved Bulk Delete System */}
        <ImprovedBulkDeleteSystem
          classes={classes}
          selectedTimetables={selectedTimetables}
          onSelectTimetable={handleSelectTimetable}
          onSelectAll={handleSelectAll}
          onClearSelection={() => {
            setSelectedTimetables(new Set())
            setSelectAll(false)
          }}
          onDelete={handleBulkDelete}
          selectAll={selectAll}
          isDeleting={isLoading}
        />

      {/* Modern Timetable Cards */}
      <ModernTimetableCards
        classes={classes}
        selectedTimetables={selectedTimetables}
        onSelectTimetable={handleSelectTimetable}
        onViewTimetable={(classId) => {
          const timetableClass = classes.find(c => c.id === classId)
          if (timetableClass) {
            handleViewTimetable(timetableClass)
          }
        }}
        onDeleteTimetable={handleDeleteTimetable}
        onExportTimetable={handleExportTimetable}
        showOnlyWithTimetables={true}
      />

      {/* Classes without timetables - Generation Section */}
      {classes.filter(c => c.periods.length === 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generate New Timetables</CardTitle>
            <CardDescription>
              Classes that don't have timetables yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <div className="flex flex-col gap-1">
                      <Checkbox
                        checked={selectAllForGeneration}
                        onCheckedChange={handleSelectAllForGeneration}
                        aria-label="Select all classes for generation"
                      />
                      <span className="text-xs text-muted-foreground">All</span>
                    </div>
                  </TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Subsystem</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.filter(c => c.periods.length === 0).map((classData) => (
                  <TableRow key={classData.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedClassesForGeneration.has(classData.id)}
                        onCheckedChange={() => handleSelectClassForGeneration(classData.id)}
                        aria-label={`Select ${classData.name} for generation`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{classData.name}</TableCell>
                    <TableCell>{classData.level}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {classData.subsystem}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {classData.branch}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleGenerateTimetable(classData.id)}
                          disabled={isGenerating}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClass(classData.id)
                            setShowGenerationOptions(true)
                          }}
                          disabled={isGenerating}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Options
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Timetable View Dialog */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {classes.find(c => c.id === selectedClass)?.name} Timetable
                </CardTitle>
                <CardDescription>
                  View and manage the timetable for this class
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedClass("")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly" className="space-y-4">
              <TabsList>
                <TabsTrigger value="weekly">Weekly View</TabsTrigger>
                <TabsTrigger value="daily">Daily View</TabsTrigger>
              </TabsList>

              <TabsContent value="weekly" className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Time</TableHead>
                        {daysOfWeek.map(day => (
                          <TableHead key={day} className="text-center min-w-32">
                            {day}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeSlots.map((slot, index) => {
                        const [startTime, endTime] = slot.split('-')
                        
                        return (
                          <TableRow key={slot}>
                            <TableCell className="font-medium text-sm">
                              <div className="text-center">
                                <div>{startTime}</div>
                                <div className="text-xs text-muted-foreground">to</div>
                                <div>{endTime}</div>
                              </div>
                            </TableCell>
                            {daysOfWeek.map(day => {
                              const period = classes
                                .find(c => c.id === selectedClass)
                                ?.periods.find(p => 
                                  p.day === day && 
                                  p.startTime === startTime.replace('-', ':')
                                )

                              return (
                                <TableCell key={`${day}-${slot}`} className="p-2">
                                  {period ? (
                                    <div className="text-xs space-y-1 p-2 border rounded bg-muted/50">
                                      <div className="font-medium">{period.subject}</div>
                                      <div className="text-muted-foreground flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {period.teacher}
                                      </div>
                                      <div className="text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {period.room}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground text-center py-4">
                                      Free
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
              </TabsContent>

              <TabsContent value="daily" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {daysOfWeek.map(day => {
                    const dayPeriods = classes
                      .find(c => c.id === selectedClass)
                      ?.periods.filter(p => p.day === day)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime)) || []

                    return (
                      <Card key={day}>
                        <CardHeader>
                          <CardTitle className="text-lg">{day}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {dayPeriods.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No periods scheduled</p>
                          ) : (
                            <div className="space-y-3">
                              {dayPeriods.map(period => (
                                <div key={period.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                  <div className="text-center">
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
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Timetable Generation Options Dialog */}
      <Dialog open={showGenerationOptions} onOpenChange={setShowGenerationOptions}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Timetable Generation Options
            </DialogTitle>
            <DialogDescription>
              Customize how your timetable will be generated for {classes.find(c => c.id === selectedClass)?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Timetable will be generated with default settings.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGenerationOptions(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleGenerateWithOptions({})}>
                Generate Timetable
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Generation Confirmation Dialog */}
      <AlertDialog open={isGenerationDialogOpen} onOpenChange={setIsGenerationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Timetables</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to generate timetables for {selectedClassesForGeneration.size} class{selectedClassesForGeneration.size !== 1 ? 'es' : ''}? 
              This will create new schedules for the selected classes.
            </AlertDialogDescription>
            {selectedClassesForGeneration.size > 0 && (
              <div className="mt-4">
                <p className="font-medium text-sm mb-2">Selected classes:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {Array.from(selectedClassesForGeneration).map(classId => {
                    const className = classes.find(c => c.id === classId)?.name
                    return <li key={classId}>• {className}</li>
                  })}
                </ul>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isGenerating}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkGenerateTimetables} 
              disabled={isGenerating}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>Generate {selectedClassesForGeneration.size} Timetable{selectedClassesForGeneration.size !== 1 ? 's' : ''}</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
