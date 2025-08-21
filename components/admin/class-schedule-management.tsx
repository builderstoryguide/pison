"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X,
  Settings,
  BookOpen,
  Users
} from "lucide-react"
import { useClassManagement, type ClassData } from "@/lib/class-management-context"

interface ClassScheduleManagementProps {
  classData: ClassData
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SchedulePeriod {
  time: string
  subject: string
  teacher: string
}

interface ScheduleDay {
  day: string
  periods: SchedulePeriod[]
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday", 
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
]

const TIME_SLOTS = [
  "7:30-8:15",
  "8:15-9:00", 
  "9:00-9:45",
  "9:45-10:30",
  "10:45-11:30",
  "11:30-12:15",
  "12:15-1:00",
  "2:00-2:45",
  "2:45-3:30",
  "3:30-4:15",
  "4:15-5:00"
]

// Mock teachers - in a real app, this would come from the teacher management system
const MOCK_TEACHERS = [
  "Mr. John Doe",
  "Mrs. Sarah Johnson", 
  "Dr. Mary Smith",
  "Mr. David Wilson",
  "Ms. Lisa Brown",
  "Mr. Michael Davis",
  "Mrs. Jennifer Garcia",
  "Dr. Robert Miller"
]

export function ClassScheduleManagement({ classData, open, onOpenChange }: ClassScheduleManagementProps) {
  const { updateClassSchedule } = useClassManagement()
  const [schedule, setSchedule] = useState<ScheduleDay[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [newPeriod, setNewPeriod] = useState<SchedulePeriod>({
    time: "",
    subject: "",
    teacher: ""
  })

  // Initialize schedule with existing data or empty structure
  useEffect(() => {
    if (classData.schedule && classData.schedule.length > 0) {
      setSchedule(classData.schedule)
    } else {
      // Create empty schedule structure
      const emptySchedule = DAYS_OF_WEEK.map(day => ({
        day,
        periods: []
      }))
      setSchedule(emptySchedule)
    }
  }, [classData])

  const handleSaveSchedule = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateClassSchedule(classData.id, schedule)
      if (result.success) {
        setSuccessMessage("Schedule updated successfully!")
        setTimeout(() => {
          setSuccessMessage(null)
          onOpenChange(false)
        }, 2000)
      } else {
        setError(result.error || "Failed to update schedule")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const addPeriodToDay = (day: string) => {
    if (!newPeriod.time || !newPeriod.subject || !newPeriod.teacher) {
      setError("Please fill in all fields for the new period")
      return
    }

    // Check if time slot is already taken
    const daySchedule = schedule.find(d => d.day === day)
    if (daySchedule?.periods.some(p => p.time === newPeriod.time)) {
      setError("This time slot is already occupied")
      return
    }

    setSchedule(prev => prev.map(d => 
      d.day === day 
        ? { ...d, periods: [...d.periods, { ...newPeriod }] }
        : d
    ))

    setNewPeriod({ time: "", subject: "", teacher: "" })
    setEditingDay(null)
    setError(null)
  }

  const removePeriod = (day: string, periodIndex: number) => {
    setSchedule(prev => prev.map(d => 
      d.day === day 
        ? { ...d, periods: d.periods.filter((_, index) => index !== periodIndex) }
        : d
    ))
  }

  const getDaySchedule = (day: string) => {
    return schedule.find(d => d.day === day)?.periods || []
  }

  const getAvailableTimeSlots = (day: string) => {
    const usedSlots = getDaySchedule(day).map(p => p.time)
    return TIME_SLOTS.filter(slot => !usedSlots.includes(slot))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Schedule - {classData.name}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Schedule Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>
                Manage the weekly timetable for {classData.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {DAYS_OF_WEEK.map((day) => {
                  const daySchedule = getDaySchedule(day)
                  const isEditing = editingDay === day
                  
                  return (
                    <div key={day} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-lg">{day}</h3>
                        <div className="flex items-center gap-2">
                          {daySchedule.length > 0 && (
                            <Badge variant="secondary">
                              {daySchedule.length} period{daySchedule.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingDay(isEditing ? null : day)}
                          >
                            {isEditing ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            {isEditing ? 'Cancel' : 'Add Period'}
                          </Button>
                        </div>
                      </div>

                      {/* Add Period Form */}
                      {isEditing && (
                        <div className="mb-4 p-4 bg-muted rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <Label htmlFor="time">Time</Label>
                              <Select 
                                value={newPeriod.time} 
                                onValueChange={(value) => setNewPeriod(prev => ({ ...prev, time: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableTimeSlots(day).map((slot) => (
                                    <SelectItem key={slot} value={slot}>
                                      {slot}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="subject">Subject</Label>
                              <Select 
                                value={newPeriod.subject} 
                                onValueChange={(value) => setNewPeriod(prev => ({ ...prev, subject: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                  {classData.subjects.map((subject) => (
                                    <SelectItem key={subject} value={subject}>
                                      {subject}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="teacher">Teacher</Label>
                              <Select 
                                value={newPeriod.teacher} 
                                onValueChange={(value) => setNewPeriod(prev => ({ ...prev, teacher: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                  {MOCK_TEACHERS.map((teacher) => (
                                    <SelectItem key={teacher} value={teacher}>
                                      {teacher}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-end">
                              <Button 
                                onClick={() => addPeriodToDay(day)}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Periods List */}
                      {daySchedule.length > 0 ? (
                        <div className="space-y-2">
                          {daySchedule.map((period, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-background border rounded-lg">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{period.time}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span>{period.subject}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">{period.teacher}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePeriod(day, index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <Calendar className="h-8 w-8 mx-auto mb-2" />
                          <p>No periods scheduled for {day}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Schedule
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
