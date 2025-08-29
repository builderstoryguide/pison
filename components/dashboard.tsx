"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthPage } from "./auth/auth-page"
import { UserManagementProvider } from "@/lib/user-management-context"
import { StudentEnrollmentProvider } from "@/lib/student-enrollment-context"
import { StudentManagementProvider } from "@/lib/student-management-context"
import { TeacherManagementProvider } from "@/lib/teacher-management-context"
import { ClassManagementProvider } from "@/lib/class-management-context"
import { ExaminationProvider } from "@/lib/examination-context"
import { FinancialProvider } from "@/lib/financial-context"
import { AttendanceProvider } from "@/lib/attendance-context"
import { ReportsAnalyticsProvider } from "@/lib/reports-analytics-context"
import { ProfileProvider } from "@/lib/profile-context"
import { TeacherAttendanceProvider } from "@/lib/teacher-attendance-context"
import { TeacherClassesProvider } from "@/lib/teacher-classes-context"
import { TeacherGradesProvider } from "@/lib/teacher-grades-context"
import { BursarProvider } from "@/lib/bursar-context"
import { TimetableProvider } from "@/lib/timetable-context"
import { useNotifications } from "@/lib/notification-context"
import { ThemeToggle } from "@/components/theme-toggle"

// Admin Components
import { UserManagement } from "./admin/user-management"
import { StudentManagement } from "./admin/student-management"
import { TeacherManagement } from "./admin/teacher-management"
import { ClassManagement } from "./admin/class-management"
import { ExaminationManagement } from "./admin/examination-management"
import { TimetableManagement } from "./admin/timetable-management"
import { FinancialManagement } from "./admin/financial-management"
import { AttendanceManagement } from "./admin/attendance-management"
import { ReportsAnalyticsManagement } from "./admin/reports-analytics-management"
import { ProfileSettings } from "./profile/profile-settings"
import { RecentActivities } from "./admin/recent-activities"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { AcademicPerformance } from "@/components/admin/academic-performance"
import { ReportTemplates } from "@/components/admin/report-templates"
import { GeneratedReports } from "@/components/admin/generated-reports"
import { ReportCards } from "@/components/admin/report-cards"

// Teacher Components
import { TeacherDashboard } from "./teacher/teacher-dashboard"
import { TeacherClassesView } from "./teacher/teacher-classes-view"
import { GradesManagement } from "./teacher/grades-management"

// Parent Components
import { ParentDashboard } from "./parent/parent-dashboard"
import { ParentCommunication } from "./parent/parent-communication"
import { ParentChildRecords } from "./parent/parent-child-records"

// Bursar Components
import { BursarDashboard } from "./bursar/bursar-dashboard"
import { FinancialReports } from "./bursar/financial-reports"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

// Icons
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  FileText,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Home,
  ChevronUp,
  UserPlus,
  School,
  ClipboardList,
  CreditCard,
  CalendarCheck,
  MessageSquare,
  Bell,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  CalendarDays,
  Download,
  ChevronDown,
} from "lucide-react"

type AdminView =
  | "dashboard"
  | "users"
  | "students"
  | "teachers"
  | "classes"
  | "timetable"
  | "examinations"
  | "financial"
  | "attendance"
  | "reports"
  | "profile"
  | "reports-analytics"
  | "reports-academic-performance"
  | "reports-templates"
  | "reports-generated"
  | "reports-cards"

type TeacherView = "dashboard" | "classes" | "attendance" | "grades" | "profile"

type ParentView = "dashboard" | "records" | "communication" | "profile"

type BursarView = "dashboard" | "financial" | "reports" | "profile"

// Mock notifications data
const mockNotifications = [
  {
    id: 1,
    title: "New Student Enrollment",
    message: "John Doe has been enrolled in Form 5A",
    type: "info" as const,
    time: "2 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "Payment Received",
    message: "School fees payment of XAF 150,000 received from Marie Ngozi",
    type: "success" as const,
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    title: "Attendance Alert",
    message: "Low attendance rate detected in Form 3B (78%)",
    type: "warning" as const,
    time: "3 hours ago",
    read: true,
  },
  {
    id: 4,
    title: "Exam Schedule Updated",
    message: "First term examination dates have been modified",
    type: "info" as const,
    time: "1 day ago",
    read: true,
  },
  {
    id: 5,
    title: "System Maintenance",
    message: "Scheduled maintenance completed successfully",
    type: "success" as const,
    time: "2 days ago",
    read: true,
  },
]

