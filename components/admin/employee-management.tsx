"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  Clock, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building,
  Award,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Minus,
  Calculator,
  PieChart,
  BarChart3,
  Settings,
  UserCheck,
  Briefcase,
  GraduationCap,
  CreditCard,
  Receipt,
  Target,
  Activity
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function EmployeeManagement() {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Mock data for demonstration
  const employees = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@school.edu",
      phone: "+1 (555) 123-4567",
      position: "Mathematics Teacher",
      department: "Academic",
      status: "active",
      hireDate: "2023-01-15",
      salary: 45000,
      avatar: "/avatars/john-smith.jpg",
      address: "123 Main St, City, State 12345",
      employeeId: "EMP001",
      manager: "Dr. Sarah Johnson",
      workHours: 40,
      overtime: 5,
      allowances: [
        { type: "Housing", amount: 5000 },
        { type: "Transport", amount: 2000 },
        { type: "Medical", amount: 1500 }
      ],
      deductions: [
        { type: "Tax", amount: 4500 },
        { type: "Insurance", amount: 800 },
        { type: "Pension", amount: 2250 }
      ]
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.johnson@school.edu",
      phone: "+1 (555) 234-5678",
      position: "Principal",
      department: "Administration",
      status: "active",
      hireDate: "2020-08-01",
      salary: 75000,
      avatar: "/avatars/sarah-johnson.jpg",
      address: "456 Oak Ave, City, State 12345",
      employeeId: "EMP002",
      manager: "Board of Directors",
      workHours: 45,
      overtime: 10,
      allowances: [
        { type: "Housing", amount: 8000 },
        { type: "Transport", amount: 3000 },
        { type: "Medical", amount: 2000 },
        { type: "Leadership", amount: 5000 }
      ],
      deductions: [
        { type: "Tax", amount: 7500 },
        { type: "Insurance", amount: 1200 },
        { type: "Pension", amount: 3750 }
      ]
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael.brown@school.edu",
      phone: "+1 (555) 345-6789",
      position: "IT Administrator",
      department: "IT",
      status: "active",
      hireDate: "2022-03-10",
      salary: 55000,
      avatar: "/avatars/michael-brown.jpg",
      address: "789 Pine St, City, State 12345",
      employeeId: "EMP003",
      manager: "Sarah Johnson",
      workHours: 40,
      overtime: 8,
      allowances: [
        { type: "Housing", amount: 6000 },
        { type: "Transport", amount: 2500 },
        { type: "Medical", amount: 1800 },
        { type: "Technical", amount: 2000 }
      ],
      deductions: [
        { type: "Tax", amount: 5500 },
        { type: "Insurance", amount: 900 },
        { type: "Pension", amount: 2750 }
      ]
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.davis@school.edu",
      phone: "+1 (555) 456-7890",
      position: "English Teacher",
      department: "Academic",
      status: "on-leave",
      hireDate: "2021-09-01",
      salary: 42000,
      avatar: "/avatars/emily-davis.jpg",
      address: "321 Elm St, City, State 12345",
      employeeId: "EMP004",
      manager: "Dr. Sarah Johnson",
      workHours: 40,
      overtime: 2,
      allowances: [
        { type: "Housing", amount: 4500 },
        { type: "Transport", amount: 1800 },
        { type: "Medical", amount: 1200 }
      ],
      deductions: [
        { type: "Tax", amount: 4200 },
        { type: "Insurance", amount: 750 },
        { type: "Pension", amount: 2100 }
      ]
    },
    {
      id: 5,
      name: "David Wilson",
      email: "david.wilson@school.edu",
      phone: "+1 (555) 567-8901",
      position: "Janitor",
      department: "Maintenance",
      status: "active",
      hireDate: "2023-06-01",
      salary: 28000,
      avatar: "/avatars/david-wilson.jpg",
      address: "654 Maple St, City, State 12345",
      employeeId: "EMP005",
      manager: "Michael Brown",
      workHours: 40,
      overtime: 0,
      allowances: [
        { type: "Housing", amount: 2000 },
        { type: "Transport", amount: 1000 },
        { type: "Medical", amount: 800 }
      ],
      deductions: [
        { type: "Tax", amount: 2800 },
        { type: "Insurance", amount: 500 },
        { type: "Pension", amount: 1400 }
      ]
    }
  ]

  const departments = [
    { id: "academic", name: "Academic", count: 25 },
    { id: "administration", name: "Administration", count: 8 },
    { id: "it", name: "IT", count: 3 },
    { id: "maintenance", name: "Maintenance", count: 5 },
    { id: "security", name: "Security", count: 4 },
    { id: "cafeteria", name: "Cafeteria", count: 6 }
  ]

  const payrollData = [
    {
      id: 1,
      employeeId: "EMP001",
      name: "John Smith",
      basicSalary: 45000,
      allowances: 8500,
      overtime: 1250,
      grossSalary: 54750,
      deductions: 7550,
      netSalary: 47200,
      status: "paid",
      payDate: "2024-01-15"
    },
    {
      id: 2,
      employeeId: "EMP002",
      name: "Sarah Johnson",
      basicSalary: 75000,
      allowances: 18000,
      overtime: 2500,
      grossSalary: 95500,
      deductions: 12450,
      netSalary: 83050,
      status: "paid",
      payDate: "2024-01-15"
    },
    {
      id: 3,
      employeeId: "EMP003",
      name: "Michael Brown",
      basicSalary: 55000,
      allowances: 12300,
      overtime: 2000,
      grossSalary: 69300,
      deductions: 9150,
      netSalary: 60150,
      status: "pending",
      payDate: "2024-01-15"
    }
  ]

  const timeTrackingData = [
    {
      id: 1,
      employeeId: "EMP001",
      name: "John Smith",
      date: "2024-01-15",
      clockIn: "08:00",
      clockOut: "17:00",
      breakTime: 60,
      totalHours: 8,
      overtime: 0,
      status: "present"
    },
    {
      id: 2,
      employeeId: "EMP002",
      name: "Sarah Johnson",
      date: "2024-01-15",
      clockIn: "07:30",
      clockOut: "18:30",
      breakTime: 60,
      totalHours: 10,
      overtime: 2,
      status: "present"
    },
    {
      id: 3,
      employeeId: "EMP003",
      name: "Michael Brown",
      date: "2024-01-15",
      clockIn: "09:00",
      clockOut: "18:00",
      breakTime: 60,
      totalHours: 8,
      overtime: 0,
      status: "late"
    }
  ]

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = filterDepartment === "all" || employee.department.toLowerCase() === filterDepartment
    const matchesStatus = filterStatus === "all" || employee.status === filterStatus
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "on-leave": return "secondary"
      case "terminated": return "destructive"
      case "inactive": return "outline"
      default: return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return CheckCircle
      case "on-leave": return Clock
      case "terminated": return X
      case "inactive": return AlertCircle
      default: return AlertCircle
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const calculateTotalAllowances = (allowances: any[]) => {
    return allowances.reduce((total, allowance) => total + allowance.amount, 0)
  }

  const calculateTotalDeductions = (deductions: any[]) => {
    return deductions.reduce((total, deduction) => total + deduction.amount, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground">
            Manage employees, payroll, allowances, deductions, and time tracking
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Enter the employee details to add them to the system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter email" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="Enter phone number" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input id="position" placeholder="Enter position" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary</Label>
                    <Input id="salary" type="number" placeholder="Enter salary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" placeholder="Enter address" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddEmployeeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddEmployeeOpen(false)}>
                  Add Employee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter(emp => emp.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((employees.filter(emp => emp.status === 'active').length / employees.length) * 100)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(employees.reduce((total, emp) => total + emp.salary, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              +5.2% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Hours/Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(employees.reduce((total, emp) => total + emp.workHours, 0) / employees.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              +2 hours from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Employee Overview</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Management</TabsTrigger>
          <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEmployees.map((employee) => {
              const StatusIcon = getStatusIcon(employee.status)
              return (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={employee.avatar} alt={employee.name} />
                          <AvatarFallback>
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{employee.name}</h3>
                          <p className="text-sm text-muted-foreground">{employee.position}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setSelectedEmployee(employee)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsEditEmployeeOpen(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Employee
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusColor(employee.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {employee.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ID: {employee.employeeId}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{employee.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{employee.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{employee.department}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Monthly Salary</span>
                          <span className="font-semibold">{formatCurrency(employee.salary)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Payroll Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage employee salaries, allowances, and deductions
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Payroll
              </Button>
              <Button>
                <DollarSign className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payroll Summary</CardTitle>
                  <CardDescription>
                    Current month payroll processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Basic Salary</TableHead>
                        <TableHead>Allowances</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Salary</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollData.map((payroll) => (
                        <TableRow key={payroll.id}>
                          <TableCell className="font-medium">{payroll.name}</TableCell>
                          <TableCell>{formatCurrency(payroll.basicSalary)}</TableCell>
                          <TableCell>{formatCurrency(payroll.allowances)}</TableCell>
                          <TableCell>{formatCurrency(payroll.deductions)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(payroll.netSalary)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={payroll.status === 'paid' ? 'default' : 'secondary'}>
                              {payroll.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payroll Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Gross Pay</span>
                    <span className="font-semibold">
                      {formatCurrency(payrollData.reduce((total, p) => total + p.grossSalary, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Deductions</span>
                    <span className="font-semibold">
                      {formatCurrency(payrollData.reduce((total, p) => total + p.deductions, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Net Pay</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(payrollData.reduce((total, p) => total + p.netSalary, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Paid</span>
                    <span className="font-semibold">
                      {payrollData.filter(p => p.status === 'paid').length} / {payrollData.length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Allowance
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Minus className="h-4 w-4 mr-2" />
                    Add Deduction
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Receipt className="h-4 w-4 mr-2" />
                    Generate Payslips
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Payroll
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="time-tracking" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Time Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor employee attendance and working hours
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
              <Button>
                <Clock className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Attendance</CardTitle>
                  <CardDescription>
                    Employee attendance for {new Date().toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead>Total Hours</TableHead>
                        <TableHead>Overtime</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeTrackingData.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.name}</TableCell>
                          <TableCell>{entry.clockIn}</TableCell>
                          <TableCell>{entry.clockOut}</TableCell>
                          <TableCell>{entry.totalHours}h</TableCell>
                          <TableCell>{entry.overtime}h</TableCell>
                          <TableCell>
                            <Badge variant={
                              entry.status === 'present' ? 'default' : 
                              entry.status === 'late' ? 'secondary' : 'destructive'
                            }>
                              {entry.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Present Today</span>
                    <span className="font-semibold">
                      {timeTrackingData.filter(t => t.status === 'present').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Late Arrivals</span>
                    <span className="font-semibold">
                      {timeTrackingData.filter(t => t.status === 'late').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Absent</span>
                    <span className="font-semibold">
                      {timeTrackingData.filter(t => t.status === 'absent').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Overtime</span>
                    <span className="font-semibold">
                      {timeTrackingData.reduce((total, t) => total + t.overtime, 0)}h
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Clock In/Out
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Attendance Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Time Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Reports & Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Generate comprehensive employee reports and analytics
              </p>
            </div>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
                <CardDescription>Employee distribution across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{dept.count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({Math.round((dept.count / employees.length) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Salary Distribution</CardTitle>
                <CardDescription>Salary ranges across the organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">$20k - $30k</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-1/4 h-full bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">1</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">$30k - $50k</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-3/4 h-full bg-blue-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">3</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">$50k - $80k</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-1/2 h-full bg-purple-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">1</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Monthly attendance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Attendance trends chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payroll Trends</CardTitle>
                <CardDescription>Monthly payroll expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Payroll trends chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
