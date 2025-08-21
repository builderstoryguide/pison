"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Users, UserMinus, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Student } from "@/lib/student-management-context"

interface RemoveStudentFromClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  className: string
  classStudents: Student[] // Students currently in the class
  onSuccess: (removedStudents: Student[]) => void
}

export function RemoveStudentFromClassDialog({
  open,
  onOpenChange,
  classId,
  className,
  classStudents,
  onSuccess
}: RemoveStudentFromClassDialogProps) {
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isRemoving, setIsRemoving] = useState(false)

  // Filter students based on search query
  const filteredStudents = classStudents.filter(student =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id))
    }
  }

  const handleRemoveStudents = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "No students selected",
        description: "Please select at least one student to remove from the class.",
        variant: "destructive",
      })
      return
    }

    setIsRemoving(true)
    try {
      // Here we would call the class management context to remove students
      // For now, we'll simulate the removal
      const removedStudents = classStudents.filter(s => selectedStudents.includes(s.id))
      
      onSuccess(removedStudents)
      
      toast({
        title: "Students removed successfully",
        description: `${selectedStudents.length} student${selectedStudents.length === 1 ? '' : 's'} removed from ${className}`,
      })
      
      setSelectedStudents([])
      setSearchQuery("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error removing students",
        description: "Failed to remove students from the class. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Remove Students from {className}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Warning</p>
                <p className="text-yellow-700">
                  Removing students from this class will unassign them but won't delete their records. 
                  They will need to be reassigned to another class.
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Students</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search"
                placeholder="Search by name, student ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'} in class
            </span>
            <span>
              {selectedStudents.length} selected for removal
            </span>
          </div>

          {/* Select All */}
          {filteredStudents.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedStudents.length === filteredStudents.length}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm">
                Select all visible students
              </Label>
            </div>
          )}

          {/* Students List */}
          <ScrollArea className="h-[400px] border rounded-md">
            <div className="p-4 space-y-3">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No students found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? "No students match your search criteria."
                      : "This class doesn't have any students enrolled."
                    }
                  </p>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <Card key={student.id} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => handleStudentToggle(student.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium">
                                {student.first_name} {student.last_name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                ID: {student.student_id}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={student.enrollment_status === "enrolled" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {student.enrollment_status}
                              </Badge>
                              <Badge 
                                variant={student.fees_status === "paid" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {student.fees_status}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {student.email} • Enrolled: {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedStudents.length > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {selectedStudents.length} student{selectedStudents.length === 1 ? '' : 's'} will be removed from {className}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isRemoving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveStudents}
                disabled={selectedStudents.length === 0 || isRemoving}
              >
                {isRemoving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Removing...
                  </>
                ) : (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove {selectedStudents.length} Student{selectedStudents.length === 1 ? '' : 's'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
