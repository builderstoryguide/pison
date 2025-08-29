"use client"

import { useState } from 'react'
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  CreditCard, 
  FileText, 
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Minus
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBursar } from '@/lib/bursar-context'
import { FeeStructureManagement } from './fee-structure-management'
import { PaymentRecording } from './payment-recording'
import { PaymentDetailsDialog } from './payment-details-dialog'
import { CollectionReport } from './reports/collection-report'
import { OutstandingReport } from './reports/outstanding-report'
import { RevenueReport } from './reports/revenue-report'
import { formatCurrency } from '@/lib/currency-utils'

interface BursarDashboardProps {
  onNavigate?: (view: string) => void
}

export function BursarDashboard({ onNavigate }: BursarDashboardProps = {}) {
  const { 
    students, 
    feeStructures, 
    studentFees, 
    payments, 
    financialStats, 
    isLoading, 
    error 
  } = useBursar()

  const [selectedView, setSelectedView] = useState<string>("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

  const handleNavigation = (view: string) => {
    setSelectedView(view)
    if (onNavigate) {
      onNavigate(view)
    }
  }

  const handleViewPaymentDetails = (payment: any) => {
    setSelectedPayment(payment)
    setIsPaymentDialogOpen(true)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
        <p className="text-muted-foreground">Manage student fees, payments, and financial reports</p>
      </div>

      {/* Financial Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.totalFeesExpected)}</div>
            <p className="text-xs text-muted-foreground">
              Total fees expected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.totalFeesCollected)}</div>
            <p className="text-xs text-muted-foreground">
              {financialStats.collectionRate.toFixed(1)}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">
              {financialStats.overdueCount} overdue accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
                 <TabsList>
           <TabsTrigger value="overview">Overview</TabsTrigger>
           <TabsTrigger value="fee-structures">Fee Structures</TabsTrigger>
           <TabsTrigger value="payments">Payment Recording</TabsTrigger>
           <TabsTrigger value="reports">Reports</TabsTrigger>
           <TabsTrigger value="collection-report">Collection Report</TabsTrigger>
           <TabsTrigger value="outstanding-report">Outstanding Report</TabsTrigger>
           <TabsTrigger value="revenue-report">Revenue Report</TabsTrigger>
         </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fee Structures */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Fee Structures
                  <Button size="sm" onClick={() => handleNavigation("fee-structures")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </CardTitle>
                <CardDescription>Current fee structures by class</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feeStructures.slice(0, 5).map((structure) => (
                    <div key={structure.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{structure.className}</div>
                        <div className="text-sm text-muted-foreground">
                          {structure.subsystem} • {structure.academicYear}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(structure.totalAmount)}</div>
                        <div className="text-sm text-muted-foreground">{structure.term}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Receipt #{payment.receiptNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.paymentDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(payment.amount)}</div>
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Student Fees Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Fee Management</CardTitle>
              <CardDescription>View and manage student fee accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentFees
                    .filter(fee => 
                      fee.student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                      (filterStatus === "all" || fee.status === filterStatus)
                    )
                    .slice(0, 10)
                    .map((studentFee) => (
                    <TableRow key={studentFee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{studentFee.student.name}</div>
                          <div className="text-sm text-muted-foreground">{studentFee.student.studentId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{studentFee.student.class}</div>
                          <div className="text-sm text-muted-foreground">
                            {studentFee.student.subsystem} • {studentFee.student.branch}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(studentFee.totalAmount)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(studentFee.paidAmount)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(studentFee.balanceAmount)}</TableCell>
                      <TableCell>{getStatusBadge(studentFee.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Generate Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>Recent payment history and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 15).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
                      <TableCell>{payment.studentId}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.paymentMethod.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.paymentDate}</TableCell>
                      <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewPaymentDetails(payment)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewPaymentDetails(payment)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Print Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewPaymentDetails(payment)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Structures Tab */}
        <TabsContent value="fee-structures" className="space-y-4">
          <FeeStructureManagement />
        </TabsContent>

        {/* Payment Recording Tab */}
        <TabsContent value="payments" className="space-y-4">
          <PaymentRecording />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <CollectionReport />
        </TabsContent>

        {/* Collection Report Tab */}
        <TabsContent value="collection-report" className="space-y-4">
          <CollectionReport />
        </TabsContent>

        {/* Outstanding Report Tab */}
        <TabsContent value="outstanding-report" className="space-y-4">
          <OutstandingReport />
        </TabsContent>

        {/* Revenue Report Tab */}
        <TabsContent value="revenue-report" className="space-y-4">
          <RevenueReport />
        </TabsContent>
              </Tabs>

        {/* Payment Details Dialog */}
        <PaymentDetailsDialog
          payment={selectedPayment}
          isOpen={isPaymentDialogOpen}
          onClose={() => {
            setIsPaymentDialogOpen(false)
            setSelectedPayment(null)
          }}
        />
      </div>
    )
  }
