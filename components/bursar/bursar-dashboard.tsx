"use client"

import { useState } from "react"
import { useBursar } from "@/lib/bursar-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Receipt,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  CreditCard,
} from "lucide-react"

interface BursarDashboardProps {
  onNavigate?: (view: string) => void
}

export function BursarDashboard({ onNavigate }: BursarDashboardProps) {
  const { financialStats, studentFees, payments, searchStudentFees, filterFeesByStatus, recordPayment, isLoading } =
    useBursar()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedStudentFee, setSelectedStudentFee] = useState<string | null>(null)

  const filteredStudentFees = searchQuery
    ? searchStudentFees(searchQuery)
    : statusFilter === "all"
      ? studentFees
      : filterFeesByStatus(statusFilter as any)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CM", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleQuickPayment = async (studentFeeId: string, amount: number) => {
    const studentFee = studentFees.find((sf) => sf.id === studentFeeId)
    if (!studentFee) return

    const success = await recordPayment({
      studentId: studentFee.studentId,
      feeStructureId: studentFee.feeStructureId,
      amount,
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split("T")[0],
      academicYear: studentFee.feeStructure.academicYear,
      term: studentFee.feeStructure.term,
      description: "Quick payment",
      collectedBy: "Current User",
      status: "completed",
    })

    if (success) {
      // Refresh data or show success message
      console.log("Payment recorded successfully")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bursar Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage tuition fees, payments, and financial records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.totalFeesExpected)}</div>
            <p className="text-xs text-muted-foreground">From {financialStats.totalStudents} students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.totalFeesCollected)}</div>
            <p className="text-xs text-muted-foreground">{financialStats.collectionRate.toFixed(1)}% collection rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">{financialStats.overdueCount} overdue accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.monthlyCollection[0]?.amount || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {
                payments.filter((p) => {
                  const paymentDate = new Date(p.paymentDate)
                  const currentMonth = new Date()
                  return paymentDate.getMonth() === currentMonth.getMonth()
                }).length
              }{" "}
              payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Collection Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Progress</CardTitle>
          <CardDescription>Overall fee collection status for current academic year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Collection Rate</span>
              <span className="text-sm text-muted-foreground">{financialStats.collectionRate.toFixed(1)}%</span>
            </div>
            <Progress value={financialStats.collectionRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Collected: {formatCurrency(financialStats.totalFeesCollected)}</span>
              <span>Expected: {formatCurrency(financialStats.totalFeesExpected)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="fees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fees">Student Fees</TabsTrigger>
          <TabsTrigger value="payments">Recent Payments</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Accounts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Fee Management</CardTitle>
                  <CardDescription>Monitor and manage individual student fee accounts</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudentFees.map((studentFee) => (
                    <TableRow key={studentFee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{studentFee.student.name}</div>
                          <div className="text-sm text-muted-foreground">{studentFee.student.studentId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{studentFee.student.class}</TableCell>
                      <TableCell>{formatCurrency(studentFee.totalAmount)}</TableCell>
                      <TableCell>{formatCurrency(studentFee.paidAmount)}</TableCell>
                      <TableCell>
                        <span className={studentFee.balanceAmount > 0 ? "text-red-600" : "text-green-600"}>
                          {formatCurrency(studentFee.balanceAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(studentFee.status)}>{studentFee.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(studentFee.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {studentFee.balanceAmount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickPayment(studentFee.id, studentFee.balanceAmount)}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialStats.recentPayments.map((payment) => {
                    const student = studentFees.find((sf) => sf.studentId === payment.studentId)?.student
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono">{payment.receiptNumber}</TableCell>
                        <TableCell>
                          {student ? (
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.studentId}</div>
                            </div>
                          ) : (
                            "Unknown Student"
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell className="capitalize">{payment.paymentMethod.replace("_", " ")}</TableCell>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Accounts</CardTitle>
              <CardDescription>Students with overdue fee payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterFeesByStatus("overdue").map((studentFee) => {
                    const daysOverdue = Math.floor(
                      (new Date().getTime() - new Date(studentFee.dueDate).getTime()) / (1000 * 60 * 60 * 24),
                    )
                    return (
                      <TableRow key={studentFee.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{studentFee.student.name}</div>
                            <div className="text-sm text-muted-foreground">{studentFee.student.studentId}</div>
                          </div>
                        </TableCell>
                        <TableCell>{studentFee.student.class}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(studentFee.balanceAmount)}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{daysOverdue} days</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{studentFee.student.parentPhone}</div>
                            <div className="text-muted-foreground">{studentFee.student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm">
                              Send Reminder
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Receipt className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>Generate comprehensive financial reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-transparent" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Collection Summary Report
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Outstanding Fees Report
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Payment History Report
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Monthly Collection Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Statistics</CardTitle>
                <CardDescription>Key financial metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Students:</span>
                  <span className="font-semibold">{financialStats.totalStudents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fully Paid:</span>
                  <span className="font-semibold text-green-600">{filterFeesByStatus("paid").length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Partial Payments:</span>
                  <span className="font-semibold text-yellow-600">{filterFeesByStatus("partial").length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue:</span>
                  <span className="font-semibold text-red-600">{filterFeesByStatus("overdue").length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending:</span>
                  <span className="font-semibold text-gray-600">{filterFeesByStatus("pending").length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
