"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Calendar,
  CreditCard,
  Receipt,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useFinancial, type FeeStructure, type Payment, type StudentFeeAssignment } from "@/lib/financial-context"
import { FeeStructureForm } from "./fee-structure-form"
import { PaymentForm } from "./payment-form"
import { StudentFeeAssignmentForm } from "./student-fee-assignment-form"
import { PaymentPlanForm } from "./payment-plan-form"
import { useToast } from "@/hooks/use-toast"
import { usePDFExport } from "@/hooks/use-pdf-export"

export function FinancialManagement() {
  const { 
    feeStructures, 
    payments, 
    paymentPlans, 
    studentFeeAssignments,
    getFinancialSummary, 
    getOutstandingPayments,
    deleteFeeStructure,
    deletePayment,
    deleteStudentFeeAssignment,
    deletePaymentPlan
  } = useFinancial()
  
  const { toast } = useToast()
  const { 
    isGenerating,
    exportPaymentReport,
    exportFeeStructureReport,
    exportOutstandingFeesReport,
    exportComprehensiveReport
  } = usePDFExport()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("payments")
  
  // Form states
  const [showFeeStructureForm, setShowFeeStructureForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showStudentFeeAssignmentForm, setShowStudentFeeAssignmentForm] = useState(false)
  const [showPaymentPlanForm, setShowPaymentPlanForm] = useState(false)
  
  // Edit states
  const [editingFeeStructure, setEditingFeeStructure] = useState<FeeStructure | undefined>(undefined)
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>(undefined)
  const [editingStudentFeeAssignment, setEditingStudentFeeAssignment] = useState<StudentFeeAssignment | undefined>(undefined)
  const [editingPaymentPlan, setEditingPaymentPlan] = useState<any>(undefined)

  const financialSummary = getFinancialSummary()
  const outstandingPayments = getOutstandingPayments()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "partial":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case "overdue":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      paid: "default",
      partial: "secondary",
      pending: "outline",
      overdue: "destructive",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Filter functions
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.feeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredFeeStructures = feeStructures.filter((fee) => {
    const matchesSearch =
      fee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.level.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.subsystem.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredStudentFeeAssignments = studentFeeAssignments.filter((assignment) => {
    const matchesSearch =
      assignment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.feeStructureName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredPaymentPlans = paymentPlans.filter((plan) => {
    const matchesSearch =
      plan.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Success handlers
  const handleFeeStructureSuccess = (feeStructureId: string) => {
    setShowFeeStructureForm(false)
    setEditingFeeStructure(undefined)
    toast.success(
      editingFeeStructure ? "Fee structure updated successfully" : "Fee structure created successfully"
    )
  }

  const handlePaymentSuccess = (paymentId: string) => {
    setShowPaymentForm(false)
    setEditingPayment(undefined)
    toast.success(
      editingPayment ? "Payment updated successfully" : "Payment recorded successfully"
    )
  }

  const handleStudentFeeAssignmentSuccess = (assignmentId: string) => {
    setShowStudentFeeAssignmentForm(false)
    setEditingStudentFeeAssignment(undefined)
    toast.success(
      editingStudentFeeAssignment ? "Fee assignment updated successfully" : "Fee assigned to student successfully"
    )
  }

  const handlePaymentPlanSuccess = (planId: string) => {
    setShowPaymentPlanForm(false)
    setEditingPaymentPlan(undefined)
    toast.success(
      editingPaymentPlan ? "Payment plan updated successfully" : "Payment plan created successfully"
    )
  }

  // Delete handlers
  const handleDeleteFeeStructure = async (id: string) => {
    if (confirm("Are you sure you want to delete this fee structure? This action cannot be undone.")) {
      const result = await deleteFeeStructure(id)
      if (result.success) {
        toast.success("Fee structure deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete fee structure")
      }
    }
  }

  const handleDeletePayment = async (id: string) => {
    if (confirm("Are you sure you want to delete this payment? This action cannot be undone.")) {
      const result = await deletePayment(id)
      if (result.success) {
        toast.success("Payment deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete payment")
      }
    }
  }

  const handleDeleteStudentFeeAssignment = async (id: string) => {
    if (confirm("Are you sure you want to delete this fee assignment? This action cannot be undone.")) {
      const result = await deleteStudentFeeAssignment(id)
      if (result.success) {
        toast.success("Fee assignment deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete fee assignment")
      }
    }
  }

  const handleDeletePaymentPlan = async (id: string) => {
    if (confirm("Are you sure you want to delete this payment plan? This action cannot be undone.")) {
      const result = await deletePaymentPlan(id)
      if (result.success) {
        toast.success("Payment plan deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete payment plan")
      }
    }
  }

  // Edit handlers
  const handleEditFeeStructure = (feeStructure: FeeStructure) => {
    setEditingFeeStructure(feeStructure)
    setShowFeeStructureForm(true)
  }

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment)
    setShowPaymentForm(true)
  }

  const handleEditStudentFeeAssignment = (assignment: StudentFeeAssignment) => {
    setEditingStudentFeeAssignment(assignment)
    setShowStudentFeeAssignmentForm(true)
  }

  const handleEditPaymentPlan = (plan: any) => {
    setEditingPaymentPlan(plan)
    setShowPaymentPlanForm(true)
  }

  // PDF Export handlers
  const handleExportPaymentReport = async () => {
    await exportPaymentReport(filteredPayments)
  }

  const handleExportFeeStructureReport = async () => {
    await exportFeeStructureReport(filteredFeeStructures)
  }

  const handleExportOutstandingFeesReport = async () => {
    await exportOutstandingFeesReport(filteredStudentFeeAssignments)
  }

  const handleExportComprehensiveReport = async () => {
    const comprehensiveData = {
      title: 'Comprehensive Financial Report',
      generatedAt: new Date().toISOString(),
      generatedBy: 'Admin',
      summary: {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + p.amountPaid, 0),
        outstandingAmount: studentFeeAssignments.reduce((sum, a) => sum + a.balance, 0),
        paymentMethods: payments.reduce((acc, p) => {
          acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amountPaid
          return acc
        }, {} as Record<string, number>)
      },
      payments: payments,
      feeStructures: feeStructures,
      studentFeeAssignments: studentFeeAssignments
    }
    await exportComprehensiveReport(comprehensiveData)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground">Manage school fees, payments, and financial reports</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleExportComprehensiveReport} 
            variant="outline"
            disabled={isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Export All"}
          </Button>
          <Button onClick={() => setShowPaymentForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Button onClick={() => setShowFeeStructureForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Fee Structure
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {financialSummary.totalCollections.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {financialSummary.collectionRate.toFixed(1)}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {financialSummary.totalOutstanding.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {financialSummary.overduePayments} overdue payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {financialSummary.paidStudents} have paid fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">
              {outstandingPayments.length} outstanding
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financial Records</CardTitle>
          <CardDescription>Manage all financial transactions and records</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="fee-structures">Fee Structures</TabsTrigger>
              <TabsTrigger value="assignments">Student Fees</TabsTrigger>
              <TabsTrigger value="payment-plans">Payment Plans</TabsTrigger>
            </TabsList>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Payment Records</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExportPaymentReport} 
                    variant="outline" 
                    size="sm"
                    disabled={isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating..." : "Export PDF"}
                  </Button>
                  <Button onClick={() => setShowPaymentForm(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Receipt className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No payments found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.studentName}</p>
                              <p className="text-sm text-muted-foreground">{payment.receiptNumber}</p>
                            </div>
                          </TableCell>
                          <TableCell>{payment.feeName}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.amountPaid.toLocaleString()} FCFA</p>
                              {payment.balance > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Balance: {payment.balance.toLocaleString()} FCFA
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.paymentMethod.replace("_", " ")}</Badge>
                          </TableCell>
                          <TableCell>{format(new Date(payment.paymentDate), "MMM dd, yyyy")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(payment.status)}
                              {getStatusBadge(payment.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditPayment(payment)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Receipt
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeletePayment(payment.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Fee Structures Tab */}
            <TabsContent value="fee-structures" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Fee Structures</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExportFeeStructureReport} 
                    variant="outline" 
                    size="sm"
                    disabled={isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating..." : "Export PDF"}
                  </Button>
                  <Button onClick={() => setShowFeeStructureForm(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Fee Structure
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Classes</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeeStructures.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No fee structures found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFeeStructures.map((feeStructure) => (
                        <TableRow key={feeStructure.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{feeStructure.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {feeStructure.subsystem} • {feeStructure.branch}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{feeStructure.level}</TableCell>
                          <TableCell>
                            {feeStructure.classNames && feeStructure.classNames.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {feeStructure.classNames.slice(0, 2).map((className, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {className}
                                  </Badge>
                                ))}
                                {feeStructure.classNames.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{feeStructure.classNames.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No classes assigned</span>
                            )}
                          </TableCell>
                          <TableCell>{feeStructure.amount.toLocaleString()} FCFA</TableCell>
                          <TableCell>{format(new Date(feeStructure.dueDate), "MMM dd, yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant={feeStructure.isActive ? "default" : "secondary"}>
                              {feeStructure.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditFeeStructure(feeStructure)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Users className="h-4 w-4 mr-2" />
                                  Assign to Students
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteFeeStructure(feeStructure.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Student Fee Assignments Tab */}
            <TabsContent value="assignments" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Student Fee Assignments</h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExportOutstandingFeesReport} 
                    variant="outline" 
                    size="sm"
                    disabled={isGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generating..." : "Export PDF"}
                  </Button>
                  <Button onClick={() => setShowStudentFeeAssignmentForm(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Fee
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Fee Structure</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudentFeeAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No fee assignments found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudentFeeAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{assignment.studentName}</p>
                              <p className="text-sm text-muted-foreground">
                                {assignment.academicYear} • {assignment.term}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{assignment.feeStructureName}</TableCell>
                          <TableCell>{assignment.totalAmount.toLocaleString()} FCFA</TableCell>
                          <TableCell>{assignment.amountPaid.toLocaleString()} FCFA</TableCell>
                          <TableCell>
                            <span className={assignment.balance > 0 ? "text-red-600" : "text-green-600"}>
                              {assignment.balance.toLocaleString()} FCFA
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(assignment.status)}
                              {getStatusBadge(assignment.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditStudentFeeAssignment(assignment)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Receipt className="h-4 w-4 mr-2" />
                                  Record Payment
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteStudentFeeAssignment(assignment.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Payment Plans Tab */}
            <TabsContent value="payment-plans" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Payment Plans</h3>
                <Button onClick={() => setShowPaymentPlanForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Installments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPaymentPlans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No payment plans found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPaymentPlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{plan.studentName}</p>
                              <p className="text-sm text-muted-foreground">
                                {plan.installments.length} installments
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{plan.totalAmount.toLocaleString()} FCFA</TableCell>
                          <TableCell>{plan.amountPaid.toLocaleString()} FCFA</TableCell>
                          <TableCell>
                            <span className={plan.totalAmount - plan.amountPaid > 0 ? "text-red-600" : "text-green-600"}>
                              {(plan.totalAmount - plan.amountPaid).toLocaleString()} FCFA
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {plan.installments.map((installment, index) => (
                                <div
                                  key={installment.id}
                                  className={`w-2 h-2 rounded-full ${
                                    installment.status === "paid" ? "bg-green-500" : 
                                    installment.status === "overdue" ? "bg-red-500" : "bg-gray-300"
                                  }`}
                                  title={`Installment ${index + 1}: ${installment.status}`}
                                />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={plan.status === "active" ? "default" : plan.status === "completed" ? "secondary" : "destructive"}>
                              {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditPaymentPlan(plan)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Receipt className="h-4 w-4 mr-2" />
                                  Record Payment
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeletePaymentPlan(plan.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={showFeeStructureForm} onOpenChange={setShowFeeStructureForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFeeStructure ? "Edit Fee Structure" : "Create Fee Structure"}
            </DialogTitle>
          </DialogHeader>
          <FeeStructureForm
            onSuccess={handleFeeStructureSuccess}
            onCancel={() => {
              setShowFeeStructureForm(false)
              setEditingFeeStructure(undefined)
            }}
            editData={editingFeeStructure}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? "Edit Payment" : "Record Payment"}
            </DialogTitle>
          </DialogHeader>
          <PaymentForm
            onSuccess={handlePaymentSuccess}
            onCancel={() => {
              setShowPaymentForm(false)
              setEditingPayment(undefined)
            }}
            editData={editingPayment}
          />
        </DialogContent>
      </Dialog>

      {/* Student Fee Assignment Form Dialog */}
      <Dialog open={showStudentFeeAssignmentForm} onOpenChange={setShowStudentFeeAssignmentForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStudentFeeAssignment ? "Edit Fee Assignment" : "Assign Fee to Student"}
            </DialogTitle>
          </DialogHeader>
          <StudentFeeAssignmentForm
            onSuccess={handleStudentFeeAssignmentSuccess}
            onCancel={() => {
              setShowStudentFeeAssignmentForm(false)
              setEditingStudentFeeAssignment(undefined)
            }}
            editData={editingStudentFeeAssignment}
          />
        </DialogContent>
      </Dialog>

      {/* Payment Plan Form Dialog */}
      <Dialog open={showPaymentPlanForm} onOpenChange={setShowPaymentPlanForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPaymentPlan ? "Edit Payment Plan" : "Create Payment Plan"}
            </DialogTitle>
          </DialogHeader>
          <PaymentPlanForm
            onSuccess={handlePaymentPlanSuccess}
            onCancel={() => {
              setShowPaymentPlanForm(false)
              setEditingPaymentPlan(undefined)
            }}
            editData={editingPaymentPlan}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