// Notification Component
function NotificationDropdown() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    notification.read
                      ? "bg-muted/50 hover:bg-muted"
                      : "bg-blue-50 hover:bg-blue-100 border border-blue-200"
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!notification.read ? "text-blue-900" : ""}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                    </div>
                    {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t">
          <Button variant="outline" className="w-full bg-transparent" size="sm">
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// User Profile Dropdown Component
function UserProfileDropdown({
  user,
  onProfileClick,
  onLogout,
}: {
  user: any
  onProfileClick: () => void
  onLogout: () => void
}) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="w-fit mt-1 capitalize">
              {user.role}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfileClick}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Enhanced Header Component
function DashboardHeader({
  user,
  onProfileClick,
  onLogout,
}: {
  user: any
  onProfileClick: () => void
  onLogout: () => void
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Badge variant="outline" className="capitalize">
          {user.role}
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-2 px-4">
        <ThemeToggle />
        <NotificationDropdown />
        <UserProfileDropdown user={user} onProfileClick={onProfileClick} onLogout={onLogout} />
      </div>
    </header>
  )
}

export function Dashboard() {
  const { user, logout } = useAuth()
  const [adminCurrentView, setAdminCurrentView] = useState<AdminView>("dashboard")
  const [teacherCurrentView, setTeacherCurrentView] = useState<TeacherView>("dashboard")
  const [parentCurrentView, setParentCurrentView] = useState<ParentView>("dashboard")
  const [bursarCurrentView, setBursarCurrentView] = useState<BursarView>("dashboard")
  const [reportsDropdownOpen, setReportsDropdownOpen] = useState(false)

  if (!user) {
    return <AuthPage />
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Parent Dashboard
  if (user.role === "parent") {
    const parentMenuItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "records", label: "Child's Records", icon: FileText },
      { id: "communication", label: "Communication", icon: MessageSquare },
    ]

    const renderParentContent = () => {
      switch (parentCurrentView) {
        case "records":
          return <ParentChildRecords />
        case "communication":
          return <ParentCommunication />
        case "profile":
          return <ProfileSettings />
        default:
          return <ParentDashboard onNavigate={setParentCurrentView} />
      }
    }

    return (
      <ProfileProvider>
        <SidebarProvider>
          <Sidebar variant="inset">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div className="flex items-center gap-2 px-2 py-1">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <School className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">GBHS Yaoundé</span>
                      <span className="truncate text-xs">Parent Portal</span>
                    </div>
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Parent Tools</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {parentMenuItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setParentCurrentView(item.id as ParentView)}
                          isActive={parentCurrentView === item.id}
                        >
                          <item.icon />
                          <span>{item.label}</span>
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
                      <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                      >
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">{user.name}</span>
                          <span className="truncate text-xs">{user.email}</span>
                        </div>
                        <ChevronUp className="ml-auto size-4" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                      side="bottom"
                      align="end"
                      sideOffset={4}
                    >
                      <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                          <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{user.name}</span>
                            <span className="truncate text-xs">{user.email}</span>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setParentCurrentView("profile")}>
                        <Settings />
                        Profile Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout}>
                        <LogOut />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <DashboardHeader user={user} onProfileClick={() => setParentCurrentView("profile")} onLogout={logout} />
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{renderParentContent()}</div>
          </SidebarInset>
        </SidebarProvider>
      </ProfileProvider>
    )
  }

  // Admin Dashboard
  if (user.role === "admin") {
    const adminMenuItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "users", label: "User Management", icon: Users },
      { id: "students", label: "Student Management", icon: GraduationCap },
      { id: "teachers", label: "Teacher Management", icon: UserCheck },
      { id: "classes", label: "Class Management", icon: BookOpen },
      { id: "timetable", label: "Timetable Management", icon: CalendarDays },
      { id: "examinations", label: "Examinations", icon: FileText },
      { id: "financial", label: "Financial Management", icon: DollarSign },
      { id: "attendance", label: "Attendance", icon: Calendar },
    ]

    const reportsSubItems = [
      { id: "reports-analytics", label: "Analytics", icon: BarChart3 },
      { id: "reports-academic-performance", label: "Academic Performance", icon: GraduationCap },
      { id: "reports-templates", label: "Report Templates", icon: FileText },
      { id: "reports-generated", label: "Generated Reports", icon: Download },
      { id: "reports-cards", label: "Report Cards", icon: ClipboardList },
    ]

    const renderAdminContent = () => {
      switch (adminCurrentView) {
        case "users":
          return <UserManagement />
        case "students":
          return <StudentManagement />
        case "teachers":
          return <TeacherManagement />
        case "classes":
          return <ClassManagement />
        case "timetable":
          return (
            <TimetableProvider>
              <TimetableManagement />
            </TimetableProvider>
          )
        case "examinations":
          return (
            <ExaminationProvider>
              <ExaminationManagement />
            </ExaminationProvider>
          )
        case "financial":
          return <FinancialManagement />
        case "attendance":
          return <AttendanceManagement />
        case "reports":
        case "reports-analytics":
          return <AnalyticsDashboard />
        case "reports-academic-performance":
          return <AcademicPerformance />
        case "reports-templates":
          return <ReportTemplates />
        case "reports-generated":
          return <GeneratedReports />
        case "reports-cards":
          return <ReportCards />
        case "profile":
          return <ProfileSettings />
        default:
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user.name}! Manage your school system from here.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,234</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">89</div>
                    <p className="text-xs text-muted-foreground">+5 new this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">45</div>
                    <p className="text-xs text-muted-foreground">Across all levels</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$45,231</div>
                    <p className="text-xs text-muted-foreground">+19% from last month</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RecentActivities />
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setAdminCurrentView("students")}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Enroll New Student
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setAdminCurrentView("teachers")}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Add New Teacher
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setAdminCurrentView("classes")}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Create New Class
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setAdminCurrentView("reports")}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Generate Reports
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
      }
    }

    return (
      <UserManagementProvider>
        <StudentEnrollmentProvider>
          <StudentManagementProvider>
            <TeacherManagementProvider>
              <ClassManagementProvider>
                <ExaminationProvider>
                  <FinancialProvider>
                    <AttendanceProvider>
                      <ReportsAnalyticsProvider>
                        <ProfileProvider>
                          <SidebarProvider>
                            <Sidebar variant="inset">
                              <SidebarHeader>
                                <SidebarMenu>
                                  <SidebarMenuItem>
                                    <div className="flex items-center gap-2 px-2 py-1">
                                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                        <School className="size-4" />
                                      </div>
                                      <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">GBHS Yaoundé</span>
                                        <span className="truncate text-xs">Admin Panel</span>
                                      </div>
                                    </div>
                                  </SidebarMenuItem>
                                </SidebarMenu>
                              </SidebarHeader>
                              <SidebarContent>
                                <SidebarGroup>
                                  <SidebarGroupLabel>Management</SidebarGroupLabel>
                                  <SidebarGroupContent>
                                    <SidebarMenu>
                                      {adminMenuItems.map((item) => (
                                        <SidebarMenuItem key={item.id}>
                                          <SidebarMenuButton
                                            onClick={() => setAdminCurrentView(item.id as AdminView)}
                                            isActive={adminCurrentView === item.id}
                                          >
                                            <item.icon />
                                            <span>{item.label}</span>
                                          </SidebarMenuButton>
                                        </SidebarMenuItem>
                                      ))}
                                      
                                      {/* Reports & Analytics Dropdown */}
                                      <SidebarMenuItem>
                                        <SidebarMenuButton
                                          onClick={() => setReportsDropdownOpen(!reportsDropdownOpen)}
                                          isActive={adminCurrentView.startsWith('reports')}
                                        >
                                          <BarChart3 />
                                          <span>Reports & Analytics</span>
                                          <ChevronDown className={`ml-auto size-4 transition-transform ${reportsDropdownOpen ? 'rotate-180' : ''}`} />
                                        </SidebarMenuButton>
                                        {reportsDropdownOpen && (
                                          <SidebarMenuSub>
                                            {reportsSubItems.map((item) => (
                                              <SidebarMenuSubItem key={item.id}>
                                                <SidebarMenuSubButton
                                                  onClick={() => setAdminCurrentView(item.id as AdminView)}
                                                  isActive={adminCurrentView === item.id}
                                                >
                                                  <item.icon />
                                                  <span>{item.label}</span>
                                                </SidebarMenuSubButton>
                                              </SidebarMenuSubItem>
                                            ))}
                                          </SidebarMenuSub>
                                        )}
                                      </SidebarMenuItem>
                                    </SidebarMenu>
                                  </SidebarGroupContent>
                                </SidebarGroup>
                              </SidebarContent>
                              <SidebarFooter>
                                <SidebarMenu>
                                  <SidebarMenuItem>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton
                                          size="lg"
                                          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                        >
                                          <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                            <AvatarFallback className="rounded-lg">
                                              {getInitials(user.name)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{user.name}</span>
                                            <span className="truncate text-xs">{user.email}</span>
                                          </div>
                                          <ChevronUp className="ml-auto size-4" />
                                        </SidebarMenuButton>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                        side="bottom"
                                        align="end"
                                        sideOffset={4}
                                      >
                                        <DropdownMenuLabel className="p-0 font-normal">
                                          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                            <Avatar className="h-8 w-8 rounded-lg">
                                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                              <AvatarFallback className="rounded-lg">
                                                {getInitials(user.name)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                              <span className="truncate font-semibold">{user.name}</span>
                                              <span className="truncate text-xs">{user.email}</span>
                                            </div>
                                          </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setAdminCurrentView("profile")}>
                                          <Settings />
                                          Profile Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={logout}>
                                          <LogOut />
                                          Log out
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </SidebarMenuItem>
                                </SidebarMenu>
                              </SidebarFooter>
                              <SidebarRail />
                            </Sidebar>
                            <SidebarInset>
                              <DashboardHeader
                                user={user}
                                onProfileClick={() => setAdminCurrentView("profile")}
                                onLogout={logout}
                              />
                              <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{renderAdminContent()}</div>
                            </SidebarInset>
                          </SidebarProvider>
                        </ProfileProvider>
                      </ReportsAnalyticsProvider>
                    </AttendanceProvider>
                  </FinancialProvider>
                </ExaminationProvider>
              </ClassManagementProvider>
            </TeacherManagementProvider>
          </StudentManagementProvider>
        </StudentEnrollmentProvider>
      </UserManagementProvider>
    )
  }

  // Teacher Dashboard
  if (user.role === "teacher") {
    const teacherMenuItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "classes", label: "My Classes", icon: BookOpen },
      { id: "attendance", label: "Attendance", icon: CalendarCheck },
      { id: "grades", label: "Grades", icon: ClipboardList },
    ]

    const renderTeacherContent = () => {
      switch (teacherCurrentView) {
        case "classes":
          return <TeacherClassesView />
        case "grades":
          return <GradesManagement />
        case "profile":
          return <ProfileSettings />
        default:
          return <TeacherDashboard onNavigate={setTeacherCurrentView} />
      }
    }

    return (
      <TeacherAttendanceProvider>
        <TeacherClassesProvider>
          <TeacherGradesProvider>
            <ProfileProvider>
              <SidebarProvider>
                <Sidebar variant="inset">
                  <SidebarHeader>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <div className="flex items-center gap-2 px-2 py-1">
                          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <School className="size-4" />
                          </div>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">GBHS Yaoundé</span>
                            <span className="truncate text-xs">Teacher Portal</span>
                          </div>
                        </div>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarHeader>
                  <SidebarContent>
                    <SidebarGroup>
                      <SidebarGroupLabel>Teaching</SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {teacherMenuItems.map((item) => (
                            <SidebarMenuItem key={item.id}>
                              <SidebarMenuButton
                                onClick={() => setTeacherCurrentView(item.id as TeacherView)}
                                isActive={teacherCurrentView === item.id}
                              >
                                <item.icon />
                                <span>{item.label}</span>
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
                            <SidebarMenuButton
                              size="lg"
                              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                              <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user.name}</span>
                                <span className="truncate text-xs">{user.email}</span>
                              </div>
                              <ChevronUp className="ml-auto size-4" />
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                            side="bottom"
                            align="end"
                            sideOffset={4}
                          >
                            <DropdownMenuLabel className="p-0 font-normal">
                              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                                  <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                  <span className="truncate font-semibold">{user.name}</span>
                                  <span className="truncate text-xs">{user.email}</span>
                                </div>
                              </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setTeacherCurrentView("profile")}>
                              <Settings />
                              Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}>
                              <LogOut />
                              Log out
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarFooter>
                  <SidebarRail />
                </Sidebar>
                <SidebarInset>
                  <DashboardHeader
                    user={user}
                    onProfileClick={() => setTeacherCurrentView("profile")}
                    onLogout={logout}
                  />
                  <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{renderTeacherContent()}</div>
                </SidebarInset>
              </SidebarProvider>
            </ProfileProvider>
          </TeacherGradesProvider>
        </TeacherClassesProvider>
      </TeacherAttendanceProvider>
    )
  }

  // Bursar Dashboard
  if (user.role === "bursar") {
    const bursarMenuItems = [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "financial", label: "Fee Management", icon: DollarSign },
      { id: "reports", label: "Financial Reports", icon: BarChart3 },
    ]

    const renderBursarContent = () => {
      switch (bursarCurrentView) {
        case "financial":
          return (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Fee Management</h1>
                <p className="text-muted-foreground">Comprehensive tuition fee and payment management</p>
              </div>
              <BursarDashboard />
            </div>
          )
        case "reports":
          return <FinancialReports onNavigate={setBursarCurrentView} />
        case "profile":
          return <ProfileSettings />
        default:
          return <BursarDashboard onNavigate={setBursarCurrentView} />
      }
    }

    return (
      <BursarProvider>
        <ProfileProvider>
          <SidebarProvider>
            <Sidebar variant="inset">
              <SidebarHeader>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <div className="flex items-center gap-2 px-2 py-1">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <School className="size-4" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">GBHS Yaoundé</span>
                        <span className="truncate text-xs">Bursar Portal</span>
                      </div>
                    </div>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Financial Management</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {bursarMenuItems.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            onClick={() => setBursarCurrentView(item.id as BursarView)}
                            isActive={bursarCurrentView === item.id}
                          >
                            <item.icon />
                            <span>{item.label}</span>
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
                        <SidebarMenuButton
                          size="lg"
                          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                          <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{user.name}</span>
                            <span className="truncate text-xs">{user.email}</span>
                          </div>
                          <ChevronUp className="ml-auto size-4" />
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side="bottom"
                        align="end"
                        sideOffset={4}
                      >
                        <DropdownMenuLabel className="p-0 font-normal">
                          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                            <Avatar className="h-8 w-8 rounded-lg">
                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                              <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                              <span className="truncate font-semibold">{user.name}</span>
                              <span className="truncate text-xs">{user.email}</span>
                            </div>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setBursarCurrentView("profile")}>
                          <Settings />
                          Profile Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout}>
                          <LogOut />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
              <SidebarRail />
            </Sidebar>
            <SidebarInset>
              <DashboardHeader user={user} onProfileClick={() => setBursarCurrentView("profile")} onLogout={logout} />
              <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{renderBursarContent()}</div>
            </SidebarInset>
          </SidebarProvider>
        </ProfileProvider>
      </BursarProvider>
    )
  }

  // Default fallback for other roles
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription>Your role ({user.role}) does not have access to this dashboard yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={logout} className="w-full justify-start bg-transparent">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
