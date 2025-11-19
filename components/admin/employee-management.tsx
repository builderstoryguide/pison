"use client"

import React, { useState } from "react"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Mail,
  Phone,
  Download,
  AlertCircle,
  Users,
  UserCheck,
  UserX,
  DollarSign,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Briefcase,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEmployeeManagement } from "@/lib/employee-management-context"
import { useToast } from "@/hooks/use-toast"
import { EmployeeDetailsDialog } from "./employee-details-dialog"
import { EmployeeLeaveManagement } from "./employee-leave-management"
import { EmployeeAttendanceTracking } from "./employee-attendance-tracking"

export function EmployeeManagement() {
  const { employees, isLoading } = useEmployeeManagement()
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterEmploymentType, setFilterEmploymentType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Filter employees based on search term and filters
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesEmploymentType =
      filterEmploymentType === "all" || employee.employmentType === filterEmploymentType
    const matchesStatus = filterStatus === "all" || employee.status === filterStatus
    const matchesDepartment =
      filterDepartment === "all" || employee.department === filterDepartment

    return matchesSearch && matchesEmploymentType && matchesStatus && matchesDepartment
  })

  // Calculate statistics
  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    inactive: employees.filter((e) => e.status === "inactive").length,
    suspended: employees.filter((e) => e.status === "suspended").length,
    fullTime: employees.filter((e) => e.employmentType === "full-time").length,
    partTime: employees.filter((e) => e.employmentType === "part-time").length,
    contract: employees.filter((e) => e.employmentType === "contract").length,
    temporary: employees.filter((e) => e.employmentType === "temporary").length,
    averageSalary:
      employees.length > 0
        ? employees.reduce((sum, e) => sum + (e.salary || 0), 0) / employees.length
        : 0,
  }

  const handleViewEmployee = (employee: any) => {
    setSelectedEmployee(employee)
    setShowEmployeeDetails(true)
  }

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee)
    // Open edit dialog
    toast({
      title: "Feature Coming Soon",
      description: "Employee editing will be available soon",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            Active
          </Badge>
        )
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      case "terminated":
        return (
          <Badge variant="destructive" className="bg-red-700">
            Terminated
          </Badge>
        )
      case "retired":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            Retired
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getEmploymentTypeBadge = (type: string) => {
    switch (type) {
      case "full-time":
        return <Badge variant="default">Full-Time</Badge>
      case "part-time":
        return <Badge variant="secondary">Part-Time</Badge>
      case "contract":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            Contract
          </Badge>
        )
      case "temporary":
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-500">
            Temporary
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground">
            Manage employees, attendance, leave, and payroll
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="leave">Leave Management</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.active} active, {stats.inactive} inactive
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active}</div>
                <p className="text-xs text-muted-foreground">Currently employed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Full-Time Staff</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.fullTime}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.contract} on contract
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "XAF",
                    maximumFractionDigits: 0,
                  }).format(stats.averageSalary)}
                </div>
                <p className="text-xs text-muted-foreground">Per month</p>
              </CardContent>
            </Card>
          </div>

          {/* Employment Type Distribution */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Employment Type Distribution</CardTitle>
                <CardDescription>Breakdown of employees by employment type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Full-Time</span>
                    </div>
                    <span className="text-sm font-medium">{stats.fullTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Part-Time</span>
                    </div>
                    <span className="text-sm font-medium">{stats.partTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Contract</span>
                    </div>
                    <span className="text-sm font-medium">{stats.contract}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Temporary</span>
                    </div>
                    <span className="text-sm font-medium">{stats.temporary}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employee Status Overview</CardTitle>
                <CardDescription>Current employment status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-sm">Active</span>
                    </div>
                    <span className="text-sm font-medium">{stats.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm">Inactive</span>
                    </div>
                    <span className="text-sm font-medium">{stats.inactive}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Suspended</span>
                    </div>
                    <span className="text-sm font-medium">{stats.suspended}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common HR tasks and operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Record Attendance
                </Button>
                <Button variant="outline" className="justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Approve Leave
                </Button>
                <Button variant="outline" className="justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Payroll
                </Button>
                <Button variant="outline" className="justify-start">
                  <Award className="h-4 w-4 mr-2" />
                  Performance Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Employees Directory</CardTitle>
              <CardDescription>View and manage all employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={filterEmploymentType} onValueChange={setFilterEmploymentType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Employment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full-Time</SelectItem>
                    <SelectItem value="part-time">Part-Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employees Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Employment Type</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No employees found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.employeeId}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={`/placeholder-32px.png?height=32&width=32`} />
                                <AvatarFallback>
                                  {employee.firstName.charAt(0)}
                                  {employee.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {employee.title} {employee.firstName} {employee.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {employee.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{employee.employeeId}</TableCell>
                          <TableCell>{getEmploymentTypeBadge(employee.employmentType)}</TableCell>
                          <TableCell>
                            {employee.department || (
                              <span className="text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "XAF",
                              maximumFractionDigits: 0,
                            }).format(employee.salary || 0)}
                          </TableCell>
                          <TableCell>{getStatusBadge(employee.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Mail className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Phone className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewEmployee(employee)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Employee
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Leave History
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Clock className="mr-2 h-4 w-4" />
                                  Attendance Records
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Payroll History
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Export Data
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Management Tab */}
        <TabsContent value="leave" className="space-y-4">
          <EmployeeLeaveManagement />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <EmployeeAttendanceTracking />
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Management</CardTitle>
              <CardDescription>Manage employee payroll and salary information</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Coming Soon:</strong> Payroll management features including salary
                  processing, deductions, allowances, and payslip generation will be available
                  soon.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Employee Details Dialog */}
      {selectedEmployee && (
        <EmployeeDetailsDialog
          open={showEmployeeDetails}
          employee={selectedEmployee}
          onClose={() => {
            setShowEmployeeDetails(false)
            setSelectedEmployee(null)
          }}
        />
      )}
    </div>
  )
}
