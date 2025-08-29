"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, DollarSign, Receipt, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/currency-utils'

interface Student {
  id: string
  name: string
  studentNumber: string
  className: string
}

interface StudentFee {
  id: string
  studentId: string
  studentName: string
  studentNumber: string
  feeStructureName: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: string
  dueDate: string
}

interface PaymentMethod {
  id: string
  name: string
  code: string
}

interface Payment {
  id: string
  studentName: string
  studentNumber: string
  receiptNumber: string
  amount: number
  paymentMethodName: string
  paymentDate: string
  status: string
  createdAt: string
}

export function PaymentRecording() {
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [studentFees, setStudentFees] = useState<StudentFee[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedStudentFee, setSelectedStudentFee] = useState<StudentFee | null>(null)

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethodId: "",
    paymentDate: new Date().toISOString().split('T')[0],
    description: "",
    referenceNumber: "",
    notes: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load student fees
      const feesResponse = await fetch('/api/bursar/student-fees')
      const feesData = await feesResponse.json()
      setStudentFees(feesData)

      // Load payments
      const paymentsResponse = await fetch('/api/bursar/payments')
      const paymentsData = await paymentsResponse.json()
      setPayments(paymentsData)

      // Load payment methods
      const methodsResponse = await fetch('/api/bursar/payment-methods?isActive=true')
      const methodsData = await methodsResponse.json()
      setPaymentMethods(methodsData)
    } catch (error) {
      toast.error("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleRecordPayment = async () => {
    if (!selectedStudentFee) return

    try {
      const response = await fetch('/api/bursar/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudentFee.studentId,
          studentFeeId: selectedStudentFee.id,
          amount: parseFloat(paymentForm.amount),
          paymentMethodId: paymentForm.paymentMethodId,
          paymentDate: paymentForm.paymentDate,
          academicYear: "2024-2025", // Get from fee structure
          term: "first", // Get from fee structure
          description: paymentForm.description,
          referenceNumber: paymentForm.referenceNumber,
          notes: paymentForm.notes
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Payment recorded successfully. Receipt: ${result.receiptNumber}`)
        setIsPaymentDialogOpen(false)
        resetPaymentForm()
        loadData()
      } else {
        toast.error(result.error || "Failed to record payment")
      }
    } catch (error) {
      toast.error("Failed to record payment")
    }
  }

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: "",
      paymentMethodId: "",
      paymentDate: new Date().toISOString().split('T')[0],
      description: "",
      referenceNumber: "",
      notes: ""
    })
    setSelectedStudentFee(null)
  }

  const openPaymentDialog = (studentFee: StudentFee) => {
    setSelectedStudentFee(studentFee)
    setPaymentForm({
      ...paymentForm,
      amount: studentFee.balanceAmount.toString()
    })
    setIsPaymentDialogOpen(true)
  }

  const filteredStudentFees = studentFees.filter(fee => {
    const matchesSearch = fee.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fee.studentNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStudent = !selectedStudent || fee.studentId === selectedStudent
    return matchesSearch && matchesStudent
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Recording</h2>
          <p className="text-muted-foreground">Record and manage student payments</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Search Students</Label>
              <Input
                placeholder="Search by student name or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.studentNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Fees ({filteredStudentFees.length})</CardTitle>
          <CardDescription>
            View student fee balances and record payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Fee Structure</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Paid Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudentFees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{fee.studentName}</div>
                      <div className="text-sm text-muted-foreground">{fee.studentNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell>{fee.feeStructureName}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(fee.totalAmount)}</TableCell>
                  <TableCell>{formatCurrency(fee.paidAmount)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(fee.balanceAmount)}</TableCell>
                  <TableCell>{getStatusBadge(fee.status)}</TableCell>
                  <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {fee.balanceAmount > 0 && (
                      <Button
                        size="sm"
                        onClick={() => openPaymentDialog(fee)}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Record Payment
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>
            Latest payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.slice(0, 10).map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.studentName}</div>
                      <div className="text-sm text-muted-foreground">{payment.studentNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{payment.paymentMethodName}</TableCell>
                  <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedStudentFee?.studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2 grid gap-4 py-4">
            <div>
              <Label htmlFor="amount">Amount (XAF)</Label>
              <Input
                id="amount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select 
                value={paymentForm.paymentMethodId} 
                onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethodId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                placeholder="e.g., Tuition fee payment"
              />
            </div>
            <div>
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={paymentForm.referenceNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                placeholder="Optional reference number"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

