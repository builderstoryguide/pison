"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Users, UserPlus, AlertCircle } from "lucide-react"
import { useStudentManagement, type Student } from "@/lib/student-management-context"
import { useToast } from "@/hooks/use-toast"
import { getStudentClassName } from "@/lib/utils"

interface AddStudentToClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  className: string
  currentStudents: string[] // Array of student IDs already in the class
  onSuccess: (addedStudents: Student[]) => void
}

export function AddStudentToClassDialog({
  open,
  onOpenChange,
  classId: _classId,
  className,
  currentStudents,
  onSuccess
}: AddStudentToClassDialogProps) {
  const { students, isLoading, loadStudents } = useStudentManagement()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isAdding, setIsAdding] = useState(false)

  // Load students when dialog opens
  useEffect(() => {
    if (open) {
      loadStudents()
    }
  }, [open, loadStudents])

  // Filter available students (not already in the class)
  const availableStudents = students.filter(student => 
    !currentStudents.includes(student.id) &&
    student.enrollment_status === "enrolled" &&
    student.status === "active"
  )

  // Filter students based on search query
  const filteredStudents = availableStudents.filter(student =>
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

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      toast("No students selected", {
        description: "Please select at least one student to add to the class.",
      })
      return
    }

    setIsAdding(true)
    try {
      // Here we would call the class management context to add students
      // For now, we'll simulate the addition
      const addedStudents = students.filter(s => selectedStudents.includes(s.id))
      
      onSuccess(addedStudents)
      
      toast("Students added successfully", {
        description: `${selectedStudents.length} student${selectedStudents.length === 1 ? '' : 's'} added to ${className}`,
      })
      
      setSelectedStudents([])
      setSearchQuery("")
      onOpenChange(false)
    } catch (error) {
      toast("Error adding students", {
        description: "Failed to add students to the class. Please try again.",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Students to {className}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2 space-y-4">
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
              {filteredStudents.length} available student{filteredStudents.length === 1 ? '' : 's'}
            </span>
            <span>
              {selectedStudents.length} selected
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
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No students available</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? "No students match your search criteria."
                      : "All enrolled students are already in this class or no students are available."
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
                              <Badge variant="outline" className="text-xs">
                                {getStudentClassName(student) || "No Class"}
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
                            {student.email} • {student.subsystem?.toUpperCase()} • {student.branch}
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
                  <AlertCircle className="h-4 w-4" />
                  {selectedStudents.length} student{selectedStudents.length === 1 ? '' : 's'} will be added to {className}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStudents}
                disabled={selectedStudents.length === 0 || isAdding}
              >
                {isAdding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add {selectedStudents.length} Student{selectedStudents.length === 1 ? '' : 's'}
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
