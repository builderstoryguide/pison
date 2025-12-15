"use client"

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, User, GraduationCap, Heart, FileText, Calendar, DollarSign, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { Student } from '@/lib/student-management-context'
import { useClassManagement } from '@/lib/class-management-context'
import { useStudentFeeAssignments, calculateFeeTotals } from '@/hooks/use-student-fee-assignments'
import { useFeeStructureByClass } from '@/hooks/use-fee-structure-by-class'
import { useGlobalAcademicYear } from '@/lib/app-configuration-context-v2'

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
  const { getClassById } = useClassManagement()
  const globalAcademicYear = useGlobalAcademicYear()
  
  // Get class name from class ID
  const className = useMemo(() => {
    if (!student.class) return 'Not assigned'
    const classData = getClassById(student.class)
    return classData?.name || student.class
  }, [student.class, getClassById])
  
  // Helper to check if a string is a UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }
  
  // Resolve class ID - could be UUID or class name
  const classId = useMemo(() => {
    if (!student.class) return null
    if (isUUID(student.class)) {
      return student.class
    }
    // If not UUID, try to find by name
    const classData = getClassById(student.class)
    return classData?.id || null
  }, [student.class, getClassById])
  
  // Fetch student fee assignments for accurate paid/balance amounts
  const { 
    data: feeAssignments = [], 
    isLoading: isLoadingAssignments,
    error: assignmentsError 
  } = useStudentFeeAssignments({
    studentId: student.id,
  })
  
  // Fetch fee structure for current academic year and term (default to first term)
  // This gives us the expected total fees for the student's class
  // Match the logic from edit form: use first term by default
  const {
    data: currentFeeStructure,
    isLoading: isLoadingFeeStructure,
  } = useFeeStructureByClass(
    classId,
    student.academic_year || globalAcademicYear,
    'first', // Default to first term - matching edit form behavior
    {
      enabled: !!classId && !!student.academic_year,
    }
  )
  
  // Calculate accurate totals from fee assignments (for reference/validation)
  const feeTotalsFromAssignments = useMemo(() => {
    if (feeAssignments.length === 0) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        balanceAmount: 0,
      }
    }
    return calculateFeeTotals(feeAssignments)
  }, [feeAssignments])
  
  // Determine total fees: use fee structure amount (matching edit form logic)
  // The edit form uses feeStructureData.totalAmount to set formData.total_fees
  const totalFees = useMemo(() => {
    // If we have a current fee structure, use its total amount (matches edit form)
    if (currentFeeStructure && currentFeeStructure.totalAmount > 0) {
      return currentFeeStructure.totalAmount
    }
    // Fallback to student.total_fees if no fee structure found (matches edit form fallback)
    return student.total_fees || 0
  }, [currentFeeStructure, student.total_fees])
  
  // Use student.paid_fees directly (matching edit form which uses formData.paid_fees from student)
  // The edit form shows formData.paid_fees which comes from student.paid_fees
  const paidAmount = useMemo(() => {
    return student.paid_fees || 0
  }, [student.paid_fees])
  
  // Calculate outstanding balance (matching edit form: total_fees - paid_fees)
  const outstandingBalance = useMemo(() => {
    return Math.max(0, totalFees - paidAmount)
  }, [totalFees, paidAmount])
  
  // Calculate payment progress (matching edit form calculation)
  const paymentProgress = useMemo(() => {
    if (totalFees <= 0) return 0
    return Math.min(100, Math.round((paidAmount / totalFees) * 100))
  }, [totalFees, paidAmount])
  
  const isLoadingFees = isLoadingAssignments || isLoadingFeeStructure

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={"/placeholder.svg"} />
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
              <p>{className}</p>
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
              <p>{student.academic_year || globalAcademicYear}</p>
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
            {isLoadingFees && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignmentsError && (
            <Alert variant="destructive">
              <AlertDescription>
                Error loading fee data: {(assignmentsError as Error).message}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Fees</p>
              {isLoadingFees ? (
                <p className="text-lg font-semibold text-muted-foreground">Loading...</p>
              ) : (
                <>
                  <p className="text-lg font-semibold">{totalFees.toLocaleString()} XOF</p>
                  {currentFeeStructure && (
                    <p className="text-xs text-muted-foreground">
                      From: {currentFeeStructure.name}
                    </p>
                  )}
                </>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount Paid (Installments)</p>
              {isLoadingFees ? (
                <p className="text-lg font-semibold text-muted-foreground">Loading...</p>
              ) : (
                <p className="text-lg font-semibold text-green-600">
                  {paidAmount.toLocaleString()} XOF
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Final Amount Remaining</p>
              {isLoadingFees ? (
                <p className="text-lg font-semibold text-muted-foreground">Loading...</p>
              ) : (
                <p className="text-lg font-semibold text-red-600">
                  {outstandingBalance.toLocaleString()} XOF
                </p>
              )}
            </div>
          </div>
          
          {!isLoadingFees && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Payment Progress</span>
                <span>{paymentProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all" 
                  style={{ width: `${paymentProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {!isLoadingFees && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                {currentFeeStructure 
                  ? `Total fees from: ${currentFeeStructure.name}`
                  : 'Total fees from student record'}
                {feeAssignments.length > 0 && (
                  <span className="ml-2">
                    • {feeAssignments.length} fee assignment{feeAssignments.length !== 1 ? 's' : ''} on record
                  </span>
                )}
              </p>
            </div>
          )}
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
