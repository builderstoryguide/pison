"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  CreditCard, 
  Plus, 
  Search, 
  DollarSign, 
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  X,
  Calendar,
  User,
  Building
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Payment {
  id: string
  amount: number
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque'
  payerName: string
  payerType: 'student' | 'parent' | 'external'
  description: string
  date: string
  status: 'completed' | 'pending' | 'failed'
  reference?: string
}

const mockPayments: Payment[] = [
  {
    id: 'PAY001',
    amount: 50000,
    paymentMethod: 'cash',
    payerName: 'John Doe',
    payerType: 'student',
    description: 'Tuition fee payment',
    date: '2024-01-15',
    status: 'completed',
    reference: 'REF-001'
  },
  {
    id: 'PAY002',
    amount: 25000,
    paymentMethod: 'bank_transfer',
    payerName: 'Jane Smith',
    payerType: 'parent',
    description: 'Library fee',
    date: '2024-01-16',
    status: 'completed',
    reference: 'REF-002'
  },
  {
    id: 'PAY003',
    amount: 15000,
    paymentMethod: 'mobile_money',
    payerName: 'Mike Johnson',
    payerType: 'external',
    description: 'Event registration',
    date: '2024-01-17',
    status: 'pending',
    reference: 'REF-003'
  }
]

const getPaymentMethodBadge = (method: Payment['paymentMethod']) => {
  const methods = {
    cash: { label: 'Cash', variant: 'default' as const },
    bank_transfer: { label: 'Bank Transfer', variant: 'secondary' as const },
    mobile_money: { label: 'Mobile Money', variant: 'outline' as const },
    cheque: { label: 'Cheque', variant: 'outline' as const }
  }
  return methods[method]
}

const getStatusBadge = (status: Payment['status']) => {
  const statuses = {
    completed: { label: 'Completed', variant: 'default' as const, icon: CheckCircle },
    pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
    failed: { label: 'Failed', variant: 'destructive' as const, icon: X }
  }
  return statuses[status]
}

export function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments)
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | Payment['status']>('all')
  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    amount: 0,
    paymentMethod: 'cash',
    payerName: '',
    payerType: 'student',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending'
  })
  const { toast } = useToast()

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.payerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const completedPayments = filteredPayments.filter(p => p.status === 'completed').length

  const handleAddPayment = () => {
    if (!newPayment.amount || !newPayment.payerName || !newPayment.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const payment: Payment = {
      id: `PAY${String(payments.length + 1).padStart(3, '0')}`,
      amount: newPayment.amount!,
      paymentMethod: newPayment.paymentMethod!,
      payerName: newPayment.payerName!,
      payerType: newPayment.payerType!,
      description: newPayment.description!,
      date: newPayment.date || new Date().toISOString().split('T')[0],
      status: newPayment.status || 'pending',
      reference: newPayment.reference
    }

    setPayments([...payments, payment])
    setIsAddPaymentOpen(false)
    setNewPayment({
      amount: 0,
      paymentMethod: 'cash',
      payerName: '',
      payerType: 'student',
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    })
    toast({
      title: "Payment Recorded",
      description: `Payment of ${newPayment.amount?.toLocaleString()} has been recorded successfully`,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground">Record and manage all payments in the system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPayments}</div>
            <p className="text-xs text-muted-foreground">
              {filteredPayments.length > 0 ? Math.round((completedPayments / filteredPayments.length) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredPayments.filter(p => p.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-1 gap-2 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Record New Payment</DialogTitle>
                  <DialogDescription>
                    Record a new payment transaction in the system
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0"
                        value={newPayment.amount || ''}
                        onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newPayment.date || ''}
                        onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payerName">Payer Name *</Label>
                      <Input
                        id="payerName"
                        placeholder="Enter payer name"
                        value={newPayment.payerName || ''}
                        onChange={(e) => setNewPayment({ ...newPayment, payerName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payerType">Payer Type *</Label>
                      <Select
                        value={newPayment.payerType}
                        onValueChange={(value) => setNewPayment({ ...newPayment, payerType: value as Payment['payerType'] })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payer type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="external">External</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method *</Label>
                      <Select
                        value={newPayment.paymentMethod}
                        onValueChange={(value) => setNewPayment({ ...newPayment, paymentMethod: value as Payment['paymentMethod'] })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reference">Reference (Optional)</Label>
                      <Input
                        id="reference"
                        placeholder="Payment reference"
                        value={newPayment.reference || ''}
                        onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter payment description"
                      value={newPayment.description || ''}
                      onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPayment}>
                    Record Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => {
                    const methodBadge = getPaymentMethodBadge(payment.paymentMethod)
                    const statusBadge = getStatusBadge(payment.status)
                    const StatusIcon = statusBadge.icon

                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.payerName}</div>
                            <div className="text-sm text-muted-foreground capitalize">{payment.payerType}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={methodBadge.variant}>{methodBadge.label}</Badge>
                        </TableCell>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{payment.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

