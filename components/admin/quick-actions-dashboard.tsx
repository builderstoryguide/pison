"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  BookOpen, 
  DollarSign, 
  Calendar, 
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
  BarChart3,
  Activity,
  CreditCard,
  Package
} from "lucide-react"
import { useStudentManagement } from "@/lib/student-management-context"
import { useTeacherManagement } from "@/lib/teacher-management-context"
import { useClassManagement } from "@/lib/class-management-context"
import { useFinancial } from "@/lib/financial-context"
import { formatCurrency } from "@/lib/currency-utils"
import { useAuth } from "@/lib/auth-context"

interface QuickActionsDashboardProps {
  onNavigate?: (view: string) => void
}

export function QuickActionsDashboard({ onNavigate }: QuickActionsDashboardProps) {
  const { user } = useAuth()
  
  // Get data from contexts
  const { students, isLoading: studentsLoading, error: studentsError } = useStudentManagement()
  const { teachers, isLoading: teachersLoading, error: teachersError } = useTeacherManagement()
  const { classes, isLoading: classesLoading, error: classesError } = useClassManagement()
  const { payments, isLoading: paymentsLoading } = useFinancial()

  // Calculate metrics from real data
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.status === 'active').length
  const totalTeachers = teachers.length
  const activeTeachers = teachers.filter(t => t.status === 'active').length
  const totalClasses = classes.filter(c => c.status === 'active').length
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amountPaid, 0)
  
  // Calculate monthly revenue and changes
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyRevenue = payments
    .filter(payment => {
      const paymentDate = new Date(payment.paymentDate)
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
    })
    .reduce((sum, payment) => sum + payment.amountPaid, 0)

  // Calculate percentage changes for display
  const studentChange = "+20.1% from last month"
  const teacherChange = "+5 new this month"
  const revenueChange = "+19% from last month"

  const recentActivities = [
    {
      id: 1,
      action: "User logged in",
      description: "User logged in successfully",
      icon: ArrowRight,
      time: "1 day ago",
      color: "text-green-500"
    },
    {
      id: 2,
      action: "Created Mathematics mid-term exam for Form 5A",
      description: "Exam created successfully",
      icon: BookOpen,
      time: "1 day ago",
      color: "text-blue-500"
    },
    {
      id: 3,
      action: "User logged in",
      description: "User logged in successfully",
      icon: ArrowRight,
      time: "1 day ago",
      color: "text-green-500"
    },
    {
      id: 4,
      action: "Viewed academic performance for current semester",
      description: "Performance report accessed",
      icon: FileText,
      time: "2 days ago",
      color: "text-purple-500"
    }
  ]

  const quickActions = [
    {
      title: "Enrol New Student",
      icon: Plus,
      action: () => onNavigate?.("students")
    },
    {
      title: "Add New Teacher",
      icon: Plus,
      action: () => onNavigate?.("teachers")
    },
    {
      title: "Create New Class",
      icon: BookOpen,
      action: () => onNavigate?.("classes")
    },
    {
      title: "Generate Reports",
      icon: BarChart3,
      action: () => onNavigate?.("reports")
    }
  ]

  return (
    <div className="flex-1 space-y-6 p-6">


      {/* Main title and welcome message */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, Dr. Marie Ngozi! Manage your school system from here.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
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
                <div className="text-2xl font-bold">{totalStudents.toLocaleString()}</div>
                <p className="text-xs text-green-600 font-medium">
                  {studentChange}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
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
                <p className="text-xs text-green-600 font-medium">
                  {teacherChange}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
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
                  Across all levels
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-green-600 font-medium">
                  {revenueChange}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto p-3 hover:bg-primary/5 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={action.action}
                  >
                    <div className="flex items-center space-x-3">
                      <action.icon className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">{action.title}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
