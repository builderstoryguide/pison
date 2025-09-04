"use client"

import { useState, useEffect } from 'react'
import { DollarSign, Plus, History, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

import { Student, useStudentManagement } from '@/lib/student-management-context'
import { supabase } from '@/lib/supabase'

const feesStatusColors = {
  paid: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-orange-100 text-orange-800',
  overdue: 'bg-red-100 text-red-800'
}

interface StudentFeesDialogProps {
  student: Student
  onClose: () => void
}

export function StudentFeesDialog({ student, onClose }: StudentFeesDialogProps) {
  const { updateStudent, isLoading } = useStudentManagement()
  const [paymentAmount, setPaymentAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentStudent, setCurrentStudent] = useState<Student>(student)

  // Fetch real-time student data from database
  const fetchStudentData = async () => {
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }
    
    setIsRefreshing(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', student.id)
        .single()

      if (error) {
        console.error('Error fetching student data:', error)
        return
      }

      if (data) {
        setCurrentStudent(data as Student)
      }
    } catch (err) {
      console.error('Error fetching student data:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fetch data on component mount and when student changes
  useEffect(() => {
    fetchStudentData()
  }, [student.id])

  const outstandingAmount = (currentStudent.total_fees || 0) - (currentStudent.paid_fees || 0)
  const paymentPercentage = currentStudent.total_fees > 0 
    ? ((currentStudent.paid_fees || 0) / currentStudent.total_fees) * 100 
    : 0

  const handlePayment = async () => {
    setError(null)
    setSuccess(null)
    
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payment amount')
      return
    }

    const newTotalPaid = (currentStudent.paid_fees || 0) + amount
    if (newTotalPaid > (currentStudent.total_fees || 0)) {
      setError('Payment amount exceeds outstanding balance')
      return
    }

    // Determine new fees status
    let newFeesStatus = currentStudent.fees_status
    if (newTotalPaid >= (currentStudent.total_fees || 0)) {
      newFeesStatus = 'paid'
    } else if (newTotalPaid > 0) {
      newFeesStatus = 'partial'
    }

    const updateSuccess = await updateStudent(student.id, {
      paid_fees: newTotalPaid,
      fees_status: newFeesStatus
    })
    
    if (updateSuccess) {
      setPaymentAmount('')
              setSuccess(`Payment of ${amount.toLocaleString()} XOF recorded successfully!`)
      // Refresh data from database
      await fetchStudentData()
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError('Failed to update payment. Please try again.')
    }
  }

  const handleFullPayment = async () => {
    setError(null)
    setSuccess(null)
    
    const updateSuccess = await updateStudent(student.id, {
      paid_fees: currentStudent.total_fees,
      fees_status: 'paid'
    })
    
    if (updateSuccess) {
              setSuccess(`Full payment of ${(currentStudent.total_fees || 0).toLocaleString()} XOF recorded successfully!`)
      // Refresh data from database
      await fetchStudentData()
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError('Failed to update payment. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Student Info */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">{currentStudent.first_name} {currentStudent.last_name}</h3>
        <p className="text-sm text-muted-foreground">{currentStudent.student_id}</p>
        <Badge className={feesStatusColors[currentStudent.fees_status]} variant="outline">
          {currentStudent.fees_status}
        </Badge>
      </div>

      <Separator />

      {/* Fees Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fees Summary
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStudentData}
              disabled={isRefreshing}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Fees</p>
              <p className="text-2xl font-bold">{(currentStudent.total_fees || 0).toLocaleString()} XOF</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">{(currentStudent.paid_fees || 0).toLocaleString()} XOF</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">{outstandingAmount.toLocaleString()} XOF</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Payment Progress</span>
              <span>{Math.round(paymentPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${paymentPercentage}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      {outstandingAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Record Payment
            </CardTitle>
            <CardDescription>
              Enter the payment amount to update the student's fees record
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                              <Label htmlFor="paymentAmount">Payment Amount (XOF)</Label>
              <Input
                id="paymentAmount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={outstandingAmount}
              />
              <p className="text-xs text-muted-foreground">
                Maximum: {outstandingAmount.toLocaleString()} XOF
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <DollarSign className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handlePayment} 
                disabled={isLoading || !paymentAmount}
                className="flex-1"
              >
                {isLoading ? 'Processing...' : 'Record Payment'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleFullPayment}
                disabled={isLoading}
              >
                Pay Full Amount
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Complete */}
      {outstandingAmount === 0 && (
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertDescription>
            All fees have been paid for this student. No outstanding balance.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment History Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Payment history feature coming soon
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
