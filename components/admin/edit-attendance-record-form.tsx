"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, BookOpen, Edit, Trash2, Save, X } from "lucide-react"
import { useAttendance } from "@/lib/attendance-context"
import { AttendanceRecord } from "@/lib/attendance-context"
import { format } from "date-fns"

interface EditAttendanceRecordFormProps {
  recordId: string
  onSuccess?: () => void
  onCancel?: () => void
  trigger?: React.ReactNode
}

export function EditAttendanceRecordForm({ recordId, onSuccess, onCancel, trigger }: EditAttendanceRecordFormProps) {
  const { getAttendanceRecord, updateAttendanceRecord, deleteAttendanceRecord, isLoading } = useAttendance()
  const [isOpen, setIsOpen] = useState(false)
  const [record, setRecord] = useState<AttendanceRecord | null>(null)
  const [formData, setFormData] = useState({
    status: "" as "present" | "absent" | "late" | "excused",
    notes: "",
    period: "",
    subject: "",
  })

  useEffect(() => {
    if (recordId && isOpen) {
      const attendanceRecord = getAttendanceRecord(recordId)
      if (attendanceRecord) {
        setRecord(attendanceRecord)
        setFormData({
          status: attendanceRecord.status,
          notes: attendanceRecord.notes || "",
          period: attendanceRecord.period || "",
          subject: attendanceRecord.subject || "",
        })
      }
    }
  }, [recordId, isOpen, getAttendanceRecord])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!record) return

    try {
      await updateAttendanceRecord(recordId, {
        status: formData.status,
        notes: formData.notes || undefined,
        period: formData.period || undefined,
        subject: formData.subject || undefined,
      })
      
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error updating attendance record:", error)
      alert("Failed to update attendance record")
    }
  }

  const handleDelete = async () => {
    if (!record) return

    try {
      await deleteAttendanceRecord(recordId)
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error deleting attendance record:", error)
      alert("Failed to delete attendance record")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "text-green-600 bg-green-50"
      case "absent":
        return "text-red-600 bg-red-50"
      case "late":
        return "text-yellow-600 bg-yellow-50"
      case "excused":
        return "text-blue-600 bg-blue-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  if (!record) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Attendance Record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Record Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Record Information</CardTitle>
              <CardDescription>Basic information about this attendance record</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Student</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{record.studentName}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Class</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <BookOpen className="h-4 w-4" />
                    <span>{record.className}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(record.date), "PPP")}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Marked By</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <User className="h-4 w-4" />
                    <span>{record.markedBy}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Details</CardTitle>
              <CardDescription>Update attendance status and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Attendance Status</Label>
                <Select value={formData.status} onValueChange={(value: "present" | "absent" | "late" | "excused") => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Present
                      </div>
                    </SelectItem>
                    <SelectItem value="absent">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Absent
                      </div>
                    </SelectItem>
                    <SelectItem value="late">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Late
                      </div>
                    </SelectItem>
                    <SelectItem value="excused">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Excused
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <Input
                    id="period"
                    value={formData.period}
                    onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                    placeholder="e.g., Period 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., Mathematics"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Current Status Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge className={getStatusColor(record.status)}>
                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Marked at {format(new Date(record.markedAt), "PPp")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Record
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this attendance record? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false)
                  onCancel?.()
                }}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !formData.status}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
