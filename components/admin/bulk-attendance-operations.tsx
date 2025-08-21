"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Edit, 
  Trash2, 
  Users, 
  Save, 
  X, 
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  SelectAll
} from "lucide-react"
import { useAttendance } from "@/lib/attendance-context"
import { AttendanceRecord } from "@/lib/attendance-context"
import { format } from "date-fns"

interface BulkAttendanceOperationsProps {
  records: AttendanceRecord[]
  onSuccess?: () => void
  onCancel?: () => void
  trigger?: React.ReactNode
}

export function BulkAttendanceOperations({ records, onSuccess, onCancel, trigger }: BulkAttendanceOperationsProps) {
  const { bulkUpdateAttendance, bulkDeleteAttendanceRecords, isLoading } = useAttendance()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<"present" | "absent" | "late" | "excused" | "">("")
  const [selectAll, setSelectAll] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedRecords(records.map(record => record.id))
    } else {
      setSelectedRecords([])
    }
  }

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    if (checked) {
      setSelectedRecords(prev => [...prev, recordId])
    } else {
      setSelectedRecords(prev => prev.filter(id => id !== recordId))
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedRecords.length === 0 || !bulkStatus) {
      alert("Please select records and choose a status")
      return
    }

    try {
      const updates = selectedRecords.map(recordId => ({
        recordId,
        updates: { status: bulkStatus }
      }))

      await bulkUpdateAttendance(updates)
      setIsOpen(false)
      setSelectedRecords([])
      setBulkStatus("")
      setSelectAll(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error performing bulk update:", error)
      alert("Failed to update attendance records")
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) {
      alert("Please select records to delete")
      return
    }

    try {
      await bulkDeleteAttendanceRecords(selectedRecords)
      setIsOpen(false)
      setSelectedRecords([])
      setSelectAll(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error performing bulk delete:", error)
      alert("Failed to delete attendance records")
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "late":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "excused":
        return <UserCheck className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Bulk Operations
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Attendance Operations</DialogTitle>
          <CardDescription>
            Select multiple attendance records to perform bulk operations
          </CardDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Selection Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selection Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({records.length} records)
                  </label>
                </div>
                <Badge variant="secondary">
                  {selectedRecords.length} selected
                </Badge>
              </div>

              {selectedRecords.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bulk Update Status</label>
                    <Select value={bulkStatus} onValueChange={(value: "present" | "absent" | "late" | "excused") => setBulkStatus(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status to apply" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Present
                          </div>
                        </SelectItem>
                        <SelectItem value="absent">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Absent
                          </div>
                        </SelectItem>
                        <SelectItem value="late">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            Late
                          </div>
                        </SelectItem>
                        <SelectItem value="excused">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-blue-600" />
                            Excused
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      onClick={handleBulkUpdate}
                      disabled={isLoading || !bulkStatus}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Update Selected
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete Selected
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Selected Records</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {selectedRecords.length} attendance record(s)? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete {selectedRecords.length} Record(s)
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Select records to perform bulk operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecords.includes(record.id)}
                          onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{record.studentName}</TableCell>
                      <TableCell>{record.className}</TableCell>
                      <TableCell>{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <Badge className={getStatusColor(record.status)}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{record.subject || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                setSelectedRecords([])
                setBulkStatus("")
                setSelectAll(false)
                onCancel?.()
              }}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
