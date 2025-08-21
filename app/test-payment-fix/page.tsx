"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { PaymentForm } from "@/components/admin/payment-form"
import { useStudentManagement } from "@/lib/student-management-context"
import { useFinancial } from "@/lib/financial-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestPaymentFixPage() {
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const { students, loadStudents } = useStudentManagement()
  const { payments } = useFinancial()

  const handlePaymentSuccess = (paymentId: string) => {
    console.log("Payment recorded successfully:", paymentId)
    setShowPaymentForm(false)
  }

  const handleCancel = () => {
    setShowPaymentForm(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Payment Fix Test Page</h1>
        <p className="text-muted-foreground">
          This page tests the payment recording functionality with real student data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Students Information */}
        <Card>
          <CardHeader>
            <CardTitle>Available Students</CardTitle>
            <CardDescription>
              Students loaded from database (should have UUID IDs)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {students.length === 0 ? (
                <p className="text-muted-foreground">No students loaded</p>
              ) : (
                students.slice(0, 5).map((student) => (
                  <div key={student.id} className="p-3 border rounded">
                    <div className="font-medium">
                      {student.first_name} {student.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ID: {student.student_id} | UUID: {student.id.substring(0, 8)}...
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Class: {student.class}
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button 
              onClick={loadStudents} 
              className="mt-4"
              variant="outline"
            >
              Reload Students
            </Button>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Recording</CardTitle>
            <CardDescription>
              Test recording a payment with real student data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  Record New Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <PaymentForm
                  onSuccess={handlePaymentSuccess}
                  onCancel={handleCancel}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>
            Payments recorded in this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {payments.length === 0 ? (
              <p className="text-muted-foreground">No payments recorded yet</p>
            ) : (
              payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="p-3 border rounded">
                  <div className="font-medium">
                    {payment.studentName} - {payment.amountPaid.toLocaleString()} FCFA
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Date: {payment.paymentDate} | Method: {payment.paymentMethod}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Receipt: {payment.receiptNumber}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Before Testing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Run the SQL script: <code>scripts/insert-sample-students.sql</code></li>
                <li>Make sure the financial tables are created: <code>scripts/create-financial-tables.sql</code></li>
                <li>Ensure Supabase connection is working</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">Testing Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click "Reload Students" to load students from database</li>
                <li>Click "Record New Payment" to open the payment form</li>
                <li>Select a student from the dropdown (should show real students)</li>
                <li>Fill in payment details and submit</li>
                <li>Check that no UUID errors occur</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">Expected Results:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Students should load with proper UUID IDs</li>
                <li>Payment form should show real student names</li>
                <li>Payment recording should succeed without UUID errors</li>
                <li>Payment should appear in the "Recent Payments" list</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
