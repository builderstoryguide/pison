"use client"

import { useState } from 'react'
import { DollarSign, Plus, History } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

import { Student, useStudentManagement } from '@/lib/student-management-context'

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
  const { updateFeesStatus, isLoading } = useStudentManagement()
  const [paymentAmount, setPaymentAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  const outstandingAmount = student.totalFees - student.paidFees
  const paymentPercentage = (student.paidFees / student.totalFees) * 100

  const handlePayment = async () => {
    setError(null)
    
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payment amount')
      return
    }

    const newTotalPaid = student.paidFees + amount
    if (newTotalPaid > student.totalFees) {
      setError('Payment amount exceeds outstanding balance')
      return
    }

    const success = await updateFeesStatus(student.id, newTotalPaid)
    if (success) {
      setPaymentAmount('')
      onClose()
    }
  }

  const handleFullPayment = async () => {
    const success = await updateFeesStatus(student.id, student.totalFees)
    if (success) {
      onClose()
    }
  }

  return (
    <div className="space-y-6">
      {/* Student Info */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">{student.name}</h3>
        <p className="text-sm text-muted-foreground">{student.studentId}</p>
        <Badge className={feesStatusColors[student.feesStatus]} variant="outline">
          {student.feesStatus}
        </Badge>
      </div>

      <Separator />

      {/* Fees Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fees Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Fees</p>
              <p className="text-2xl font-bold">₦{student.totalFees.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Paid Amount</p>
              <p className="text-2xl font-bold text-green-600">₦{student.paidFees.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">₦{outstandingAmount.toLocaleString()}</p>
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
              <Label htmlFor="paymentAmount">Payment Amount (₦)</Label>
              <Input
                id="paymentAmount"
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={outstandingAmount}
              />
              <p className="text-xs text-muted-foreground">
                Maximum: ₦{outstandingAmount.toLocaleString()}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
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
