"use client"

import { useState, useEffect } from "react"
import {
  BookOpen,
  Users,
  GraduationCap,
  DollarSign,
  Calendar,
  MessageSquare,
  BarChart3,
  Settings,
  Search,
  Plus,
  FileText,
  UserCheck,
  TrendingUp,
  School,
  Languages,
  Building,
} from "lucide-react"
import { UserManagement } from "@/components/admin/user-management"
import { StudentEnrollmentForm } from "@/components/admin/student-enrollment-form"
import { EnrollmentSuccessDialog } from "@/components/admin/enrollment-success-dialog"
import { StudentManagement } from "@/components/admin/student-management"
import { TeacherManagement } from "@/components/admin/teacher-management"
import { TeacherEnrollmentForm } from "@/components/admin/teacher-enrollment-form"
import { TeacherEnrollmentSuccessDialog } from "@/components/admin/teacher-enrollment-success-dialog"
import { ClassManagement } from "@/components/admin/class-management"
import { ExaminationManagement } from "@/components/admin/examination-management"
import { FinancialManagement } from "@/components/admin/financial-management"
import { AttendanceManagement } from "@/components/admin/attendance-management"
import { ReportsAnalyticsManagement } from "@/components/admin/reports-analytics-management"
import { ProfileSettings } from "@/components/profile/profile-settings"
import { TeacherDashboard } from "@/components/teacher/teacher-dashboard"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import type { TeacherFormData } from "@/lib/teacher-management-context"

// Mock data for different user roles
const userRoles = {
  admin: "Administrator",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
  burser: "Burser",
}

const menuItems = {
  admin: [
    { title: "Dashboard", icon: BarChart3, url: "#", view: "dashboard" },
    { title: "User Management", icon: Users, url: "#", view: "user-management" },
    { title: "Student Management", icon: GraduationCap, url: "#", view: "student-management" },
    { title: "Teacher Management", icon: GraduationCap, url: "#", view: "teacher-management" },
    { title: "Class Management", icon: School, url: "#", view: "class-management" },
    { title: "Examination System", icon: FileText, url: "#", view: "examination-system" },
    { title: "Financial Management", icon: DollarSign, url: "#", view: "financial-management" },
    { title: "Attendance", icon: UserCheck, url: "#", view: "attendance" },
    { title: "Communication", icon: MessageSquare, url: "#" },
    { title: "Resources", icon: BookOpen, url: "#" },
    { title: "Reports & Analytics", icon: TrendingUp, url: "#", view: "reports-analytics" },
    { title: "Settings", icon: Settings, url: "#" },
  ],
  teacher: [
    { title: "Dashboard", icon: BarChart3, url: "#", view: "teacher-dashboard" },
    { title: "My Classes", icon: School, url: "#", view: "my-classes" },
    { title: "Mark Attendance", icon: UserCheck, url: "#", view: "mark-attendance" },
    { title: "Grade Management", icon: FileText, url: "#", view: "grade-management" },
    { title: "Examinations", icon: GraduationCap, url: "#", view: "examinations" },
    { title: "Messages", icon: MessageSquare, url: "#", view: "messages" },
    { title: "Resources", icon: BookOpen, url: "#", view: "resources" },
  ],
  student: [
    { title: "Dashboard", icon: BarChart3, url: "#", view: "dashboard" },
    { title: "My Grades", icon: FileText, url: "#", view: "my-grades" },
    { title: "Schedule", icon: Calendar, url: "#", view: "schedule" },
    { title: "Attendance", icon: UserCheck, url: "#", view: "attendance" },
    { title: "Messages", icon: MessageSquare, url: "#", view: "messages" },
    { title: "Resources", icon: BookOpen, url: "#", view: "resources" },
  ],
  parent: [
    { title: "Dashboard", icon: BarChart3, url: "#", view: "dashboard" },
    { title: "Child's Progress", icon: TrendingUp, url: "#", view: "child-progress" },
    { title: "Attendance", icon: UserCheck, url: "#", view: "attendance" },
    { title: "Financial Records", icon: DollarSign, url: "#", view: "financial-records" },
    { title: "Messages", icon: MessageSquare, url: "#", view: "messages" },
    { title: "School Calendar", icon: Calendar, url: "#", view: "school-calendar" },
  ],
  burser: [
    { title: "Dashboard", icon: BarChart3, url: "#", view: "dashboard" },
    { title: "Fee Management", icon: DollarSign, url: "#", view: "fee-management" },
    { title: "Payment Tracking", icon: FileText, url: "#", view: "payment-tracking" },
    { title: "Financial Reports", icon: TrendingUp, url: "#", view: "financial-reports" },
    { title: "Outstanding Balances", icon: Users, url: "#", view: "outstanding-balances" },
    { title: "Messages", icon: MessageSquare, url: "#", view: "messages" },
  ],
}

