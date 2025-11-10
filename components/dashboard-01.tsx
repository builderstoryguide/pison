"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, CreditCard, DollarSign, Users, Package, UserCheck, BookOpen, Calendar, BarChart3, TrendingUp, TrendingDown } from "lucide-react"
import { useStudentManagement } from "@/lib/student-management-context"
import { useTeacherManagement } from "@/lib/teacher-management-context"
import { useClassManagement } from "@/lib/class-management-context"
import { useFinancial } from "@/lib/financial-context"
import { formatCurrency } from "@/lib/currency-utils"

export function Dashboard01() {
  // Get data from contexts
  const { students, isLoading: studentsLoading, error: studentsError } = useStudentManagement()
  const { teachers, isLoading: teachersLoading, error: teachersError } = useTeacherManagement()
  const { classes, isLoading: classesLoading, error: classesError } = useClassManagement()
  const { payments, isLoading: paymentsLoading, error: paymentsError } = useFinancial()

  // Calculate metrics
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.status === 'active').length
  const totalTeachers = teachers.length
  const activeTeachers = teachers.filter(t => t.status === 'active').length
  const totalClasses = classes.filter(c => c.status === 'active').length
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amountPaid, 0)
  const monthlyRevenue = payments
    .filter(payment => {
      const paymentDate = new Date(payment.paymentDate)
      const now = new Date()
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, payment) => sum + payment.amountPaid, 0)

  // Check loading states
  const isDataLoading = studentsLoading || teachersLoading || classesLoading || paymentsLoading
  const hasErrors = studentsError || teachersError || classesError || paymentsError

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            {/* Add any action buttons here */}
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics" disabled>
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" disabled>
              Reports
            </TabsTrigger>
            <TabsTrigger value="notifications" disabled>
              Notifications
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Students
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {studentsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  ) : studentsError ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-destructive">Error loading data</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{totalStudents}</div>
                      <p className="text-xs text-muted-foreground">
                        {activeStudents} active students
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Teachers
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {teachersLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  ) : teachersError ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-destructive">Error loading data</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{totalTeachers}</div>
                      <p className="text-xs text-muted-foreground">
                        {activeTeachers} active teachers
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Classes
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {classesLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  ) : classesError ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-destructive">Error loading data</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{totalClasses}</div>
                      <p className="text-xs text-muted-foreground">
                        {classes.filter(c => c.status === 'active').reduce((sum, c) => sum + c.currentEnrollment, 0)} total students enrolled
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  ) : paymentsError ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-destructive">Error loading data</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(monthlyRevenue)} this month
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          School Statistics
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Current academic year performance
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {isDataLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        ) : hasErrors ? (
                          <span className="text-destructive">Error</span>
                        ) : (
                          <span className="text-green-600">Active</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Student Enrollment
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total enrolled students
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {studentsLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        ) : studentsError ? (
                          <span className="text-destructive">Error</span>
                        ) : (
                          `${totalStudents}`
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Teaching Staff
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Active teachers
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {teachersLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        ) : teachersError ? (
                          <span className="text-destructive">Error</span>
                        ) : (
                          `${totalTeachers}`
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Financial Status
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total revenue collected
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {paymentsLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        ) : paymentsError ? (
                          <span className="text-destructive">Error</span>
                        ) : (
                          formatCurrency(totalRevenue)
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest school activities and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          New Student Enrollment
                        </p>
                        <p className="text-sm text-muted-foreground">
                          John Doe enrolled in Form 5A
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Payment Received
                        </p>
                        <p className="text-sm text-muted-foreground">
                          School fees payment processed
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Exam Schedule
                        </p>
                        <p className="text-sm text-muted-foreground">
                          First term exams scheduled
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        <Calendar className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
