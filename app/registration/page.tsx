"use client"

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RegistrationManagement } from '@/components/admin/registration-management'
import { FeeStructureManagement } from '@/components/admin/fee-structure-management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClassManagementProvider } from '@/lib/class-management-context'
import { 
  GraduationCap, 
  Settings, 
  DollarSign, 
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  AlertCircle
} from 'lucide-react'

// Mock data for dashboard overview
const mockOverviewStats = {
  total_registrations: 156,
  total_revenue: 42500000,
  pending_payments: 23,
  overdue_payments: 8,
  paid_registrations: 125,
  partial_payments: 23,
  monthly_revenue: 8500000,
  collection_rate: 80.1,
  average_payment_time: 12,
  top_performing_class: 'Form 5A'
}

const mockRecentRegistrations = [
  {
    id: 'REG001',
    student_name: 'John Doe',
    class: 'Form 5A',
    amount: 265000,
    status: 'paid',
    date: '2024-09-15'
  },
  {
    id: 'REG002',
    student_name: 'Jane Smith',
    class: 'Form 4B',
    amount: 245000,
    status: 'partial',
    date: '2024-09-14'
  },
  {
    id: 'REG003',
    student_name: 'Mike Johnson',
    class: 'Form 3A',
    amount: 225000,
    status: 'pending',
    date: '2024-09-13'
  }
]

const mockUpcomingPayments = [
  {
    student_name: 'Sarah Wilson',
    class: 'Form 2B',
    amount: 197000,
    due_date: '2024-09-20',
    days_remaining: 5
  },
  {
    student_name: 'David Brown',
    class: 'Form 1A',
    amount: 170000,
    due_date: '2024-09-22',
    days_remaining: 7
  },
  {
    student_name: 'Emily Davis',
    class: 'Form 3B',
    amount: 225000,
    due_date: '2024-09-25',
    days_remaining: 10
  }
]

export default function RegistrationPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100'
      case 'partial':
        return 'text-yellow-600 bg-yellow-100'
      case 'pending':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getUrgencyColor = (daysRemaining: number) => {
    if (daysRemaining <= 3) return 'text-red-600 bg-red-100'
    if (daysRemaining <= 7) return 'text-orange-600 bg-orange-100'
    return 'text-green-600 bg-green-100'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registration Management</h1>
          <p className="text-muted-foreground">Manage student registrations, fees, and payments</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="fee-structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockOverviewStats.total_registrations}</div>
                <p className="text-xs text-muted-foreground">
                  {mockOverviewStats.paid_registrations} paid, {mockOverviewStats.partial_payments} partial
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockOverviewStats.total_revenue.toLocaleString()} XOF</div>
                <p className="text-xs text-muted-foreground">
                  {mockOverviewStats.monthly_revenue.toLocaleString()} XOF this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockOverviewStats.collection_rate}%</div>
                <p className="text-xs text-muted-foreground">
                  Payment completion rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockOverviewStats.pending_payments}</div>
                <p className="text-xs text-muted-foreground">
                  {mockOverviewStats.overdue_payments} overdue
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Registrations */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Registrations</CardTitle>
                <CardDescription>
                  Latest student registrations and their payment status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentRegistrations.map((registration) => (
                    <div key={registration.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{registration.student_name}</p>
                        <p className="text-xs text-muted-foreground">{registration.class} • {registration.id}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium">{registration.amount.toLocaleString()} XOF</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                          {registration.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Payments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Payments</CardTitle>
                <CardDescription>
                  Payments due in the next 14 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockUpcomingPayments.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{payment.student_name}</p>
                        <p className="text-xs text-muted-foreground">{payment.class}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium">{payment.amount.toLocaleString()} XOF</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(payment.days_remaining)}`}>
                            {payment.days_remaining} days
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts for registration management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New Registration</p>
                    <p className="text-xs text-muted-foreground">Register a new student</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Record Payment</p>
                    <p className="text-xs text-muted-foreground">Process a payment</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fee Structure</p>
                    <p className="text-xs text-muted-foreground">Manage Reg. Fee, PTA & School Fees</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registrations Tab */}
        <TabsContent value="registrations">
          <ClassManagementProvider>
            <RegistrationManagement />
          </ClassManagementProvider>
        </TabsContent>

        {/* Fee Structures Tab */}
        <TabsContent value="fee-structures">
          <ClassManagementProvider>
            <FeeStructureManagement />
          </ClassManagementProvider>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Registration Reports</CardTitle>
              <CardDescription>
                Generate and view registration reports and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Registration Summary</p>
                      <p className="text-xs text-muted-foreground">Overview of all registrations</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Payment Report</p>
                      <p className="text-xs text-muted-foreground">Payment status and collection</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Overdue Report</p>
                      <p className="text-xs text-muted-foreground">Outstanding payments</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Revenue Analysis</p>
                      <p className="text-xs text-muted-foreground">Financial performance</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Monthly Report</p>
                      <p className="text-xs text-muted-foreground">Monthly registration trends</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Settings className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Fee Structure Report</p>
                      <p className="text-xs text-muted-foreground">Reg. Fee, PTA & School Fees analysis</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
