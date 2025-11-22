"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useClassStudents } from "@/lib/hooks/use-class-students"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ClassStudentsDialogProps {
  classId: string
  className: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClassStudentsDialog({
  classId,
  className,
  open,
  onOpenChange
}: ClassStudentsDialogProps) {
  const { students, isLoading, error } = useClassStudents(classId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Students in {className}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-2">Loading students...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Error: {error}</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No students enrolled in this class</p>
          </div>
        ) : (
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrollment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.studentId}</TableCell>
                    <TableCell>
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.enrollmentStatus}</Badge>
                    </TableCell>
                    <TableCell>
                      {student.enrollmentDate
                        ? new Date(student.enrollmentDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 text-sm text-muted-foreground">
              Total: {students.length} student{students.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

