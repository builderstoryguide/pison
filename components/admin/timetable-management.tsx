"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Download, Calendar, Clock, MapPin, Users, BookOpen, Save, RefreshCw, AlertCircle, FileText, Eye, Printer, Trash2 as TrashIcon } from 'lucide-react'

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTimetable } from '@/lib/timetable-context'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = [
  "08:00-08:45", "08:45-09:30", "09:30-10:15", "10:15-11:00",
  "11:00-11:45", "11:45-12:30", "12:30-13:15", "13:15-14:00",
  "14:00-14:45", "14:45-15:30", "15:30-16:15", "16:15-17:00"
]

export function TimetableManagement() {
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
    loadClassesWithFilters
  } = useTimetable()
  
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast()
  
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("all")
  const [selectedBranch, setSelectedBranch] = useState<string>("all")
  const [isGenerating, setIsGenerating] = useState(false)

  // Generation selection state (for classes without timetables)
  const [selectedClassesForGeneration, setSelectedClassesForGeneration] = useState<Set<string>>(new Set())
  const [selectAllForGeneration, setSelectAllForGeneration] = useState(false)
  const [isGenerationDialogOpen, setIsGenerationDialogOpen] = useState(false)

  // Bulk selection state (for classes with timetables - for deletion)
  const [selectedTimetables, setSelectedTimetables] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  // Empty state component
  const EmptyState = ({ message, description }: { message: string; description: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{message}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
    </div>
  )

  // Loading state component
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
      <p className="text-muted-foreground">Loading timetable data...</p>
    </div>
  )

  // Error state component
  const ErrorState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-16 w-16 text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load timetable data</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      <Button onClick={() => refreshClasses()} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  )

  // Handle filter changes
  const handleSubsystemChange = (value: string) => {
    setSelectedSubsystem(value)
    setSelectedClass("") // Reset selected class when filters change
    loadClassesWithFilters({ 
      subsystem: value !== 'all' ? value : undefined, 
      branch: selectedBranch !== 'all' ? selectedBranch : undefined 
    })
  }

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value)
    setSelectedClass("") // Reset selected class when filters change
    loadClassesWithFilters({ 
      subsystem: selectedSubsystem !== 'all' ? selectedSubsystem : undefined, 
      branch: value !== 'all' ? value : undefined 
    })
  }

  const handleGenerateTimetable = async () => {
    if (!selectedClass) {
      toastError("Please select a class to generate timetable")
      return
    }

    setIsGenerating(true)

    try {
      const result = await generateTimetable(selectedClass)
      if (result.success) {
        toastSuccess(`Timetable generated successfully for ${classes.find(c => c.id === selectedClass)?.name}`)
      } else {
        toastError(`Failed to generate timetable: ${result.error}`)
      }
    } catch (err) {
      console.error("Error generating timetable:", err)
      toastError("An error occurred while generating timetable")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBulkGenerateTimetables = async () => {
    if (selectedClassesForGeneration.size === 0) {
      toastWarning("No classes selected for generation")
      return
    }

    setIsGenerating(true)
    const classIds = Array.from(selectedClassesForGeneration)
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    try {
      for (const classId of classIds) {
        try {
          const result = await generateTimetable(classId)
          if (result.success) {
            successCount++
          } else {
            errorCount++
            const className = classes.find(c => c.id === classId)?.name || classId
            errors.push(`${className}: ${result.error}`)
          }
        } catch (err) {
          errorCount++
          const className = classes.find(c => c.id === classId)?.name || classId
          errors.push(`${className}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }

      // Provide feedback
      if (successCount > 0 && errorCount === 0) {
        toastSuccess(`Successfully generated ${successCount} timetables`)
      } else if (successCount > 0 && errorCount > 0) {
        toastWarning(`Generated ${successCount} timetables with ${errorCount} errors`)
      } else {
        toastError(`Failed to generate timetables: ${errors[0]}`)
      }

      // Clear selection
      setSelectedClassesForGeneration(new Set())
      setSelectAllForGeneration(false)
    } catch (err) {
      console.error("Error in bulk generation:", err)
      toastError("An error occurred during bulk generation")
    } finally {
      setIsGenerating(false)
      setIsGenerationDialogOpen(false)
    }
  }

  const handleExportTimetable = async (classId: string) => {
    try {
      const result = await exportTimetable(classId)
      if (!result.success) {
        console.error("Failed to export timetable:", result.error)
      }
    } catch (err) {
      console.error("Error exporting timetable:", err)
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
      toastWarning("No timetables selected for deletion")
      return
    }

    const result = await bulkDeleteTimetables(Array.from(selectedTimetables))
    
    if (result.success) {
      if (result.errors.length > 0) {
        toastWarning(`Deleted ${result.deletedCount} timetables with ${result.errors.length} errors`)
      } else {
        toastSuccess(`Successfully deleted ${result.deletedCount} timetables`)
      }
      setSelectedTimetables(new Set())
      setSelectAll(false)
    } else {
      toastError(result.errors[0] || "Failed to delete timetables")
    }
    
    setIsBulkDeleteDialogOpen(false)
  }

  const handleConfirmBulkDelete = () => {
    setIsBulkDeleteDialogOpen(true)
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

  const handleConfirmBulkGeneration = () => {
    setIsGenerationDialogOpen(true)
  }

  // Clear selection when filters change
  useEffect(() => {
    setSelectedTimetables(new Set())
    setSelectAll(false)
    setSelectedClassesForGeneration(new Set())
    setSelectAllForGeneration(false)
  }, [selectedSubsystem, selectedBranch])

  const handleExportJSON = async (classId: string) => {
    const selectedClass = classes.find(c => c.id === classId)
    if (!selectedClass || selectedClass.periods.length === 0) {
      console.error('No timetable to export')
      return
    }

    const jsonContent = JSON.stringify({
      class: selectedClass,
      periods: selectedClass.periods,
      generatedAt: new Date().toISOString()
    }, null, 2)

    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timetable_${selectedClass.name.replace(/\s+/g, '_')}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handlePrintTimetable = async (classId: string) => {
    const selectedClass = classes.find(c => c.id === classId)
    if (!selectedClass || selectedClass.periods.length === 0) {
      console.error('No timetable to print')
      return
    }

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const htmlContent = `
        <html>
          <head>
            <title>Timetable - ${selectedClass.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Timetable - ${selectedClass.name}</h1>
              <p>Level: ${selectedClass.level} | Subsystem: ${selectedClass.subsystem} | Branch: ${selectedClass.branch}</p>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                ${selectedClass.periods.map(period => `
                  <tr>
                    <td>${period.day}</td>
                    <td>${period.startTime}-${period.endTime}</td>
                    <td><strong>${period.subject}</strong></td>
                    <td>${period.teacher}</td>
                    <td>${period.room}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `
      printWindow.document.write(htmlContent)
      printWindow.document.close()
    }
  }

  const handleDeleteTimetable = async (classId: string) => {
    try {
      const result = await deleteTimetable(classId)
      if (!result.success) {
        console.error("Failed to delete timetable:", result.error)
      }
    } catch (err) {
      console.error("Error deleting timetable:", err)
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Timetable Management</h1>
        <p className="text-muted-foreground">Generate and manage class timetables for the academic year.</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter classes by subsystem and branch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="subsystem">Subsystem</Label>
              <Select value={selectedSubsystem} onValueChange={handleSubsystemChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All subsystems" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subsystems</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select value={selectedBranch} onValueChange={handleBranchChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  <SelectItem value="grammar">Grammar</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Single Class Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Single Timetable</CardTitle>
          <CardDescription>Generate a timetable for one specific class using the dropdown selection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleGenerateTimetable} 
              disabled={!selectedClass || isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Generate for Selected Class
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => refreshClasses({ 
                subsystem: selectedSubsystem !== 'all' ? selectedSubsystem : undefined, 
                branch: selectedBranch !== 'all' ? selectedBranch : undefined 
              })}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Generation Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Bulk Timetable Generation
          </CardTitle>
          <CardDescription className="text-blue-700">
            Select multiple classes without timetables in the table below and generate them all at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• Use the "Gen" column checkboxes to select classes that don't have timetables yet</p>
            <p>• Click "Generate Timetables" in the blue toolbar that appears when classes are selected</p>
            <p>• You can select individual classes or use the master checkbox to select all classes without timetables</p>
          </div>
        </CardContent>
      </Card>

      {/* Timetables List */}
      <Card>
        <CardHeader>
          <CardTitle>Class Timetables</CardTitle>
          <CardDescription>View and manage timetables for all classes</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Bulk Generation Toolbar */}
          {selectedClassesForGeneration.size > 0 && (
            <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
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

          {/* Bulk Delete Toolbar */}
          {selectedTimetables.size > 0 && (
            <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedTimetables.size} timetable{selectedTimetables.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmBulkDelete}
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTimetables(new Set())
                    setSelectAll(false)
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {classes.length === 0 ? (
            <EmptyState 
              message="No classes found" 
              description="No classes are available for timetable generation. Please ensure classes are properly configured in the system."
            />
          ) : (
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
                      <span className="text-xs text-muted-foreground">Gen</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-12">
                    <div className="flex flex-col gap-1">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all timetables for deletion"
                      />
                      <span className="text-xs text-muted-foreground">Del</span>
                    </div>
                  </TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Subsystem</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Periods</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classData) => (
                  <TableRow key={classData.id}>
                    <TableCell>
                      {classData.periods.length === 0 && (
                        <Checkbox
                          checked={selectedClassesForGeneration.has(classData.id)}
                          onCheckedChange={() => handleSelectClassForGeneration(classData.id)}
                          aria-label={`Select ${classData.name} for generation`}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {classData.periods.length > 0 && (
                        <Checkbox
                          checked={selectedTimetables.has(classData.id)}
                          onCheckedChange={() => handleSelectTimetable(classData.id)}
                          aria-label={`Select timetable for ${classData.name}`}
                        />
                      )}
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
                    <TableCell>{classData.periods.length}</TableCell>
                    <TableCell>
                      {classData.periods.length > 0 ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Generated
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not Generated</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {classData.periods.length > 0 && (
                            <DropdownMenuItem onClick={() => setSelectedClass(classData.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Timetable
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setSelectedClass(classData.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Timetable
                          </DropdownMenuItem>
                          {classData.periods.length > 0 && (
                            <>
                              <DropdownMenuItem onClick={() => handleExportTimetable(classData.id)}>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleExportJSON(classData.id)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Export JSON
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePrintTimetable(classData.id)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print Timetable
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Timetable
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Timetable</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the timetable for {classData.name}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteTimetable(classData.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Timetable Viewer */}
      {selectedClass && classes.find(c => c.id === selectedClass)?.periods && classes.find(c => c.id === selectedClass)!.periods.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timetable for {classes.find(c => c.id === selectedClass)?.name}
                </CardTitle>
                <CardDescription>View and download the generated timetable</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {classes.find(c => c.id === selectedClass)?.periods.length} Periods
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleExportTimetable(selectedClass)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportJSON(selectedClass)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePrintTimetable(selectedClass)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Timetable
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList>
                <TabsTrigger value="weekly">Weekly View</TabsTrigger>
                <TabsTrigger value="daily">Daily View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="weekly" className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        {daysOfWeek.map(day => (
                          <TableHead key={day}>{day}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeSlots.slice(0, 8).map((timeSlot, timeIndex) => (
                        <TableRow key={timeSlot}>
                          <TableCell className="font-medium">{timeSlot}</TableCell>
                          {daysOfWeek.map(day => {
                            const period = classes
                              .find(c => c.id === selectedClass)
                              ?.periods.find(p => p.day === day && p.startTime === timeSlot.split("-")[0])
                            
                            return (
                              <TableCell key={day}>
                                {period ? (
                                  <div className="space-y-1">
                                    <div className="font-medium text-sm">{period.subject}</div>
                                    <div className="text-xs text-muted-foreground">{period.teacher}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {period.room}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground text-sm">-</div>
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
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

      {/* Bulk Generation Confirmation Dialog */}
      <AlertDialog open={isGenerationDialogOpen} onOpenChange={setIsGenerationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Timetables</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to generate timetables for {selectedClassesForGeneration.size} class{selectedClassesForGeneration.size !== 1 ? 'es' : ''}? 
              This will create new schedules for the selected classes.
              {selectedClassesForGeneration.size > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-sm">Selected classes:</p>
                  <ul className="text-sm text-muted-foreground mt-1">
                    {Array.from(selectedClassesForGeneration).map(classId => {
                      const className = classes.find(c => c.id === classId)?.name
                      return <li key={classId}>• {className}</li>
                    })}
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Timetables</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTimetables.size} timetable{selectedTimetables.size !== 1 ? 's' : ''}? 
              This action cannot be undone and will remove all schedule data for the selected classes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete {selectedTimetables.size} Timetable{selectedTimetables.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
