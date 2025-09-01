"use client"

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, User, GraduationCap, Heart, FileText, Calendar, DollarSign } from 'lucide-react'

import { Student } from '@/lib/student-management-context'

const enrollmentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  enrolled: 'bg-green-100 text-green-800',
  graduated: 'bg-blue-100 text-blue-800',
  transferred: 'bg-purple-100 text-purple-800',
  dropped: 'bg-red-100 text-red-800'
}

const feesStatusColors = {
  paid: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-orange-100 text-orange-800',
  overdue: 'bg-red-100 text-red-800'
}

interface StudentDetailsDialogProps {
  student: Student
  onClose: () => void
  onEdit?: (student: Student) => void
}

export function StudentDetailsDialog({ student, onClose, onEdit }: StudentDetailsDialogProps) {
  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={student.avatar || "/placeholder.svg"} />
          <AvatarFallback className="text-lg">
            {`${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-semibold">{student.first_name} {student.last_name}</h3>
            {student.is_new_student && (
              <Badge variant="secondary">New Student</Badge>
            )}
          </div>
          <p className="text-muted-foreground mb-2">{student.email}</p>
          <div className="flex gap-2">
            <Badge className={enrollmentStatusColors[student.enrollment_status]}>
              {student.enrollment_status}
            </Badge>
            <Badge className={feesStatusColors[student.fees_status]}>
              Fees: {student.fees_status}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Academic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Academic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Student ID</p>
              <p className="font-mono">{student.student_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Admission Number</p>
              <p className="font-mono">{student.student_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Class</p>
              <p>{student.class}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Branch</p>
              <p className="capitalize">{student.branch}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sub-system</p>
              <p className="capitalize">{student.subsystem}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Academic Year</p>
              <p>{student.academic_year || '2024-25'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Previous School</p>
            <p>{student.previous_school || 'Not provided'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
              <p>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gender</p>
              <p className="capitalize">{student.gender || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p>{student.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Enrollment Date</p>
              <p>{student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'Not provided'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p>{student.address || 'Not provided'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Place of Birth</p>
              <p>{student.place_of_birth || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nationality</p>
              <p>{student.nationality || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Religion</p>
              <p>{student.religion || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Previous Class</p>
              <p>{student.previous_class || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fees Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fees Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Fees</p>
              <p className="text-lg font-semibold">{student.total_fees.toLocaleString()} XOF</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Paid Amount</p>
              <p className="text-lg font-semibold text-green-600">{student.paid_fees.toLocaleString()} XOF</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
              <p className="text-lg font-semibold text-red-600">{(student.total_fees - student.paid_fees).toLocaleString()} XOF</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Payment Progress</span>
              <span>{student.total_fees > 0 ? Math.round((student.paid_fees / student.total_fees) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${student.total_fees > 0 ? (student.paid_fees / student.total_fees) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {onEdit && (
          <Button onClick={() => onEdit(student)}>
            Edit Student
          </Button>
        )}
      </div>
    </div>
  )
}
