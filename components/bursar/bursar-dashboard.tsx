"use client"

import { useState, useEffect } from 'react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useBursar } from '@/lib/bursar-context'

import { PaymentRecording } from './payment-recording'
import { PaymentDetailsDialog } from './payment-details-dialog'
import { PaymentForm } from './payment-form'
import { CollectionReport } from './reports/collection-report'

import { RevenueReport } from './reports/revenue-report'
import { useCurrencyFormatter } from '@/lib/app-configuration-context-v2'
import { useToast } from '@/hooks/use-toast'

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

  const { success: toastSuccess } = useToast()
  const { formatCurrency } = useCurrencyFormatter()
  const [selectedView, setSelectedView] = useState<string>("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([])
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [studentSearchTerm, setStudentSearchTerm] = useState("")

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

  const handlePaymentSuccess = (paymentId: string) => {
    setShowPaymentForm(false)
    toastSuccess("Payment recorded successfully")
    // Optionally refresh data here if needed
  }

  // Load enrolled students
  useEffect(() => {
    const loadEnrolledStudents = async () => {
      setIsLoadingStudents(true)
      try {
        const response = await fetch('/api/students?status=active')
        if (response.ok) {
          const data = await response.json()
          
          // Always fetch all classes to map class IDs to class names
          let updatedData = data
          
          // Get all students that have a class value (either UUID or other format)
          const studentsWithClass = data.filter((student: any) => student.class)
          
          if (studentsWithClass.length > 0) {
            try {
              // Fetch all classes
              const classesResponse = await fetch('/api/classes')
              if (classesResponse.ok) {
                const classesData = await classesResponse.json()
                // Create a map of class ID to class name
                const classMap = new Map(classesData.map((cls: any) => [cls.id, cls.name]))
                
                // Update all students with class names
                updatedData = data.map((student: any) => {
                  // If student has a class value
                  if (student.class) {
                    // Check if it's a UUID and we have it in the map
                    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student.class)
                    
                    if (isUUID && classMap.has(student.class)) {
                      // Use the class name from the map
                      return { ...student, class_name: classMap.get(student.class) }
                    } else if (student.class_name) {
                      // If class_name already exists, keep it
                      return student
                    } else if (!isUUID) {
                      // If class is not a UUID, it might be a class name already
                      return { ...student, class_name: student.class }
                    }
                  }
                  // Return student as-is if no class or no match found
                  return student
                })
              }
            } catch (error) {
              console.warn('Error fetching classes for name resolution:', error)
              // Continue with original data if class fetch fails
            }
          }
          
          // Fetch payment amounts for each student
          const studentIds = updatedData.map((s: any) => s.id)
          if (studentIds.length > 0) {
            try {
              // Fetch all student fee assignments to calculate total paid amounts
              const feesResponse = await fetch('/api/bursar/student-fees')
              if (feesResponse.ok) {
                const feesData = await feesResponse.json()
                const feesArray = feesData.success ? feesData.data : feesData
                
                // Calculate total paid amount per student
                const paidAmountsMap = new Map<string, number>()
                if (Array.isArray(feesArray)) {
                  feesArray.forEach((fee: any) => {
                    const studentId = fee.studentId
                    const paidAmount = fee.paidAmount || 0
                    const currentTotal = paidAmountsMap.get(studentId) || 0
                    paidAmountsMap.set(studentId, currentTotal + paidAmount)
                  })
                }
                
                // Add paid amounts to student data
                updatedData = updatedData.map((student: any) => ({
                  ...student,
                  totalPaid: paidAmountsMap.get(student.id) || 0
                }))
              }
            } catch (error) {
              console.warn('Error fetching payment amounts:', error)
              // Continue without payment data
              updatedData = updatedData.map((student: any) => ({
                ...student,
                totalPaid: 0
              }))
            }
          } else {
            updatedData = updatedData.map((student: any) => ({
              ...student,
              totalPaid: 0
            }))
          }
          
          setEnrolledStudents(updatedData || [])
        } else {
          console.error('Failed to load students')
          setEnrolledStudents([])
        }
      } catch (error) {
        console.error('Error loading students:', error)
        setEnrolledStudents([])
      } finally {
        setIsLoadingStudents(false)
      }
    }

    if (selectedView === 'overview') {
      loadEnrolledStudents()
    }
  }, [selectedView])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">Manage student fees, payments, and financial reports</p>
        </div>
        <Button onClick={() => setShowPaymentForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
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

           <TabsTrigger value="payments">Payment Recording</TabsTrigger>
           <TabsTrigger value="reports">Reports</TabsTrigger>
           <TabsTrigger value="collection-report">Collection Report</TabsTrigger>

           <TabsTrigger value="revenue-report">Revenue Report</TabsTrigger>
         </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fee Structures */}


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

          {/* Enrolled Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
              <CardDescription>List of all currently enrolled students in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search students by name or student ID..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              {isLoadingStudents ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading students...</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subsystem</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledStudents
                      .filter(student => {
                        const searchLower = studentSearchTerm.toLowerCase()
                        return (
                          !studentSearchTerm ||
                          (student.first_name?.toLowerCase().includes(searchLower)) ||
                          (student.last_name?.toLowerCase().includes(searchLower)) ||
                          (student.student_id?.toLowerCase().includes(searchLower)) ||
                          (student.class_name?.toLowerCase().includes(searchLower))
                        )
                      })
                      .map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.student_id}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.first_name} {student.last_name}</div>
                              {student.email && (
                                <div className="text-sm text-muted-foreground">{student.email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{student.class_name || student.class || 'Not Assigned'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {student.subsystem || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{student.academic_year || 'N/A'}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(student.totalPaid || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                              {student.status === 'active' ? 'Active' : student.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    {enrolledStudents.length === 0 && !isLoadingStudents && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No enrolled students found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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

        {/* Payment Form Dialog */}
        <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <PaymentForm
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }
