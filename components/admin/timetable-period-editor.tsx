'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  User, 
  MapPin, 
  BookOpen, 
  Save, 
  X, 
  Plus,
  Edit3,
  Trash2,
  AlertTriangle
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

interface PeriodEditorProps {
  period?: TimetablePeriod
  isOpen: boolean
  onClose: () => void
  onSave: (period: Omit<TimetablePeriod, 'id'>) => Promise<{ success: boolean; error?: string }>
  onUpdate: (periodId: string, updates: Partial<TimetablePeriod>) => Promise<{ success: boolean; error?: string }>
  onDelete: (periodId: string) => Promise<{ success: boolean; error?: string }>
  teachers: Array<{ id: string; name: string }>
  rooms: Array<{ id: string; name: string }>
  subjects: string[]
  mode: 'create' | 'edit'
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const periodTypes = [
  { value: 'regular', label: 'Regular Class' },
  { value: 'break', label: 'Break' },
  { value: 'lunch', label: 'Lunch Break' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'exam', label: 'Examination' }
]

const timeSlots = [
  '08:00', '08:45', '09:30', '10:15', '11:00', '11:45',
  '12:30', '13:15', '14:00', '14:45', '15:30', '16:15', '17:00'
]

export function TimetablePeriodEditor({
  period,
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  teachers,
  rooms,
  subjects,
  mode
}: PeriodEditorProps) {
  const [formData, setFormData] = useState<Omit<TimetablePeriod, 'id'>>({
    day: period?.day || 'Monday',
    startTime: period?.startTime || '08:00',
    endTime: period?.endTime || '08:45',
    subject: period?.subject || '',
    teacher: period?.teacher || '',
    room: period?.room || '',
    periodNumber: period?.periodNumber || 1,
    periodType: period?.periodType || 'regular',
    notes: period?.notes || ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.day) newErrors.day = 'Day is required'
    if (!formData.startTime) newErrors.startTime = 'Start time is required'
    if (!formData.endTime) newErrors.endTime = 'End time is required'
    if (!formData.subject) newErrors.subject = 'Subject is required'
    if (!formData.teacher) newErrors.teacher = 'Teacher is required'
    if (!formData.room) newErrors.room = 'Room is required'

    // Validate time logic
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      let result
      if (mode === 'create') {
        result = await onSave(formData)
      } else if (period) {
        result = await onUpdate(period.id, formData)
      }

      if (result?.success) {
        onClose()
      }
    } catch (error) {
      console.error('Error saving period:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!period) return

    setIsLoading(true)
    try {
      const result = await onDelete(period.id)
      if (result.success) {
        setShowDeleteDialog(false)
        onClose()
      }
    } catch (error) {
      console.error('Error deleting period:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mode === 'create' ? (
                <>
                  <Plus className="h-5 w-5 text-blue-600" />
                  Create New Period
                </>
              ) : (
                <>
                  <Edit3 className="h-5 w-5 text-orange-600" />
                  Edit Period
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Add a new period to the timetable'
                : 'Modify the selected period details'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Schedule Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day">Day of Week</Label>
                    <Select value={formData.day} onValueChange={(value) => updateFormData('day', value)}>
                      <SelectTrigger className={errors.day ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map(day => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.day && <p className="text-sm text-red-500">{errors.day}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodType">Period Type</Label>
                    <Select value={formData.periodType} onValueChange={(value) => updateFormData('periodType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Select value={formData.startTime} onValueChange={(value) => updateFormData('startTime', value)}>
                      <SelectTrigger className={errors.startTime ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Select value={formData.endTime} onValueChange={(value) => updateFormData('endTime', value)}>
                      <SelectTrigger className={errors.endTime ? 'border-red-500' : ''}>
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodNumber">Period Number</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.periodNumber}
                      onChange={(e) => updateFormData('periodNumber', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Class Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={formData.subject} onValueChange={(value) => updateFormData('subject', value)}>
                    <SelectTrigger className={errors.subject ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacher">Teacher</Label>
                    <Select value={formData.teacher} onValueChange={(value) => updateFormData('teacher', value)}>
                      <SelectTrigger className={errors.teacher ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map(teacher => (
                          <SelectItem key={teacher.id} value={teacher.name}>{teacher.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.teacher && <p className="text-sm text-red-500">{errors.teacher}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room">Room</Label>
                    <Select value={formData.room} onValueChange={(value) => updateFormData('room', value)}>
                      <SelectTrigger className={errors.room ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map(room => (
                          <SelectItem key={room.id} value={room.name}>{room.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.room && <p className="text-sm text-red-500">{errors.room}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any additional notes..."
                    value={formData.notes}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="text-center">
                    <Badge variant="outline" className="mb-2">{formData.day}</Badge>
                    <div className="text-sm font-medium">{formData.startTime}</div>
                    <div className="text-xs text-muted-foreground">to</div>
                    <div className="text-sm font-medium">{formData.endTime}</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">{formData.subject || 'Subject'}</span>
                      <Badge variant="secondary" className="text-xs">
                        {periodTypes.find(t => t.value === formData.periodType)?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{formData.teacher || 'Teacher'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{formData.room || 'Room'}</span>
                    </div>
                    {formData.notes && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {formData.notes}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div>
              {mode === 'edit' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Period
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {mode === 'create' ? 'Create Period' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle>Delete Period</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this period? This action cannot be undone.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {period && (
            <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="font-medium">{period.subject}</div>
              <div className="text-sm text-gray-600">
                {period.day}, {period.startTime} - {period.endTime}
              </div>
              <div className="text-sm text-gray-600">
                {period.teacher} • {period.room}
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Period
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