function AppSidebar({
  currentRole,
  setCurrentView,
}: { currentRole: keyof typeof userRoles; setCurrentView: (view: string) => void }) {
  const items = menuItems[currentRole] || menuItems.admin

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <School className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">EduManage CM</span>
            <span className="text-xs text-muted-foreground">School Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild onClick={() => item.view && setCurrentView(item.view)}>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder.svg?height=24&width=24" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <span>John Doe</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-(--radix-popper-anchor-width)">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

interface DashboardProps {
  user: any
}

export function Dashboard({ user }: DashboardProps) {
  const { logout } = useAuth()
  const [currentRole, setCurrentRole] = useState<keyof typeof userRoles>(user?.role || "admin")
  const [currentView, setCurrentView] = useState<
    | "dashboard"
    | "teacher-dashboard"
    | "user-management"
    | "student-management"
    | "teacher-management"
    | "class-management"
    | "examination-system"
    | "financial-management"
    | "attendance"
    | "reports-analytics"
    | "profile-settings"
  >(user?.role === "teacher" ? "teacher-dashboard" : "dashboard")
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)
  const [enrollmentSuccess, setEnrollmentSuccess] = useState<{ studentId: string; parentCode: string } | null>(null)
  const [showTeacherEnrollmentForm, setShowTeacherEnrollmentForm] = useState(false)
  const [teacherEnrollmentSuccess, setTeacherEnrollmentSuccess] = useState<{
    teacherId: string
    teacherName: string
    email: string
    phone: string
    subsystem: string
    subjects: string[]
    classes: string[]
  } | null>(null)

  // Update the currentRole when user changes
  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role)
      // Set default view based on role
      if (user.role === "teacher") {
        setCurrentView("teacher-dashboard")
      } else {
        setCurrentView("dashboard")
      }
    }
  }, [user])

  const dashboardStats = {
    admin: [
      { title: "Total Students", value: "1,247", icon: Users, change: "+12%" },
      { title: "Active Teachers", value: "89", icon: GraduationCap, change: "+3%" },
      { title: "Total Revenue", value: "₦2.4M", icon: DollarSign, change: "+18%" },
      { title: "Attendance Rate", value: "94.2%", icon: UserCheck, change: "+2.1%" },
    ],
    teacher: [
      { title: "My Classes", value: "6", icon: School, change: "" },
      { title: "Total Students", value: "180", icon: Users, change: "" },
      { title: "Avg. Attendance", value: "92%", icon: UserCheck, change: "+1.5%" },
      { title: "Pending Grades", value: "23", icon: FileText, change: "" },
    ],
    student: [
      { title: "Current GPA", value: "3.8", icon: TrendingUp, change: "+0.2" },
      { title: "Attendance", value: "96%", icon: UserCheck, change: "+2%" },
      { title: "Completed Assignments", value: "28/30", icon: FileText, change: "" },
      { title: "Upcoming Exams", value: "3", icon: GraduationCap, change: "" },
    ],
    parent: [
      { title: "Child's GPA", value: "3.6", icon: TrendingUp, change: "+0.1" },
      { title: "Attendance", value: "94%", icon: UserCheck, change: "-1%" },
      { title: "Outstanding Fees", value: "₦45,000", icon: DollarSign, change: "" },
      { title: "Unread Messages", value: "2", icon: MessageSquare, change: "" },
    ],
    burser: [
      { title: "Total Collections", value: "₦1.8M", icon: DollarSign, change: "+15%" },
      { title: "Outstanding Fees", value: "₦600K", icon: FileText, change: "-8%" },
      { title: "Payment Rate", value: "87%", icon: TrendingUp, change: "+5%" },
      { title: "Pending Approvals", value: "12", icon: Users, change: "" },
    ],
  }

  const recentActivities = {
    admin: [
      { action: "New student enrolled", details: "Marie Ngozi - Form 5 Science", time: "2 hours ago" },
      { action: "Teacher added", details: "Dr. Paul Biya - Mathematics", time: "4 hours ago" },
      { action: "Fee payment received", details: "₦75,000 from John Fru", time: "6 hours ago" },
      { action: "Exam results published", details: "Form 4 Mock Examinations", time: "1 day ago" },
    ],
    teacher: [
      { action: "Grades submitted", details: "Form 5A Mathematics Quiz", time: "1 hour ago" },
      { action: "Attendance marked", details: "Form 4B - 28/30 present", time: "3 hours ago" },
      { action: "Assignment created", details: "Calculus Problem Set #5", time: "5 hours ago" },
      { action: "Parent message", details: "Inquiry about student progress", time: "1 day ago" },
    ],
    student: [
      { action: "Grade received", details: "Chemistry Test - 85%", time: "2 hours ago" },
      { action: "Assignment submitted", details: "English Literature Essay", time: "1 day ago" },
      { action: "Assignment submitted", details: "English Literature Essay", time: "1 day ago" },
      { action: "Attendance marked", details: "Present - Physics Class", time: "1 day ago" },
      { action: "Message from teacher", details: "Feedback on recent project", time: "2 days ago" },
    ],
    parent: [
      { action: "Grade update", details: "Mathematics - 78%", time: "3 hours ago" },
      { action: "Fee payment due", details: "Second term fees - ₦45,000", time: "1 day ago" },
      { action: "Teacher message", details: "Parent-teacher meeting request", time: "2 days ago" },
      { action: "Attendance alert", details: "Absent from 2 classes this week", time: "3 days ago" },
    ],
    burser: [
      { action: "Payment received", details: "₦50,000 - Student ID: 2024001", time: "1 hour ago" },
      { action: "Fee reminder sent", details: "15 students - overdue payments", time: "4 hours ago" },
      { action: "Financial report generated", details: "Monthly collection summary", time: "1 day ago" },
      { action: "Payment plan approved", details: "3-month installment for student", time: "2 days ago" },
    ],
  }

  const quickActions = {
    admin: [
      { title: "Enroll New Student", icon: Plus, action: "enroll-student" },
      { title: "Add Teacher", icon: Users, action: "add-teacher" },
      { title: "Create Class", icon: School, action: "create-class" },
      { title: "Generate Report", icon: FileText, action: "generate-report" },
    ],
    teacher: [
      { title: "Mark Attendance", icon: UserCheck, action: "mark-attendance" },
      { title: "Enter Grades", icon: FileText, action: "enter-grades" },
      { title: "Create Assignment", icon: Plus, action: "create-assignment" },
      { title: "Send Message", icon: MessageSquare, action: "send-message" },
    ],
    student: [
      { title: "View Grades", icon: FileText, action: "view-grades" },
      { title: "Check Schedule", icon: Calendar, action: "check-schedule" },
      { title: "Submit Assignment", icon: Plus, action: "submit-assignment" },
      { title: "Message Teacher", icon: MessageSquare, action: "message-teacher" },
    ],
    parent: [
      { title: "View Progress", icon: TrendingUp, action: "view-progress" },
      { title: "Pay Fees", icon: DollarSign, action: "pay-fees" },
      { title: "Contact Teacher", icon: MessageSquare, action: "contact-teacher" },
      { title: "Check Attendance", icon: UserCheck, action: "check-attendance" },
    ],
    burser: [
      { title: "Record Payment", icon: Plus, action: "record-payment" },
      { title: "Send Fee Notice", icon: MessageSquare, action: "send-fee-notice" },
      { title: "Generate Invoice", icon: FileText, action: "generate-invoice" },
      { title: "View Reports", icon: BarChart3, action: "view-reports" },
    ],
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "enroll-student":
        setShowEnrollmentForm(true)
        break
      case "add-teacher":
        setShowTeacherEnrollmentForm(true)
        break
      case "mark-attendance":
        setCurrentView("teacher-dashboard")
        break
      default:
        console.log(`Action ${action} not implemented yet`)
    }
  }

  const handleTeacherEnrollmentSuccess = (result: { teacherId: string; teacherData: TeacherFormData }) => {
    setTeacherEnrollmentSuccess({
      teacherId: result.teacherId,
      teacherName:
        `${result.teacherData.title || ""} ${result.teacherData.firstName} ${result.teacherData.lastName}`.trim(),
      email: result.teacherData.email,
      phone: result.teacherData.phone,
      subsystem: result.teacherData.subsystem,
      subjects: result.teacherData.subjects || [],
      classes: result.teacherData.classes || [],
    })
    setShowTeacherEnrollmentForm(false)
  }

  return (
    <SidebarProvider>
      <AppSidebar currentRole={currentRole} setCurrentView={setCurrentView} />
      <main className="flex-1 overflow-auto">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">
                {currentView === "teacher-dashboard" ? "Teacher Dashboard" : "Dashboard"}
              </h1>
              <Badge variant="outline" className="flex items-center gap-1">
                <Languages className="h-3 w-3" />
                English Sub-system
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="w-64" />
            </div>
            <Select value={currentRole} onValueChange={(value) => setCurrentRole(value as keyof typeof userRoles)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(userRoles).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={user?.avatar || "/placeholder.svg?height=32&width=32"} />
                    <AvatarFallback>
                      {user?.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="text-sm font-medium">{user?.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCurrentView("profile-settings")}>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem>Change Password</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {currentView === "teacher-dashboard" ? (
          <div className="p-6">
            <TeacherDashboard />
          </div>
        ) : currentView === "dashboard" ? (
          // Dashboard content
          <div className="p-6 space-y-6">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0] || "User"}!</h2>
                <p className="text-muted-foreground">Here's what's happening at your school today.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="h-4 w-4" />
                Government Bilingual High School Yaoundé
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {dashboardStats[currentRole].map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    {stat.change && (
                      <p className="text-xs text-muted-foreground">
                        <span
                          className={
                            stat.change.startsWith("+")
                              ? "text-green-600"
                              : stat.change.startsWith("-")
                                ? "text-red-600"
                                : ""
                          }
                        >
                          {stat.change}
                        </span>{" "}
                        from last month
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Frequently used features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickActions[currentRole].map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      size="sm"
                      onClick={() => handleQuickAction(action.action)}
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.title}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest updates and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities[currentRole].map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.details}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Educational system configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="font-medium">Sub-systems</h4>
                    <div className="flex gap-2">
                      <Badge variant="default">English</Badge>
                      <Badge variant="secondary">French</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Branches</h4>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">Grammar</Badge>
                      <Badge variant="outline">Technical</Badge>
                      <Badge variant="outline">Commercial</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Examinations</h4>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">GCE</Badge>
                      <Badge variant="outline">BEPC</Badge>
                      <Badge variant="outline">Probatoire</Badge>
                      <Badge variant="outline">Baccalauréat</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : currentView === "user-management" ? (
          <div className="p-6">
            <UserManagement />
          </div>
        ) : currentView === "student-management" ? (
          <div className="p-6">
            <StudentManagement />
          </div>
        ) : currentView === "teacher-management" ? (
          <div className="p-6">
            <TeacherManagement />
          </div>
        ) : currentView === "class-management" ? (
          <div className="p-6">
            <ClassManagement />
          </div>
        ) : currentView === "examination-system" ? (
          <div className="p-6">
            <ExaminationManagement />
          </div>
        ) : currentView === "financial-management" ? (
          <div className="p-6">
            <FinancialManagement />
          </div>
        ) : currentView === "attendance" ? (
          <div className="p-6">
            <AttendanceManagement />
          </div>
        ) : currentView === "reports-analytics" ? (
          <div className="p-6">
            <ReportsAnalyticsManagement />
          </div>
        ) : currentView === "profile-settings" ? (
          <div className="p-6">
            <ProfileSettings />
          </div>
        ) : null}

        {/* Student Enrollment Form Dialog */}
        <Dialog open={showEnrollmentForm} onOpenChange={setShowEnrollmentForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <StudentEnrollmentForm
              onSuccess={(result) => {
                setShowEnrollmentForm(false)
                setEnrollmentSuccess(result)
              }}
              onCancel={() => setShowEnrollmentForm(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Teacher Enrollment Form Dialog */}
        <Dialog open={showTeacherEnrollmentForm} onOpenChange={setShowTeacherEnrollmentForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <TeacherEnrollmentForm
              onSuccess={handleTeacherEnrollmentSuccess}
              onCancel={() => setShowTeacherEnrollmentForm(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Student Enrollment Success Dialog */}
        <Dialog open={!!enrollmentSuccess} onOpenChange={() => setEnrollmentSuccess(null)}>
          <DialogContent className="max-w-2xl">
            {enrollmentSuccess && (
              <EnrollmentSuccessDialog
                studentId={enrollmentSuccess.studentId}
                parentCode={enrollmentSuccess.parentCode}
                studentName="New Student"
                onClose={() => setEnrollmentSuccess(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Teacher Enrollment Success Dialog */}
        {teacherEnrollmentSuccess && (
          <TeacherEnrollmentSuccessDialog
            teacherId={teacherEnrollmentSuccess.teacherId}
            teacherName={teacherEnrollmentSuccess.teacherName}
            email={teacherEnrollmentSuccess.email}
            phone={teacherEnrollmentSuccess.phone}
            subsystem={teacherEnrollmentSuccess.subsystem}
            subjects={teacherEnrollmentSuccess.subjects}
            classes={teacherEnrollmentSuccess.classes}
            onClose={() => setTeacherEnrollmentSuccess(null)}
            onViewTeacher={() => {
              setTeacherEnrollmentSuccess(null)
              // Navigate to teacher management or profile view
            }}
            onEnrollAnother={() => {
              setTeacherEnrollmentSuccess(null)
              setShowTeacherEnrollmentForm(true)
            }}
          />
        )}
      </main>
    </SidebarProvider>
  )
}
