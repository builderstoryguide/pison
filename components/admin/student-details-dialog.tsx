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
}

export function StudentDetailsDialog({ student, onClose }: StudentDetailsDialogProps) {
  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={student.avatar || "/placeholder.svg"} />
          <AvatarFallback className="text-lg">
            {student.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-semibold">{student.name}</h3>
            {student.isNewStudent && (
              <Badge variant="secondary">New Student</Badge>
            )}
          </div>
          <p className="text-muted-foreground mb-2">{student.email}</p>
          <div className="flex gap-2">
            <Badge className={enrollmentStatusColors[student.enrollmentStatus]}>
              {student.enrollmentStatus}
            </Badge>
            <Badge className={feesStatusColors[student.feesStatus]}>
              Fees: {student.feesStatus}
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
              <p className="font-mono">{student.studentId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Admission Number</p>
              <p className="font-mono">{student.admissionNumber}</p>
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
              <p>{student.academicYear}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Previous School</p>
            <p>{student.previousSchool || 'Not provided'}</p>
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
              <p>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
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
              <p>{new Date(student.enrollmentDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p>{student.address || 'Not provided'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Guardian Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Guardian Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Guardian Name</p>
              <p>{student.guardianName || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Guardian Phone</p>
              <p>{student.guardianPhone || 'Not provided'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Guardian Email</p>
            <p>{student.guardianEmail || 'Not provided'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      {student.emergencyContact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Name</p>
                <p>{student.emergencyContact.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{student.emergencyContact.phone}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Relationship</p>
              <p>{student.emergencyContact.relationship}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medical Information */}
      {student.medicalInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blood Group</p>
                <p>{student.medicalInfo.bloodGroup || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                <p>{student.medicalInfo.allergies || 'None'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medical Conditions</p>
                <p>{student.medicalInfo.conditions || 'None'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <p className="text-lg font-semibold">₦{student.totalFees.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Paid Amount</p>
              <p className="text-lg font-semibold text-green-600">₦{student.paidFees.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
              <p className="text-lg font-semibold text-red-600">₦{(student.totalFees - student.paidFees).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Payment Progress</span>
              <span>{Math.round((student.paidFees / student.totalFees) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${(student.paidFees / student.totalFees) * 100}%` }}
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
        <Button>
          Edit Student
        </Button>
      </div>
    </div>
  )
}
