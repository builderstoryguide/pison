"use client"

import { useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Download, Calendar, Clock, MapPin, Users, BookOpen, Save, RefreshCw } from 'lucide-react'

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
    exportTimetable 
  } = useTimetable()
  
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("")
  const [selectedBranch, setSelectedBranch] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)



  const handleGenerateTimetable = async () => {
    if (!selectedClass) {
      return
    }

    setIsGenerating(true)

    try {
      const result = await generateTimetable(selectedClass)
      if (!result.success) {
        console.error("Failed to generate timetable:", result.error)
      }
    } catch (err) {
      console.error("Error generating timetable:", err)
    } finally {
      setIsGenerating(false)
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

  const filteredClasses = classes.filter(c => {
    if (selectedSubsystem && c.subsystem !== selectedSubsystem) return false
    if (selectedBranch && c.branch !== selectedBranch) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading timetable data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Timetable Management</h1>
        <p className="text-muted-foreground">Generate and manage class timetables for the academic year.</p>
      </div>

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
              <Select value={selectedSubsystem} onValueChange={setSelectedSubsystem}>
                <SelectTrigger>
                  <SelectValue placeholder="All subsystems" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subsystems</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All branches</SelectItem>
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
                  {filteredClasses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Timetable */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Timetable</CardTitle>
          <CardDescription>Automatically generate a timetable for the selected class</CardDescription>
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
                  Generate Timetable
                </>
              )}
            </Button>
            {error && (
              <Alert variant="destructive" className="flex-1">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
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
          <Table>
            <TableHeader>
              <TableRow>
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
              {filteredClasses.map((classData) => (
                <TableRow key={classData.id}>
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
        </CardContent>
      </Card>

      {/* Timetable Viewer */}
      {selectedClass && classes.find(c => c.id === selectedClass)?.periods && classes.find(c => c.id === selectedClass)!.periods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Timetable for {classes.find(c => c.id === selectedClass)?.name}
            </CardTitle>
            <CardDescription>Weekly schedule view</CardDescription>
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
    </div>
  )
}
